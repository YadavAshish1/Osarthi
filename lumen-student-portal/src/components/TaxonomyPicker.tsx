"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, BookOpen, Layers, CheckCircle2, Loader2, Send, Clock, ExternalLink } from "lucide-react";

interface TaxonomyPickerProps {
  allowCreate?: boolean;
  onSelect: (selection: { classId: string; subjectId: string; topicId: string } | null) => void;
}

interface Item {
  _id: string;
  name: string;
}

export default function TaxonomyPicker({ allowCreate = true, onSelect }: TaxonomyPickerProps) {
  const [classes, setClasses] = useState<Item[]>([]);
  const [subjects, setSubjects] = useState<Item[]>([]);
  const [topics, setTopics] = useState<Item[]>([]);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Request state for Class and Subject
  const [reqClassOpen, setReqClassOpen] = useState(false);
  const [reqClassName, setReqClassName] = useState("");
  const [requestingClass, setRequestingClass] = useState(false);

  const [reqSubjectOpen, setReqSubjectOpen] = useState(false);
  const [reqSubjectName, setReqSubjectName] = useState("");
  const [requestingSubject, setRequestingSubject] = useState(false);

  // Direct Topic creation state
  const [newTopicName, setNewTopicName] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);

  // Fetch classes on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/taxonomy/classes");
        setClasses(data || []);
      } catch (err: any) {
        toast.error("Failed to load classes from database");
      } finally {
        setLoadingClasses(false);
      }
    })();
  }, []);

  // Fetch subjects when classId changes
  useEffect(() => {
    setSubjectId("");
    setTopicId("");
    setSubjects([]);
    setTopics([]);
    onSelect(null);

    if (!classId) return;

    (async () => {
      setLoadingSubjects(true);
      try {
        const { data } = await api.get(`/taxonomy/subjects?classId=${classId}`);
        setSubjects(data || []);
      } catch {
        toast.error("Failed to load subjects");
      } finally {
        setLoadingSubjects(false);
      }
    })();
  }, [classId]);

  // Fetch topics when subjectId changes
  useEffect(() => {
    setTopicId("");
    setTopics([]);
    onSelect(null);

    if (!subjectId) return;

    (async () => {
      setLoadingTopics(true);
      try {
        const { data } = await api.get(`/taxonomy/topics?subjectId=${subjectId}`);
        setTopics(data || []);
      } catch {
        toast.error("Failed to load topics");
      } finally {
        setLoadingTopics(false);
      }
    })();
  }, [subjectId]);

  // Notify parent on topicId selection
  useEffect(() => {
    if (classId && subjectId && topicId) {
      onSelect({ classId, subjectId, topicId });
    } else {
      onSelect(null);
    }
  }, [classId, subjectId, topicId, onSelect]);

  // Submit Class Request to Admins
  const handleRequestClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqClassName.trim()) return;
    setRequestingClass(true);
    try {
      const { data } = await api.post("/taxonomy-requests", {
        type: "class",
        name: reqClassName.trim(),
      });
      toast.success(data.message || `Class request submitted to Admins!`);
      setReqClassName("");
      setReqClassOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit class request");
    } finally {
      setRequestingClass(false);
    }
  };

  // Submit Subject Request to Admins
  const handleRequestSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqSubjectName.trim() || !classId) return;
    setRequestingSubject(true);
    try {
      const { data } = await api.post("/taxonomy-requests", {
        type: "subject",
        name: reqSubjectName.trim(),
        classId,
      });
      toast.success(data.message || `Subject request submitted to Admins!`);
      setReqSubjectName("");
      setReqSubjectOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit subject request");
    } finally {
      setRequestingSubject(false);
    }
  };

  // Create Topic directly under subject
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !subjectId) return;
    setCreatingTopic(true);
    try {
      const { data } = await api.post("/taxonomy/topics", {
        name: newTopicName.trim(),
        subjectId,
      });
      setTopics((prev) => [...prev, data]);
      setTopicId(data._id);
      setNewTopicName("");
      toast.success(`Topic "${data.name}" created!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create topic");
    } finally {
      setCreatingTopic(false);
    }
  };

  return (
    <div className="space-y-4 font-ui">
      {/* Top Banner Notice */}
      <div className="p-3.5 px-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-between text-xs text-[#5C5A55]">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#A84C32] shrink-0" />
          <span>Can't find a specific Class or Subject? Submit a request to Admins for review.</span>
        </div>
        <Link
          href="/teacher/requests"
          className="text-[#A84C32] font-semibold hover:underline flex items-center gap-1 shrink-0 ml-2"
        >
          <span>View Request History</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Class Selector */}
        <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#1A1A1A]">
              <BookOpen className="h-4 w-4 text-[#A84C32]" />
              <h4 className="font-serif-display text-lg font-semibold">1. Select Class Level</h4>
            </div>
          </div>

          {loadingClasses ? (
            <div className="flex items-center gap-2 text-xs text-[#5C5A55] py-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#A84C32]" /> Loading classes…
            </div>
          ) : (
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full p-3 rounded-xl bg-white border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32]"
            >
              <option value="">-- Choose Class --</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {/* Request New Class Button */}
          {allowCreate && (
            <div className="pt-2 border-t border-[#E5E1D8]">
              {!reqClassOpen ? (
                <button
                  type="button"
                  onClick={() => setReqClassOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#A84C32]/40 text-[#A84C32] bg-[#FBF4F2]/50 text-xs font-semibold hover:bg-[#FBF4F2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Request New Class Level</span>
                </button>
              ) : (
                <form onSubmit={handleRequestClassSubmit} className="space-y-2 bg-white p-3 rounded-xl border border-[#E5E1D8]">
                  <p className="text-[11px] font-semibold text-[#1A1A1A]">Request Class Addition to Admin:</p>
                  <input
                    type="text"
                    required
                    value={reqClassName}
                    onChange={(e) => setReqClassName(e.target.value)}
                    placeholder="Class Name (e.g. Class 8)"
                    className="w-full p-2 rounded-lg border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#A84C32]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReqClassOpen(false)}
                      className="flex-1 py-1.5 rounded-lg border border-[#E5E1D8] text-xs text-[#5C5A55]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={requestingClass || !reqClassName.trim()}
                      className="flex-1 py-1.5 rounded-lg bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {requestingClass ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* 2. Subject Selector */}
        <div className={`p-6 rounded-2xl border transition-all space-y-4 ${classId ? "bg-[#FAF8F5] border-[#E5E1D8]" : "bg-[#F5F2EB]/50 border-dashed border-[#E5E1D8] opacity-60"}`}>
          <div className="flex items-center gap-2 text-[#1A1A1A]">
            <Layers className="h-4 w-4 text-[#A84C32]" />
            <h4 className="font-serif-display text-lg font-semibold">2. Select Subject</h4>
          </div>

          {loadingSubjects ? (
            <div className="flex items-center gap-2 text-xs text-[#5C5A55] py-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#A84C32]" /> Loading subjects…
            </div>
          ) : (
            <select
              disabled={!classId}
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full p-3 rounded-xl bg-white border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] disabled:opacity-50"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Request New Subject Button */}
          {allowCreate && classId && (
            <div className="pt-2 border-t border-[#E5E1D8]">
              {!reqSubjectOpen ? (
                <button
                  type="button"
                  onClick={() => setReqSubjectOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#A84C32]/40 text-[#A84C32] bg-[#FBF4F2]/50 text-xs font-semibold hover:bg-[#FBF4F2] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Request New Subject</span>
                </button>
              ) : (
                <form onSubmit={handleRequestSubjectSubmit} className="space-y-2 bg-white p-3 rounded-xl border border-[#E5E1D8]">
                  <p className="text-[11px] font-semibold text-[#1A1A1A]">Request Subject Addition to Admin:</p>
                  <input
                    type="text"
                    required
                    value={reqSubjectName}
                    onChange={(e) => setReqSubjectName(e.target.value)}
                    placeholder="Subject Name (e.g. Biotechnology)"
                    className="w-full p-2 rounded-lg border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#A84C32]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReqSubjectOpen(false)}
                      className="flex-1 py-1.5 rounded-lg border border-[#E5E1D8] text-xs text-[#5C5A55]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={requestingSubject || !reqSubjectName.trim()}
                      className="flex-1 py-1.5 rounded-lg bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {requestingSubject ? <Loader2 className="h-3 w-3 animate-spin" /> : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* 3. Topic Selector — Direct Add Topic Intact */}
        <div className={`p-6 rounded-2xl border transition-all space-y-4 ${subjectId ? "bg-[#FAF8F5] border-[#E5E1D8]" : "bg-[#F5F2EB]/50 border-dashed border-[#E5E1D8] opacity-60"}`}>
          <div className="flex items-center gap-2 text-[#1A1A1A]">
            <CheckCircle2 className="h-4 w-4 text-[#A84C32]" />
            <h4 className="font-serif-display text-lg font-semibold">3. Select Topic</h4>
          </div>

          {loadingTopics ? (
            <div className="flex items-center gap-2 text-xs text-[#5C5A55] py-2">
              <Loader2 className="h-4 w-4 animate-spin text-[#A84C32]" /> Loading topics…
            </div>
          ) : (
            <select
              disabled={!subjectId}
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full p-3 rounded-xl bg-white border border-[#E5E1D8] text-xs font-ui focus:outline-none focus:border-[#A84C32] disabled:opacity-50"
            >
              <option value="">-- Choose Topic --</option>
              {topics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          {allowCreate && subjectId && (
            <form onSubmit={handleCreateTopic} className="pt-2 border-t border-[#E5E1D8] space-y-2">
              <input
                type="text"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Or type new Topic (e.g. Thermodynamics)"
                className="w-full p-2.5 rounded-lg bg-white border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#A84C32]"
              />
              <button
                type="submit"
                disabled={creatingTopic || !newTopicName.trim()}
                className="w-full py-2.5 rounded-lg bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {creatingTopic ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                <span>Add Topic</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
