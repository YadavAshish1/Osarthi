import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import AdminHeader from '../components/AdminHeader';
import {
  Search, Globe, FileText, Tag, User, Bot, RefreshCw,
  Save, CheckCircle2, AlertCircle, Info
} from 'lucide-react';

function CharCount({ value, max, ideal }) {
  const len = value?.length || 0;
  const color = len > max ? 'text-red-400' : len > ideal ? 'text-amber-400' : 'text-slate-500';
  return <p className={`text-xs font-semibold mt-1.5 ${color}`}>{len}/{max} characters</p>;
}

function SerpPreview({ title, description }) {
  return (
    <div className="mt-8 bg-white rounded-xl p-5 border border-slate-200">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Search size={10} /> Google Search Preview
      </p>
      <p className="text-xs text-green-700 mb-0.5">medhashine.com › explore</p>
      <p className="text-lg text-blue-700 font-medium hover:underline cursor-pointer leading-tight mb-1">
        {title || 'Your site title will appear here'}
      </p>
      <p className="text-sm text-slate-600 leading-relaxed">
        {description || 'Your meta description will appear here. Make it compelling to increase click-through rates.'}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();

  const [seo, setSeo] = useState({
    title: '', description: '', keywords: '', author: '', googleSiteVerification: '', robots: 'index, follow',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchSeo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/explore/seo');
      setSeo({
        title: res.data.title || '', description: res.data.description || '',
        keywords: res.data.keywords || '', author: res.data.author || '',
        googleSiteVerification: res.data.googleSiteVerification || '', robots: res.data.robots || 'index, follow',
      });
    } catch { addToast('Failed to load SEO settings.', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { fetchSeo(); }, [fetchSeo]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await api.put('/explore/seo', seo); addToast('SEO settings saved!', 'success'); }
    catch { addToast('Failed to save settings.', 'error'); }
    finally { setSaving(false); }
  };

  const set = (field) => (e) => setSeo((prev) => ({ ...prev, [field]: e.target.value }));

  const fields = [
    { key: 'title', label: 'Site Title', icon: Globe, type: 'input', placeholder: 'Medhashine — Learn. Teach. Excel.', hint: 'Displayed in browser tab and Google search results.', max: 70, ideal: 60 },
    { key: 'description', label: 'Meta Description', icon: FileText, type: 'textarea', placeholder: 'Interactive learning portal for teachers and students...', hint: 'The snippet shown in search results. Aim for 150–160 characters.', max: 200, ideal: 160 },
    { key: 'keywords', label: 'Keywords', icon: Tag, type: 'input', placeholder: 'learning, tutoring, student portal, medhashine', hint: 'Comma-separated keywords.', max: 300, ideal: 200 },
    { key: 'author', label: 'Author / Brand Name', icon: User, type: 'input', placeholder: 'Medhashine Team', hint: 'Used in the <meta name="author"> tag.', max: 80, ideal: 60 },
    { key: 'googleSiteVerification', label: 'Google Site Verification', icon: Search, type: 'input', placeholder: 'paste your verification code here', hint: 'From Google Search Console → Settings → Ownership verification.', max: 200, ideal: 200 },
    { key: 'robots', label: 'Robots Directive', icon: Bot, type: 'input', placeholder: 'index, follow', hint: 'Controls how search engines crawl your site.', max: 80, ideal: 80 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl cursor-pointer flex items-center gap-2 ${t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>
            {t.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {t.message}
          </div>
        ))}
      </div>

      <AdminHeader activePage="dashboard" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <p className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">SEO Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your site's metadata for Google and other search engines.</p>
        </div>

        {/* Info Tip */}
        <div className="flex gap-3 p-4 rounded-xl bg-sky-500/[0.07] border border-sky-500/20 text-sm text-slate-300 leading-relaxed mb-8">
          <Info size={16} className="text-sky-400 mt-0.5 shrink-0" />
          <span>
            Changes here update the live student portal (<strong className="text-white">medhashine.com</strong>).
            Individual blog posts automatically get their own title and description.
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden">
              {/* Panel Header */}
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Site-wide SEO Metadata</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Applied to homepage and explore pages</p>
                </div>
                <button type="button" onClick={fetchSeo}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                  <RefreshCw size={13} /> Reload
                </button>
              </div>

              {/* Panel Body */}
              <div className="p-6 space-y-6">
                {fields.map(({ key, label, icon: Icon, type, placeholder, hint, max, ideal }) => (
                  <div key={key}>
                    <label htmlFor={key} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                      <Icon size={13} className="text-sky-400" /> {label}
                    </label>
                    {type === 'textarea' ? (
                      <textarea id={key} rows={3} placeholder={placeholder} value={seo[key]} onChange={set(key)}
                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm resize-y focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
                    ) : (
                      <input id={key} type="text" placeholder={placeholder} value={seo[key]} onChange={set(key)}
                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
                    )}
                    {hint && <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{hint}</p>}
                    <CharCount value={seo[key]} max={max} ideal={ideal} />
                  </div>
                ))}

                {/* SERP Preview */}
                <SerpPreview title={seo.title} description={seo.description} />

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-slate-950 text-sm font-bold hover:bg-sky-400 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/25 cursor-pointer min-w-[150px] justify-center">
                    {saving ? (
                      <><div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> Saving…</>
                    ) : (
                      <><Save size={15} /> Save Settings</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
