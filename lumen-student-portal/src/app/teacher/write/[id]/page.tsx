"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import NativeContentEditor from "@/components/NativeContentEditor";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditInsightPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const contentId = resolvedParams.id;

  const { user, ready } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    if (!ready || !contentId) return;

    (async () => {
      try {
        const { data } = await api.get(`/content/${contentId}`);
        setContent(data);
      } catch (err: any) {
        toast.error("Failed to load insight details");
        router.push("/teacher/dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [contentId, ready, router]);

  if (!ready || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
        <Loader2 className="w-8 h-8 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">Loading Insight Details…</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-8 font-ui">
      <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-6">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 font-ui text-xs tracking-widest uppercase text-[#5C5A55] hover:text-[#A84C32] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      <div className="p-8 md:p-10 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs">
        <NativeContentEditor
          topicId={content.topicRef}
          contentId={content._id}
          initialData={{
            title: content.title,
            blocks: content.blocks,
            published: content.published,
          }}
          onSaved={() => {
            router.push("/teacher/dashboard");
          }}
        />
      </div>
    </div>
  );
}
