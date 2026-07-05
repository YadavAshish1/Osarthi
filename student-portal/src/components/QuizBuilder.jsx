import { useState } from 'react';
import { api } from '../api/client';
import { Plus, Trash2, Send } from 'lucide-react';

const uid = () => crypto.randomUUID();

export default function QuizBuilder({ classId, subjectId, topicId }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [expiresAt, setExpiresAt] = useState('');
  const [questions, setQuestions] = useState([
    {
      id: uid(),
      text: '',
      type: 'single',
      options: [
        { id: uid(), text: '' },
        { id: uid(), text: '' },
      ],
      correctOptionIds: [],
      explanation: '',
    },
  ]);
  const [quizId, setQuizId] = useState(null);
  const [message, setMessage] = useState('');

  const addQuestion = () => {
    setQuestions((q) => [
      ...q,
      {
        id: uid(),
        text: '',
        type: 'single',
        options: [
          { id: uid(), text: '' },
          { id: uid(), text: '' },
        ],
        correctOptionIds: [],
        explanation: '',
      },
    ]);
  };

  const updateQuestion = (qid, patch) => {
    setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  };

  const save = async () => {
    const payload = {
      title,
      description,
      classRef: classId,
      subjectRef: subjectId,
      topicRef: topicId || undefined,
      timeLimitMinutes: Number(timeLimitMinutes),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      questions,
    };
    if (quizId) {
      const res = await api.put(`/quiz/${quizId}`, payload);
      setQuizId(res.data._id);
    } else {
      const res = await api.post('/quiz', payload);
      setQuizId(res.data._id);
    }
    setMessage('Quiz saved');
  };

  const publish = async () => {
    const payload = {
      title,
      description,
      classRef: classId,
      subjectRef: subjectId,
      topicRef: topicId || undefined,
      timeLimitMinutes: Number(timeLimitMinutes),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      questions,
    };
    let id = quizId;
    if (id) {
      await api.put(`/quiz/${id}`, payload);
    } else {
      const res = await api.post('/quiz', payload);
      id = res.data._id;
      setQuizId(id);
    }
    await api.post(`/quiz/${id}/publish`);
    setMessage('Quiz published! Students notified.');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2" />
        <input type="number" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} placeholder="Time (minutes)" className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2" />
        <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-2" />
      </div>

      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl glass p-6 space-y-4">
          <div className="flex justify-between">
            <span className="text-sm text-slate-400">Question {qi + 1}</span>
            <button type="button" onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))} className="text-red-400"><Trash2 className="h-4 w-4" /></button>
          </div>
          <input value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} placeholder="Question text" className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2" />
          <select value={q.type} onChange={(e) => updateQuestion(q.id, { type: e.target.value })} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1 text-sm">
            <option value="single">Single choice</option>
            <option value="multiple">Multiple choice</option>
          </select>
          {q.options.map((opt, oi) => (
            <div key={opt.id} className="flex items-center gap-2">
              <input
                type={q.type === 'single' ? 'radio' : 'checkbox'}
                name={`correct-${q.id}`}
                checked={q.correctOptionIds.includes(opt.id)}
                onChange={(e) => {
                  let correct = [...q.correctOptionIds];
                  if (q.type === 'single') correct = [opt.id];
                  else if (e.target.checked) correct.push(opt.id);
                  else correct = correct.filter((id) => id !== opt.id);
                  updateQuestion(q.id, { correctOptionIds: correct });
                }}
              />
              <input
                value={opt.text}
                onChange={(e) => {
                  const options = q.options.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o));
                  updateQuestion(q.id, { options });
                }}
                placeholder={`Option ${oi + 1}`}
                className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2"
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-brand-400"
            onClick={() => updateQuestion(q.id, { options: [...q.options, { id: uid(), text: '' }] })}
          >
            + Add option
          </button>
          <input value={q.explanation} onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })} placeholder="Explanation (shown after attempt)" className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2 text-sm" />
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={addQuestion} className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/5">
          <Plus className="h-4 w-4" /> Add question
        </button>
        <button type="button" onClick={save} className="rounded-full bg-slate-700 px-5 py-2 text-sm font-semibold hover:bg-slate-600">Save draft</button>
        <button type="button" onClick={publish} disabled={!quizId && !title} className="flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold hover:bg-brand-500 disabled:opacity-50">
          <Send className="h-4 w-4" /> Publish & notify
        </button>
      </div>
      {message && <p className="text-sm text-green-400">{message}</p>}
    </div>
  );
}
