"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronDown,
  Loader2,
  BookOpen,
  Users,
  Layers,
  Bookmark,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import FilterBar, {
  FilterState,
  InsightSort,
  TreeNode,
  ViewMode,
} from "@/components/FilterBar";
import BlogCard from "@/components/BlogCard";
import EmptyState from "@/components/EmptyState";
import { api, BlogItem, FALLBACK_BLOGS, mapContentToBlog } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const PAGE_SIZE = 21;
const VALID_SORTS = new Set<InsightSort>(["newest", "popular", "liked", "oldest"]);
const EMPTY_BOOKMARK_SET = new Set<string>();

interface InsightsClientProps {
  initialBlogs: BlogItem[] | null;
  initialTotal: number;
  initialHasMore: boolean;
  initialPage: number;
  initialTree: TreeNode[];
  initialTeachers: { id: string; name: string }[];
  popularBlogs?: BlogItem[];
  initialQuery: {
    q: string;
    teacher_id: string;
    class_level: string;
    subject: string;
    topic: string;
    sort?: InsightSort;
  };
}

function normalizeSort(val: string | null): InsightSort {
  if (val && VALID_SORTS.has(val as InsightSort)) return val as InsightSort;
  return "newest";
}

function SearchParamsSync({
  onSync,
}: {
  onSync: (qVal: string, filtersVal: FilterState, sortVal: InsightSort, pageVal: number) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const p = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    onSync(
      searchParams.get("q") || "",
      {
        teacher_id: searchParams.get("teacher_id") || "",
        class_level: searchParams.get("class_level") || "",
        subject: searchParams.get("subject") || "",
        topic: searchParams.get("topic") || "",
      },
      normalizeSort(searchParams.get("sort")),
      p
    );
  }, [searchParams, onSync]);

  return null;
}

function InsightsSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-[#E5E1D8] bg-white overflow-hidden flex flex-col sm:flex-row"
          >
            <div className="sm:w-64 h-44 bg-[#E5E1D8]/50 shrink-0" />
            <div className="flex-1 p-6 space-y-3">
              <div className="h-3 w-36 bg-[#E5E1D8]/60 rounded-full" />
              <div className="h-6 w-3/4 bg-[#E5E1D8]/50 rounded" />
              <div className="h-4 w-full bg-[#E5E1D8]/35 rounded" />
              <div className="h-4 w-24 bg-[#E5E1D8]/40 rounded pt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-[#E5E1D8] bg-white overflow-hidden"
        >
          <div className="aspect-[16/10] bg-[#E5E1D8]/50" />
          <div className="p-6 space-y-4">
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

export default function InsightsClient({
  initialBlogs,
  initialTotal,
  initialHasMore,
  initialPage,
  initialTree,
  initialTeachers,
  popularBlogs = [],
  initialQuery,
}: InsightsClientProps) {
  const router = useRouter();
  const { user, requireAuth } = useAuth();

  const [searchInput, setSearchInput] = useState(initialQuery.q);
  const [q, setQ] = useState(initialQuery.q);
  const [filters, setFilters] = useState<FilterState>({
    teacher_id: initialQuery.teacher_id,
    class_level: initialQuery.class_level,
    subject: initialQuery.subject,
    topic: initialQuery.topic,
  });
  const [sort, setSort] = useState<InsightSort>(initialQuery.sort || "newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const hasInitialData = Array.isArray(initialBlogs);
  const [blogs, setBlogs] = useState<BlogItem[]>(hasInitialData ? initialBlogs : []);
  const [loading, setLoading] = useState(!hasInitialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [basePage, setBasePage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const [tree, setTree] = useState<TreeNode[]>(initialTree);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>(initialTeachers);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkBusyId, setBookmarkBusyId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const feedTopRef = useRef<HTMLElement>(null);
  const pendingPageScrollRef = useRef(false);

  const initialKeyRef = useRef(
    JSON.stringify({
      q: initialQuery.q,
      filters: {
        teacher_id: initialQuery.teacher_id,
        class_level: initialQuery.class_level,
        subject: initialQuery.subject,
        topic: initialQuery.topic,
      },
      sort: initialQuery.sort || "newest",
      page: initialPage,
    })
  );
  const skippedInitialFetchRef = useRef(false);

  const uniqueSubjectCount = useMemo(() => {
    const names = new Set<string>();
    for (const cls of tree) {
      for (const sub of cls.subjects || []) {
        if (sub.name?.trim()) names.add(sub.name.trim().toLowerCase());
      }
    }
    return names.size;
  }, [tree]);

  // Sync URL query params into local state (browser Back/Forward & external search modal)
  const handleSync = useCallback(
    (nextQ: string, nextFilters: FilterState, nextSort: InsightSort, nextPage: number) => {
      setSearchInput((prev) => (prev === nextQ ? prev : nextQ));
      setQ((prevQ) => (prevQ === nextQ ? prevQ : nextQ));
      setFilters((prev) =>
        prev.teacher_id === nextFilters.teacher_id &&
          prev.class_level === nextFilters.class_level &&
          prev.subject === nextFilters.subject &&
          prev.topic === nextFilters.topic
          ? prev
          : nextFilters
      );
      setSort((prev) => (prev === nextSort ? prev : nextSort));
      setBasePage((prev) => (prev === nextPage ? prev : nextPage));
    },
    []
  );

  // Hydrate filter metadata client-side only if SSR didn't receive it
  useEffect(() => {
    if (initialTree.length > 0 && initialTeachers.length > 0) return;
    (async () => {
      try {
        const [treeRes, teachersRes] = await Promise.all([
          api.get("/explore/tree"),
          api.get("/explore/teachers").catch(() => ({ data: [] })),
        ]);
        if (Array.isArray(treeRes.data)) setTree(treeRes.data);
        if (Array.isArray(teachersRes.data)) {
          setTeachers(
            teachersRes.data.map((t: { _id: string; name: string }) => ({ id: t._id, name: t.name }))
          );
        }
      } catch {
        // silent
      }
    })();
  }, [initialTree.length, initialTeachers.length]);

  // Hydrate logged-in user's saved bookmarks
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/profile/activity");
        if (!active || !data) return;
        const ids = new Set<string>(
          (data.savedBlogs || []).map((b: { _id?: string; id?: string }) => b._id || b.id || "")
        );
        ids.delete("");
        setBookmarkedIds(ids);
      } catch {
        // silent
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const effectiveBookmarkedIds = user ? bookmarkedIds : EMPTY_BOOKMARK_SET;

  // Show floating "Back to top" button when scrolled down
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 650);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const buildQueryString = useCallback(
    (newQ: string, newFilters: FilterState, newSort: InsightSort, pageNum?: number) => {
      const p = new URLSearchParams();
      if (newQ.trim()) p.set("q", newQ.trim());
      if (newFilters.teacher_id) p.set("teacher_id", newFilters.teacher_id);
      if (newFilters.class_level) p.set("class_level", newFilters.class_level);
      if (newFilters.subject) p.set("subject", newFilters.subject);
      if (newFilters.topic) p.set("topic", newFilters.topic);
      if (newSort !== "newest") p.set("sort", newSort);
      if (pageNum && pageNum > 1) p.set("page", String(pageNum));
      return p.toString();
    },
    []
  );

  const updateUrl = useCallback(
    (newQ: string, newFilters: FilterState, newSort: InsightSort, pageNum?: number) => {
      const queryStr = buildQueryString(newQ, newFilters, newSort, pageNum);
      router.replace(queryStr ? `/insights?${queryStr}` : "/insights", { scroll: false });
    },
    [buildQueryString, router]
  );

  // Debounce inline search input -> q + URL update
  useEffect(() => {
    if (searchInput === q) return;
    const timer = setTimeout(() => {
      setQ(searchInput);
      updateUrl(searchInput, filters, sort);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, q, filters, sort, updateUrl]);

  const fetchBlogs = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const { data } = await api.get("/explore/blogs", {
          params: {
            search: q || undefined,
            classId: filters.class_level || undefined,
            subjectId: filters.subject || undefined,
            topicId: filters.topic || undefined,
            teacherId: filters.teacher_id || undefined,
            sort,
            page: pageNum,
            limit: PAGE_SIZE,
          },
        });

        if (data && Array.isArray(data.items)) {
          const mapped = data.items.map(mapContentToBlog);
          setBlogs((prev) => (append ? [...prev, ...mapped] : mapped));
          setTotalCount(data.total || 0);
          setHasMore(data.hasMore ?? false);
          setPage(pageNum);
          return;
        }

        const fb = filterFallbackData(q, filters);
        setBlogs(fb);
        setTotalCount(fb.length);
        setHasMore(false);
      } catch {
        const fb = filterFallbackData(q, filters);
        setBlogs(fb);
        setTotalCount(fb.length);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q, filters, sort]
  );

  useEffect(() => {
    const currentKey = JSON.stringify({ q, filters, sort, page: basePage });
    if (hasInitialData && !skippedInitialFetchRef.current && currentKey === initialKeyRef.current) {
      skippedInitialFetchRef.current = true;
      return;
    }
    setPage(basePage);
    fetchBlogs(basePage, false);
  }, [q, filters, sort, basePage, fetchBlogs, hasInitialData]);

  const handleLoadMore = () => fetchBlogs(page + 1, true);

  const scrollToFeedTop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.scrollingElement?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!pendingPageScrollRef.current || loading) return;
    pendingPageScrollRef.current = false;
    const rafId = window.requestAnimationFrame(() => {
      scrollToFeedTop();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [page, basePage, loading, scrollToFeedTop]);

  const handlePaginationClick = (targetPage: number) => {
    pendingPageScrollRef.current = true;
    scrollToFeedTop();
    // If "Discover More" extended current view without changing basePage, clicking basePage (e.g. Page 1) won't change URL
    if (targetPage === basePage && page !== targetPage) {
      setPage(targetPage);
      fetchBlogs(targetPage, false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setBasePage(1);
    updateUrl(q, newFilters, sort);
  };

  const handleSortChange = (newSort: InsightSort) => {
    setSort(newSort);
    setBasePage(1);
    updateUrl(q, filters, newSort);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setQ("");
    setBasePage(1);
    updateUrl("", filters, sort);
  };

  const handleClear = () => {
    setSearchInput("");
    setQ("");
    const emptyFilters = { teacher_id: "", class_level: "", subject: "", topic: "" };
    setFilters(emptyFilters);
    setSort("newest");
    setBasePage(1);
    updateUrl("", emptyFilters, "newest");
  };

  const handleToggleBookmark = async (blogId: string) => {
    if (!user) {
      requireAuth();
      return;
    }

    const wasSaved = bookmarkedIds.has(blogId);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(blogId);
      else next.add(blogId);
      return next;
    });
    setBookmarkBusyId(blogId);

    try {
      const { data } = await api.post("/profile/bookmarks/toggle", { blogId });
      toast.success(data?.saved ? "Saved to your reading list" : "Removed from saved insights");
    } catch {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(blogId);
        else next.delete(blogId);
        return next;
      });
      toast.error("Could not update bookmark. Please try again.");
    } finally {
      setBookmarkBusyId(null);
    }
  };

  const hasAnyFilterOrSearch = Boolean(
    q.trim() ||
    filters.teacher_id ||
    filters.class_level ||
    filters.subject ||
    filters.topic ||
    sort !== "newest"
  );

  const showSpotlight =
    !loading &&
    viewMode === "grid" &&
    basePage === 1 &&
    !hasAnyFilterOrSearch &&
    blogs.length >= 4;

  const gridBlogs = showSpotlight ? blogs.slice(1) : blogs;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const nextQueryStr = buildQueryString(q, filters, sort, page + 1);
  const nextPageHref = `/insights?${nextQueryStr}`;
  const prevPageNum = page > 1 ? page - 1 : 1;
  const prevQueryStr = buildQueryString(q, filters, sort, prevPageNum);
  const prevPageHref = prevQueryStr ? `/insights?${prevQueryStr}` : "/insights";

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

  const startRange = totalCount === 0 ? 0 : (basePage - 1) * PAGE_SIZE + 1;
  const endRange = Math.min(totalCount, startRange + blogs.length - 1);

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsSync onSync={handleSync} />
      </Suspense>

      {/* Editorial Hero */}
      <section className="border-b border-[#E5E1D8] bg-gradient-to-b from-[#F5F2EB] via-[#FAF8F5] to-[#FAF8F5]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 md:py-14">
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-ui uppercase tracking-widest bg-white border border-[#E5E1D8] px-3 sm:px-3.5 py-1 rounded-full text-[#A84C32] font-bold shadow-2xs">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>The Reading Room</span>
            </div>

            {user && (
              <Link
                href="/profile/saved"
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-ui font-semibold text-[#1A1A1A] hover:text-[#A84C32] bg-white border border-[#E5E1D8] hover:border-[#A84C32] px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-colors shadow-2xs"
              >
                <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#A84C32]" />
                <span>Saved{effectiveBookmarkedIds.size > 0 ? ` (${effectiveBookmarkedIds.size})` : ""}</span>
              </Link>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 sm:gap-6">
            <div className="max-w-2xl">
              <h1 className="font-serif-display text-[30px] sm:text-5xl lg:text-[54px] leading-[1.1] font-semibold text-[#1A1A1A]">
                Insights written by teachers,{" "}
                <span className="italic text-[#A84C32]">for curious minds.</span>
              </h1>
              <p className="mt-2 sm:mt-3.5 font-serif-body text-sm sm:text-lg text-[#5C5A55] leading-relaxed line-clamp-2 sm:line-clamp-none">
                Explore chapter-wise study notes, conceptual explanations, and literary guides across NCERT, CBSE, and UP Board.
              </p>
            </div>

            {/* Live Directory Metrics: single compact line on mobile, cards on sm+ */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-2.5 font-ui text-xs text-[#5C5A55]">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 sm:px-3.5 sm:py-2 sm:rounded-xl sm:bg-white sm:border sm:border-[#E5E1D8] sm:shadow-2xs">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#A84C32]" />
                <span data-testid="results-count" className="font-semibold text-[#1A1A1A]">
                  {loading
                    ? "Loading…"
                    : `${totalCount} insight${totalCount === 1 ? "" : "s"}`}
                </span>
              </div>
              {teachers.length > 0 && (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 sm:px-3.5 sm:py-2 sm:rounded-xl sm:bg-white sm:border sm:border-[#E5E1D8] sm:shadow-2xs">
                  <span className="sm:hidden text-[#D5CFC2]">•</span>
                  <Users className="hidden sm:block h-4 w-4 text-[#A84C32]" />
                  <span>{teachers.length} Educators</span>
                </div>
              )}
              {uniqueSubjectCount > 0 && (
                <div className="inline-flex items-center gap-1.5 sm:gap-2 sm:px-3.5 sm:py-2 sm:rounded-xl sm:bg-white sm:border sm:border-[#E5E1D8] sm:shadow-2xs">
                  <span className="sm:hidden text-[#D5CFC2]">•</span>
                  <Layers className="hidden sm:block h-4 w-4 text-[#A84C32]" />
                  <span>{uniqueSubjectCount} Subjects</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Discovery Bar & Feed */}
      <section ref={feedTopRef} className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-12 py-5 sm:py-8 md:py-12 scroll-mt-24">
        <div className="mb-5 sm:mb-8">
          <FilterBar
            tree={tree}
            teachers={teachers}
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClear}
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            sort={sort}
            onSortChange={handleSortChange}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalCount={totalCount}
            loading={loading}
          />
        </div>

        {/* Status Summary Row */}
        {!loading && blogs.length > 0 && (
          <div className="flex items-center justify-between mb-4 sm:mb-6 text-xs font-ui text-[#5C5A55]">
            <p>
              Showing <span className="font-semibold text-[#1A1A1A]">{startRange}–{endRange}</span> of{" "}
              <span className="font-semibold text-[#1A1A1A]">{totalCount}</span> insights
              {q.trim() ? (
                <>
                  {" "}for <span className="font-semibold text-[#A84C32]">&ldquo;{q.trim()}&rdquo;</span>
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
            onClear={handleClear}
            searchQuery={q.trim()}
            onClearSearch={q.trim() ? handleClearSearch : undefined}
            recommendedBlogs={popularBlogs.length > 0 ? popularBlogs : FALLBACK_BLOGS.slice(0, 3)}
            bookmarkedIds={effectiveBookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />
        ) : (
          <div className="space-y-5 sm:space-y-8">
            {showSpotlight && blogs[0] && (
              <BlogCard
                blog={blogs[0]}
                index={0}
                variant="spotlight"
                isBookmarked={effectiveBookmarkedIds.has(blogs[0].id)}
                onToggleBookmark={handleToggleBookmark}
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
                    isBookmarked={effectiveBookmarkedIds.has(b.id)}
                    onToggleBookmark={handleToggleBookmark}
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
                    isBookmarked={effectiveBookmarkedIds.has(b.id)}
                    onToggleBookmark={handleToggleBookmark}
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
                      onClick={handleLoadMore}
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
                        href={prevPageHref}
                        scroll={false}
                        onClick={() => handlePaginationClick(prevPageNum)}
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
                          href={(() => {
                            const qs = buildQueryString(q, filters, sort, item);
                            return qs ? `/insights?${qs}` : "/insights";
                          })()}
                          scroll={false}
                          onClick={() => handlePaginationClick(item)}
                          aria-current={item === page ? "page" : undefined}
                          className={`w-8 h-8 rounded-full inline-flex items-center justify-center border transition-colors ${item === page
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
                        href={nextPageHref}
                        scroll={false}
                        onClick={() => handlePaginationClick(page + 1)}
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
      </section>

      {/* Floating Back to Top */}
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

function filterFallbackData(q: string, filters: FilterState): BlogItem[] {
  return FALLBACK_BLOGS.filter((b) => {
    if (q) {
      const qLower = q.toLowerCase();
      if (
        !b.title.toLowerCase().includes(qLower) &&
        !b.excerpt.toLowerCase().includes(qLower) &&
        !b.teacher_name.toLowerCase().includes(qLower) &&
        !b.topic.toLowerCase().includes(qLower)
      )
        return false;
    }
    if (filters.teacher_id && b.teacher_id !== filters.teacher_id) return false;
    if (filters.class_level && b.class_level !== filters.class_level) return false;
    if (filters.subject && b.subject !== filters.subject) return false;
    if (filters.topic && b.topic !== filters.topic) return false;
    return true;
  });
}
