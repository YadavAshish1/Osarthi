import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { renderMarkedText } from '../utils/renderMarks';
import { mediaUrl } from '../utils/mediaUrl';
import {
  Bold,
  Heading1,
  Heading2,
  Image,
  Italic,
  List,
  Minus,
  Quote,
  Save,
  Type,
  Underline,
  Upload,
  Video,
} from 'lucide-react';

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: Heading1, level: 1 },
  { type: 'heading', label: 'Subheading', icon: Heading2, level: 2 },
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'list', label: 'Bullet list', icon: List },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'video', label: 'Video', icon: Video },
];

const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa'];
const TEXT_COLORS = ['#ffffff', '#f87171', '#34d399', '#60a5fa', '#c084fc'];

const uid = () => crypto.randomUUID();

function newBlock(type, extra = {}) {
  return {
    id: uid(),
    type,
    text: '',
    items: [],
    marks: [],
    level: 1,
    ...extra,
  };
}

/** Strip editor-only fields before sending to API */
function blockForApi(block) {
  const { pendingFile, previewUrl, ...rest } = block;
  return rest;
}

export default function ContentEditor({ topicId, contentId = null, onSaved, onCancel }) {
  const [title, setTitle] = useState('Untitled');
  const [blocks, setBlocks] = useState([newBlock('paragraph')]);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [selection, setSelection] = useState(null);
  const fileRef = useRef();
  const blocksRef = useRef(blocks);

  blocksRef.current = blocks;

  useEffect(() => {
    if (!topicId) return;
    if (contentId) {
      api.get(`/content/${contentId}`).then((res) => {
        if (res.data) {
          setTitle(res.data.title);
          setBlocks(res.data.blocks?.length ? res.data.blocks : [newBlock('paragraph')]);
          setPublished(res.data.published);
        }
      });
    } else {
      setTitle('Untitled');
      setBlocks([newBlock('paragraph')]);
      setPublished(false);
      setSaveError('');
    }
  }, [topicId, contentId]);

  useEffect(() => {
    return () => {
      blocksRef.current.forEach((block) => {
        if (block.previewUrl) URL.revokeObjectURL(block.previewUrl);
      });
    };
  }, []);

  const addBlock = (bt) => {
    const extra = bt.type === 'heading' ? { level: bt.level } : bt.type === 'list' ? { items: [''] } : {};
    setBlocks((b) => [...b, newBlock(bt.type, extra)]);
  };

  const updateBlock = (id, patch) => {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const applyMark = (style) => {
    if (!selection || selection.blockId == null) return;
    const block = blocks.find((b) => b.id === selection.blockId);
    if (!block || block.type !== 'paragraph') return;
    const { start, end } = selection;
    if (start === end) return;

    const marks = [...(block.marks || [])];
    const existing = marks.findIndex((m) => m.start === start && m.end === end);
    const newMark = { start, end, ...style };
    if (existing >= 0) marks[existing] = { ...marks[existing], ...style };
    else marks.push(newMark);

    updateBlock(block.id, { marks });
  };

  const handleTextSelect = (blockId, e) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    if (start !== end) setSelection({ blockId, start, end });
  };

  /** Pick file locally — upload happens only on Save */
  const attachFile = (file, blockId) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block?.previewUrl) URL.revokeObjectURL(block.previewUrl);

    const previewUrl = URL.createObjectURL(file);
    updateBlock(blockId, {
      pendingFile: file,
      previewUrl,
      caption: block?.caption || file.name,
    });
  };

  const uploadPendingMedia = async (block) => {
    const form = new FormData();
    form.append('file', block.pendingFile);
    const res = await api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      ...blockForApi(block),
      url: res.data.url,
      caption: block.caption || res.data.filename || block.pendingFile.name,
    };
  };

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const prepared = await Promise.all(
        blocks.map(async (block) => {
          if ((block.type === 'image' || block.type === 'video') && block.pendingFile) {
            return uploadPendingMedia(block);
          }
          return blockForApi(block);
        })
      );

      blocks.forEach((block) => {
        if (block.previewUrl) URL.revokeObjectURL(block.previewUrl);
      });

      const payload = { title, blocks: prepared, published };
      const res = contentId
        ? await api.put(`/content/${contentId}`, payload)
        : await api.post(`/content/topic/${topicId}`, payload);

      setBlocks(res.data.blocks || prepared);
      onSaved?.(res.data);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Save failed. Media uploads when you save.');
    } finally {
      setSaving(false);
    }
  };

  const mediaPreviewSrc = (block) => {
    if (block.previewUrl) return block.previewUrl;
    return mediaUrl(block.url);
  };

  const hasPendingMedia = blocks.some((b) => b.pendingFile);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent text-3xl font-bold outline-none sm:w-auto"
          placeholder="Title"
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Published
          </label>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold hover:bg-brand-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving & uploading…' : contentId ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {hasPendingMedia && !saving && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Photos/videos will upload to cloud storage when you click Save.
        </p>
      )}

      {saveError && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {saveError}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {BLOCK_TYPES.map((bt) => (
          <button
            key={`${bt.type}-${bt.level || 0}`}
            type="button"
            onClick={() => addBlock(bt)}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
          >
            <bt.icon className="h-3.5 w-3.5" /> {bt.label}
          </button>
        ))}
      </div>

      {selection && (
        <div className="glass mb-4 flex flex-wrap items-center gap-2 rounded-xl p-3">
          <span className="text-xs text-slate-400 mr-2">Format selection:</span>
          <button type="button" onClick={() => applyMark({ bold: true })} className="rounded p-1.5 hover:bg-white/10"><Bold className="h-4 w-4" /></button>
          <button type="button" onClick={() => applyMark({ italic: true })} className="rounded p-1.5 hover:bg-white/10"><Italic className="h-4 w-4" /></button>
          <button type="button" onClick={() => applyMark({ underline: true })} className="rounded p-1.5 hover:bg-white/10"><Underline className="h-4 w-4" /></button>
          {HIGHLIGHT_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => applyMark({ backgroundColor: c, color: '#0f172a' })} className="h-6 w-6 rounded border border-white/20" style={{ backgroundColor: c }} />
          ))}
          {TEXT_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => applyMark({ color: c })} className="h-6 w-6 rounded-full border border-white/20" style={{ backgroundColor: c }} />
          ))}
        </div>
      )}

      <div className="space-y-6">
        {blocks.map((block) => (
          <div key={block.id} className="group relative rounded-xl border border-transparent p-2 hover:border-white/10">
            {block.type === 'heading' && (
              <input
                value={block.text}
                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                className={`w-full bg-transparent font-bold outline-none ${block.level === 1 ? 'text-2xl' : 'text-xl'}`}
                placeholder="Heading"
              />
            )}
            {block.type === 'paragraph' && (
              <>
                <textarea
                  value={block.text}
                  onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                  onSelect={(e) => handleTextSelect(block.id, e)}
                  className="w-full min-h-[80px] resize-y bg-transparent leading-relaxed outline-none"
                  placeholder="Write your content…"
                />
                <div className="mt-2 rounded-lg bg-slate-900/50 p-3 text-sm text-slate-400">
                  Preview: {renderMarkedText(block.text, block.marks)}
                </div>
              </>
            )}
            {block.type === 'quote' && (
              <blockquote className="border-l-4 border-brand-500 pl-4 italic">
                <textarea value={block.text} onChange={(e) => updateBlock(block.id, { text: e.target.value })} className="w-full bg-transparent outline-none" placeholder="Quote" />
              </blockquote>
            )}
            {block.type === 'list' && (
              <ul className="list-disc pl-6 space-y-1">
                {(block.items || ['']).map((item, i) => (
                  <li key={i}>
                    <input
                      value={item}
                      onChange={(e) => {
                        const items = [...block.items];
                        items[i] = e.target.value;
                        updateBlock(block.id, { items });
                      }}
                      className="w-full bg-transparent outline-none"
                    />
                  </li>
                ))}
                <button type="button" className="text-sm text-brand-400" onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] })}>+ Add item</button>
              </ul>
            )}
            {block.type === 'divider' && <hr className="border-white/20" />}
            {(block.type === 'image' || block.type === 'video') && (
              <div className="space-y-2">
                {block.previewUrl || block.url ? (
                  <>
                    {block.pendingFile && (
                      <span className="inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">
                        Not saved yet — uploads on Save
                      </span>
                    )}
                    {block.type === 'image' ? (
                      <img src={mediaPreviewSrc(block)} alt={block.caption} className="max-h-80 rounded-lg" />
                    ) : (
                      <video src={mediaPreviewSrc(block)} controls className="max-h-80 w-full rounded-lg" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        fileRef.current?.setAttribute('data-block', block.id);
                        fileRef.current?.click();
                      }}
                      className="text-sm text-brand-400 hover:underline"
                    >
                      Replace {block.type}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      fileRef.current?.setAttribute('data-block', block.id);
                      fileRef.current?.click();
                    }}
                    className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-8 w-full justify-center text-slate-400 hover:border-brand-500"
                  >
                    <Upload className="h-5 w-5" /> Select {block.type}
                  </button>
                )}
                <input value={block.caption || ''} onChange={(e) => updateBlock(block.id, { caption: e.target.value })} placeholder="Caption" className="w-full rounded bg-slate-900 px-2 py-1 text-sm" />
              </div>
            )}
            <button type="button" onClick={() => setBlocks((b) => b.filter((x) => x.id !== block.id))} className="absolute right-2 top-2 hidden text-xs text-red-400 group-hover:block">Remove</button>
          </div>
        ))}
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const blockId = fileRef.current?.getAttribute('data-block');
          if (file && blockId) attachFile(file, blockId);
          e.target.value = '';
        }}
      />
    </div>
  );
}
