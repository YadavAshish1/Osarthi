"use client";

import React, { useMemo } from "react";
import { X } from "lucide-react";

export interface FilterState {
  teacher_id: string;
  class_level: string;
  subject: string;
  topic: string;
}

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
}

export default function FilterBar({
  tree = [],
  teachers = [],
  filters,
  onChange,
  onClear,
}: FilterBarProps) {
  const activeCount = Object.values(filters).filter(Boolean).length;

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
  const subjectOptions = useMemo(() => {
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
      name: item.name,
    }));
  }, [tree, filters.class_level]);

  // Topic options — filtered by selected subject if any, else by selected class, deduplicated by name
  const topicOptions = useMemo(() => {
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
      name: item.name,
    }));
  }, [tree, filters.class_level, filters.subject]);

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

  return (
    <div data-testid="filter-bar" className="flex flex-wrap items-center gap-3 font-ui text-sm">
      {/* Teacher Filter */}
      <select
        data-testid="filter-teacher"
        value={filters.teacher_id}
        onChange={(e) => onChange({ ...filters, teacher_id: e.target.value })}
        className="h-10 px-4 rounded-full bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] focus:outline-none focus:border-[#A84C32] transition-colors cursor-pointer"
      >
        <option value="">All Teachers</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Class Level Filter */}
      <select
        data-testid="filter-class"
        value={filters.class_level}
        onChange={(e) => handleClassChange(e.target.value)}
        className="h-10 px-4 rounded-full bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] focus:outline-none focus:border-[#A84C32] transition-colors cursor-pointer"
      >
        <option value="">All Grades</option>
        {classOptions.map((cl) => (
          <option key={cl._id} value={cl._id}>
            {cl.name}
          </option>
        ))}
      </select>

      {/* Subject Filter */}
      <select
        data-testid="filter-subject"
        value={filters.subject}
        onChange={(e) => handleSubjectChange(e.target.value)}
        className="h-10 px-4 rounded-full bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] focus:outline-none focus:border-[#A84C32] transition-colors cursor-pointer"
      >
        <option value="">All Subjects</option>
        {subjectOptions.map((s) => (
          <option key={s.value} value={s.value}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Topic Filter */}
      <select
        data-testid="filter-topic"
        value={filters.topic}
        onChange={(e) => onChange({ ...filters, topic: e.target.value })}
        className="h-10 px-4 rounded-full bg-white border border-[#E5E1D8] text-[#1A1A1A] hover:border-[#A84C32] focus:outline-none focus:border-[#A84C32] transition-colors cursor-pointer"
      >
        <option value="">All Topics</option>
        {topicOptions.map((tp) => (
          <option key={tp.value} value={tp.value}>
            {tp.name}
          </option>
        ))}
      </select>

      {activeCount > 0 && (
        <button
          onClick={onClear}
          data-testid="clear-filters"
          className="flex items-center gap-1.5 px-4 h-10 rounded-full text-xs font-medium text-[#A84C32] bg-[#A84C32]/10 hover:bg-[#A84C32]/20 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
          Clear filters ({activeCount})
        </button>
      )}
    </div>
  );
}
