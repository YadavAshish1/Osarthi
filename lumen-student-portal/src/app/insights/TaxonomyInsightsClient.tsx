"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Bookmark,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  ArrowUpDown,
  LayoutGrid,
  List,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { InsightSort, TreeNode, ViewMode } from "@/components/FilterBar";
import { ResponsiveSearchableSelect } from "@/components/SearchableFilterPicker";
import InsightsResultsSection from "@/components/insights/InsightsResultsSection";
import { useBookmarkActions } from "@/components/insights/useBookmarkActions";
import type { TaxonomyContext } from "@/lib/insightsTaxonomy";
import { api, BlogItem, mapContentToBlog } from "@/lib/api";

const PAGE_SIZE = 21;
const VALID_SORTS = new Set<InsightSort>(["newest", "popular", "liked", "oldest"]);

interface TaxonomyInsightsClientProps {
  initialBlogs: BlogItem[] | null;
  initialTotal: number;
  initialHasMore: boolean;
  initialPage: number;
  initialTeachers: { id: string; name: string }[];
  popularBlogs?: BlogItem[];
  tree: TreeNode[];
  matchedIds: {
    classId: string;
    subjectId: string;
    topicId: string;
  };
  taxonomyContext: TaxonomyContext;
  initialQuery: {
    q: string;
    teacher_id: string;
    sort?: InsightSort;
  };
}

function normalizeSort(val: string | null): InsightSort {
  if (val && VALID_SORTS.has(val as InsightSort)) return val as InsightSort;
  return "newest";
}

function TaxonomyParamsSync({
  onSync,
}: {
  onSync: (qVal: string, teacherIdVal: string, sortVal: InsightSort, pageVal: number) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const p = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    onSync(
      searchParams.get("q") || "",
      searchParams.get("teacher_id") || "",
      normalizeSort(searchParams.get("sort")),
      p
    );
  }, [searchParams, onSync]);

  return null;
}

export default function TaxonomyInsightsClient({
  initialBlogs,
  initialTotal,
  initialHasMore,
  initialPage,
  initialTeachers,
  popularBlogs = [],
  matchedIds,
  taxonomyContext,
  initialQuery,
}: TaxonomyInsightsClientProps) {
  const router = useRouter();
  const basePath = taxonomyContext.canonicalPath;
  const { user, effectiveBookmarkedIds, bookmarkBusyId, handleToggleBookmark } =
    useBookmarkActions();

  const [searchInput, setSearchInput] = useState(initialQuery.q);
  const [q, setQ] = useState(initialQuery.q);
  const [teacherId, setTeacherId] = useState(initialQuery.teacher_id);
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

  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>(initialTeachers);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const pendingPageScrollRef = useRef(false);

  const initialKeyRef = useRef(
    JSON.stringify({
      q: initialQuery.q,
      teacherId: initialQuery.teacher_id,
      sort: initialQuery.sort || "newest",
      page: initialPage,
      matchedIds,
    })
  );
  const skippedInitialFetchRef = useRef(false);

  const handleSync = useCallback(
    (nextQ: string, nextTeacherId: string, nextSort: InsightSort, nextPage: number) => {
      setSearchInput((prev) => (prev === nextQ ? prev : nextQ));
      setQ((prev) => (prev === nextQ ? prev : nextQ));
      setTeacherId((prev) => (prev === nextTeacherId ? prev : nextTeacherId));
      setSort((prev) => (prev === nextSort ? prev : nextSort));
      setBasePage((prev) => (prev === nextPage ? prev : nextPage));
    },
    []
  );

  useEffect(() => {
    if (initialTeachers.length > 0) return;
    api
      .get("/explore/teachers")
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setTeachers(data.map((t: { _id: string; name: string }) => ({ id: t._id, name: t.name })));
        }
      })
      .catch(() => {});
  }, [initialTeachers.length]);

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 650);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const buildQueryString = useCallback(
    (newQ: string, newTeacherId: string, newSort: InsightSort, pageNum?: number) => {
      const p = new URLSearchParams();
      if (newQ.trim()) p.set("q", newQ.trim());
      if (newTeacherId) p.set("teacher_id", newTeacherId);
      if (newSort !== "newest") p.set("sort", newSort);
      if (pageNum && pageNum > 1) p.set("page", String(pageNum));
      return p.toString();
    },
    []
  );

  const updateUrl = useCallback(
    (newQ: string, newTeacherId: string, newSort: InsightSort, pageNum?: number) => {
      const queryStr = buildQueryString(newQ, newTeacherId, newSort, pageNum);
      router.replace(queryStr ? `${basePath}?${queryStr}` : basePath, { scroll: false });
    },
    [basePath, buildQueryString, router]
  );

  useEffect(() => {
    if (searchInput === q) return;
    const timer = setTimeout(() => {
      setQ(searchInput);
      updateUrl(searchInput, teacherId, sort);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, q, teacherId, sort, updateUrl]);

  const fetchBlogs = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const { data } = await api.get("/explore/blogs", {
          params: {
            search: q || undefined,
            classId: matchedIds.classId || undefined,
            subjectId: matchedIds.subjectId || undefined,
            topicId: matchedIds.topicId || undefined,
            teacherId: teacherId || undefined,
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
        setBlogs([]);
        setTotalCount(0);
        setHasMore(false);
      } catch {
        setBlogs([]);
        setTotalCount(0);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q, matchedIds, teacherId, sort]
  );

  useEffect(() => {
    const currentKey = JSON.stringify({ q, teacherId, sort, page: basePage, matchedIds });
    if (hasInitialData && !skippedInitialFetchRef.current && currentKey === initialKeyRef.current) {
      skippedInitialFetchRef.current = true;
      return;
    }
    setPage(basePage);
    fetchBlogs(basePage, false);
  }, [q, teacherId, sort, basePage, matchedIds, fetchBlogs, hasInitialData]);

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

  const handleClearFilters = () => {
    setSearchInput("");
    setQ("");
    setTeacherId("");
    setSort("newest");
    setBasePage(1);
    updateUrl("", "", "newest");
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setQ("");
    setBasePage(1);
    updateUrl("", teacherId, sort);
  };

  const hasQueryFilter = Boolean(q.trim() || teacherId || sort !== "newest");
  const showSpotlight =
    !loading &&
    viewMode === "grid" &&
    basePage === 1 &&
    !hasQueryFilter &&
    blogs.length >= 4;

  const getPageHref = useCallback(
    (targetPage: number) => {
      const qs = buildQueryString(q, teacherId, sort, targetPage);
      return qs ? `${basePath}?${qs}` : basePath;
    },
    [basePath, buildQueryString, q, teacherId, sort]
  );

  return (
    <>
      <Suspense fallback={null}>
        <TaxonomyParamsSync onSync={handleSync} />
      </Suspense>

      {/* Dedicated Taxonomy Category Hero */}
      <section className="border-b border-[#E5E1D8] bg-gradient-to-b from-[#F5F2EB] via-[#FAF8F5] to-[#FAF8F5]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-10 md:py-14">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 font-ui text-xs text-[#5C5A55] mb-3 sm:mb-4"
          >
            {taxonomyContext.breadcrumbs.map((bc, idx) => (
              <React.Fragment key={`${bc.label}-${idx}`}>
                {idx > 0 && <ChevronRight className="h-3 w-3 text-[#C2BDB2]" />}
                {bc.href ? (
                  <Link href={bc.href} className="hover:text-[#A84C32] hover:underline transition-colors">
                    {bc.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-[#1A1A1A]">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 sm:mb-4">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-ui uppercase tracking-widest bg-white border border-[#E5E1D8] px-3 sm:px-3.5 py-1 rounded-full text-[#A84C32] font-bold shadow-2xs">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{taxonomyContext.eyebrow}</span>
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <Link
                  href="/profile/saved"
                  className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-ui font-semibold text-[#1A1A1A] hover:text-[#A84C32] bg-white border border-[#E5E1D8] hover:border-[#A84C32] px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full transition-colors shadow-2xs"
                >
                  <Bookmark className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#A84C32]" />
                  <span>Saved{effectiveBookmarkedIds.size > 0 ? ` (${effectiveBookmarkedIds.size})` : ""}</span>
                </Link>
              )}
              <Link
                href="/insights"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-ui font-medium text-[#5C5A55] hover:text-[#A84C32] bg-white border border-[#E5E1D8] hover:border-[#A84C32] px-3 py-1 sm:py-1.5 rounded-full transition-colors shadow-2xs"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>All Insights</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 sm:gap-6">
            <div className="max-w-2xl">
              <h1 className="font-serif-display text-[30px] sm:text-5xl lg:text-[52px] leading-[1.1] font-semibold text-[#1A1A1A]">
                {taxonomyContext.title}
                <span className="italic text-[#A84C32]">{taxonomyContext.accentTitle}</span>
              </h1>
              <p className="mt-2 sm:mt-3.5 font-serif-body text-sm sm:text-lg text-[#5C5A55] leading-relaxed line-clamp-2 sm:line-clamp-none">
                {taxonomyContext.description}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 sm:px-3.5 sm:py-2 sm:rounded-xl sm:bg-white sm:border sm:border-[#E5E1D8] sm:shadow-2xs font-ui text-xs text-[#5C5A55] self-start lg:self-end">
              <BookOpen className="h-4 w-4 text-[#A84C32]" />
              <span data-testid="results-count" className="font-semibold text-[#1A1A1A]">
                {loading ? "Loading…" : `${totalCount} insight${totalCount === 1 ? "" : "s"}`}
              </span>
            </div>
          </div>

          {taxonomyContext.childLinks.length > 0 && (
            <nav
              aria-label={taxonomyContext.childLinksLabel || "Related topics"}
              className="mt-4 pt-3.5 border-t border-[#E5E1D8]/70 flex items-center gap-2 overflow-x-auto pb-1 font-ui"
            >
              {taxonomyContext.childLinksLabel && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5A55] shrink-0 mr-1">
                  {taxonomyContext.childLinksLabel}:
                </span>
              )}
              {taxonomyContext.childLinks.map((cl) => (
                <Link
                  key={cl.href}
                  href={cl.href}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                    cl.active
                      ? "bg-[#A84C32] text-white border-[#A84C32]"
                      : "bg-white text-[#1A1A1A] border-[#E5E1D8] hover:border-[#A84C32] hover:text-[#A84C32]"
                  }`}
                >
                  {cl.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      {/* Dedicated Taxonomy Toolbar & Feed */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-12 py-5 sm:py-8 md:py-12">
        <div className="mb-5 sm:mb-8 bg-white border border-[#E5E1D8] rounded-2xl p-2.5 sm:p-4 shadow-2xs font-ui">
          <div className="flex flex-col md:flex-row md:items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5A55] pointer-events-none" />
              <input
                data-testid="taxonomy-search-input"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={`Search within ${taxonomyContext.breadcrumbs[taxonomyContext.breadcrumbs.length - 1]?.label || "category"}…`}
                aria-label="Search within category"
                className="w-full h-10 pl-10 pr-9 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] text-sm text-[#1A1A1A] placeholder:text-[#7A7770] focus:outline-none focus:bg-white focus:border-[#A84C32] transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-[#E5E1D8]/60 flex items-center justify-center text-[#5C5A55] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {teachers.length > 0 && (
                <div className="flex-1 sm:flex-initial">
                  <ResponsiveSearchableSelect
                    testId="taxonomy-filter-teacher"
                    title="Educator"
                    allLabel="All Educators"
                    value={teacherId}
                    options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                    onSelect={(nextTeacher) => {
                      setTeacherId(nextTeacher);
                      setBasePage(1);
                      updateUrl(q, nextTeacher, sort);
                    }}
                  />
                </div>
              )}

              <div className="relative flex-1 sm:flex-initial">
                <ArrowUpDown className="h-3.5 w-3.5 text-[#5C5A55] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  aria-label="Sort insights"
                  value={sort}
                  onChange={(e) => {
                    const nextSort = e.target.value as InsightSort;
                    setSort(nextSort);
                    setBasePage(1);
                    updateUrl(q, teacherId, nextSort);
                  }}
                  className="w-full sm:w-auto h-10 pl-8 pr-7 sm:pl-9 sm:pr-8 rounded-full bg-white border border-[#E5E1D8] text-xs sm:text-sm text-[#1A1A1A] hover:border-[#A84C32] focus:outline-none focus:border-[#A84C32] appearance-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="liked">Most Appreciated</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-[#5C5A55] absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div
                role="group"
                aria-label="View layout"
                className="inline-flex items-center p-1 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-[#A84C32] shadow-2xs"
                      : "text-[#5C5A55] hover:text-[#1A1A1A]"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-[#A84C32] shadow-2xs"
                      : "text-[#5C5A55] hover:text-[#1A1A1A]"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {hasQueryFilter && (
            <div className="mt-2.5 pt-2.5 border-t border-[#E5E1D8]/70 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-[#A84C32] bg-[#A84C32]/10 hover:bg-[#A84C32]/20 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
                Reset category filters
              </button>
            </div>
          )}
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
          onClear={hasQueryFilter ? handleClearFilters : () => router.push("/insights")}
          onClearSearch={handleClearSearch}
          onPaginationClick={handlePaginationClick}
          getPageHref={getPageHref}
          showBackToTop={showBackToTop}
        />
      </section>
    </>
  );
}
