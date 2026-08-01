"use client";

import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail, CommentItem as CommentItemType } from "@/lib/api";
import { toast } from "sonner";
import CommentNode from "./CommentNode";

interface CommentThreadProps {
  blogId: string;
  comments: CommentItemType[];
  onRefresh: () => void;
}

export default function CommentThread({
  blogId,
  comments,
  onRefresh,
}: CommentThreadProps) {
  const { user, requireAuth } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submitTop = async () => {
    if (!text.trim()) return;
    if (!requireAuth(submitTop)) return;
    setLoading(true);
    try {
      await api.post(`/comments/blog/${blogId}`, {
        content: text.trim(),
      });
      setText("");
      toast.success("Reflection posted!");
      onRefresh();
    } catch (e: any) {
      toast.error(formatApiErrorDetail(e?.response?.data?.message || e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    if (!user) requireAuth(undefined);
  };

  return (
    <div data-testid="comments-section" className="mt-16 pt-12 border-t border-[#E5E1D8]">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="h-6 w-6 text-[#A84C32]" />
        <h3 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">
          Reflections ({comments.length})
        </h3>
      </div>

      <div className="p-6 border border-[#E5E1D8] rounded-xl bg-white shadow-xs">
        <textarea
          id="comment-box"
          data-testid="comment-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={handleFocus}
          placeholder={
            user
              ? "Share what this piece stirred in you…"
              : "Sign in to join the conversation…"
          }
          className="w-full p-4 border border-[#E5E1D8] rounded-lg font-serif-body text-base placeholder:text-[#5C5A55]/60 focus:outline-none focus:border-[#A84C32] focus:ring-1 focus:ring-[#A84C32] transition-colors"
          rows={3}
        />
        <div className="mt-3 flex items-center justify-between font-ui text-xs">
          <span className="text-[#5C5A55]">
            {user
              ? `Commenting as ${user.name}`
              : "Reading is free. Commenting needs a free account."}
          </span>
          <button
            onClick={submitTop}
            disabled={loading || !text.trim()}
            data-testid="submit-comment"
            className="px-6 py-2.5 rounded-full bg-[#1A1A1A] text-white font-medium hover:bg-[#A84C32] transition-colors disabled:opacity-40 cursor-pointer"
          >
            {loading ? "Posting..." : user ? "Post reflection" : "Sign in to post"}
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 font-serif-body text-sm text-[#5C5A55] italic">
            No reflections yet. Be the first to start the discussion.
          </div>
        ) : (
          comments.map((c) => (
            <CommentNode
              key={c.id}
              node={c}
              blogId={blogId}
              onRefresh={onRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
}
