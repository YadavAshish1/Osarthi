"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  X,
  Search,
  ChevronDown,
  Check,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowUpDown,
} from "lucide-react";

export interface FilterState {
  teacher_id: string;
  class_level: string;
  subject: string;
  topic: string;
}

export type InsightSort = "newest" | "popular" | "liked" | "oldest";
export type ViewMode = "grid" | "list";

/** A node in the explore tree: Class → Subjects → Topics */
export interface TreeNode {
  _id: string;
  name: string;
  subjects?: {
    _id: string;
    name: string;
    topics?: { _id: string; name: string }[];
  }[];
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  tree: TreeNode[];
  teachers: { id: string; name: string }[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClear: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  sort?: InsightSort;
  onSortChange?: (sort: InsightSort) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  totalCount?: number;
  loading?: boolean;
}

const SORT_LABELS: Record<InsightSort, string> = {
  newest: "Newest First",
  popular: "Most Popular",
  liked: "Most Appreciated",
  oldest: "Oldest First",
};

function FilterCombobox({
  testId,
  allLabel,
  value,
  options,
  onSelect,
  disabledHint,
}: {
  testId: string;
  allLabel: string;
  value: string;
  options: FilterOption[];
  onSelect: (val: string) => void;
  disabledHint?: string;
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
    if (options.length > 6) {
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
    const q = term.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
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
        className={`h-10 px-4 rounded-full border font-ui text-sm inline-flex items-center gap-2 transition-all cursor-pointer max-w-[220px] ${
          value
            ? "bg-[#A84C32]/10 border-[#A84C32]/50 text-[#1A1A1A] font-semibold"
            : "bg-white border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32]"
        }`}
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
          className="absolute left-0 mt-2 w-64 bg-white border border-[#E5E1D8] rounded-2xl shadow-xl z-40 overflow-hidden"
        >
          {options.length > 6 && (
            <div className="p-2 border-b border-[#E5E1D8] bg-[#FAF8F5]">
              <div className="relative flex items-center">
                <Search className="h-3.5 w-3.5 text-[#5C5A55] absolute left-2.5 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder={`Filter ${allLabel.replace(/^All\s+/i, "").toLowerCase()}…`}
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-white border border-[#E5E1D8] text-xs font-ui text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                />
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

export default function FilterBar({
  tree = [],
  teachers = [],
  filters,
  onChange,
  onClear,
  searchQuery = "",
  onSearchChange,
  sort = "newest",
  onSortChange,
  viewMode = "grid",
  onViewModeChange,
  totalCount,
  loading = false,
}: FilterBarProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // All class options (always show all, deduplicated by name)
  const classOptions = useMemo(() => {
    const seen = new Set<string>();
    return tree.filter((c) => {
      const key = c.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tree]);

  // Subject options — filtered by selected class if any, deduplicated by name
  const subjectOptions: FilterOption[] = useMemo(() => {
    const sources = filters.class_level
      ? tree.filter((c) => c._id === filters.class_level)
      : tree;

    const map = new Map<string, { ids: string[]; name: string }>();
    for (const cls of sources) {
      for (const sub of cls.subjects || []) {
        const key = sub.name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, { ids: [sub._id], name: sub.name.trim() });
        } else {
          const item = map.get(key)!;
          if (!item.ids.includes(sub._id)) {
            item.ids.push(sub._id);
          }
        }
      }
    }
    return Array.from(map.values()).map((item) => ({
      value: item.ids.join(","),
      label: item.name,
    }));
  }, [tree, filters.class_level]);

  // Topic options — filtered by selected subject if any, else by selected class, deduplicated by name
  const topicOptions: FilterOption[] = useMemo(() => {
    let subjects: { _id: string; name: string; topics?: { _id: string; name: string }[] }[] = [];

    if (filters.subject) {
      const selectedSubjectIds = new Set(filters.subject.split(",").filter(Boolean));
      for (const cls of tree) {
        for (const sub of cls.subjects || []) {
          if (selectedSubjectIds.has(sub._id)) {
            subjects.push(sub);
          }
        }
      }
    } else if (filters.class_level) {
      const clsNode = tree.find((c) => c._id === filters.class_level);
      subjects = clsNode?.subjects || [];
    } else {
      for (const cls of tree) {
        subjects = subjects.concat(cls.subjects || []);
      }
    }

    const map = new Map<string, { ids: string[]; name: string }>();
    for (const sub of subjects) {
      for (const topic of sub.topics || []) {
        const key = topic.name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, { ids: [topic._id], name: topic.name.trim() });
        } else {
          const item = map.get(key)!;
          if (!item.ids.includes(topic._id)) {
            item.ids.push(topic._id);
          }
        }
      }
    }

    return Array.from(map.values()).map((item) => ({
      value: item.ids.join(","),
      label: item.name,
    }));
  }, [tree, filters.class_level, filters.subject]);

  const teacherOptions: FilterOption[] = useMemo(
    () => teachers.map((t) => ({ value: t.id, label: t.name })),
    [teachers]
  );

  // When class changes: reset subject and topic if they're no longer valid
  const handleClassChange = (classId: string) => {
    const newFilters = { ...filters, class_level: classId };

    if (classId) {
      const cls = tree.find((c) => c._id === classId);
      const validSubjects = new Set((cls?.subjects || []).map((s) => s._id));
      const currentSubjectIds = newFilters.subject.split(",").filter(Boolean);
      const isSubjectValid = currentSubjectIds.some((id) => validSubjects.has(id));
      if (newFilters.subject && !isSubjectValid) {
        newFilters.subject = "";
        newFilters.topic = "";
      }
    }

    onChange(newFilters);
  };

  // When subject changes: reset topic if it's no longer valid
  const handleSubjectChange = (subjectId: string) => {
    const newFilters = { ...filters, subject: subjectId };

    if (subjectId && newFilters.topic) {
      const selectedSubIds = new Set(subjectId.split(",").filter(Boolean));
      const validTopics = new Set<string>();
      for (const cls of tree) {
        for (const sub of cls.subjects || []) {
          if (selectedSubIds.has(sub._id)) {
            for (const t of sub.topics || []) {
              validTopics.add(t._id);
            }
          }
        }
      }
      const currentTopicIds = newFilters.topic.split(",").filter(Boolean);
      const isTopicValid = currentTopicIds.some((id) => validTopics.has(id));
      if (!isTopicValid) {
        newFilters.topic = "";
      }
    }

    onChange(newFilters);
  };

  const resolvedSubjectValue = useMemo(() => {
    if (!filters.subject) return "";
    if (subjectOptions.some((s) => s.value === filters.subject)) return filters.subject;
    const match = subjectOptions.find((s) => s.value.split(",").includes(filters.subject));
    return match ? match.value : filters.subject;
  }, [filters.subject, subjectOptions]);

  const resolvedTopicValue = useMemo(() => {
    if (!filters.topic) return "";
    if (topicOptions.some((tp) => tp.value === filters.topic)) return filters.topic;
    const match = topicOptions.find((tp) => tp.value.split(",").includes(filters.topic));
    return match ? match.value : filters.topic;
  }, [filters.topic, topicOptions]);

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (searchQuery.trim() && onSearchChange) {
    activeChips.push({
      key: "search",
      label: `Search: "${searchQuery.trim()}"`,
      onRemove: () => onSearchChange(""),
    });
  }
  if (filters.class_level) {
    const clsName = classOptions.find((c) => c._id === filters.class_level)?.name || "Grade";
    activeChips.push({
      key: "class",
      label: clsName,
      onRemove: () => handleClassChange(""),
    });
  }
  if (filters.subject) {
    const subName =
      subjectOptions.find((s) => s.value === resolvedSubjectValue)?.label || "Subject";
    activeChips.push({
      key: "subject",
      label: subName,
      onRemove: () => handleSubjectChange(""),
    });
  }
  if (filters.topic) {
    const topName = topicOptions.find((t) => t.value === resolvedTopicValue)?.label || "Topic";
    activeChips.push({
      key: "topic",
      label: topName,
      onRemove: () => onChange({ ...filters, topic: "" }),
    });
  }
  if (filters.teacher_id) {
    const tName = teachers.find((t) => t.id === filters.teacher_id)?.name || "Educator";
    activeChips.push({
      key: "teacher",
      label: tName,
      onRemove: () => onChange({ ...filters, teacher_id: "" }),
    });
  }
  if (sort !== "newest" && onSortChange) {
    activeChips.push({
      key: "sort",
      label: `Sort: ${SORT_LABELS[sort]}`,
      onRemove: () => onSortChange("newest"),
    });
  }

  const dropdownActiveCount = Object.values(filters).filter(Boolean).length;

  return (
    <div data-testid="filter-bar" className="space-y-3 sm:space-y-4 font-ui">
      {/* Primary Toolbar: Inline Search + Sort + Mobile Filter Trigger + Grid/List Toggle */}
      <div className="bg-white border border-[#E5E1D8] rounded-2xl p-2.5 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-2.5 sm:gap-3">
          {onSearchChange && (
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5C5A55] pointer-events-none" />
              <input
                data-testid="insights-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search notes, topics, teachers (English / हिंदी)…"
                aria-label="Search insights"
                className="w-full h-10 pl-10 pr-9 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] text-sm text-[#1A1A1A] placeholder:text-[#7A7770] focus:outline-none focus:bg-white focus:border-[#A84C32] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-[#E5E1D8]/60 flex items-center justify-center text-[#5C5A55] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Selector */}
            {onSortChange && (
              <div className="relative flex-1 md:flex-initial">
                <ArrowUpDown className="h-3.5 w-3.5 text-[#5C5A55] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  data-testid="insights-sort-select"
                  aria-label="Sort insights"
                  value={sort}
                  onChange={(e) => onSortChange(e.target.value as InsightSort)}
                  className="w-full md:w-auto h-10 pl-8 pr-7 sm:pl-9 sm:pr-8 rounded-full bg-white border border-[#E5E1D8] text-xs sm:text-sm text-[#1A1A1A] hover:border-[#A84C32] focus:outline-none focus:border-[#A84C32] appearance-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="liked">Most Appreciated</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <ChevronDown className="h-3.5 w-3.5 text-[#5C5A55] absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Mobile Filter Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className={`md:hidden h-10 px-3.5 rounded-full border text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                dropdownActiveCount > 0
                  ? "border-[#A84C32]/50 bg-[#A84C32]/8 text-[#1A1A1A]"
                  : "border-[#E5E1D8] bg-white text-[#1A1A1A] hover:border-[#A84C32]"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#A84C32]" />
              <span>Filters</span>
              {dropdownActiveCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#A84C32] text-white text-[10px] font-bold leading-none">
                  {dropdownActiveCount}
                </span>
              )}
            </button>

            {/* Grid / List Toggle (available on both Mobile and Desktop) */}
            {onViewModeChange && (
              <div
                role="group"
                aria-label="View layout"
                className="inline-flex items-center p-1 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] shrink-0"
              >
                <button
                  type="button"
                  onClick={() => onViewModeChange("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-[#A84C32] shadow-2xs"
                      : "text-[#5C5A55] hover:text-[#1A1A1A]"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onViewModeChange("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-[#A84C32] shadow-2xs"
                      : "text-[#5C5A55] hover:text-[#1A1A1A]"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Faceted Dropdowns */}
        <div className="hidden md:flex flex-wrap items-center gap-2.5 pt-1">
          <FilterCombobox
            testId="filter-class"
            allLabel="All Grades"
            value={filters.class_level}
            options={classOptions.map((c) => ({ value: c._id, label: c.name }))}
            onSelect={handleClassChange}
          />
          <FilterCombobox
            testId="filter-subject"
            allLabel="All Subjects"
            value={resolvedSubjectValue}
            options={subjectOptions}
            onSelect={handleSubjectChange}
            disabledHint="Select a grade to view subjects"
          />
          <FilterCombobox
            testId="filter-topic"
            allLabel="All Topics"
            value={resolvedTopicValue}
            options={topicOptions}
            onSelect={(val) => onChange({ ...filters, topic: val })}
            disabledHint="Select a subject to narrow topics"
          />
          <FilterCombobox
            testId="filter-teacher"
            allLabel="All Teachers"
            value={filters.teacher_id}
            options={teacherOptions}
            onSelect={(val) => onChange({ ...filters, teacher_id: val })}
          />
        </div>
      </div>

      {/* 1-Click Quick Grade Pills */}
      {classOptions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5A55] shrink-0 mr-0.5">
            Grade:
          </span>
          <button
            type="button"
            onClick={() => handleClassChange("")}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
              !filters.class_level
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-white text-[#5C5A55] border-[#E5E1D8] hover:border-[#A84C32] hover:text-[#1A1A1A]"
            }`}
          >
            All
          </button>
          {classOptions.map((cl) => {
            const active = filters.class_level === cl._id;
            return (
              <button
                key={cl._id}
                type="button"
                onClick={() => handleClassChange(active ? "" : cl._id)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
                  active
                    ? "bg-[#A84C32] text-white border-[#A84C32] shadow-2xs"
                    : "bg-white text-[#5C5A55] border-[#E5E1D8] hover:border-[#A84C32] hover:text-[#1A1A1A]"
                }`}
              >
                {cl.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 1-Click Subject Pills when a Grade is chosen */}
      {filters.class_level && subjectOptions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C5A55] shrink-0 mr-0.5">
            Subject:
          </span>
          <button
            type="button"
            onClick={() => handleSubjectChange("")}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
              !filters.subject
                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                : "bg-white text-[#5C5A55] border-[#E5E1D8] hover:border-[#A84C32] hover:text-[#1A1A1A]"
            }`}
          >
            All Subjects
          </button>
          {subjectOptions.map((sub) => {
            const active = resolvedSubjectValue === sub.value;
            return (
              <button
                key={sub.value}
                type="button"
                onClick={() => handleSubjectChange(active ? "" : sub.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
                  active
                    ? "bg-[#A84C32] text-white border-[#A84C32] shadow-2xs"
                    : "bg-white text-[#5C5A55] border-[#E5E1D8] hover:border-[#A84C32] hover:text-[#1A1A1A]"
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#5C5A55] mr-1">Active:</span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E1D8] hover:border-[#A84C32] text-xs font-medium text-[#1A1A1A] transition-colors cursor-pointer group"
            >
              <span>{chip.label}</span>
              <X className="h-3 w-3 text-[#5C5A55] group-hover:text-[#A84C32]" />
            </button>
          ))}
          <button
            type="button"
            onClick={onClear}
            data-testid="clear-filters"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-[#A84C32] bg-[#A84C32]/10 hover:bg-[#A84C32]/20 transition-colors cursor-pointer"
          >
            Clear all ({activeChips.length})
          </button>
        </div>
      )}

      {/* Mobile Filter Sheet */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/45 backdrop-blur-xs flex items-end"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-full bg-[#FAF8F5] rounded-t-3xl p-5 pt-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">
                Filter Insights
              </h2>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close filters"
                className="w-9 h-9 rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center text-[#1A1A1A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5A55] mb-1.5">
                  Grade / Class
                </label>
                <select
                  value={filters.class_level}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E1D8] text-[#1A1A1A]"
                >
                  <option value="">All Grades</option>
                  {classOptions.map((cl) => (
                    <option key={cl._id} value={cl._id}>
                      {cl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5A55] mb-1.5">
                  Subject
                </label>
                <select
                  value={resolvedSubjectValue}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E1D8] text-[#1A1A1A]"
                >
                  <option value="">All Subjects</option>
                  {subjectOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5A55] mb-1.5">
                  Topic
                </label>
                <select
                  value={resolvedTopicValue}
                  onChange={(e) => onChange({ ...filters, topic: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E1D8] text-[#1A1A1A]"
                >
                  <option value="">All Topics</option>
                  {topicOptions.map((tp) => (
                    <option key={tp.value} value={tp.value}>
                      {tp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5A55] mb-1.5">
                  Educator
                </label>
                <select
                  value={filters.teacher_id}
                  onChange={(e) => onChange({ ...filters, teacher_id: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E1D8] text-[#1A1A1A]"
                >
                  <option value="">All Teachers</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setMobileDrawerOpen(false);
                }}
                className="flex-1 h-11 rounded-full border border-[#E5E1D8] bg-white text-xs font-semibold text-[#1A1A1A]"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex-1 h-11 rounded-full bg-[#A84C32] text-xs font-semibold text-white"
              >
                {loading
                  ? "Updating…"
                  : typeof totalCount === "number"
                  ? `Show ${totalCount} Insight${totalCount === 1 ? "" : "s"}`
                  : "Show Results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
