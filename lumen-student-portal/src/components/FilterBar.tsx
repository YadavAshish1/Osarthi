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

export default function FilterBar({ tree = [], teachers = [], filters, onChange, onClear }: FilterBarProps) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  // All class options (always show all)
  const classOptions = useMemo(() => {
    const seen = new Set<string>();
    return tree.filter((c) => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [tree]);

  // Subject options — filtered by selected class if any
  const subjectOptions = useMemo(() => {
    const sources = filters.class_level
      ? tree.filter((c) => c._id === filters.class_level)
      : tree;

    const seen = new Set<string>();
    const result: { _id: string; name: string }[] = [];
    for (const cls of sources) {
      for (const sub of cls.subjects || []) {
        if (!seen.has(sub._id)) {
          seen.add(sub._id);
          result.push(sub);
        }
      }
    }
    return result;
  }, [tree, filters.class_level]);

  // Topic options — filtered by selected subject if any, else by selected class
  const topicOptions = useMemo(() => {
    let subjects: { _id: string; name: string; topics?: { _id: string; name: string }[] }[] = [];

    if (filters.subject) {
      // Only topics under the selected subject
      for (const cls of tree) {
        for (const sub of cls.subjects || []) {
          if (sub._id === filters.subject) {
            subjects.push(sub);
          }
        }
      }
    } else if (filters.class_level) {
      // All topics under the selected class
      const clsNode = tree.find((c) => c._id === filters.class_level);
      subjects = clsNode?.subjects || [];
    } else {
      // All topics across all classes
      for (const cls of tree) {
        subjects = subjects.concat(cls.subjects || []);
      }
    }

    const seen = new Set<string>();
    const result: { _id: string; name: string }[] = [];
    for (const sub of subjects) {
      for (const topic of sub.topics || []) {
        if (!seen.has(topic._id)) {
          seen.add(topic._id);
          result.push(topic);
        }
      }
    }
    return result;
  }, [tree, filters.class_level, filters.subject]);

  // When class changes: reset subject and topic if they're no longer valid
  const handleClassChange = (classId: string) => {
    const newFilters = { ...filters, class_level: classId };

    if (classId) {
      const cls = tree.find((c) => c._id === classId);
      const validSubjects = new Set((cls?.subjects || []).map((s) => s._id));
      if (newFilters.subject && !validSubjects.has(newFilters.subject)) {
        newFilters.subject = "";
        newFilters.topic = "";
      } else if (newFilters.topic) {
        const sub = (cls?.subjects || []).find((s) => s._id === newFilters.subject);
        const validTopics = new Set((sub?.topics || []).map((t) => t._id));
        if (!validTopics.has(newFilters.topic)) {
          newFilters.topic = "";
        }
      }
    }

    onChange(newFilters);
  };

  // When subject changes: reset topic if it's no longer valid
  const handleSubjectChange = (subjectId: string) => {
    const newFilters = { ...filters, subject: subjectId };

    if (subjectId && newFilters.topic) {
      let validTopics = new Set<string>();
      for (const cls of tree) {
        for (const sub of cls.subjects || []) {
          if (sub._id === subjectId) {
            for (const t of sub.topics || []) {
              validTopics.add(t._id);
            }
          }
        }
      }
      if (!validTopics.has(newFilters.topic)) {
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
          <option key={s._id} value={s._id}>
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
          <option key={tp._id} value={tp._id}>
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
