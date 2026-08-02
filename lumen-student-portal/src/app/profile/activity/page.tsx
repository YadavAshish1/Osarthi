"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Heart, MessageSquare, BookOpen, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, BlogItem, mapContentToBlog } from "@/lib/api";
import BlogCard from "@/components/BlogCard";

function ActivityListContent() {
  const { user, openAuth } = useAuth();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "commented" ? "commented" : "liked";

  const [activeTab, setActiveTab] = useState<"liked" | "commented">(initialType);
  const [likedBlogs, setLikedBlogs] = useState<BlogItem[]>([]);
  const [commentedBlogs, setCommentedBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data } = await api.get("/profile/activity");
        if (data) {
          if (Array.isArray(data.likedBlogs)) {
            setLikedBlogs(data.likedBlogs.map((item: any) => mapContentToBlog(item)));
          }
          if (Array.isArray(data.commentedBlogs)) {
            setCommentedBlogs(data.commentedBlogs.map((item: any) => mapContentToBlog(item)));
          }
        }
      } catch (err) {
        console.error("Failed to load user activity:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const currentList = activeTab === "liked" ? likedBlogs : commentedBlogs;
  const filteredList = currentList.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center font-serif-body">
        <div className="w-16 h-16 rounded-full bg-[#F5F2EB] text-[#A84C32] flex items-center justify-center mx-auto mb-4 border border-[#E5E1D8]">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-[#1A1A1A]">Sign In to View Activity History</h2>
        <button
          onClick={() => openAuth("login")}
          className="mt-6 px-8 py-3 rounded-full bg-[#1A1A1A] text-white font-ui text-sm font-semibold hover:bg-[#A84C32] transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Back Navigation */}
      <div className="max-w-6xl mx-auto px-6 pt-10 md:pt-16">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55] hover:text-[#A84C32] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 pt-8 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E5E1D8]">
          <div>
            <div className="flex items-center gap-3 text-[#A84C32] mb-2">
              <Sparkles className="h-6 w-6" />
              <span className="text-xs font-ui uppercase tracking-wider font-semibold">
                Activity Collection
              </span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-4xl font-semibold text-[#1A1A1A]">
              {activeTab === "liked" ? `All Appreciates (${likedBlogs.length})` : `All Comments (${commentedBlogs.length})`}
            </h1>
          </div>

          {/* Search Filter */}
          {currentList.length > 0 && (
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5A55]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter insights…"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#E5E1D8] font-ui text-xs text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
              />
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setActiveTab("liked")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-ui text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === "liked"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-white text-[#5C5A55] border-[#E5E1D8] hover:border-[#A84C32] hover:text-[#A84C32]"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${activeTab === "liked" ? "fill-white" : ""}`} />
            <span>Appreciates ({likedBlogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("commented")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-ui text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === "commented"
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-white text-[#5C5A55] border-[#E5E1D8] hover:border-[#A84C32] hover:text-[#A84C32]"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Comments ({commentedBlogs.length})</span>
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <main className="max-w-6xl mx-auto px-6">
        {loading ? (
          <div className="py-16 text-center font-serif-body text-[#5C5A55]">
            Loading activity history…
          </div>
        ) : filteredList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredList.map((blog, idx) => (
              <div key={blog.id} className="relative group/card">
                {activeTab === "liked" ? (
                  <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs text-[#A84C32] px-3 py-1 rounded-full text-[11px] font-ui font-semibold border border-[#E5E1D8] shadow-xs flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-[#A84C32]" />
                    <span>Appreciated</span>
                  </div>
                ) : (
                  <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs text-[#1A1A1A] px-3 py-1 rounded-full text-[11px] font-ui font-semibold border border-[#E5E1D8] shadow-xs flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-[#A84C32]" />
                    <span>Discussed</span>
                  </div>
                )}
                <BlogCard blog={blog} index={idx} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E1D8] p-8">
            <BookOpen className="h-10 w-10 text-[#5C5A55] mx-auto mb-3 opacity-50" />
            <h3 className="font-serif-display text-lg font-semibold text-[#1A1A1A]">
              {searchQuery
                ? "No matching activity insights"
                : activeTab === "liked"
                ? "No appreciated insights yet"
                : "No discussion history yet"}
            </h3>
            <p className="font-serif-body text-sm text-[#5C5A55] mt-1 max-w-md mx-auto">
              Explore faculty insights to appreciate articles or participate in academic discussions.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block px-6 py-2.5 rounded-full bg-[#1A1A1A] text-white font-ui text-xs font-semibold hover:bg-[#A84C32] transition-colors"
            >
              Explore Insights
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AllActivityPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center">Loading activity…</div>}>
      <ActivityListContent />
    </Suspense>
  );
}
