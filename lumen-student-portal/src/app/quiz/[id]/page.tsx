import React from "react";
import type { Metadata } from "next";
import QuizTakingClient from "./QuizTakingClient";

export const metadata: Metadata = {
  title: "Take Quiz",
  description: "Assess your knowledge and test your concepts on Medhashine.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function QuizTakingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <QuizTakingClient id={resolvedParams.id} />;
}

