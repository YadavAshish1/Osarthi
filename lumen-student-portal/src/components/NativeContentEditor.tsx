"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { renderMarkedText, mediaUrl } from "@/lib/renderMarks";
import { toast } from "sonner";
import {
  Heading1,
  Heading2,
  Type,
  Quote,
  List,
  Minus,
  Image as ImageIcon,
  Video as VideoIcon,
  Bold,
  Italic,
  Underline,
  Pipette,
  Palette,
  Sparkles,
  Save,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  Clock,
  Heart,
  Share2,
  Bookmark,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
} from "lucide-react";

interface Block {
  id: string;
  type: string;
  text?: string;
  items?: string[];
  level?: number;
  url?: string;
  caption?: string;
  align?: "left" | "center" | "right";
  marks?: any[];
  pendingFile?: File;
  previewUrl?: string;
}

interface NativeContentEditorProps {
  topicId: string;
  contentId?: string;
  initialData?: {
    title?: string;
    blocks?: any[];
    published?: boolean;
  };
  onSaved?: (savedData: any) => void;
}

const BLOCK_TYPES = [
  { type: "heading", label: "Heading", icon: Heading1, level: 1 },
  { type: "heading", label: "Subheading", icon: Heading2, level: 2 },
  { type: "paragraph", label: "Paragraph", icon: Type },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "list", label: "Bullet List", icon: List },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "video", label: "Video", icon: VideoIcon },
];

const TEXT_COLORS = ["#DC2626", "#2563EB", "#059669", "#7C3AED", "#D97706", "#A84C32", "#1A1A1A", "#5C5A55"];
const HIGHLIGHT_COLORS = ["#FEF08A", "#BBF7D0", "#BFDBFE", "#FBCFE8", "#FED7AA", "#DDD6FE", "#FECDD3"];

const uid = () => Math.random().toString(36).substring(2, 9);

function newBlock(type: string, extra: any = {}): Block {
  return {
    id: uid(),
    type,
    text: "",
    items: [],
    marks: [],
    level: 1,
    align: "left",
    ...extra,
  };
}

export default function NativeContentEditor({
  topicId,
  contentId,
  initialData,
  onSaved,
}: NativeContentEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(initialData?.title || "");
  const [blocks, setBlocks] = useState<Block[]>(
    initialData?.blocks?.length ? initialData.blocks : [newBlock("paragraph")]
  );
  const [published, setPublished] = useState(initialData?.published ?? false);

  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Entire Sticky Formatting Bar Visibility State (Hide/Unhide)
  const [showToolbar, setShowToolbar] = useState(true);
  const [colorTab, setColorTab] = useState<"highlight" | "text">("highlight");

  // AI Tools State
  const [aiSummary, setAiSummary] = useState("");
  const [recommendedAudience, setRecommendedAudience] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const activeMediaBlockId = useRef<string | null>(null);

  // Calculate live stats
  const allText = blocks
    .map((b) => b.text || (b.items ? b.items.join(" ") : ""))
    .filter(Boolean)
    .join(" ");
  const wordCount = allText.trim() ? allText.trim().split(/\s+/).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 180));

  // AI Insight Helper
  const handleGenerateAiTools = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const firstPara = blocks.find((b) => b.type === "paragraph" && Boolean(b.text?.trim()));
      const pText = firstPara?.text || "";
      const summaryText = pText ? (pText.length > 160 ? pText.slice(0, 160) + "…" : pText) : `Key educational insights on ${title || "this topic"}.`;
      setAiSummary(summaryText);
      setRecommendedAudience(wordCount > 300 ? "Class 11 & 12 Advanced Readers" : "Class 9 & 10 Core Students");
      setAiGenerating(false);
      toast.success("AI Summary & Audience Recommendations generated!");
    }, 600);
  };

  const addBlock = (type: string, level?: number) => {
    const b = newBlock(type, { level });
    setBlocks((prev) => [...prev, b]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const removeBlock = (id: string) => {
    if (blocks.length <= 1) {
      toast.error("Cannot delete the only remaining block");
      return;
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, direction: number) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(idx, 1);
    newBlocks.splice(nextIdx, 0, moved);
    setBlocks(newBlocks);
  };

  // Robust Text Formatting (Bold, Italic, Underline, Text Color, Highlight Background, Clear)
  const applyMark = (
    markType: "bold" | "italic" | "underline" | "color" | "highlight" | "clear",
    colorValue?: string
  ) => {
    let selectedText = "";
    let targetBlockId: string | null = null;
    let selStart = -1;
    let selEnd = -1;

    // 1. Check active focused input/textarea element
    const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    if (activeEl && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT")) {
      const bId = activeEl.getAttribute("data-block-id");
      if (bId) {
        targetBlockId = bId;
        selStart = activeEl.selectionStart || 0;
        selEnd = activeEl.selectionEnd || 0;
        if (selStart !== selEnd) {
          selectedText = activeEl.value.substring(selStart, selEnd);
        }
      }
    }

    // 2. Fallback to window.getSelection() if activeElement didn't yield selection
    if (!selectedText) {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        selectedText = selection.toString();
      }
    }

    if (!selectedText && markType !== "clear") {
      toast.info("Highlight text inside a block first, then click formatting");
      return;
    }

    setBlocks((prev) =>
      prev.map((b) => {
        // Clear all formatting on this block if clear requested
        if (markType === "clear" && (targetBlockId ? b.id === targetBlockId : b.text?.includes(selectedText))) {
          return { ...b, marks: [] };
        }

        // Targeted block by ID & textarea selection bounds
        if (targetBlockId && b.id === targetBlockId && selStart >= 0 && selEnd > selStart) {
          const marks = b.marks ? [...b.marks] : [];
          if (markType === "bold") marks.push({ start: selStart, end: selEnd, bold: true });
          if (markType === "italic") marks.push({ start: selStart, end: selEnd, italic: true });
          if (markType === "underline") marks.push({ start: selStart, end: selEnd, underline: true });
          if (markType === "color" && colorValue) {
            marks.push({ start: selStart, end: selEnd, color: colorValue });
          }
          if (markType === "highlight" && colorValue) {
            marks.push({ start: selStart, end: selEnd, backgroundColor: colorValue });
          }
          return { ...b, marks };
        }

        // Fallback matching by substring text search
        if (!targetBlockId && b.text && b.text.includes(selectedText)) {
          const start = b.text.indexOf(selectedText);
          const end = start + selectedText.length;
          const marks = b.marks ? [...b.marks] : [];

          if (markType === "bold") marks.push({ start, end, bold: true });
          if (markType === "italic") marks.push({ start, end, italic: true });
          if (markType === "underline") marks.push({ start, end, underline: true });
          if (markType === "color" && colorValue) {
            marks.push({ start, end, color: colorValue });
          }
          if (markType === "highlight" && colorValue) {
            marks.push({ start, end, backgroundColor: colorValue });
          }
          return { ...b, marks };
        }

        return b;
      })
    );

    if (markType === "clear") {
      toast.success("Cleared block formatting");
    } else {
      toast.success(`Applied ${markType} formatting!`);
    }
  };

  // Upload Media (Image/Video)
  const triggerMediaUpload = (blockId: string) => {
    activeMediaBlockId.current = blockId;
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeMediaBlockId.current) return;

    const blockId = activeMediaBlockId.current;
    const localUrl = URL.createObjectURL(file);
    updateBlock(blockId, { pendingFile: file, previewUrl: localUrl });

    // Reset input
    e.target.value = "";
  };

  // Save / Publish Insight to Backend
  const handleSave = async (publishStatus: boolean = published) => {
    if (!topicId) {
      toast.error("Please select a Class, Subject, and Topic before saving");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter an insight title");
      return;
    }

    setSaving(true);
    try {
      // 1. Process media uploads first
      const updatedBlocks = await Promise.all(
        blocks.map(async (block) => {
          if (block.pendingFile) {
            const formData = new FormData();
            formData.append("file", block.pendingFile);
            try {
              const { data } = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
              });
              return {
                id: block.id,
                type: block.type,
                url: data.url,
                align: block.align || "left",
                caption: block.caption || "",
              };
            } catch {
              toast.error(`Failed to upload ${block.type}`);
              return block;
            }
          }
          return {
            id: block.id,
            type: block.type,
            level: block.level,
            text: block.text || "",
            items: block.items || [],
            url: block.url || "",
            align: block.align || "left",
            caption: block.caption || "",
            marks: block.marks || [],
          };
        })
      );

      const payload = {
        title: title.trim(),
        blocks: updatedBlocks,
        published: publishStatus,
      };

      let resultData;
      if (contentId) {
        const { data } = await api.put(`/content/${contentId}`, payload);
        resultData = data;
      } else {
        const { data } = await api.post(`/content/topic/${topicId}`, payload);
        resultData = data;
      }

      setPublished(publishStatus);
      toast.success(publishStatus ? "Insight Published Successfully! 🎉" : "Draft Saved!");
      if (onSaved) onSaved(resultData);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save insight");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-ui max-w-4xl mx-auto relative">
      {/* Hidden File Input for Media Uploads */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Editor Control Header */}
      <div className="p-5 md:p-6 rounded-3xl bg-[#FAF8F5] border border-[#E5E1D8] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="eyebrow text-[#A84C32] block mb-1 text-[11px] uppercase font-bold tracking-wider">
            Interactive Native Editor
          </span>
          <h2 className="font-serif-display text-xl sm:text-2xl md:text-3xl font-semibold text-[#1A1A1A] leading-tight">
            {contentId ? "Edit Academic Insight" : "Draft New Educational Insight"}
          </h2>
          <p className="text-xs text-[#5C5A55] mt-1 flex items-center gap-2 flex-wrap">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{estimatedReadTime} min read</span>
            <span>•</span>
            <span>{blocks.length} content blocks</span>
          </p>
        </div>

        {/* Responsive Mobile-Friendly Action Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-2 border-t border-[#E5E1D8]/60 sm:border-t-0 sm:pt-0">
          {/* Toggle Live Preview */}
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className={`px-3.5 py-2.5 rounded-full text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
              showPreview
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-white border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32]"
            }`}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-[#A84C32]" />}
            <span>{showPreview ? "Exit Live" : "Live View"}</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="px-3.5 py-2.5 rounded-full bg-white border border-[#E5E1D8] text-[#1A1A1A] text-xs font-semibold hover:border-[#A84C32] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Save className="h-4 w-4 text-[#5C5A55]" />
            <span>Save Draft</span>
          </button>

          {/* Publish Insight (Full-width on mobile grid, auto width on sm+) */}
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="col-span-2 sm:col-span-1 px-5 py-2.5 rounded-full bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
            <span>{published ? "Update Live" : "Publish Insight"}</span>
          </button>
        </div>
      </div>

      {!showPreview ? (
        /* Native Interactive Editing Workspace */
        <div className="space-y-6">
          {/* Title Field */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5A55] block mb-2">
              Insight Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a compelling title for your insight…"
              className="w-full text-2xl md:text-3xl font-serif-display font-semibold text-[#1A1A1A] focus:outline-none placeholder:text-[#5C5A55]/40"
            />
          </div>

          {/* Entire Floating Sticky Formatting Bar (Sticky below Site Header on Scroll + Hide/Unhide) */}
          <div className="sticky top-[72px] md:top-[88px] z-40 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#E5E1D8] shadow-lg transition-all duration-200">
            {showToolbar ? (
              <div className="space-y-3">
                {/* Main Formatting Controls Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[#5C5A55] font-semibold text-[11px] uppercase mr-1">Formatting:</span>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyMark("bold")}
                      className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:bg-white font-bold cursor-pointer shadow-2xs"
                      title="Bold Selected Text (B)"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyMark("italic")}
                      className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:bg-white italic cursor-pointer shadow-2xs"
                      title="Italic Selected Text (I)"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyMark("underline")}
                      className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:bg-white underline cursor-pointer shadow-2xs"
                      title="Underline Selected Text (U)"
                    >
                      <Underline className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyMark("clear")}
                      className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-[#5C5A55] hover:text-red-600 hover:border-red-300 cursor-pointer shadow-2xs"
                      title="Clear Formatting"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>

                    <span className="text-[#E5E1D8] mx-1">|</span>

                    {/* Color Mode Switcher Tabs */}
                    <div className="flex items-center p-0.5 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8]">
                      <button
                        type="button"
                        onClick={() => setColorTab("highlight")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          colorTab === "highlight"
                            ? "bg-white text-[#A84C32] shadow-2xs font-bold"
                            : "text-[#5C5A55] hover:text-[#1A1A1A]"
                        }`}
                      >
                        <Pipette className="h-3.5 w-3.5" />
                        <span>Bg Highlight</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setColorTab("text")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                          colorTab === "text"
                            ? "bg-white text-[#A84C32] shadow-2xs font-bold"
                            : "text-[#5C5A55] hover:text-[#1A1A1A]"
                        }`}
                      >
                        <Palette className="h-3.5 w-3.5" />
                        <span>Text Color</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* AI Assistant Button */}
                    <button
                      type="button"
                      disabled={aiGenerating}
                      onClick={handleGenerateAiTools}
                      className="px-3 py-1.5 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {aiGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-300" />}
                      <span className="hidden sm:inline">AI Tools</span>
                    </button>

                    {/* Hide Toolbar Button */}
                    <button
                      type="button"
                      onClick={() => setShowToolbar(false)}
                      className="p-1.5 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5] text-[#5C5A55] hover:text-[#A84C32] hover:border-[#A84C32] transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Hide Formatting Bar"
                    >
                      <ChevronUp className="h-4 w-4" />
                      <span className="hidden sm:inline">Hide Bar</span>
                    </button>
                  </div>
                </div>

                {/* Color Selection Palette Row */}
                <div className="pt-2 border-t border-[#E5E1D8]/60 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-[#5C5A55] uppercase mr-1">
                    {colorTab === "highlight" ? "Highlight Background:" : "Text Font Color:"}
                  </span>
                  {(colorTab === "highlight" ? HIGHLIGHT_COLORS : TEXT_COLORS).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyMark(colorTab === "highlight" ? "highlight" : "color", c)}
                      className="w-6 h-6 rounded-full border border-black/15 cursor-pointer transition-transform hover:scale-125 shadow-2xs relative group"
                      style={{ backgroundColor: c }}
                      title={`Apply ${colorTab === "highlight" ? "background highlight" : "text color"} ${c}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Collapsed Mini Sticky Pill Bar */
              <div className="flex items-center justify-between text-xs font-ui">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#A84C32] font-semibold border border-[#E5E1D8] text-[11px]">
                    Sticky Format Bar Collapsed
                  </span>
                  <span className="text-[#5C5A55] text-xs hidden sm:inline">Select text & unhide bar to format</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowToolbar(true)}
                  className="px-3 py-1.5 rounded-full bg-[#1A1A1A] text-white font-semibold hover:bg-[#A84C32] transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Unhide Format Bar</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Output Panel */}
          {(aiSummary || recommendedAudience) && (
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2 font-ui">
              <div className="flex items-center gap-2 text-amber-900 font-semibold">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>AI Educator Insights:</span>
              </div>
              {aiSummary && (
                <p className="text-amber-950 font-serif-body">
                  <strong>Auto Summary:</strong> {aiSummary}
                </p>
              )}
              {recommendedAudience && (
                <p className="text-amber-900">
                  <strong>Recommended Target Readership:</strong> {recommendedAudience}
                </p>
              )}
            </div>
          )}

          {/* Add Block Selector Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5A55] block">
              + Insert Content Block:
            </span>
            <div className="flex items-center gap-2 flex-wrap text-xs font-ui">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={`${bt.type}-${bt.level || 0}`}
                  type="button"
                  onClick={() => addBlock(bt.type, bt.level)}
                  className="px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:bg-white transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <bt.icon className="h-4 w-4 text-[#A84C32]" />
                  <span>{bt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content Blocks List */}
          <div className="space-y-4">
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-3 relative group"
              >
                {/* Block Controls Header with Text Alignment */}
                <div className="flex items-center justify-between text-xs text-[#5C5A55] border-b border-[#E5E1D8]/60 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] uppercase font-semibold text-[#A84C32]">
                      #{idx + 1} {block.type} {block.level ? `(H${block.level})` : ""}
                    </span>

                    {/* Text Alignment Controls (Start / Center / End) */}
                    <div className="flex items-center gap-0.5 bg-[#FAF8F5] p-1 rounded-lg border border-[#E5E1D8]">
                      <button
                        type="button"
                        onClick={() => updateBlock(block.id, { align: "left" })}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          (block.align || "left") === "left"
                            ? "bg-white text-[#A84C32] shadow-2xs font-bold"
                            : "text-[#5C5A55] hover:text-[#1A1A1A]"
                        }`}
                        title="Align Left (Start)"
                      >
                        <AlignLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBlock(block.id, { align: "center" })}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          block.align === "center"
                            ? "bg-white text-[#A84C32] shadow-2xs font-bold"
                            : "text-[#5C5A55] hover:text-[#1A1A1A]"
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBlock(block.id, { align: "right" })}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          block.align === "right"
                            ? "bg-white text-[#A84C32] shadow-2xs font-bold"
                            : "text-[#5C5A55] hover:text-[#1A1A1A]"
                        }`}
                        title="Align Right (End)"
                      >
                        <AlignRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveBlock(block.id, -1)}
                      disabled={idx === 0}
                      className="p-1 rounded hover:bg-[#F5F2EB] text-[#5C5A55] disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(block.id, 1)}
                      disabled={idx === blocks.length - 1}
                      className="p-1 rounded hover:bg-[#F5F2EB] text-[#5C5A55] disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="p-1 rounded hover:bg-red-50 text-red-600 cursor-pointer ml-2"
                      title="Remove Block"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Block Content Editing Fields */}
                {block.type === "heading" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      data-block-id={block.id}
                      value={block.text || ""}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder={`Enter Heading ${block.level}…`}
                      style={{ textAlign: block.align || "left" }}
                      className={`w-full font-serif-display font-semibold text-[#1A1A1A] focus:outline-none border-b border-transparent focus:border-[#A84C32] ${
                        block.level === 1 ? "text-2xl" : "text-xl"
                      }`}
                    />
                    {/* Live Formatted Output Line in Edit Mode */}
                    {block.marks && block.marks.length > 0 && block.text && (
                      <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-sm font-serif-display" style={{ textAlign: block.align || "left" }}>
                        <span className="text-[10px] text-[#A84C32] font-mono block mb-1">Formatted Preview:</span>
                        {renderMarkedText(block.text, block.marks)}
                      </div>
                    )}
                  </div>
                )}

                {block.type === "paragraph" && (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      data-block-id={block.id}
                      value={block.text || ""}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder="Write paragraph content…"
                      style={{ textAlign: block.align || "left" }}
                      className="w-full font-serif-body text-[#1A1A1A] focus:outline-none resize-none leading-relaxed p-1"
                    />
                    {/* Live Formatted Output Line in Edit Mode */}
                    {block.marks && block.marks.length > 0 && block.text && (
                      <div className="p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-base font-serif-body leading-relaxed" style={{ textAlign: block.align || "left" }}>
                        <span className="text-[10px] text-[#A84C32] font-mono block mb-1">Formatted Preview:</span>
                        {renderMarkedText(block.text, block.marks)}
                      </div>
                    )}
                  </div>
                )}

                {block.type === "quote" && (
                  <div className="pl-4 border-l-2 border-[#A84C32] space-y-2">
                    <textarea
                      rows={2}
                      data-block-id={block.id}
                      value={block.text || ""}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder="Enter quote text…"
                      style={{ textAlign: block.align || "left" }}
                      className="w-full font-serif-display italic text-lg text-[#1A1A1A] focus:outline-none resize-none"
                    />
                    {/* Live Formatted Output Line in Edit Mode */}
                    {block.marks && block.marks.length > 0 && block.text && (
                      <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] font-serif-display italic text-base" style={{ textAlign: block.align || "left" }}>
                        <span className="text-[10px] text-[#A84C32] font-mono block mb-1">Formatted Preview:</span>
                        {renderMarkedText(block.text, block.marks)}
                      </div>
                    )}
                  </div>
                )}

                {block.type === "divider" && (
                  <hr className="border-[#E5E1D8] my-4" />
                )}

                {block.type === "list" && (
                  <div className="space-y-2">
                    {(block.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2">
                        <span className="text-[#A84C32] font-bold">•</span>
                        <input
                          type="text"
                          data-block-id={block.id}
                          value={item}
                          onChange={(e) => {
                            const newItems = [...(block.items || [])];
                            newItems[itemIdx] = e.target.value;
                            updateBlock(block.id, { items: newItems });
                          }}
                          placeholder="List item…"
                          style={{ textAlign: block.align || "left" }}
                          className="w-full p-2 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-serif-body"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(block.id, { items: [...(block.items || []), ""] })
                      }
                      className="text-xs text-[#A84C32] font-semibold hover:underline cursor-pointer"
                    >
                      + Add List Item
                    </button>
                  </div>
                )}

                {(block.type === "image" || block.type === "video") && (
                  <div className="space-y-3 pt-1">
                    {(block.previewUrl || block.url) ? (
                      <div className="relative rounded-xl overflow-hidden border border-[#E5E1D8] max-h-72">
                        {block.type === "image" ? (
                          <img src={block.previewUrl || mediaUrl(block.url || "")} alt="" className="w-full object-cover max-h-72" />
                        ) : (
                          <video src={block.previewUrl || mediaUrl(block.url || "")} controls className="w-full max-h-72" />
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => triggerMediaUpload(block.id)}
                        className="w-full py-6 rounded-xl border border-dashed border-[#A84C32]/40 bg-[#FBF4F2]/50 text-[#A84C32] text-xs font-semibold hover:bg-[#FBF4F2] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
                      >
                        <Upload className="h-5 w-5" />
                        <span>Upload {block.type === "image" ? "Image File" : "Video File"}</span>
                      </button>
                    )}
                    <input
                      type="text"
                      data-block-id={block.id}
                      value={block.caption || ""}
                      onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                      placeholder="Add image/video caption…"
                      style={{ textAlign: block.align || "left" }}
                      className="w-full p-2 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-serif-body"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Live Preview Pane — Exact Student Reading Experience */
        <article className="pb-24 bg-[#FAF8F5] rounded-3xl border border-[#E5E1D8] shadow-sm overflow-hidden" data-testid="live-student-preview">
          <div className="bg-[#A84C32] text-white text-xs font-semibold py-2.5 px-6 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> Live Student View Mode (Exact Student Reading Experience)
            </span>
            <span className="opacity-90 font-mono text-[11px]">STUDENT_READING_PREVIEW</span>
          </div>

          <div className="max-w-3xl mx-auto px-6 pt-8 md:pt-12">
            <div className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55]">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to insights
            </div>
          </div>

          <header className="max-w-3xl mx-auto px-6 pt-6 pb-8">
            <div className="eyebrow text-[#A84C32] mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <span>Academic Insight</span>
              <span className="text-[#E5E1D8]">•</span>
              <span>Student Reading Room</span>
            </div>

            <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl leading-[1.1] font-semibold text-[#1A1A1A]">
              {title || "Untitled Insight"}
            </h1>

            {/* Excerpt / First Paragraph summary */}
            {blocks.find((b) => b.type === "paragraph" && Boolean(b.text?.trim())) && (
              <p className="mt-5 font-serif-body italic text-xl text-[#5C5A55] leading-relaxed">
                {blocks.find((b) => b.type === "paragraph" && Boolean(b.text?.trim()))?.text}
              </p>
            )}

            {/* Author Header Card */}
            <div className="mt-8 pt-6 border-t border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "Teacher"}
                    className="w-12 h-12 rounded-full object-cover border border-[#E5E1D8]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-sm font-bold uppercase">
                    {user?.name?.[0] || "T"}
                  </div>
                )}
                <div>
                  <div className="font-ui text-sm font-semibold text-[#1A1A1A]">
                    {user?.name || "Verified Educator"}
                  </div>
                  <div className="font-ui text-xs text-[#5C5A55]">
                    Published on {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 font-ui text-xs text-[#5C5A55] bg-[#F5F2EB] px-3.5 py-1.5 rounded-full border border-[#E5E1D8]/60">
                  <Clock className="h-3.5 w-3.5 text-[#A84C32]" />
                  <span>{estimatedReadTime} min read</span>
                </div>

                <div className="flex items-center gap-1.5 font-ui text-xs text-[#5C5A55] bg-white border border-[#E5E1D8] px-3.5 py-1.5 rounded-full">
                  <Bookmark className="h-3.5 w-3.5 text-[#5C5A55]" />
                  <span>Save</span>
                </div>

                <div className="flex items-center gap-1.5 font-ui text-xs text-[#5C5A55] bg-white border border-[#E5E1D8] px-3.5 py-1.5 rounded-full">
                  <Share2 className="h-3.5 w-3.5 text-[#A84C32]" />
                  <span>Share</span>
                </div>
              </div>
            </div>
          </header>

          {/* Main Article Body Blocks */}
          <div className="max-w-3xl mx-auto px-6 font-serif-body text-lg md:text-xl leading-relaxed text-[#2A2A2A] space-y-6">
            {blocks.map((block) => (
              <div key={block.id} style={{ textAlign: block.align || "left" }}>
                {block.type === "heading" && (
                  <h2 className={`font-serif-display font-semibold text-[#1A1A1A] pt-6 pb-2 border-b border-[#E5E1D8]/60 ${
                    block.level === 1 ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
                  }`}>
                    {block.text}
                  </h2>
                )}
                {block.type === "paragraph" && (
                  <p className="leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                    {renderMarkedText(block.text || "", block.marks || [])}
                  </p>
                )}
                {block.type === "quote" && (
                  <blockquote className="border-l-4 border-[#A84C32] pl-4 italic text-[#5C5A55]">
                    {block.text}
                  </blockquote>
                )}
                {block.type === "list" && (
                  <ul className={`list-disc space-y-1 ${block.align === "center" ? "list-inside" : block.align === "right" ? "list-inside" : "pl-6"}`}>
                    {(block.items || []).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
                {block.type === "divider" && <hr className="border-[#E5E1D8] my-4" />}
                {block.type === "image" && (block.url || block.previewUrl) && (
                  <figure className="group/img my-4">
                    <div className="overflow-hidden rounded-xl">
                      <img
                        src={block.previewUrl || mediaUrl(block.url || "")}
                        alt={block.caption || ""}
                        className="max-h-96 w-full object-cover transition-transform duration-500 ease-out group-hover/img:scale-105"
                      />
                    </div>
                    {block.caption && (
                      <figcaption className="mt-2 text-sm text-[#5C5A55]" style={{ textAlign: block.align || "left" }}>
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                )}
                {block.type === "video" && (block.url || block.previewUrl) && (
                  <video src={block.previewUrl || mediaUrl(block.url || "")} controls className="w-full rounded-xl my-4" />
                )}
              </div>
            ))}

            {/* Bottom Appreciation CTA */}
            <div className="pt-10 pb-6 flex flex-wrap items-center justify-center gap-4 border-t border-[#E5E1D8]/60 mt-10">
              <div className="flex items-center gap-3 px-8 py-3.5 rounded-full font-ui text-sm font-semibold bg-[#A84C32] text-white shadow-xs">
                <Heart className="h-5 w-5 fill-white" />
                <span>Appreciate Insight (Preview)</span>
              </div>

              <div className="flex items-center gap-2.5 px-6 py-3.5 rounded-full font-ui text-sm font-semibold bg-white border border-[#E5E1D8] text-[#1A1A1A]">
                <Share2 className="h-5 w-5 text-[#A84C32]" />
                <span>Share Insight</span>
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
