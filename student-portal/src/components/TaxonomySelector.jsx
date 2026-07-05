import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api/client';

export default function TaxonomySelector({ onSelect, allowCreate = false }) {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');

  useEffect(() => {
    api.get('/taxonomy/classes').then((r) => setClasses(r.data));
  }, []);

  useEffect(() => {
    if (!classId) return setSubjects([]);
    api.get(`/taxonomy/subjects?classId=${classId}`).then((r) => setSubjects(r.data));
    setSubjectId('');
    setTopicId('');
  }, [classId]);

  useEffect(() => {
    if (!subjectId) return setTopics([]);
    api.get(`/taxonomy/topics?subjectId=${subjectId}`).then((r) => setTopics(r.data));
    setTopicId('');
  }, [subjectId]);

  useEffect(() => {
    if (topicId) onSelect?.({ classId, subjectId, topicId });
  }, [classId, subjectId, topicId, onSelect]);

  const addClass = async () => {
    if (!newClass.trim()) return;
    const res = await api.post('/taxonomy/classes', { name: newClass.trim() });
    setClasses((c) => [...c.filter((x) => x._id !== res.data._id), res.data].sort((a, b) => a.name.localeCompare(b.name)));
    setClassId(res.data._id);
    setNewClass('');
  };

  const addSubject = async () => {
    if (!newSubject.trim() || !classId) return;
    const res = await api.post('/taxonomy/subjects', { name: newSubject.trim(), classId });
    setSubjects((s) => [...s.filter((x) => x._id !== res.data._id), res.data].sort((a, b) => a.name.localeCompare(b.name)));
    setSubjectId(res.data._id);
    setNewSubject('');
  };

  const addTopic = async () => {
    if (!newTopic.trim() || !subjectId) return;
    const res = await api.post('/taxonomy/topics', { name: newTopic.trim(), subjectId });
    setTopics((t) => [...t.filter((x) => x._id !== res.data._id), res.data].sort((a, b) => a.name.localeCompare(b.name)));
    setTopicId(res.data._id);
    setNewTopic('');
  };

  const selectClass = (e) => setClassId(e.target.value);
  const selectSubject = (e) => setSubjectId(e.target.value);
  const selectTopic = (e) => setTopicId(e.target.value);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm text-slate-400">Class</label>
        <select value={classId} onChange={selectClass} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2">
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        {allowCreate && (
          <div className="mt-2 flex gap-2">
            <input value={newClass} onChange={(e) => setNewClass(e.target.value)} placeholder="New class" className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-sm" />
            <button type="button" onClick={addClass} className="rounded-lg bg-brand-600 p-2 hover:bg-brand-500"><Plus className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-400">Subject</label>
        <select value={subjectId} onChange={selectSubject} disabled={!classId} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 disabled:opacity-50">
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
        {allowCreate && classId && (
          <div className="mt-2 flex gap-2">
            <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="New subject" className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-sm" />
            <button type="button" onClick={addSubject} className="rounded-lg bg-brand-600 p-2 hover:bg-brand-500"><Plus className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-400">Topic</label>
        <select value={topicId} onChange={selectTopic} disabled={!subjectId} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 disabled:opacity-50">
          <option value="">Select topic</option>
          {topics.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
        {allowCreate && subjectId && (
          <div className="mt-2 flex gap-2">
            <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="New topic" className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-2 py-1 text-sm" />
            <button type="button" onClick={addTopic} className="rounded-lg bg-brand-600 p-2 hover:bg-brand-500"><Plus className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
