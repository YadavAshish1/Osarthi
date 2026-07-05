import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { renderMarkedText } from '../utils/renderMarks';
import { mediaUrl } from '../utils/mediaUrl';
import {
  Bold,
  ChevronDown,
  ChevronUp,
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

function styleEquals(s1 = {}, s2 = {}) {
  const keys = new Set([...Object.keys(s1), ...Object.keys(s2)]);
  for (const key of keys) {
    if (s1[key] !== s2[key]) return false;
  }
  return true;
}

function normalizeMarks(marks = [], textLength = 0) {
  if (!marks?.length) return [];

  const boundaries = new Set([0, textLength]);
  marks.forEach((mark) => {
    if (mark.start == null || mark.end == null) return;
    boundaries.add(mark.start);
    boundaries.add(mark.end);
  });

  const sorted = Array.from(boundaries).sort((a, b) => a - b);
  const segments = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (start >= end) continue;

    const covering = marks.filter((mark) => mark.start <= start && mark.end >= end);
    if (!covering.length) continue;

    const style = {};
    covering.forEach((mark) => {
      Object.keys(mark).forEach((key) => {
        if (key === 'start' || key === 'end') return;
        if (mark[key] !== undefined) style[key] = mark[key];
      });
    });

    segments.push({ start, end, ...style });
  }

  const normalized = [];
  for (const seg of segments) {
    const prev = normalized[normalized.length - 1];
    const segStyle = { ...seg };
    delete segStyle.start;
    delete segStyle.end;

    if (prev && prev.end === seg.start) {
      const prevStyle = { ...prev };
      delete prevStyle.start;
      delete prevStyle.end;
      if (styleEquals(prevStyle, segStyle)) {
        prev.end = seg.end;
        continue;
      }
    }

    normalized.push(seg);
  }

  return normalized;
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
  const [toolbarSticky, setToolbarSticky] = useState(false);
  const fileRef = useRef();
  const blocksRef = useRef(blocks);
  const toolbarRef = useRef();
  const toolbarSentinelRef = useRef();

  blocksRef.current = blocks;

  // ── Sticky toolbar via IntersectionObserver ──────────────────────────────
  useEffect(() => {
    const sentinel = toolbarSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setToolbarSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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
    setBlocks((b) =>
      b.map((x) => {
        if (x.id !== id) return x;
        const text = patch.text != null ? patch.text : x.text;
        const marks = patch.marks ? normalizeMarks(patch.marks, text.length) : x.marks;
        return { ...x, ...patch, marks };
      })
    );
  };

  // ── Move block up / down ──────────────────────────────────────────────────
  const moveBlock = (id, direction) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const applyMark = (style) => {
    if (!selection || selection.blockId == null) return;
    const block = blocks.find((b) => b.id === selection.blockId);
    if (!block || block.type !== 'paragraph') return;
    const { start, end } = selection;
    if (start === end) return;

    let marks = [...(block.marks || [])];
    const styleKeys = Object.keys(style);
    const removeKeys = styleKeys.filter((key) => key === 'color' || key === 'backgroundColor');

    if (removeKeys.length) {
      const nextMarks = [];
      marks.forEach((mark) => {
        const noOverlap = mark.end <= start || mark.start >= end;
        if (noOverlap || !removeKeys.some((key) => mark[key] !== undefined)) {
          nextMarks.push(mark);
          return;
        }

        if (mark.start < start) {
          nextMarks.push({ ...mark, end: start });
        }

        if (mark.end > end) {
          nextMarks.push({ ...mark, start: end });
        }

        const overlap = {
          ...mark,
          start: Math.max(mark.start, start),
          end: Math.min(mark.end, end),
        };
        removeKeys.forEach((key) => delete overlap[key]);
        if (Object.keys(overlap).some((k) => k !== 'start' && k !== 'end')) {
          nextMarks.push(overlap);
        }
      });
      marks = nextMarks;
    }

    const existingIdx = marks.findIndex((m) => m.start === start && m.end === end);
    if (existingIdx >= 0) {
      const existing = { ...marks[existingIdx] };
      Object.keys(style).forEach((key) => {
        if (key === 'bold' || key === 'italic' || key === 'underline') {
          if (existing[key]) {
            delete existing[key];
          } else {
            existing[key] = style[key];
          }
        } else {
          if (existing[key] === style[key]) {
            delete existing[key];
          } else {
            existing[key] = style[key];
          }
        }
      });
      const hasStyles = ['bold', 'italic', 'underline', 'backgroundColor', 'color']
        .some((k) => existing[k] !== undefined && existing[k] !== null);
      if (hasStyles) marks[existingIdx] = existing;
      else marks.splice(existingIdx, 1);
    } else {
      marks.push({ start, end, ...style });
    }

    updateBlock(block.id, { marks });
  };

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
    if (start === end) {
      setSelection(null);
      return;
    }

    // Trim leading/trailing spaces from the selection so formatting
    // doesn't apply to pure whitespace. This prevents selecting
    // trailing spaces which then affect newly typed text.
    const block = blocksRef.current.find((b) => b.id === blockId);
    const text = (block?.text) || '';
    let s = start;
    let ePos = end;
    while (s < ePos && text[s] === ' ') s++;
    while (ePos > s && text[ePos - 1] === ' ') ePos--;

    if (s >= ePos) {
      // Selection contains only spaces — ignore
      setSelection(null);
      return;
    }

    setSelection({ blockId, start: s, end: ePos });
  };

  const handleBlockTextChange = (blockId, e) => {
    const newText = e.target.value;
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx === -1) return prev;
      const block = prev[idx];
      const oldText = block.text || '';
      if (oldText === newText) return prev;

      const oldLen = oldText.length;
      const newLen = newText.length;
      const minLen = Math.min(oldLen, newLen);

      let prefix = 0;
      while (prefix < minLen && oldText[prefix] === newText[prefix]) prefix++;

      let suffix = 0;
      while (
        suffix < minLen - prefix &&
        oldText[oldLen - 1 - suffix] === newText[newLen - 1 - suffix]
      ) suffix++;

      const removedCount = oldLen - prefix - suffix;
      const insertedCount = newLen - prefix - suffix;
      const delta = insertedCount - removedCount;

      const mapOld = (oldIdx) => {
        if (oldIdx < prefix) return oldIdx;
        if (oldIdx >= prefix + removedCount) return oldIdx + delta;
        return prefix; // oldIdx was inside deleted region -> collapse to insertion point
      };

      const oldMarks = block.marks || [];
      const newMarks = [];
      for (const m of oldMarks) {
        const ns = mapOld(m.start);
        const ne = mapOld(m.end);
        if (ne > ns) {
          const copy = { ...m, start: ns, end: ne };
          // remove any styling-only fields that no longer make sense
          newMarks.push(copy);
        }
      }

      const next = [...prev];
      next[idx] = { ...block, text: newText, marks: normalizeMarks(newMarks, newText.length) };

      // clear selection that referenced old indices
      setSelection((sel) => (sel && sel.blockId === blockId ? null : sel));

      return next;
    });
  };

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

  // ── Shared toolbar content (reused in both sticky + inline) ──────────────
  const ToolbarContent = () => (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {BLOCK_TYPES.map((bt) => (
          <button
            key={`${bt.type}-${bt.level || 0}`}
            type="button"
            onClick={() => addBlock(bt)}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors"
          >
            <bt.icon className="h-3.5 w-3.5" /> {bt.label}
          </button>
        ))}
        {/* Toggle format bar */}
        <button
          type="button"
          title={showFormatBar ? 'Hide format toolbar' : 'Show format toolbar'}
          onClick={() => setShowFormatBar((v) => !v)}
          className={`ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all ${
            showFormatBar
              ? 'border-brand-500/40 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20'
              : 'border-white/10 text-slate-500 hover:bg-white/5 hover:text-slate-300'
          }`}
        >
          {showFormatBar ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showFormatBar ? 'Hide Format' : 'Show Format'}
        </button>
      </div>

      {showFormatBar && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-white/5 p-3">
          <span className="text-xs text-slate-400 mr-2">Format selection:</span>

          <button
            type="button"
            onClick={() => applyMark({ bold: true })}
            title={isMarkActive('bold') ? 'Remove bold' : 'Bold'}
            className={`rounded p-1.5 transition-all ${isMarkActive('bold') ? 'bg-brand-500/30 text-brand-200' : 'hover:bg-white/10'}`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyMark({ italic: true })}
            title={isMarkActive('italic') ? 'Remove italic' : 'Italic'}
            className={`rounded p-1.5 transition-all ${isMarkActive('italic') ? 'bg-brand-500/30 text-brand-200' : 'hover:bg-white/10'}`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => applyMark({ underline: true })}
            title={isMarkActive('underline') ? 'Remove underline' : 'Underline'}
            className={`rounded p-1.5 transition-all ${isMarkActive('underline') ? 'bg-brand-500/30 text-brand-200' : 'hover:bg-white/10'}`}
          >
            <Underline className="h-4 w-4" />
          </button>

          <span className="h-4 w-px bg-white/10 mx-1" />

          <span className="text-[10px] text-slate-500">BG:</span>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title="Highlight color"
              onClick={() => applyMark({ backgroundColor: c, color: '#0f172a' })}
              className={`h-5 w-5 rounded border-2 transition-transform hover:scale-110 ${
                isMarkActive('backgroundColor', c) ? 'border-white scale-110' : 'border-white/20'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
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
              <div className="absolute top-7 left-0 z-50 rounded-lg border border-white/10 bg-slate-900 p-2 shadow-xl">
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

          <span className="text-[10px] text-slate-500">Color:</span>
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title="Text color"
              onClick={() => applyMark({ color: c })}
              className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
                isMarkActive('color', c) ? 'border-white scale-110' : 'border-white/20'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
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
              <div className="absolute top-7 left-0 z-50 rounded-lg border border-white/10 bg-slate-900 p-2 shadow-xl">
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

          <button
            type="button"
            title="Clear all formatting"
            onClick={() => {
              const block = blocks.find((b) => b.id === selection?.blockId);
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
    </>
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Title + save bar */}
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

      {/* ── Sentinel (invisible) — when this goes out of view, toolbar becomes sticky ── */}
      <div ref={toolbarSentinelRef} className="h-px w-full" />

      {/* ── Sticky toolbar (shown only when scrolled past sentinel) ── */}
      {toolbarSticky && (
        <div
          ref={toolbarRef}
          className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-slate-950/95 px-4 py-3 shadow-xl backdrop-blur-md"
        >
          <div className="mx-auto max-w-3xl">
            <ToolbarContent />
          </div>
        </div>
      )}

      {/* ── Inline toolbar (always rendered, hidden when sticky takes over) ── */}
      <div className={`mb-4 ${toolbarSticky ? 'invisible' : ''}`}>
        <ToolbarContent />
      </div>

      {/* ── Block list ── */}
      <div className="space-y-4">
        {blocks.map((block, idx) => (
          <div
            key={block.id}
            className="group relative rounded-xl border border-transparent p-2 hover:border-white/10 transition-colors"
          >
            {/* ── Move Up / Move Down buttons ── */}
            <div className="absolute left-[-36px] top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                title="Move up"
                disabled={idx === 0}
                onClick={() => moveBlock(block.id, -1)}
                className="flex items-center justify-center w-7 h-7 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Move down"
                disabled={idx === blocks.length - 1}
                onClick={() => moveBlock(block.id, 1)}
                className="flex items-center justify-center w-7 h-7 rounded-md bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ── Block index badge ── */}
            <span className="absolute left-[-56px] top-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center w-4 text-[10px] text-slate-600 select-none">
              {idx + 1}
            </span>

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
                <div
                  aria-hidden="true"
                  className="min-h-[80px] w-full leading-relaxed whitespace-pre-wrap break-words text-slate-200 pointer-events-none text-sm"
                >
                  {block.text
                    ? renderMarkedText(block.text, block.marks)
                    : <span className="text-slate-500">Write your content…</span>
                  }
                  &#8203;
                </div>
                <textarea
                  value={block.text}
                  onChange={(e) => handleBlockTextChange(block.id, e)}
                  onSelect={(e) => handleTextSelect(block.id, e)}
                  spellCheck={false}
                  className="absolute inset-0 w-full h-full resize-none leading-relaxed outline-none text-sm bg-transparent"
                  style={{ color: 'transparent', caretColor: '#a5b4fc' }}
                />
              </div>
            )}
            {block.type === 'quote' && (
              <blockquote className="border-l-4 border-brand-500 pl-4 italic">
                <textarea
                  value={block.text}
                  onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                  className="w-full bg-transparent outline-none"
                  placeholder="Quote"
                />
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
                <button
                  type="button"
                  className="text-sm text-brand-400"
                  onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] })}
                >
                  + Add item
                </button>
              </ul>
            )}
            {block.type === 'divider' && <hr className="border-white/20" />}
            {block.type === 'part' && (
              <div className="py-2 text-center text-3xl font-bold tracking-[0.5em] text-slate-400">· · ·</div>
            )}
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
                <input
                  value={block.caption || ''}
                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                  placeholder="Caption"
                  className="w-full rounded bg-slate-900 px-2 py-1 text-sm"
                />
              </div>
            )}

            {/* Remove block */}
            <button
              type="button"
              onClick={() => setBlocks((b) => b.filter((x) => x.id !== block.id))}
              className="absolute right-2 top-2 hidden text-xs text-red-400 group-hover:block"
            >
              Remove
            </button>
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
