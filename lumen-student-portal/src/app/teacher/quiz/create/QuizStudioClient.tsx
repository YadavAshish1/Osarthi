"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Calendar,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Brain,
  HelpCircle,
  FileQuestion,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import CustomSelect from "@/components/common/CustomSelect";

interface QuestionForm {
  id: string;
  text: string;
  type: "single" | "multiple";
  options: Array<{ id: string; text: string }>;
  correctOptionIds: string[];
  explanation: string;
}

const DEFAULT_QUESTIONS: QuestionForm[] = [
  {
    id: "q-init-1",
    text: "",
    type: "single",
    options: [
      { id: "opt-1", text: "" },
      { id: "opt-2", text: "" },
      { id: "opt-3", text: "" },
      { id: "opt-4", text: "" },
    ],
    correctOptionIds: ["opt-1"],
    explanation: "",
  },
];

export default function QuizStudioClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingQuizId = searchParams.get("edit");
  const { user, ready } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [classRef, setClassRef] = useState("");
  const [subjectRef, setSubjectRef] = useState("");
  const [topicRef, setTopicRef] = useState("");
  const [collectionRef, setCollectionRef] = useState("");
  const [hasTimer, setHasTimer] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(20);
  const [instructions, setInstructions] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Expiry / Close Date & Time State
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryTime, setExpiryTime] = useState("23:59");
  const [fetchingQuiz, setFetchingQuiz] = useState(false);

  // Quick Create Test Series
  const [showCreateSeries, setShowCreateSeries] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState("");
  const [newSeriesDesc, setNewSeriesDesc] = useState("");
  const [newSeriesTags, setNewSeriesTags] = useState("");
  const [creatingSeries, setCreatingSeries] = useState(false);

  // Quick Create Topic (Teacher-isolated)
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);

  // Taxonomy & Collections
  const [classes, setClasses] = useState<Array<{ _id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ _id: string; name: string }>>([]);
  const [topics, setTopics] = useState<Array<{ _id: string; name: string }>>([]);
  const [collections, setCollections] = useState<Array<{ _id: string; title: string }>>([]);

  // Questions
  const [questions, setQuestions] = useState<QuestionForm[]>(DEFAULT_QUESTIONS);

  // Auto-Save Draft Status
  const [draftStatus, setDraftStatus] = useState<"saved" | "saving" | "unsaved" | "none">("none");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const isInitialMount = useRef(true);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `medhashine_quiz_draft_${user?.id || (user as any)?._id || "guest"}`;

  // 1. Load taxonomy & collections on mount
  useEffect(() => {
    (async () => {
      try {
        const [clsRes, colRes] = await Promise.all([
          api.get("/taxonomy/classes"),
          api.get("/quiz/collections/teacher").catch(() => ({ data: [] })),
        ]);
        const rawClasses: Array<{ _id: string; name: string }> = clsRes.data || [];

        // Filter out non-academic entries (like stories, blogs)
        const academicClasses = rawClasses.filter((c) => {
          const lower = (c.name || "").toLowerCase();
          return !lower.includes("कहानियाँ") && !lower.includes("story") && !lower.includes("कहानी");
        });

        // Natural numeric sort: Class 8th, Class 9th, Class 10th, Class 11th, Class 12th
        const sortedClasses = [...academicClasses].sort((a, b) => {
          const numA = parseInt(a.name.replace(/\D/g, ""), 10);
          const numB = parseInt(b.name.replace(/\D/g, ""), 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          if (!isNaN(numA)) return -1;
          if (!isNaN(numB)) return 1;
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        });

        setClasses(sortedClasses);
        setCollections(colRes.data || []);
      } catch (err) {
        console.error("Failed to load taxonomy", err);
      }
    })();
  }, []);

  // 2. Load editing quiz or restore unsaved draft from localStorage
  useEffect(() => {
    if (editingQuizId) {
      setFetchingQuiz(true);
      (async () => {
        try {
          const { data } = await api.get(`/quiz/${editingQuizId}`);
          setTitle(data.title || "");
          setDescription(data.description || "");
          setClassRef(data.classRef?._id || data.classRef || "");
          setSubjectRef(data.subjectRef?._id || data.subjectRef || "");
          setTopicRef(data.topicRef?._id || data.topicRef || "");
          setCollectionRef(data.collectionRef?._id || data.collectionRef || "");
          setDifficulty(data.difficulty || "medium");
          setHasTimer(Boolean(data.hasTimer));
          setTimeLimitMinutes(data.timeLimitMinutes || 20);
          setInstructions(data.instructions || "");
          setPublishImmediately(Boolean(data.published));

          if (data.expiresAt) {
            setHasExpiry(true);
            const d = new Date(data.expiresAt);
            setExpiryDate(d.toISOString().slice(0, 10));
            const hours = String(d.getHours()).padStart(2, "0");
            const mins = String(d.getMinutes()).padStart(2, "0");
            setExpiryTime(`${hours}:${mins}`);
          }

          if (Array.isArray(data.questions) && data.questions.length > 0) {
            setQuestions(
              data.questions.map((q: any, i: number) => ({
                id: q._id || `q-${i}`,
                text: q.text || "",
                type: q.type || (Array.isArray(q.correctOptionIds) && q.correctOptionIds.length > 1 ? "multiple" : "single"),
                options: (q.options || []).map((opt: any, oIdx: number) => ({
                  id: opt._id || `opt-${oIdx}`,
                  text: opt.text || "",
                })),
                correctOptionIds: Array.isArray(q.correctOptionIds) ? q.correctOptionIds : [],
                explanation: q.explanation || "",
              }))
            );
          }
        } catch {
          toast.error("Failed to load quiz details for editing");
        } finally {
          setFetchingQuiz(false);
        }
      })();
    } else {
      // Check for local draft in localStorage
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft && (draft.title?.trim() || (draft.questions && draft.questions.some((q: any) => q.text?.trim())))) {
            setTitle(draft.title || "");
            setDescription(draft.description || "");
            if (draft.classRef) setClassRef(draft.classRef);
            if (draft.subjectRef) setSubjectRef(draft.subjectRef);
            if (draft.topicRef) setTopicRef(draft.topicRef);
            if (draft.collectionRef) setCollectionRef(draft.collectionRef);
            if (draft.hasTimer !== undefined) setHasTimer(draft.hasTimer);
            if (draft.timeLimitMinutes) setTimeLimitMinutes(draft.timeLimitMinutes);
            if (draft.difficulty) setDifficulty(draft.difficulty);
            if (draft.instructions) setInstructions(draft.instructions);
            if (Array.isArray(draft.questions) && draft.questions.length > 0) {
              setQuestions(draft.questions);
            }
            setHasRestoredDraft(true);
            setDraftStatus("saved");
            if (draft.savedAt) {
              setLastSavedTime(new Date(draft.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
            }
          }
        }
      } catch (err) {
        console.error("Error restoring quiz draft", err);
      }
    }
  }, [editingQuizId, storageKey]);

  // 3. Load subjects when class changes (or all subjects if class is empty/optional)
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/taxonomy/subjects", {
          params: classRef ? { classId: classRef } : {},
        });
        const list = data || [];
        setSubjects(list);
        if (subjectRef && !list.some((s: any) => s._id === subjectRef)) {
          setSubjectRef("");
          setTopicRef("");
        }
      } catch {
        setSubjects([]);
      }
    })();
  }, [classRef]);

  // 4. Load topics when subject or class changes (hierarchical: Class -> Subject -> Topics)
  useEffect(() => {
    if (!subjectRef && !classRef) {
      setTopics([]);
      setTopicRef("");
      return;
    }
    (async () => {
      try {
        const params: any = {};
        if (subjectRef) {
          params.subjectId = subjectRef;
        } else if (classRef) {
          params.classId = classRef;
        }
        const { data } = await api.get("/taxonomy/topics", { params });
        const list: Array<{ _id: string; name: string }> = data || [];
        setTopics(list);
        // Reset topicRef if current topic doesn't belong to the newly selected subject/class
        if (topicRef && !list.some((t) => t._id === topicRef)) {
          setTopicRef("");
        }
      } catch {
        setTopics([]);
        setTopicRef("");
      }
    })();
  }, [subjectRef, classRef]);

  // 5. Silent Auto-Save to localStorage (debounced)
  useEffect(() => {
    if (editingQuizId) return; // Do not overwrite drafts when editing an existing published quiz
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setDraftStatus("saving");

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(() => {
      try {
        const draftData = {
          title,
          description,
          classRef,
          subjectRef,
          topicRef,
          collectionRef,
          hasTimer,
          timeLimitMinutes,
          difficulty,
          instructions,
          questions,
          savedAt: new Date().toISOString(),
        };

        // Only save if there's meaningful content
        if (title.trim() || questions.some((q) => q.text.trim())) {
          localStorage.setItem(storageKey, JSON.stringify(draftData));
          setDraftStatus("saved");
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        } else {
          setDraftStatus("none");
        }
      } catch (err) {
        console.error("Failed to auto-save quiz draft", err);
        setDraftStatus("unsaved");
      }
    }, 700);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [title, description, classRef, subjectRef, topicRef, collectionRef, hasTimer, timeLimitMinutes, difficulty, instructions, questions, editingQuizId, storageKey]);

  // 6. beforeunload warning if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (title.trim() || questions.some((q) => q.text.trim())) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [title, questions]);

  // Discard draft and start fresh
  const handleDiscardDraft = () => {
    if (confirm("Are you sure you want to discard this unsaved draft and start fresh?")) {
      localStorage.removeItem(storageKey);
      setTitle("");
      setDescription("");
      setTopicRef("");
      setCollectionRef("");
      setInstructions("");
      setQuestions(DEFAULT_QUESTIONS);
      setHasRestoredDraft(false);
      setDraftStatus("none");
      setLastSavedTime(null);
      toast.success("Draft cleared. Fresh quiz canvas ready!");
    }
  };

  // Questions manipulation
  const handleAddQuestion = () => {
    const qIndex = questions.length + 1;
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${qIndex}`,
        text: "",
        type: "single",
        options: [
          { id: `opt-${Date.now()}-1`, text: "" },
          { id: `opt-${Date.now()}-2`, text: "" },
          { id: `opt-${Date.now()}-3`, text: "" },
          { id: `opt-${Date.now()}-4`, text: "" },
        ],
        correctOptionIds: [`opt-${Date.now()}-1`],
        explanation: "",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      toast.error("Quiz must contain at least 1 question");
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const newQ: QuestionForm = {
      ...target,
      id: `q-${Date.now()}-${questions.length + 1}`,
      options: target.options.map((opt, oIdx) => ({
        id: `opt-${Date.now()}-${oIdx + 1}`,
        text: opt.text,
      })),
      correctOptionIds: [],
    };
    // Re-map correctOptionIds to matching new option IDs
    const oldToNewMap: Record<string, string> = {};
    target.options.forEach((opt, oIdx) => {
      oldToNewMap[opt.id] = newQ.options[oIdx].id;
    });
    newQ.correctOptionIds = target.correctOptionIds.map((id) => oldToNewMap[id] || newQ.options[0].id);

    const updated = [...questions];
    updated.splice(idx + 1, 0, newQ);
    setQuestions(updated);
    toast.success(`Duplicated Question #${idx + 1}`);
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, text } : q)));
  };

  const handleOptionTextChange = (qIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = q.options.map((opt, oIdx) => (oIdx === optIdx ? { ...opt, text } : opt));
        return { ...q, options: newOptions };
      })
    );
  };

  const handleQuestionTypeChange = (qIdx: number, newType: "single" | "multiple") => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        let nextCorrect = [...q.correctOptionIds];
        if (newType === "single" && nextCorrect.length > 1) {
          nextCorrect = [nextCorrect[0]];
        }
        return { ...q, type: newType, correctOptionIds: nextCorrect };
      })
    );
  };

  const handleToggleCorrectOption = (qIdx: number, optId: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        if (q.type === "multiple") {
          const isSelected = q.correctOptionIds.includes(optId);
          let nextCorrect: string[];
          if (isSelected) {
            if (q.correctOptionIds.length <= 1) {
              toast.error("At least 1 correct answer must remain selected");
              return q;
            }
            nextCorrect = q.correctOptionIds.filter((id) => id !== optId);
          } else {
            nextCorrect = [...q.correctOptionIds, optId];
          }
          return { ...q, correctOptionIds: nextCorrect };
        } else {
          return { ...q, correctOptionIds: [optId] };
        }
      })
    );
  };

  const handleAddOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length >= 6) {
          toast.error("Maximum 6 options allowed per question");
          return q;
        }
        const optCount = q.options.length + 1;
        const newOpt = { id: `opt-${Date.now()}-${optCount}`, text: "" };
        return { ...q, options: [...q.options, newOpt] };
      })
    );
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) {
          toast.error("A question must have at least 2 options");
          return q;
        }
        const targetOpt = q.options[optIdx];
        const nextOptions = q.options.filter((_, idx) => idx !== optIdx);
        let nextCorrect = q.correctOptionIds.filter((id) => id !== targetOpt.id);
        if (nextCorrect.length === 0 && nextOptions.length > 0) {
          nextCorrect = [nextOptions[0].id];
        }
        return { ...q, options: nextOptions, correctOptionIds: nextCorrect };
      })
    );
  };

  const handleExplanationChange = (qIdx: number, explanation: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === qIdx ? { ...q, explanation } : q)));
  };

  // Quick Create Test Series
  const handleQuickCreateSeries = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSeriesTitle.trim()) {
      toast.error("Please enter a test series title");
      return;
    }
    setCreatingSeries(true);
    const tags = newSeriesTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const { data } = await api.post("/quiz/collections", {
        title: newSeriesTitle.trim(),
        description: newSeriesDesc.trim(),
        classRef: classRef || null,
        subjectRef: subjectRef || null,
        topicRef: topicRef || null,
        tags,
      });

      const created = data;
      setCollections((prev) => [created, ...prev]);
      setCollectionRef(created._id);
      setNewSeriesTitle("");
      setNewSeriesDesc("");
      setNewSeriesTags("");
      setShowCreateSeries(false);
      toast.success(`Created & selected series "${created.title}"`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create test series");
    } finally {
      setCreatingSeries(false);
    }
  };

  // Quick Create Topic (Teacher-isolated)
  const handleCreateTopic = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTopicName.trim() || !subjectRef) return;
    setCreatingTopic(true);
    try {
      const { data } = await api.post("/taxonomy/topics", {
        name: newTopicName.trim(),
        subjectId: subjectRef,
      });
      setTopics((prev) => {
        if (prev.some((t) => t._id === data._id)) return prev;
        return [...prev, data];
      });
      setTopicRef(data._id);
      setNewTopicName("");
      setShowCreateTopic(false);
      toast.success(`Topic "${data.name}" created and selected!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create topic");
    } finally {
      setCreatingTopic(false);
    }
  };

  // Final Submit
  const handleSaveQuiz = async (shouldPublish: boolean) => {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Question #${i + 1} statement cannot be empty`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          toast.error(`Question #${i + 1}, Option ${String.fromCharCode(65 + j)} cannot be empty`);
          return;
        }
      }
      if (!q.correctOptionIds || !q.correctOptionIds.length) {
        toast.error(`Please mark at least one correct answer for Question #${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        classRef: classRef || null,
        subjectRef: subjectRef || null,
        hasTimer,
        timeLimitMinutes: hasTimer ? Number(timeLimitMinutes) || 20 : null,
        difficulty,
        questions,
        published: shouldPublish,
      };

      if (topicRef) payload.topicRef = topicRef;
      if (collectionRef) payload.collectionRef = collectionRef;

      // Close / Expiry date
      let expiresAtVal: string | null = null;
      if (hasExpiry && expiryDate) {
        expiresAtVal = new Date(`${expiryDate}T${expiryTime || "23:59"}`).toISOString();
      }
      payload.expiresAt = expiresAtVal;

      if (editingQuizId) {
        await api.put(`/quiz/${editingQuizId}`, payload);
        toast.success(shouldPublish ? "Quiz updated & published!" : "Quiz updated as draft!");
      } else {
        await api.post("/quiz", payload);
        // Clear local draft upon successful creation!
        localStorage.removeItem(storageKey);
        toast.success(shouldPublish ? "Quiz successfully published to students!" : "Quiz saved to drafts!");
      }

      router.push("/teacher/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingQuiz) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
        <Loader2 className="h-8 w-8 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-base text-[#5C5A55]">Loading Quiz Studio…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-28 sm:pb-24 font-ui antialiased">
      {/* 1. Studio Sticky Header Bar - Mobile Optimized */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FAF8F5]/92 border-b border-[#E5E1D8] shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2.5">
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Link
              href="/teacher/dashboard"
              className="p-1.5 sm:p-2 rounded-xl text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-white border border-[#E5E1D8] transition-colors shrink-0 shadow-2xs"
              title="Return to Teacher Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="eyebrow text-[#A84C32] text-[9px] sm:text-[10px] tracking-wider">
                  {editingQuizId ? "EDIT QUIZ" : "QUIZ STUDIO"}
                </span>
                {!editingQuizId && (draftStatus === "saving" || draftStatus === "saved") && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold transition-all duration-200 ${
                      draftStatus === "saved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {draftStatus === "saved" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {draftStatus === "saving" ? "Saving…" : "Draft saved"}
                  </span>
                )}
              </div>
              <h1 className="font-serif-display text-sm sm:text-lg font-bold text-[#1A1A1A] truncate">
                {title.trim() ? title : "New Quiz Assessment"}
              </h1>
            </div>
          </div>

          {/* Action Buttons: Desktop shows Draft & Publish; Mobile shows concise Publish pill */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Auto-save timestamp chip (Desktop only) */}
            {!editingQuizId && lastSavedTime && (
              <span className="hidden lg:inline text-[11px] text-[#5C5A55]">
                Saved at {lastSavedTime}
              </span>
            )}

            {/* Save as Draft Button (Desktop) */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSaveQuiz(false)}
              className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors text-xs font-semibold shadow-2xs cursor-pointer items-center gap-1.5"
            >
              <Save className="h-3.5 w-3.5 text-[#5C5A55]" />
              <span>Save Draft</span>
            </button>

            {/* Publish Button */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSaveQuiz(true)}
              className="px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-[#A84C32] text-white hover:bg-[#8C3A27] transition-all text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>{editingQuizId ? "Save" : "Publish"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Restored Draft Notification Banner */}
      {hasRestoredDraft && !editingQuizId && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-amber-700 shrink-0" />
              <p className="truncate">
                <strong>Draft Restored:</strong> We recovered your unsaved quiz progress from your last session.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-rose-700 border border-amber-300 font-semibold text-[11px] shrink-0 transition-colors cursor-pointer"
            >
              Discard &amp; Start Fresh
            </button>
          </div>
        </div>
      )}

      {/* 3. Studio Main Form */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Section 1: Basic Information & Cascading Taxonomy */}
        <section className="p-4 sm:p-6 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8]/80 pb-3 flex items-center justify-between">
            <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#A84C32]" />
              <span>Assessment Overview</span>
            </h2>
            <span className="text-[11px] text-[#5C5A55]">Step 1 of 2</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-[#1A1A1A] text-xs mb-1.5">
                Quiz Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4 Practice Assessment: Laws of Motion & Friction"
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] focus:ring-2 focus:ring-[#A84C32]/10 bg-[#FAF8F5]/30"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1A1A1A] text-xs mb-1.5">
                Description &amp; Syllabus Covered (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of concepts, textbook chapters, or competencies tested in this assessment..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] focus:ring-2 focus:ring-[#A84C32]/10 bg-[#FAF8F5]/30"
              />
            </div>

            {/* Cascading Taxonomy Selects with Custom Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <CustomSelect
                label="Target Class (Optional)"
                value={classRef}
                onChange={(val) => setClassRef(val)}
                placeholder="All Classes / General"
                options={[
                  { value: "", label: "All Classes / General" },
                  ...classes.map((c) => ({
                    value: c._id,
                    label: c.name,
                  })),
                ]}
                emptyMessage="Loading classes…"
              />

              <CustomSelect
                label="Subject (Optional)"
                value={subjectRef}
                onChange={(val) => setSubjectRef(val)}
                placeholder="All Subjects / General"
                options={[
                  { value: "", label: "All Subjects / General" },
                  ...subjects.map((s) => ({
                    value: s._id,
                    label: s.name,
                  })),
                ]}
                emptyMessage="No subjects found"
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#1A1A1A]">
                    Topic (Optional)
                  </label>
                  {subjectRef && (
                    <button
                      type="button"
                      onClick={() => setShowCreateTopic((prev) => !prev)}
                      className="text-[11px] font-semibold text-[#A84C32] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>New Topic</span>
                    </button>
                  )}
                </div>
                <CustomSelect
                  value={topicRef}
                  onChange={(val) => {
                    if (val === "__create_topic__") {
                      setShowCreateTopic(true);
                    } else {
                      setTopicRef(val);
                    }
                  }}
                  placeholder="General / All Topics"
                  disabled={!subjectRef && !classRef}
                  options={[
                    { value: "", label: "General / All Topics" },
                    ...topics.map((t) => ({
                      value: t._id,
                      label: t.name,
                    })),
                    ...(subjectRef
                      ? [
                          {
                            value: "__create_topic__",
                            label: "+ Create New Topic",
                            badge: "New",
                            badgeColor: "bg-[#A84C32] text-white",
                          },
                        ]
                      : []),
                  ]}
                  emptyMessage={
                    subjectRef || classRef
                      ? "No topics found for this selection. Click '+ New Topic' above to add one"
                      : "Select a class or subject first"
                  }
                />
              </div>
            </div>

            {/* Quick Create Topic Drawer (Teacher-Isolated) */}
            {showCreateTopic && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#A84C32]/30 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs text-[#A84C32] flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Your Topic under {subjects.find((s) => s._id === subjectRef)?.name || "Subject"}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateTopic(false)}
                    className="text-xs text-[#5C5A55] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Chapter 1: Real Numbers"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateTopic();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E5E1D8] bg-white focus:outline-none focus:border-[#A84C32]"
                  />
                  <button
                    type="button"
                    disabled={creatingTopic || !newTopicName.trim()}
                    onClick={() => handleCreateTopic()}
                    className="px-4 py-2 rounded-xl bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    {creatingTopic ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    <span>Add Topic</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Assessment Controls (Series, Difficulty, Timers, Deadlines) */}
        <section className="p-4 sm:p-6 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-5">
          <div className="border-b border-[#E5E1D8]/80 pb-3 flex items-center justify-between">
            <h2 className="font-serif-display text-lg sm:text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#A84C32]" />
              <span>Assessment Settings &amp; Timers</span>
            </h2>
            <span className="text-[11px] text-[#5C5A55]">Customizable rules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect
              label="Attach to Test Series (Optional)"
              value={collectionRef}
              onChange={(val) => {
                if (val === "__create_new__") {
                  setShowCreateSeries(true);
                } else {
                  setCollectionRef(val);
                }
              }}
              placeholder="None (Individual Standalone Quiz)"
              options={[
                { value: "", label: "None (Individual Standalone Quiz)" },
                ...collections.map((col) => ({
                  value: col._id,
                  label: col.title,
                })),
                {
                  value: "__create_new__",
                  label: "+ Create New Test Series...",
                  badge: "New",
                  badgeColor: "bg-[#A84C32]/10 text-[#A84C32]",
                },
              ]}
            />

            <CustomSelect
              label="Difficulty Level"
              value={difficulty}
              onChange={(val) => setDifficulty(val as any)}
              options={[
                {
                  value: "easy",
                  label: "Easy",
                  badge: "Foundational",
                  badgeColor: "bg-emerald-50 text-emerald-800 border border-emerald-200",
                },
                {
                  value: "medium",
                  label: "Medium",
                  badge: "Standard",
                  badgeColor: "bg-amber-50 text-amber-800 border border-amber-200",
                },
                {
                  value: "hard",
                  label: "Hard",
                  badge: "Advanced Exam Level",
                  badgeColor: "bg-rose-50 text-rose-800 border border-rose-200",
                },
              ]}
            />
          </div>

          {/* Quick Create Series Drawer/Modal if triggered */}
          {showCreateSeries && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#A84C32]/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-xs text-[#A84C32]">Quick Create Test Series</p>
                <button
                  type="button"
                  onClick={() => setShowCreateSeries(false)}
                  className="text-xs text-[#5C5A55] hover:text-[#1A1A1A]"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Series Title *"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Tags (e.g. Board2026, Physics)"
                  value={newSeriesTags}
                  onChange={(e) => setNewSeriesTags(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white"
                />
              </div>
              <textarea
                placeholder="Series description (optional)..."
                rows={2}
                value={newSeriesDesc}
                onChange={(e) => setNewSeriesDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white"
              />
              <button
                type="button"
                disabled={creatingSeries}
                onClick={handleQuickCreateSeries}
                className="px-4 py-2 rounded-xl bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-colors"
              >
                {creatingSeries ? "Creating Series…" : "Save Series & Select"}
              </button>
            </div>
          )}

          {/* Timers & Deadlines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Countdown Timer */}
            <div className="p-4 rounded-2xl border border-[#E5E1D8] bg-[#FAF8F5]/40 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#1A1A1A] text-xs">
                    <Clock className="h-4 w-4 text-[#A84C32]" />
                    <span>Countdown Timer</span>
                  </div>
                  <p className="text-[11px] text-[#5C5A55] mt-0.5">
                    {hasTimer ? "Enforces time limit" : "Off (untimed self-paced mode)"}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTimer}
                    onChange={(e) => setHasTimer(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#E5E1D8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A84C32]"></div>
                </label>
              </div>

              {hasTimer && (
                <div className="pt-2 border-t border-[#E5E1D8]/60 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-24 px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold bg-white"
                  />
                  <span className="text-xs text-[#5C5A55]">minutes total</span>
                </div>
              )}
            </div>

            {/* Submission Deadline / Expiry */}
            <div className="p-4 rounded-2xl border border-[#E5E1D8] bg-[#FAF8F5]/40 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#1A1A1A] text-xs">
                    <Calendar className="h-4 w-4 text-[#A84C32]" />
                    <span>Submission Deadline (Optional)</span>
                  </div>
                  <p className="text-[11px] text-[#5C5A55] mt-0.5">
                    {hasExpiry ? "Closes on set date" : "Always open for practice"}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasExpiry}
                    onChange={(e) => setHasExpiry(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#E5E1D8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A84C32]"></div>
                </label>
              </div>

              {hasExpiry && (
                <div className="pt-2 border-t border-[#E5E1D8]/60 grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white"
                  />
                  <input
                    type="time"
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Questions Builder (The Heart of Quiz Studio) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-[#A84C32]" />
              <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[#1A1A1A]">
                Assessment Questions
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A84C32]/10 text-[#A84C32]">
                {questions.length} {questions.length === 1 ? "Question" : "Questions"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#A84C32]" />
              <span>Add Question</span>
            </button>
          </div>

          {/* Question Cards List */}
          <div className="space-y-5">
            {questions.map((q, qIdx) => {
              const letterMap = ["A", "B", "C", "D", "E", "F"];
              return (
                <div
                  key={q.id}
                  className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-3.5 sm:space-y-4 transition-all"
                >
                  {/* Question Header & Responsive Controls */}
                  <div className="border-b border-[#E5E1D8]/70 pb-3 space-y-2.5">
                    {/* Top Row: Badge + Question title + Utility icons */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] font-serif-display font-bold text-xs sm:text-sm flex items-center justify-center shadow-2xs">
                          {qIdx + 1}
                        </span>
                        <h3 className="font-serif-display text-sm sm:text-base font-bold text-[#1A1A1A]">
                          Question #{qIdx + 1}
                        </h3>
                      </div>

                      {/* Question utility actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateQuestion(qIdx)}
                          title="Duplicate Question"
                          className="p-1.5 rounded-lg text-[#5C5A55] hover:text-[#A84C32] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                        >
                          <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            title="Delete Question"
                            className="p-1.5 rounded-lg text-[#5C5A55] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Single vs Multiple Choice Pills */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="inline-flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#E5E1D8] shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleQuestionTypeChange(qIdx, "single")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            q.type === "single"
                              ? "bg-white text-[#A84C32] shadow-2xs"
                              : "text-[#5C5A55] hover:text-[#1A1A1A]"
                          }`}
                        >
                          Single Choice
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuestionTypeChange(qIdx, "multiple")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                            q.type === "multiple"
                              ? "bg-white text-[#A84C32] shadow-2xs"
                              : "text-[#5C5A55] hover:text-[#1A1A1A]"
                          }`}
                        >
                          Multiple Choice
                        </button>
                      </div>

                      <span className="text-[11px] text-emerald-700 font-medium">
                        {q.correctOptionIds.length} correct marked
                        {q.type === "multiple" ? " (multi-select)" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Question Statement */}
                  <div>
                    <label className="block font-semibold text-[#5C5A55] text-xs mb-1">
                      Question Statement <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={q.text}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      placeholder="e.g. Which of the following laws states that acceleration is directly proportional to net force?"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] focus:ring-2 focus:ring-[#A84C32]/10 bg-[#FAF8F5]/30"
                    />
                  </div>

                  {/* Options List */}
                  <div className="space-y-2 pt-0.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-semibold text-[#5C5A55] text-xs">
                        Options &amp; Correct Answer:
                      </label>
                      <span className="text-[10px] text-[#5C5A55]/70">
                        Tap letter to toggle correct
                      </span>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctOptionIds.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all ${
                              isCorrect
                                ? "bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/20 shadow-2xs"
                                : "bg-white border-[#E5E1D8] hover:border-[#E5E1D8]"
                            }`}
                          >
                            {/* Correct Answer Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleCorrectOption(qIdx, opt.id)}
                              title={isCorrect ? "Marked as correct" : "Click to mark as correct"}
                              className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                isCorrect
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-[#FAF8F5] text-[#5C5A55] hover:bg-emerald-50 hover:text-emerald-800 border border-[#E5E1D8]"
                              }`}
                            >
                              {isCorrect ? <Check className="h-4 w-4 stroke-[3]" /> : letterMap[optIdx]}
                            </button>

                            {/* Option Input Text */}
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                              placeholder={`Option ${letterMap[optIdx]} text...`}
                              className="flex-1 bg-transparent px-2 text-xs font-ui text-[#1A1A1A] focus:outline-none min-h-[36px]"
                            />

                            {/* Delete Option (if > 2) */}
                            {q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIdx, optIdx)}
                                title="Remove Option"
                                className="p-1 rounded-lg text-[#5C5A55]/60 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Option Button */}
                    {q.options.length < 6 && (
                      <button
                        type="button"
                        onClick={() => handleAddOption(qIdx)}
                        className="mt-1.5 text-xs text-[#A84C32] hover:text-[#8C3A27] font-semibold flex items-center gap-1 cursor-pointer py-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Option {letterMap[q.options.length]}</span>
                      </button>
                    )}
                  </div>

                  {/* Solution / Answer Explanation */}
                  <div className="pt-2 border-t border-[#E5E1D8]/70">
                    <label className="block font-semibold text-[#5C5A55] text-xs mb-1">
                      Answer Explanation (Revealed to students after submission)
                    </label>
                    <textarea
                      rows={2}
                      value={q.explanation}
                      onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                      placeholder="Explain why this answer is correct, citing key formulas or conceptual reasons..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] focus:ring-2 focus:ring-[#A84C32]/10 bg-[#FAF8F5]/30"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Another Question Large Button */}
          <button
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-4 sm:py-5 rounded-2xl sm:rounded-3xl border-2 border-dashed border-[#E5E1D8] hover:border-[#A84C32] bg-[#FAF8F5]/50 hover:bg-[#FAF8F5] text-[#5C5A55] hover:text-[#A84C32] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group"
          >
            <div className="p-1.5 rounded-lg bg-white group-hover:bg-[#A84C32] group-hover:text-white transition-colors border border-[#E5E1D8] shadow-2xs">
              <Plus className="h-4 w-4" />
            </div>
            <span className="font-serif-display text-sm sm:text-base font-bold">
              + Add Question #{questions.length + 1}
            </span>
          </button>
        </section>
      </main>

      {/* 4. Mobile Fixed Bottom Floating Bar - Glassmorphism Luxury Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E1D8] px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center font-serif-display font-bold text-xs text-[#A84C32] shadow-2xs">
            Q{questions.length}
          </div>
          <div>
            <span className="font-bold text-xs text-[#1A1A1A] block">
              {questions.length} {questions.length === 1 ? "Question" : "Questions"}
            </span>
            {draftStatus === "saved" ? (
              <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
                Draft auto-saved
              </p>
            ) : draftStatus === "saving" ? (
              <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Auto-saving...
              </p>
            ) : (
              <p className="text-[10px] text-[#5C5A55]/70 font-medium">
                Auto-save enabled
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveQuiz(false)}
            className="px-3 py-2 rounded-xl bg-white border border-[#E5E1D8] text-xs font-semibold text-[#1A1A1A] hover:border-[#A84C32] transition-colors shadow-2xs"
          >
            Draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSaveQuiz(true)}
            className="px-4 py-2 rounded-xl bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-all shadow-xs flex items-center gap-1"
          >
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            <span>Publish</span>
          </button>
        </div>
      </div>
    </div>
  );
}

