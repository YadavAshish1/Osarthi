"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Check,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  Sparkles,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Share2,
  Layers,
  GraduationCap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AttemptItem {
  _id: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: string;
  quizRef: {
    _id: string;
    title: string;
    description?: string;
    difficulty?: "easy" | "medium" | "hard";
    subjectRef?: { _id: string; name: string };
    classRef?: { _id: string; name: string };
    createdBy?: { _id: string; name: string; avatar?: string };
    hasTimer?: boolean;
    timeLimitMinutes?: number | null;
  } | null;
}

interface AttemptDetail {
  questionId: string;
  questionText: string;
  type?: "single" | "multiple";
  selectedOptionIds: string[];
  correctOptionIds: string[];
  isCorrect: boolean;
  explanation?: string;
  options: Array<{ id: string; text: string }>;
}

export default function StudentQuizHistory() {
  const { user, ready, openAuth } = useAuth();
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "score-desc" | "score-asc">("recent");

  // Expandable review state
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [detailsCache, setDetailsCache] = useState<Record<string, AttemptDetail[]>>({});

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/quiz/student/attempts");
        setAttempts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load quiz attempt history");
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, user]);

  const handleToggleExpand = async (attemptId: string) => {
    if (expandedAttemptId === attemptId) {
      setExpandedAttemptId(null);
      return;
    }

    setExpandedAttemptId(attemptId);

    if (!detailsCache[attemptId]) {
      setLoadingDetails((prev) => ({ ...prev, [attemptId]: true }));
      try {
        const { data } = await api.get(`/quiz/attempt/${attemptId}`);
        if (data?.details) {
          setDetailsCache((prev) => ({ ...prev, [attemptId]: data.details }));
        }
      } catch (err: any) {
        toast.error("Failed to load question breakdown for this attempt");
      } finally {
        setLoadingDetails((prev) => ({ ...prev, [attemptId]: false }));
      }
    }
  };

  // Distinct subjects
  const subjects = useMemo(() => {
    const list: string[] = [];
    attempts.forEach((a) => {
      const name = a.quizRef?.subjectRef?.name;
      if (name && !list.includes(name)) list.push(name);
    });
    return list;
  }, [attempts]);

  // Filtered & sorted
  const filtered = useMemo(() => {
    let result = attempts.filter((a) => {
      if (!a.quizRef) return false;
      const matchesSearch =
        a.quizRef.title.toLowerCase().includes(search.toLowerCase()) ||
        a.quizRef.subjectRef?.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.quizRef.createdBy?.name?.toLowerCase().includes(search.toLowerCase());

      const matchesSubject =
        subjectFilter === "all" || a.quizRef.subjectRef?.name === subjectFilter;

      return matchesSearch && matchesSubject;
    });

    result.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (sortBy === "score-desc") {
        return b.percentage - a.percentage;
      }
      if (sortBy === "score-asc") {
        return a.percentage - b.percentage;
      }
      return 0;
    });

    return result;
  }, [attempts, search, subjectFilter, sortBy]);

  // Overall Statistics
  const stats = useMemo(() => {
    if (!attempts.length) {
      return { total: 0, avg: 0, highest: 0, passed: 0 };
    }
    const total = attempts.length;
    const sum = attempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const avg = Math.round(sum / total);
    const highest = Math.max(...attempts.map((a) => a.percentage || 0));
    const passed = attempts.filter((a) => (a.percentage || 0) >= 60).length;
    return { total, avg, highest, passed };
  }, [attempts]);

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
        <Loader2 className="w-8 h-8 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">Loading your quiz history…</p>
      </div>
    );
  }

  if (ready && !user) {
    return (
      <div className="py-20 text-center font-ui space-y-4 max-w-md mx-auto">
        <Award className="w-12 h-12 text-[#A84C32] mx-auto opacity-70" />
        <h3 className="font-serif-display text-2xl font-bold text-[#1A1A1A]">Sign in to view your Quiz History</h3>
        <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55]">
          Sign in to access your previous quiz attempts, score analytics, and verified solutions.
        </p>
        <button
          type="button"
          onClick={() => openAuth("login")}
          className="lumen-button-primary px-6 py-2.5 text-xs font-semibold shadow-xs cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-ui">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF8F5] via-white to-[#FBF4F2] border border-[#E5E1D8] shadow-xs">
        <div className="max-w-2xl space-y-2">
          <span className="eyebrow text-[#A84C32] font-bold block text-xs tracking-wider uppercase">
            Student Performance &amp; Assessments
          </span>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            My Attempted Quizzes &amp; Solutions
          </h2>
          <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] leading-relaxed">
            Review all tests you have completed, check your accuracy percentages, and view educator verified solutions and explanations.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-[#E5E1D8]/80">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider block">
              Total Quizzes
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-serif-display text-2xl font-bold text-[#1A1A1A]">
                {stats.total}
              </span>
              <span className="text-[11px] text-[#8C8983]">attempted</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider block">
              Average Score
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-serif-display text-2xl font-bold text-[#A84C32]">
                {stats.avg}%
              </span>
              <span className="text-[11px] text-[#8C8983]">accuracy</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider block">
              Highest Score
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-serif-display text-2xl font-bold text-emerald-700">
                {stats.highest}%
              </span>
              <span className="text-[11px] text-[#8C8983]">peak</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider block">
              Pass Rate (≥60%)
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-serif-display text-2xl font-bold text-[#1A1A1A]">
                {stats.passed}
              </span>
              <span className="text-[11px] text-[#8C8983]">passed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-[#8C8983] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by quiz title, subject, or educator..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5]"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {subjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-ui bg-white focus:outline-none focus:border-[#A84C32] cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-ui bg-white focus:outline-none focus:border-[#A84C32] cursor-pointer"
          >
            <option value="recent">Most Recent First</option>
            <option value="score-desc">Highest Score First</option>
            <option value="score-asc">Lowest Score First</option>
          </select>
        </div>
      </div>

      {/* Attempts List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-3">
          <Award className="h-10 w-10 text-[#8C8983] mx-auto opacity-50" />
          <h3 className="font-serif-display text-lg font-semibold text-[#1A1A1A]">
            No quiz attempts found
          </h3>
          <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] max-w-md mx-auto">
            {search || subjectFilter !== "all"
              ? "No quiz attempts match your current filters. Try resetting search."
              : "You haven't attempted any quizzes yet. Explore tests created by your educators and test your understanding!"}
          </p>
          <div className="pt-2">
            <Link
              href="/teachers"
              className="lumen-button-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold"
            >
              <BookOpen className="h-4 w-4" />
              <span>Explore Quizzes &amp; Educators</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((att) => {
            if (!att.quizRef) return null;
            const isExpanded = expandedAttemptId === att._id;
            const details = detailsCache[att._id];
            const isDetLoading = loadingDetails[att._id];

            const mins = Math.floor((att.timeTakenSeconds || 0) / 60);
            const secs = (att.timeTakenSeconds || 0) % 60;
            const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

            const accuracyBadge =
              att.percentage >= 80
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : att.percentage >= 60
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-rose-50 text-rose-800 border-rose-200";

            return (
              <div
                key={att._id}
                className="rounded-3xl bg-white border border-[#E5E1D8] shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Attempt Summary Row */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {att.quizRef.subjectRef?.name && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A84C32] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#E5E1D8]">
                          {att.quizRef.subjectRef.name}
                        </span>
                      )}
                      {att.quizRef.classRef?.name && (
                        <span className="text-[10px] font-semibold text-[#5C5A55] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E5E1D8]">
                          {att.quizRef.classRef.name}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-[#8C8983] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(att.submittedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Score Tag */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${accuracyBadge}`}
                      >
                        <Award className="h-3.5 w-3.5" />
                        <span>
                          {att.score}/{att.totalQuestions} ({att.percentage}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1A1A] leading-snug">
                        {att.quizRef.title}
                      </h3>
                      {att.quizRef.createdBy && (
                        <p className="text-xs text-[#5C5A55] flex items-center gap-1.5">
                          <span>Educator:</span>
                          <span className="font-semibold text-[#1A1A1A]">
                            {att.quizRef.createdBy.name}
                          </span>
                          <span className="text-[#8C8983]">· Time Taken: {timeStr}</span>
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(att._id)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          isExpanded
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                            : "bg-[#FAF8F5] text-[#A84C32] border-[#E5E1D8] hover:bg-white hover:border-[#A84C32]"
                        }`}
                      >
                        <span>{isExpanded ? "Hide Solutions" : "Review Solutions"}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <Link
                        href={`/quiz/${att.quizRef._id}`}
                        className="p-2 rounded-xl border border-[#E5E1D8] text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                        title="View Quiz Page"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Expanded Solutions Drawer */}
                {isExpanded && (
                  <div className="p-5 sm:p-7 bg-[#FAF8F5]/80 border-t border-[#E5E1D8] space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[#E5E1D8]/80 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#A84C32]" />
                        <h4 className="font-serif-display text-base font-bold text-[#1A1A1A]">
                          Question-by-Question Solution Breakdown
                        </h4>
                      </div>
                      <span className="text-xs text-[#5C5A55]">
                        {att.score} of {att.totalQuestions} answered correctly
                      </span>
                    </div>

                    {isDetLoading ? (
                      <div className="py-12 text-center flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 text-[#A84C32] animate-spin mb-2" />
                        <p className="text-xs text-[#5C5A55]">Loading verified solutions…</p>
                      </div>
                    ) : details && details.length > 0 ? (
                      <div className="space-y-4">
                        {details.map((q, idx) => (
                          <div
                            key={q.questionId}
                            className={`p-4 sm:p-5 rounded-2xl bg-white border shadow-2xs space-y-3 ${
                              q.isCorrect ? "border-emerald-200" : "border-rose-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] font-bold text-xs text-[#1A1A1A] flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <div>
                                  <h5 className="font-serif-display text-sm sm:text-base font-semibold text-[#1A1A1A]">
                                    {q.questionText}
                                  </h5>
                                  <span className="text-[10px] text-[#8C8983] font-semibold">
                                    {q.type === "multiple"
                                      ? "Multiple Choice Question"
                                      : "Single Choice Question"}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 shrink-0 ${
                                  q.isCorrect
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                {q.isCorrect ? (
                                  <CheckCircle2 className="h-3 w-3" />
                                ) : (
                                  <XCircle className="h-3 w-3" />
                                )}
                                <span>{q.isCorrect ? "Correct" : "Incorrect"}</span>
                              </span>
                            </div>

                            {/* Options Breakdown */}
                            <div className="space-y-2 pt-1">
                              {q.options.map((opt) => {
                                const isStudentPick = q.selectedOptionIds.includes(opt.id);
                                const isCorrectAnswer = q.correctOptionIds.includes(opt.id);

                                let style = "bg-white border-[#E5E1D8] text-[#1A1A1A]";
                                if (isCorrectAnswer && isStudentPick) {
                                  style = "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium";
                                } else if (isCorrectAnswer && !isStudentPick) {
                                  style = "bg-emerald-50/30 border-dashed border-emerald-300 text-emerald-900";
                                } else if (isStudentPick && !isCorrectAnswer) {
                                  style = "bg-rose-50/70 border-rose-300 text-rose-950";
                                }

                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${style}`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span
                                        className={`w-5 h-5 ${
                                          q.type === "multiple" ? "rounded-md" : "rounded-full"
                                        } font-bold text-xs flex items-center justify-center shrink-0 ${
                                          isCorrectAnswer && isStudentPick
                                            ? "bg-emerald-600 text-white"
                                            : isCorrectAnswer
                                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                            : isStudentPick
                                            ? "bg-rose-600 text-white"
                                            : "bg-gray-100 text-[#5C5A55]"
                                        }`}
                                      >
                                        {isCorrectAnswer && isStudentPick ? (
                                          <Check className="h-3 w-3 stroke-[3]" />
                                        ) : isCorrectAnswer ? (
                                          <Check className="h-3 w-3" />
                                        ) : isStudentPick ? (
                                          <X className="h-3 w-3 stroke-[3]" />
                                        ) : null}
                                      </span>
                                      <span
                                        className={
                                          isStudentPick && !isCorrectAnswer
                                            ? "line-through opacity-80"
                                            : ""
                                        }
                                      >
                                        {opt.text}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {isCorrectAnswer && isStudentPick && (
                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                          ✓ Correct (Your Choice)
                                        </span>
                                      )}
                                      {isCorrectAnswer && !isStudentPick && (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200">
                                          ✓ Correct Answer (Missed)
                                        </span>
                                      )}
                                      {isStudentPick && !isCorrectAnswer && (
                                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                                          ✗ Your Choice (Incorrect)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Explanation */}
                            {q.explanation && (
                              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs space-y-1">
                                <p className="font-semibold text-[#A84C32] uppercase tracking-wider text-[10px]">
                                  Teacher Explanation:
                                </p>
                                <p className="text-[#5C5A55] leading-relaxed">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#5C5A55] italic">No question details available.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

