import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TaxonomySelector from '../components/TaxonomySelector';
import ContentReader from '../components/ContentReader';
import { api } from '../api/client';
import { Bell, History } from 'lucide-react';

export default function StudentDashboard() {
  const [selection, setSelection] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    api.get('/quiz/student/live').then((r) => setQuizzes(r.data));
  }, []);

  useEffect(() => {
    if (showHistory && selection?.subjectId) {
      api.get(`/quiz/student/by-subject/${selection.subjectId}`).then((r) => setHistory(r.data));
    }
  }, [showHistory, selection?.subjectId]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-slate-400">Browse lessons and take live quizzes for your class.</p>
        </div>
        <Link to="/student/notifications" className="flex items-center gap-2 rounded-full glass px-4 py-2 text-sm hover:border-brand-500/30">
          <Bell className="h-4 w-4" /> Notifications
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Live quizzes</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quizzes.map((q) => (
            <Link key={q._id} to={`/student/quiz/${q._id}`} className="glass rounded-xl p-4 hover:border-brand-500/40 transition block">
              <p className="font-medium">{q.title}</p>
              <p className="text-sm text-slate-400 mt-1">
                {q.subjectRef?.name} · Published {q.publishedAt ? new Date(q.publishedAt).toLocaleString() : '—'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {q.expiresAt ? `Expires ${new Date(q.expiresAt).toLocaleString()}` : 'No expiry'} · {q.timeLimitMinutes} min
              </p>
            </Link>
          ))}
          {!quizzes.length && <p className="text-slate-500 text-sm">No live quizzes right now.</p>}
        </div>
      </section>

      <TaxonomySelector onSelect={setSelection} />

      {selection?.subjectId && (
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="mt-6 flex items-center gap-2 text-sm text-brand-400 hover:underline"
        >
          <History className="h-4 w-4" /> {showHistory ? 'Hide' : 'View'} quiz history for this subject
        </button>
      )}

      {showHistory && (
        <div className="mt-4 space-y-3">
          {history.map(({ quiz, attempted, attempt }) => (
            <div key={quiz._id} className="glass rounded-xl p-4">
              <p className="font-medium">{quiz.title}</p>
              <p className="text-xs text-slate-500">{quiz.subject?.name} · {new Date(quiz.createdAt).toLocaleString()}</p>
              {attempted ? (
                <div className="mt-2 text-sm">
                  <p className="text-green-400">Score: {attempt.score}/{attempt.totalQuestions} ({attempt.percentage}%)</p>
                  {attempt.suggestions?.length > 0 && (
                    <ul className="mt-2 text-slate-400 list-disc pl-4">
                      {attempt.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                  <Link to={`/student/result/${attempt._id}`} className="text-brand-400 text-xs mt-1 inline-block">View details →</Link>
                </div>
              ) : (
                <Link to={`/student/quiz/${quiz._id}`} className="text-brand-400 text-sm mt-2 inline-block">Take quiz →</Link>
              )}
            </div>
          ))}
        </div>
      )}

      {selection?.topicId && (
        <div className="mt-10">
          <ContentReader topicId={selection.topicId} subjectId={selection.subjectId} />
        </div>
      )}
    </div>
  );
}
