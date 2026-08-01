"use client";

import React from "react";
import { BookOpen } from "lucide-react";

export default function EmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div
      data-testid="empty-state"
      className="text-center py-20 px-6 max-w-md mx-auto bg-white border border-[#E5E1D8] rounded-xl my-10"
    >
      <div className="w-14 h-14 rounded-full bg-[#A84C32]/10 text-[#A84C32] flex items-center justify-center mx-auto mb-4">
        <BookOpen className="h-7 w-7" />
      </div>
      <h3 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">
        No insights match your filter
      </h3>
      <p className="mt-2 font-serif-body text-sm text-[#5C5A55] leading-relaxed">
        Try broadening your search criteria or selecting a different subject or teacher.
      </p>
      {onClear && (
        <button
          onClick={onClear}
          className="mt-6 px-6 py-2.5 rounded-full bg-[#1A1A1A] text-white font-ui text-xs font-semibold hover:bg-[#A84C32] transition-colors cursor-pointer"
        >
          Reset All Filters
        </button>
      )}
    </div>
  );
}
