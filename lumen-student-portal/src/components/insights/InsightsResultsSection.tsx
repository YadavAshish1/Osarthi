"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Loader2,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import BlogCard from "@/components/BlogCard";
import EmptyState from "@/components/EmptyState";
import type { ViewMode } from "@/components/FilterBar";
import { BlogItem, FALLBACK_BLOGS } from "@/lib/api";

export function InsightsSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-[#E5E1D8] bg-white overflow-hidden flex flex-row"
          >
            <div className="w-28 sm:w-64 h-28 sm:h-44 bg-[#E5E1D8]/50 shrink-0" />
            <div className="flex-1 p-4 sm:p-6 space-y-3">
              <div className="h-3 w-36 bg-[#E5E1D8]/60 rounded-full" />
              <div className="h-6 w-3/4 bg-[#E5E1D8]/50 rounded" />
              <div className="h-4 w-full bg-[#E5E1D8]/35 rounded hidden sm:block" />
              <div className="h-4 w-24 bg-[#E5E1D8]/40 rounded pt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-[#E5E1D8] bg-white overflow-hidden"
        >
          <div className="aspect-[16/9] sm:aspect-[16/10] bg-[#E5E1D8]/50" />
          <div className="p-4 sm:p-6 space-y-4">
            <div className="h-3 w-28 bg-[#E5E1D8]/60 rounded-full" />
            <div className="space-y-2">
              <div className="h-5 w-full bg-[#E5E1D8]/50 rounded" />
              <div className="h-5 w-3/4 bg-[#E5E1D8]/50 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-[#E5E1D8]/30 rounded" />
              <div className="h-3 w-5/6 bg-[#E5E1D8]/30 rounded" />
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-[#E5E1D8]/50">
              <div className="h-8 w-8 rounded-full bg-[#E5E1D8]/50" />
              <div className="h-3 w-24 bg-[#E5E1D8]/40 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface InsightsResultsSectionProps {
  blogs: BlogItem[];
  totalCount: number;
  pageSize: number;
  page: number;
  basePage: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  viewMode: ViewMode;
  searchQuery: string;
  showSpotlight: boolean;
  popularBlogs?: BlogItem[];
  bookmarkedIds: Set<string>;
  bookmarkBusyId: string | null;
  onToggleBookmark: (blogId: string) => void;
  onLoadMore: () => void;
  onClear: () => void;
  onClearSearch?: () => void;
  onPaginationClick: (targetPage: number) => void;
  getPageHref: (pageNum: number) => string;
  showBackToTop: boolean;
}

export default function InsightsResultsSection({
  blogs,
  totalCount,
  pageSize,
  page,
  basePage,
  hasMore,
  loading,
  loadingMore,
  viewMode,
  searchQuery,
  showSpotlight,
  popularBlogs = [],
  bookmarkedIds,
  bookmarkBusyId,
  onToggleBookmark,
  onLoadMore,
  onClear,
  onClearSearch,
  onPaginationClick,
  getPageHref,
  showBackToTop,
}: InsightsResultsSectionProps) {
  const gridBlogs = showSpotlight ? blogs.slice(1) : blogs;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const prevPageNum = page > 1 ? page - 1 : 1;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 1) return [];
    const pages: (number | "ellipsis")[] = [];
    const delta = 1;
    const rangeStart = Math.max(2, page - delta);
    const rangeEnd = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (rangeStart > 2) pages.push("ellipsis");
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
    if (rangeEnd < totalPages - 1) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  }, [totalPages, page]);

  const startRange = totalCount === 0 ? 0 : (basePage - 1) * pageSize + 1;
  const endRange = Math.min(totalCount, startRange + blogs.length - 1);

  return (
    <>
      {!loading && blogs.length > 0 && (
        <div className="flex items-center justify-between mb-4 sm:mb-6 text-xs font-ui text-[#5C5A55]">
          <p>
            Showing <span className="font-semibold text-[#1A1A1A]">{startRange}–{endRange}</span> of{" "}
            <span className="font-semibold text-[#1A1A1A]">{totalCount}</span> insights
            {searchQuery.trim() ? (
              <>
                {" "}for <span className="font-semibold text-[#A84C32]">&ldquo;{searchQuery.trim()}&rdquo;</span>
              </>
            ) : null}
          </p>
          {totalPages > 1 && (
            <span className="hidden sm:inline">
              Page {page} of {totalPages}
            </span>
          )}
        </div>
      )}

      {loading ? (
        <InsightsSkeleton viewMode={viewMode} />
      ) : blogs.length === 0 ? (
        <EmptyState
          onClear={onClear}
          searchQuery={searchQuery.trim()}
          onClearSearch={searchQuery.trim() ? onClearSearch : undefined}
          recommendedBlogs={popularBlogs.length > 0 ? popularBlogs : FALLBACK_BLOGS.slice(0, 3)}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={onToggleBookmark}
        />
      ) : (
        <div className="space-y-5 sm:space-y-8">
          {showSpotlight && blogs[0] && (
            <BlogCard
              blog={blogs[0]}
              index={0}
              variant="spotlight"
              isBookmarked={bookmarkedIds.has(blogs[0].id)}
              onToggleBookmark={onToggleBookmark}
              bookmarkBusy={bookmarkBusyId === blogs[0].id}
            />
          )}

          {viewMode === "list" ? (
            <div className="space-y-3 sm:space-y-4">
              {gridBlogs.map((b, i) => (
                <BlogCard
                  key={b.id}
                  blog={b}
                  index={i}
                  variant="list"
                  isBookmarked={bookmarkedIds.has(b.id)}
                  onToggleBookmark={onToggleBookmark}
                  bookmarkBusy={bookmarkBusyId === b.id}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-8">
              {gridBlogs.map((b, i) => (
                <BlogCard
                  key={b.id}
                  blog={b}
                  index={showSpotlight ? i + 1 : i}
                  variant="grid"
                  isBookmarked={bookmarkedIds.has(b.id)}
                  onToggleBookmark={onToggleBookmark}
                  bookmarkBusy={bookmarkBusyId === b.id}
                />
              ))}
            </div>
          )}

          {(hasMore || page > 1 || totalPages > 1) && (
            <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-[#E5E1D8] flex flex-col items-center gap-4 sm:gap-5">
              {hasMore && (
                <div className="flex flex-col items-center gap-2.5 sm:gap-3">
                  <div className="w-48 sm:w-52 h-1.5 rounded-full bg-[#E5E1D8] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#A84C32] transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min((endRange / Math.max(totalCount, 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="font-ui text-xs text-[#5C5A55]">
                    Loaded {blogs.length} on this view ({totalCount} total)
                  </p>
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="group flex items-center gap-2.5 px-7 sm:px-8 py-2.5 sm:py-3 rounded-full border border-[#E5E1D8] bg-white font-ui text-sm font-medium text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] hover:shadow-md transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading more insights…
                      </>
                    ) : (
                      <>
                        Discover More
                        <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {totalPages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="flex flex-wrap items-center justify-center gap-1.5 font-ui text-xs"
                >
                  {page > 1 && (
                    <Link
                      href={getPageHref(prevPageNum)}
                      scroll={false}
                      onClick={() => onPaginationClick(prevPageNum)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E5E1D8] bg-white text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </Link>
                  )}

                  {pageNumbers.map((item, idx) =>
                    item === "ellipsis" ? (
                      <span key={`e-${idx}`} className="px-2 text-[#5C5A55]">
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={getPageHref(item)}
                        scroll={false}
                        onClick={() => onPaginationClick(item)}
                        aria-current={item === page ? "page" : undefined}
                        className={`w-8 h-8 rounded-full inline-flex items-center justify-center border transition-colors ${
                          item === page
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A] font-semibold"
                            : "bg-white text-[#5C5A55] border-[#E5E1D8] hover:border-[#A84C32] hover:text-[#A84C32]"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                  {hasMore && (
                    <Link
                      href={getPageHref(page + 1)}
                      scroll={false}
                      onClick={() => onPaginationClick(page + 1)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E5E1D8] bg-white text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </nav>
              )}
            </div>
          )}
        </div>
      )}

      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#1A1A1A]/90 backdrop-blur-xs text-white hover:bg-[#A84C32] shadow-lg flex items-center justify-center transition-all cursor-pointer"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
