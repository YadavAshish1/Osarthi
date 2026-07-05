import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Notifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/notifications').then((r) => setItems(r.data));
    api.patch('/notifications/read-all');
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n._id} className={`glass rounded-xl p-4 ${!n.read ? 'border-brand-500/30' : ''}`}>
            <p className="font-medium">{n.title}</p>
            <p className="text-sm text-slate-400 mt-1">{n.message}</p>
            <p className="text-xs text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
            {n.quizRef && (
              <Link to={`/student/quiz/${n.quizRef._id || n.quizRef}`} className="text-brand-400 text-sm mt-2 inline-block hover:underline">
                Take quiz →
              </Link>
            )}
          </div>
        ))}
        {!items.length && <p className="text-slate-500">No notifications yet.</p>}
      </div>
    </div>
  );
}
