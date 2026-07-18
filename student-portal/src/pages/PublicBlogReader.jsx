import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  ArrowLeft, BookOpen, Clock, Tag, ChevronRight,
  Share2, Copy, Check, Loader2, AlertCircle,
  GraduationCap, Layers, FileText
} from 'lucide-react';
import { getBlog, getBlogs } from '../api/explore';
import { renderMarkedText } from '../utils/renderMarks';
import { mediaUrl } from '../utils/mediaUrl';
import BlogCard from '../components/BlogCard';

// ─── Reading progress bar ──────────────────────────────────────────────────────
function ProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 z-[60] h-0.5 bg-gradient-to-r from-brand-400 to-violet-500"
    />
  );
}

// ─── Content block renderer ────────────────────────────────────────────────────
function BlockRenderer({ block }) {
  switch (block.type) {
    case 'heading':
      return block.level === 1 ? (
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white leading-tight">{block.text}</h2>
      ) : (
        <h3 className="mt-8 mb-3 text-xl font-semibold text-slate-100 leading-tight">{block.text}</h3>
      );

    case 'paragraph':
      return (
        <p className="mb-5 leading-8 text-slate-300 text-base" style={{ whiteSpace: 'pre-wrap' }}>
          {renderMarkedText(block.text, block.marks)}
        </p>
      );

    case 'quote':
      return (
        <blockquote className="my-8 relative pl-6 border-l-4 border-brand-500">
          <div className="absolute -left-1 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-brand-400 to-violet-500" />
          <p className="text-lg italic text-slate-200 leading-relaxed">{block.text}</p>
        </blockquote>
      );

    case 'list':
      return block.ordered ? (
        <ol className="mb-5 list-decimal pl-6 space-y-2">
          {block.items?.map((item, i) => (
            <li key={i} className="text-slate-300 leading-relaxed pl-1">{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="mb-5 pl-6 space-y-2">
          {block.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-300 leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-400" />
              {item}
            </li>
          ))}
        </ul>
      );

    case 'divider':
      return (
        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-1 w-1 rounded-full bg-slate-600" />
            ))}
          </div>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      );

    case 'image':
      return block.url ? (
        <figure className="my-8">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img
              src={mediaUrl(block.url)}
              alt={block.caption || 'Image'}
              className="w-full object-cover max-h-[500px] transition-transform duration-700 hover:scale-105"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-3 text-center text-sm text-slate-500 italic">
              {block.caption}
            </figcaption>
          )}
        </figure>
      ) : null;

    case 'video':
      return block.url ? (
        <div className="my-8 overflow-hidden rounded-2xl border border-white/10">
          <video src={mediaUrl(block.url)} controls className="w-full" />
        </div>
      ) : null;

    default:
      return null;
  }
}

// ─── Table of contents ─────────────────────────────────────────────────────────
function TableOfContents({ blocks }) {
  const headings = blocks?.filter((b) => b.type === 'heading') || [];
  if (headings.length < 2) return null;

  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/4 p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <FileText className="h-4 w-4 text-brand-400" />
        Contents
      </h3>
      <ul className="space-y-1.5">
        {headings.map((h, i) => (
          <li key={i} className={`flex items-center gap-2 text-sm ${h.level === 2 ? 'pl-4' : ''}`}>
            <ChevronRight className="h-3 w-3 flex-shrink-0 text-slate-600" />
            <span className="text-slate-400 hover:text-slate-200 cursor-pointer transition">{h.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Share button ──────────────────────────────────────────────────────────────
function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 transition hover:border-brand-500/30 hover:text-brand-300"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Share
        </>
      )}
    </button>
  );
}

// ─── Main BlogReader ───────────────────────────────────────────────────────────
export default function PublicBlogReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readTime, setReadTime] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0);
    getBlog(id)
      .then((data) => {
        setBlog(data);
        // Estimate read time (avg 200 words/min)
        const wordCount = data.blocks?.reduce((acc, b) => {
          return acc + (b.text?.split(/\s+/).length || 0) + (b.items?.join(' ').split(/\s+/).length || 0);
        }, 0) || 0;
        setReadTime(Math.max(1, Math.ceil(wordCount / 200)));
      })
      .catch(() => setError('Blog not found or not available.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Update document title and meta description for blog-specific SEO
  useEffect(() => {
    if (!blog) return;
    const siteName = 'Medhashine';
    document.title = `${blog.title} | ${siteName}`;

    const firstParagraph = blog.blocks?.find((b) => b.type === 'paragraph' && b.text?.trim());
    const rawDesc = firstParagraph?.text?.replace(/\s+/g, ' ').trim() || blog.title;
    const blogDesc = rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : rawDesc;

    const setMeta = (name, content, prop = false) => {
      const attr = prop ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    setMeta('description', blogDesc);
    setMeta('og:title', `${blog.title} | ${siteName}`, true);
    setMeta('og:description', blogDesc, true);
    setMeta('twitter:title', `${blog.title} | ${siteName}`);
    setMeta('twitter:description', blogDesc);

    return () => {
      document.title = `${siteName} — Learn. Teach. Excel.`;
    };
  }, [blog]);

  // Fetch related blogs
  useEffect(() => {
    if (!blog) return;
    getBlogs({
      topicId: blog.topicRef?._id,
      limit: 3,
      page: 1,
    }).then((data) => {
      setRelated(data.items?.filter((b) => b._id !== id).slice(0, 3) || []);
    }).catch(() => {});
  }, [blog, id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#080a17' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
          <p className="text-slate-500 text-sm">Loading blog…</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6" style={{ background: '#080a17' }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
          <AlertCircle className="h-8 w-8 text-rose-400" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-200">Blog Not Found</h1>
          <p className="mt-2 text-sm text-slate-500">{error || 'This blog may not be published yet.'}</p>
        </div>
        <Link
          to="/explore"
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-500 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Explore
        </Link>
      </div>
    );
  }

  const className = blog.classRef?.name;
  const subject = blog.subjectRef?.name;
  const topic = blog.topicRef?.name;
  const author = blog.createdBy?.name || 'Teacher';

  return (
    <div className="min-h-screen" style={{ background: '#080a17' }}>
      <ProgressBar />

      {/* ─── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#080a17]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:block">Back</span>
          </button>

          <div className="flex-1 flex items-center gap-1.5 text-xs text-slate-600 overflow-hidden">
            <Link to="/explore" className="flex-shrink-0 hover:text-brand-400 transition">Explore</Link>
            {className && (
              <>
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                <span className="flex-shrink-0 truncate">{className}</span>
              </>
            )}
            {subject && (
              <>
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                <span className="flex-shrink-0 truncate">{subject}</span>
              </>
            )}
            {topic && (
              <>
                <ChevronRight className="h-3 w-3 flex-shrink-0" />
                <span className="text-slate-400 truncate">{topic}</span>
              </>
            )}
          </div>

          <ShareButton />
        </div>
      </header>

      {/* ─── Content ── */}
      <div className="mx-auto max-w-7xl px-4 py-10 lg:flex lg:gap-10">
        {/* Main article */}
        <article className="min-w-0 flex-1">
          {/* Article header */}
          <header className="mb-10">
            {/* Breadcrumb tags */}
            <div className="mb-5 flex flex-wrap gap-2">
              {className && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                  <GraduationCap className="h-3 w-3" />
                  {className}
                </span>
              )}
              {subject && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                  <Layers className="h-3 w-3" />
                  {subject}
                </span>
              )}
              {topic && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300">
                  <Tag className="h-3 w-3" />
                  {topic}
                </span>
              )}
            </div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl"
            >
              {blog.title}
            </motion.h1>

            {/* Meta */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-5 flex flex-wrap items-center gap-4 text-sm text-slate-500"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-500/30 to-violet-500/30 text-xs font-bold text-brand-300">
                  {author.charAt(0).toUpperCase()}
                </div>
                <span>{author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {readTime} min read
              </div>
              <span>
                {new Date(blog.updatedAt || blog.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </span>
            </motion.div>

            <div className="mt-6 h-px bg-gradient-to-r from-brand-500/20 via-violet-500/20 to-transparent" />
          </header>

          {/* Table of contents */}
          <TableOfContents blocks={blog.blocks} />

          {/* Blocks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="prose-custom"
          >
            {blog.blocks?.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </motion.div>

          {/* End divider */}
          <div className="mt-16 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/8" />
            <BookOpen className="h-5 w-5 text-slate-600" />
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <p className="mt-4 text-center text-xs text-slate-600">End of lesson · Happy learning! 🎓</p>
        </article>

        {/* ─── Related blogs sidebar ── */}
        {related.length > 0 && (
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
                <BookOpen className="h-4 w-4 text-brand-400" />
                More from this topic
              </h3>
              <div className="space-y-4">
                {related.map((b, i) => (
                  <BlogCard key={b._id} blog={b} index={i} />
                ))}
              </div>
              <Link
                to="/explore"
                className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 py-3 text-sm text-slate-400 transition hover:border-brand-500/30 hover:text-brand-300"
              >
                Browse all blogs
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        )}
      </div>

      {/* Mobile: Related blogs */}
      {related.length > 0 && (
        <section className="lg:hidden border-t border-white/8 px-4 py-8">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <BookOpen className="h-4 w-4 text-brand-400" />
            More from this topic
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {related.map((b, i) => (
              <BlogCard key={b._id} blog={b} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
