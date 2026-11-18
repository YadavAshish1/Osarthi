import React from "react";
import QuizTakingClient from "./QuizTakingClient";

export const metadata = {
  title: "Take Quiz | Medhashine",
  description: "Assess your knowledge and test your concepts on Medhashine.",
};

export default async function QuizTakingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <QuizTakingClient id={resolvedParams.id} />;
}

