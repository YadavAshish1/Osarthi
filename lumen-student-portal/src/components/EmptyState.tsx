"use client";

import React from "react";
import { BookOpen, RotateCcw, SearchX } from "lucide-react";
import type { BlogItem } from "@/lib/api";
import BlogCard from "@/components/BlogCard";

interface EmptyStateProps {
  onClear?: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  recommendedBlogs?: BlogItem[];
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (blogId: string) => void;
}

export default function EmptyState({
  onClear,
  searchQuery = "",
  onClearSearch,
  recommendedBlogs = [],
  bookmarkedIds,
  onToggleBookmark,
}: EmptyStateProps) {
  return (
    <div data-testid="empty-state" className="my-10 space-y-12">
      <div className="text-center py-16 px-6 max-w-lg mx-auto bg-white border border-[#E5E1D8] rounded-2xl shadow-2xs">
        <div className="w-14 h-14 rounded-full bg-[#A84C32]/10 text-[#A84C32] flex items-center justify-center mx-auto mb-4">
          {searchQuery ? <SearchX className="h-7 w-7" /> : <BookOpen className="h-7 w-7" />}
        </div>
        <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">
          {searchQuery
            ? `No insights found for "${searchQuery}"`
            : "No insights match your filters"}
        </h3>
        <p className="mt-2.5 font-serif-body text-sm text-[#5C5A55] leading-relaxed">
          Try broadening your search terms, checking Hindi/English spelling, or removing one of the selected grade or subject filters.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {searchQuery && onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="px-5 py-2.5 rounded-full border border-[#E5E1D8] bg-[#FAF8F5] text-[#1A1A1A] font-ui text-xs font-semibold hover:border-[#A84C32] hover:text-[#A84C32] transition-colors cursor-pointer"
            >
              Clear Search Only
            </button>
          )}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#1A1A1A] text-white font-ui text-xs font-semibold hover:bg-[#A84C32] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {recommendedBlogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="eyebrow text-[#A84C32]">Keep Exploring</div>
              <h4 className="font-serif-display text-2xl font-semibold text-[#1A1A1A] mt-1">
                Popular Insights You Might Enjoy
              </h4>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedBlogs.slice(0, 3).map((b, i) => (
              <BlogCard
                key={b.id}
                blog={b}
                index={i}
                isBookmarked={bookmarkedIds?.has(b.id)}
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
