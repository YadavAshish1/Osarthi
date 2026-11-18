"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  CheckSquare,
  Check,
  Loader2,
  Brain,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import CustomSelect from "@/components/common/CustomSelect";

interface QuizCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingQuizId?: string | null;
}

interface QuestionForm {
  id: string;
  text: string;
  type: "single" | "multiple";
  options: Array<{ id: string; text: string }>;
  correctOptionIds: string[];
  explanation: string;
}

export default function QuizCreateModal({
  isOpen,
  onClose,
  onSuccess,
  editingQuizId,
}: QuizCreateModalProps) {
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

  // Taxonomy & Collections Dropdowns
  const [classes, setClasses] = useState<Array<{ _id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ _id: string; name: string }>>([]);
  const [topics, setTopics] = useState<Array<{ _id: string; name: string }>>([]);
  const [collections, setCollections] = useState<Array<{ _id: string; title: string }>>([]);

  // Questions
  const [questions, setQuestions] = useState<QuestionForm[]>([
    {
      id: "q-1",
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
  ]);

  // Load taxonomy on modal open
  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        const [clsRes, colRes] = await Promise.all([
          api.get("/taxonomy/classes"),
          api.get("/quiz/collections/teacher").catch(() => ({ data: [] })),
        ]);
        const rawClasses: Array<{ _id: string; name: string }> = clsRes.data || [];
        
        // Filter out non-academic entries (like stories, blogs) from quiz Target Class
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
        if (!editingQuizId && sortedClasses[0]?._id) {
          setClassRef(sortedClasses[0]._id);
        }
        setCollections(colRes.data || []);
      } catch {
        // Taxonomy load fallback
      }
    })();
  }, [isOpen, editingQuizId]);

  // Load editing quiz details if editingQuizId is provided
  useEffect(() => {
    if (!isOpen) return;

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
          } else {
            setHasExpiry(false);
            setExpiryDate("");
            setExpiryTime("23:59");
          }

          if (Array.isArray(data.questions) && data.questions.length > 0) {
            setQuestions(
              data.questions.map((q: any, i: number) => ({
                id: q.id || `q-${i + 1}`,
                text: q.text || "",
                type: q.type || "single",
                options: q.options || [],
                correctOptionIds: q.correctOptionIds || [],
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
      // Reset form for creating a new quiz
      setTitle("");
      setDescription("");
      setCollectionRef("");
      setDifficulty("medium");
      setHasTimer(false);
      setTimeLimitMinutes(20);
      setInstructions("");
      setPublishImmediately(true);
      setHasExpiry(false);
      setExpiryDate("");
      setExpiryTime("23:59");
      setQuestions([
        {
          id: "q-1",
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
      ]);
    }
  }, [isOpen, editingQuizId]);

  // Load subjects when class changes
  useEffect(() => {
    if (!classRef) return;
    (async () => {
      try {
        const { data } = await api.get("/taxonomy/subjects", {
          params: { classId: classRef },
        });
        setSubjects(data || []);
        if (data?.[0]?._id) setSubjectRef(data[0]._id);
      } catch {
        setSubjects([]);
      }
    })();
  }, [classRef]);

  // Load topics when subject or class changes
  useEffect(() => {
    if (!subjectRef && !classRef) {
      setTopics([]);
      setTopicRef("");
      return;
    }
    (async () => {
      try {
        const params: any = {};
        if (subjectRef) params.subjectId = subjectRef;
        else if (classRef) params.classId = classRef;
        const { data } = await api.get("/taxonomy/topics", { params });
        setTopics(data || []);
        if (topicRef && !(data || []).some((t: any) => t._id === topicRef)) {
          setTopicRef("");
        }
      } catch {
        setTopics([]);
        setTopicRef("");
      }
    })();
  }, [subjectRef, classRef]);

  if (!isOpen) return null;

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

  const handleQuestionTextChange = (idx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, text } : q))
    );
  };

  const handleOptionTextChange = (qIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = q.options.map((opt, oIdx) =>
          oIdx === optIdx ? { ...opt, text } : opt
        );
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
            // Add this option as an additional correct answer
            nextCorrect = [...q.correctOptionIds, optId];
          }
          return { ...q, correctOptionIds: nextCorrect };
        } else {
          // Single choice: exactly this one option
          return { ...q, correctOptionIds: [optId] };
        }
      })
    );
  };

  const handleAddOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        if (q.options.length >= 6) {
          toast.info("Maximum 6 options allowed per question");
          return q;
        }
        const newOptId = `opt-${Date.now()}-${q.options.length + 1}`;
        return {
          ...q,
          options: [...q.options, { id: newOptId, text: "" }],
        };
      })
    );
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qIdx) return q;
        if (q.options.length <= 2) {
          toast.error("A question must have at least 2 options");
          return q;
        }
        const optToRemove = q.options[optIdx];
        const nextOptions = q.options.filter((_, i) => i !== optIdx);
        let nextCorrect = q.correctOptionIds.filter((id) => id !== optToRemove.id);
        if (nextCorrect.length === 0 && nextOptions.length > 0) {
          nextCorrect = [nextOptions[0].id];
        }
        return {
          ...q,
          options: nextOptions,
          correctOptionIds: nextCorrect,
        };
      })
    );
  };

  const handleExplanationChange = (qIdx: number, explanation: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, explanation } : q))
    );
  };

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

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Question ${i + 1} text cannot be empty`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          toast.error(`Question ${i + 1}, Option ${j + 1} cannot be empty`);
          return;
        }
      }
      if (!q.correctOptionIds || !q.correctOptionIds.length) {
        toast.error(`Please mark at least one correct answer for Question ${i + 1}`);
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
        timeLimitMinutes: hasTimer ? (Number(timeLimitMinutes) || 20) : null,
        difficulty,
        questions,
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
        payload.published = publishImmediately;
        await api.put(`/quiz/${editingQuizId}`, payload);
        toast.success(`Updated quiz "${title}"!`);
      } else {
        // 1. Create Quiz
        const { data: createdQuiz } = await api.post("/quiz", payload);

        // 2. Publish immediately if requested
        if (publishImmediately && createdQuiz?._id) {
          const { data: pubRes } = await api.post(`/quiz/${createdQuiz._id}/publish`);
          toast.success(
            `Quiz published! Notified ${pubRes?.notifiedCount || 0} students and subscribers via email & web!`
          );
        } else {
          toast.success("Quiz saved to drafts!");
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || (editingQuizId ? "Failed to update quiz" : "Failed to create quiz"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full border border-[#E5E1D8] shadow-2xl my-3 sm:my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#E5E1D8] flex items-center justify-between bg-[#FAF8F5]">
          <div className="space-y-1">
            <span className="eyebrow text-[#A84C32] block text-[10px] font-bold">
              {editingQuizId ? "Edit Quiz Studio" : "Educator Quiz Studio"}
            </span>
            <h3 className="font-serif-display text-lg sm:text-2xl font-bold text-[#1A1A1A]">
              {editingQuizId ? "Edit Quiz & Settings" : "Create New Quiz"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {fetchingQuiz ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-[#A84C32] animate-spin mb-3" />
            <p className="font-serif-body text-sm text-[#5C5A55]">Loading quiz details…</p>
          </div>
        ) : (
          /* Modal Form */
          <form onSubmit={handleSubmitQuiz} className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-h-[78vh] overflow-y-auto font-ui text-xs">
          {/* Metadata Section */}
          <div className="p-3 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3.5">
            <div>
              <label className="block font-semibold text-[#1A1A1A] mb-1.5">
                Quiz Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Weekly Physics Challenge #3: Friction & Forces"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1A1A1A] mb-1.5">
                Description &amp; Syllabus Covered
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of topics tested in this quiz..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-white"
              />
            </div>

            {/* Cascading Taxonomy Selects with Modern Custom Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

              <CustomSelect
                label="Topic (Optional)"
                value={topicRef}
                onChange={(val) => setTopicRef(val)}
                placeholder="General / All Topics"
                disabled={!subjectRef}
                options={[
                  { value: "", label: "General / All Topics" },
                  ...topics.map((t) => ({
                    value: t._id,
                    label: t.name,
                  })),
                ]}
                emptyMessage={subjectRef ? "No specific topics added" : "Select a subject first"}
              />
            </div>

            {/* Extra Settings: Collection & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5E1D8]/70">
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
                placeholder="None (Individual Quiz)"
                options={[
                  { value: "", label: "None (Individual Quiz)" },
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
                    badge: "Advanced Exam",
                    badgeColor: "bg-rose-50 text-rose-800 border border-rose-200",
                  },
                ]}
              />
            </div>

            {/* Timer Settings (Optional) */}
            <div className="p-3.5 rounded-xl border border-[#E5E1D8] bg-white space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#1A1A1A] text-xs">
                    <Clock className="h-3.5 w-3.5 text-[#A84C32]" />
                    <span>Countdown Timer (Optional)</span>
                  </div>
                  <p className="text-[11px] text-[#5C5A55] mt-0.5">
                    {hasTimer
                      ? "Timer is enabled. Quiz will countdown and auto-submit when time expires."
                      : "Timer is off. Students can take as much time as they need in practice mode."}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={hasTimer}
                    onChange={(e) => setHasTimer(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A84C32]"></div>
                </label>
              </div>

              {hasTimer && (
                <div className="pt-2.5 border-t border-[#E5E1D8]/60 flex items-center gap-3 animate-in fade-in duration-200">
                  <label className="text-xs font-medium text-[#1A1A1A]">Duration:</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 rounded-lg border border-[#E5E1D8] text-xs font-semibold text-[#1A1A1A] bg-[#FAF8F5]"
                  />
                  <span className="text-xs text-[#5C5A55]">Minutes</span>
                </div>
              )}
            </div>

            {/* Expiry / Close Date & Time Settings (Optional) */}
            <div className="p-3.5 rounded-xl border border-[#E5E1D8] bg-white space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#1A1A1A] text-xs">
                    <Calendar className="h-3.5 w-3.5 text-[#A84C32]" />
                    <span>Close / Expiry Date &amp; Time (Optional)</span>
                  </div>
                  <p className="text-[11px] text-[#5C5A55] mt-0.5">
                    {hasExpiry
                      ? "Automatic submission cutoff enabled. Students cannot take or submit after this deadline."
                      : "No deadline. Quiz remains open indefinitely until you manually close it."}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={hasExpiry}
                    onChange={(e) => setHasExpiry(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A84C32]"></div>
                </label>
              </div>

              {hasExpiry && (
                <div className="pt-2 border-t border-[#E5E1D8]/60 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C5A55] mb-1">
                      Close Date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      required={hasExpiry}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5C5A55] mb-1">
                      Close Time (24h)
                    </label>
                    <input
                      type="time"
                      value={expiryTime}
                      onChange={(e) => setExpiryTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Custom Instructions for Students */}
            <div>
              <label className="block font-semibold text-[#5C5A55] mb-1">
                Specific Instructions for Students (Optional)
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Rough sheets permitted. No negative marking."
                className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-ui bg-white"
              />
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-serif-display text-base sm:text-lg font-bold text-[#1A1A1A]">
                Questions ({questions.length})
              </h4>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-semibold text-[#A84C32] hover:bg-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Question</span>
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="p-3.5 sm:p-5 rounded-2xl bg-white border border-[#E5E1D8] space-y-3.5 relative group shadow-2xs hover:shadow-xs transition-shadow"
              >
                {/* Question Top Row: Label & Remove Button */}
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]/60">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-[#A84C32] font-serif-display font-bold text-xs flex items-center justify-center">
                      {qIdx + 1}
                    </span>
                    <span className="font-serif-display text-sm sm:text-base font-bold text-[#1A1A1A]">
                      Question #{qIdx + 1}
                    </span>
                  </div>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Remove this question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-medium hidden xs:inline">Delete</span>
                    </button>
                  )}
                </div>

                {/* Question Type Switch — Full-width Segmented Bar (Never wraps or breaks on mobile) */}
                <div className="space-y-1">
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange(qIdx, "single")}
                      className={`w-full py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        q.type === "single"
                          ? "bg-white text-[#A84C32] shadow-2xs font-bold border border-[#E5E1D8]"
                          : "text-[#5C5A55] hover:text-[#1A1A1A]"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          q.type === "single" ? "border-[#A84C32] bg-[#A84C32]" : "border-[#8C8983]"
                        }`}
                      >
                        {q.type === "single" && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="truncate">Single Choice</span>
                      <span className="text-[10px] text-[#8C8983] font-normal hidden sm:inline">(1 Answer)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange(qIdx, "multiple")}
                      className={`w-full py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        q.type === "multiple"
                          ? "bg-white text-[#A84C32] shadow-2xs font-bold border border-[#E5E1D8]"
                          : "text-[#5C5A55] hover:text-[#1A1A1A]"
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center shrink-0 ${
                          q.type === "multiple" ? "border-[#A84C32] bg-[#A84C32]" : "border-[#8C8983]"
                        }`}
                      >
                        {q.type === "multiple" && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                      </span>
                      <span className="truncate">Multiple Choice</span>
                      <span className="text-[10px] text-[#8C8983] font-normal hidden sm:inline">(Multi)</span>
                    </button>
                  </div>
                </div>

                {/* Question Statement */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#1A1A1A]">
                    Question Statement <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={q.text}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    placeholder={`e.g. Which of the following is a fundamental SI unit?`}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5] font-medium leading-relaxed"
                  />
                </div>

                {/* Options & Correct Answer Selection */}
                <div className="space-y-2.5 pt-1">
                  {/* Mode Banner / Instruction */}
                  <div
                    className={`p-2.5 rounded-xl border text-xs flex flex-col xs:flex-row xs:items-center justify-between gap-2 ${
                      q.type === "multiple"
                        ? "bg-amber-50/80 border-amber-300 text-amber-950"
                        : "bg-[#FAF8F5] border-[#E5E1D8] text-[#5C5A55]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      {q.type === "multiple" ? (
                        <>
                          <CheckSquare className="h-4 w-4 text-[#A84C32] shrink-0" />
                          <span>
                            <strong>Multiple Choice:</strong> You can select <strong>multiple correct answers</strong> (e.g. A and B).
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-[#A84C32] shrink-0" />
                          <span>
                            <strong>Single Choice:</strong> Select <strong>1 correct answer</strong>.
                          </span>
                        </>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border self-start xs:self-auto shrink-0 ${
                        q.correctOptionIds.length > 1
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-white text-[#1A1A1A] border-[#E5E1D8]"
                      }`}
                    >
                      {q.correctOptionIds.length} {q.correctOptionIds.length === 1 ? "correct marked" : "correct marked"}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = q.correctOptionIds.includes(opt.id);
                      const optLetter = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={opt.id}
                          className={`group flex items-center gap-2 p-1.5 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-emerald-50/60 border-emerald-400 shadow-2xs ring-1 ring-emerald-300/60"
                              : "bg-white border-[#E5E1D8] hover:border-[#8C8983]"
                          }`}
                        >
                          {/* Checkbox / Radio toggle button */}
                          <button
                            type="button"
                            onClick={() => handleToggleCorrectOption(qIdx, opt.id)}
                            className="flex items-center gap-2 px-1 py-0.5 rounded-lg hover:bg-black/5 cursor-pointer shrink-0 transition-colors"
                            title={
                              q.type === "multiple"
                                ? isSelected
                                  ? "Click to unmark this option"
                                  : "Click to mark this option as correct"
                                : "Click to select as single correct answer"
                            }
                          >
                            <span
                              className={`w-5 h-5 flex items-center justify-center transition-all ${
                                q.type === "multiple" ? "rounded-md border-2" : "rounded-full border-2"
                              } ${
                                isSelected
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                  : "border-gray-400 bg-white hover:border-[#A84C32]"
                              }`}
                            >
                              {isSelected ? (
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                              ) : null}
                            </span>
                            <span className="font-bold text-xs text-[#1A1A1A] w-4">
                              {optLetter}.
                            </span>
                          </button>

                          {/* Option text input */}
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => handleOptionTextChange(qIdx, optIdx, e.target.value)}
                            placeholder={`Enter Option ${optLetter} text...`}
                            required
                            className="flex-1 min-w-0 px-2 py-1 bg-transparent text-xs font-ui focus:outline-none font-medium text-[#1A1A1A] placeholder:text-[#8C8983]"
                          />

                          {/* Option Remove button if > 2 options */}
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(qIdx, optIdx)}
                              className="p-1 text-[#8C8983] hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0 opacity-60 hover:opacity-100"
                              title="Delete this option"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Option Button (if < 6 options) */}
                  {q.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIdx)}
                      className="text-[11px] font-semibold text-[#A84C32] hover:text-[#8B3A25] hover:underline inline-flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Option {String.fromCharCode(65 + q.options.length)}</span>
                    </button>
                  )}
                </div>

                {/* Explanation Card */}
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#5C5A55]">
                    <Sparkles className="h-3 w-3 text-[#A84C32]" />
                    <span>Answer Explanation (Revealed to students after submission)</span>
                  </div>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                    placeholder="Briefly explain why this answer is correct..."
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-white text-[#1A1A1A]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Notification & Publish Controls */}
          <div className="p-4 rounded-2xl bg-[#FBF4F2] border border-[#A84C32]/20 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-[#1A1A1A] text-xs">
                Publish immediately &amp; notify subscribers?
              </p>
              <p className="text-[11px] text-[#5C5A55] mt-0.5">
                Automatically dispatches email &amp; website notifications to all enrolled students who subscribed to you.
              </p>
            </div>
            <input
              type="checkbox"
              checked={publishImmediately}
              onChange={(e) => setPublishImmediately(e.target.checked)}
              className="w-5 h-5 accent-[#A84C32] rounded cursor-pointer shrink-0"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#5C5A55] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="lumen-button-primary px-6 py-2.5 text-xs font-semibold shadow-xs inline-flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {editingQuizId
                  ? "Save Changes"
                  : publishImmediately
                  ? "Publish & Notify Subscribers"
                  : "Save as Draft"}
              </span>
            </button>
          </div>
        </form>
      )}
      </div>

      {/* Modal: Create New Test Series (Consistent with QuizCollectionManager) */}
      {showCreateSeries && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E5E1D8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#E5E1D8] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <span className="eyebrow text-[#A84C32] block text-[10px]">
                  New Series
                </span>
                <h3 className="font-serif-display text-xl font-bold text-[#1A1A1A]">
                  Create New Quiz Series
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateSeries(false);
                  if (collectionRef === "__create_new__") setCollectionRef("");
                }}
                className="p-2 rounded-xl text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateSeries} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Series Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Thermodynamics Complete Test Series"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Series Description &amp; Syllabus
                </label>
                <textarea
                  rows={3}
                  value={newSeriesDesc}
                  onChange={(e) => setNewSeriesDesc(e.target.value)}
                  placeholder="Explain which chapters/concepts are covered and guidelines for students..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newSeriesTags}
                  onChange={(e) => setNewSeriesTags(e.target.value)}
                  placeholder="Physics, Grade 11, Mechanics, Board Exam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E1D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateSeries(false);
                    if (collectionRef === "__create_new__") setCollectionRef("");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#5C5A55] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSeries}
                  className="lumen-button-primary px-5 py-2.5 text-xs font-semibold shadow-xs inline-flex items-center gap-1.5"
                >
                  {creatingSeries && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Create Quiz Series</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

