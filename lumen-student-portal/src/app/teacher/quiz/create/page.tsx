import { Suspense } from "react";
import QuizStudioClient from "./QuizStudioClient";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Educator Quiz Studio | Medhashine",
  description: "Create and publish interactive practice assessments and quizzes for students.",
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

