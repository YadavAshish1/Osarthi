"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Sparkles,
  GraduationCap,
  Briefcase,
  ArrowRight,
  UserCheck,
  Share2,
  Check,
  X,
  BookOpen,
  Heart,
  Award,
  Clock,
} from "lucide-react";
import { TeacherProfile, getTeacherSlug, api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function TeachersListClient({
  initialTeachers,
  initialSubjects = [],
}: {
  initialTeachers: TeacherProfile[];
  initialSubjects?: string[];
}) {
  const { user, requireAuth, updateUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const DEFAULT_SUBJECT_CHIPS = [
    "Physics",
    "Mathematics",
    "Literature",
    "Science",
    "Chemistry",
    "Biology",
    "English",
    "History",
  ];

  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherProfile[]>(initialTeachers);
  const [subjectsList, setSubjectsList] = useState<string[]>(
    initialSubjects && initialSubjects.length > 0 ? initialSubjects : DEFAULT_SUBJECT_CHIPS
  );
  const [savedTeacherIds, setSavedTeacherIds] = useState<string[]>(user?.savedTeachers || []);

  useEffect(() => {
    if (user?.savedTeachers) {
      setSavedTeacherIds(user.savedTeachers);
    }
  }, [user?.savedTeachers]);

  // Fetch unique subjects and teachers created in DB client-side
  useEffect(() => {
    (async () => {
      try {
        const [subRes, teachRes, blogRes] = await Promise.all([
          api.get("/explore/subjects").catch(() => ({ data: [] })),
          api.get("/explore/teachers").catch(() => ({ data: [] })),
          api.get("/explore/blogs?limit=300").catch(() => ({ data: [] })),
        ]);

        if (Array.isArray(subRes.data) && subRes.data.length > 0) {
          const names = subRes.data.map((s: any) => s.name).filter(Boolean);
          if (names.length > 0) {
            setSubjectsList(Array.from(new Set<string>(names)));
          }
        }

        // Map blogs to creators for subjects extraction
        const blogSubjectsMap = new Map<string, Set<string>>();
        const blogsArray = Array.isArray(blogRes.data)
          ? blogRes.data
          : Array.isArray(blogRes.data?.items)
          ? blogRes.data.items
          : [];

        for (const b of blogsArray) {
          const tid = b.createdBy?._id || b.createdBy || b.teacher_id || "";
          const tname = (b.createdBy?.name || b.teacher_name || "").toLowerCase().trim();
          const subName = b.subjectRef?.name || b.subject || "";

          if (subName) {
            if (tid) {
              if (!blogSubjectsMap.has(tid)) blogSubjectsMap.set(tid, new Set());
              blogSubjectsMap.get(tid)!.add(subName);
            }
            if (tname) {
              if (!blogSubjectsMap.has(tname)) blogSubjectsMap.set(tname, new Set());
              blogSubjectsMap.get(tname)!.add(subName);
            }
          }
        }

        if (Array.isArray(teachRes.data) && teachRes.data.length > 0) {
          const mappedTeachers: TeacherProfile[] = teachRes.data.map((t: any) => {
            const tid = t._id || t.id;
            const tname = (t.name || "").toLowerCase().trim();
            const existingSubs: string[] = Array.isArray(t.subjects) ? t.subjects : [];

            const extraSubs1 = Array.from(blogSubjectsMap.get(tid) || []);
            const extraSubs2 = Array.from(blogSubjectsMap.get(tname) || []);
            const combinedSubs = Array.from(new Set([...existingSubs, ...extraSubs1, ...extraSubs2]));

            return {
              _id: tid,
              name: t.name || "Faculty Member",
              avatar: t.avatar || "",
              bio: t.bio || "",
              role: t.role || "",
              education: Array.isArray(t.education) ? t.education : [],
              experience: Array.isArray(t.experience) ? t.experience : [],
              blogsCount: t.blogsCount !== undefined ? t.blogsCount : (blogSubjectsMap.get(tid)?.size || 0),
              subjects: combinedSubs,
            };
          });
          setTeachers(mappedTeachers);
        } else {
          // Enrich initial teachers with blogSubjectsMap
          setTeachers((prev) =>
            prev.map((t) => {
              const tid = t._id;
              const tname = (t.name || "").toLowerCase().trim();
              const existingSubs: string[] = Array.isArray(t.subjects) ? t.subjects : [];
              const extraSubs1 = Array.from(blogSubjectsMap.get(tid) || []);
              const extraSubs2 = Array.from(blogSubjectsMap.get(tname) || []);
              const combinedSubs = Array.from(new Set([...existingSubs, ...extraSubs1, ...extraSubs2]));
              return { ...t, subjects: combinedSubs };
            })
          );
        }
      } catch {}
    })();
  }, []);

  // Combine "All" with dynamic DB subjects
  const filterCategories = useMemo(() => {
    return ["All", ...subjectsList];
  }, [subjectsList]);

  // Robust subject match helper
  const isSubjectMatch = (teacherSubject: string, targetSubject: string): boolean => {
    if (!teacherSubject || !targetSubject) return false;
    const s1 = teacherSubject.toLowerCase().trim();
    const s2 = targetSubject.toLowerCase().trim();

    if (s1 === s2 || s1.includes(s2) || s2.includes(s1)) return true;

    // Hindi variant normalization (handles anusvara/halant variations)
    const norm1 = s1.replace(/िंद/g, "िन्द").replace(/हिंदी/g, "हिन्दी").replace(/hindi/g, "हिन्दी");
    const norm2 = s2.replace(/िंद/g, "िन्द").replace(/हिंदी/g, "हिन्दी").replace(/hindi/g, "हिन्दी");

    if (norm1.includes("हिन्दी") && norm2.includes("हिन्दी")) return true;
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

    return false;
  };

  // Filter logic
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = searchTerm.toLowerCase().trim();

      // Subject filter match
      if (selectedSubject !== "All") {
        const targetSub = selectedSubject.toLowerCase().trim();

        // 1. Match authored subjects (from published blogs in DB)
        const matchesAuthoredSubject = (t.subjects || []).some((s) =>
          isSubjectMatch(s, targetSub)
        );

        // 2. Match bio, role, education, experience
        const matchesSubjectInBio =
          isSubjectMatch(t.bio || "", targetSub) ||
          isSubjectMatch(t.role || "", targetSub);
        const matchesSubjectInEdu = (t.education || []).some(
          (e) =>
            isSubjectMatch(e.degree || "", targetSub) ||
            isSubjectMatch(e.institution || "", targetSub)
        );
        const matchesSubjectInExp = (t.experience || []).some(
          (e) =>
            isSubjectMatch(e.title || "", targetSub) ||
            isSubjectMatch(e.organization || "", targetSub)
        );

        if (!matchesAuthoredSubject && !matchesSubjectInBio && !matchesSubjectInEdu && !matchesSubjectInExp) {
          return false;
        }
      }

      if (!q) return true;

      // Text search match in name, bio, education, experience
      const nameMatch = (t.name || "").toLowerCase().includes(q);
      const bioMatch = (t.bio || "").toLowerCase().includes(q);
      const eduMatch = (t.education || []).some(
        (e) =>
          (e.degree || "").toLowerCase().includes(q) ||
          (e.institution || "").toLowerCase().includes(q)
      );
      const expMatch = (t.experience || []).some(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          (e.organization || "").toLowerCase().includes(q)
      );

      return nameMatch || bioMatch || eduMatch || expMatch;
    });
  }, [teachers, searchTerm, selectedSubject]);

  const handleShare = async (e: React.MouseEvent, teacher: TeacherProfile) => {
    e.preventDefault();
    e.stopPropagation();

    const slug = getTeacherSlug(teacher._id, teacher.name);
    const profileUrl = typeof window !== "undefined"
      ? `${window.location.origin}/teachers/${slug}`
      : `/teachers/${slug}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${teacher.name} | Medhashine Educator`,
          text: `Check out ${teacher.name}'s profile and teaching insights on Medhashine Student Portal!`,
          url: profileUrl,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(profileUrl);
        setCopiedId(teacher._id);
        toast.success(`Copied link for ${teacher.name}`);
        setTimeout(() => setCopiedId(null), 2500);
      }
    } catch {
      toast.error("Could not copy profile link.");
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, teacher: TeacherProfile) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      requireAuth();
      return;
    }

    const teacherId = teacher._id;
    const isCurrentlySaved = savedTeacherIds.includes(teacherId);
    const updatedIds = isCurrentlySaved
      ? savedTeacherIds.filter((id) => id !== teacherId)
      : [...savedTeacherIds, teacherId];

    setSavedTeacherIds(updatedIds);
    updateUser({ savedTeachers: updatedIds });

    try {
      const { data } = await api.post("/profile/saved-teachers/toggle", { teacherId });
      if (data.saved) {
        toast.success(`Saved ${teacher.name} to your profile! ❤️`);
      } else {
        toast.info(`Removed ${teacher.name} from your saved mentors.`);
      }
    } catch {
      toast.error("Failed to update saved status.");
      // Revert on error
      setSavedTeacherIds(savedTeacherIds);
      updateUser({ savedTeachers: savedTeacherIds });
    }
  };

  return (
    <div className="pb-24">
      {/* Hero Header Section */}
      <section className="bg-gradient-to-b from-[#F5F2EB] to-[#FAF8F5] border-b border-[#E5E1D8] py-16 md:py-24">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-ui uppercase tracking-widest bg-white border border-[#E5E1D8] px-4 py-1.5 rounded-full text-[#A84C32] font-semibold mb-6 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Medhashine Educator Directory</span>
          </div>

          <h1 className="font-serif-display text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1A1A1A] tracking-tight max-w-3xl mx-auto leading-tight">
            Find Your Educators & Mentors
          </h1>

          <p className="mt-4 font-serif-body text-lg md:text-xl text-[#5C5A55] max-w-2xl mx-auto leading-relaxed">
            Connect with passionate teachers, read their academic insights, and explore the guidance crafted for curious minds.
          </p>

          {/* Search Box */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-5 text-[#5C5A55] h-5 w-5 pointer-events-none" />
              <input
                data-testid="find-teachers-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teacher by name, subject, degree, or topic…"
                className="w-full pl-13 pr-12 py-4 bg-white border border-[#E5E1D8] rounded-full text-base font-ui text-[#1A1A1A] placeholder:text-[#5C5A55]/60 shadow-xs focus:outline-none focus:border-[#A84C32] focus:ring-2 focus:ring-[#A84C32]/20 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 p-1.5 rounded-full text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#F5F2EB] transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Categories */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <span className="text-xs font-ui text-[#5C5A55] mr-1 uppercase tracking-wider font-semibold">
              Filter:
            </span>
            {filterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedSubject(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-ui transition-all cursor-pointer ${
                  selectedSubject === cat
                    ? "bg-[#1A1A1A] text-white font-medium shadow-xs"
                    : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:border-[#A84C32] hover:text-[#A84C32]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Educator Cards Section */}
      <main className="max-w-screen-xl mx-auto px-6 md:px-12 pt-12">
        <div className="flex items-center justify-between pb-6 border-b border-[#E5E1D8] mb-10">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#A84C32]" />
            <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
              Verified Teachers ({filteredTeachers.length})
            </h2>
          </div>
          {(searchTerm || selectedSubject !== "All") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSubject("All");
              }}
              className="text-xs font-ui text-[#A84C32] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredTeachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTeachers.map((teacher) => {
              const slug = getTeacherSlug(teacher._id, teacher.name);
              const profileHref = `/teachers/${slug}`;
              const isCopied = copiedId === teacher._id;
              const isLiked = savedTeacherIds.includes(teacher._id);

              // Calculate degrees summary
              const primaryDegree = teacher.education && teacher.education.length > 0
                ? teacher.education[0]
                : null;

              // Experience summary
              const primaryExperience = teacher.experience && teacher.experience.length > 0
                ? teacher.experience[0]
                : null;

              return (
                <div
                  key={teacher._id}
                  data-testid={`teacher-card-${teacher._id}`}
                  className="group bg-white rounded-3xl border border-[#E5E1D8] p-7 flex flex-col justify-between hover:border-[#A84C32] transition-all duration-300 shadow-2xs hover:shadow-md relative overflow-hidden"
                >
                  <div>
                    {/* Educator Top Header */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <Link href={profileHref} className="block shrink-0">
                        {teacher.avatar ? (
                          <img
                            src={teacher.avatar}
                            alt={teacher.name}
                            className="w-20 h-20 rounded-2xl object-cover border border-[#E5E1D8] shadow-xs group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center text-2xl font-bold uppercase shrink-0 shadow-xs">
                            {teacher.name?.[0] || "T"}
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-col items-end gap-2">
                        {/* Professional Badge */}
                        <span className="text-[11px] font-ui uppercase tracking-wider bg-[#F5F2EB] text-[#A84C32] px-2.5 py-1 rounded-full font-semibold border border-[#E5E1D8] flex items-center gap-1">
                          <Award className="h-3 w-3 text-[#A84C32]" />
                          <span>Verified Teacher</span>
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Heart / Like Love Button */}
                          <button
                            onClick={(e) => handleToggleLike(e, teacher)}
                            title={isLiked ? "Remove from saved mentors" : "Save / Like teacher"}
                            className={`p-2 rounded-full border transition-all cursor-pointer ${
                              isLiked
                                ? "bg-red-50 border-red-200 text-red-500 scale-105 shadow-xs"
                                : "bg-white border-[#E5E1D8] text-[#5C5A55] hover:text-red-500 hover:border-red-300"
                            }`}
                          >
                            <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                          </button>

                          {/* Share Profile Button */}
                          <button
                            onClick={(e) => handleShare(e, teacher)}
                            title="Share Educator Profile"
                            className="p-2 rounded-full border border-[#E5E1D8] text-[#5C5A55] hover:text-[#A84C32] hover:border-[#A84C32] transition-colors bg-white cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Share2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Info */}
                    <h3 className="font-serif-display text-2xl font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors leading-snug">
                      <Link href={profileHref}>{teacher.name}</Link>
                    </h3>

                    <p className="mt-2.5 font-serif-body text-sm text-[#5C5A55] leading-relaxed line-clamp-2">
                      {teacher.bio ||
                        "Dedicated educator passionate about inspiring student curiosity and deep academic learning."}
                    </p>

                    {/* Qualifications & Experience Badges */}
                    <div className="mt-5 space-y-2 pt-4 border-t border-[#E5E1D8]/60 font-ui text-xs">
                      {/* Degrees List */}
                      <div className="flex items-center gap-2 text-[#5C5A55]">
                        <GraduationCap className="h-4 w-4 text-[#A84C32] shrink-0" />
                        <span className="truncate font-medium text-[#1A1A1A]">
                          {primaryDegree ? primaryDegree.degree : "Degrees Verified"}
                        </span>
                        {primaryDegree?.institution && (
                          <span className="text-[#5C5A55]/70 truncate">
                            • {primaryDegree.institution}
                          </span>
                        )}
                      </div>

                      {/* Total Experience */}
                      <div className="flex items-center gap-2 text-[#5C5A55]">
                        <Briefcase className="h-4 w-4 text-[#A84C32] shrink-0" />
                        <span className="truncate font-medium text-[#1A1A1A]">
                          {primaryExperience ? primaryExperience.title : "Senior Faculty"}
                        </span>
                        {primaryExperience?.duration ? (
                          <span className="text-[#A84C32] font-semibold truncate">
                            ({primaryExperience.duration})
                          </span>
                        ) : (
                          <span className="text-[#5C5A55]/70 truncate">• Experienced Mentor</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="mt-6 pt-4 border-t border-[#E5E1D8]/60 flex items-center justify-between">
                    <span className="text-xs font-ui text-[#5C5A55] flex items-center gap-1.5 font-medium">
                      <BookOpen className="h-3.5 w-3.5 text-[#A84C32]" />
                      <span>
                        {teacher.blogsCount !== undefined
                          ? `${teacher.blogsCount} Insights`
                          : "Published Insights"}
                      </span>
                    </span>

                    <Link
                      href={profileHref}
                      className="inline-flex items-center gap-1.5 font-ui text-xs font-semibold text-[#A84C32] group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>View Profile</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div className="bg-white rounded-3xl border border-[#E5E1D8] p-12 text-center max-w-xl mx-auto my-8">
            <UserCheck className="h-12 w-12 text-[#5C5A55] mx-auto mb-4 opacity-40" />
            <h3 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">
              No educators found
            </h3>
            <p className="font-serif-body text-[#5C5A55] mt-2 text-base">
              We couldn’t find any faculty matching &quot;{searchTerm}&quot;. Try adjusting your search query or subject filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedSubject("All");
              }}
              className="mt-6 px-6 py-2.5 rounded-full bg-[#1A1A1A] text-white font-ui text-xs font-medium hover:bg-[#A84C32] transition-colors"
            >
              Show All Educators
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
