import { useState } from 'react';
import TaxonomySelector from '../components/TaxonomySelector';
import ContentManager from '../components/ContentManager';
import QuizBuilder from '../components/QuizBuilder';
import { FileText, ClipboardList } from 'lucide-react';

export default function TeacherDashboard() {
  const [selection, setSelection] = useState(null);
  const [tab, setTab] = useState('content');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
      <p className="text-slate-400 mb-8">Select or create class, subject, and topic — then build content or quizzes.</p>

      <TaxonomySelector allowCreate onSelect={setSelection} />

      {selection?.topicId && (
        <>
          <div className="mt-8 flex gap-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => setTab('content')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${tab === 'content' ? 'border-brand-500 text-brand-300' : 'border-transparent text-slate-400'}`}
            >
              <FileText className="h-4 w-4" /> Content
            </button>
            <button
              type="button"
              onClick={() => setTab('quiz')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${tab === 'quiz' ? 'border-brand-500 text-brand-300' : 'border-transparent text-slate-400'}`}
            >
              <ClipboardList className="h-4 w-4" /> Quiz
            </button>
          </div>
          <div className="mt-8">
            {tab === 'content' && <ContentManager topicId={selection.topicId} />}
            {tab === 'quiz' && (
              <QuizBuilder
                classId={selection.classId}
                subjectId={selection.subjectId}
                topicId={selection.topicId}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
