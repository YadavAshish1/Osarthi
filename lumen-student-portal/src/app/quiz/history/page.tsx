import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import StudentQuizHistory from "@/components/StudentQuizHistory";

export const metadata: Metadata = {
  title: "My Quiz History & Performance",
  description: "View your completed quizzes, question-by-question solutions, and performance accuracy on Medhashine.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuizHistoryPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-20">
      {/* Top Breadcrumb Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55] hover:text-[#A84C32] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <StudentQuizHistory />
      </main>
    </div>
  );
}

