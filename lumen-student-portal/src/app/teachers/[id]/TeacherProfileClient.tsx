"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, Briefcase, Clock, Calendar, Share2, Check } from "lucide-react";
import { api, BlogItem, TeacherProfile, mapContentToBlog, FALLBACK_BLOGS, getDefaultSubjectCover } from "@/lib/api";
import { toast } from "sonner";

export default function TeacherProfileClient({
  id,
  initialTeacher,
  initialBlogs,
}: {
  id: string;
  initialTeacher: TeacherProfile | null;
  initialBlogs: BlogItem[];
}) {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(initialTeacher);
  const [blogs, setBlogs] = useState<BlogItem[]>(initialBlogs);
  const [loading, setLoading] = useState(!initialTeacher);
  const [avatarError, setAvatarError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `${teacher?.name || "Educator"} | Medhashine`,
      text: `Check out ${teacher?.name || "this educator"}'s profile and insights on Medhashine Student Portal.`,
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
        toast.success("Profile link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      toast.error("Failed to copy profile link.");
    }
  };

  useEffect(() => {
    (async () => {
      const rawId = id.match(/([a-f0-9]{24})$/)?.[1] || id;
      try {
        const { data } = await api.get(`/explore/teachers/${rawId}`);
        if (data && data.teacher) {
          setTeacher(data.teacher);
          if (Array.isArray(data.blogs)) {
            const mapped = data.blogs.map((b: any) => mapContentToBlog(b));
            setBlogs(mapped);
          }
          setLoading(false);
          return;
        }
      } catch {
        // API fallback logic
      }

      if (!initialTeacher) {
        // Fallback for demo/offline
        const fallbackBlogs = FALLBACK_BLOGS.filter(
          (b) => b.teacher_id === id || id.includes(b.teacher_name.split(" ")[1]?.toLowerCase() || "")
        );
        const activeBlogs = fallbackBlogs.length > 0 ? fallbackBlogs : FALLBACK_BLOGS;

        setTeacher({
          _id: id,
          name: activeBlogs[0]?.teacher_name || "Educator Profile",
          avatar: activeBlogs[0]?.teacher_avatar || "",
          role: "Teacher",
          bio: "Dedicated educator passionate about inspiring student curiosity, critical thinking, and academic excellence.",
          education: [
            { degree: "Master of Science", institution: "Central University", year: "2018" },
            { degree: "Bachelor of Education (B.Ed)", institution: "State University", year: "2016" },
          ],
          experience: [
            { title: "Senior Faculty", organization: "Medhashine Education", duration: "2020 - Present" },
          ],
        });
        setBlogs(activeBlogs);
      }
      setLoading(false);
    })();
  }, [id, initialTeacher]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 font-serif-body text-[#5C5A55] text-center">
        Loading educator profile…
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center font-serif-body">
        <h2 className="text-2xl text-[#1A1A1A]">Educator Profile Not Found</h2>
        <Link href="/" className="mt-4 inline-block text-[#A84C32] font-ui text-sm hover:underline">
          Return to Insights
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Top Navigation */}
      <div className="max-w-4xl mx-auto px-6 pt-10 md:pt-16 flex items-center justify-between">
        <Link
          href="/"
          data-testid="back-to-insights"
          className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55] hover:text-[#A84C32] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to insights
        </Link>

        <button
          onClick={handleShare}
          data-testid="header-share-teacher-button"
          title="Share educator profile"
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

      {/* Header Profile Hero Card */}
      <header className="max-w-4xl mx-auto px-6 pt-8 pb-10">
        <div className="bg-white rounded-3xl border border-[#E5E1D8] p-8 md:p-10 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            {teacher.avatar && !avatarError ? (
              <img
                src={teacher.avatar}
                alt={teacher.name}
                onError={() => setAvatarError(true)}
                className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border border-[#E5E1D8] shadow-sm shrink-0"
              />
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center text-3xl font-bold uppercase shrink-0 shadow-sm">
                {teacher.name?.[0] || "T"}
              </div>
            )}

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <span className="text-xs font-ui uppercase tracking-wider bg-[#F5F2EB] text-[#A84C32] px-3 py-1 rounded-full border border-[#E5E1D8] font-semibold">
                  Medhashine Educator
                </span>
                {teacher.createdAt && (
                  <span className="text-xs font-ui text-[#5C5A55] flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#A84C32]" /> Joined{" "}
                    {new Date(teacher.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>

              <h1
                data-testid="teacher-name"
                className="font-serif-display text-3xl md:text-4xl lg:text-5xl font-semibold text-[#1A1A1A] leading-tight"
              >
                {teacher.name}
              </h1>

              {teacher.bio ? (
                <p className="mt-4 font-serif-body text-lg text-[#5C5A55] leading-relaxed max-w-2xl">
                  {teacher.bio}
                </p>
              ) : (
                <p className="mt-4 font-serif-body italic text-base text-[#5C5A55]">
                  Educator at Medhashine. Dedicated to empowering students through clear, structured learning insights.
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Qualifications & Experience Section */}
      <section className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Education */}
        <div className="bg-[#F5F2EB]/60 rounded-2xl border border-[#E5E1D8] p-6 md:p-8">
          <div className="flex items-center gap-3 text-[#A84C32] mb-6">
            <div className="p-2.5 bg-white rounded-xl border border-[#E5E1D8]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">
              Education & Qualifications
            </h3>
          </div>

          {teacher.education && teacher.education.length > 0 ? (
            <div className="space-y-4">
              {teacher.education.map((edu, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-[#E5E1D8]/80">
                  <div className="font-ui text-sm font-semibold text-[#1A1A1A]">{edu.degree}</div>
                  <div className="font-ui text-xs text-[#5C5A55] mt-1 flex justify-between">
                    <span>{edu.institution}</span>
                    {edu.year && <span className="font-medium text-[#A84C32]">{edu.year}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-ui text-[#5C5A55] italic">
              Verified Medhashine Faculty
            </p>
          )}
        </div>

        {/* Experience */}
        <div className="bg-[#F5F2EB]/60 rounded-2xl border border-[#E5E1D8] p-6 md:p-8">
          <div className="flex items-center gap-3 text-[#A84C32] mb-6">
            <div className="p-2.5 bg-white rounded-xl border border-[#E5E1D8]">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">
              Teaching Experience
            </h3>
          </div>

          {teacher.experience && teacher.experience.length > 0 ? (
            <div className="space-y-4">
              {teacher.experience.map((exp, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-[#E5E1D8]/80">
                  <div className="font-ui text-sm font-semibold text-[#1A1A1A]">{exp.title}</div>
                  <div className="font-ui text-xs text-[#5C5A55] mt-1 flex justify-between">
                    <span>{exp.organization}</span>
                    {exp.duration && <span className="font-medium text-[#A84C32]">{exp.duration}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-ui text-[#5C5A55] italic">
              Academic Content Contributor
            </p>
          )}
        </div>
      </section>

      {/* Authored Essays / Insights Section */}
      <main className="max-w-4xl mx-auto px-6 pt-4">
        <div className="flex items-center justify-between pb-6 border-b border-[#E5E1D8] mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-[#A84C32]" />
            <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
              Authored Insights ({blogs.length})
            </h2>
          </div>
        </div>

        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogs.map((blog) => {
              const coverImg = blog.cover || getDefaultSubjectCover(blog.subject);
              return (
                <article
                  key={blog.id}
                  className="group bg-white rounded-2xl border border-[#E5E1D8] overflow-hidden flex flex-col hover:border-[#A84C32] transition-all duration-300 shadow-xs hover:shadow-md"
                >
                  <Link href={`/blog/${blog.slug}`} className="block overflow-hidden relative aspect-16/9">
                    {coverImg ? (
                      <img
                        src={coverImg}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#F5F2EB] flex items-center justify-center text-[#5C5A55] font-serif-display">
                        Medhashine Insight
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="text-[11px] font-ui uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#A84C32] px-2.5 py-1 rounded-full font-semibold border border-[#E5E1D8]">
                        {blog.subject}
                      </span>
                    </div>
                  </Link>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors leading-snug">
                        <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                      </h3>
                      <p className="mt-3 font-serif-body text-sm text-[#5C5A55] line-clamp-2 leading-relaxed">
                        {blog.excerpt}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E5E1D8]/60 flex items-center justify-between text-xs font-ui text-[#5C5A55]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#A84C32]" />
                        <span>{blog.read_minutes} min read</span>
                      </div>
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="text-[#A84C32] font-semibold hover:underline"
                      >
                        Read Insight →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E1D8] p-8">
            <BookOpen className="h-10 w-10 text-[#5C5A55] mx-auto mb-3 opacity-50" />
            <h3 className="font-serif-display text-lg font-semibold text-[#1A1A1A]">No published insights yet</h3>
            <p className="font-serif-body text-sm text-[#5C5A55] mt-1">
              Check back soon for new insights authored by {teacher.name}.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
