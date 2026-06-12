import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { renderMarkedText } from '../utils/renderMarks';
import { mediaUrl } from '../utils/mediaUrl';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ClipboardList } from 'lucide-react';

function ArticleBody({ content }) {
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold">{content.title}</h1>
      <p className="mb-8 text-sm text-slate-500">
        {new Date(content.updatedAt || content.createdAt).toLocaleString()}
      </p>
      <div className="prose prose-invert max-w-none space-y-6">
        {content.blocks?.map((block) => (
          <div key={block.id}>
            {block.type === 'heading' && (
              <h2 className={block.level === 1 ? 'text-2xl font-bold' : 'text-xl font-semibold'}>{block.text}</h2>
            )}
            {block.type === 'paragraph' && (
              <p className="leading-relaxed text-slate-200" style={{ whiteSpace: 'pre-wrap' }}>{renderMarkedText(block.text, block.marks)}</p>
            )}
            {block.type === 'quote' && (
              <blockquote className="border-l-4 border-brand-500 pl-4 italic text-slate-300">{block.text}</blockquote>
            )}
            {block.type === 'list' && (
              <ul className="list-disc pl-6 space-y-1">
                {block.items?.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
            {block.type === 'divider' && <hr className="border-white/20" />}
            {block.type === 'part' && <div className="py-2 text-center text-3xl font-bold tracking-[0.5em] text-slate-400">· · ·</div>}
            {block.type === 'image' && block.url && (
              <figure>
                <img src={mediaUrl(block.url)} alt={block.caption} className="max-h-96 w-full rounded-xl object-cover" />
                {block.caption && <figcaption className="mt-2 text-center text-sm text-slate-500">{block.caption}</figcaption>}
              </figure>
            )}
            {block.type === 'video' && block.url && (
              <video src={mediaUrl(block.url)} controls className="w-full rounded-xl" />
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default function ContentReader({ topicId, subjectId }) {
  const [posts, setPosts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [content, setContent] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    setSelectedId(null);
    setContent(null);
    api
      .get(`/content/topic/${topicId}`)
      .then((r) => setPosts(r.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [topicId]);

  useEffect(() => {
    if (!selectedId) {
      setContent(null);
      return;
    }
    api.get(`/content/${selectedId}`).then((r) => setContent(r.data));
  }, [selectedId]);

  useEffect(() => {
    if (!subjectId) return;
    api.get('/quiz/student/live').then((r) => {
      const related = r.data.filter(
        (q) => !q.topicRef || q.topicRef?.toString() === topicId
      );
      setQuizzes(related);
    });
  }, [subjectId, topicId]);

  if (loading) {
    return <p className="text-slate-400">Loading lessons…</p>;
  }

  if (!posts.length) {
    return <p className="text-slate-400">No published content for this topic yet.</p>;
  }

  if (!selectedId) {
    return (
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="h-5 w-5 text-brand-400" /> Lessons in this topic
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map((post) => (
            <button
              key={post._id}
              type="button"
              onClick={() => setSelectedId(post._id)}
              className="glass rounded-xl p-5 text-left transition hover:border-brand-500/40"
            >
              <p className="font-medium">{post.title}</p>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(post.updatedAt || post.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!content) {
    return <p className="text-slate-400">Loading…</p>;
  }

  return (
    <article className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => setSelectedId(null)}
        className="mb-6 flex items-center gap-1 text-sm text-brand-400 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> All lessons
      </button>

      <ArticleBody content={content} />

      {quizzes.length > 0 && (
        <section className="mt-16 rounded-2xl border border-brand-500/30 bg-brand-950/30 p-8">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <ClipboardList className="h-6 w-6 text-brand-400" /> Quizzes for this topic
          </h2>
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <Link
                key={quiz._id}
                to={`/student/quiz/${quiz._id}`}
                className="block rounded-xl glass p-4 transition hover:border-brand-500/50"
              >
                <p className="font-medium">{quiz.title}</p>
                <p className="text-sm text-slate-400">
                  {quiz.subjectRef?.name} · {quiz.timeLimitMinutes} min
                  {quiz.expiresAt ? ` · Expires ${new Date(quiz.expiresAt).toLocaleString()}` : ' · No expiry'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
