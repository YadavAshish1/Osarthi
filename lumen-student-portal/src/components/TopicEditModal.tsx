"use client";

import React, { useState, useEffect } from "react";
import { Edit3, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface TopicEditModalProps {
  topicId: string;
  currentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newName: string) => void;
}

export default function TopicEditModal({
  topicId,
  currentName,
  isOpen,
  onClose,
  onSuccess,
}: TopicEditModalProps) {
  const [name, setName] = useState(currentName);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(currentName);
    setError(null);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Topic name cannot be empty.");
      return;
    }
    if (trimmed.toLowerCase() === currentName.toLowerCase()) {
      onClose();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.put(`/taxonomy/topics/${topicId}`, { name: trimmed });
      onSuccess(trimmed);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to rename topic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#E5E1D8] shadow-2xl space-y-5 font-ui">
        <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3.5">
          <div className="flex items-center gap-2 text-[#1A1A1A]">
            <div className="w-8 h-8 rounded-xl bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center border border-[#A84C32]/20">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif-display text-lg font-semibold leading-none">
                Rename Topic
              </h3>
              <p className="text-[11px] text-[#5C5A55] mt-1">
                Updates live on all insights linked to this topic
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
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
              Topic Name <span className="text-[#A84C32]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Newton's Laws of Motion"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5] text-xs font-ui text-[#1A1A1A] focus:outline-none focus:border-[#A84C32] focus:bg-white transition-all font-medium"
              autoFocus
              maxLength={80}
            />
            <p className="text-[11px] text-[#5C5A55] mt-1 flex justify-between">
              <span>Must be unique within its subject.</span>
              <span>{name.length}/80</span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E1D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5E1D8] bg-white text-xs font-semibold text-[#5C5A55] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-5 py-2 rounded-xl bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-all disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {submitting ? (
                <span>Saving Changes...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Save Topic</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
