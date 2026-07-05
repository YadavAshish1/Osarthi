import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, BookOpen, Layers, FlaskConical, Microscope,
  Calculator, Globe, Palette, Music, Search, X, GraduationCap,
  Loader2, SlidersHorizontal
} from 'lucide-react';
import { getTree } from '../api/explore';

// Map subject names to icons
const subjectIcons = {
  math: Calculator, mathematics: Calculator, maths: Calculator,
  science: FlaskConical, physics: Microscope, chemistry: FlaskConical,
  biology: Microscope, english: BookOpen, hindi: BookOpen,
  history: Globe, geography: Globe, social: Globe, sst: Globe,
  art: Palette, music: Music, default: BookOpen,
};

function getSubjectIcon(name) {
  const key = name?.toLowerCase().split(' ')[0];
  return subjectIcons[key] || subjectIcons.default;
}

// Class color palette
const classColors = [
  'from-violet-500/20 to-purple-600/20 border-violet-500/30',
  'from-blue-500/20 to-cyan-600/20 border-blue-500/30',
  'from-emerald-500/20 to-teal-600/20 border-emerald-500/30',
  'from-orange-500/20 to-amber-600/20 border-orange-500/30',
  'from-rose-500/20 to-pink-600/20 border-rose-500/30',
  'from-indigo-500/20 to-blue-600/20 border-indigo-500/30',
];

const classAccents = [
  'text-violet-400', 'text-blue-400', 'text-emerald-400',
  'text-orange-400', 'text-rose-400', 'text-indigo-400',
];

function TopicItem({ topic, active, onClick }) {
  return (
    <motion.button
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(topic)}
      className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
        active
          ? 'bg-brand-500/20 text-brand-300 font-medium'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors ${
        active ? 'bg-brand-400' : 'bg-slate-600 group-hover:bg-slate-400'
      }`} />
      <span className="truncate">{topic.name}</span>
    </motion.button>
  );
}

function SubjectItem({ subject, classAccent, activeTopicId, onTopicClick }) {
  const [open, setOpen] = useState(false);
  const Icon = getSubjectIcon(subject.name);
  const hasActive = subject.topics?.some((t) => t._id === activeTopicId);

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  return (
    <div>
      <motion.button
        whileHover={{ x: 2 }}
        onClick={() => setOpen((o) => !o)}
        className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
          hasActive ? 'bg-white/8 text-slate-100' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`}
      >
        <Icon className={`h-4 w-4 flex-shrink-0 ${classAccent}`} />
        <span className="flex-1 truncate font-medium">{subject.name}</span>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && subject.topics?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
              {subject.topics.map((topic) => (
                <TopicItem
                  key={topic._id}
                  topic={topic}
                  active={activeTopicId === topic._id}
                  onClick={onTopicClick}
                />
              ))}
            </div>
          </motion.div>
        )}
        {open && (!subject.topics || subject.topics.length === 0) && (
          <p className="ml-8 mt-1 text-xs text-slate-600 pb-1">No topics yet</p>
        )}
      </AnimatePresence>
    </div>
  );
}

function ClassSection({ cls, index, activeTopicId, activeClassId, onTopicClick, onClassClick }) {
  const [open, setOpen] = useState(false);
  const color = classColors[index % classColors.length];
  const accent = classAccents[index % classAccents.length];
  const isActive = activeClassId === cls._id;
  const hasActiveTopic = cls.subjects?.some((s) =>
    s.topics?.some((t) => t._id === activeTopicId)
  );

  useEffect(() => {
    if (hasActiveTopic) setOpen(true);
  }, [hasActiveTopic]);

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${color} ${isActive || hasActiveTopic ? 'border-opacity-60' : 'border-opacity-20'} overflow-hidden`}>
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          setOpen((o) => !o);
          onClassClick(cls);
        }}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold ${accent}`}>
          {cls.name.replace(/[^0-9]/g, '') || cls.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">{cls.name}</p>
          <p className="text-xs text-slate-500">{cls.subjects?.length || 0} subjects</p>
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-3 py-2 space-y-1">
              {cls.subjects?.length > 0 ? (
                cls.subjects.map((subject) => (
                  <SubjectItem
                    key={subject._id}
                    subject={subject}
                    classAccent={accent}
                    activeTopicId={activeTopicId}
                    onTopicClick={onTopicClick}
                  />
                ))
              ) : (
                <p className="py-2 text-center text-xs text-slate-600">No subjects yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExploreSidebar({
  onTopicSelect,
  onClassSelect,
  activeTopicId,
  activeClassId,
  onClearFilter,
  className = '',
}) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    getTree()
      .then(setTree)
      .catch(() => setTree([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? tree
        .map((cls) => ({
          ...cls,
          subjects: cls.subjects
            .map((s) => ({
              ...s,
              topics: s.topics.filter((t) =>
                t.name.toLowerCase().includes(search.toLowerCase())
              ),
            }))
            .filter(
              (s) =>
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.topics.length > 0
            ),
        }))
        .filter(
          (cls) =>
            cls.name.toLowerCase().includes(search.toLowerCase()) ||
            cls.subjects.length > 0
        )
    : tree;

  return (
    <aside
      className={`flex h-full flex-col ${className}`}
      style={{ background: 'rgba(10,12,24,0.85)', backdropFilter: 'blur(20px)' }}
    >
      {/* Header */}
      <div className="border-b border-white/8 px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/20">
            <GraduationCap className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Browse Lessons</h2>
            <p className="text-xs text-slate-500">Class → Subject → Topic</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics…"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-brand-500/50 focus:bg-white/8"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active filter badge */}
      {(activeTopicId || activeClassId) && (
        <div className="border-b border-white/8 px-4 py-3">
          <button
            onClick={onClearFilter}
            className="flex w-full items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-300 transition hover:bg-brand-500/20"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Filter active — click to clear</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Tree */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
            <p className="text-xs text-slate-500">Loading curriculum…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Layers className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">No results found</p>
          </div>
        ) : (
          filtered.map((cls, i) => (
            <ClassSection
              key={cls._id}
              cls={cls}
              index={i}
              activeTopicId={activeTopicId}
              activeClassId={activeClassId}
              onTopicClick={onTopicSelect}
              onClassClick={onClassSelect}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/8 px-4 py-3">
        <p className="text-center text-xs text-slate-600">
          {tree.length} Classes · {tree.reduce((a, c) => a + c.subjects.length, 0)} Subjects
        </p>
      </div>
    </aside>
  );
}
