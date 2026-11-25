"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Heart,
  Eye,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { BlogItem, getDefaultSubjectCover } from "@/lib/api";

export interface BlogCardProps {
  blog: BlogItem;
  index?: number;
  variant?: "grid" | "list" | "spotlight";
  isBookmarked?: boolean;
  onToggleBookmark?: (blogId: string) => void;
  bookmarkBusy?: boolean;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function formatCompactCount(num?: number): string {
  if (!num || num <= 0) return "";
  if (num >= 1000) {
    return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return String(num);
}

function formatPublishedDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return DATE_FORMATTER.format(d);
}

export default function BlogCard({
  blog,
  index = 0,
  variant = "grid",
  isBookmarked = false,
  onToggleBookmark,
  bookmarkBusy = false,
}: BlogCardProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const href = `/blog/${blog.slug || blog.id}`;
  const fallbackCover = getDefaultSubjectCover(blog.subject, blog.title || blog.id);
  const coverSrc = !coverError && blog.cover ? blog.cover : fallbackCover;
  const formattedDate = formatPublishedDate(blog.created_at);
  const likesStr = formatCompactCount(blog.likes_count);
  const viewsStr = formatCompactCount(blog.views_count);

  const renderAuthorFooter = (compact = false) => (
    <div
      className={`flex items-center justify-between gap-2.5 ${
        compact ? "pt-2.5 sm:pt-3 mt-auto" : "mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-[#E5E1D8]"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        {blog.teacher_avatar && !avatarError ? (
          <img
            src={blog.teacher_avatar}
            alt={blog.teacher_name}
            onError={() => setAvatarError(true)}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#E5E1D8] shrink-0"
          />
        ) : (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[11px] sm:text-xs font-bold uppercase shrink-0">
            {blog.teacher_name?.[0] || "T"}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-ui text-xs font-semibold text-[#1A1A1A] truncate">
            {blog.teacher_name}
          </div>
          <div className="font-ui text-[10px] sm:text-[11px] text-[#5C5A55] flex items-center gap-1.5 truncate">
            {formattedDate ? <span>{formattedDate}</span> : null}
            {!formattedDate && blog.topic ? <span>{blog.topic}</span> : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 relative z-10">
        {(likesStr || viewsStr) && (
          <div className="flex items-center gap-2 text-[11px] font-ui text-[#5C5A55] mr-0.5">
            {viewsStr && (
              <span className="inline-flex items-center gap-1" title={`${blog.views_count} views`}>
                <Eye className="h-3 w-3 text-[#7A7770]" />
                {viewsStr}
              </span>
            )}
            {likesStr && (
              <span className="inline-flex items-center gap-1" title={`${blog.likes_count} appreciations`}>
                <Heart className="h-3 w-3 text-[#A84C32]" />
                {likesStr}
              </span>
            )}
          </div>
        )}

        {onToggleBookmark && (
          <button
            type="button"
            disabled={bookmarkBusy}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBookmark(blog.id);
            }}
            aria-label={isBookmarked ? "Remove from saved insights" : "Save insight"}
            title={isBookmarked ? "Saved to your reading list" : "Save to reading list"}
            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer disabled:opacity-50 ${
              isBookmarked
                ? "bg-[#A84C32]/10 border-[#A84C32]/40 text-[#A84C32]"
                : "bg-[#FAF8F5] border-[#E5E1D8] text-[#5C5A55] hover:border-[#A84C32] hover:text-[#A84C32]"
            }`}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-3.5 w-3.5 fill-[#A84C32]/20" />
            ) : (
              <Bookmark className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  const renderTaxonomyMeta = () => (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-ui">
      {blog.subject && (
        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full bg-[#A84C32]/10 text-[#A84C32] font-bold tracking-wider uppercase">
          {blog.subject}
        </span>
      )}
      {blog.class_level && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F5F2EB] text-[#5C5A55] font-semibold">
          {blog.class_level}
        </span>
      )}
      {blog.topic && (
        <span className="text-[#5C5A55] font-medium truncate max-w-[140px] sm:max-w-[180px]" title={blog.topic}>
          • {blog.topic}
        </span>
      )}
    </div>
  );

  if (variant === "spotlight") {
    return (
      <article
        data-testid={`blog-card-${blog.id}`}
        className="group relative bg-white border border-[#E5E1D8] rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-[#D5CFC2] transition-all duration-300 grid grid-cols-1 lg:grid-cols-12"
      >
        <div className="lg:col-span-7 aspect-[16/9] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[340px] overflow-hidden bg-[#F5F2EB] relative">
          <img
            src={coverSrc}
            alt={blog.title}
            width={800}
            height={500}
            loading="eager"
            fetchPriority="high"
            onError={() => setCoverError(true)}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-600 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#1A1A1A]/90 backdrop-blur-xs text-white font-ui text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase shadow-sm">
            <Sparkles className="h-3 w-3 text-[#E8927C]" />
            Featured Spotlight
          </div>
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-xs px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-ui font-medium text-[#1A1A1A] flex items-center gap-1 shadow-xs">
            <Clock className="h-3 w-3 text-[#A84C32]" />
            {blog.read_minutes} min read
          </div>
        </div>

        <div className="lg:col-span-5 p-4 sm:p-8 lg:p-9 flex flex-col justify-between">
          <div>
            {renderTaxonomyMeta()}
            <h2 className="mt-3 sm:mt-4 pt-0.5 font-serif-display text-2xl sm:text-3xl lg:text-[34px] leading-[1.35] font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors">
              <Link
                href={href}
                className="after:absolute after:inset-0 focus:outline-none focus-visible:underline"
              >
                {blog.title}
              </Link>
            </h2>
            <p className="mt-2.5 sm:mt-3.5 font-serif-body text-sm sm:text-[15px] leading-relaxed text-[#5C5A55] line-clamp-2 sm:line-clamp-4">
              {blog.excerpt}
            </p>
            <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 font-ui text-xs font-semibold text-[#A84C32] group-hover:gap-2 transition-all">
              Read full insight
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {renderAuthorFooter()}
        </div>
      </article>
    );
  }

  if (variant === "list") {
    return (
      <article
        data-testid={`blog-card-${blog.id}`}
        className="group relative bg-white border border-[#E5E1D8] rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-[#D5CFC2] transition-all duration-200 flex flex-row items-stretch"
      >
        <div className="w-28 sm:w-56 md:w-64 self-stretch sm:min-h-[172px] shrink-0 overflow-hidden bg-[#F5F2EB] relative">
          <img
            src={coverSrc}
            alt={blog.title}
            width={400}
            height={250}
            loading={index < 4 ? "eager" : "lazy"}
            onError={() => setCoverError(true)}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-xs px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-ui font-medium text-[#1A1A1A] flex items-center gap-0.5 sm:gap-1 shadow-xs">
            <Clock className="h-2.5 w-2.5 text-[#A84C32]" />
            {blog.read_minutes}m
          </div>
        </div>

        <div className="flex-1 p-3.5 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            {renderTaxonomyMeta()}
            <h3 className="mt-1.5 sm:mt-2.5 pt-1 font-serif-display text-lg sm:text-2xl leading-[1.42] sm:leading-[1.48] font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors line-clamp-2">
              <Link
                href={href}
                className="after:absolute after:inset-0 focus:outline-none focus-visible:underline"
              >
                {blog.title}
              </Link>
            </h3>
            <p className="hidden sm:block mt-2 font-serif-body text-sm leading-relaxed text-[#5C5A55] line-clamp-2">
              {blog.excerpt}
            </p>
          </div>

          {renderAuthorFooter(true)}
        </div>
      </article>
    );
  }

  return (
    <article
      data-testid={`blog-card-${blog.id}`}
      className="group relative flex flex-col h-full bg-white border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#D5CFC2] transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="aspect-[16/9] sm:aspect-[16/10] overflow-hidden bg-[#F5F2EB] relative shrink-0">
        <img
          src={coverSrc}
          alt={blog.title}
          width={640}
          height={400}
          loading={index < 3 ? "eager" : "lazy"}
          fetchPriority={index < 3 ? "high" : undefined}
          onError={() => setCoverError(true)}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-ui font-medium text-[#1A1A1A] flex items-center gap-1 shadow-xs">
          <Clock className="h-3 w-3 text-[#A84C32]" />
          {blog.read_minutes} min read
        </div>
      </div>

      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {renderTaxonomyMeta()}

          <h3 className="mt-2.5 sm:mt-3 pt-1 font-serif-display text-[22px] sm:text-2xl md:text-[25px] leading-[1.45] sm:leading-[1.48] font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors line-clamp-2">
            <Link
              href={href}
              className="after:absolute after:inset-0 focus:outline-none focus-visible:underline"
            >
              {blog.title}
            </Link>
          </h3>

          <p className="mt-2 sm:mt-2.5 font-serif-body text-sm sm:text-[15px] leading-relaxed text-[#5C5A55] line-clamp-2 sm:line-clamp-3">
            {blog.excerpt}
          </p>
        </div>

        {renderAuthorFooter()}
      </div>
    </article>
  );
}
