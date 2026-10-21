"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  X,
  Clock,
  Sparkles,
  BookOpen,
  User as UserIcon,
  Tag,
  ArrowRight,
  Loader2,
  ExternalLink,
  GraduationCap,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { api, mapContentToBlog, BlogItem } from "@/lib/api";
import { trackSearch } from "@/lib/gtag";

interface SearchTeacher {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  role?: string;
  blogsCount?: number;
  subjects?: string[];
}

interface SearchTopic {
  _id: string;
  name: string;
  type: "topic" | "subject";
  subjectName?: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const RECENT_SEARCHES_KEY = "medhashine_recent_searches";

export default function GlobalSearchModal({
  isOpen,
  onClose,
  initialQuery = "",
}: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "blogs" | "teachers" | "topics">("all");
  const [loading, setLoading] = useState(false);

  // Recommendations data (for empty query)
  const [recommendations, setRecommendations] = useState<{
    popularSearches: string[];
    teachers: SearchTeacher[];
    blogs: BlogItem[];
    topics: SearchTopic[];
  } | null>(null);

  // Search results data (for typed query)
  const [results, setResults] = useState<{
    teachers: SearchTeacher[];
    blogs: BlogItem[];
    topics: SearchTopic[];
    totalCount: number;
  } | null>(null);

  // Recent searches stored in localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Keyboard navigation active index
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== term);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRecentSearches([]);
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Fetch initial recommendations when opened
  useEffect(() => {
    if (isOpen) {
      // Focus input
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);

      // Fetch recommendations if not yet loaded
      if (!recommendations) {
        api
          .get("/explore/search")
          .then(({ data }) => {
            const mappedBlogs = Array.isArray(data.blogs)
              ? data.blogs.map((b: any) => mapContentToBlog(b))
              : [];
            setRecommendations({
              popularSearches: data.popularSearches || [],
              teachers: data.teachers || [],
              blogs: mappedBlogs,
              topics: data.topics || [],
            });
          })
          .catch(() => {
            // fallback gracefully
          });
      }
    }
  }, [isOpen, recommendations]);

  // Handle live search with debouncing
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    setSelectedIndex(-1);

    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get(`/explore/search?q=${encodeURIComponent(trimmed)}`);
        const mappedBlogs = Array.isArray(data.blogs)
          ? data.blogs.map((b: any) => mapContentToBlog(b))
          : [];

        setResults({
          teachers: data.teachers || [],
          blogs: mappedBlogs,
          topics: data.topics || [],
          totalCount: data.totalCount || 0,
        });
      } catch {
        setResults({
          teachers: [],
          blogs: [],
          topics: [],
          totalCount: 0,
        });
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Compute all visible items for keyboard navigation
  const visibleItems = React.useMemo(() => {
    if (!results || !query.trim()) return [];

    const items: Array<{
      type: "teacher" | "blog" | "topic";
      id: string;
      url: string;
      title: string;
    }> = [];

    if (activeTab === "all" || activeTab === "teachers") {
      results.teachers.forEach((t) => {
        items.push({
          type: "teacher",
          id: t._id,
          url: `/teachers/${t._id}`,
          title: t.name,
        });
      });
    }

    if (activeTab === "all" || activeTab === "blogs") {
      results.blogs.forEach((b) => {
        items.push({
          type: "blog",
          id: b.id,
          url: `/blog/${b.slug || b.id}`,
          title: b.title,
        });
      });
    }

    if (activeTab === "all" || activeTab === "topics") {
      results.topics.forEach((top) => {
        const param = top.type === "topic" ? `topic=${top._id}` : `subject=${encodeURIComponent(top.name)}`;
        items.push({
          type: "topic",
          id: top._id,
          url: `/insights?${param}`,
          title: top.name,
        });
      });
    }

    return items;
  }, [results, query, activeTab]);

  const handleSelect = (url: string, term?: string) => {
    if (term) {
      saveRecentSearch(term);
      trackSearch(term);
    } else if (query.trim()) {
      saveRecentSearch(query.trim());
      trackSearch(query.trim());
    }
    onClose();
    router.push(url);
  };

  const handleFullSearch = (searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    saveRecentSearch(term);
    trackSearch(term);
    onClose();
    router.push(`/insights?q=${encodeURIComponent(term)}`);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (visibleItems.length === 0) return;
      setSelectedIndex((prev) => (prev + 1) % visibleItems.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (visibleItems.length === 0) return;
      setSelectedIndex((prev) => (prev <= 0 ? visibleItems.length - 1 : prev - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < visibleItems.length) {
        handleSelect(visibleItems[selectedIndex].url, visibleItems[selectedIndex].title);
      } else if (query.trim()) {
        handleFullSearch(query);
      }
    }
  };

  // Highlight matching substring helper
  const highlightMatch = (text: string, search: string) => {
    if (!search || !text) return text;
    const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark
              key={i}
              className="bg-[#A84C32]/15 text-[#A84C32] font-semibold rounded-xs px-0.5"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 md:pt-20 px-3 sm:px-4 bg-black/55 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FAF8F5] rounded-2xl sm:rounded-3xl border border-[#E5E1D8] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative p-3.5 sm:p-5 border-b border-[#E5E1D8] bg-white flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] shrink-0">
            {loading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin text-[#A84C32]" />
            ) : (
              <Search className="h-4.5 w-4.5 text-[#A84C32]" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search insights, teachers, topics..."
            className="flex-1 bg-transparent border-none text-[#1A1A1A] placeholder:text-[#5C5A55]/60 text-sm sm:text-base font-ui focus:outline-none focus:ring-0"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[#E5E1D8]">
            <kbd className="px-2 py-1 text-[11px] font-mono font-medium text-[#5C5A55] bg-[#FAF8F5] border border-[#E5E1D8] rounded-md shadow-2xs">
              ESC
            </kbd>
          </div>
        </div>

        {/* Filter Tabs (when searching and results exist) */}
        {results && query.trim() && (
          <div className="px-4 py-2 border-b border-[#E5E1D8] bg-[#FAF8F5] flex items-center gap-2 overflow-x-auto text-xs font-ui">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-[#1A1A1A] text-white font-medium shadow-2xs"
                  : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:border-[#1A1A1A]"
              }`}
            >
              <span>All</span>
              <span className="opacity-75">({results.totalCount})</span>
            </button>

            {results.blogs.length > 0 && (
              <button
                onClick={() => setActiveTab("blogs")}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeTab === "blogs"
                    ? "bg-[#1A1A1A] text-white font-medium shadow-2xs"
                    : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:border-[#1A1A1A]"
                }`}
              >
                <BookOpen className="h-3 w-3" />
                <span>Insights</span>
                <span className="opacity-75">({results.blogs.length})</span>
              </button>
            )}

            {results.teachers.length > 0 && (
              <button
                onClick={() => setActiveTab("teachers")}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeTab === "teachers"
                    ? "bg-[#1A1A1A] text-white font-medium shadow-2xs"
                    : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:border-[#1A1A1A]"
                }`}
              >
                <UserIcon className="h-3 w-3" />
                <span>Teachers</span>
                <span className="opacity-75">({results.teachers.length})</span>
              </button>
            )}

            {results.topics.length > 0 && (
              <button
                onClick={() => setActiveTab("topics")}
                className={`px-3 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                  activeTab === "topics"
                    ? "bg-[#1A1A1A] text-white font-medium shadow-2xs"
                    : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:border-[#1A1A1A]"
                }`}
              >
                <Tag className="h-3 w-3" />
                <span>Topics</span>
                <span className="opacity-75">({results.topics.length})</span>
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* CASE 1: EMPTY QUERY (Popular & Recommendations) */}
          {!query.trim() && (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider uppercase text-[#5C5A55] flex items-center gap-1.5 font-ui">
                      <Clock className="h-3.5 w-3.5 text-[#A84C32]" />
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-[#5C5A55] hover:text-[#A84C32] transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        onClick={() => {
                          setQuery(term);
                          handleFullSearch(term);
                        }}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E1D8] hover:border-[#A84C32] text-xs font-ui text-[#1A1A1A] cursor-pointer transition-all hover:shadow-2xs"
                      >
                        <Clock className="h-3 w-3 text-[#5C5A55] group-hover:text-[#A84C32]" />
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, term)}
                          className="ml-0.5 text-[#5C5A55] hover:text-red-500 transition-colors"
                          title="Remove from history"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              {recommendations?.popularSearches && recommendations.popularSearches.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold tracking-wider uppercase text-[#5C5A55] flex items-center gap-1.5 font-ui">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Popular Searches
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.popularSearches.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setQuery(tag);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E1D8] hover:bg-[#FAF8F5] hover:border-[#A84C32] hover:text-[#A84C32] text-xs font-ui text-[#1A1A1A] transition-all flex items-center gap-1.5 shadow-2xs group"
                      >
                        <TrendingUp className="h-3 w-3 text-[#5C5A55] group-hover:text-[#A84C32] transition-colors" />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Teachers */}
              {recommendations?.teachers && recommendations.teachers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider uppercase text-[#5C5A55] flex items-center gap-1.5 font-ui">
                      <GraduationCap className="h-3.5 w-3.5 text-[#A84C32]" />
                      Verified Educators
                    </span>
                    <button
                      onClick={() => handleSelect("/teachers")}
                      className="text-xs text-[#A84C32] hover:underline font-ui flex items-center gap-1 font-medium"
                    >
                      View all teachers <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {recommendations.teachers.map((teacher) => (
                      <div
                        key={teacher._id}
                        onClick={() => handleSelect(`/teachers/${teacher._id}`, teacher.name)}
                        className="p-3 rounded-xl bg-white border border-[#E5E1D8] hover:border-[#A84C32] transition-all cursor-pointer flex items-center gap-3 group hover:shadow-2xs"
                      >
                        {teacher.avatar ? (
                          <img
                            src={teacher.avatar}
                            alt={teacher.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#E5E1D8] shrink-0 group-hover:ring-2 group-hover:ring-[#A84C32]/30 transition-all"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center font-serif text-sm font-semibold text-[#A84C32] shrink-0">
                            {teacher.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#1A1A1A] truncate group-hover:text-[#A84C32] transition-colors">
                            {teacher.name}
                          </h4>
                          <p className="text-xs text-[#5C5A55] truncate font-ui">
                            {teacher.subjects && teacher.subjects.length > 0
                              ? teacher.subjects.slice(0, 2).join(", ")
                              : teacher.role || "Faculty"}
                          </p>
                        </div>
                        <span className="text-[11px] font-medium text-[#5C5A55] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E5E1D8] shrink-0 font-ui">
                          {teacher.blogsCount || 0} notes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Insights */}
              {recommendations?.blogs && recommendations.blogs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wider uppercase text-[#5C5A55] flex items-center gap-1.5 font-ui">
                      <BookOpen className="h-3.5 w-3.5 text-[#A84C32]" />
                      Trending Insights
                    </span>
                    <button
                      onClick={() => handleSelect("/insights")}
                      className="text-xs text-[#A84C32] hover:underline font-ui flex items-center gap-1 font-medium"
                    >
                      Browse all <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recommendations.blogs.slice(0, 4).map((blog) => (
                      <div
                        key={blog.id}
                        onClick={() => handleSelect(`/blog/${blog.slug || blog.id}`, blog.title)}
                        className="p-3 rounded-xl bg-white border border-[#E5E1D8] hover:border-[#A84C32] transition-all cursor-pointer flex items-center gap-3.5 group hover:shadow-2xs"
                      >
                        {blog.cover ? (
                          <img
                            src={blog.cover}
                            alt={blog.title}
                            className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#E5E1D8]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] shrink-0">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {blog.subject && (
                              <span className="text-[10px] uppercase font-semibold text-[#A84C32] tracking-wider font-ui">
                                {blog.subject}
                              </span>
                            )}
                            {blog.read_minutes && (
                              <span className="text-[11px] text-[#5C5A55] font-ui">
                                • {blog.read_minutes} min read
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-serif-display font-medium text-[#1A1A1A] truncate group-hover:text-[#A84C32] transition-colors">
                            {blog.title}
                          </h4>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#5C5A55] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CASE 2: SEARCH QUERY RESULTS */}
          {query.trim() && results && (
            <div className="space-y-6">
              {/* No results state */}
              {results.totalCount === 0 && !loading && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center text-[#5C5A55]">
                    <Search className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif-display text-lg text-[#1A1A1A]">
                    No direct matches for &ldquo;{query}&rdquo;
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5C5A55] font-ui max-w-sm mx-auto">
                    Try searching with broader terms or check out our full reading room.
                  </p>
                  <button
                    onClick={() => handleFullSearch(query)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#A84C32] text-white text-xs font-ui font-medium hover:bg-[#8C3A27] transition-all shadow-2xs mt-2"
                  >
                    <span>Search all in Insights</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* 1. TEACHERS MATCH */}
              {(activeTab === "all" || activeTab === "teachers") && results.teachers.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#5C5A55] font-ui">
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 text-[#A84C32]" />
                      Educators & Faculty ({results.teachers.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {results.teachers.map((teacher, idx) => {
                      const itemIndex = visibleItems.findIndex(
                        (item) => item.type === "teacher" && item.id === teacher._id
                      );
                      const isSelected = itemIndex === selectedIndex;

                      return (
                        <div
                          key={teacher._id}
                          onClick={() => handleSelect(`/teachers/${teacher._id}`, teacher.name)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${
                            isSelected
                              ? "bg-[#FAF8F5] border-[#A84C32] ring-2 ring-[#A84C32]/20"
                              : "bg-white border-[#E5E1D8] hover:border-[#A84C32] hover:shadow-2xs"
                          }`}
                        >
                          {teacher.avatar ? (
                            <img
                              src={teacher.avatar}
                              alt={teacher.name}
                              className="w-10 h-10 rounded-full object-cover border border-[#E5E1D8] shrink-0 group-hover:ring-2 group-hover:ring-[#A84C32]/30 transition-all"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center font-serif text-sm font-semibold text-[#A84C32] shrink-0">
                              {teacher.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-[#1A1A1A] truncate group-hover:text-[#A84C32] transition-colors">
                              {highlightMatch(teacher.name, query)}
                            </h4>
                            <p className="text-xs text-[#5C5A55] truncate font-ui">
                              {teacher.subjects && teacher.subjects.length > 0
                                ? teacher.subjects.slice(0, 2).join(", ")
                                : teacher.role || "Verified Faculty"}
                            </p>
                          </div>
                          <span className="text-[11px] font-medium text-[#5C5A55] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E5E1D8] shrink-0 font-ui">
                            {teacher.blogsCount || 0} notes
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. BLOGS / INSIGHTS MATCH */}
              {(activeTab === "all" || activeTab === "blogs") && results.blogs.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#5C5A55] font-ui">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[#A84C32]" />
                      Insights & Articles ({results.blogs.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {results.blogs.map((blog) => {
                      const itemIndex = visibleItems.findIndex(
                        (item) => item.type === "blog" && item.id === blog.id
                      );
                      const isSelected = itemIndex === selectedIndex;

                      return (
                        <div
                          key={blog.id}
                          onClick={() => handleSelect(`/blog/${blog.slug || blog.id}`, blog.title)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 group ${
                            isSelected
                              ? "bg-[#FAF8F5] border-[#A84C32] ring-2 ring-[#A84C32]/20"
                              : "bg-white border-[#E5E1D8] hover:border-[#A84C32] hover:shadow-2xs"
                          }`}
                        >
                          {blog.cover ? (
                            <img
                              src={blog.cover}
                              alt={blog.title}
                              className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#E5E1D8]"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] shrink-0">
                              <BookOpen className="h-5 w-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {blog.subject && (
                                <span className="text-[10px] uppercase font-semibold text-[#A84C32] tracking-wider font-ui">
                                  {blog.subject}
                                </span>
                              )}
                              {blog.class_level && (
                                <span className="text-[10px] text-[#5C5A55] font-ui">
                                  • {blog.class_level}
                                </span>
                              )}
                              {blog.read_minutes && (
                                <span className="text-[10px] text-[#5C5A55] font-ui">
                                  • {blog.read_minutes}m read
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-serif-display font-medium text-[#1A1A1A] truncate group-hover:text-[#A84C32] transition-colors">
                              {highlightMatch(blog.title, query)}
                            </h4>
                            {blog.teacher_name && (
                              <p className="text-[11px] text-[#5C5A55] truncate font-ui mt-0.5">
                                By {blog.teacher_name}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-[#5C5A55] opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. TOPICS & SUBJECTS MATCH */}
              {(activeTab === "all" || activeTab === "topics") && results.topics.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#5C5A55] font-ui">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-[#A84C32]" />
                      Topics & Subjects ({results.topics.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.topics.map((top) => {
                      const itemIndex = visibleItems.findIndex(
                        (item) => item.type === "topic" && item.id === top._id
                      );
                      const isSelected = itemIndex === selectedIndex;
                      const param =
                        top.type === "topic"
                          ? `topic=${top._id}`
                          : `subject=${encodeURIComponent(top.name)}`;

                      return (
                        <div
                          key={top._id}
                          onClick={() => handleSelect(`/insights?${param}`, top.name)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                            isSelected
                              ? "bg-[#FAF8F5] border-[#A84C32] ring-2 ring-[#A84C32]/20"
                              : "bg-white border-[#E5E1D8] hover:border-[#A84C32] hover:shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] shrink-0">
                              <Tag className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-medium text-[#1A1A1A] truncate group-hover:text-[#A84C32] transition-colors">
                                {highlightMatch(top.name, query)}
                              </h5>
                              <span className="text-[10px] text-[#5C5A55] capitalize font-ui">
                                {top.type} {top.subjectName ? `• ${top.subjectName}` : ""}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] text-[#A84C32] font-ui font-medium shrink-0 group-hover:underline">
                            Browse →
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="px-4 py-3 bg-[#FAF8F5] border-t border-[#E5E1D8] flex items-center justify-between text-xs text-[#5C5A55] font-ui">
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E1D8] rounded text-[10px] font-mono shadow-2xs">
                ↑↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E1D8] rounded text-[10px] font-mono shadow-2xs">
                ↵
              </kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-[#E5E1D8] rounded text-[10px] font-mono shadow-2xs">
                ESC
              </kbd>
              <span>to close</span>
            </span>
          </div>

          {query.trim() && (
            <button
              onClick={() => handleFullSearch(query)}
              className="ml-auto inline-flex items-center gap-1.5 text-[#A84C32] hover:text-[#8C3A27] font-medium transition-colors cursor-pointer group"
            >
              <span>View all results for &ldquo;{query}&rdquo;</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
