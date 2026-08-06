"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Heart, Share2, Check, Bookmark, BookmarkCheck, BookmarkX, MoreVertical } from "lucide-react";
import { api, BlogItem, CommentItem, FALLBACK_BLOGS, mapContentToBlog, getTeacherSlug } from "@/lib/api";
import { renderMarkedText, mediaUrl } from "@/lib/renderMarks";
import CommentThread from "@/components/CommentThread";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function BlogDetailClient({
  id,
  slug,
  initialBlog,
}: {
  id: string;
  slug: string;
  initialBlog: BlogItem | null;
}) {
  const { user, requireAuth } = useAuth();

  const [blog, setBlog] = useState<BlogItem | null>(initialBlog);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(!initialBlog);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialBlog?.likes_count || 0);
  const [avatarError, setAvatarError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync bookmark & like status with backend if user is authenticated
  useEffect(() => {
    if (!user || !blog?.id) return;
    (async () => {
      try {
        const { data } = await api.get("/profile/activity");
        if (data) {
          const isSaved = Array.isArray(data.savedBlogs) && data.savedBlogs.some((b: any) => (b._id || b.id) === blog.id);
          const isLiked = Array.isArray(data.likedBlogs) && data.likedBlogs.some((b: any) => (b._id || b.id) === blog.id);
          setBookmarked(isSaved);
          setLiked(isLiked);
        }
      } catch {}
    })();
  }, [user, blog?.id]);

  const toggleBookmarkApi = async () => {
    const targetBlogId = blog?.id || (blog as any)?._id || id.match(/([a-f0-9]{24})$/)?.[1] || id;
    if (!targetBlogId) return;
    try {
      const { data } = await api.post("/profile/bookmarks/toggle", { blogId: targetBlogId });
      setBookmarked(data.saved);
      if (data.saved) {
        toast.success("Saved to your profile bookmarks!");
      } else {
        toast.info("Removed from bookmarks.");
      }
    } catch {
      toast.error("Failed to update bookmarks.");
    }
  };

  const handleBookmark = () => {
    const isAuthed = requireAuth(() => {
      toggleBookmarkApi();
    });
    if (isAuthed) {
      toggleBookmarkApi();
    }
  };

  const toggleLikeApi = async () => {
    const blogId = blog?.id || (blog as any)?._id || id.match(/([a-f0-9]{24})$/)?.[1] || id;
    if (!blogId) return;
    const nextLiked = !liked;
    const nextCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setLiked(nextLiked);
    setLikesCount(nextCount);

    try {
      await api.post("/profile/likes/toggle", { blogId });
      if (nextLiked) {
        toast.success("Appreciated this insight! ❤️");
      }
    } catch {
      // optimistic fallback
    }
  };

  const toggleLike = () => {
    const isAuthed = requireAuth(() => {
      toggleLikeApi();
    });
    if (isAuthed) {
      toggleLikeApi();
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: blog?.title || "Medhashine Insight",
      text: blog?.excerpt || "Check out this insight on Medhashine",
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  // Update browser document.title dynamically when blog is loaded
  useEffect(() => {
    if (blog?.title) {
      document.title = `${blog.title} | Medhashine Student Portal`;
    }
  }, [blog]);

  // Load comments from our backend /api/comments/blog/:blogId
  const loadComments = useCallback(async () => {
    try {
      const { data } = await api.get(`/comments/blog/${id}`);
      if (Array.isArray(data)) setComments(data);
    } catch {
      setComments([]);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      if (!initialBlog) {
        setLoading(true);
      }
      try {
        const { data } = await api.get(`/explore/blogs/${id}`);
        if (data && data.title) {
          const mapped = mapContentToBlog(data);
          setBlog(mapped);
          setLiked(!!data.user_liked);
          setLikesCount(data.likes_count || 0);
          await loadComments();
          setLoading(false);
          return;
        }
      } catch { }

      if (!initialBlog) {
        const fallback = FALLBACK_BLOGS.find((b) => b.id === id || b.slug === slug) || FALLBACK_BLOGS[0];
        setBlog(fallback);
        setLikesCount(fallback.likes_count || 12);
        setLoading(false);
      } else {
        await loadComments();
        setLoading(false);
      }
    })();
  }, [id, slug, initialBlog, loadComments]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 font-serif-body text-[#5C5A55] text-center">
        Loading essay…
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center font-serif-body">
        <h2 className="text-2xl text-[#1A1A1A]">Essay not found.</h2>
        <Link href="/" className="mt-4 inline-block text-[#A84C32] font-ui text-sm hover:underline">
          Return to Reading Room
        </Link>
      </div>
    );
  }

  const hasBlocks = blog.blocks && blog.blocks.length > 0;
  const contentParagraphs = !hasBlocks ? (blog.content || "").split("\n\n") : [];

  return (
    <article className="pb-24" data-testid="blog-detail">
      <div className="max-w-3xl mx-auto px-6 pt-10 md:pt-16">
        <Link
          href="/"
          data-testid="back-to-home"
          className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55] hover:text-[#A84C32] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to insights
        </Link>
      </div>

      <header className="max-w-3xl mx-auto px-6 pt-8 pb-10">
        <div className="eyebrow text-[#A84C32] mb-4 flex items-center gap-2">
          <span>{blog.subject}</span>
          <span className="text-[#E5E1D8]">•</span>
          <span>{blog.topic}</span>
          <span className="text-[#E5E1D8]">•</span>
          <span className="text-[#5C5A55]">{blog.class_level}</span>
        </div>

        <h1
          data-testid="blog-title"
          className="font-serif-display text-4xl sm:text-5xl lg:text-6xl leading-[1.1] font-semibold text-[#1A1A1A]"
        >
          {blog.title}
        </h1>

        <p className="mt-6 font-serif-body italic text-xl text-[#5C5A55] leading-relaxed">
          {blog.excerpt}
        </p>

        <div className="mt-8 pt-6 border-t border-[#E5E1D8] relative">
          {/* Desktop & Tablet Layout (md:flex) */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href={`/teachers/${getTeacherSlug(blog.teacher_id, blog.teacher_name)}`}
                data-testid="author-avatar-link"
                className="shrink-0 group"
                title={`View ${blog.teacher_name}'s profile`}
              >
                {blog.teacher_avatar && !avatarError ? (
                  <img
                    src={blog.teacher_avatar}
                    alt={blog.teacher_name}
                    onError={() => setAvatarError(true)}
                    className="w-12 h-12 rounded-full object-cover border border-[#E5E1D8] group-hover:border-[#A84C32] transition-colors"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-sm font-bold uppercase group-hover:bg-[#A84C32] transition-colors">
                    {blog.teacher_name?.[0] || "T"}
                  </div>
                )}
              </Link>
              <div>
                <Link
                  href={`/teachers/${getTeacherSlug(blog.teacher_id, blog.teacher_name)}`}
                  data-testid="author-name-link"
                  className="font-ui text-sm font-semibold text-[#1A1A1A] hover:text-[#A84C32] transition-colors inline-block"
                  title={`View ${blog.teacher_name}'s profile`}
                >
                  {blog.teacher_name}
                </Link>
                <div className="font-ui text-xs text-[#5C5A55]">
                  Published on{" "}
                  {new Date(blog.created_at || Date.now()).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 font-ui text-xs text-[#5C5A55] bg-[#F5F2EB] px-3 py-1.5 rounded-full">
                <Clock className="h-3.5 w-3.5 text-[#A84C32]" />
                <span>{blog.read_minutes} min read</span>
              </div>

              <button
                onClick={handleBookmark}
                data-testid="desktop-bookmark-button"
                title={bookmarked ? "Click to unsave this insight" : "Save insight"}
                className={`flex items-center gap-1.5 font-ui text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                  bookmarked
                    ? "bg-[#F5F2EB] border-[#A84C32] text-[#A84C32] font-semibold hover:bg-red-50 hover:border-red-500 hover:text-red-600"
                    : "bg-white border-[#E5E1D8] text-[#5C5A55] hover:border-[#A84C32] hover:text-[#A84C32]"
                }`}
              >
                {bookmarked ? (
                  <>
                    <BookmarkCheck className="h-3.5 w-3.5 fill-[#A84C32] text-[#A84C32]" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5 text-[#5C5A55]" />
                    <span>Save</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                data-testid="header-share-button"
                title="Share this insight"
                className="flex items-center gap-1.5 font-ui text-xs text-[#5C5A55] bg-white border border-[#E5E1D8] px-3.5 py-1.5 rounded-full hover:border-[#A84C32] hover:text-[#A84C32] transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-700 font-medium">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 text-[#A84C32]" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Layout (md:hidden) */}
          <div className="flex md:hidden items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link
                href={`/teachers/${getTeacherSlug(blog.teacher_id, blog.teacher_name)}`}
                className="shrink-0"
                title={`View ${blog.teacher_name}'s profile`}
              >
                {blog.teacher_avatar && !avatarError ? (
                  <img
                    src={blog.teacher_avatar}
                    alt={blog.teacher_name}
                    onError={() => setAvatarError(true)}
                    className="w-11 h-11 rounded-full object-cover border border-[#E5E1D8]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold uppercase">
                    {blog.teacher_name?.[0] || "T"}
                  </div>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/teachers/${getTeacherSlug(blog.teacher_id, blog.teacher_name)}`}
                  className="font-ui text-sm font-semibold text-[#1A1A1A] truncate block hover:text-[#A84C32] transition-colors"
                >
                  {blog.teacher_name}
                </Link>
                <div className="font-ui text-[11px] text-[#5C5A55] flex items-center gap-2 flex-wrap mt-0.5">
                  <span>
                    {new Date(blog.created_at || Date.now()).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#A84C32] font-medium">
                    <Clock className="h-3 w-3" />
                    {blog.read_minutes} min read
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Vertical Dots Menu Button on Mobile */}
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                data-testid="mobile-3dots-menu-button"
                aria-label="More options"
                className="p-2 rounded-full border border-[#E5E1D8] bg-white text-[#5C5A55] hover:text-[#A84C32] hover:border-[#A84C32] transition-colors cursor-pointer active:scale-95"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E5E1D8] rounded-xl shadow-lg z-50 py-1.5 font-ui text-xs animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        handleBookmark();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#F5F2EB] text-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      {bookmarked ? (
                        <>
                          <BookmarkX className="h-4 w-4 text-[#A84C32]" />
                          <span className="font-medium text-[#A84C32]">Unsave Insight</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-4 w-4 text-[#5C5A55]" />
                          <span className="font-medium">Save Insight</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        handleShare();
                        setMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#F5F2EB] text-[#1A1A1A] transition-colors cursor-pointer"
                    >
                      <Share2 className="h-4 w-4 text-[#A84C32]" />
                      <span className="font-medium">Share Insight</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Essay Body */}
      <div className="max-w-3xl mx-auto px-6 font-serif-body text-lg md:text-xl leading-relaxed text-[#2A2A2A] space-y-6">
        {hasBlocks ? (
          blog.blocks!.map((block) => (
            <div key={block.id} style={{ textAlign: (block as any).align || "left" }}>
              {block.type === "heading" && (
                <h2 className={`font-serif-display font-semibold text-[#1A1A1A] pt-6 pb-2 border-b border-[#E5E1D8]/60 ${
                  block.level === 1 ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
                }`}>
                  {block.text}
                </h2>
              )}
              {block.type === "paragraph" && (
                <p className="leading-relaxed" style={{ whiteSpace: "pre-wrap" }}>
                  {renderMarkedText(block.text || "", block.marks || [])}
                </p>
              )}
              {block.type === "quote" && (
                <blockquote className="border-l-4 border-[#A84C32] pl-4 italic text-[#5C5A55]">
                  {block.text}
                </blockquote>
              )}
              {block.type === "list" && (
                block.ordered ? (
                  <ol className="list-decimal pl-6 space-y-1">
                    {block.items?.map((item, i) => <li key={i}>{item}</li>)}
                  </ol>
                ) : (
                  <ul className="list-disc pl-6 space-y-1">
                    {block.items?.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )
              )}
              {block.type === "divider" && <hr className="border-[#E5E1D8]" />}
              {block.type === "part" && (
                <div className="py-2 text-center text-3xl font-bold tracking-[0.5em] text-[#5C5A55]">· · ·</div>
              )}
              {/* Inline images — hover scale animation */}
              {block.type === "image" && block.url && (
                <figure className="group/img">
                  <div className="overflow-hidden rounded-xl">
                    <img
                      src={mediaUrl(block.url)}
                      alt={block.caption || ""}
                      className="max-h-96 w-full object-cover transition-transform duration-500 ease-out group-hover/img:scale-105"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="mt-2 text-center text-sm text-[#5C5A55]">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              )}
              {block.type === "video" && block.url && (
                <video src={mediaUrl(block.url)} controls className="w-full rounded-xl" />
              )}
            </div>
          ))
        ) : (
          contentParagraphs.map((para, i) => {
            if (para.startsWith("## ")) {
              return (
                <h2
                  key={i}
                  className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A] pt-6 pb-2 border-b border-[#E5E1D8]/60"
                >
                  {para.replace("## ", "")}
                </h2>
              );
            }
            if (para.startsWith("> ")) {
              return (
                <blockquote
                  key={i}
                  className="border-l-4 border-[#A84C32] pl-4 italic text-[#5C5A55]"
                >
                  {para.replace("> ", "")}
                </blockquote>
              );
            }
            return <p key={i}>{para}</p>;
          })
        )}

        {/* Appreciation & Share Buttons */}
        <div className="pt-10 pb-6 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={toggleLike}
            data-testid="like-blog-button"
            className={`flex items-center gap-3 px-8 py-3.5 rounded-full font-ui text-sm font-semibold transition-all cursor-pointer shadow-xs hover:shadow-md ${liked
                ? "bg-[#A84C32] text-white"
                : "bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32]"
              }`}
          >
            <Heart className={`h-5 w-5 ${liked ? "fill-white" : "text-[#A84C32]"}`} />
            <span>{liked ? "Appreciated" : "Appreciate Insight"}</span>
            <span className="opacity-80">({likesCount})</span>
          </button>

          <button
            onClick={handleShare}
            data-testid="share-blog-button"
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full font-ui text-sm font-semibold bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-all cursor-pointer shadow-xs hover:shadow-md"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-5 w-5 text-[#A84C32]" />
                <span>Share Insight</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reflections / Comments */}
      <div className="max-w-3xl mx-auto px-6">
        <CommentThread
          blogId={blog.id}
          comments={comments}
          onRefresh={loadComments}
        />
      </div>
    </article>
  );
}
