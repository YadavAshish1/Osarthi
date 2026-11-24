import { Suspense } from "react";
import type { Metadata } from "next";
import QuizStudioClient from "./QuizStudioClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Educator Quiz Studio",
  description: "Create and publish interactive practice assessments and quizzes for students.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuizCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
          <Loader2 className="h-8 w-8 text-[#A84C32] animate-spin mb-3" />
          <p className="font-serif-body text-base text-[#5C5A55]">
            Opening Educator Quiz Studio…
          </p>
        </div>
      }
    >
      <QuizStudioClient />
    </Suspense>
  );
}

