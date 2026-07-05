import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Filter, BookOpen, Sparkles, TrendingUp,
  ChevronDown, Menu, SidebarClose, SidebarOpen, Loader2,
  ArrowRight, Zap, Globe, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ExploreSidebar from '../components/ExploreSidebar';
import BlogCard from '../components/BlogCard';
import { getFeatured, getBlogs } from '../api/explore';

// ─── Animated counter ──────────────────────────────────────────────────────────
function Counter({ from = 0, to, suffix = '' }) {
  const [val, setVal] = useState(from);
  useEffect(() => {
    let start = null;
    const duration = 1500;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(from + (to - from) * progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}

// ─── Hero section ──────────────────────────────────────────────────────────────
function HeroSection({ onSearch }) {
  const [input, setInput] = useState('');
  const [stats] = useState({ classes: 12, subjects: 60, blogs: 340 });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(input.trim());
  };

  return (
    <section className="relative overflow-hidden">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
        <div className="absolute -right-32 top-0 h-[400px] w-[400px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[300px] -translate-x-1/2 translate-y-1/2 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
      </div>

      <div className="relative px-6 py-16 md:py-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300">
            <Sparkles className="h-3.5 w-3.5" />
            Free Learning Platform · No Sign-in Required
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-3xl text-center text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Learn Anything,{' '}
          <span className="bg-gradient-to-r from-brand-300 via-violet-400 to-brand-400 bg-clip-text text-transparent">
            Anytime
          </span>
          <br className="hidden sm:block" /> at Your Own Pace
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-5 max-w-xl text-center text-base text-slate-400"
        >
          Explore thousands of teacher-crafted lessons. Filter by class, subject, or topic —
          all for free, no account needed.
        </motion.p>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-2xl gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search blogs… e.g. Photosynthesis, Algebra, History"
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-5 py-4 pl-12 text-sm text-slate-200 placeholder-slate-500 outline-none backdrop-blur-sm transition focus:border-brand-500/50 focus:bg-white/8"
            />
            {input && (
              <button type="button" onClick={() => { setInput(''); onSearch(''); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-500"
          >
            Search
          </motion.button>
        </motion.form>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4"
        >
          {[
            { icon: Globe, label: 'Classes', value: stats.classes, suffix: '+' },
            { icon: BookOpen, label: 'Subjects', value: stats.subjects, suffix: '+' },
            { icon: Zap, label: 'Blogs', value: stats.blogs, suffix: '+' },
          ].map(({ icon: Icon, label, value, suffix }) => (
            <div key={label} className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/4 py-4 backdrop-blur-sm">
              <Icon className="mb-1.5 h-4 w-4 text-brand-400" />
              <p className="text-xl font-black text-white">
                <Counter to={value} suffix={suffix} />
              </p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Featured / Recommended strip ─────────────────────────────────────────────
function FeaturedSection() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeatured().then(setBlogs).catch(() => setBlogs([])).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
    </div>
  );
  if (!blogs.length) return null;

  return (
    <section className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20">
            <Star className="h-4 w-4 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Recommended for You</h2>
        </div>
        <span className="text-xs text-slate-500">Latest published</span>
      </div>

      <div className="relative -mx-2">
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x snap-mandatory no-scrollbar">
          {blogs.map((blog, i) => (
            <motion.div
              key={blog._id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="w-72 flex-shrink-0 snap-start"
            >
              <BlogCard blog={blog} index={i} />
            </motion.div>
          ))}
        </div>
        {/* Fade gradient on right */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-slate-950 to-transparent" />
      </div>
    </section>
  );
}

// ─── Blog grid with infinite scroll ───────────────────────────────────────────
function BlogGrid({ filters, searchQuery }) {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const sentinelRef = useRef(null);

  // Reset when filters change
  useEffect(() => {
    setBlogs([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
  }, [filters.topicId, filters.classId, filters.subjectId, searchQuery]);

  const fetchPage = useCallback(
    async (pageNum) => {
      if (loading) return;
      setLoading(true);
      try {
        const params = {
          page: pageNum,
          limit: 12,
          ...(filters.topicId && { topicId: filters.topicId }),
          ...(filters.classId && !filters.topicId && !filters.subjectId && { classId: filters.classId }),
          ...(filters.subjectId && !filters.topicId && { subjectId: filters.subjectId }),
          ...(searchQuery && { search: searchQuery }),
        };
        const data = await getBlogs(params);
        setBlogs((prev) => {
          const combined = pageNum === 1 ? data.items : [...prev, ...data.items];
          const seen = new Set();
          return combined.filter((b) => {
            if (seen.has(b._id)) return false;
            seen.add(b._id);
            return true;
          });
        });
        setTotal(data.total);
        setHasMore(data.hasMore);
      } catch {
        setHasMore(false);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [filters, searchQuery]
  );

  // Trigger on page change
  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const filterLabel = filters.topicId
    ? 'topic'
    : filters.subjectId
    ? 'subject'
    : filters.classId
    ? 'class'
    : searchQuery
    ? `"${searchQuery}"`
    : 'all classes';

  if (initialLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-52 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Result header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-400" />
          <h2 className="text-base font-semibold text-slate-200">
            {searchQuery || filters.topicId || filters.classId || filters.subjectId
              ? `Results for ${filterLabel}`
              : 'All Blogs'}
          </h2>
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-slate-400">
            {total}
          </span>
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
            <BookOpen className="h-8 w-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No blogs found</p>
          <p className="text-sm text-slate-600">Try a different filter or search term</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog, i) => (
              <BlogCard key={blog._id} blog={blog} index={i} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="flex items-center justify-center py-8 mt-4">
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-sm text-slate-500"
              >
                <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                Loading more blogs…
              </motion.div>
            )}
            {!hasMore && blogs.length > 0 && (
              <p className="text-xs text-slate-600">You've reached the end · {total} blogs total</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main StudentPortal Page ───────────────────────────────────────────────────
export default function StudentPortal() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({ classId: null, subjectId: null, topicId: null });
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [activeClassId, setActiveClassId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHero, setShowHero] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', title: '' });

  const showNotification = (title, message) => {
    setToast({ show: true, title, message });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((t) => ({ ...t, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const handleTopicSelect = (topic) => {
    setActiveTopicId(topic._id);
    setFilters({ topicId: topic._id, subjectId: null, classId: null });
    setSearchQuery('');
    setShowHero(false);
    setMobileSidebarOpen(false);
  };

  const handleClassSelect = (cls) => {
    setActiveClassId(cls._id);
    setActiveTopicId(null);
    setFilters({ classId: cls._id, subjectId: null, topicId: null });
    setSearchQuery('');
    setShowHero(false);
    setMobileSidebarOpen(false);
  };

  const handleClearFilter = () => {
    setActiveTopicId(null);
    setActiveClassId(null);
    setFilters({ classId: null, subjectId: null, topicId: null });
    setSearchQuery('');
    setShowHero(true);
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
    setFilters({ classId: null, subjectId: null, topicId: null });
    setActiveTopicId(null);
    setActiveClassId(null);
    if (q) setShowHero(false);
    else setShowHero(true);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: '#080a17' }}>
      {/* ─── Top Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#080a17]/80 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          {/* Sidebar toggle (desktop) */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSidebarOpen((o) => !o)}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-slate-200 transition"
          >
            {sidebarOpen ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
          </motion.button>

          {/* Mobile menu */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileSidebarOpen(true)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/8"
          >
            <Menu className="h-4 w-4" />
          </motion.button>

          {/* Logo */}
          <Link to="/explore" onClick={handleClearFilter} className="flex items-center gap-2 mr-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-600">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-100">Osarthi</span>
            <span className="hidden rounded-full bg-brand-500/15 px-2 py-0.5 text-xs text-brand-400 sm:block">Student Portal</span>
          </Link>

          {/* Breadcrumb */}
          {!showHero && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500"
            >
              <button onClick={handleClearFilter} className="hover:text-brand-400 transition">All Blogs</button>
              {searchQuery && (
                <>
                  <ChevronDown className="h-3 w-3 rotate-[-90deg]" />
                  <span className="text-slate-300">"{searchQuery}"</span>
                </>
              )}
            </motion.div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => showNotification(
                'Coming Soon!',
                'Teacher registration & portal access is currently restricted. To register as a teacher, please contact the administrator.'
              )}
              className="hidden sm:flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-400 hover:bg-white/8 transition cursor-pointer"
            >
              Teacher Login
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Desktop Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="hidden md:block flex-shrink-0 overflow-hidden border-r border-white/8 h-full"
              style={{ position: 'sticky', top: 0 }}
            >
              <ExploreSidebar
                onTopicSelect={handleTopicSelect}
                onClassSelect={handleClassSelect}
                activeTopicId={activeTopicId}
                activeClassId={activeClassId}
                onClearFilter={handleClearFilter}
                className="h-full w-[280px]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              />
              <motion.div
                key="mobile-sidebar"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-[300px] md:hidden"
              >
                <ExploreSidebar
                  onTopicSelect={handleTopicSelect}
                  onClassSelect={handleClassSelect}
                  activeTopicId={activeTopicId}
                  activeClassId={activeClassId}
                  onClearFilter={handleClearFilter}
                  className="h-full w-full"
                />
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            {showHero && (
              <motion.div
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <HeroSection onSearch={handleSearch} />
                <FeaturedSection />
                <div className="border-t border-white/8 px-6 pt-8 pb-16">
                  <BlogGrid filters={filters} searchQuery={searchQuery} />
                </div>
              </motion.div>
            )}

            {!showHero && (
              <motion.div
                key="filtered"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="px-6 py-8 pb-16"
              >
                <BlogGrid filters={filters} searchQuery={searchQuery} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 z-[100] max-w-sm rounded-2xl border border-brand-500/30 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{toast.title}</p>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast((t) => ({ ...t, show: false }))}
                className="text-slate-500 hover:text-slate-300 cursor-pointer self-start"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
