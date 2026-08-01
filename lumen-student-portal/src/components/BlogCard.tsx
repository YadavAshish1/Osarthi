"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { BlogItem, getDefaultSubjectCover } from "@/lib/api";

export default function BlogCard({ blog, index = 0 }: { blog: BlogItem; index?: number }) {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <Link
      href={`/blog/${blog.slug || blog.id}`}
      data-testid={`blog-card-${blog.id}`}
      className="group block bg-white border border-[#E5E1D8] rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="aspect-[16/10] overflow-hidden bg-[#F5F2EB] relative">
        <img
          src={blog.cover || getDefaultSubjectCover(blog.subject)}
          alt={blog.title}
          loading="lazy"
          className="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-ui font-medium text-[#1A1A1A] flex items-center gap-1 shadow-xs">
          <Clock className="h-3 w-3 text-[#A84C32]" />
          {blog.read_minutes} min read
        </div>
      </div>

      <div className="p-6 md:p-7 flex flex-col justify-between h-[calc(100%-aspect)]">
        <div>
          <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase font-ui font-bold text-[#A84C32]">
            <span>{blog.subject}</span>
            <span className="text-[#E5E1D8]">•</span>
            <span className="text-[#5C5A55]">{blog.class_level}</span>
          </div>

          <h3 className="mt-3 font-serif-display text-2xl md:text-[26px] leading-snug font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors line-clamp-2">
            {blog.title}
          </h3>

          <p className="mt-3 font-serif-body text-[15px] leading-relaxed text-[#5C5A55] line-clamp-3">
            {blog.excerpt}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E5E1D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {blog.teacher_avatar && !avatarError ? (
              <img
                src={blog.teacher_avatar}
                alt={blog.teacher_name}
                onError={() => setAvatarError(true)}
                className="w-9 h-9 rounded-full object-cover border border-[#E5E1D8] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {blog.teacher_name?.[0] || "T"}
              </div>
            )}
            <div>
              <div className="font-ui text-xs font-semibold text-[#1A1A1A]">
                {blog.teacher_name}
              </div>
              <div className="font-ui text-[11px] text-[#5C5A55]">
                {blog.topic}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
