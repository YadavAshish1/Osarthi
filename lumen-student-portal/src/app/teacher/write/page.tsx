"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import TaxonomyPicker from "@/components/TaxonomyPicker";
import NativeContentEditor from "@/components/NativeContentEditor";
import { ArrowLeft, Clock, Sparkles, BookOpen, PenSquare, ShieldAlert } from "lucide-react";

export default function WriteInsightPage() {
  const { user, ready, openAuth } = useAuth();
  const router = useRouter();

  const [selection, setSelection] = useState<{
    classId: string;
    subjectId: string;
    topicId: string;
  } | null>(null);

  const [teacherStatus, setTeacherStatus] = useState<"none" | "incomplete" | "pending" | "approved" | "loading">("loading");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setTeacherStatus("none");
      return;
    }

    // Query backend for submitted teacher application & approval status
    api
      .get("/teacher-applications/my-status")
      .then(({ data }) => {
        const app = data?.application;
        if (!app) {
          // No teacher application profile submitted yet
          setTeacherStatus("incomplete");
        } else if (app.status === "approved") {
          setTeacherStatus("approved");
        } else if (app.status === "pending") {
          setTeacherStatus("pending");
        } else {
          setTeacherStatus("incomplete");
        }
      })
      .catch(() => setTeacherStatus("incomplete"));
  }, [user, ready]);

  if (!ready || teacherStatus === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
        <div className="w-8 h-8 border-2 border-[#A84C32] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">Verifying Educator Approval…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center font-serif-body">
        <div className="w-16 h-16 rounded-full bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center mx-auto mb-4 border border-[#A84C32]/20">
          <PenSquare className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-serif-display font-semibold text-[#1A1A1A]">Sign In to Write Insights</h2>
        <p className="mt-2 text-sm text-[#5C5A55] font-ui max-w-md mx-auto">
          Medhashine Educator Studio requires an authenticated account to publish insights.
        </p>
        <button
          onClick={() => openAuth("login")}
          className="mt-6 px-8 py-3 rounded-full bg-[#1A1A1A] text-white font-ui text-sm font-semibold hover:bg-[#A84C32] transition-colors cursor-pointer"
        >
          Sign In as Teacher
        </button>
      </div>
    );
  }

  if (teacherStatus === "pending") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 font-ui">
        <div className="p-8 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300">
            <Clock className="h-7 w-7" />
          </div>
          <span className="eyebrow text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 font-bold inline-block">
            Teacher Application Under Review
          </span>
          <h2 className="font-serif-display text-3xl font-semibold text-amber-950">
            Your Application is Being Reviewed
          </h2>
          <p className="font-serif-body text-sm text-amber-800 max-w-lg mx-auto leading-relaxed">
            Our administrative team is currently verifying your teaching credentials. Once approved, your "Write Insight" studio will unlock automatically.
          </p>
          <div className="pt-2">
            <Link
              href="/profile"
              className="px-6 py-2.5 rounded-full bg-amber-900 text-white text-xs font-semibold hover:bg-amber-950 transition-colors inline-block"
            >
              View Application Status on Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (teacherStatus === "incomplete" || teacherStatus === "none") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 font-ui">
        <div className="p-8 rounded-3xl bg-white border border-[#E5E1D8] text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center mx-auto border border-[#A84C32]/20 font-bold">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-3 py-1 rounded-full border border-[#A84C32]/20 font-bold inline-block">
            Complete Teacher Profile Required
          </span>
          <h2 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">
            Please Complete Your Educator Profile Details
          </h2>
          <p className="font-serif-body text-sm text-[#5C5A55] max-w-lg mx-auto leading-relaxed">
            Before writing insights, you must complete your educator application profile (education, subjects, experience, and bio). Once completed and approved, your Insight Studio will unlock.
          </p>
          <div className="pt-2">
            <Link
              href="/become-a-teacher"
              className="px-8 py-3.5 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <span>Complete Teacher Profile Application Now</span>
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-10 font-ui">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55] hover:text-[#A84C32] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Educator Profile
        </Link>

        <Link
          href="/teacher/dashboard"
          className="px-4 py-2 rounded-full bg-white border border-[#E5E1D8] text-xs font-semibold text-[#1A1A1A] hover:border-[#A84C32] hover:text-[#A84C32] transition-colors"
        >
          Open Audience Analytics
        </Link>
      </div>

      {/* Step 1: Select Topic */}
      <div className="p-8 md:p-10 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-6">
        <div className="border-b border-[#E5E1D8] pb-6">
          <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-3 py-1 rounded-full border border-[#A84C32]/20 inline-block mb-2 font-bold">
            Step 1: Topic Taxonomy Selection
          </span>
          <h2 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">
            Select or Create Class, Subject & Topic
          </h2>
          <p className="text-sm font-serif-body text-[#5C5A55] mt-1">
            Choose the academic category where this insight will be published for students.
          </p>
        </div>

        <TaxonomyPicker allowCreate onSelect={setSelection} />
      </div>

      {/* Step 2: Native Content Editor */}
      {selection?.topicId ? (
        <div className="p-8 md:p-10 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs">
          <NativeContentEditor
            topicId={selection.topicId}
            onSaved={() => {
              router.push("/teacher/dashboard");
            }}
          />
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E5E1D8] text-[#5C5A55]">
          <BookOpen className="h-10 w-10 text-[#A84C32] mx-auto mb-3 opacity-60" />
          <h3 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">
            Select a Topic Above to Launch Editor
          </h3>
          <p className="font-serif-body text-sm mt-1 max-w-md mx-auto">
            Once you pick a topic, the full Medhashine Insight Editor and AI Assistant will load here.
          </p>
        </div>
      )}
    </div>
  );
}
