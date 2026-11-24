"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Loader2, BookOpen } from "lucide-react";
import FilterBar, { FilterState, TreeNode } from "@/components/FilterBar";
import BlogCard from "@/components/BlogCard";
import EmptyState from "@/components/EmptyState";
import { api, BlogItem, FALLBACK_BLOGS, mapContentToBlog } from "@/lib/api";

const PAGE_SIZE = 21;

interface InsightsClientProps {
  initialBlogs: BlogItem[] | null;
  initialTotal: number;
  initialHasMore: boolean;
  initialPage: number;
  initialTree: TreeNode[];
  initialTeachers: { id: string; name: string }[];
  initialQuery: {
    q: string;
    teacher_id: string;
    class_level: string;
    subject: string;
    topic: string;
  };
}

function SearchParamsSync({
  onSync,
}: {
  onSync: (qVal: string, filtersVal: FilterState) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onSync(searchParams.get("q") || "", {
      teacher_id: searchParams.get("teacher_id") || "",
      class_level: searchParams.get("class_level") || "",
      subject: searchParams.get("subject") || "",
      topic: searchParams.get("topic") || "",
    });
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
  initialQuery,
}: InsightsClientProps) {
  const router = useRouter();

  const [q, setQ] = useState(initialQuery.q);
  const [filters, setFilters] = useState<FilterState>({
    teacher_id: initialQuery.teacher_id,
    class_level: initialQuery.class_level,
    subject: initialQuery.subject,
    topic: initialQuery.topic,
  });

  const hasInitialData = Array.isArray(initialBlogs);
  const [blogs, setBlogs] = useState<BlogItem[]>(hasInitialData ? initialBlogs : []);
  const [loading, setLoading] = useState(!hasInitialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const [tree, setTree] = useState<TreeNode[]>(initialTree);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>(initialTeachers);

  const initialKeyRef = useRef(
    JSON.stringify({ q: initialQuery.q, filters: {
      teacher_id: initialQuery.teacher_id,
      class_level: initialQuery.class_level,
      subject: initialQuery.subject,
      topic: initialQuery.topic,
    }})
  );
  const skippedInitialFetchRef = useRef(false);

  const handleSync = useCallback((nextQ: string, nextFilters: FilterState) => {
    setQ((prevQ) => (prevQ === nextQ ? prevQ : nextQ));
    setFilters((prev) =>
      prev.teacher_id === nextFilters.teacher_id &&
      prev.class_level === nextFilters.class_level &&
      prev.subject === nextFilters.subject &&
      prev.topic === nextFilters.topic
        ? prev
        : nextFilters
    );
  }, []);

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

  const fetchBlogs = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1 && !append) setLoading(true);
      else setLoadingMore(true);

      try {
        const { data } = await api.get("/explore/blogs", {
          params: {
            search: q || undefined,
            classId: filters.class_level || undefined,
            subjectId: filters.subject || undefined,
            topicId: filters.topic || undefined,
            teacherId: filters.teacher_id || undefined,
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
    [q, filters]
  );

  useEffect(() => {
    const currentKey = JSON.stringify({ q, filters });
    if (hasInitialData && !skippedInitialFetchRef.current && currentKey === initialKeyRef.current) {
      skippedInitialFetchRef.current = true;
      return;
    }
    setPage(1);
    fetchBlogs(1, false);
  }, [q, filters, fetchBlogs, hasInitialData]);

  const handleLoadMore = () => fetchBlogs(page + 1, true);

  const buildQueryString = (newQ: string, newFilters: FilterState, pageNum?: number) => {
    const p = new URLSearchParams();
    if (newQ) p.set("q", newQ);
    if (newFilters.teacher_id) p.set("teacher_id", newFilters.teacher_id);
    if (newFilters.class_level) p.set("class_level", newFilters.class_level);
    if (newFilters.subject) p.set("subject", newFilters.subject);
    if (newFilters.topic) p.set("topic", newFilters.topic);
    if (pageNum && pageNum > 1) p.set("page", String(pageNum));
    return p.toString();
  };

  const updateUrl = (newQ: string, newFilters: FilterState) => {
    const queryStr = buildQueryString(newQ, newFilters);
    router.replace(queryStr ? `/insights?${queryStr}` : "/insights", { scroll: false });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    updateUrl(q, newFilters);
  };

  const handleClear = () => {
    setQ("");
    const emptyFilters = { teacher_id: "", class_level: "", subject: "", topic: "" };
    setFilters(emptyFilters);
    updateUrl("", emptyFilters);
  };

  const nextQueryStr = buildQueryString(q, filters, page + 1);
  const nextPageHref = `/insights?${nextQueryStr}`;
  const prevQueryStr = initialPage > 1 ? buildQueryString(q, filters, initialPage - 1) : "";
  const prevPageHref = prevQueryStr ? `/insights?${prevQueryStr}` : "/insights";

  return (
    <>
      <Suspense fallback={null}>
        <SearchParamsSync onSync={handleSync} />
      </Suspense>

      {/* Page Hero */}
      <section className="border-b border-[#E5E1D8] bg-[#FAF8F5]">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-14 md:py-20">
          <div className="eyebrow text-[#A84C32] mb-3">The Reading Room</div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl leading-tight font-medium text-[#1A1A1A] max-w-2xl">
              Insights written by teachers,{" "}
              <span className="italic text-[#A84C32]">for curious minds.</span>
            </h1>
            <div className="flex items-center gap-2 font-ui text-sm text-[#5C5A55]">
              <BookOpen className="h-4 w-4 text-[#A84C32]" />
              <span data-testid="results-count">
                {loading
                  ? "Loading..."
                  : totalCount > 0
                  ? `${totalCount} insight${totalCount === 1 ? "" : "s"}`
                  : "0 insights"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-12 py-12 md:py-16">
        <div className="mb-10">
          <FilterBar
            tree={tree}
            teachers={teachers}
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClear}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-[#E5E1D8] bg-white overflow-hidden"
              >
                <div className="h-48 bg-[#E5E1D8]/50" />
                <div className="p-6 space-y-4">
                  <div className="h-3 w-20 bg-[#E5E1D8]/60 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-5 w-full bg-[#E5E1D8]/50 rounded" />
                    <div className="h-5 w-3/4 bg-[#E5E1D8]/50 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-[#E5E1D8]/30 rounded" />
                    <div className="h-3 w-5/6 bg-[#E5E1D8]/30 rounded" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-8 w-8 rounded-full bg-[#E5E1D8]/50" />
                    <div className="h-3 w-24 bg-[#E5E1D8]/40 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <EmptyState onClear={handleClear} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((b, i) => (
                <BlogCard key={b.id} blog={b} index={i} />
              ))}
            </div>

            {(hasMore || initialPage > 1) && (
              <div className="mt-16 flex flex-col items-center gap-4">
                {hasMore && (
                  <>
                    <div className="w-48 h-1 rounded-full bg-[#E5E1D8] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#A84C32] transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min((blogs.length / Math.max(totalCount, 1)) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="font-ui text-xs text-[#5C5A55]">
                      {blogs.length} of {totalCount} insights
                    </p>
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="group flex items-center gap-2.5 px-8 py-3 rounded-full border border-[#E5E1D8] bg-white font-ui text-sm font-medium text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] hover:shadow-md transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Discover More
                          <ChevronDown className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </>
                )}

                <nav aria-label="Pagination" className="flex items-center gap-4 font-ui text-xs text-[#5C5A55]">
                  {initialPage > 1 && (
                    <Link href={prevPageHref} className="hover:text-[#A84C32] hover:underline">
                      ← Previous Page
                    </Link>
                  )}
                  {hasMore && (
                    <Link href={nextPageHref} className="hover:text-[#A84C32] hover:underline">
                      Next Page (Page {page + 1}) →
                    </Link>
                  )}
                </nav>
              </div>
            )}
          </>
        )}
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
