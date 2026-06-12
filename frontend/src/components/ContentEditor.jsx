import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { renderMarkedText } from '../utils/renderMarks';
import { mediaUrl } from '../utils/mediaUrl';
import {
  Bold,
  Eye,
  EyeOff,
  Heading1,
  Heading2,
  Image,
  Italic,
  List,
  Minus,
  MoreHorizontal,
  Pipette,
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
  { type: 'part', label: 'Part', icon: MoreHorizontal },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'video', label: 'Video', icon: Video },
];

const HIGHLIGHT_COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#fed7aa'];
const TEXT_COLORS = ['#ffffff', '#000000', '#f87171', '#34d399', '#60a5fa', '#c084fc', '#fb923c'];

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
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
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
    const existingIdx = marks.findIndex((m) => m.start === start && m.end === end);

    if (existingIdx >= 0) {
      const existing = { ...marks[existingIdx] };
      // Toggle: if property already matches, remove it; otherwise set it
      Object.keys(style).forEach((key) => {
        if (key === 'bold' || key === 'italic' || key === 'underline') {
          if (existing[key]) {
            delete existing[key]; // untoggle
          } else {
            existing[key] = style[key]; // apply
          }
        } else {
          // for colors/backgrounds: if same value, remove (acts as clear); else set new
          if (existing[key] === style[key]) {
            delete existing[key];
            // if backgroundColor removed, also remove dark text override
            if (key === 'backgroundColor') delete existing.color;
          } else {
            existing[key] = style[key];
          }
        }
      });
      // If mark is now empty (no styles left), remove it entirely
      const hasStyles = ['bold', 'italic', 'underline', 'backgroundColor', 'color']
        .some((k) => existing[k] !== undefined && existing[k] !== null);
      if (hasStyles) marks[existingIdx] = existing;
      else marks.splice(existingIdx, 1);
    } else {
      marks.push({ start, end, ...style });
    }

    updateBlock(block.id, { marks });
  };

  /** Check if the current selection range has a specific mark active */
  const isMarkActive = (key, value) => {
    if (!selection) return false;
    const block = blocks.find((b) => b.id === selection.blockId);
    if (!block) return false;
    const { start, end } = selection;
    const m = block.marks?.find((m) => m.start === start && m.end === end);
    if (!m) return false;
    return value !== undefined ? m[key] === value : !!m[key];
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        {/* Toggle format bar button */}
        <button
          type="button"
          title={showFormatBar ? 'Hide format toolbar' : 'Show format toolbar'}
          onClick={() => setShowFormatBar((v) => !v)}
          className={`ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${showFormatBar
            ? 'border-brand-500/40 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20'
            : 'border-white/10 text-slate-500 hover:bg-white/5 hover:text-slate-300'
            }`}
        >
          {showFormatBar ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showFormatBar ? 'Hide Format' : 'Show Format'}
        </button>
      </div>

      {/*selection && */ showFormatBar && (
        <div className="glass mb-4 flex flex-wrap items-center gap-2 rounded-xl p-3">
          <span className="text-xs text-slate-400 mr-2">Format selection:</span>

          {/* Bold / Italic / Underline toggles */}
          <button
            type="button"
            onClick={() => applyMark({ bold: true })}
            title={isMarkActive('bold') ? 'Remove bold' : 'Bold'}
            className={`rounded p-1.5 transition-all ${isMarkActive('bold') ? 'bg-brand-500/30 text-brand-200' : 'hover:bg-white/10'
              }`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyMark({ italic: true })}
            title={isMarkActive('italic') ? 'Remove italic' : 'Italic'}
            className={`rounded p-1.5 transition-all ${isMarkActive('italic') ? 'bg-brand-500/30 text-brand-200' : 'hover:bg-white/10'
              }`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyMark({ underline: true })}
            title={isMarkActive('underline') ? 'Remove underline' : 'Underline'}
            className={`rounded p-1.5 transition-all ${isMarkActive('underline') ? 'bg-brand-500/30 text-brand-200' : 'hover:bg-white/10'
              }`}
          >
            <Underline className="h-4 w-4" />
          </button>

          <span className="h-4 w-px bg-white/10 mx-1" />

          {/* Highlight color swatches */}
          <span className="text-[10px] text-slate-500">BG:</span>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c} type="button"
              title="Highlight color"
              onClick={() => applyMark({ backgroundColor: c, color: '#0f172a' })}
              className={`h-5 w-5 rounded border-2 transition-transform hover:scale-110 ${isMarkActive('backgroundColor', c) ? 'border-white scale-110' : 'border-white/20'
                }`}
              style={{ backgroundColor: c }}
            />
          ))}
          {/* Custom highlight color picker */}
          <div className="relative">
            <button
              type="button"
              title="Custom highlight color"
              onClick={() => { setShowHighlightPicker((v) => !v); setShowTextColorPicker(false); }}
              className="flex items-center justify-center h-5 w-5 rounded border border-dashed border-white/30 text-slate-400 hover:border-white/60 hover:text-white transition-all"
            >
              <Pipette className="h-3 w-3" />
            </button>
            {showHighlightPicker && (
              <div className="absolute top-7 left-0 z-30 rounded-lg border border-white/10 bg-slate-900 p-2 shadow-xl">
                <p className="text-[10px] text-slate-400 mb-1">Custom BG color</p>
                <input
                  type="color"
                  defaultValue="#fef08a"
                  className="h-8 w-24 cursor-pointer rounded border-none bg-transparent"
                  onChange={(e) => applyMark({ backgroundColor: e.target.value, color: '#0f172a' })}
                />
                <button
                  type="button"
                  onClick={() => setShowHighlightPicker(false)}
                  className="mt-1 block w-full text-center text-[10px] text-slate-500 hover:text-white"
                >Done</button>
              </div>
            )}
          </div>

          <span className="h-4 w-px bg-white/10 mx-1" />

          {/* Text color swatches */}
          <span className="text-[10px] text-slate-500">Color:</span>
          {TEXT_COLORS.map((c) => (
            <button
              key={c} type="button"
              title="Text color"
              onClick={() => applyMark({ color: c })}
              className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${isMarkActive('color', c) ? 'border-white scale-110' : 'border-white/20'
                }`}
              style={{ backgroundColor: c }}
            />
          ))}
          {/* Custom text color picker */}
          <div className="relative">
            <button
              type="button"
              title="Custom text color"
              onClick={() => { setShowTextColorPicker((v) => !v); setShowHighlightPicker(false); }}
              className="flex items-center justify-center h-5 w-5 rounded-full border border-dashed border-white/30 text-slate-400 hover:border-white/60 hover:text-white transition-all"
            >
              <Pipette className="h-3 w-3" />
            </button>
            {showTextColorPicker && (
              <div className="absolute top-7 left-0 z-30 rounded-lg border border-white/10 bg-slate-900 p-2 shadow-xl">
                <p className="text-[10px] text-slate-400 mb-1">Custom text color</p>
                <input
                  type="color"
                  defaultValue="#ffffff"
                  className="h-8 w-24 cursor-pointer rounded border-none bg-transparent"
                  onChange={(e) => applyMark({ color: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowTextColorPicker(false)}
                  className="mt-1 block w-full text-center text-[10px] text-slate-500 hover:text-white"
                >Done</button>
              </div>
            )}
          </div>

          {/* Clear all formatting on selection */}
          <button
            type="button"
            title="Clear all formatting"
            onClick={() => {
              const block = blocks.find((b) => b.id === selection.blockId);
              if (!block) return;
              const marks = (block.marks || []).filter(
                (m) => !(m.start === selection.start && m.end === selection.end)
              );
              updateBlock(block.id, { marks });
            }}
            className="ml-2 rounded px-2 py-1 text-[10px] text-slate-500 border border-white/10 hover:text-red-400 hover:border-red-400/30 transition-all"
          >
            Clear
          </button>
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
              <div className="relative">
                {/* Formatted render layer — what the user sees */}
                <div
                  aria-hidden="true"
                  className="min-h-[80px] w-full leading-relaxed whitespace-pre-wrap break-words text-slate-200 pointer-events-none text-sm"
                >
                  {block.text
                    ? renderMarkedText(block.text, block.marks)
                    : <span className="text-slate-500">Write your content…</span>
                  }
                  {/* keeps container height stable when empty */}
                  &#8203;
                </div>
                {/* Transparent textarea on top — captures input, cursor visible */}
                <textarea
                  value={block.text}
                  onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                  onSelect={(e) => handleTextSelect(block.id, e)}
                  spellCheck={false}
                  className="absolute inset-0 w-full h-full resize-none leading-relaxed outline-none text-sm bg-transparent"
                  style={{ color: 'transparent', caretColor: '#a5b4fc' }}
                />
              </div>
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
            {block.type === 'part' && <div className="py-2 text-center text-3xl font-bold tracking-[0.5em] text-slate-400">· · ·</div>}
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
