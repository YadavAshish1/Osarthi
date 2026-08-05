"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import QuoteBanner from "@/components/QuoteBanner";
import FilterBar, { FilterState, TreeNode } from "@/components/FilterBar";
import BlogCard from "@/components/BlogCard";
import EmptyState from "@/components/EmptyState";
import { api, BlogItem, FALLBACK_BLOGS, mapContentToBlog } from "@/lib/api";
import BecomeTeacherBanner from "@/components/BecomeTeacherBanner";

const PAGE_SIZE = 21;

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") || "";
  const teacherParam = searchParams.get("teacher_id") || "";
  const classParam = searchParams.get("class_level") || "";
  const subjectParam = searchParams.get("subject") || "";
  const topicParam = searchParams.get("topic") || "";

  const [q, setQ] = useState(qParam);
  const [filters, setFilters] = useState<FilterState>({
    teacher_id: teacherParam,
    class_level: classParam,
    subject: subjectParam,
    topic: topicParam,
  });

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Taxonomy tree & teachers for cascading filters
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  // Sync state from searchParams
  useEffect(() => {
    setQ(searchParams.get("q") || "");
    setFilters({
      teacher_id: searchParams.get("teacher_id") || "",
      class_level: searchParams.get("class_level") || "",
      subject: searchParams.get("subject") || "",
      topic: searchParams.get("topic") || "",
    });
  }, [searchParams]);

  // Fetch tree + teachers once
  useEffect(() => {
    (async () => {
      try {
        const [treeRes, teachersRes] = await Promise.all([
          api.get("/explore/tree"),
          api.get("/explore/teachers").catch(() => ({ data: [] })),
        ]);

        if (Array.isArray(treeRes.data)) {
          setTree(treeRes.data);
        }

        if (Array.isArray(teachersRes.data)) {
          setTeachers(
            teachersRes.data.map((t: any) => ({ id: t._id, name: t.name }))
          );
        }
      } catch {
        // silent — filters will just be empty
      }
    })();
  }, []);

  // Fetch blogs with pagination
  const fetchBlogs = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

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

        // Fallback: try /api/blogs
        const res2 = await api.get("/blogs", {
          params: {
            q: q || undefined,
            teacher_id: filters.teacher_id || undefined,
            class_level: filters.class_level || undefined,
            subject: filters.subject || undefined,
            topic: filters.topic || undefined,
          },
        });
        if (Array.isArray(res2.data)) {
          setBlogs(res2.data);
          setTotalCount(res2.data.length);
          setHasMore(false);
        } else {
          const fb = filterFallbackData(q, filters);
          setBlogs(fb);
          setTotalCount(fb.length);
          setHasMore(false);
        }
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

  // When filters/query change → reset to page 1
  useEffect(() => {
    setPage(1);
    fetchBlogs(1, false);
  }, [fetchBlogs]);

  const handleLoadMore = () => {
    fetchBlogs(page + 1, true);
  };

  const updateUrl = (newQ: string, newFilters: FilterState) => {
    const p = new URLSearchParams();
    if (newQ) p.set("q", newQ);
    if (newFilters.teacher_id) p.set("teacher_id", newFilters.teacher_id);
    if (newFilters.class_level) p.set("class_level", newFilters.class_level);
    if (newFilters.subject) p.set("subject", newFilters.subject);
    if (newFilters.topic) p.set("topic", newFilters.topic);

    const queryStr = p.toString();
    router.replace(queryStr ? `/?${queryStr}` : "/", { scroll: false });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    updateUrl(q, newFilters);
  };

  const handleClear = () => {
    setQ("");
    const emptyFilters = {
      teacher_id: "",
      class_level: "",
      subject: "",
      topic: "",
    };
    setFilters(emptyFilters);
    updateUrl("", emptyFilters);
  };

  return (
    <>
      <QuoteBanner />
      <section className="max-w-screen-xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <div className="eyebrow text-[#A84C32] mb-3">The Reading Room</div>
            <h2 className="font-serif-display text-4xl sm:text-5xl lg:text-6xl leading-tight font-medium text-[#1A1A1A] max-w-2xl">
              Insights written by teachers, for the ones learning to think.
            </h2>
          </div>
          <div
            className="font-ui text-sm text-[#5C5A55] font-medium"
            data-testid="results-count"
          >
            {loading
              ? "Searching..."
              : totalCount > 0
                ? `Showing ${blogs.length} of ${totalCount} insight${totalCount === 1 ? "" : "s"}`
                : "0 insights"}
          </div>
        </div>

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

            {/* Load More Section */}
            {hasMore && (
              <div className="mt-16 flex flex-col items-center gap-4">
                {/* Progress bar */}
                <div className="w-48 h-1 rounded-full bg-[#E5E1D8] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#A84C32] transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min((blogs.length / totalCount) * 100, 100)}%`,
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
              </div>
            )}
          </>
        )}
      </section>
      <BecomeTeacherBanner />
    </>
  );
}

function filterFallbackData(q: string, filters: FilterState): BlogItem[] {
  return FALLBACK_BLOGS.filter((b) => {
    if (q) {
      const qLower = q.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(qLower);
      const matchExcerpt = b.excerpt.toLowerCase().includes(qLower);
      const matchTeacher = b.teacher_name.toLowerCase().includes(qLower);
      const matchTopic = b.topic.toLowerCase().includes(qLower);
      if (!matchTitle && !matchExcerpt && !matchTeacher && !matchTopic) return false;
    }
    if (filters.teacher_id && b.teacher_id !== filters.teacher_id) return false;
    if (filters.class_level && b.class_level !== filters.class_level) return false;
    if (filters.subject && b.subject !== filters.subject) return false;
    if (filters.topic && b.topic !== filters.topic) return false;
    return true;
  });
}
