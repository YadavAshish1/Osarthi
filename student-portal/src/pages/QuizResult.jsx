import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { CheckCircle, XCircle } from 'lucide-react';

export default function QuizResult() {
  const { id } = useParams();
  const location = useLocation();
  const [data, setData] = useState(location.state?.result || null);

  useEffect(() => {
    if (!data && id) {
      api.get(`/quiz/attempt/${id}`).then((r) => setData({ attempt: r.data.attempt, details: r.data.details, quiz: r.data.quiz }));
    }
  }, [id, data]);

  if (!data) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;
  }

  const { attempt, details, quiz } = data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Quiz Results</h1>
      <p className="text-slate-400 mb-8">{quiz?.title}</p>

      <div className="glass rounded-2xl p-8 text-center mb-10">
        <p className="text-5xl font-extrabold gradient-text">{attempt.percentage}%</p>
        <p className="mt-2 text-slate-400">
          {attempt.score} of {attempt.totalQuestions} correct · {Math.floor(attempt.timeTakenSeconds / 60)}m {attempt.timeTakenSeconds % 60}s
        </p>
      </div>

      <div className="space-y-4">
        {details?.map((d, i) => (
          <div key={d.questionId} className={`rounded-xl border p-5 ${d.isCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
            <div className="flex items-start gap-2 mb-2">
              {d.isCorrect ? <CheckCircle className="h-5 w-5 text-green-400 shrink-0" /> : <XCircle className="h-5 w-5 text-red-400 shrink-0" />}
              <p className="font-medium">{i + 1}. {d.questionText}</p>
            </div>
            <p className="text-sm text-slate-400 ml-7">Your answer: {d.selectedOptionIds?.map((oid) => d.options?.find((o) => o.id === oid)?.text).join(', ') || '—'}</p>
            {!d.isCorrect && (
              <p className="text-sm text-green-400/80 ml-7 mt-1">
                Correct: {d.correctOptionIds?.map((oid) => d.options?.find((o) => o.id === oid)?.text).join(', ')}
              </p>
            )}
            {d.explanation && <p className="text-sm text-brand-300/80 ml-7 mt-2 italic">{d.explanation}</p>}
          </div>
        ))}
      </div>

      <Link to="/student" className="mt-8 inline-block text-brand-400 hover:underline">← Back to dashboard</Link>
    </div>
  );
}
