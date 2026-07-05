import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight, Tag } from 'lucide-react';

// Gradient palette for cards
const gradients = [
  'from-violet-900/40 via-purple-900/20 to-transparent border-violet-500/20',
  'from-blue-900/40 via-cyan-900/20 to-transparent border-blue-500/20',
  'from-emerald-900/40 via-teal-900/20 to-transparent border-emerald-500/20',
  'from-orange-900/40 via-amber-900/20 to-transparent border-orange-500/20',
  'from-rose-900/40 via-pink-900/20 to-transparent border-rose-500/20',
  'from-indigo-900/40 via-blue-900/20 to-transparent border-indigo-500/20',
];

const tagColors = [
  'bg-violet-500/15 text-violet-300 border-violet-500/20',
  'bg-blue-500/15 text-blue-300 border-blue-500/20',
  'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  'bg-orange-500/15 text-orange-300 border-orange-500/20',
  'bg-rose-500/15 text-rose-300 border-rose-500/20',
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function BlogCard({ blog, index = 0, featured = false }) {
  const gradient = gradients[index % gradients.length];
  const tagColor = tagColors[index % tagColors.length];
  const className = blog.classRef?.name || '';
  const subject = blog.subjectRef?.name || '';
  const topic = blog.topicRef?.name || '';
  const author = blog.createdBy?.name || 'Teacher';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`group relative ${featured ? 'col-span-2 row-span-2 sm:col-span-1 sm:row-span-1' : ''}`}
    >
      <Link to={`/explore/blog/${blog._id}`} className="block h-full">
        <div
          className={`relative flex h-full min-h-[200px] flex-col rounded-2xl border bg-gradient-to-br p-5 ${gradient} transition-all duration-300 group-hover:border-opacity-60`}
        >
          {/* Glow effect */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)',
            }}
          />

          {/* Tags row */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {className && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tagColor}`}>
                <Tag className="h-3 w-3" />
                {className}
              </span>
            )}
            {subject && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-400">
                {subject}
              </span>
            )}
            {topic && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-500">
                {topic}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`mb-3 flex-1 font-bold leading-snug text-slate-100 transition-colors group-hover:text-white ${
            featured ? 'text-xl' : 'text-base'
          }`}>
            {blog.title}
          </h3>

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-slate-400">
                {author.charAt(0).toUpperCase()}
              </div>
              <span>{author}</span>
              <span>·</span>
              <Clock className="h-3 w-3" />
              <span>{timeAgo(blog.createdAt)}</span>
            </div>

            <motion.div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-slate-500 transition-all group-hover:bg-brand-500/20 group-hover:text-brand-400"
              whileHover={{ rotate: -45 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.div>
          </div>

          {/* BookOpen icon decorative */}
          <div className="pointer-events-none absolute bottom-4 right-4 opacity-[0.04] transition-opacity group-hover:opacity-[0.07]">
            <BookOpen className="h-20 w-20" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
