"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  PenSquare,
  BookOpen,
  Eye,
  Heart,
  Bookmark,
  Award,
  Users,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  Globe,
  GlobeOff,
  RotateCcw,
  Trash,
  AlertTriangle,
  X,
  ShieldAlert,
} from "lucide-react";

interface ContentItem {
  _id: string;
  title: string;
  published: boolean;
  viewsCount: number;
  likesCount: number;
  bookmarksCount: number;
  className: string;
  subjectName: string;
  topicName: string;
  createdAt: string;
  updatedAt: string;
}

interface BinItem {
  _id: string;
  title: string;
  deletedAt: string;
  deletedUntil: string;
  daysLeft: number;
  className: string;
  subjectName: string;
  topicName: string;
  createdAt: string;
}

interface AnalyticsData {
  totalInsights: number;
  publishedCount: number;
  draftCount: number;
  totalReach: number;
  totalAppreciations: number;
  totalBookmarks: number;
  classReachMap: Record<string, number>;
  contents: ContentItem[];
}

export default function TeacherDashboardPage() {
  const { user, ready } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [binItems, setBinItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [binLoading, setBinLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "bin">("all");

  // Soft Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [confirmTitleInput, setConfirmTitleInput] = useState("");

  // Permanent Delete modal state
  const [permDeleteModalOpen, setPermDeleteModalOpen] = useState(false);
  const [itemToPermDelete, setItemToPermDelete] = useState<BinItem | null>(null);
  const [permConfirmTitleInput, setPermConfirmTitleInput] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/content/teacher/analytics");
      setAnalytics(data);
    } catch {
      toast.error("Failed to load real educator analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBin = useCallback(async () => {
    setBinLoading(true);
    try {
      const { data } = await api.get("/content/teacher/bin");
      setBinItems(data?.bin || []);
    } catch {
      toast.error("Failed to load recycle bin");
    } finally {
      setBinLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready || !user) return;
    fetchAnalytics();
    fetchBin();
  }, [user, ready, fetchAnalytics, fetchBin]);

  const refreshAll = () => {
    fetchAnalytics();
    fetchBin();
  };

  // Toggle Publish / Unpublish
  const handleTogglePublish = async (item: ContentItem) => {
    const nextStatus = !item.published;
    try {
      await api.patch(`/content/${item._id}/publish`, { published: nextStatus });
      toast.success(nextStatus ? `Published "${item.title}"` : `Unpublished "${item.title}" (moved to draft)`);
      refreshAll();
    } catch {
      toast.error("Failed to update publish status");
    }
  };

  // Open Soft Delete Modal
  const openDeleteModal = (item: ContentItem) => {
    setItemToDelete(item);
    setConfirmTitleInput("");
    setDeleteModalOpen(true);
  };

  // Soft Delete Execution
  const handleConfirmDeleteToBin = async () => {
    if (!itemToDelete) return;
    if (confirmTitleInput.trim().toLowerCase() !== itemToDelete.title.trim().toLowerCase()) {
      toast.error("Insight title does not match confirmation input");
      return;
    }

    setSubmitting(true);
    try {
      await api.delete(`/content/${itemToDelete._id}`);
      toast.success(`Moved "${itemToDelete.title}" to Recycle Bin (30 days retention)`);
      setDeleteModalOpen(false);
      setItemToDelete(null);
      setConfirmTitleInput("");
      refreshAll();
    } catch {
      toast.error("Failed to move to bin");
    } finally {
      setSubmitting(false);
    }
  };

  // Restore from Recycle Bin (Unbin)
  const handleRestore = async (item: BinItem) => {
    try {
      await api.post(`/content/${item._id}/restore`);
      toast.success(`Restored "${item.title}" from Recycle Bin!`);
      refreshAll();
    } catch {
      toast.error("Failed to restore insight");
    }
  };

  // Open Permanent Delete Modal
  const openPermDeleteModal = (item: BinItem) => {
    setItemToPermDelete(item);
    setPermConfirmTitleInput("");
    setPermDeleteModalOpen(true);
  };

  // Execute Permanent Delete
  const handleConfirmPermanentDelete = async () => {
    if (!itemToPermDelete) return;
    if (permConfirmTitleInput.trim().toLowerCase() !== itemToPermDelete.title.trim().toLowerCase()) {
      toast.error("Insight title does not match confirmation input");
      return;
    }

    setSubmitting(true);
    try {
      await api.delete(`/content/${itemToPermDelete._id}/permanent`);
      toast.success(`Permanently deleted "${itemToPermDelete.title}"`);
      setPermDeleteModalOpen(false);
      setItemToPermDelete(null);
      setPermConfirmTitleInput("");
      refreshAll();
    } catch {
      toast.error("Failed to permanently delete insight");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
        <Loader2 className="w-8 h-8 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">Loading Real Educator Analytics from Database…</p>
      </div>
    );
  }

  const contents = analytics?.contents || [];
  const filteredContents = contents.filter((c) => {
    if (filter === "published") return c.published;
    if (filter === "draft") return !c.published;
    return true;
  });

  const publishedCount = analytics?.publishedCount || 0;
  const draftCount = analytics?.draftCount || 0;
  const totalReach = analytics?.totalReach || 0;
  const totalAppreciations = analytics?.totalAppreciations || 0;
  const totalBookmarks = analytics?.totalBookmarks || 0;

  // Group teacher's insights dynamically by class — ONLY display classes where teacher has created insights
  const teacherClassesMap = new Map<string, { className: string; insightCount: number; reach: number }>();

  contents.forEach((item) => {
    const cName = item.className || "General";
    const existing = teacherClassesMap.get(cName) || { className: cName, insightCount: 0, reach: 0 };
    existing.insightCount += 1;
    existing.reach += (item.viewsCount || 0);
    teacherClassesMap.set(cName, existing);
  });

  const teacherClassList = Array.from(teacherClassesMap.values());
  const maxReach = Math.max(...teacherClassList.map((c) => c.reach), 1);

  const isTitleMatched = itemToDelete && confirmTitleInput.trim().toLowerCase() === itemToDelete.title.trim().toLowerCase();
  const isPermTitleMatched = itemToPermDelete && permConfirmTitleInput.trim().toLowerCase() === itemToPermDelete.title.trim().toLowerCase();

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-10 font-ui">
      {/* Top Banner Header */}
      <div className="p-8 md:p-10 rounded-3xl bg-[#FAF8F5] border border-[#E5E1D8] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-3 py-1 rounded-full border border-[#A84C32]/20 font-bold inline-flex items-center gap-1">
              <Award className="h-3.5 w-3.5" /> Approved Verified Educator
            </span>
          </div>
          <h1 className="font-serif-display text-3xl md:text-4xl font-semibold text-[#1A1A1A]">
            Educator Studio & Audience Analytics
          </h1>
          <p className="font-serif-body text-sm text-[#5C5A55] mt-1">
            Track student readership, engagement metrics, and saved academic insights in real time.
          </p>
        </div>

        <Link
          href="/teacher/write"
          className="lumen-button-primary py-3.5 px-6 text-xs font-semibold shadow-xs shrink-0 inline-flex items-center gap-2"
        >
          <PenSquare className="h-4 w-4" />
          <span>Write New Insight</span>
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center border border-[#A84C32]/10">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">Total Insights</p>
          <h3 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">{analytics?.totalInsights || 0}</h3>
          <p className="text-xs text-[#5C5A55]">{publishedCount} Live · {draftCount} Drafts</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Eye className="h-5 w-5" />
          </div>
          <p className="text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">Total Student Reach</p>
          <h3 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">{totalReach.toLocaleString()}</h3>
          <p className="text-xs text-[#5C5A55] font-medium">Verified Student Reads</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
            <Heart className="h-5 w-5" />
          </div>
          <p className="text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">Appreciations</p>
          <h3 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">{totalAppreciations.toLocaleString()}</h3>
          <p className="text-xs text-[#5C5A55] font-medium">Student Likes Received</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Bookmark className="h-5 w-5" />
          </div>
          <p className="text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">Student Bookmarks</p>
          <h3 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">{totalBookmarks.toLocaleString()}</h3>
          <p className="text-xs text-[#5C5A55] font-medium">Saved to Bookmarks</p>
        </div>
      </div>

      {/* Dynamic Audience Breakdown by Teacher's Created Classes */}
      <div className="p-8 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
          <div>
            <span className="eyebrow text-[#A84C32] block mb-1">Target Readership Breakdown</span>
            <h3 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">
              Audience Reach by Your Active Classes
            </h3>
          </div>
          <Users className="h-6 w-6 text-[#A84C32]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs font-ui">
          {teacherClassList.length === 0 ? (
            <div className="col-span-full py-8 text-center text-[#5C5A55] font-serif-body">
              No active insights created yet across any classes.
            </div>
          ) : (
            teacherClassList.map((cls, idx) => {
              const colorClasses = [
                "bg-[#A84C32]",
                "bg-blue-600",
                "bg-emerald-600",
                "bg-amber-600",
                "bg-purple-600",
              ];
              const barColor = colorClasses[idx % colorClasses.length];
              const percent = totalReach > 0 ? Math.round((cls.reach / maxReach) * 100) : 0;

              return (
                <div key={cls.className} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif-display text-base font-semibold text-[#1A1A1A] block">{cls.className}</span>
                    <span className="text-[10px] font-bold text-[#A84C32] bg-[#FBF4F2] px-2 py-0.5 rounded-full border border-[#A84C32]/20">
                      {cls.insightCount} {cls.insightCount === 1 ? "insight" : "insights"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xl font-serif-display font-semibold text-[#1A1A1A]">{cls.reach.toLocaleString()}</p>
                    <p className="text-[#5C5A55] text-[11px]">Students Reached</p>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E5E1D8] overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${percent || 100}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Content Management Table with Publish/Unpublish & 30-Day Recycle Bin */}
      <div className="p-8 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-4">
          <div>
            <span className="eyebrow text-[#A84C32] block mb-1">Content Management</span>
            <h3 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">
              Your Insights, Publishing & Recycle Bin
            </h3>
          </div>

          {/* Filter Tabs including Bin */}
          <div className="flex items-center gap-2 font-ui text-xs flex-wrap">
            {(["all", "published", "draft", "bin"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-full capitalize font-semibold transition-all cursor-pointer ${
                  filter === t
                    ? t === "bin"
                      ? "bg-rose-700 text-white shadow-2xs"
                      : "bg-[#1A1A1A] text-white shadow-2xs"
                    : "bg-[#FAF8F5] border border-[#E5E1D8] text-[#5C5A55] hover:text-[#1A1A1A]"
                }`}
              >
                {t === "all"
                  ? `All (${contents.length})`
                  : t === "published"
                  ? `Published (${publishedCount})`
                  : t === "draft"
                  ? `Drafts (${draftCount})`
                  : `Recycle Bin (${binItems.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* VIEW: RECYCLE BIN TAB */}
        {filter === "bin" ? (
          binLoading ? (
            <div className="py-12 text-center text-[#5C5A55]">Loading bin...</div>
          ) : binItems.length === 0 ? (
            <div className="py-16 text-center space-y-3 font-serif-body">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <Trash2 className="h-6 w-6" />
              </div>
              <h4 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">Recycle Bin is Empty</h4>
              <p className="text-sm text-[#5C5A55] max-w-sm mx-auto">
                Deleted insights stay in the Recycle Bin for 30 days before permanent deletion. You can restore (unbin) them anytime.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-ui text-sm">
                <thead>
                  <tr className="border-b border-[#E5E1D8] text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Deleted Insight</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Deleted Date</th>
                    <th className="pb-3">Retention Remaining</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]/60">
                  {binItems.map((item) => (
                    <tr key={item._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-4 pl-2 font-medium text-[#1A1A1A]">
                        <span className="font-serif-display text-base font-semibold">{item.title}</span>
                      </td>
                      <td className="py-4 text-xs text-[#5C5A55]">
                        {item.className} {item.subjectName && `• ${item.subjectName}`} {item.topicName && `• ${item.topicName}`}
                      </td>
                      <td className="py-4 text-xs text-[#5C5A55]">
                        {new Date(item.deletedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <Clock className="h-3.5 w-3.5" /> {item.daysLeft} days left
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(item)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore (Unbin)
                          </button>
                          <button
                            onClick={() => openPermDeleteModal(item)}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash className="h-3.5 w-3.5" /> Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* VIEW: ACTIVE INSIGHTS TAB (ALL, PUBLISHED, DRAFT) */
          filteredContents.length === 0 ? (
            <div className="py-16 text-center space-y-3 font-serif-body">
              <div className="w-12 h-12 rounded-full bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center mx-auto border border-[#A84C32]/20">
                <BookOpen className="h-6 w-6" />
              </div>
              <h4 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">No insights in this view</h4>
              <p className="text-sm text-[#5C5A55] max-w-sm mx-auto">
                Start sharing your subject expertise with students across Medhashine.
              </p>
              <Link
                href="/teacher/write"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-colors"
              >
                <PenSquare className="h-4 w-4" /> Write First Insight
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-ui text-sm">
                <thead>
                  <tr className="border-b border-[#E5E1D8] text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Insight Title</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Publish Control</th>
                    <th className="pb-3">Reach</th>
                    <th className="pb-3">Likes</th>
                    <th className="pb-3">Saves</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E1D8]/60">
                  {filteredContents.map((c) => (
                    <tr key={c._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-4 pl-2 font-medium text-[#1A1A1A]">
                        <div className="flex flex-col">
                          <span className="font-serif-display text-base font-semibold">{c.title}</span>
                          {(c.className || c.subjectName) && (
                            <span className="text-xs text-[#5C5A55] font-ui font-normal">
                              {c.className} {c.subjectName && `• ${c.subjectName}`} {c.topicName && `• ${c.topicName}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        {c.published ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="h-3.5 w-3.5" /> Draft
                          </span>
                        )}
                      </td>
                      {/* Publish / Unpublish Toggle Action */}
                      <td className="py-4">
                        <button
                          onClick={() => handleTogglePublish(c)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                            c.published
                              ? "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
                              : "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                          }`}
                          title={c.published ? "Unpublish to draft" : "Publish insight live"}
                        >
                          {c.published ? (
                            <>
                              <GlobeOff className="h-3.5 w-3.5" /> Unpublish
                            </>
                          ) : (
                            <>
                              <Globe className="h-3.5 w-3.5" /> Publish Live
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 font-semibold text-[#1A1A1A]">{(c.viewsCount || 0).toLocaleString()}</td>
                      <td className="py-4 font-semibold text-[#1A1A1A]">{(c.likesCount || 0).toLocaleString()}</td>
                      <td className="py-4 font-semibold text-[#1A1A1A]">{(c.bookmarksCount || 0).toLocaleString()}</td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/teacher/write/${c._id}`}
                            className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors"
                            title="Edit Insight"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          {/* Open custom Soft Delete confirmation modal */}
                          <button
                            onClick={() => openDeleteModal(c)}
                            className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                            title="Move to Recycle Bin"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ─── MODAL 1: SOFT DELETE CONFIRMATION (MOVE TO BIN) ──────────────────── */}
      {deleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-[#E5E1D8] shadow-2xl space-y-5 font-ui animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
              <h3 className="font-serif-display text-xl font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" /> Confirm Soft Delete
              </h3>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-[#5C5A55] hover:text-[#1A1A1A] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info Banner like Admin Governance */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
              <p className="font-semibold text-amber-950 flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4 text-amber-700 shrink-0" /> 30-Day Retention Notice
              </p>
              <p>
                Moving <strong>"{itemToDelete.title}"</strong> to the Recycle Bin will remove it from live student view immediately.
              </p>
              <p className="text-amber-800">
                It will be safely retained in your <strong>Recycle Bin for 30 days</strong>. You can restore (unbin) it anytime within 30 days.
              </p>
            </div>

            {/* Type title confirmation field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#1A1A1A]">
                To confirm deletion, type <span className="text-rose-700 font-extrabold select-all">{itemToDelete.title}</span> below:
              </label>
              <input
                type="text"
                value={confirmTitleInput}
                onChange={(e) => setConfirmTitleInput(e.target.value)}
                placeholder={`Type "${itemToDelete.title}"`}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-sm font-semibold focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 text-[#1A1A1A] placeholder:text-gray-400"
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-full border border-[#E5E1D8] text-[#5C5A55] text-xs font-semibold hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteToBin}
                disabled={submitting || !isTitleMatched}
                className="flex-1 py-3 px-4 rounded-full bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                {submitting ? "Moving to Bin..." : "Move to Recycle Bin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: PERMANENT DELETE CONFIRMATION (HIGH SECURITY) ──────────── */}
      {permDeleteModalOpen && itemToPermDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-rose-300 shadow-2xl space-y-5 font-ui animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-rose-200 pb-4">
              <h3 className="font-serif-display text-xl font-bold text-rose-700 flex items-center gap-2">
                <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" /> Permanent Erasure Warning
              </h3>
              <button
                onClick={() => setPermDeleteModalOpen(false)}
                className="text-[#5C5A55] hover:text-[#1A1A1A] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Critical Warning Banner */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
              <p className="font-bold text-rose-950 text-sm flex items-center gap-1.5 uppercase tracking-wider">
                ⚠️ Irreversible Permanent Deletion
              </p>
              <p>
                You are about to permanently delete <strong>"{itemToPermDelete.title}"</strong> from the database.
              </p>
              <p className="text-rose-800 font-semibold">
                This action CANNOT be undone. It cannot be recovered or restored from the Recycle Bin after this step!
              </p>
            </div>

            {/* Type title confirmation field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1A1A1A]">
                To confirm PERMANENT erasure, type <span className="text-rose-700 font-extrabold select-all">{itemToPermDelete.title}</span> below:
              </label>
              <input
                type="text"
                value={permConfirmTitleInput}
                onChange={(e) => setPermConfirmTitleInput(e.target.value)}
                placeholder={`Type "${itemToPermDelete.title}"`}
                className="w-full px-4 py-2.5 rounded-xl border border-rose-300 text-sm font-extrabold focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 text-rose-950 placeholder:text-gray-400"
                autoFocus
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPermDeleteModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-full border border-[#E5E1D8] text-[#5C5A55] text-xs font-semibold hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                disabled={submitting || !isPermTitleMatched}
                className="flex-1 py-3 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-rose-600/30"
              >
                {submitting ? "Erasing Forever..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
