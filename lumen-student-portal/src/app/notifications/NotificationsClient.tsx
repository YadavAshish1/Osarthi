"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Trash2,
  BookOpen,
  FileText,
  UserPlus,
  Layers,
  Megaphone,
  Loader2,
  ArrowRight,
  MoreVertical,
  Eye,
  EyeOff,
  BellOff,
  X,
} from "lucide-react";
import { api, getTeacherSlug } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  hidden?: boolean;
  quizRef?: { _id: string; title: string } | null;
  contentRef?: { _id: string; title: string; slug?: string } | null;
  teacherRef?: { _id: string; name: string; avatar?: string } | null;
  subscriberRef?: { _id: string; name: string; avatar?: string } | null;
  collectionRef?: string;
  link?: string;
  createdAt: string;
}

export default function NotificationsClient() {
  const router = useRouter();
  const { user, ready, openAuth } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [counts, setCounts] = useState({ unread: 0, hidden: 0, totalActive: 0 });

  const [filter, setFilter] = useState<"all" | "unread" | "hidden">("all");
  const [markingAll, setMarkingAll] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [mutedTeachers, setMutedTeachers] = useState<any[]>([]);
  const [mutedModalOpen, setMutedModalOpen] = useState(false);
  const [unmutingId, setUnmutingId] = useState<string | null>(null);
  const [mutedFeedbackCards, setMutedFeedbackCards] = useState<
    Record<string, { teacherId: string; teacherName: string; firstName: string }>
  >({});

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Close three-dot menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    if (activeMenuId) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [activeMenuId]);

  // Return to the previous page or home fallback
  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  // Fetch counts for filter pills & badges
  const fetchCounts = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/counts");
      if (data) {
        setCounts({
          unread: data.unread || 0,
          hidden: data.hidden || 0,
          totalActive: data.totalActive || 0,
        });
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch initial page 1 (20 items) for active filter
  const fetchNotifications = useCallback(
    async (currentFilter: "all" | "unread" | "hidden") => {
      setLoading(true);
      setPage(1);
      try {
        const isHidden = currentFilter === "hidden";
        const isUnread = currentFilter === "unread";
        const { data } = await api.get("/notifications", {
          params: {
            page: 1,
            limit: 20,
            hidden: isHidden ? true : undefined,
            unread: isUnread ? true : undefined,
          },
        });

        const list = Array.isArray(data) ? data : data?.notifications || [];
        setNotifications(list);
        setHasMore(data?.hasMore ?? (list.length === 20));
      } catch {
        setNotifications([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load next 20 items and append (Infinite Scroll)
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const isHidden = filter === "hidden";
      const isUnread = filter === "unread";
      const { data } = await api.get("/notifications", {
        params: {
          page: nextPage,
          limit: 20,
          hidden: isHidden ? true : undefined,
          unread: isUnread ? true : undefined,
        },
      });

      const list = Array.isArray(data) ? data : data?.notifications || [];
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n._id));
        const unique = list.filter((n: NotificationItem) => !existingIds.has(n._id));
        return [...prev, ...unique];
      });
      setPage(nextPage);
      setHasMore(data?.hasMore ?? (list.length === 20));
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, filter]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    );

    const current = sentinelRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [hasMore, loading, loadingMore, loadMore]);

  // Fetch muted teachers list
  const fetchMutedTeachers = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/muted-teachers");
      setMutedTeachers(Array.isArray(data) ? data : []);
    } catch {
      setMutedTeachers([]);
    }
  }, []);

  useEffect(() => {
    if (ready && user) {
      fetchNotifications(filter);
      fetchCounts();
      fetchMutedTeachers();
    } else if (ready && !user) {
      setLoading(false);
    }
  }, [ready, user, filter, fetchNotifications, fetchCounts, fetchMutedTeachers]);

  // Mark single as read
  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch {
      // Silently fail
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setCounts((prev) => ({ ...prev, unread: 0 }));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAll(false);
    }
  };

  // Option 1: Hide this notification
  const handleHideNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setCounts((prev) => ({
      ...prev,
      hidden: prev.hidden + 1,
      totalActive: Math.max(0, prev.totalActive - 1),
    }));
    try {
      await api.patch(`/notifications/${id}/hide`);
      toast.success("Notification hidden", {
        action: {
          label: "Undo",
          onClick: () => handleUnhideNotification(id),
        },
      });
      fetchCounts();
    } catch {
      toast.error("Failed to hide notification");
    }
  };

  // Unhide single notification
  const handleUnhideNotification = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setCounts((prev) => ({
      ...prev,
      hidden: Math.max(0, prev.hidden - 1),
      totalActive: prev.totalActive + 1,
    }));
    try {
      await api.patch(`/notifications/${id}/unhide`);
      toast.success("Notification unhidden");
      fetchCounts();
    } catch {
      toast.error("Failed to unhide notification");
    }
  };

  // Unhide all hidden notifications
  const handleUnhideAll = async () => {
    try {
      await api.patch("/notifications/unhide-all");
      setNotifications([]);
      setCounts((prev) => ({
        ...prev,
        hidden: 0,
        totalActive: prev.totalActive + prev.hidden,
      }));
      toast.success("All hidden notifications unhidden");
      fetchCounts();
    } catch {
      toast.error("Failed to unhide all notifications");
    }
  };

  // Turn ON notifications from teacher (Unmute)
  const handleUnmuteTeacher = async (
    teacherId: string,
    teacherName: string,
    notifId?: string
  ) => {
    setUnmutingId(teacherId);

    // Remove feedback card state for this teacher
    setMutedFeedbackCards((prev) => {
      const next = { ...prev };
      if (notifId && next[notifId]) {
        delete next[notifId];
      } else {
        Object.keys(next).forEach((k) => {
          if (next[k].teacherId === teacherId) delete next[k];
        });
      }
      return next;
    });

    try {
      await api.post("/notifications/unmute-teacher", { teacherId, unhidePast: true });
      toast.success(`Notifications turned back on for ${teacherName}`);
      await fetchMutedTeachers();
    } catch {
      toast.error(`Failed to turn on notifications for ${teacherName}`);
    } finally {
      setUnmutingId(null);
    }
  };

  // Option 2: Turn off notifications from teacher (Mute)
  const handleMuteTeacher = async (
    teacherId: string,
    teacherName: string,
    notifId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setActiveMenuId(null);

    // Clean first name (e.g., "Pooja Kumari" -> "Pooja", "Dr. Ramesh" -> "Ramesh")
    const cleanName = teacherName.replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, "");
    const firstName = cleanName.trim().split(/\s+/)[0] || teacherName;

    // Do NOT remove all notifications from this teacher!
    // Instead, show inline feedback message in this card
    setMutedFeedbackCards((prev) => ({
      ...prev,
      [notifId]: { teacherId, teacherName, firstName },
    }));

    try {
      await api.post("/notifications/mute-teacher", { teacherId });
      fetchMutedTeachers();
      toast.success(
        `You'll no longer receive notifications about ${teacherName}.`,
        {
          action: {
            label: "Undo",
            onClick: () => handleUnmuteTeacher(teacherId, teacherName, notifId),
          },
        }
      );
    } catch {
      toast.error(`Failed to turn off notifications from ${teacherName}`);
    }
  };

  // Option 3: Delete this notification
  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await api.delete(`/notifications/${id}`);
      toast.success("Notification deleted");
    } catch {
      toast.success("Notification deleted");
    }
  };

  // Navigate when notification card is clicked
  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.read) {
      handleMarkRead(notif._id);
    }

    if (notif.link) {
      router.push(notif.link);
    } else if (notif.quizRef?._id) {
      router.push(`/quiz/${notif.quizRef._id}`);
    } else if (notif.contentRef?._id) {
      router.push(`/blog/${notif.contentRef.slug || notif.contentRef._id}`);
    } else if (notif.type === "new_subscriber") {
      router.push("/teacher/dashboard");
    }
  };

  // Unread count
  const unreadCount = counts.unread;

  // Filtered notifications (current loaded page items)
  const filteredNotifications = notifications;

  // Group notifications into Today, Yesterday, Earlier
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: NotificationItem[] } = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    notifications.forEach((item) => {
      const itemDate = new Date(item.createdAt);
      const itemDateStr = itemDate.toDateString();

      if (itemDateStr === todayStr) {
        groups.Today.push(item);
      } else if (itemDateStr === yesterdayStr) {
        groups.Yesterday.push(item);
      } else {
        groups.Earlier.push(item);
      }
    });

    return groups;
  }, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case "new_subscriber":
        return <UserPlus className="h-4 w-4 text-emerald-600" />;
      case "insight_published":
        return <FileText className="h-4 w-4 text-[#A84C32]" />;
      case "quiz_published":
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      case "collection_created":
        return <Layers className="h-4 w-4 text-purple-600" />;
      case "teacher_update":
        return <Megaphone className="h-4 w-4 text-amber-600" />;
      default:
        return <Bell className="h-4 w-4 text-[#A84C32]" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "quiz_published":
        return (
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Quiz
          </span>
        );
      case "insight_published":
        return (
          <span className="text-[10px] font-bold text-[#A84C32] bg-[#FBF4F2] border border-[#A84C32]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Insight
          </span>
        );
      case "new_subscriber":
        return (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Subscriber
          </span>
        );
      case "collection_created":
        return (
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Collection
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-[#5C5A55] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Update
          </span>
        );
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  if (!ready || loading) {
    return (
      <div className="w-full bg-[#FAF8F5] font-ui">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E5E1D8] px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" />
            </button>
            <h1 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1A1A]">
              Notifications
            </h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 text-[#A84C32] animate-spin mb-3" />
          <p className="font-serif-body text-sm text-[#5C5A55]">
            Loading your notifications…
          </p>
        </div>
      </div>
    );
  }

  // Not signed in state
  if (!user) {
    return (
      <div className="w-full bg-[#FAF8F5] font-ui">
        <div className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E5E1D8] px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" />
            </button>
            <h1 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1A1A]">
              Notifications
            </h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-20 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#E5E1D8] shadow-xs flex items-center justify-center text-[#A84C32]">
            <Bell className="h-7 w-7" />
          </div>
          <h2 className="font-serif-display text-2xl font-bold text-[#1A1A1A]">
            Sign in to view notifications
          </h2>
          <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55]">
            Sign in to track new quizzes from your teachers, editorial insights, and learning updates.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openAuth("login")}
              className="lumen-button-primary px-6 py-2.5 text-xs font-semibold shadow-xs"
            >
              Sign In to Your Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#FAF8F5] font-ui pb-6">
      {/* ─── STICKY HEADER WITH BACK BUTTON ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E5E1D8] px-4 sm:px-6 py-3.5 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Back button & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer shrink-0"
              aria-label="Go back to previous page"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1A1A] truncate">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#A84C32] text-white text-[10px] font-bold shrink-0">
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Manage Muted Educators Button */}
            <button
              type="button"
              onClick={() => setMutedModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-white border border-[#E5E1D8] text-[11px] font-semibold text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Manage muted educators"
            >
              <BellOff className="h-3.5 w-3.5 text-[#8C8983]" />
              <span className="hidden sm:inline">Muted</span>
              {mutedTeachers.length > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center justify-center">
                  {mutedTeachers.length}
                </span>
              )}
            </button>

            {/* If on Hidden tab, show Unhide All button; otherwise show Mark all read */}
            {filter === "hidden" ? (
              notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleUnhideAll}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E1D8] text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Unhide all notifications"
                >
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Unhide all</span>
                </button>
              )
            ) : (
              counts.unread > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E1D8] text-[11px] font-semibold text-[#A84C32] hover:bg-[#FBF4F2] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-0 sm:px-6 pt-4 space-y-5">
        {/* Filter Pills */}
        {(counts.totalActive > 0 || counts.hidden > 0 || notifications.length > 0) && (
          <div className="flex items-center gap-2 flex-wrap px-4 sm:px-0">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:border-[#A84C32]"
              }`}
            >
              All ({counts.totalActive || (filter === "all" ? notifications.length : 0)})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === "unread"
                  ? "bg-[#A84C32] text-white shadow-xs"
                  : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:border-[#A84C32]"
              }`}
            >
              <span>Unread</span>
              {counts.unread > 0 && (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    filter === "unread" ? "bg-white text-[#A84C32]" : "bg-[#A84C32] text-white"
                  }`}
                >
                  {counts.unread}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilter("hidden")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === "hidden"
                  ? "bg-[#1A1A1A] text-white shadow-xs"
                  : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:border-[#A84C32]"
              }`}
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Hidden</span>
              {counts.hidden > 0 && (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    filter === "hidden" ? "bg-white text-[#1A1A1A]" : "bg-[#E5E1D8] text-[#5C5A55]"
                  }`}
                >
                  {counts.hidden}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredNotifications.length === 0 ? (
          <div className="mx-4 sm:mx-0 py-16 px-4 text-center space-y-4 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center text-[#5C5A55]">
              {filter === "hidden" ? (
                <EyeOff className="h-8 w-8 text-[#8C8983]" />
              ) : (
                <Bell className="h-8 w-8 text-[#A84C32] opacity-80" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-display text-lg font-bold text-[#1A1A1A]">
                {filter === "hidden"
                  ? "No hidden notifications"
                  : filter === "unread"
                  ? "No unread notifications"
                  : "All caught up!"}
              </h3>
              <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] max-w-sm mx-auto leading-relaxed">
                {filter === "hidden"
                  ? "Notifications you choose to hide will appear here so you can review or unhide them anytime."
                  : filter === "unread"
                  ? "You have read all your notifications. Switch to 'All' to review previous updates."
                  : "When your subscribed educators publish new conceptual quizzes or essays, you will find them here."}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {filter === "hidden" ? (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="lumen-button-primary px-5 py-2.5 text-xs font-semibold shadow-xs"
                >
                  View All Notifications
                </button>
              ) : (
                <Link
                  href="/teachers"
                  className="lumen-button-primary px-5 py-2.5 text-xs font-semibold shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Discover Educators</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          /* Grouped Notification Lists (Today, Yesterday, Earlier) */
          (["Today", "Yesterday", "Earlier"] as const).map((groupName) => {
            const list = groupedNotifications[groupName];
            if (!list || list.length === 0) return null;

            return (
              <div key={groupName} className="space-y-2.5">
                {/* Section Header */}
                <div className="flex items-center gap-2 px-4 sm:px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C8983]">
                    {groupName}
                  </span>
                  <div className="flex-1 h-[1px] bg-[#E5E1D8]" />
                </div>

                {/* Cards Container */}
                <div className="bg-white border-y border-x-0 sm:border border-[#E5E1D8] rounded-none sm:rounded-3xl shadow-xs divide-y divide-[#E5E1D8]/60">
                  {list.map((notif) => {
                    const avatarUrl =
                      notif.type === "new_subscriber"
                        ? notif.subscriberRef?.avatar || notif.teacherRef?.avatar
                        : notif.teacherRef?.avatar;

                    const teacherName =
                      notif.teacherRef?.name ||
                      (notif.title.includes("from ")
                        ? notif.title.split("from ")[1]?.replace(":", "")?.trim()
                        : "this educator");
                    const teacherId = notif.teacherRef?._id;

                    const isMenuOpen = activeMenuId === notif._id;

                    // Inline feedback if user turned off notifications from this teacher
                    const feedback = mutedFeedbackCards[notif._id];
                    if (feedback) {
                      const profileHref = `/teachers/${getTeacherSlug(
                        feedback.teacherId,
                        feedback.teacherName
                      )}`;

                      return (
                        <div
                          key={notif._id}
                          className="p-4 sm:p-4.5 flex items-center justify-between gap-3 bg-[#FAF8F5] sm:first:rounded-t-3xl sm:last:rounded-b-3xl"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
                              <BellOff className="h-4.5 w-4.5" />
                            </div>
                            <p className="text-xs text-[#5C5A55] leading-relaxed">
                              You&apos;ll no longer receive notifications about{" "}
                              <strong className="text-[#1A1A1A] font-semibold">
                                {feedback.teacherName}
                              </strong>
                              . For more options, go to{" "}
                              <Link
                                href={profileHref}
                                className="text-[#A84C32] font-semibold hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {feedback.firstName}’s profile
                              </Link>
                              .
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnmuteTeacher(
                                feedback.teacherId,
                                feedback.teacherName,
                                notif._id
                              );
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors text-xs font-semibold shrink-0 cursor-pointer shadow-2xs"
                          >
                            Undo
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 sm:p-4.5 flex items-start gap-3.5 transition-colors cursor-pointer group relative sm:first:rounded-t-3xl sm:last:rounded-b-3xl ${
                          !notif.read
                            ? "bg-[#EDF3F8] hover:bg-[#E2EEF8]"
                            : "bg-white hover:bg-[#FAF8F5]"
                        }`}
                      >
                        {/* Icon / Avatar */}
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-2xs ${
                            notif.type === "new_subscriber"
                              ? "bg-emerald-50 border border-emerald-200"
                              : notif.type === "insight_published"
                              ? "bg-[#FAF8F5] border border-[#A84C32]/30"
                              : notif.type === "quiz_published"
                              ? "bg-blue-50 border border-blue-200"
                              : notif.type === "collection_created"
                              ? "bg-purple-50 border border-purple-200"
                              : "bg-[#FAF8F5] border border-[#E5E1D8]"
                          }`}
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt=""
                              className="w-full h-full rounded-2xl object-cover"
                            />
                          ) : (
                            getIcon(notif.type)
                          )}
                        </div>

                        {/* Main Body */}
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {getTypeBadge(notif.type)}
                            <span className="text-[10px] text-[#8C8983] font-medium">
                              {getTimeAgo(notif.createdAt)}
                            </span>
                          </div>

                          <h4
                            className={`text-xs sm:text-sm leading-snug ${
                              !notif.read
                                ? "font-bold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors"
                                : "font-medium text-[#2E2C28]"
                            }`}
                          >
                            {notif.title}
                          </h4>

                          <p className="text-xs text-[#5C5A55] mt-1 leading-relaxed line-clamp-2">
                            {notif.message}
                          </p>

                          {/* Quick CTA Pill */}
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A84C32] group-hover:underline">
                              <span>
                                {notif.type === "quiz_published"
                                  ? "Take Quiz"
                                  : notif.type === "insight_published"
                                  ? "Read Insight"
                                  : "View Details"}
                              </span>
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>

                        {/* Right: Actions (Consistent on All Tabs including Hidden) */}
                        <div className="flex items-center gap-1.5 shrink-0 relative">
                          {/* LinkedIn Unread Blue Dot */}
                          {!notif.read && (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-[#0A66C2] shrink-0 mr-0.5"
                              title="Unread"
                              aria-label="Unread notification"
                            />
                          )}

                          {/* Mark read button on active tabs if unread */}
                          {filter !== "hidden" && !notif.read && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkRead(notif._id, e)}
                              className="p-1.5 rounded-lg text-[#5C5A55] hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* ─── THREE DOT VERTICAL MENU BUTTON (ALWAYS PRESENT) ─── */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(isMenuOpen ? null : notif._id);
                              }}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isMenuOpen
                                  ? "bg-black/10 text-[#1A1A1A]"
                                  : "text-[#8C8983] hover:text-[#1A1A1A] hover:bg-black/5"
                              }`}
                              title="Options"
                              aria-label="More options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {/* ─── THREE DOT MENU DROPDOWN POPOVER ─── */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-60 sm:w-64 rounded-2xl bg-white border border-[#E5E1D8] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 font-ui text-left"
                              >
                                {/* 1. Unhide or Hide this notification */}
                                {filter === "hidden" || notif.hidden ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      setActiveMenuId(null);
                                      handleUnhideNotification(notif._id, e);
                                    }}
                                    className="w-full px-3.5 py-2.5 text-xs text-[#2E2C28] hover:bg-[#FAF8F5] hover:text-emerald-700 transition-colors flex items-center gap-2.5 cursor-pointer font-medium"
                                  >
                                    <Eye className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>Unhide this notification</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleHideNotification(notif._id, e)}
                                    className="w-full px-3.5 py-2.5 text-xs text-[#2E2C28] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors flex items-center gap-2.5 cursor-pointer font-medium"
                                  >
                                    <EyeOff className="h-4 w-4 text-[#8C8983] shrink-0" />
                                    <span>Hide this notification</span>
                                  </button>
                                )}

                                {/* 2. Turn off notifications from teacher */}
                                {teacherId ? (
                                  <button
                                    type="button"
                                    onClick={(e) =>
                                      handleMuteTeacher(
                                        teacherId,
                                        teacherName,
                                        notif._id,
                                        e
                                      )
                                    }
                                    className="w-full px-3.5 py-2.5 text-xs text-[#2E2C28] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors flex items-center gap-2.5 cursor-pointer font-medium"
                                  >
                                    <BellOff className="h-4 w-4 text-[#8C8983] shrink-0" />
                                    <span className="truncate">
                                      Turn off notifications from {teacherName}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => handleHideNotification(notif._id, e)}
                                    className="w-full px-3.5 py-2.5 text-xs text-[#2E2C28] hover:bg-[#FAF8F5] hover:text-[#A84C32] transition-colors flex items-center gap-2.5 cursor-pointer font-medium"
                                  >
                                    <BellOff className="h-4 w-4 text-[#8C8983] shrink-0" />
                                    <span>Mute this notification category</span>
                                  </button>
                                )}

                                <div className="my-1 border-t border-[#E5E1D8]/60" />

                                {/* 3. Delete notification */}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteNotification(notif._id, e)}
                                  className="w-full px-3.5 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2.5 cursor-pointer font-medium"
                                >
                                  <Trash2 className="h-4 w-4 text-rose-500 shrink-0" />
                                  <span>Delete this notification</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
        {/* Infinite Scroll Sentinel & Loading Indicator */}
        <div ref={sentinelRef} className="py-2 px-4 flex flex-col items-center justify-center">
          {loadingMore && (
            <div className="flex items-center gap-2 text-xs text-[#5C5A55] font-ui py-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#A84C32]" />
              <span>Loading more notifications…</span>
            </div>
          )}
          {!hasMore && notifications.length >= 20 && (
            <p className="text-[11px] text-[#8C8983] font-ui py-2 text-center">
              You&apos;re all caught up!
            </p>
          )}
        </div>
      </main>

      {/* ─── MUTED EDUCATORS MODAL ─────────────────────────────────────── */}
      {mutedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setMutedModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E5E1D8] shadow-2xl z-10 overflow-hidden font-ui">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <BellOff className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif-display text-base sm:text-lg font-bold text-[#1A1A1A]">
                    Muted Educators
                  </h3>
                  <p className="text-[11px] text-[#8C8983]">
                    Turn notifications back on anytime
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMutedModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F5F2EB] text-[#5C5A55] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2.5">
              {mutedTeachers.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#1A1A1A]">No muted educators</p>
                    <p className="text-xs text-[#8C8983] max-w-xs mx-auto mt-1 leading-relaxed">
                      You are receiving notifications from all your educators when they publish new quizzes or insights.
                    </p>
                  </div>
                </div>
              ) : (
                mutedTeachers.map((teacher) => (
                  <div
                    key={teacher._id}
                    className="p-3 rounded-2xl border border-[#E5E1D8] bg-[#FAF8F5] flex items-center justify-between gap-3 hover:border-[#A84C32]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {teacher.avatar ? (
                        <img
                          src={teacher.avatar}
                          alt={teacher.name}
                          className="w-10 h-10 rounded-xl object-cover border border-[#E5E1D8] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {teacher.name?.[0] || "T"}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#1A1A1A] truncate">
                          {teacher.name}
                        </h4>
                        <p className="text-[10px] text-[#8C8983] truncate">
                          {teacher.subjects?.join(", ") || teacher.bio || "Educator"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={unmutingId === teacher._id}
                      onClick={() => handleUnmuteTeacher(teacher._id, teacher.name)}
                      className="px-3 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
                      title="Turn notifications on"
                    >
                      {unmutingId === teacher._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                      ) : (
                        <Bell className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                      <span>Turn On</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-[#FAF8F5] border-t border-[#E5E1D8] text-center">
              <p className="text-[11px] text-[#8C8983]">
                Turning on notifications unhides recent updates from this educator.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
