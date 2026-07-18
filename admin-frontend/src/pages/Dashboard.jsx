import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  Search, Globe, FileText, Tag, User, Bot, RefreshCw,
  Save, LogOut, CheckCircle2, AlertCircle, Info
} from 'lucide-react';

// ── Toast Component ──────────────────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} onClick={() => removeToast(t.id)}>
          {t.type === 'success'
            ? <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 8 }} />
            : <AlertCircle size={14} style={{ display: 'inline', marginRight: 8 }} />
          }
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Character counter helper ─────────────────────────────────────────────────
function CharCount({ value, max, ideal }) {
  const len = value?.length || 0;
  const cls = len > max ? 'danger' : len > ideal ? 'warn' : '';
  return <p className={`char-count ${cls}`}>{len}/{max} characters</p>;
}

// ── SERP Preview ─────────────────────────────────────────────────────────────
function SerpPreview({ title, description }) {
  return (
    <div className="serp-preview">
      <p className="serp-preview-label">
        <Search size={10} style={{ display: 'inline', marginRight: 5 }} />
        Google Search Preview
      </p>
      <p className="serp-url">medhashine.com › explore</p>
      <p className="serp-title">{title || 'Your site title will appear here'}</p>
      <p className="serp-desc">{description || 'Your meta description will appear here. Make it compelling to increase click-through rates.'}</p>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();

  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
    author: '',
    googleSiteVerification: '',
    robots: 'index, follow',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchSeo = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/explore/seo');
      setSeo({
        title: res.data.title || '',
        description: res.data.description || '',
        keywords: res.data.keywords || '',
        author: res.data.author || '',
        googleSiteVerification: res.data.googleSiteVerification || '',
        robots: res.data.robots || 'index, follow',
      });
    } catch {
      addToast('Failed to load SEO settings.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchSeo(); }, [fetchSeo]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/explore/seo', seo);
      addToast('SEO settings saved successfully!', 'success');
    } catch {
      addToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setSeo((prev) => ({ ...prev, [field]: e.target.value }));

  const fields = [
    {
      key: 'title',
      label: 'Site Title',
      icon: Globe,
      type: 'input',
      placeholder: 'Medhashine — Learn. Teach. Excel.',
      hint: 'Displayed in browser tab and Google search results.',
      max: 70, ideal: 60,
    },
    {
      key: 'description',
      label: 'Meta Description',
      icon: FileText,
      type: 'textarea',
      placeholder: 'Interactive learning portal for teachers and students...',
      hint: 'The snippet shown in search results. Aim for 150–160 characters.',
      max: 200, ideal: 160,
    },
    {
      key: 'keywords',
      label: 'Keywords',
      icon: Tag,
      type: 'input',
      placeholder: 'learning, tutoring, student portal, medhashine',
      hint: 'Comma-separated keywords. Less important for modern SEO, but still used by some engines.',
      max: 300, ideal: 200,
    },
    {
      key: 'author',
      label: 'Author / Brand Name',
      icon: User,
      type: 'input',
      placeholder: 'Medhashine Team',
      hint: 'Used in the <meta name="author"> tag.',
      max: 80, ideal: 60,
    },
    {
      key: 'googleSiteVerification',
      label: 'Google Site Verification',
      icon: Search,
      type: 'input',
      placeholder: 'paste your verification code here',
      hint: 'From Google Search Console → Settings → Ownership verification → HTML tag.',
      max: 200, ideal: 200,
    },
    {
      key: 'robots',
      label: 'Robots Directive',
      icon: Bot,
      type: 'input',
      placeholder: 'index, follow',
      hint: 'Controls how search engines crawl your site. Use "noindex, nofollow" to hide from search.',
      max: 80, ideal: 80,
    },
  ];

  return (
    <div className="admin-layout">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="header-logo">
          <div className="header-logo-icon">M</div>
          <span className="header-logo-text">Medhashine Admin</span>
        </div>
        <div className="header-actions">
          <div className="header-user">
            <User size={13} />
            {user?.name || user?.email}
          </div>
          <button
            className="btn btn-ghost"
            onClick={logout}
            style={{ padding: '7px 14px', fontSize: 13 }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="dashboard-body">
        {/* Page heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>SEO Settings</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Manage your site's metadata to improve visibility on Google and other search engines.
          </p>
        </div>

        {/* Info tip */}
        <div style={{
          display: 'flex', gap: 10, padding: '12px 16px',
          background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 10, marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55,
        }}>
          <Info size={15} style={{ color: 'var(--brand-light)', marginTop: 2, flexShrink: 0 }} />
          <span>
            Changes here update the live student portal (<strong style={{ color: 'var(--text-primary)' }}>medhashine.com</strong>).
            Individual blog posts automatically get their own title and description from the blog content.
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : (
          <form onSubmit={handleSave}>
            {/* SEO Panel */}
            <div className="seo-panel">
              <div className="seo-panel-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="seo-panel-title">Site-wide SEO Metadata</p>
                    <p className="seo-panel-subtitle">These values are applied to the homepage and explore pages</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={fetchSeo}
                    style={{ padding: '7px 12px', fontSize: 12 }}
                  >
                    <RefreshCw size={13} /> Reload
                  </button>
                </div>
              </div>

              <div className="seo-panel-body">
                <div className="seo-grid">
                  {fields.map(({ key, label, icon: Icon, type, placeholder, hint, max, ideal }) => (
                    <div className="form-group" key={key} style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor={key}>
                        <Icon size={12} style={{ display: 'inline', marginRight: 5 }} />
                        {label}
                      </label>
                      {type === 'textarea' ? (
                        <textarea
                          id={key}
                          className="form-input form-textarea"
                          placeholder={placeholder}
                          value={seo[key]}
                          onChange={set(key)}
                        />
                      ) : (
                        <input
                          id={key}
                          type="text"
                          className="form-input"
                          placeholder={placeholder}
                          value={seo[key]}
                          onChange={set(key)}
                        />
                      )}
                      {hint && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>{hint}</p>}
                      <CharCount value={seo[key]} max={max} ideal={ideal} />
                    </div>
                  ))}
                </div>

                {/* Google SERP Preview */}
                <SerpPreview title={seo.title} description={seo.description} />

                {/* Save button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ minWidth: 140 }}
                  >
                    {saving ? (
                      <><div className="spinner" /> Saving…</>
                    ) : (
                      <><Save size={15} /> Save Settings</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
