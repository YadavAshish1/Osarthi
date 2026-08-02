"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, BookmarkX, BookOpen, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, BlogItem, mapContentToBlog } from "@/lib/api";
import BlogCard from "@/components/BlogCard";
import { toast } from "sonner";

export default function AllSavedInsightsPage() {
  const { user, openAuth } = useAuth();
  const [savedBlogs, setSavedBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data } = await api.get("/profile/bookmarks");
        if (Array.isArray(data)) {
          setSavedBlogs(data.map((item: any) => mapContentToBlog(item)));
        }
      } catch (err) {
        console.error("Failed to load saved bookmarks:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleUnsave = async (blogId: string, title: string) => {
    setRemovingId(blogId);
    try {
      await api.post("/profile/bookmarks/toggle", { blogId });
      setSavedBlogs((prev) => prev.filter((b) => b.id !== blogId && (b as any)._id !== blogId));
      toast.info(`"${title.slice(0, 30)}${title.length > 30 ? "…" : ""}" removed from saved insights`);
    } catch {
      toast.error("Failed to remove saved insight.");
    } finally {
      setRemovingId(null);
    }
  };

  const filteredBlogs = savedBlogs.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center font-serif-body">
        <div className="w-16 h-16 rounded-full bg-[#F5F2EB] text-[#A84C32] flex items-center justify-center mx-auto mb-4 border border-[#E5E1D8]">
          <Bookmark className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-[#1A1A1A]">Sign In to View All Saved Insights</h2>
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
      {/* Navigation */}
      <div className="max-w-6xl mx-auto px-6 pt-10 md:pt-16">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55] hover:text-[#A84C32] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Profile
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 pt-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#E5E1D8]">
          <div>
            <div className="flex items-center gap-3 text-[#A84C32] mb-2">
              <Bookmark className="h-6 w-6 fill-[#A84C32]" />
              <span className="text-xs font-ui uppercase tracking-wider font-semibold">
                Saved Collection
              </span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-4xl font-semibold text-[#1A1A1A]">
              All Saved Insights ({savedBlogs.length})
            </h1>
          </div>

          {/* Search Filter */}
          {savedBlogs.length > 0 && (
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5A55]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter saved insights…"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#E5E1D8] font-ui text-xs text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
              />
            </div>
          )}
        </div>
      </header>

      {/* Full Grid Content */}
      <main className="max-w-6xl mx-auto px-6">
        {loading ? (
          <div className="py-16 text-center font-serif-body text-[#5C5A55]">
            Loading saved insights…
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog, idx) => (
              <div key={blog.id} className="relative group/card">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleUnsave(blog.id, blog.title);
                  }}
                  disabled={removingId === blog.id}
                  title="Remove from saved insights"
                  className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs text-[#5C5A55] hover:text-red-600 hover:border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-full text-xs font-ui font-medium border border-[#E5E1D8] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <BookmarkX className="h-3.5 w-3.5 text-[#A84C32]" />
                  <span>{removingId === blog.id ? "Removing…" : "Unsave"}</span>
                </button>

                <BlogCard blog={blog} index={idx} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E1D8] p-8">
            <BookOpen className="h-10 w-10 text-[#5C5A55] mx-auto mb-3 opacity-50" />
            <h3 className="font-serif-display text-lg font-semibold text-[#1A1A1A]">
              {searchQuery ? "No matching saved insights" : "No saved insights yet"}
            </h3>
            <p className="font-serif-body text-sm text-[#5C5A55] mt-1 max-w-md mx-auto">
              {searchQuery
                ? "Try searching for another topic or teacher name."
                : "Explore essays and faculty insights, and click Save to bookmark them for quick access."}
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
