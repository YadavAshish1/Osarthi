"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  label?: string;
  required?: boolean;
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  helperText?: string;
  emptyMessage?: string;
}

export default function CustomSelect({
  label,
  required = false,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  helperText,
  emptyMessage = "No options available",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block font-semibold text-[#5C5A55] text-xs mb-1.5 font-ui">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-ui transition-all text-left cursor-pointer ${
          disabled
            ? "bg-[#FAF8F5] border-[#E5E1D8] text-[#5C5A55]/50 cursor-not-allowed"
            : isOpen
            ? "bg-white border-[#A84C32] ring-2 ring-[#A84C32]/10 shadow-xs"
            : "bg-white border-[#E5E1D8] hover:border-[#A84C32]/60 hover:bg-[#FAF8F5]/40"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="text-[#A84C32] shrink-0">{selectedOption.icon}</span>
          )}
          <span
            className={`truncate block ${
              selectedOption ? "text-[#1A1A1A] font-medium" : "text-[#5C5A55]/60"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span
              className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                selectedOption.badgeColor || "bg-[#A84C32]/10 text-[#A84C32]"
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`h-4 w-4 text-[#5C5A55] shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#A84C32]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white border border-[#E5E1D8] shadow-xl overflow-hidden font-ui animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto py-1"
        >
          {options.length === 0 ? (
            <div className="px-3.5 py-3 text-center text-xs text-[#5C5A55]/70 italic">
              {emptyMessage}
            </div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value, option.disabled)}
                  className={`flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs transition-colors cursor-pointer ${
                    option.disabled
                      ? "opacity-40 cursor-not-allowed bg-transparent"
                      : isSelected
                      ? "bg-[#A84C32]/8 text-[#A84C32] font-semibold"
                      : "text-[#1A1A1A] hover:bg-[#FAF8F5] hover:text-[#A84C32]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {option.icon && (
                      <span className="text-[#A84C32] shrink-0">{option.icon}</span>
                    )}
                    <span className="truncate">{option.label}</span>
                    {option.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          option.badgeColor || "bg-[#FAF8F5] text-[#5C5A55]"
                        }`}
                      >
                        {option.badge}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-[#A84C32] shrink-0 stroke-[2.5]" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-[#5C5A55]/70 mt-1 font-ui">{helperText}</p>
      )}
    </div>
  );
}

