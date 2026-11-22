"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Award,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  Play,
  FileText,
  ShieldCheck,
  Check,
  Timer,
  Layers,
  Share2,
  Lock,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import SubscribeButton from "@/components/SubscribeButton";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  type: "single" | "multiple";
  options: Option[];
}

interface QuizData {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  subjectRef?: { _id: string; name: string };
  classRef?: { _id: string; name: string };
  createdBy?: { _id: string; name: string; avatar?: string; bio?: string };
  hasTimer?: boolean;
  timeLimitMinutes?: number | null;
  difficulty?: "easy" | "medium" | "hard";
  isClosed?: boolean;
  expiresAt?: string | null;
  questions: Question[];
}

interface AttemptResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt?: string;
  details: Array<{
    questionId: string;
    questionText: string;
    type?: "single" | "multiple";
    selectedOptionIds: string[];
    correctOptionIds: string[];
    isCorrect: boolean;
    explanation?: string;
    options: Option[];
  }>;
}

export default function QuizTakingClient({ id }: { id: string }) {
  const router = useRouter();
  const { user, ready, openAuth } = useAuth();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [attemptSubmittedAt, setAttemptSubmittedAt] = useState<string | null>(null);

  // Pre-quiz instructions state
  const [quizStarted, setQuizStarted] = useState(false);

  // Taking state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const endTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to always hold the latest handleSubmit — avoids stale closure in timer interval
  const handleSubmitRef = useRef<() => void>(() => {});
  const answersRef = useRef<Record<string, string[]>>({});
  const hasRestoredRef = useRef(false);

  // Refs for auto-scrolling question tracker
  const trackerContainerRef = useRef<HTMLDivElement | null>(null);
  const activePillRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll the progress tracker so the active question pill is always smoothly centered in view
  useEffect(() => {
    if (activePillRef.current && trackerContainerRef.current) {
      const container = trackerContainerRef.current;
      const pill = activePillRef.current;
      const pillLeft = pill.offsetLeft;
      const pillWidth = pill.offsetWidth;
      const containerWidth = container.clientWidth;
      const targetScroll = pillLeft - containerWidth / 2 + pillWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    }
  }, [currentIndex, quizStarted]);

  // Sync answers to ref for zero-latency retrieval
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  // Wall-clock countdown timer handler
  const startTimerWithEndTime = useCallback((targetEndTime: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    endTimeRef.current = targetEndTime;

    const tick = () => {
      const left = Math.max(0, Math.round((targetEndTime - Date.now()) / 1000));
      setSecondsRemaining(left);
      if (left <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        toast.warning("Time is up! Submitting your answers automatically...");
        handleSubmitRef.current();
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);
  }, []);

  // Fetch Quiz & Auto-Restore In-Progress Attempt
  useEffect(() => {
    if (!ready) return;

    if (!user) {
      toast.info("Please sign in to take this quiz");
      openAuth("login");
    }

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/quiz/${id}/take`);
        setQuiz(data);

        // Auto-Restore in-progress attempt from localStorage on page refresh
        if (typeof window !== "undefined" && !hasRestoredRef.current) {
          hasRestoredRef.current = true;
          try {
            const savedStr = localStorage.getItem(`medhashine_quiz_progress_${id}`);
            if (savedStr) {
              const saved = JSON.parse(savedStr);
              if (saved && saved.quizStarted) {
                const restoredAnswers = saved.answers || {};
                setAnswers(restoredAnswers);
                answersRef.current = restoredAnswers;

                const restoredIndex = Math.min(
                  Math.max(0, saved.currentIndex || 0),
                  Math.max(0, (data.questions?.length || 1) - 1)
                );
                setCurrentIndex(restoredIndex);

                if (saved.startedAt) {
                  startTimeRef.current = saved.startedAt;
                }

                const isTimed = Boolean(
                  data.hasTimer || (data.timeLimitMinutes && data.timeLimitMinutes > 0)
                );

                if (isTimed && saved.endTime) {
                  const left = Math.max(0, Math.round((saved.endTime - Date.now()) / 1000));
                  if (left <= 0) {
                    // Time expired while user was away
                    setQuizStarted(true);
                    setSecondsRemaining(0);
                    toast.warning("Time expired while you were away. Submitting your answers automatically...");
                    setTimeout(() => {
                      handleSubmitRef.current();
                    }, 500);
                    return;
                  } else {
                    setQuizStarted(true);
                    startTimerWithEndTime(saved.endTime);
                    toast.info("Resumed your quiz in progress. Your previous answers have been restored.");
                    return;
                  }
                } else {
                  setQuizStarted(true);
                  setSecondsRemaining(null);
                  toast.info("Resumed your quiz in progress. Your previous answers have been restored.");
                  return;
                }
              }
            }
          } catch (e) {
            console.warn("Failed to restore quiz attempt", e);
          }
        }
      } catch (err: any) {
        if (err?.response?.status === 409 && err.response?.data?.attemptId) {
          if (typeof window !== "undefined") {
            localStorage.removeItem(`medhashine_quiz_progress_${id}`);
          }
          try {
            const attemptId = err.response.data.attemptId;
            const { data: attemptData } = await api.get(`/quiz/attempt/${attemptId}`);
            setQuiz(attemptData.quiz);
            setResult({
              score: attemptData.attempt.score,
              totalQuestions: attemptData.attempt.totalQuestions,
              percentage: attemptData.attempt.percentage,
              timeTakenSeconds: attemptData.attempt.timeTakenSeconds,
              submittedAt: attemptData.attempt.submittedAt,
              details: attemptData.details,
            });
            setAlreadyAttempted(true);
            setAttemptSubmittedAt(attemptData.attempt.submittedAt);
            return;
          } catch {
            // fallback
          }
        }
        const msg = err?.response?.data?.message || "Failed to load quiz";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, ready, user, openAuth, startTimerWithEndTime]);

  // Submit Handler
  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting || result) return;

    setSubmitting(true);
    setShowSubmitWarning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const currentAnswers = answersRef.current || answers;
    const answersPayload = (quiz.questions || []).map((q) => ({
      questionId: q.id,
      selectedOptionIds: currentAnswers[q.id] || [],
    }));

    try {
      const { data } = await api.post(`/quiz/${quiz._id}/submit`, {
        answers: answersPayload,
        timeTakenSeconds: elapsedSeconds,
      });

      setResult({
        score: data.attempt.score,
        totalQuestions: data.attempt.totalQuestions,
        percentage: data.attempt.percentage,
        timeTakenSeconds: data.attempt.timeTakenSeconds,
        details: data.details,
      });

      // Clear in-progress progress once submitted successfully
      if (typeof window !== "undefined") {
        localStorage.removeItem(`medhashine_quiz_progress_${quiz._id}`);
      }

      toast.success("Quiz submitted successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }, [quiz, answers, submitting, result]);

  // Keep ref always up-to-date with the latest handleSubmit (fixes stale closure in timer)
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Auto-Save in-progress quiz progress to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (quizStarted && !result && !alreadyAttempted) {
      try {
        localStorage.setItem(
          `medhashine_quiz_progress_${id}`,
          JSON.stringify({
            quizStarted: true,
            answers,
            currentIndex,
            startedAt: startTimeRef.current,
            endTime: endTimeRef.current,
          })
        );
      } catch (e) {
        console.warn("Failed to auto-save quiz progress", e);
      }
    }
  }, [id, quizStarted, answers, currentIndex, result, alreadyAttempted]);

  // Warn user before refreshing or navigating away during an active quiz
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (quizStarted && !result && !alreadyAttempted) {
        e.preventDefault();
        e.returnValue = "You have an active quiz attempt in progress. Your progress will be saved.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [quizStarted, result, alreadyAttempted]);

  // Guard: check for unanswered questions before submitting (not called by timer auto-submit)
  const handleSubmitGuarded = () => {
    if (!quiz) return;
    const currentAnswers = answersRef.current || answers;
    const unanswered = quiz.questions.filter((q) => !(currentAnswers[q.id]?.length));
    if (unanswered.length > 0) {
      setShowSubmitWarning(true);
    } else {
      handleSubmit();
    }
  };

  // Start Quiz Handler (Transition from Instructions Screen to Active Quiz)
  const handleStartQuiz = () => {
    if (!quiz) return;
    if (!user) {
      toast.info("Please sign in to start the quiz");
      openAuth("login");
      return;
    }

    const now = Date.now();
    startTimeRef.current = now;
    setQuizStarted(true);

    const isTimed = Boolean(quiz.hasTimer || (quiz.timeLimitMinutes && quiz.timeLimitMinutes > 0));
    let targetEndTime: number | null = null;
    if (isTimed && quiz.timeLimitMinutes) {
      targetEndTime = now + quiz.timeLimitMinutes * 60 * 1000;
      startTimerWithEndTime(targetEndTime);
    } else {
      setSecondsRemaining(null); // Untimed
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `medhashine_quiz_progress_${id}`,
          JSON.stringify({
            quizStarted: true,
            answers: {},
            currentIndex: 0,
            startedAt: now,
            endTime: targetEndTime,
          })
        );
      } catch (e) {
        console.warn("Failed to persist initial quiz start", e);
      }
    }
  };

  // Cleanup timer interval on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleSelectOption = (questionId: string, optionId: string, isMultiple = false) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        const next = current.includes(optionId)
          ? current.filter((x) => x !== optionId)
          : [...current, optionId];
        return { ...prev, [questionId]: next };
      } else {
        return { ...prev, [questionId]: [optionId] };
      }
    });
  };

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({
        title: quiz?.title || "Quiz on Medhashine",
        text: `Take this quiz on Medhashine: ${quiz?.title}`,
        url,
      }).catch(() => {});
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Quiz link copied to clipboard! Share it with your friends.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
        <Loader2 className="w-9 h-9 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">Preparing your quiz…</p>
      </div>
    );
  }

  if (error || !quiz) {
    const isClosedOrExpired =
      error?.toLowerCase().includes("closed") ||
      error?.toLowerCase().includes("expired");

    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center font-ui space-y-5 animate-in fade-in">
        <div
          className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center border shadow-xs ${
            isClosedOrExpired
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}
        >
          {isClosedOrExpired ? <Lock className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
        </div>
        <div className="space-y-1.5">
          <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            {isClosedOrExpired ? "Quiz Submissions Closed" : "Unable to take quiz"}
          </h2>
          <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] max-w-md mx-auto leading-relaxed">
            {error || "This quiz could not be loaded or is no longer available."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="lumen-button-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Home
          </Link>
          <Link
            href="/teachers"
            className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] bg-white text-xs font-semibold text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors"
          >
            Explore Teachers &amp; Quizzes
          </Link>
        </div>
      </div>
    );
  }

  // ─── SCREEN 1: INSTRUCTIONS & OVERVIEW (BEFORE STARTING) ───────────────────
  if (!quizStarted && !result) {
    const isTimed = Boolean(quiz.hasTimer || (quiz.timeLimitMinutes && quiz.timeLimitMinutes > 0));
    const difficultyBadgeColors = {
      easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      hard: "bg-rose-50 text-rose-700 border-rose-200",
    }[quiz.difficulty || "medium"] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 font-ui space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        {/* Navigation Breadcrumb & Share Button */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55] hover:text-[#A84C32] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="px-3.5 py-1.5 rounded-full border border-[#E5E1D8] bg-white text-xs font-semibold text-[#5C5A55] hover:text-[#A84C32] hover:border-[#A84C32] transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share Quiz</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {quiz.subjectRef?.name && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A84C32] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#E5E1D8]">
                  {quiz.subjectRef.name}
                </span>
              )}
              {quiz.classRef?.name && (
                <span className="text-[11px] font-semibold text-[#5C5A55] bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E5E1D8]">
                  {quiz.classRef.name}
                </span>
              )}
              <span className={`text-[11px] font-semibold uppercase px-2.5 py-1 rounded-full border ${difficultyBadgeColors}`}>
                {quiz.difficulty || "medium"}
              </span>
              {isTimed ? (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Timed Quiz ({quiz.timeLimitMinutes} Mins)
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Practice Mode (Untimed)
                </span>
              )}
            </div>

            {quiz.expiresAt && (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>Submission Deadline:</strong>{" "}
                    {new Date(quiz.expiresAt).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            )}

            <h1 className="font-serif-display text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-tight">
              {quiz.title}
            </h1>

            {quiz.description && (
              <p className="font-serif-body text-sm sm:text-base text-[#5C5A55] leading-relaxed pt-1">
                {quiz.description}
              </p>
            )}
          </div>

          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E5E1D8]/80">
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] text-center">
              <p className="text-[10px] font-semibold text-[#5C5A55] uppercase tracking-wider">Total Questions</p>
              <p className="font-serif-display text-xl sm:text-2xl font-bold text-[#1A1A1A] mt-0.5">
                {quiz.questions.length}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] text-center">
              <p className="text-[10px] font-semibold text-[#5C5A55] uppercase tracking-wider">Time Limit</p>
              <p className="font-serif-display text-xl sm:text-2xl font-bold text-[#A84C32] mt-0.5">
                {isTimed ? `${quiz.timeLimitMinutes}m` : "Untimed"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] text-center">
              <p className="text-[10px] font-semibold text-[#5C5A55] uppercase tracking-wider">Format</p>
              <p className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1A1A] mt-0.5">
                MCQs
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] text-center">
              <p className="text-[10px] font-semibold text-[#5C5A55] uppercase tracking-wider">Solutions</p>
              <p className="font-serif-display text-lg sm:text-xl font-bold text-emerald-700 mt-0.5">
                Instant
              </p>
            </div>
          </div>

          {/* Teacher Profile Info */}
          {quiz.createdBy && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {quiz.createdBy.avatar ? (
                  <img
                    src={quiz.createdBy.avatar}
                    alt={quiz.createdBy.name}
                    className="w-11 h-11 rounded-xl object-cover border border-[#E5E1D8]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-sm">
                    {quiz.createdBy.name?.[0] || "T"}
                  </div>
                )}
                <div>
                  <p className="font-serif-display text-sm font-semibold text-[#1A1A1A]">
                    {quiz.createdBy.name}
                  </p>
                  <p className="text-[11px] text-[#5C5A55]">Quiz Author &amp; Educator</p>
                </div>
              </div>

              <SubscribeButton
                teacherId={quiz.createdBy._id}
                teacherName={quiz.createdBy.name}
                showCount={true}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Instructions Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-[#E5E1D8] pb-4">
            <FileText className="h-5 w-5 text-[#A84C32]" />
            <h2 className="font-serif-display text-xl font-bold text-[#1A1A1A]">
              Important Instructions for Students
            </h2>
          </div>

          <div className="space-y-3.5 text-xs sm:text-sm text-[#2A2A2A] font-serif-body leading-relaxed">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p>
                <strong>Question Navigation:</strong> You can navigate freely between questions using the <em>Previous</em> and <em>Next</em> buttons or by clicking on any question number in the progress tracker.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p>
                <strong>Changing Answers:</strong> You can change your selected options as many times as you like before clicking the final <em>Submit Quiz</em> button.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong>Timer Policy: </strong>
                {isTimed ? (
                  <span className="text-amber-900 bg-amber-50 px-1 py-0.5 rounded font-medium">
                    The timer of <strong>{quiz.timeLimitMinutes} minutes</strong> will start counting down as soon as you click the button below. When time runs out, your current answers will be automatically submitted.
                  </span>
                ) : (
                  <span>
                    This is an untimed practice quiz. Take all the time you need to think through and solve each question.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <p>
                <strong>Instant Explanations:</strong> Immediately upon submission, you will see your total score, percentage, correct answers, and detailed teacher explanations for each question.
              </p>
            </div>

            {/* Custom Teacher Instructions */}
            {quiz.instructions && (
              <div className="mt-4 p-4 rounded-2xl bg-[#FBF4F2] border border-[#A84C32]/30 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#A84C32]">
                  Note from Teacher:
                </p>
                <p className="text-xs sm:text-sm text-[#1A1A1A] font-medium">
                  {quiz.instructions}
                </p>
              </div>
            )}
          </div>

          {/* Action to Start */}
          <div className="pt-4 border-t border-[#E5E1D8]">
            <button
              type="button"
              onClick={handleStartQuiz}
              className="lumen-button-primary w-full py-4 rounded-2xl font-ui text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Start Quiz Now ({quiz.questions.length} Questions)</span>
            </button>
            <p className="text-[11px] text-center text-[#8C8983] mt-2.5 font-medium">
              {isTimed
                ? `Timer (${quiz.timeLimitMinutes} minutes) will begin immediately upon clicking`
                : "No time limit — practice at your own pace"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── SCREEN 2: RESULT VIEW (AFTER SUBMISSION) ─────────────────────────────
  if (result) {
    const mins = Math.floor(result.timeTakenSeconds / 60);
    const secs = result.timeTakenSeconds % 60;
    const timeFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 font-ui space-y-8 animate-in fade-in duration-300">
        {/* Already Attempted Friendly Notice */}
        {alreadyAttempted && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
              <span>
                <strong>Previously Completed:</strong> You submitted this assessment{" "}
                {attemptSubmittedAt
                  ? `on ${new Date(attemptSubmittedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "earlier"}
                . Reviewing your score and educator solutions below.
              </span>
            </div>
            <Link
              href="/quiz/history"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shrink-0 text-center text-xs"
            >
              All Quiz History
            </Link>
          </div>
        )}

        {/* Score Hero Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-[#FAF8F5] via-white to-[#FBF4F2] border border-[#E5E1D8] shadow-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] shadow-2xs">
            <Award className="h-8 w-8" />
          </div>

          <div>
            <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-3 py-1 rounded-full border border-[#A84C32]/20 font-bold inline-flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Assessment Completed
            </span>
            <h2 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#1A1A1A] mt-2">
              {result.percentage >= 80 ? "Outstanding Performance! 🎉" : result.percentage >= 60 ? "Good Job! Keep It Up 👍" : "Needs Review & Practice 📚"}
            </h2>
            <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] mt-1">
              You scored <span className="font-bold text-[#1A1A1A]">{result.score}</span> out of{" "}
              <span className="font-bold text-[#1A1A1A]">{result.totalQuestions}</span> in {timeFormatted}.
            </p>
          </div>

          <div className="inline-flex items-baseline gap-2 bg-white px-6 py-3 rounded-2xl border border-[#E5E1D8] shadow-2xs">
            <span className="font-serif-display text-4xl sm:text-5xl font-extrabold text-[#A84C32]">
              {result.percentage}%
            </span>
            <span className="text-xs text-[#5C5A55] font-semibold uppercase tracking-wider">Overall Accuracy</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleShare}
              className="lumen-button-primary px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Quiz</span>
            </button>
            <Link
              href="/quiz/history"
              className="px-4 py-2.5 rounded-xl border border-[#A84C32] bg-white text-xs font-semibold text-[#A84C32] hover:bg-[#FAF8F5] transition-colors inline-flex items-center gap-1.5 shadow-2xs"
            >
              <Award className="h-3.5 w-3.5" />
              <span>My Quiz History</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] bg-white text-xs font-semibold text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors"
            >
              Explore More
            </Link>
          </div>

          {/* Teacher Subscription CTA */}
          {quiz.createdBy && (
            <div className="pt-4 border-t border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-3 max-w-lg mx-auto">
              <div className="flex items-center gap-2.5">
                {quiz.createdBy.avatar ? (
                  <img
                    src={quiz.createdBy.avatar}
                    alt={quiz.createdBy.name}
                    className="w-9 h-9 rounded-xl object-cover border border-[#E5E1D8]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs">
                    {quiz.createdBy.name?.[0] || "T"}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#1A1A1A]">{quiz.createdBy.name}</p>
                  <p className="text-[10px] text-[#5C5A55]">Quiz Author &amp; Educator</p>
                </div>
              </div>

              <SubscribeButton
                teacherId={quiz.createdBy._id}
                teacherName={quiz.createdBy.name}
                showCount={true}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Detailed Questions Review */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-display text-xl font-bold text-[#1A1A1A]">
              Detailed Solution &amp; Explanations
            </h3>
            <span className="text-xs text-[#5C5A55]">
              {result.details.filter((d) => d.isCorrect).length} of {result.details.length} questions correct
            </span>
          </div>

          {result.details.map((q, idx) => {
            return (
              <div
                key={q.questionId}
                className={`p-5 rounded-2xl border bg-white shadow-xs space-y-3.5 ${
                  q.isCorrect ? "border-emerald-200" : "border-rose-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] font-bold text-xs text-[#1A1A1A] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-serif-display text-base font-semibold text-[#1A1A1A]">
                        {q.questionText}
                      </h4>
                      <span className="text-[10px] text-[#8C8983] font-semibold">
                        {q.type === "multiple" ? "Multiple Choice Question" : "Single Choice Question"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shrink-0 ${
                      q.isCorrect
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {q.isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    <span>{q.isCorrect ? "Correct" : "Incorrect"}</span>
                  </span>
                </div>

                {/* Options List */}
                <div className="space-y-2 pt-1">
                  {q.options.map((opt) => {
                    const isStudentPick = q.selectedOptionIds.includes(opt.id);
                    const isCorrectAnswer = q.correctOptionIds.includes(opt.id);

                    let containerStyle = "bg-white border-[#E5E1D8] text-[#1A1A1A]";
                    if (isCorrectAnswer && isStudentPick) {
                      containerStyle = "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium";
                    } else if (isCorrectAnswer && !isStudentPick) {
                      containerStyle = "bg-emerald-50/30 border-dashed border-emerald-300 text-emerald-900";
                    } else if (isStudentPick && !isCorrectAnswer) {
                      containerStyle = "bg-rose-50/70 border-rose-300 text-rose-950";
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${containerStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 ${q.type === "multiple" ? "rounded-md" : "rounded-full"} font-bold text-xs flex items-center justify-center shrink-0 ${
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
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            ) : isCorrectAnswer ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : isStudentPick ? (
                              <X className="h-3.5 w-3.5 stroke-[3]" />
                            ) : null}
                          </span>
                          <span className={isStudentPick && !isCorrectAnswer ? "line-through opacity-80" : ""}>
                            {opt.text}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCorrectAnswer && isStudentPick && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
                              ✓ Correct (Your Choice)
                            </span>
                          )}
                          {isCorrectAnswer && !isStudentPick && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-md border border-emerald-200">
                              ✓ Correct Answer (Missed)
                            </span>
                          )}
                          {isStudentPick && !isCorrectAnswer && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200">
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
                      Explanation
                    </p>
                    <p className="text-[#5C5A55] leading-relaxed">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center pt-4">
          <Link
            href="/"
            className="lumen-button-primary px-6 py-3 text-xs font-semibold shadow-xs inline-flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" /> Explore More Insights &amp; Quizzes
          </Link>
        </div>
      </div>
    );
  }

  // ─── SCREEN 3: ACTIVE QUIZ TAKING VIEW ────────────────────────────────────
  const currentQ = quiz.questions[currentIndex];
  const isTimed = secondsRemaining !== null;
  const minutesLeft = secondsRemaining !== null ? Math.floor(secondsRemaining / 60) : 0;
  const secsLeft = secondsRemaining !== null ? secondsRemaining % 60 : 0;
  const isUrgent = secondsRemaining !== null && secondsRemaining < 120;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentIndex === quiz.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 font-ui space-y-6">
      {/* Top Banner / Timer */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E1D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A84C32] bg-[#FAF8F5] px-2.5 py-0.5 rounded-full border border-[#E5E1D8]">
              {quiz.subjectRef?.name || "Quiz"}
            </span>
            <span className="text-[10px] font-semibold text-[#5C5A55] bg-gray-100 px-2 py-0.5 rounded-full capitalize">
              {quiz.difficulty || "medium"}
            </span>
          </div>
          <h1 className="font-serif-display text-xl sm:text-2xl font-bold text-[#1A1A1A]">
            {quiz.title}
          </h1>
        </div>

        {/* Timer or Untimed Pill */}
        {isTimed ? (
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-sm shrink-0 ${
              isUrgent
                ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                : "bg-[#FAF8F5] border-[#E5E1D8] text-[#1A1A1A]"
            }`}
          >
            <Clock className="h-4 w-4 text-[#A84C32]" />
            <span>
              {String(minutesLeft).padStart(2, "0")}:{String(secsLeft).padStart(2, "0")}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Practice Mode (Untimed)</span>
          </div>
        )}
      </div>

      {/* Question Tracker Pills */}
      <div
        ref={trackerContainerRef}
        className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
      >
        <span className="text-xs font-semibold text-[#5C5A55] shrink-0 mr-1">Progress:</span>
        {quiz.questions.map((q, idx) => {
          const isAnswered = Boolean(answers[q.id]?.length);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              ref={isCurrent ? activePillRef : null}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                isCurrent
                  ? isAnswered
                    ? "bg-[#1A1A1A] text-white ring-2 ring-emerald-500 ring-offset-1 shadow-xs"
                    : "bg-[#1A1A1A] text-white ring-2 ring-[#A84C32] ring-offset-1 shadow-xs"
                  : isAnswered
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:border-[#A84C32]"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Current Question Card */}
      {currentQ && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4 flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A84C32]">
              Question {currentIndex + 1} of {quiz.questions.length}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                currentQ.type === "multiple"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-[#FAF8F5] text-[#5C5A55] border-[#E5E1D8]"
              }`}
            >
              {currentQ.type === "multiple"
                ? "Multiple Choice: Select all that apply"
                : "Single Choice: Select 1 option"}
            </span>
          </div>

          <h3 className="font-serif-display text-lg sm:text-xl font-semibold text-[#1A1A1A] leading-relaxed">
            {currentQ.text}
          </h3>

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = (answers[currentQ.id] || []).includes(opt.id);
              const label = String.fromCharCode(65 + oIdx);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(currentQ.id, opt.id, currentQ.type === "multiple")}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#FBF4F2] border-[#A84C32] ring-1 ring-[#A84C32] text-[#1A1A1A] shadow-xs"
                      : "bg-white border-[#E5E1D8] text-[#5C5A55] hover:border-[#A84C32]/60 hover:bg-[#FAF8F5]"
                  }`}
                >
                  <span
                    className={`w-7 h-7 ${
                      currentQ.type === "multiple" ? "rounded-lg" : "rounded-full"
                    } flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#A84C32] text-white"
                        : "bg-[#FAF8F5] border border-[#E5E1D8] text-[#5C5A55]"
                    }`}
                  >
                    {isSelected && currentQ.type === "multiple" ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : (
                      label
                    )}
                  </span>
                  <span className="text-xs sm:text-sm font-medium flex-1 text-[#1A1A1A]">
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-[#E5E1D8] flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#5C5A55] hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitGuarded}
                className="lumen-button-primary px-6 py-2.5 text-xs font-semibold shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <Send className="h-4 w-4" />
                <span>Submit Quiz ({answeredCount}/{quiz.questions.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Next Question</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Unanswered Questions Warning Modal ─── */}
      {showSubmitWarning && quiz && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#E5E1D8] shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <HelpCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif-display text-lg font-bold text-[#1A1A1A]">
                  Unanswered Questions
                </h3>
                <p className="font-serif-body text-xs text-[#5C5A55] leading-relaxed">
                  You have{" "}
                  <span className="font-bold text-amber-700">
                    {quiz.questions.filter((q) => !(answers[q.id]?.length)).length} unanswered
                    {quiz.questions.filter((q) => !(answers[q.id]?.length)).length === 1 ? " question" : " questions"}
                  </span>
                  . Unanswered questions will be marked as incorrect.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-wrap gap-2">
              {quiz.questions
                .map((q, idx) => ({ q, idx }))
                .filter(({ q }) => !(answers[q.id]?.length))
                .map(({ idx }) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowSubmitWarning(false);
                    }}
                    className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 font-bold text-xs flex items-center justify-center hover:bg-amber-200 transition-colors cursor-pointer"
                  >
                    {idx + 1}
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowSubmitWarning(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#5C5A55] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Go Back & Answer
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 lumen-button-primary px-4 py-2.5 text-xs font-semibold shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <Send className="h-3.5 w-3.5" />
                <span>Submit Anyway</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
