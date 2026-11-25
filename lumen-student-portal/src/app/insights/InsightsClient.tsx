"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Layers,
  Bookmark,
  Sparkles,
} from "lucide-react";
import FilterBar, {
  FilterState,
  InsightSort,
  TreeNode,
  ViewMode,
} from "@/components/FilterBar";
import InsightsResultsSection from "@/components/insights/InsightsResultsSection";
import { useBookmarkActions } from "@/components/insights/useBookmarkActions";
import { api, BlogItem, FALLBACK_BLOGS, mapContentToBlog } from "@/lib/api";

const PAGE_SIZE = 21;
const VALID_SORTS = new Set<InsightSort>(["newest", "popular", "liked", "oldest"]);

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
  const { user, effectiveBookmarkedIds, bookmarkBusyId, handleToggleBookmark } =
    useBookmarkActions();

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
  const [showBackToTop, setShowBackToTop] = useState(false);
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

  const scrollToTop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.scrollingElement?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!pendingPageScrollRef.current || loading) return;
    pendingPageScrollRef.current = false;
    const rafId = window.requestAnimationFrame(() => scrollToTop());
    return () => window.cancelAnimationFrame(rafId);
  }, [page, basePage, loading, scrollToTop]);

  const handlePaginationClick = (targetPage: number) => {
    pendingPageScrollRef.current = true;
    scrollToTop();
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

  const getPageHref = useCallback(
    (targetPage: number) => {
      const qs = buildQueryString(q, filters, sort, targetPage);
      return qs ? `/insights?${qs}` : "/insights";
    },
    [buildQueryString, q, filters, sort]
  );

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
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-12 py-5 sm:py-8 md:py-12">
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

        <InsightsResultsSection
          blogs={blogs}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          page={page}
          basePage={basePage}
          hasMore={hasMore}
          loading={loading}
          loadingMore={loadingMore}
          viewMode={viewMode}
          searchQuery={q}
          showSpotlight={showSpotlight}
          popularBlogs={popularBlogs}
          bookmarkedIds={effectiveBookmarkedIds}
          bookmarkBusyId={bookmarkBusyId}
          onToggleBookmark={handleToggleBookmark}
          onLoadMore={() => fetchBlogs(page + 1, true)}
          onClear={handleClear}
          onClearSearch={handleClearSearch}
          onPaginationClick={handlePaginationClick}
          getPageHref={getPageHref}
          showBackToTop={showBackToTop}
        />
      </section>
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
