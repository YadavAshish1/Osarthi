"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, X, Trash2, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface TopicRecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void;
}

interface BinTopic {
  _id: string;
  name: string;
  subjectName: string;
  className: string;
  deletedAt: string;
  deletedUntil: string;
  daysLeft: number;
}

export default function TopicRecycleBinModal({
  isOpen,
  onClose,
  onRestored,
}: TopicRecycleBinModalProps) {
  const [topics, setTopics] = useState<BinTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/taxonomy/teacher/topics/bin");
      setTopics(res.data.bin || res.data.binTopics || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Network error loading recycle bin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBin();
      setMessage(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (topicId: string, topicName: string) => {
    setRestoringId(topicId);
    setMessage(null);
    setError(null);

    try {
      await api.post(`/taxonomy/topics/${topicId}/restore`);
      setMessage(`Topic "${topicName}" and its insights restored successfully!`);
      // Update local list
      setTopics((prev) => prev.filter((t) => t._id !== topicId));
      onRestored();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to restore topic");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full border border-[#E5E1D8] shadow-2xl space-y-5 font-ui max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3.5 shrink-0">
          <div className="flex items-center gap-2 text-[#1A1A1A]">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif-display text-lg font-semibold leading-none">
                Topic Recycle Bin
              </h3>
              <p className="text-[11px] text-[#5C5A55] mt-1">
                Topics are retained for 30 days before permanent automatic cleanup
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

        {/* Feedback alerts */}
        {message && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Body list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#5C5A55]">
              <Loader2 className="h-5 w-5 animate-spin text-[#A84C32]" />
              <span>Checking recycle bin...</span>
            </div>
          ) : topics.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                <Trash2 className="h-5 w-5" />
              </div>
              <p className="font-serif-display text-base font-semibold text-[#1A1A1A]">
                No topics in Recycle Bin
              </p>
              <p className="text-[11px] text-[#5C5A55] max-w-xs mx-auto">
                Deleted topics stay here safely for 30 days so you can restore them anytime.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topics.map((t) => (
                <div
                  key={t._id}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#A84C32]/30 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-serif-display text-sm font-semibold text-[#1A1A1A] truncate">
                        {t.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E1D8] text-[10px] font-semibold text-[#5C5A55]">
                        {t.className}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E1D8] text-[10px] font-medium text-[#1A1A1A]">
                        {t.subjectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#5C5A55]">
                      <span className="flex items-center gap-1 text-amber-800 font-semibold bg-amber-100/70 px-2 py-0.5 rounded-md">
                        <Clock className="h-3 w-3" />
                        <span>{t.daysLeft} days remaining</span>
                      </span>
                      <span>•</span>
                      <span>
                        Moved on{" "}
                        {new Date(t.deletedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestore(t._id, t.name)}
                    disabled={restoringId === t._id}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer text-xs disabled:opacity-50 shadow-2xs"
                  >
                    {restoringId === t._id ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Restoring...</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore Topic</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E5E1D8] shrink-0 text-xs">
          <span className="text-[11px] text-[#5C5A55]">
            {topics.length} item{topics.length === 1 ? "" : "s"} in bin
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#E5E1D8] bg-white text-xs font-semibold text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
