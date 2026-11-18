"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Brain,
  CheckCircle2,
  Users,
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
  Loader2,
  Calendar,
  AlertCircle,
  Eye,
  BarChart3,
  Sparkles,
  HelpCircle,
  Layers,
  Send,
  RefreshCw,
  Share2,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface QuizStatsItem {
  _id: string;
  title: string;
  description?: string;
  published: boolean;
  subjectName: string;
  className: string;
  difficulty: "easy" | "medium" | "hard";
  hasTimer?: boolean;
  timeLimitMinutes?: number | null;
  isClosed?: boolean;
  closedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  publishedAt?: string;
  attemptCount: number;
  avgScore: number;
}

interface StudentAttempt {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: string;
}

interface QuestionStat {
  id: string;
  text: string;
  type: string;
  totalAnswered: number;
  correctCount: number;
  accuracyPercentage: number;
}

interface QuizAnalyticsData {
  totalQuizzes: number;
  publishedQuizzes: number;
  totalAttempts: number;
  totalUniqueStudents: number;
  avgScore: number;
  passRate: number;
  quizzes: QuizStatsItem[];
  recentAttempts: Array<any>;
}

interface QuizAnalyticsDashboardProps {
  onNewQuiz?: () => void;
  onEditQuiz?: (quizId: string) => void;
}

export default function QuizAnalyticsDashboard({ onNewQuiz, onEditQuiz }: QuizAnalyticsDashboardProps) {
  const [data, setData] = useState<QuizAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

  // Expanded Quiz Details State
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [selectedQuizAttempts, setSelectedQuizAttempts] = useState<StudentAttempt[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStat[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<Record<string, number> | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"attempts" | "questions">("attempts");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/quiz/teacher/analytics");
      setData(res.data);
    } catch {
      toast.error("Failed to load quiz analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Load attempt & question analytics when a quiz is expanded
  const handleToggleExpand = async (quizId: string) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null);
      return;
    }

    setExpandedQuizId(quizId);
    setAttemptsLoading(true);
    setSelectedQuizAttempts([]);
    setQuestionStats([]);
    setScoreDistribution(null);

    try {
      const [attemptsRes, analyticsRes] = await Promise.all([
        api.get(`/quiz/${quizId}/attempts`),
        api.get(`/quiz/${quizId}/analytics`),
      ]);
      setSelectedQuizAttempts(attemptsRes.data?.attempts || []);
      setQuestionStats(analyticsRes.data?.questionStats || []);
      setScoreDistribution(analyticsRes.data?.scoreDistribution || null);
    } catch {
      toast.error("Failed to load detailed quiz attempt data");
    } finally {
      setAttemptsLoading(false);
    }
  };

  // Publish / Unpublish handler
  const handlePublishToggle = async (quiz: QuizStatsItem) => {
    try {
      if (!quiz.published) {
        const { data: res } = await api.post(`/quiz/${quiz._id}/publish`);
        toast.success(`Published "${quiz.title}"! Notified ${res?.notifiedCount || 0} students.`);
      } else {
        await api.put(`/quiz/${quiz._id}`, { published: false });
        toast.info(`Moved "${quiz.title}" to drafts`);
      }
      fetchAnalytics();
    } catch {
      toast.error("Failed to update publish state");
    }
  };

  // Manual close / reopen handler
  const handleToggleClose = async (quiz: QuizStatsItem) => {
    try {
      const { data: res } = await api.patch(`/quiz/${quiz._id}/toggle-close`);
      toast.success(res.message);
      fetchAnalytics();
    } catch {
      toast.error("Failed to update quiz status");
    }
  };

  // Delete quiz handler
  const handleDeleteQuiz = async (quiz: QuizStatsItem) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${quiz.title}"? All student attempts and stats will be deleted.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/quiz/${quiz._id}`);
      toast.success(`Deleted quiz "${quiz.title}"`);
      fetchAnalytics();
    } catch {
      toast.error("Failed to delete quiz");
    }
  };

  // Share quiz handler
  const handleShareQuiz = async (quiz: QuizStatsItem) => {
    const url = `${window.location.origin}/quiz/${quiz._id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: quiz.title,
          text: `Take this quiz on Medhashine: ${quiz.title}`,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Quiz link copied to clipboard! Share it with your students.");
    } catch {
      toast.error("Could not copy link to clipboard");
    }
  };

  const filteredQuizzes = useMemo(() => {
    if (!data?.quizzes) return [];
    return data.quizzes.filter((q) => {
      if (statusFilter === "published" && !q.published) return false;
      if (statusFilter === "draft" && q.published) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesSub = q.subjectName.toLowerCase().includes(query);
        const matchesClass = q.className.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSub && !matchesClass) return false;
      }
      return true;
    });
  }, [data?.quizzes, statusFilter, searchQuery]);

  if (loading && !data) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">Loading Quiz Analytics &amp; Student Performance…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 font-ui">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] flex items-center justify-center">
            <Brain className="h-4.5 w-4.5" />
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#5C5A55] uppercase tracking-wider">Total Quizzes</p>
          <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            {data?.totalQuizzes || 0}
          </h3>
          <p className="text-[11px] text-[#5C5A55]">
            {data?.publishedQuizzes || 0} Live · {(data?.totalQuizzes || 0) - (data?.publishedQuizzes || 0)} Drafts
          </p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
            <Users className="h-4.5 w-4.5" />
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#5C5A55] uppercase tracking-wider">Total Attempts</p>
          <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            {(data?.totalAttempts || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-[#5C5A55]">{data?.totalUniqueStudents || 0} Unique Students</p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center">
            <Award className="h-4.5 w-4.5" />
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#5C5A55] uppercase tracking-wider">Average Score</p>
          <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            {data?.avgScore || 0}%
          </h3>
          <p className="text-[11px] text-[#5C5A55]">Across all student attempts</p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#5C5A55] uppercase tracking-wider">Pass Rate (≥60%)</p>
          <h3 className="font-serif-display text-2xl sm:text-3xl font-bold text-emerald-700">
            {data?.passRate || 0}%
          </h3>
          <p className="text-[11px] text-[#5C5A55]">Students reaching mastery</p>
        </div>
      </div>

      {/* Quizzes Management & Student Attempts Section */}
      <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-5">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-5">
          <div>
            <span className="eyebrow text-[#A84C32] block mb-1 text-[11px] sm:text-xs">
              Student Assessment Performance
            </span>
            <h3 className="font-serif-display text-xl sm:text-2xl font-semibold text-[#1A1A1A]">
              Quizzes &amp; Student Submissions
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E5E1D8] text-xs">
              {(["all", "published", "draft"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                    statusFilter === tab
                      ? "bg-[#1A1A1A] text-white shadow-2xs"
                      : "text-[#5C5A55] hover:text-[#1A1A1A]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchAnalytics}
              title="Refresh Quiz Stats"
              className="p-2 sm:p-2.5 rounded-xl border border-[#E5E1D8] bg-white text-[#5C5A55] hover:text-[#1A1A1A] hover:border-[#A84C32] cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5A55]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quizzes by title, subject, or class..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] transition-colors"
          />
        </div>

        {/* Quiz Items List */}
        {filteredQuizzes.length === 0 ? (
          <div className="py-16 text-center bg-[#FAF8F5] rounded-2xl border border-[#E5E1D8] p-6 space-y-3">
            <Brain className="h-10 w-10 text-[#5C5A55] mx-auto opacity-50" />
            <h4 className="font-serif-display text-lg font-semibold text-[#1A1A1A]">No quizzes created yet</h4>
            <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] max-w-md mx-auto">
              Create your first topic-wise or weekly quiz to assess students, track scores, and send subscriber notifications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.map((quiz) => {
              const isExpanded = expandedQuizId === quiz._id;
              const isExpired = Boolean(quiz.expiresAt && new Date(quiz.expiresAt) < new Date());
              const isManuallyClosed = Boolean(quiz.isClosed);
              const difficultyBadgeColors = {
                easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
                medium: "bg-amber-50 text-amber-700 border-amber-200",
                hard: "bg-rose-50 text-rose-700 border-rose-200",
              }[quiz.difficulty] || "bg-gray-50 text-gray-700 border-gray-200";

              return (
                <div
                  key={quiz._id}
                  className={`rounded-2xl border transition-all duration-200 ${
                    isExpanded ? "border-[#A84C32] bg-white shadow-md ring-1 ring-[#A84C32]/20" : "border-[#E5E1D8] bg-[#FAF8F5]/60 hover:bg-white hover:border-[#A84C32]/60"
                  }`}
                >
                  {/* Quiz Summary Header Row */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-[#E5E1D8] text-[#A84C32] px-2.5 py-0.5 rounded-full">
                          {quiz.subjectName}
                        </span>
                        <span className="text-[10px] font-semibold text-[#5C5A55] bg-white border border-[#E5E1D8] px-2 py-0.5 rounded-full">
                          {quiz.className}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${difficultyBadgeColors}`}>
                          {quiz.difficulty}
                        </span>
                        {!quiz.published ? (
                          <span className="text-[10px] font-semibold text-[#5C5A55] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                            Draft
                          </span>
                        ) : isManuallyClosed ? (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="h-2.5 w-2.5" /> Closed
                          </span>
                        ) : isExpired ? (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> Expired
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                          </span>
                        )}
                        {quiz.expiresAt && (
                          <span
                            className="text-[10px] text-[#5C5A55] bg-white border border-[#E5E1D8] px-2 py-0.5 rounded-full flex items-center gap-1"
                            title={`Close deadline: ${new Date(quiz.expiresAt).toLocaleString()}`}
                          >
                            <Calendar className="h-2.5 w-2.5 text-[#A84C32]" />
                            <span>
                              {isExpired ? "Closed on: " : "Closes: "}
                              {new Date(quiz.expiresAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif-display text-base sm:text-lg font-semibold text-[#1A1A1A] truncate">
                        {quiz.title}
                      </h4>

                      {quiz.description && (
                        <p className="font-serif-body text-xs text-[#5C5A55] line-clamp-1">
                          {quiz.description}
                        </p>
                      )}
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[#E5E1D8]/60 flex-wrap">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-semibold text-[#5C5A55]">Submissions</p>
                        <p className="font-serif-display text-base sm:text-lg font-bold text-[#1A1A1A]">
                          {quiz.attemptCount}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] uppercase font-semibold text-[#5C5A55]">Avg. Score</p>
                        <p className="font-serif-display text-base sm:text-lg font-bold text-[#A84C32]">
                          {quiz.avgScore}%
                        </p>
                      </div>

                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={() => handleShareQuiz(quiz)}
                        title="Share Quiz Link (Copy / WhatsApp)"
                        className="p-2 rounded-xl bg-white border border-[#E5E1D8] text-[#5C5A55] hover:text-[#A84C32] hover:border-[#A84C32] transition-colors cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Preview Button */}
                      <Link
                        href={`/quiz/${quiz._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Preview Quiz Screen"
                        className="p-2 rounded-xl bg-white border border-[#E5E1D8] text-[#5C5A55] hover:text-[#1A1A1A] hover:border-[#A84C32] transition-colors cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => onEditQuiz?.(quiz._id)}
                        title="Edit Quiz & Settings"
                        className="p-2 rounded-xl bg-white border border-[#E5E1D8] text-[#5C5A55] hover:text-[#1A1A1A] hover:border-[#A84C32] transition-colors cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      {/* Close / Reopen Toggle */}
                      {quiz.published && (
                        <button
                          type="button"
                          onClick={() => handleToggleClose(quiz)}
                          title={quiz.isClosed ? "Reopen quiz for student submissions" : "Close quiz submissions manually"}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            quiz.isClosed
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              : "bg-white border-[#E5E1D8] text-[#5C5A55] hover:text-rose-700 hover:border-rose-300"
                          }`}
                        >
                          {quiz.isClosed ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          <span>{quiz.isClosed ? "Reopen" : "Close"}</span>
                        </button>
                      )}

                      {/* Publish / Unpublish */}
                      <button
                        type="button"
                        onClick={() => handlePublishToggle(quiz)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-colors cursor-pointer ${
                          quiz.published
                            ? "bg-white border-[#E5E1D8] text-[#5C5A55] hover:text-rose-700 hover:border-rose-300"
                            : "bg-[#A84C32] text-white border-transparent hover:bg-[#8B3A25]"
                        }`}
                      >
                        {quiz.published ? "Unpublish" : "Publish & Notify"}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteQuiz(quiz)}
                        title="Delete Quiz"
                        className="p-2 rounded-xl bg-white border border-[#E5E1D8] text-[#5C5A55] hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Results Drawer Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(quiz._id)}
                        className="p-2 rounded-xl bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer shadow-2xs"
                      >
                        <span>{isExpanded ? "Hide" : "Results"}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details Drawer */}
                  {isExpanded && (
                    <div className="border-t border-[#E5E1D8] p-4 sm:p-6 bg-white rounded-b-2xl space-y-5 animate-in fade-in duration-200">
                      {/* Sub-tabs: Student Submissions vs Question Performance */}
                      <div className="flex items-center gap-2 border-b border-[#E5E1D8] pb-3">
                        <button
                          type="button"
                          onClick={() => setActiveDetailTab("attempts")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeDetailTab === "attempts"
                              ? "bg-[#1A1A1A] text-white"
                              : "bg-[#FAF8F5] text-[#5C5A55] hover:text-[#1A1A1A]"
                          }`}
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Student Submissions ({selectedQuizAttempts.length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveDetailTab("questions")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeDetailTab === "questions"
                              ? "bg-[#1A1A1A] text-white"
                              : "bg-[#FAF8F5] text-[#5C5A55] hover:text-[#1A1A1A]"
                          }`}
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                          <span>Question Accuracy Breakdown</span>
                        </button>
                      </div>

                      {attemptsLoading ? (
                        <div className="py-12 text-center flex flex-col items-center justify-center">
                          <Loader2 className="h-6 w-6 text-[#A84C32] animate-spin mb-2" />
                          <p className="font-serif-body text-xs text-[#5C5A55]">Loading detailed student responses…</p>
                        </div>
                      ) : activeDetailTab === "attempts" ? (
                        /* TAB 1: Student Attempts Table */
                        selectedQuizAttempts.length === 0 ? (
                          <div className="py-10 text-center font-serif-body text-xs text-[#5C5A55]">
                            No students have attempted this quiz yet. Once students take this quiz, their scores, time taken, and answers will appear here.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-ui">
                              <thead>
                                <tr className="border-b border-[#E5E1D8] text-[#5C5A55] font-semibold">
                                  <th className="pb-3 pr-4">Student</th>
                                  <th className="pb-3 px-4">Score</th>
                                  <th className="pb-3 px-4">Percentage</th>
                                  <th className="pb-3 px-4">Time Taken</th>
                                  <th className="pb-3 pl-4">Submitted At</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E5E1D8]/60">
                                {selectedQuizAttempts.map((attempt) => {
                                  const student = attempt.student;
                                  const mins = Math.floor(attempt.timeTakenSeconds / 60);
                                  const secs = attempt.timeTakenSeconds % 60;
                                  const timeFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

                                  const pctClass =
                                    attempt.percentage >= 75
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : attempt.percentage >= 50
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200";

                                  return (
                                    <tr key={attempt._id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                                      <td className="py-3 pr-4 flex items-center gap-2.5">
                                        {student?.avatar ? (
                                          <img
                                            src={student.avatar}
                                            alt={student.name}
                                            className="w-7 h-7 rounded-lg object-cover border border-[#E5E1D8]"
                                          />
                                        ) : (
                                          <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] font-bold flex items-center justify-center text-xs">
                                            {student?.name?.[0] || "S"}
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-semibold text-[#1A1A1A]">{student?.name || "Student"}</p>
                                          <p className="text-[10px] text-[#8C8983]">{student?.email}</p>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 font-semibold text-[#1A1A1A]">
                                        {attempt.score} / {attempt.totalQuestions}
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${pctClass}`}>
                                          {attempt.percentage}%
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-[#5C5A55] font-medium flex items-center gap-1">
                                        <Clock className="h-3 w-3 text-[#A84C32]" />
                                        <span>{timeFormatted}</span>
                                      </td>
                                      <td className="py-3 pl-4 text-[#5C5A55]">
                                        {new Date(attempt.submittedAt).toLocaleDateString(undefined, {
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )
                      ) : (
                        /* TAB 2: Question Accuracy Breakdown */
                        <div className="space-y-4">
                          {scoreDistribution && (
                            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-2">
                              <p className="text-xs font-semibold text-[#5C5A55] uppercase tracking-wider">
                                Class Score Distribution
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {Object.entries(scoreDistribution).map(([range, count]) => (
                                  <div key={range} className="p-2.5 bg-white rounded-lg border border-[#E5E1D8] text-center">
                                    <p className="text-[10px] text-[#5C5A55] font-medium">{range}</p>
                                    <p className="font-serif-display text-lg font-bold text-[#1A1A1A]">{count} students</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-2.5">
                            <p className="text-xs font-semibold text-[#5C5A55]">Question Accuracy Breakdown:</p>
                            {questionStats.map((q, idx) => (
                              <div key={q.id || idx} className="p-3.5 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5]/50 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-xs font-semibold text-[#1A1A1A] flex-1">
                                    <span className="text-[#A84C32] mr-1.5">Q{idx + 1}.</span>
                                    {q.text}
                                  </p>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                                      q.accuracyPercentage >= 70
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : q.accuracyPercentage >= 40
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}
                                  >
                                    {q.accuracyPercentage}% Correct
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-[#E5E1D8] overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      q.accuracyPercentage >= 70
                                        ? "bg-emerald-500"
                                        : q.accuracyPercentage >= 40
                                        ? "bg-amber-500"
                                        : "bg-rose-500"
                                    }`}
                                    style={{ width: `${q.accuracyPercentage}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-[#8C8983]">
                                  {q.correctCount} of {q.totalAnswered} answered correctly
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

