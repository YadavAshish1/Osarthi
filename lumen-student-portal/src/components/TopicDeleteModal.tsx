"use client";

import React, { useState, useEffect } from "react";
import { Trash2, X, AlertTriangle, Clock, BookOpen, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface TopicDeleteModalProps {
  topicId: string;
  topicName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LinkedBlog {
  _id: string;
  title: string;
  published: boolean;
  createdAt: string;
  viewsCount?: number;
  likesCount?: number;
}

export default function TopicDeleteModal({
  topicId,
  topicName,
  isOpen,
  onClose,
  onSuccess,
}: TopicDeleteModalProps) {
  const [loadingImpact, setLoadingImpact] = useState(true);
  const [blogs, setBlogs] = useState<LinkedBlog[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAcknowledged(false);
    setError(null);
    setLoadingImpact(true);

    const fetchImpact = async () => {
      try {
        const res = await api.get(`/taxonomy/topics/${topicId}/impact`);
        setBlogs(res.data.blogs || []);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Failed to load topic impact details");
      } finally {
        setLoadingImpact(false);
      }
    };

    fetchImpact();
  }, [topicId, isOpen]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      await api.delete(`/taxonomy/topics/${topicId}`);
      onSuccess(); // parent handles closing via setTopicToDelete(null)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to delete topic");
    } finally {
      setDeleting(false);
    }
  };

  const blogCount = blogs.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-[#E5E1D8] shadow-2xl space-y-5 font-ui max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3.5 shrink-0">
          <div className="flex items-center gap-2 text-rose-700">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <Trash2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif-display text-lg font-semibold leading-none text-[#1A1A1A]">
                Delete Topic
              </h3>
              <p className="text-[11px] text-[#5C5A55] mt-1">
                Protected by 30-day retention with instant restore option
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#5C5A55] hover:text-[#1A1A1A] p-1 rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Target Info */}
          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-1">
            <span className="text-[11px] text-[#5C5A55] uppercase tracking-wider font-semibold">
              Topic to be deleted:
            </span>
            <p className="font-serif-display text-base font-semibold text-[#1A1A1A]">
              "{topicName}"
            </p>
          </div>

          {/* 30-Day Retention Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-950">
              <Clock className="h-4 w-4 text-amber-700 shrink-0" />
              <span>30-Day Recycle Bin Safety Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              This topic will NOT be permanently erased right now. It will stay in your{" "}
              <strong>Topic Recycle Bin for 30 days</strong>. You can restore it anytime with all
              its insights. After 30 days, expired topics are safely purged.
            </p>
          </div>

          {/* Impact Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#A84C32]" />
                <span>Associated Insights Impact:</span>
              </span>
              {loadingImpact ? (
                <span className="text-[11px] text-[#5C5A55] flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking...
                </span>
              ) : (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    blogCount > 0
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {blogCount} {blogCount === 1 ? "insight" : "insights"} affected
                </span>
              )}
            </div>

            {loadingImpact ? (
              <div className="py-6 text-center text-[#5C5A55] text-xs">
                Scanning database for linked teacher insights...
              </div>
            ) : blogCount === 0 ? (
              <p className="text-[11px] text-[#5C5A55] bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                No insights are currently linked to this topic. It can be safely removed to the bin
                without affecting any published student content.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] text-rose-800 font-medium">
                  The following {blogCount} {blogCount === 1 ? "insight" : "insights"} will be
                  automatically unpublished and moved to the recycle bin alongside this topic:
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-rose-50/60 border border-rose-200/80">
                  {blogs.map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-rose-100 text-[11px]"
                    >
                      <span className="font-medium text-[#1A1A1A] truncate max-w-[280px]">
                        {b.title}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          b.published
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {b.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirmation Checkbox if blogs exist */}
          {!loadingImpact && blogCount > 0 && (
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] cursor-pointer select-none hover:bg-white transition-colors">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-[#A84C32] focus:ring-[#A84C32] cursor-pointer"
              />
              <span className="text-[11px] text-[#1A1A1A] leading-relaxed">
                I understand that moving <strong>"{topicName}"</strong> to the bin will also unpublish{" "}
                <strong>{blogCount} linked insight(s)</strong> and move them to my Recycle Bin.
              </span>
            </label>
          )}
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E1D8] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E1D8] bg-white text-xs font-semibold text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || loadingImpact || (blogCount > 0 && !acknowledged)}
            className="px-5 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 transition-all disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {deleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Moving to Bin...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>Move Topic to Recycle Bin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
