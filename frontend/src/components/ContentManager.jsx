import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import ContentEditor from './ContentEditor';
import { FilePlus, GripVertical, Pencil, Trash2 } from 'lucide-react';

export default function ContentManager({ topicId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [draggedId, setDraggedId] = useState(null);

  const loadPosts = useCallback(() => {
    if (!topicId) return;
    setLoading(true);
    api
      .get(`/content/topic/${topicId}`)
      .then((r) => setPosts(r.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [topicId]);

  useEffect(() => {
    loadPosts();
    setActiveId(null);
    setIsNew(false);
  }, [topicId, loadPosts]);

  const startNew = () => {
    setActiveId(null);
    setIsNew(true);
  };

  const editPost = (id) => {
    setIsNew(false);
    setActiveId(id);
  };

  const handleSaved = () => {
    loadPosts();
    setIsNew(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    await api.delete(`/content/${id}`);
    if (activeId === id) {
      setActiveId(null);
      setIsNew(false);
    }
    loadPosts();
  };

  const handleDrop = async (targetId) => {
    if (!draggedId || draggedId === targetId) return;

    const oldIndex = posts.findIndex((p) => p._id === draggedId);
    const newIndex = posts.findIndex((p) => p._id === targetId);

    const newPosts = [...posts];
    const [movedItem] = newPosts.splice(oldIndex, 1);
    newPosts.splice(newIndex, 0, movedItem);

    setPosts(newPosts);
    setDraggedId(null);

    try {
      await api.put('/content/reorder', { orderedIds: newPosts.map((p) => p._id) });
    } catch (err) {
      console.error('Failed to save order', err);
    }
  };

  const showEditor = isNew || activeId;

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-200">Blog posts</h2>
          <button
            type="button"
            onClick={startNew}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold hover:bg-brand-500"
          >
            <FilePlus className="h-3.5 w-3.5" /> New
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-slate-500">No posts yet. Create your first blog.</p>
        ) : (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li
                key={post._id}
                draggable
                onDragStart={() => setDraggedId(post._id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(post._id)}
                onDragEnd={() => setDraggedId(null)}
                className={`flex items-start gap-2 rounded-xl border p-3 transition ${
                  activeId === post._id
                    ? 'border-brand-500/50 bg-brand-500/10'
                    : 'border-white/10 hover:border-white/20'
                } ${draggedId === post._id ? 'opacity-50' : ''}`}
              >
                <div className="mt-1 cursor-grab text-slate-500 hover:text-slate-300">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => editPost(post._id)}
                    className="w-full text-left"
                  >
                    <p className="font-medium text-sm line-clamp-2">{post.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(post.updatedAt || post.createdAt).toLocaleString()}
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                        post.published
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(post._id)}
                    className="mt-2 flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div>
        {!showEditor ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 p-8 text-center text-slate-400">
            <Pencil className="mb-3 h-10 w-10 opacity-50" />
            <p>Select a post to edit, or create a new blog.</p>
          </div>
        ) : (
          <ContentEditor
            key={isNew ? 'new' : activeId}
            topicId={topicId}
            contentId={isNew ? null : activeId}
            onSaved={handleSaved}
            onCancel={() => {
              setIsNew(false);
              setActiveId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
