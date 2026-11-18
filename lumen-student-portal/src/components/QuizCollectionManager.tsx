"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface QuizItem {
  _id: string;
  title: string;
  description?: string;
  timeLimitMinutes?: number;
  difficulty?: string;
  attemptCount?: number;
  avgScore?: number;
  published?: boolean;
}

interface CollectionItem {
  _id: string;
  title: string;
  description: string;
  type?: string;
  subjectRef?: { _id: string; name: string };
  classRef?: { _id: string; name: string };
  topicRef?: { _id: string; name: string };
  quizzes: QuizItem[];
  isPublic: boolean;
  tags?: string[];
  createdAt: string;
}

export default function QuizCollectionManager() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [availableQuizzes, setAvailableQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Add Quiz to Series Modal
  const [addQuizModalOpen, setAddQuizModalOpen] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<string | null>(null);
  const [selectedQuizIdToAdd, setSelectedQuizIdToAdd] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [colRes, quizRes] = await Promise.all([
        api.get("/quiz/collections/teacher"),
        api.get("/quiz/teacher"),
      ]);
      setCollections(Array.isArray(colRes.data) ? colRes.data : []);
      setAvailableQuizzes(Array.isArray(quizRes.data) ? quizRes.data : []);
    } catch {
      toast.error("Failed to load test series");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setTagsInput("");
    setIsModalOpen(true);
  };

  const openEditModal = (col: CollectionItem) => {
    setEditingId(col._id);
    setTitle(col.title);
    setDescription(col.description || "");
    setTagsInput((col.tags || []).join(", "));
    setIsModalOpen(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a test series title");
      return;
    }

    setSubmitting(true);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingId) {
        await api.put(`/quiz/collections/${editingId}`, {
          title: title.trim(),
          description: description.trim(),
          tags,
        });
        toast.success(`Updated series "${title}"`);
      } else {
        await api.post("/quiz/collections", {
          title: title.trim(),
          description: description.trim(),
          tags,
        });
        toast.success(`Created new series "${title}"! Subscribed students have been notified.`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save test series");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCollection = async (id: string, titleStr: string) => {
    if (!confirm(`Are you sure you want to delete "${titleStr}"? Individual quizzes will remain safe in your quiz studio.`)) {
      return;
    }
    try {
      await api.delete(`/quiz/collections/${id}`);
      toast.success(`Deleted series "${titleStr}"`);
      fetchData();
    } catch {
      toast.error("Failed to delete test series");
    }
  };

  const handleAddQuiz = async () => {
    if (!targetCollectionId || !selectedQuizIdToAdd) return;
    try {
      await api.post(`/quiz/collections/${targetCollectionId}/add-quiz`, {
        quizId: selectedQuizIdToAdd,
      });
      toast.success("Added quiz to test series");
      setAddQuizModalOpen(false);
      setSelectedQuizIdToAdd("");
      fetchData();
    } catch {
      toast.error("Failed to add quiz to test series");
    }
  };

  const handleRemoveQuiz = async (collectionId: string, quizId: string) => {
    try {
      await api.delete(`/quiz/collections/${collectionId}/remove-quiz/${quizId}`);
      toast.success("Removed quiz from series");
      fetchData();
    } catch {
      toast.error("Failed to remove quiz");
    }
  };

  return (
    <div className="space-y-6 font-ui">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FAF8F5] to-white border border-[#E5E1D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-3 py-1 rounded-full border border-[#A84C32]/20 font-bold inline-flex items-center gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" /> Structured Quiz Series
            </span>
          </div>
          <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">
            Topic &amp; Periodic Test Series
          </h2>
          <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] max-w-xl">
            Group your quizzes into chapter-wise practice sets, weekly challenges, or monthly full mock exams for systematic student preparation.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="lumen-button-primary py-3 px-5 text-xs font-semibold shadow-xs shrink-0 inline-flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Quiz Series</span>
        </button>
      </div>

      {/* Series Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#A84C32] animate-spin mb-3" />
          <p className="font-serif-body text-sm text-[#5C5A55]">Loading test series…</p>
        </div>
      ) : collections.length === 0 ? (
        <div className="py-16 text-center bg-[#FAF8F5] rounded-2xl border border-[#E5E1D8] p-8 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] shadow-2xs">
            <Layers className="h-7 w-7 opacity-75" />
          </div>
          <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">
            No Test Series Created Yet
          </h3>
          <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] max-w-md mx-auto">
            Organize quizzes into structured Topic series (e.g. &ldquo;Kinematics Mastery Series&rdquo;) or Weekly assessment sets (e.g. &ldquo;Week 1 Physics Test&rdquo;) to help students systematically revise.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="lumen-button-primary py-2.5 px-5 text-xs font-semibold shadow-xs inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Your First Series</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {collections.map((col) => {
            const isExpanded = expandedId === col._id;
            const quizCount = col.quizzes?.length || 0;

            return (
              <div
                key={col._id}
                className="rounded-2xl border border-[#E5E1D8] bg-white shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Series Card Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 bg-[#FBF4F2] text-[#A84C32] border-[#A84C32]/30">
                        <Layers className="h-3 w-3" />
                        Test Series
                      </span>
                      {col.subjectRef?.name && (
                        <span className="text-[10px] font-semibold text-[#5C5A55] bg-[#FAF8F5] border border-[#E5E1D8] px-2 py-0.5 rounded-full">
                          {col.subjectRef.name}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-[#8C8983] bg-white border border-[#E5E1D8] px-2 py-0.5 rounded-full">
                        {quizCount} {quizCount === 1 ? "Quiz" : "Quizzes"}
                      </span>
                    </div>

                    <h3 className="font-serif-display text-lg sm:text-xl font-semibold text-[#1A1A1A]">
                      {col.title}
                    </h3>

                    {col.description && (
                      <p className="font-serif-body text-xs sm:text-sm text-[#5C5A55] line-clamp-2">
                        {col.description}
                      </p>
                    )}

                    {col.tags && col.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {col.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium text-[#8C8983] bg-[#FAF8F5] px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <Tag className="h-2.5 w-2.5 text-[#A84C32]" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#E5E1D8]/60">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetCollectionId(col._id);
                        setSelectedQuizIdToAdd("");
                        setAddQuizModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs font-semibold text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Quiz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(col)}
                      title="Edit Series Details"
                      className="p-2 rounded-xl border border-[#E5E1D8] bg-white text-[#5C5A55] hover:text-[#1A1A1A] hover:border-[#A84C32] transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCollection(col._id, col.title)}
                      title="Delete Series"
                      className="p-2 rounded-xl border border-[#E5E1D8] bg-white text-[#5C5A55] hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : col._id)}
                      className="p-2 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5] text-[#1A1A1A] hover:border-[#A84C32] transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      <span>{isExpanded ? "Hide" : "View Quizzes"}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Quizzes in this Series */}
                {isExpanded && (
                  <div className="border-t border-[#E5E1D8] bg-[#FAF8F5]/50 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#5C5A55] uppercase tracking-wider">
                        Quizzes in this Series ({quizCount})
                      </p>
                      <span className="text-[11px] text-[#8C8983]">Students practice these tests sequentially</span>
                    </div>

                    {quizCount === 0 ? (
                      <div className="py-6 text-center text-xs font-serif-body text-[#5C5A55] bg-white rounded-xl border border-[#E5E1D8]">
                        This series has no quizzes yet. Click &ldquo;+ Add Quiz&rdquo; to add relevant quizzes here.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {col.quizzes.map((quiz, idx) => (
                          <div
                            key={quiz._id}
                            className="p-3 bg-white rounded-xl border border-[#E5E1D8] flex items-center justify-between gap-3 hover:border-[#A84C32]/60 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-[#FAF8F5] border border-[#E5E1D8] text-[11px] font-bold text-[#A84C32] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h5 className="font-serif-display text-sm font-semibold text-[#1A1A1A] truncate">
                                  {quiz.title}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] text-[#5C5A55] mt-0.5">
                                  <span>{quiz.timeLimitMinutes || 30} mins</span>
                                  <span>·</span>
                                  <span className="capitalize">{quiz.difficulty || "medium"}</span>
                                  <span>·</span>
                                  <span>{quiz.attemptCount || 0} attempts</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveQuiz(col._id, quiz._id)}
                              title="Remove from series"
                              className="p-1.5 rounded-lg text-[#5C5A55] hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create / Edit Quiz Series */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E5E1D8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#E5E1D8] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <span className="eyebrow text-[#A84C32] block text-[10px]">
                  {editingId ? "Edit Series" : "New Series"}
                </span>
                <h3 className="font-serif-display text-xl font-bold text-[#1A1A1A]">
                  {editingId ? "Edit Quiz Series" : "Create New Quiz Series"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Series Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Thermodynamics Complete Test Series"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Series Description &amp; Syllabus
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Physics, Grade 11, Mechanics, Board Exam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E1D8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#5C5A55] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="lumen-button-primary px-5 py-2.5 text-xs font-semibold shadow-xs inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingId ? "Save Changes" : "Create Quiz Series"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Quiz to Series */}
      {addQuizModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#E5E1D8] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
              <h4 className="font-serif-display text-lg font-bold text-[#1A1A1A]">
                Add Quiz to Series
              </h4>
              <button
                type="button"
                onClick={() => setAddQuizModalOpen(false)}
                className="p-1.5 rounded-lg text-[#5C5A55] hover:text-[#1A1A1A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">
                Select from your existing quizzes:
              </label>
              <select
                value={selectedQuizIdToAdd}
                onChange={(e) => setSelectedQuizIdToAdd(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] bg-[#FAF8F5] cursor-pointer"
              >
                <option value="">-- Choose a Quiz --</option>
                {availableQuizzes.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.title} ({q.difficulty || "medium"})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-[#E5E1D8] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAddQuizModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#5C5A55]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedQuizIdToAdd}
                onClick={handleAddQuiz}
                className="lumen-button-primary px-4 py-2 text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                Add to Series
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
