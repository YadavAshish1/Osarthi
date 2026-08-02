"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Bookmark,
  BookOpen,
  ArrowLeft,
  Mail,
  ShieldCheck,
  BookmarkX,
  Heart,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Camera,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, BlogItem, mapContentToBlog } from "@/lib/api";
import BlogCard from "@/components/BlogCard";
import { toast } from "sonner";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

export default function ProfilePage() {
  const { user, openAuth, updateUser } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const [activeActivityTab, setActiveActivityTab] = useState<"liked" | "commented">("liked");
  const [savedBlogs, setSavedBlogs] = useState<BlogItem[]>([]);
  const [likedBlogs, setLikedBlogs] = useState<BlogItem[]>([]);
  const [commentedBlogs, setCommentedBlogs] = useState<BlogItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data } = await api.get("/profile/activity");
        if (data) {
          if (Array.isArray(data.savedBlogs)) {
            setSavedBlogs(data.savedBlogs.map((item: any) => mapContentToBlog(item)));
          }
          if (Array.isArray(data.likedBlogs)) {
            setLikedBlogs(data.likedBlogs.map((item: any) => mapContentToBlog(item)));
          }
          if (Array.isArray(data.commentedBlogs)) {
            setCommentedBlogs(data.commentedBlogs.map((item: any) => mapContentToBlog(item)));
          }
        }
      } catch (err) {
        console.error("Failed to load user activity:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 500 KB limit check (500 * 1024 bytes)
    const MAX_SIZE_BYTES = 500 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const fileSizeKb = (file.size / 1024).toFixed(1);
      toast.error(`File size (${fileSizeKb} KB) exceeds the 500 KB limit. Please select a smaller image.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    setUploadingAvatar(true);
    try {
      const { data } = await api.post("/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.avatar) {
        updateUser({ avatar: data.avatar });
        toast.success("Profile picture updated successfully!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload profile picture.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await api.delete("/profile/avatar");
      updateUser({ avatar: "" });
      toast.info("Profile picture removed.");
      setPhotoModalOpen(false);
    } catch {
      toast.error("Failed to remove profile picture.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUnsave = async (blogId: string, title: string) => {
    setRemovingId(blogId);
    try {
      await api.post("/profile/bookmarks/toggle", { blogId });
      setSavedBlogs((prev) => prev.filter((b) => b.id !== blogId && (b as any)._id !== blogId));
      toast.info(`"${title.slice(0, 30)}${title.length > 30 ? "…" : ""}" removed from saved insights`);
    } catch {
      toast.error("Failed to remove saved insight.");
    } finally {
      setRemovingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center font-serif-body">
        <div className="w-16 h-16 rounded-full bg-[#F5F2EB] text-[#A84C32] flex items-center justify-center mx-auto mb-4 border border-[#E5E1D8]">
          <Bookmark className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-semibold text-[#1A1A1A]">Sign In to View Your Profile</h2>
        <p className="mt-2 text-sm text-[#5C5A55] font-ui max-w-md mx-auto">
          Sign in to your Medhashine account to view your saved articles, appreciated insights, and discussion history.
        </p>
        <button
          onClick={() => openAuth("login")}
          className="mt-6 px-8 py-3 rounded-full bg-[#1A1A1A] text-white font-ui text-sm font-semibold hover:bg-[#A84C32] transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Top Navigation */}
      <div className="max-w-5xl mx-auto px-6 pt-10 md:pt-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55] hover:text-[#A84C32] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to insights
        </Link>
      </div>

      {/* User Hero Header */}
      <header className="max-w-5xl mx-auto px-6 pt-8 pb-10">
        <div className="bg-white rounded-3xl border border-[#E5E1D8] p-8 md:p-10 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Container — Click to open Profile Photo Modal */}
            <div
              onClick={() => setPhotoModalOpen(true)}
              title="Click to view & manage profile photo"
              className="relative group/avatar shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-[#E5E1D8] shadow-sm transition-transform active:scale-95"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-24 h-24 object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-[#1A1A1A] text-white flex items-center justify-center text-3xl font-bold uppercase">
                  {user.name?.[0] || "U"}
                </div>
              )}

              {/* Hover Action Overlay */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity p-2 text-center">
                <Camera className="h-5 w-5 mb-1 text-white" />
                <span className="text-[10px] font-ui font-semibold uppercase tracking-wider">
                  View & Manage
                </span>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />

            {/* Profile Information */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <span className="text-xs font-ui uppercase tracking-wider bg-[#F5F2EB] text-[#A84C32] px-3 py-1 rounded-full border border-[#E5E1D8] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {user.role || "Student"}
                </span>
              </div>

              <h1 className="font-serif-display text-3xl md:text-4xl font-semibold text-[#1A1A1A]">
                {user.name}
              </h1>

              {user.email && (
                <p className="mt-2 font-ui text-xs text-[#5C5A55] flex items-center justify-center md:justify-start gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#A84C32]" />
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Photo View & Edit Modal */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setPhotoModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E5E1D8] shadow-2xl z-10 overflow-hidden font-ui">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8]">
              <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">
                Profile Photo
              </h3>
              <button
                onClick={() => setPhotoModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F5F2EB] text-[#5C5A55] hover:text-[#1A1A1A] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body — High Res Photo Display */}
            <div className="p-8 flex flex-col items-center justify-center bg-[#FAF8F5]">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-56 h-56 rounded-2xl object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-56 h-56 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center text-7xl font-bold uppercase shadow-md">
                  {user.name?.[0] || "U"}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 bg-white border-t border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-end gap-3">
              {user.avatar && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span>Remove Photo</span>
                </button>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1A1A1A] text-white hover:bg-[#A84C32] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span>{user.avatar ? "Change Photo" : "Upload Photo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Profile Sections */}
      <main className="max-w-5xl mx-auto px-6 space-y-14">
        {/* Section 1: Saved Insights (Swiper Carousel) */}
        <section>
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E1D8] mb-6">
            <div className="flex items-center gap-3">
              <Bookmark className="h-5 w-5 text-[#A84C32] fill-[#A84C32]" />
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
                Saved Insights ({savedBlogs.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center font-serif-body text-[#5C5A55]">
              Loading your saved insights…
            </div>
          ) : savedBlogs.length > 0 ? (
            <div className="relative group/carousel">
              {/* Custom Floating Navigation Buttons — Vertically Centered */}
              <button
                id="saved-swiper-prev"
                className="absolute -left-3 md:-left-5 top-[190px] -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E5E1D8] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all flex items-center justify-center shadow-md cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                id="saved-swiper-next"
                className="absolute -right-3 md:-right-5 top-[190px] -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E5E1D8] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all flex items-center justify-center shadow-md cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                aria-label="Next slide"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <Swiper
                modules={[Navigation]}
                spaceBetween={20}
                slidesPerView={1.15}
                navigation={{
                  prevEl: "#saved-swiper-prev",
                  nextEl: "#saved-swiper-next",
                }}
                breakpoints={{
                  640: { slidesPerView: 2.15, spaceBetween: 24 },
                  1024: { slidesPerView: 3, spaceBetween: 24 },
                }}
                className="swiper-accent-theme"
              >
                {savedBlogs.map((blog, idx) => (
                  <SwiperSlide key={blog.id} className="!h-auto flex">
                    <div className="w-full relative flex-1 flex flex-col group/card">
                      {/* Unsave Action Pill Button overlay (top-left) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnsave(blog.id, blog.title);
                        }}
                        disabled={removingId === blog.id}
                        title="Remove from saved insights"
                        className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs text-[#5C5A55] hover:text-red-600 hover:border-red-300 hover:bg-red-50 px-3 py-1.5 rounded-full text-xs font-ui font-medium border border-[#E5E1D8] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <BookmarkX className="h-3.5 w-3.5 text-[#A84C32]" />
                        <span>{removingId === blog.id ? "Removing…" : "Unsave"}</span>
                      </button>

                      <BlogCard blog={blog} index={idx} />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Show All Link Button */}
              <div className="mt-6 text-center">
                <Link
                  href="/profile/saved"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-ui text-xs font-semibold bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                >
                  <span>Show All Saved Insights</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E5E1D8] p-8">
              <BookOpen className="h-9 w-9 text-[#5C5A55] mx-auto mb-2 opacity-50" />
              <h3 className="font-serif-display text-base font-semibold text-[#1A1A1A]">
                No saved insights yet
              </h3>
              <p className="font-serif-body text-xs text-[#5C5A55] mt-1 max-w-sm mx-auto">
                Explore essays and study guides, and click the Save button to bookmark them here.
              </p>
              <Link
                href="/"
                className="mt-5 inline-block px-5 py-2 rounded-full bg-[#1A1A1A] text-white font-ui text-xs font-semibold hover:bg-[#A84C32] transition-colors"
              >
                Explore Insights
              </Link>
            </div>
          )}
        </section>

        {/* Section 2: Activity History (Swiper Carousel Tabs Section) */}
        <section className="pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-5 w-5 text-[#A84C32]" />
            <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
              Activity History
            </h2>
          </div>

          {/* Activity Header Row: Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E5E1D8] mb-8 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveActivityTab("liked")}
              className={`flex items-center gap-2 px-5 py-3 font-ui text-sm font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                activeActivityTab === "liked"
                  ? "border-[#A84C32] text-[#A84C32] bg-white shadow-2xs"
                  : "border-transparent text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#F5F2EB]/50"
              }`}
            >
              <Heart className={`h-4 w-4 ${activeActivityTab === "liked" ? "fill-[#A84C32]" : ""}`} />
              <span>Appreciates</span>
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[#F5F2EB] text-[#5C5A55] font-bold">
                {likedBlogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveActivityTab("commented")}
              className={`flex items-center gap-2 px-5 py-3 font-ui text-sm font-semibold rounded-t-xl transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                activeActivityTab === "commented"
                  ? "border-[#A84C32] text-[#A84C32] bg-white shadow-2xs"
                  : "border-transparent text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#F5F2EB]/50"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Comments</span>
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-[#F5F2EB] text-[#5C5A55] font-bold">
                {commentedBlogs.length}
              </span>
            </button>
          </div>

          {/* Activity Tab Content (Swiper Carousel) */}
          {loading ? (
            <div className="py-12 text-center font-serif-body text-[#5C5A55]">
              Loading your activity history…
            </div>
          ) : activeActivityTab === "liked" ? (
            likedBlogs.length > 0 ? (
              <div className="relative group/carousel">
                {/* Custom Floating Navigation Buttons */}
                <button
                  id="activity-liked-prev"
                  className="absolute -left-3 md:-left-5 top-[190px] -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E5E1D8] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all flex items-center justify-center shadow-md cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  id="activity-liked-next"
                  className="absolute -right-3 md:-right-5 top-[190px] -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E5E1D8] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all flex items-center justify-center shadow-md cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <Swiper
                  key="liked-swiper"
                  modules={[Navigation]}
                  spaceBetween={20}
                  slidesPerView={1.15}
                  navigation={{
                    prevEl: "#activity-liked-prev",
                    nextEl: "#activity-liked-next",
                  }}
                  breakpoints={{
                    640: { slidesPerView: 2.15, spaceBetween: 24 },
                    1024: { slidesPerView: 3, spaceBetween: 24 },
                  }}
                  className="swiper-accent-theme"
                >
                  {likedBlogs.map((blog, idx) => (
                    <SwiperSlide key={blog.id} className="!h-auto flex">
                      <div className="w-full relative flex-1 flex flex-col group/card">
                        <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs text-[#A84C32] px-3 py-1 rounded-full text-[11px] font-ui font-semibold border border-[#E5E1D8] shadow-xs flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-[#A84C32]" />
                          <span>Appreciated</span>
                        </div>
                        <BlogCard blog={blog} index={idx} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Show All Link Button */}
                <div className="mt-6 text-center">
                  <Link
                    href="/profile/activity?type=liked"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-ui text-xs font-semibold bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                  >
                    <span>Show All Appreciates</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-14 bg-white rounded-2xl border border-[#E5E1D8] p-8">
                <Heart className="h-10 w-10 text-[#A84C32] mx-auto mb-3 opacity-50" />
                <h3 className="font-serif-display text-lg font-semibold text-[#1A1A1A]">
                  No appreciates yet
                </h3>
                <p className="font-serif-body text-sm text-[#5C5A55] mt-1 max-w-md mx-auto">
                  Click the heart icon on any faculty insight or essay to show your appreciation and track it here.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-block px-5 py-2 rounded-full bg-[#1A1A1A] text-white font-ui text-xs font-semibold hover:bg-[#A84C32] transition-colors"
                >
                  Explore Insights
                </Link>
              </div>
            )
          ) : (
            commentedBlogs.length > 0 ? (
              <div className="relative group/carousel">
                {/* Custom Floating Navigation Buttons */}
                <button
                  id="activity-comm-prev"
                  className="absolute -left-3 md:-left-5 top-[190px] -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E5E1D8] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all flex items-center justify-center shadow-md cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  id="activity-comm-next"
                  className="absolute -right-3 md:-right-5 top-[190px] -translate-y-1/2 z-30 w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/95 backdrop-blur-md border border-[#E5E1D8] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A] transition-all flex items-center justify-center shadow-md cursor-pointer active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <Swiper
                  key="commented-swiper"
                  modules={[Navigation]}
                  spaceBetween={20}
                  slidesPerView={1.15}
                  navigation={{
                    prevEl: "#activity-comm-prev",
                    nextEl: "#activity-comm-next",
                  }}
                  breakpoints={{
                    640: { slidesPerView: 2.15, spaceBetween: 24 },
                    1024: { slidesPerView: 3, spaceBetween: 24 },
                  }}
                  className="swiper-accent-theme"
                >
                  {commentedBlogs.map((blog, idx) => (
                    <SwiperSlide key={blog.id} className="!h-auto flex">
                      <div className="w-full relative flex-1 flex flex-col group/card">
                        <div className="absolute top-3 left-3 z-20 bg-[#1A1A1A] text-[#1A1A1A] px-3 py-1 rounded-full text-[11px] font-ui font-semibold border border-[#E5E1D8] shadow-xs flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-[#A84C32]" />
                          <span>Discussed</span>
                        </div>
                        <BlogCard blog={blog} index={idx} />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Show All Link Button */}
                <div className="mt-6 text-center">
                  <Link
                    href="/profile/activity?type=commented"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-ui text-xs font-semibold bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                  >
                    <span>Show All Comments</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-14 bg-white rounded-2xl border border-[#E5E1D8] p-8">
                <MessageSquare className="h-10 w-10 text-[#5C5A55] mx-auto mb-3 opacity-50" />
                <h3 className="font-serif-display text-lg font-semibold text-[#1A1A1A]">
                  No comments yet
                </h3>
                <p className="font-serif-body text-sm text-[#5C5A55] mt-1 max-w-md mx-auto">
                  Participate in academic discussions by leaving comments or asking questions on faculty insights.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-block px-5 py-2 rounded-full bg-[#1A1A1A] text-white font-ui text-xs font-semibold hover:bg-[#A84C32] transition-colors"
                >
                  Explore Insights
                </Link>
              </div>
            )
          )}
        </section>
      </main>
    </div>
  );
}
