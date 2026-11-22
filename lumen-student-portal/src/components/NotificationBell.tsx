"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count on mount & periodically every 30s
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
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-full text-[#5C5A55] hover:text-[#A84C32] hover:bg-[#FBF4F2] transition-colors cursor-pointer inline-flex items-center justify-center"
      aria-label="Notifications"
      title="Notifications"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#A84C32] text-white text-[10px] font-bold leading-none ring-2 ring-[#FAF8F5] animate-in zoom-in-50 duration-200">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
