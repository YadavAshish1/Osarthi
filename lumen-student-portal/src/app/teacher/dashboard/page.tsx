"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  PenSquare,
  BookOpen,
  Eye,
  Heart,
  Bookmark,
  Award,
  Users,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

interface ContentItem {
  _id: string;
  title: string;
  published: boolean;
  viewsCount: number;
  likesCount: number;
  bookmarksCount: number;
  className: string;
  subjectName: string;
  topicName: string;
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsData {
  totalInsights: number;
  publishedCount: number;
  draftCount: number;
  totalReach: number;
  totalAppreciations: number;
  totalBookmarks: number;
  classReachMap: Record<string, number>;
  contents: ContentItem[];
}

export default function TeacherDashboardPage() {
  const { user, ready } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/content/teacher/analytics");
      setAnalytics(data);
    } catch {
      toast.error("Failed to load real educator analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !user) return;
    fetchAnalytics();
  }, [user, ready]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this insight?")) return;
    try {
      await api.delete(`/content/${id}`);
      toast.success("Insight deleted");
      fetchAnalytics();
    } catch {
      toast.error("Failed to delete insight");
    }
  };

  if (!ready || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
        <Loader2 className="w-8 h-8 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">Loading Real Educator Analytics from Database…</p>
      </div>
    );
  }

  const contents = analytics?.contents || [];
  const filteredContents = contents.filter((c) => {
    if (filter === "published") return c.published;
    if (filter === "draft") return !c.published;
    return true;
  });

  const publishedCount = analytics?.publishedCount || 0;
  const draftCount = analytics?.draftCount || 0;
  const totalReach = analytics?.totalReach || 0;
  const totalAppreciations = analytics?.totalAppreciations || 0;
  const totalBookmarks = analytics?.totalBookmarks || 0;
  const classReachMap = analytics?.classReachMap || {};

  // Standard class level readership list
  const standardClasses = [
    { label: "Class 9", key: "Class 9", color: "bg-blue-600" },
    { label: "Class 10", key: "Class 10", color: "bg-emerald-600" },
    { label: "Class 11", key: "Class 11", color: "bg-amber-600" },
    { label: "Class 12 / JEE", key: "Class 12", color: "bg-[#A84C32]" },
    { label: "General Readers", key: "General", color: "bg-purple-600" },
  ];

  // Calculate maximum reach value for percentage scaling
  const maxReach = Math.max(...Object.values(classReachMap), 1);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-10 font-ui">
      {/* Top Banner Header */}
      <div className="p-8 md:p-10 rounded-3xl bg-[#FAF8F5] border border-[#E5E1D8] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-3 py-1 rounded-full border border-[#A84C32]/20 font-bold inline-flex items-center gap-1">
              <Award className="h-3.5 w-3.5" /> Approved Verified Educator
            </span>
          </div>
          <h1 className="font-serif-display text-3xl md:text-4xl font-semibold text-[#1A1A1A]">
            Educator Studio & Audience Analytics
          </h1>
          <p className="font-serif-body text-sm text-[#5C5A55] mt-1">
            Real database analytics for student views, appreciations, and saved insights.
          </p>
        </div>

        <Link
          href="/teacher/write"
          className="lumen-button-primary py-3.5 px-6 text-xs font-semibold shadow-xs shrink-0 inline-flex items-center gap-2"
        >
          <PenSquare className="h-4 w-4" />
          <span>Write New Insight</span>
        </Link>
      </div>

      {/* Overview Stat Cards — Connected to Real MongoDB Data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center border border-[#A84C32]/10">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">Total Insights</p>
          <h3 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">{analytics?.totalInsights || 0}</h3>
          <p className="text-xs text-[#5C5A55]">{publishedCount} Live · {draftCount} Drafts</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Eye className="h-5 w-5" />
          </div>
          <p className="text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">Total Student Reach</p>
          <h3 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">{totalReach.toLocaleString()}</h3>
          <p className="text-xs text-[#5C5A55] font-medium">Real Views from Database</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
            <Heart className="h-5 w-5" />
          </div>
          <p className="text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">Appreciations</p>
          <h3 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">{totalAppreciations.toLocaleString()}</h3>
          <p className="text-xs text-[#5C5A55] font-medium">Student Likes Received</p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Bookmark className="h-5 w-5" />
          </div>
          <p className="text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">Student Bookmarks</p>
          <h3 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">{totalBookmarks.toLocaleString()}</h3>
          <p className="text-xs text-[#5C5A55] font-medium">Saved to Bookmarks</p>
        </div>
      </div>

      {/* Audience Breakdown by Class Level — Real Database Aggregation */}
      <div className="p-8 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
          <div>
            <span className="eyebrow text-[#A84C32] block mb-1">Target Readership Breakdown</span>
            <h3 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">
              Audience Reach by Class Level
            </h3>
          </div>
          <Users className="h-6 w-6 text-[#A84C32]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-ui">
          {standardClasses.map((cls) => {
            const count = classReachMap[cls.key] || classReachMap[cls.label] || 0;
            const percent = totalReach > 0 ? Math.round((count / maxReach) * 100) : 0;

            return (
              <div key={cls.label} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3">
                <span className="font-serif-display text-base font-semibold text-[#1A1A1A] block">{cls.label}</span>
                <div>
                  <p className="text-xl font-serif-display font-semibold text-[#1A1A1A]">{count.toLocaleString()}</p>
                  <p className="text-[#5C5A55] text-[11px]">Students Reached</p>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E5E1D8] overflow-hidden">
                  <div className={`h-full ${cls.color}`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Published Content Management Table */}
      <div className="p-8 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-4">
          <div>
            <span className="eyebrow text-[#A84C32] block mb-1">Content Management</span>
            <h3 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">
              Your Published Insights & Drafts
            </h3>
          </div>

          <div className="flex items-center gap-2 font-ui text-xs">
            {(["all", "published", "draft"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-full capitalize font-semibold transition-all ${
                  filter === t
                    ? "bg-[#1A1A1A] text-white shadow-2xs"
                    : "bg-[#FAF8F5] border border-[#E5E1D8] text-[#5C5A55] hover:text-[#1A1A1A]"
                }`}
              >
                {t === "all" ? `All (${contents.length})` : t === "published" ? `Published (${publishedCount})` : `Drafts (${draftCount})`}
              </button>
            ))}
          </div>
        </div>

        {filteredContents.length === 0 ? (
          <div className="py-16 text-center space-y-3 font-serif-body">
            <div className="w-12 h-12 rounded-full bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center mx-auto border border-[#A84C32]/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <h4 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">No insights created yet</h4>
            <p className="text-sm text-[#5C5A55] max-w-sm mx-auto">
              Start sharing your subject expertise with students across Medhashine.
            </p>
            <Link
              href="/teacher/write"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-colors"
            >
              <PenSquare className="h-4 w-4" /> Write First Insight
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-ui text-sm">
              <thead>
                <tr className="border-b border-[#E5E1D8] text-[#5C5A55] text-xs font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Insight Title</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Reach (Views)</th>
                  <th className="pb-3">Likes</th>
                  <th className="pb-3">Saves</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]/60">
                {filteredContents.map((c) => (
                  <tr key={c._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-4 pl-2 font-medium text-[#1A1A1A]">
                      <div className="flex flex-col">
                        <span className="font-serif-display text-base font-semibold">{c.title}</span>
                        {(c.className || c.subjectName) && (
                          <span className="text-xs text-[#5C5A55] font-ui font-normal">
                            {c.className} {c.subjectName && `• ${c.subjectName}`} {c.topicName && `• ${c.topicName}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      {c.published ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="h-3.5 w-3.5" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="py-4 font-semibold text-[#1A1A1A]">{(c.viewsCount || 0).toLocaleString()}</td>
                    <td className="py-4 font-semibold text-[#1A1A1A]">{(c.likesCount || 0).toLocaleString()}</td>
                    <td className="py-4 font-semibold text-[#1A1A1A]">{(c.bookmarksCount || 0).toLocaleString()}</td>
                    <td className="py-4 text-xs text-[#5C5A55]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/teacher/write/${c._id}`}
                          className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors"
                          title="Edit Insight"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
                          title="Delete Insight"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
