import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Clock } from 'lucide-react';

export default function QuizTake() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useState(() => Date.now())[0];

  useEffect(() => {
    api.get(`/quiz/${id}/take`).then((r) => {
      setQuiz(r.data);
      setSecondsLeft(r.data.timeLimitMinutes * 60);
    }).catch((err) => {
      if (err.response?.status === 409) {
        navigate(`/student/result/${err.response.data.attemptId}`);
      }
    });
  }, [id, navigate]);

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    const payload = {
      answers: Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
        questionId,
        selectedOptionIds: Array.isArray(selectedOptionIds) ? selectedOptionIds : [selectedOptionIds],
      })),
      timeTakenSeconds: Math.floor((Date.now() - startTime) / 1000),
    };
    try {
      const res = await api.post(`/quiz/${id}/submit`, payload);
      navigate(`/student/result/${res.data.attempt._id}`, { state: { result: res.data } });
    } catch (err) {
      alert(err.response?.data?.message || 'Submit failed');
      setSubmitting(false);
    }
  }, [answers, id, navigate, startTime, submitting]);

  useEffect(() => {
    if (!started || !quiz) return;
    if (secondsLeft <= 0) {
      submit();
      return;
    }
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [started, secondsLeft, quiz, submit]);

  if (!quiz) {
    return <div className="flex min-h-[50vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!started) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{quiz.title}</h1>
        <p className="text-slate-400 mb-2">{quiz.subjectRef?.name}</p>
        <p className="text-sm text-slate-500 mb-6">{quiz.description}</p>
        <p className="flex items-center justify-center gap-2 text-brand-300 mb-8">
          <Clock className="h-5 w-5" /> {quiz.timeLimitMinutes} minutes · {quiz.questions.length} questions
        </p>
        <p className="text-xs text-slate-500 mb-8">You can attempt this quiz only once.</p>
        <button onClick={() => setStarted(true)} className="rounded-full bg-brand-600 px-8 py-3 font-semibold hover:bg-brand-500">Start quiz</button>
      </div>
    );
  }

  const toggleAnswer = (q, optId) => {
    if (q.type === 'single') {
      setAnswers((a) => ({ ...a, [q.id]: optId }));
    } else {
      const current = answers[q.id] || [];
      const next = current.includes(optId) ? current.filter((x) => x !== optId) : [...current, optId];
      setAnswers((a) => ({ ...a, [q.id]: next }));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="sticky top-20 z-10 mb-6 flex items-center justify-between glass rounded-xl px-4 py-3">
        <span className="font-medium">{quiz.title}</span>
        <span className={`flex items-center gap-1 font-mono ${secondsLeft < 60 ? 'text-red-400' : 'text-brand-300'}`}>
          <Clock className="h-4 w-4" /> {formatTime(secondsLeft)}
        </span>
      </div>

      <div className="space-y-8">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="glass rounded-xl p-6">
            <p className="font-medium mb-4">{i + 1}. {q.text}</p>
            <div className="space-y-2">
              {q.options.map((opt) => {
                const selected = q.type === 'single'
                  ? answers[q.id] === opt.id
                  : (answers[q.id] || []).includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${selected ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 hover:border-white/20'}`}
                  >
                    <input
                      type={q.type === 'single' ? 'radio' : 'checkbox'}
                      checked={selected}
                      onChange={() => toggleAnswer(q, opt.id)}
                    />
                    {opt.text}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button onClick={submit} disabled={submitting} className="mt-8 w-full rounded-full bg-brand-600 py-3 font-semibold hover:bg-brand-500 disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Submit quiz'}
      </button>
    </div>
  );
}
