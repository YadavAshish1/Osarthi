"use client";

import React, { useMemo, useState } from "react";
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowUpDown,
} from "lucide-react";
import {
  DesktopFilterCombobox,
  FilterOption,
  MobileSearchablePickerView,
} from "@/components/SearchableFilterPicker";

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
  const [activeMobilePicker, setActiveMobilePicker] = useState<
    "subject" | "topic" | "teacher" | null
  >(null);

  const openMobileDrawer = () => {
    setActiveMobilePicker(null);
    setMobileDrawerOpen(true);
  };

  const closeMobileDrawer = () => {
    setMobileDrawerOpen(false);
    setActiveMobilePicker(null);
  };

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
              data-testid="mobile-filters-trigger"
              onClick={openMobileDrawer}
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
          <DesktopFilterCombobox
            testId="filter-class"
            allLabel="All Grades"
            value={filters.class_level}
            options={classOptions.map((c) => ({ value: c._id, label: c.name }))}
            onSelect={handleClassChange}
          />
          <DesktopFilterCombobox
            testId="filter-subject"
            allLabel="All Subjects"
            value={resolvedSubjectValue}
            options={subjectOptions}
            onSelect={handleSubjectChange}
            disabledHint="Select a grade to view subjects"
          />
          <DesktopFilterCombobox
            testId="filter-topic"
            allLabel="All Topics"
            value={resolvedTopicValue}
            options={topicOptions}
            onSelect={(val) => onChange({ ...filters, topic: val })}
            disabledHint="Select a subject to narrow topics"
          />
          <DesktopFilterCombobox
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

      {/* Mobile Filter Sheet with Searchable Drill-Down Pickers */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/45 backdrop-blur-xs flex items-end"
          onClick={closeMobileDrawer}
        >
          <div
            className="w-full bg-[#FAF8F5] rounded-t-3xl p-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[#D5CFC2] mx-auto mb-3" />

            {activeMobilePicker === "subject" ? (
              <MobileSearchablePickerView
                title="Subject"
                allLabel="All Subjects"
                value={resolvedSubjectValue}
                options={subjectOptions}
                emptyHint="Select a grade to view subjects"
                onSelect={(val) => {
                  handleSubjectChange(val);
                  setActiveMobilePicker(null);
                }}
                onBack={() => setActiveMobilePicker(null)}
                onClose={closeMobileDrawer}
              />
            ) : activeMobilePicker === "topic" ? (
              <MobileSearchablePickerView
                title="Topic"
                allLabel="All Topics"
                value={resolvedTopicValue}
                options={topicOptions}
                emptyHint="Select a subject to narrow topics"
                onSelect={(val) => {
                  onChange({ ...filters, topic: val });
                  setActiveMobilePicker(null);
                }}
                onBack={() => setActiveMobilePicker(null)}
                onClose={closeMobileDrawer}
              />
            ) : activeMobilePicker === "teacher" ? (
              <MobileSearchablePickerView
                title="Educator"
                allLabel="All Teachers"
                value={filters.teacher_id}
                options={teacherOptions}
                onSelect={(val) => {
                  onChange({ ...filters, teacher_id: val });
                  setActiveMobilePicker(null);
                }}
                onBack={() => setActiveMobilePicker(null)}
                onClose={closeMobileDrawer}
              />
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">
                    Filter Insights
                  </h2>
                  <button
                    type="button"
                    onClick={closeMobileDrawer}
                    aria-label="Close filters"
                    className="w-9 h-9 rounded-full bg-white border border-[#E5E1D8] flex items-center justify-center text-[#1A1A1A] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Grade Pill Selector */}
                {classOptions.length > 0 && (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-[#5C5A55] mb-2">
                      Grade / Class
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleClassChange("")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          !filters.class_level
                            ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                            : "bg-white text-[#1A1A1A] border-[#E5E1D8]"
                        }`}
                      >
                        All Grades
                      </button>
                      {classOptions.map((cl) => {
                        const active = filters.class_level === cl._id;
                        return (
                          <button
                            key={cl._id}
                            type="button"
                            onClick={() => handleClassChange(active ? "" : cl._id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                              active
                                ? "bg-[#A84C32] text-white border-[#A84C32]"
                                : "bg-white text-[#1A1A1A] border-[#E5E1D8]"
                            }`}
                          >
                            {cl.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Searchable Drill-Down Picker Rows */}
                <div className="space-y-2.5 text-sm">
                  {(
                    [
                      {
                        key: "subject" as const,
                        label: "Subject",
                        selectedName: subjectOptions.find((s) => s.value === resolvedSubjectValue)?.label,
                        defaultText: `All Subjects (${subjectOptions.length})`,
                        onReset: () => handleSubjectChange(""),
                      },
                      {
                        key: "topic" as const,
                        label: "Topic",
                        selectedName: topicOptions.find((t) => t.value === resolvedTopicValue)?.label,
                        defaultText: `All Topics (${topicOptions.length})`,
                        onReset: () => onChange({ ...filters, topic: "" }),
                      },
                      {
                        key: "teacher" as const,
                        label: "Educator",
                        selectedName: teacherOptions.find((t) => t.value === filters.teacher_id)?.label,
                        defaultText: `All Teachers (${teacherOptions.length})`,
                        onReset: () => onChange({ ...filters, teacher_id: "" }),
                      },
                    ] as const
                  ).map((row) => (
                    <div
                      key={row.key}
                      className={`w-full rounded-xl bg-white border flex items-center transition-colors ${
                        row.selectedName ? "border-[#A84C32]/50 bg-[#A84C32]/5" : "border-[#E5E1D8]"
                      }`}
                    >
                      <button
                        type="button"
                        data-testid={`mobile-picker-${row.key}`}
                        onClick={() => setActiveMobilePicker(row.key)}
                        className="flex-1 min-w-0 px-4 py-3 text-left flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C5A55]">
                            {row.label}
                          </div>
                          <div
                            className={`text-sm truncate mt-0.5 ${
                              row.selectedName ? "font-semibold text-[#A84C32]" : "text-[#1A1A1A]"
                            }`}
                          >
                            {row.selectedName || row.defaultText}
                          </div>
                        </div>
                        {!row.selectedName && (
                          <ChevronRight className="h-4 w-4 text-[#5C5A55] shrink-0" />
                        )}
                      </button>

                      {row.selectedName && (
                        <button
                          type="button"
                          onClick={row.onReset}
                          aria-label={`Clear ${row.label}`}
                          className="p-3 text-[#5C5A55] hover:text-[#A84C32] shrink-0 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClear();
                      closeMobileDrawer();
                    }}
                    className="flex-1 h-11 rounded-full border border-[#E5E1D8] bg-white text-xs font-semibold text-[#1A1A1A] cursor-pointer"
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    onClick={closeMobileDrawer}
                    className="flex-1 h-11 rounded-full bg-[#A84C32] text-xs font-semibold text-white cursor-pointer"
                  >
                    {loading
                      ? "Updating…"
                      : typeof totalCount === "number"
                      ? `Show ${totalCount} Insight${totalCount === 1 ? "" : "s"}`
                      : "Show Results"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
