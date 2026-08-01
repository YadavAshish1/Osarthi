"use client";

import React, { useState } from "react";
import { Heart, Reply, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail, CommentItem } from "@/lib/api";
import { toast } from "sonner";

function timeAgo(iso: string) {
  if (!iso) return "recently";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

interface CommentNodeProps {
  node: CommentItem;
  depth?: number;
  blogId: string;
  onRefresh: () => void;
}

export default function CommentNode({
  node,
  depth = 0,
  blogId,
  onRefresh,
}: CommentNodeProps) {
  const { user, requireAuth } = useAuth();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(node.content);
  const [likeState, setLikeState] = useState({
    liked: !!node.user_liked,
    count: node.likes_count || 0,
  });

  const isOwner = user && (user.id === node.user_id || user.name === node.user_name);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/comments/blog/${blogId}`, {
        content: replyText.trim(),
        parent_id: node.id,
      });
      setReplyText("");
      setReplying(false);
      onRefresh();
    } catch (e: any) {
      toast.error(formatApiErrorDetail(e?.response?.data?.message || e?.response?.data?.detail));
    }
  };

  const submitEdit = async () => {
    if (!editText.trim()) return;
    try {
      await api.patch(`/comments/${node.id}`, { content: editText.trim() });
      setEditing(false);
      onRefresh();
    } catch (e: any) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    }
  };

  const doDelete = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/comments/${node.id}`);
      toast.success("Comment deleted");
      onRefresh();
    } catch (e: any) {
      toast.error(formatApiErrorDetail(e?.response?.data?.message || e?.response?.data?.detail));
    }
  };

  const toggleLike = async () => {
    if (!requireAuth(toggleLike)) return;
    try {
      const newLiked = !likeState.liked;
      const newCount = newLiked ? likeState.count + 1 : Math.max(0, likeState.count - 1);
      setLikeState({ liked: newLiked, count: newCount });
      await api.post(`/comments/${node.id}/like`);
    } catch {
      // Optimistic update retained
    }
  };

  const openReply = () => {
    if (!user) {
      requireAuth(() => setReplying(true));
      return;
    }
    setReplying((v) => !v);
  };

  return (
    <div
      data-testid={`comment-node-${node.id}`}
      className={`relative ${
        depth > 0 ? "ml-4 sm:ml-8 pl-4 border-l-2 border-[#E5E1D8] mt-4" : "mt-6"
      }`}
    >
      <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-4 mb-2 font-ui">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold uppercase">
              {node.user_name?.[0] || "U"}
            </div>
            <div>
              <span className="font-semibold text-xs text-[#1A1A1A]">
                {node.user_name}
              </span>
              <span className="text-[11px] text-[#5C5A55] ml-2">
                {timeAgo(node.created_at)}
              </span>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(!editing)}
                className="text-[#5C5A55] hover:text-[#1A1A1A] p-1 cursor-pointer"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={doDelete}
                className="text-[#5C5A55] hover:text-red-600 p-1 cursor-pointer"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 border border-[#E5E1D8] rounded-md font-serif-body text-sm focus:outline-none focus:border-[#A84C32]"
              rows={3}
            />
            <div className="mt-2 flex justify-end gap-2 font-ui text-xs">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded border border-[#E5E1D8] text-[#5C5A55]"
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                className="px-3 py-1.5 rounded bg-[#1A1A1A] text-white"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="font-serif-body text-sm leading-relaxed text-[#2A2A2A] mt-1 whitespace-pre-wrap">
            {node.content}
          </p>
        )}

        <div className="mt-3 pt-2 flex items-center gap-4 font-ui text-xs text-[#5C5A55]">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              likeState.liked ? "text-[#A84C32] font-semibold" : "hover:text-[#1A1A1A]"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                likeState.liked ? "fill-[#A84C32] text-[#A84C32]" : ""
              }`}
            />
            <span>{likeState.count}</span>
          </button>

          {depth < 3 && (
            <button
              onClick={openReply}
              className="flex items-center gap-1.5 hover:text-[#A84C32] transition-colors cursor-pointer"
            >
              <Reply className="h-3.5 w-3.5" />
              <span>Reply</span>
            </button>
          )}
        </div>

        {replying && (
          <div className="mt-4 pt-3 border-t border-[#E5E1D8]">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a thoughtful reply..."
              className="w-full p-3 border border-[#E5E1D8] rounded-md font-serif-body text-sm focus:outline-none focus:border-[#A84C32]"
              rows={2}
            />
            <div className="mt-2 flex justify-end gap-2 font-ui text-xs">
              <button
                onClick={() => setReplying(false)}
                className="px-3 py-1.5 rounded border border-[#E5E1D8] text-[#5C5A55]"
              >
                Cancel
              </button>
              <button
                onClick={submitReply}
                className="px-3 py-1.5 rounded bg-[#1A1A1A] text-white hover:bg-[#A84C32]"
              >
                Post Reply
              </button>
            </div>
          </div>
        )}
      </div>

      {node.replies && node.replies.length > 0 && (
        <div className="space-y-3">
          {node.replies.map((child) => (
            <CommentNode
              key={child.id}
              node={child}
              depth={depth + 1}
              blogId={blogId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
