"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X, ArrowLeft } from "lucide-react";
import { hasDevanagari, phoneticToDevanagari, romanizeHindi } from "@/lib/transliterate";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Matches an option label against a query using direct text plus bidirectional
 * Hindi <-> Hinglish (Roman) phonetic transliteration.
 */
export function matchesFilterLabel(label: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes(q)) return true;

  if (hasDevanagari(label)) {
    const romanLabel = romanizeHindi(label).toLowerCase();
    if (romanLabel.includes(q)) return true;
  }

  if (!hasDevanagari(q)) {
    const devQuery = phoneticToDevanagari(q);
    if (devQuery && lowerLabel.includes(devQuery)) return true;
  } else {
    const romanQuery = romanizeHindi(q).toLowerCase();
    if (romanQuery && lowerLabel.includes(romanQuery)) return true;
  }

  return false;
}

export function DesktopFilterCombobox({
  testId,
  allLabel,
  value,
  options,
  onSelect,
  disabledHint,
  buttonClassName,
}: {
  testId?: string;
  allLabel: string;
  value: string;
  options: FilterOption[];
  onSelect: (val: string) => void;
  disabledHint?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setTerm("");
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setTerm("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    if (options.length > 5) {
      setTimeout(() => inputRef.current?.focus(), 20);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open, options.length]);

  const closeMenu = () => {
    setOpen(false);
    setTerm("");
  };

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = useMemo(() => {
    if (!term.trim()) return options;
    return options.filter((o) => matchesFilterLabel(o.label, term));
  }, [options, term]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid={testId}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (open) closeMenu();
          else setOpen(true);
        }}
        className={
          buttonClassName ||
          `h-10 px-4 rounded-full border font-ui text-sm inline-flex items-center gap-2 transition-all cursor-pointer max-w-[220px] ${
            value
              ? "bg-[#A84C32]/10 border-[#A84C32]/50 text-[#1A1A1A] font-semibold"
              : "bg-white border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32]"
          }`
        }
      >
        <span className="truncate">{selectedOption ? selectedOption.label : allLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#5C5A55] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 mt-2 w-68 bg-white border border-[#E5E1D8] rounded-2xl shadow-xl z-40 overflow-hidden"
        >
          {options.length > 5 && (
            <div className="p-2 border-b border-[#E5E1D8] bg-[#FAF8F5]">
              <div className="relative flex items-center">
                <Search className="h-3.5 w-3.5 text-[#5C5A55] absolute left-2.5 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder={`Search ${allLabel.replace(/^All\s+/i, "").toLowerCase()} (English / हिंदी)…`}
                  className="w-full h-8 pl-8 pr-7 rounded-lg bg-white border border-[#E5E1D8] text-xs font-ui text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                />
                {term && (
                  <button
                    type="button"
                    onClick={() => setTerm("")}
                    aria-label="Clear filter search"
                    className="absolute right-2 text-[#5C5A55] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-1.5">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => {
                onSelect("");
                closeMenu();
              }}
              className={`w-full px-3.5 py-2 text-left text-xs font-ui flex items-center justify-between hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                !value ? "font-semibold text-[#A84C32]" : "text-[#5C5A55]"
              }`}
            >
              <span>{allLabel}</span>
              {!value && <Check className="h-3.5 w-3.5 text-[#A84C32]" />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-4 text-center text-xs font-ui text-[#5C5A55]">
                {options.length === 0 && disabledHint ? disabledHint : "No matches found"}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(opt.value);
                      closeMenu();
                    }}
                    className={`w-full px-3.5 py-2 text-left text-xs font-ui flex items-center justify-between gap-2 hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                      isSelected ? "font-semibold text-[#A84C32] bg-[#A84C32]/5" : "text-[#1A1A1A]"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#A84C32]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileSearchablePickerView({
  title,
  allLabel,
  value,
  options,
  onSelect,
  onBack,
  onClose,
  emptyHint,
}: {
  title: string;
  allLabel: string;
  value: string;
  options: FilterOption[];
  onSelect: (val: string) => void;
  onBack?: () => void;
  onClose: () => void;
  emptyHint?: string;
}) {
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!term.trim()) return options;
    return options.filter((o) => matchesFilterLabel(o.label, term));
  }, [options, term]);

  return (
    <div className="flex flex-col h-[72vh] max-h-[78vh]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E5E1D8]">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to all filters"
              className="w-9 h-9 rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center text-[#1A1A1A] shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="font-serif-display text-xl font-semibold text-[#1A1A1A] truncate">
              {title}
            </h2>
            <p className="text-[11px] font-ui text-[#5C5A55]">
              {filteredOptions.length} of {options.length} options
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center text-[#1A1A1A] shrink-0 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="py-3 shrink-0">
        <div className="relative flex items-center">
          <Search className="h-4 w-4 text-[#5C5A55] absolute left-3.5 pointer-events-none" />
          <input
            ref={inputRef}
            data-testid="mobile-filter-option-search"
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={`Search ${title.toLowerCase()} (English or हिंदी)…`}
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-[#E5E1D8] text-sm font-ui text-[#1A1A1A] placeholder:text-[#7A7770] focus:outline-none focus:border-[#A84C32]"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Clear option search"
              className="absolute right-2.5 w-7 h-7 rounded-full hover:bg-[#E5E1D8]/50 flex items-center justify-center text-[#5C5A55] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Options List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 pb-4">
        {!term.trim() && (
          <button
            type="button"
            onClick={() => onSelect("")}
            className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl text-left text-sm font-ui flex items-center justify-between border transition-colors cursor-pointer ${
              !value
                ? "bg-[#A84C32]/10 border-[#A84C32]/50 font-semibold text-[#A84C32]"
                : "bg-white border-[#E5E1D8] text-[#1A1A1A]"
            }`}
          >
            <span>{allLabel}</span>
            {!value && <Check className="h-4 w-4 text-[#A84C32] shrink-0" />}
          </button>
        )}

        {filteredOptions.length === 0 ? (
          <div className="py-10 px-4 text-center bg-white rounded-2xl border border-[#E5E1D8] text-sm font-ui text-[#5C5A55]">
            {options.length === 0 && emptyHint ? (
              emptyHint
            ) : (
              <>
                No matches for <span className="font-semibold text-[#1A1A1A]">&ldquo;{term}&rdquo;</span>
              </>
            )}
          </div>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt.value)}
                className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl text-left text-sm font-ui flex items-center justify-between gap-3 border transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#A84C32]/10 border-[#A84C32]/50 font-semibold text-[#A84C32]"
                    : "bg-white border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32]/40"
                }`}
              >
                <span className="leading-snug">{opt.label}</span>
                {isSelected && <Check className="h-4 w-4 text-[#A84C32] shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Responsive searchable single-select dropdown:
 * - Desktop (`md+`): inline popover combobox
 * - Mobile (`< md`): opens a smooth bottom-sheet searchable picker
 */
export function ResponsiveSearchableSelect({
  testId,
  title,
  allLabel,
  value,
  options,
  onSelect,
  disabledHint,
}: {
  testId?: string;
  title: string;
  allLabel: string;
  value: string;
  options: FilterOption[];
  onSelect: (val: string) => void;
  disabledHint?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopFilterCombobox
          testId={testId}
          allLabel={allLabel}
          value={value}
          options={options}
          onSelect={onSelect}
          disabledHint={disabledHint}
        />
      </div>

      {/* Mobile trigger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={`md:hidden w-full sm:w-auto h-10 px-3.5 rounded-full border font-ui text-xs sm:text-sm inline-flex items-center justify-between gap-2 transition-colors cursor-pointer ${
          value
            ? "bg-[#A84C32]/10 border-[#A84C32]/50 text-[#1A1A1A] font-semibold"
            : "bg-white border-[#E5E1D8] text-[#1A1A1A]"
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : allLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#5C5A55]" />
      </button>

      {/* Mobile bottom-sheet searchable picker */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/45 backdrop-blur-xs flex items-end"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-full bg-[#FAF8F5] rounded-t-3xl p-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[#D5CFC2] mx-auto mb-3" />
            <MobileSearchablePickerView
              title={title}
              allLabel={allLabel}
              value={value}
              options={options}
              emptyHint={disabledHint}
              onSelect={(val) => {
                onSelect(val);
                setMobileOpen(false);
              }}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
