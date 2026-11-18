"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  UserPlus,
  BookOpen,
  FileText,
  Layers,
  Megaphone,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  quizRef?: { _id: string; title: string } | null;
  contentRef?: { _id: string; title: string; slug?: string } | null;
  teacherRef?: { _id: string; name: string; avatar?: string } | null;
  subscriberRef?: { _id: string; name: string; avatar?: string } | null;
  collectionRef?: string;
  link?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount & periodically
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnreadCount(data?.count || 0);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch full notifications when panel opens
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

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

  return (
    <div ref={panelRef} className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-full text-[#5C5A55] hover:text-[#A84C32] hover:bg-[#FBF4F2] transition-colors cursor-pointer"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#A84C32] text-white text-[10px] font-bold leading-none ring-2 ring-[#FAF8F5] animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[360px] sm:w-[400px] max-h-[480px] rounded-2xl bg-white border border-[#E5E1D8] shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-[#E5E1D8] bg-[#FAF8F5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#A84C32]" />
              <h3 className="font-serif-display text-base font-bold text-[#1A1A1A]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-[#A84C32] px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-[#A84C32] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[380px] divide-y divide-[#E5E1D8]/60">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 text-[#A84C32] animate-spin mb-2" />
                <p className="font-serif-body text-xs text-[#5C5A55]">
                  Loading notifications…
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center mb-3">
                  <Bell className="h-6 w-6 text-[#5C5A55] opacity-50" />
                </div>
                <p className="font-serif-body text-sm text-[#5C5A55]">
                  No notifications yet
                </p>
                <p className="text-[11px] text-[#8C8983] mt-1">
                  You&apos;ll see updates here when someone subscribes, or new quizzes are published.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const avatarUrl =
                  notif.type === "new_subscriber"
                    ? notif.subscriberRef?.avatar || notif.teacherRef?.avatar
                    : notif.teacherRef?.avatar;

                return (
                  <div
                    key={notif._id}
                    className={`px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer hover:bg-[#FAF8F5] ${
                      !notif.read ? "bg-[#FBF4F2]/50" : ""
                    }`}
                    onClick={() => {
                      if (!notif.read) handleMarkRead(notif._id);
                      setIsOpen(false);
                      if (notif.link) {
                        router.push(notif.link);
                      } else if (notif.quizRef?._id) {
                        router.push(`/quiz/${notif.quizRef._id}`);
                      } else if (notif.contentRef?._id) {
                        router.push(`/blog/${notif.contentRef.slug || notif.contentRef._id}`);
                      } else if (notif.type === "new_subscriber") {
                        router.push("/teacher/dashboard");
                      }
                    }}
                  >
                    {/* Icon / Avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
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
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        getIcon(notif.type)
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-relaxed ${
                          !notif.read
                            ? "font-semibold text-[#1A1A1A]"
                            : "text-[#5C5A55]"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-[#8C8983] mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-[#8C8983] mt-1 block">
                        {getTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="mt-1.5 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#A84C32] ring-2 ring-[#FBF4F2]" />
                      </div>
                    )}

                    {/* Mark read button */}
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(notif._id);
                        }}
                        className="mt-1 p-1 rounded-lg text-[#5C5A55] hover:text-[#A84C32] hover:bg-white transition-colors shrink-0 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

