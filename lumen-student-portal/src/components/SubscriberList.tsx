"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Search, ArrowUpDown, Calendar, Mail, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface SubscriberItem {
  _id: string;
  subscriber: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  subscribedAt: string;
}

export default function SubscriberList() {
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/subscriptions/teacher/list");
      setSubscribers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load subscriber list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const name = sub.subscriber?.name?.toLowerCase() || "";
      const email = sub.subscriber?.email?.toLowerCase() || "";
      return name.includes(q) || email.includes(q);
    });
  }, [subscribers, searchQuery]);

  const sortedSubscribers = useMemo(() => {
    return [...filteredSubscribers].sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.subscribedAt).getTime() - new Date(b.subscribedAt).getTime();
      }
      if (sortBy === "name") {
        return (a.subscriber?.name || "").localeCompare(b.subscriber?.name || "");
      }
      return 0;
    });
  }, [filteredSubscribers, sortBy]);

  return (
    <div className="space-y-6 font-ui">
      {/* Header and Summary Card */}
      <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FAF8F5] to-white border border-[#E5E1D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-3 py-1 rounded-full border border-[#A84C32]/20 font-bold inline-flex items-center gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Subscriber Community
            </span>
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">
            Enrolled &amp; Subscribed Students
          </h2>
          <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] max-w-xl">
            These students receive real-time website notifications and direct emails whenever you publish a new quiz or playlist.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-white border border-[#E5E1D8] rounded-2xl p-4 sm:p-5 text-center min-w-[130px] shadow-2xs">
            <p className="text-[11px] font-semibold text-[#5C5A55] uppercase tracking-wider">Subscribers</p>
            <p className="font-serif-display text-3xl sm:text-4xl font-bold text-[#A84C32] mt-0.5">
              {subscribers.length.toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3" /> Active Learners
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSubscribers}
            disabled={loading}
            title="Refresh subscriber list"
            className="p-3 rounded-xl border border-[#E5E1D8] bg-white text-[#5C5A55] hover:text-[#1A1A1A] hover:border-[#A84C32] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl sm:rounded-2xl bg-white border border-[#E5E1D8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5A55]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriber by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="h-3.5 w-3.5 text-[#5C5A55]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="p-2 sm:py-2.5 px-3 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] cursor-pointer"
          >
            <option value="newest">Recently Subscribed</option>
            <option value="oldest">Earliest Subscribed</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Subscriber List Body */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#A84C32] animate-spin mb-3" />
          <p className="font-serif-body text-sm text-[#5C5A55]">Loading your subscribers…</p>
        </div>
      ) : sortedSubscribers.length === 0 ? (
        <div className="py-16 px-6 text-center bg-[#FAF8F5] border border-[#E5E1D8] rounded-2xl sm:rounded-3xl space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] shadow-2xs">
            <Users className="h-7 w-7 opacity-75" />
          </div>
          <h3 className="font-serif-display text-lg sm:text-xl font-semibold text-[#1A1A1A]">
            {searchQuery ? "No matching subscribers found" : "No subscribers yet"}
          </h3>
          <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] max-w-md mx-auto">
            {searchQuery
              ? `No student matches "${searchQuery}". Try a different keyword.`
              : "Students who follow your profile will appear here. Publish interesting topic-wise or weekly quizzes to attract more students!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSubscribers.map((item) => {
            const sub = item.subscriber;
            const initial = sub?.name?.[0]?.toUpperCase() || "S";
            const dateStr = item.subscribedAt
              ? new Date(item.subscribedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently";

            return (
              <div
                key={item._id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E1D8] hover:border-[#A84C32] transition-all duration-200 shadow-xs flex items-center gap-3.5 group"
              >
                {sub?.avatar ? (
                  <img
                    src={sub.avatar}
                    alt={sub.name}
                    className="w-11 h-11 rounded-xl object-cover border border-[#E5E1D8] shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] font-serif-display font-bold text-base flex items-center justify-center shrink-0">
                    {initial}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-serif-display text-sm font-semibold text-[#1A1A1A] truncate group-hover:text-[#A84C32] transition-colors">
                    {sub?.name || "Student"}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-[#5C5A55] truncate mt-0.5">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{sub?.email || "No email available"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#8C8983] mt-1.5 font-medium">
                    <Calendar className="h-3 w-3 shrink-0 text-[#A84C32]" />
                    <span>Subscribed on {dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

