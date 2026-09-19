"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Search,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  Layers,
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

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [sortBy, setSortBy] = useState<
    "updatedDesc" | "updatedAsc" | "createdDesc" | "createdAsc" | "viewsDesc" | "titleAsc"
  >("updatedDesc");

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

  const contents = analytics?.contents || [];

  // 1. Available Classes with count for current teacher
  const classOptions = useMemo(() => {
    const map = new Map<string, number>();
    contents.forEach((c) => {
      const cName = c.className || "General";
      map.set(cName, (map.get(cName) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contents]);

  // 2. Available Subjects based on selectedClass
  const subjectOptions = useMemo(() => {
    const map = new Map<string, number>();
    contents.forEach((c) => {
      const cName = c.className || "General";
      if (selectedClass !== "all" && cName !== selectedClass) return;
      const sName = c.subjectName || "General";
      map.set(sName, (map.get(sName) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contents, selectedClass]);

  // 3. Available Topics based on selectedClass & selectedSubject
  const topicOptions = useMemo(() => {
    const map = new Map<string, number>();
    contents.forEach((c) => {
      const cName = c.className || "General";
      const sName = c.subjectName || "General";
      if (selectedClass !== "all" && cName !== selectedClass) return;
      if (selectedSubject !== "all" && sName !== selectedSubject) return;
      const tName = c.topicName || "General";
      map.set(tName, (map.get(tName) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [contents, selectedClass, selectedSubject]);

  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    setSelectedSubject("all");
    setSelectedTopic("all");
  };

  const handleSubjectChange = (newSubject: string) => {
    setSelectedSubject(newSubject);
    setSelectedTopic("all");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedClass("all");
    setSelectedSubject("all");
    setSelectedTopic("all");
    setSortBy("updatedDesc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedClass !== "all" ||
    selectedSubject !== "all" ||
    selectedTopic !== "all" ||
    sortBy !== "updatedDesc";

  // Filtered insights matching status, class, subject, topic, and search
  const filteredContents = useMemo(() => {
    return contents.filter((c) => {
      if (filter === "published" && !c.published) return false;
      if (filter === "draft" && c.published) return false;

      const cName = c.className || "General";
      if (selectedClass !== "all" && cName !== selectedClass) return false;

      const sName = c.subjectName || "General";
      if (selectedSubject !== "all" && sName !== selectedSubject) return false;

      const tName = c.topicName || "General";
      if (selectedTopic !== "all" && tName !== selectedTopic) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesClass = cName.toLowerCase().includes(q);
        const matchesSubject = sName.toLowerCase().includes(q);
        const matchesTopic = tName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesClass && !matchesSubject && !matchesTopic) {
          return false;
        }
      }

      return true;
    });
  }, [contents, filter, selectedClass, selectedSubject, selectedTopic, searchQuery]);

  // Sorted insights
  const sortedContents = useMemo(() => {
    return [...filteredContents].sort((a, b) => {
      if (sortBy === "updatedDesc") {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      }
      if (sortBy === "updatedAsc") {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeA - timeB;
      }
      if (sortBy === "createdDesc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "createdAsc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "viewsDesc") {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      if (sortBy === "titleAsc") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [filteredContents, sortBy]);

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

  if (!ready || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
        <Loader2 className="w-8 h-8 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">Loading Real Educator Analytics from Database…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 md:py-14 space-y-6 sm:space-y-10 font-ui">
      {/* Top Banner Header */}
      <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-[#FAF8F5] border border-[#E5E1D8] flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-2.5 sm:px-3 py-1 rounded-full border border-[#A84C32]/20 font-bold inline-flex items-center gap-1 text-[11px] sm:text-xs">
              <Award className="h-3.5 w-3.5" /> Approved Verified Educator
            </span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-semibold text-[#1A1A1A] leading-tight">
            Educator Studio & Audience Analytics
          </h1>
          <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] mt-1">
            Track student readership, engagement metrics, and saved academic insights in real time.
          </p>
        </div>

        <Link
          href="/teacher/write"
          className="lumen-button-primary py-3 sm:py-3.5 px-5 sm:px-6 text-xs font-semibold shadow-xs shrink-0 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <PenSquare className="h-4 w-4" />
          <span>Write New Insight</span>
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1.5 sm:space-y-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center border border-[#A84C32]/10">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <p className="text-[#5C5A55] text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Total Insights</p>
          <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">{analytics?.totalInsights || 0}</h3>
          <p className="text-[11px] sm:text-xs text-[#5C5A55]">{publishedCount} Live · {draftCount} Drafts</p>
        </div>

        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1.5 sm:space-y-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <p className="text-[#5C5A55] text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Student Reach</p>
          <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">{totalReach.toLocaleString()}</h3>
          <p className="text-[11px] sm:text-xs text-[#5C5A55] font-medium">Verified Reads</p>
        </div>

        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1.5 sm:space-y-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <p className="text-[#5C5A55] text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Appreciations</p>
          <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">{totalAppreciations.toLocaleString()}</h3>
          <p className="text-[11px] sm:text-xs text-[#5C5A55] font-medium">Student Likes</p>
        </div>

        <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1.5 sm:space-y-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <p className="text-[#5C5A55] text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Bookmarks</p>
          <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">{totalBookmarks.toLocaleString()}</h3>
          <p className="text-[11px] sm:text-xs text-[#5C5A55] font-medium">Saved Reads</p>
        </div>
      </div>

      {/* Dynamic Audience Breakdown by Teacher's Created Classes */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3 sm:pb-4">
          <div>
            <span className="eyebrow text-[#A84C32] block mb-0.5 sm:mb-1 text-[11px] sm:text-xs">Target Readership Breakdown</span>
            <h3 className="font-serif-display text-xl sm:text-2xl font-semibold text-[#1A1A1A]">
              Audience Reach by Active Classes
            </h3>
          </div>
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#A84C32] shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-xs font-ui">
          {teacherClassList.length === 0 ? (
            <div className="col-span-full py-6 text-center text-[#5C5A55] font-serif-body text-xs sm:text-sm">
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
                <div key={cls.className} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif-display text-sm sm:text-base font-semibold text-[#1A1A1A] block truncate">{cls.className}</span>
                    <span className="text-[10px] font-bold text-[#A84C32] bg-[#FBF4F2] px-2 py-0.5 rounded-full border border-[#A84C32]/20 shrink-0">
                      {cls.insightCount} {cls.insightCount === 1 ? "insight" : "insights"}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-serif-display font-semibold text-[#1A1A1A]">{cls.reach.toLocaleString()}</p>
                    <p className="text-[#5C5A55] text-[10px] sm:text-[11px]">Students Reached</p>
                  </div>
                  <div className="w-full h-1.5 sm:h-2 rounded-full bg-[#E5E1D8] overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${percent || 100}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Content Management Table with Publish/Unpublish & 30-Day Recycle Bin */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#E5E1D8] pb-4">
          <div>
            <span className="eyebrow text-[#A84C32] block mb-0.5 sm:mb-1 text-[11px] sm:text-xs">Content Management</span>
            <h3 className="font-serif-display text-xl sm:text-2xl font-semibold text-[#1A1A1A]">
              Your Insights & Publishing
            </h3>
          </div>

          {/* Filter Tabs including Bin — Smooth horizontal scroll on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-ui text-xs overflow-x-auto pb-1 sm:pb-0 no-scrollbar sm:flex-wrap -mx-1 px-1">
            {(["all", "published", "draft", "bin"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full capitalize font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap text-xs ${
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
                  : `Bin (${binItems.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Search, Taxonomy Filters & Sorting Toolbar (Active for Live & Drafts) */}
        {filter !== "bin" && contents.length > 0 && (
          <div className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8]">
            {/* Row 1: Search Bar & Reset */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#5C5A55]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, topic, subject..."
                  className="w-full pl-9 sm:pl-10 pr-8 sm:pr-9 py-2 sm:py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#5C5A55] hover:text-[#1A1A1A] cursor-pointer p-1"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 sm:py-2.5 rounded-xl bg-white border border-[#E5E1D8] text-xs font-semibold text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
                </button>
              )}
            </div>

            {/* Row 2: Cascading Selects (Class -> Subject -> Topic) & Sort By (2 cols on mobile, 4 on desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Class Filter */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-[#5C5A55] mb-1 truncate">
                  1. Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] cursor-pointer truncate"
                >
                  <option value="all">All Classes ({contents.length})</option>
                  {classOptions.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-[#5C5A55] mb-1 truncate">
                  2. Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] cursor-pointer truncate"
                >
                  <option value="all">
                    All Subjects {selectedClass !== "all" ? `in ${selectedClass}` : ""}
                  </option>
                  {subjectOptions.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Filter */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-[#5C5A55] mb-1 truncate">
                  3. Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] cursor-pointer truncate"
                >
                  <option value="all">
                    All Topics {selectedSubject !== "all" ? `in ${selectedSubject}` : ""}
                  </option>
                  {topicOptions.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-semibold text-[#5C5A55] mb-1 flex items-center gap-1 truncate">
                  <ArrowUpDown className="h-3 w-3 text-[#A84C32]" /> Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-white border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] cursor-pointer font-medium text-[#1A1A1A] truncate"
                >
                  <option value="updatedDesc">Edited (Newest)</option>
                  <option value="updatedAsc">Edited (Oldest)</option>
                  <option value="createdDesc">Created (Newest)</option>
                  <option value="createdAsc">Created (Oldest)</option>
                  <option value="viewsDesc">Reach (Most Viewed)</option>
                  <option value="titleAsc">Title (A - Z)</option>
                </select>
              </div>
            </div>

            {/* Quick Topic Chips / Pills (when multiple topics available) */}
            {topicOptions.length > 0 && (
              <div className="pt-2 border-t border-[#E5E1D8]/70 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#5C5A55] shrink-0">
                  Topics:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTopic("all")}
                  className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedTopic === "all"
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:text-[#1A1A1A]"
                  }`}
                >
                  All ({subjectOptions.reduce((acc, s) => acc + s.count, 0)})
                </button>
                {topicOptions.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setSelectedTopic(t.name)}
                    className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedTopic === t.name
                        ? "bg-[#A84C32] text-white"
                        : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:text-[#1A1A1A] hover:border-[#A84C32]"
                    }`}
                  >
                    {t.name} <span className="opacity-75">({t.count})</span>
                  </button>
                ))}
              </div>
            )}

            {/* Active Results Summary */}
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#5C5A55] pt-0.5">
              <span>
                Showing <strong className="text-[#1A1A1A]">{sortedContents.length}</strong> of{" "}
                <strong>{contents.length}</strong> insights
              </span>
              {hasActiveFilters && (
                <span className="text-[10px] sm:text-[11px] text-[#A84C32] font-semibold bg-[#FBF4F2] px-2 py-0.5 rounded-full border border-[#A84C32]/20">
                  Filtered
                </span>
              )}
            </div>
          </div>
        )}

        {/* VIEW: RECYCLE BIN TAB */}
        {filter === "bin" ? (
          binLoading ? (
            <div className="py-12 text-center text-[#5C5A55] text-xs sm:text-sm">Loading bin...</div>
          ) : binItems.length === 0 ? (
            <div className="py-12 sm:py-16 text-center space-y-3 font-serif-body">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <Trash2 className="h-6 w-6" />
              </div>
              <h4 className="font-serif-display text-lg sm:text-xl font-semibold text-[#1A1A1A]">Recycle Bin is Empty</h4>
              <p className="text-xs sm:text-sm text-[#5C5A55] max-w-sm mx-auto">
                Deleted insights stay in the Recycle Bin for 30 days before permanent deletion. You can restore (unbin) them anytime.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW FOR RECYCLE BIN: Clean Cards */}
              <div className="block md:hidden space-y-3">
                {binItems.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-serif-display text-base font-semibold text-[#1A1A1A] leading-snug">
                        {item.title}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                        <Clock className="h-3 w-3" /> {item.daysLeft}d left
                      </span>
                    </div>
                    <p className="text-xs text-[#5C5A55]">
                      {item.className} {item.subjectName && `• ${item.subjectName}`} {item.topicName && `• ${item.topicName}`}
                    </p>
                    <p className="text-[11px] text-[#5C5A55]">
                      Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E1D8]/60">
                      <button
                        onClick={() => handleRestore(item)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restore
                      </button>
                      <button
                        onClick={() => openPermDeleteModal(item)}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Trash className="h-3.5 w-3.5" /> Permanent Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW FOR RECYCLE BIN: Full Table */}
              <div className="hidden md:block overflow-x-auto">
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
            </>
          )
        ) : (
          /* VIEW: ACTIVE INSIGHTS TAB (ALL, PUBLISHED, DRAFT) */
          sortedContents.length === 0 ? (
            contents.length === 0 ? (
              <div className="py-12 sm:py-16 text-center space-y-3 font-serif-body">
                <div className="w-12 h-12 rounded-full bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center mx-auto border border-[#A84C32]/20">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h4 className="font-serif-display text-lg sm:text-xl font-semibold text-[#1A1A1A]">No insights written yet</h4>
                <p className="text-xs sm:text-sm text-[#5C5A55] max-w-sm mx-auto">
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
              <div className="py-12 sm:py-16 text-center space-y-3 font-serif-body">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                  <Search className="h-6 w-6" />
                </div>
                <h4 className="font-serif-display text-lg sm:text-xl font-semibold text-[#1A1A1A]">No insights found matching filters</h4>
                <p className="text-xs sm:text-sm text-[#5C5A55] max-w-sm mx-auto">
                  No insight matches your selected class, subject, topic or search query.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw className="h-4 w-4" /> Reset All Filters
                </button>
              </div>
            )
          ) : (
            <>
              {/* MOBILE VIEW FOR ACTIVE INSIGHTS: Modern Touch-Friendly Cards */}
              <div className="block md:hidden space-y-3.5">
                {sortedContents.map((c) => (
                  <div
                    key={c._id}
                    className="p-4 rounded-2xl bg-[#FAF8F5]/90 border border-[#E5E1D8] shadow-2xs space-y-3 transition-all"
                  >
                    {/* Card Header: Title & Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <Link
                        href={`/teacher/write/${c._id}`}
                        className="font-serif-display text-base font-semibold text-[#1A1A1A] hover:text-[#A84C32] transition-colors leading-snug line-clamp-2"
                      >
                        {c.title}
                      </Link>
                      {c.published ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                          <CheckCircle2 className="h-3 w-3" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          <Clock className="h-3 w-3" /> Draft
                        </span>
                      )}
                    </div>

                    {/* Taxonomy Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      {c.className && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FBF4F2] text-[#A84C32] font-semibold text-[11px] border border-[#A84C32]/20">
                          {c.className}
                        </span>
                      )}
                      {c.subjectName && (
                        <span className="px-2 py-0.5 rounded-md bg-white text-[#1A1A1A] font-medium text-[11px] border border-[#E5E1D8]">
                          {c.subjectName}
                        </span>
                      )}
                      {c.topicName && (
                        <span className="text-[11px] text-[#5C5A55]">
                          Topic: <strong className="text-[#1A1A1A] font-medium">{c.topicName}</strong>
                        </span>
                      )}
                    </div>

                    {/* Metrics & Timeline Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E1D8]/60 text-xs">
                      {/* Timeline */}
                      <div className="flex flex-col text-[11px] text-[#5C5A55]">
                        <span>
                          Edited:{" "}
                          <strong className="text-[#1A1A1A] font-medium">
                            {new Date(c.updatedAt || c.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </strong>
                        </span>
                        <span className="text-[10px] text-[#5C5A55]/80">
                          Created:{" "}
                          {new Date(c.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Engagement Stats Chips */}
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]">
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#E5E1D8] text-[11px]" title="Student reads">
                          <Eye className="h-3 w-3 text-blue-600" />
                          {(c.viewsCount || 0).toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#E5E1D8] text-[11px]" title="Likes">
                          <Heart className="h-3 w-3 text-rose-600" />
                          {(c.likesCount || 0).toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#E5E1D8] text-[11px]" title="Bookmarks">
                          <Bookmark className="h-3 w-3 text-amber-600" />
                          {(c.bookmarksCount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Touch Action Buttons Bar */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E1D8]/60">
                      <Link
                        href={`/teacher/write/${c._id}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E5E1D8] text-[#1A1A1A] text-xs font-semibold hover:border-[#A84C32] hover:text-[#A84C32] transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit Insight
                      </Link>

                      <button
                        onClick={() => handleTogglePublish(c)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${
                          c.published
                            ? "bg-amber-50 border border-amber-200 text-amber-800"
                            : "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        }`}
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

                      <button
                        onClick={() => openDeleteModal(c)}
                        className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Move to Recycle Bin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW FOR ACTIVE INSIGHTS: Full Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left font-ui text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E1D8] text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Insight Title</th>
                      <th className="pb-3">Category & Topic</th>
                      <th className="pb-3">Timeline (Updated / Created)</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Publish Control</th>
                      <th className="pb-3 text-center">Reach</th>
                      <th className="pb-3 text-center">Likes</th>
                      <th className="pb-3 text-center">Saves</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]/60">
                    {sortedContents.map((c) => (
                      <tr key={c._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                        <td className="py-4 pl-2 font-medium text-[#1A1A1A] max-w-xs">
                          <div className="flex flex-col">
                            <Link
                              href={`/teacher/write/${c._id}`}
                              className="font-serif-display text-base font-semibold hover:text-[#A84C32] transition-colors line-clamp-2"
                              title="Click to edit insight"
                            >
                              {c.title}
                            </Link>
                          </div>
                        </td>
                        <td className="py-4 text-xs font-ui">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {c.className && (
                                <span className="px-2 py-0.5 rounded-md bg-[#FBF4F2] text-[#A84C32] font-semibold text-[11px] border border-[#A84C32]/20">
                                  {c.className}
                                </span>
                              )}
                              {c.subjectName && (
                                <span className="text-xs text-[#1A1A1A] font-medium">
                                  {c.subjectName}
                                </span>
                              )}
                            </div>
                            {c.topicName && (
                              <span className="text-[11px] text-[#5C5A55]">
                                Topic: <strong className="text-[#1A1A1A] font-medium">{c.topicName}</strong>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-xs font-ui">
                          <div className="flex flex-col gap-0.5">
                            <div
                              className="inline-flex items-center gap-1.5 text-[#1A1A1A] font-medium"
                              title={new Date(c.updatedAt || c.createdAt).toLocaleString()}
                            >
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                Edited
                              </span>
                              <span>
                                {new Date(c.updatedAt || c.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#5C5A55] pl-0.5" title={new Date(c.createdAt).toLocaleString()}>
                              Created:{" "}
                              {new Date(c.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          {c.published ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                              <Clock className="h-3.5 w-3.5" /> Draft
                            </span>
                          )}
                        </td>
                        {/* Publish / Unpublish Toggle Action */}
                        <td className="py-4">
                          <button
                            onClick={() => handleTogglePublish(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
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
                        <td className="py-4 text-center font-semibold text-[#1A1A1A]">{(c.viewsCount || 0).toLocaleString()}</td>
                        <td className="py-4 text-center font-semibold text-[#1A1A1A]">{(c.likesCount || 0).toLocaleString()}</td>
                        <td className="py-4 text-center font-semibold text-[#1A1A1A]">{(c.bookmarksCount || 0).toLocaleString()}</td>
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
            </>
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
