import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import AdminHeader from '../components/AdminHeader';
import {
  LayoutDashboard,
  Search,
  Globe,
  FileText,
  Tag,
  User,
  Bot,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  BarChart3,
  Layers,
  Sparkles,
  Quote,
  BookOpen,
  Users as UsersIcon,
  GraduationCap,
  LifeBuoy,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Sliders,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

function CharCount({ value, max, ideal }) {
  const len = value?.length || 0;
  const color = len > max ? 'text-red-400' : len > ideal ? 'text-amber-400' : 'text-slate-500';
  return <p className={`text-xs font-semibold mt-1.5 ${color}`}>{len}/{max} characters</p>;
}

function SerpPreview({ title, description }) {
  return (
    <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-200 text-slate-900 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Search size={11} className="text-slate-400" /> Google Search Preview
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          SERP Snippet
        </span>
      </div>
      <p className="text-xs text-emerald-700 font-medium mb-1">https://medhashine.com › explore</p>
      <p className="text-lg text-blue-700 font-medium hover:underline cursor-pointer leading-tight mb-1.5">
        {title || 'Medhashine — Learn. Teach. Excel.'}
      </p>
      <p className="text-sm text-slate-600 leading-relaxed">
        {description || 'Interactive concept-first learning portal for teachers and students across India. Explore free high-yield insights and find certified mentors.'}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  // Dashboard Aggregated Stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // SEO Settings State
  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
    author: '',
    googleSiteVerification: '',
    robots: 'index, follow',
  });
  const [seoLoading, setSeoLoading] = useState(true);
  const [savingSeo, setSavingSeo] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Fetch aggregated dashboard metrics
  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await api.get('/superadmin/dashboard-stats');
      setStats(data);
    } catch {
      // Fallback defaults if endpoint unavailable
      setStats({
        users: { total: 0, students: 0, teachers: 0, admins: 1 },
        insights: 0,
        pendingApplications: 0,
        openTickets: 0,
        homeStats: { learners: '10,000+', insights: '250+', mentors: '50+', subjects: '20+' },
        bannersCount: 2,
        activeTeacherCards: 4,
        activeTestimonials: 5,
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch SEO settings
  const fetchSeo = useCallback(async () => {
    setSeoLoading(true);
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
      setSeoLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDashboardStats();
    fetchSeo();
  }, [fetchDashboardStats, fetchSeo]);

  const handleSaveSeo = async (e) => {
    e.preventDefault();
    setSavingSeo(true);
    try {
      await api.put('/explore/seo', seo);
      addToast('SEO & Google Search metadata saved successfully!', 'success');
    } catch {
      addToast('Failed to save SEO settings.', 'error');
    } finally {
      setSavingSeo(false);
    }
  };

  const setSeoField = (field) => (e) => setSeo((prev) => ({ ...prev, [field]: e.target.value }));

  const seoFields = [
    { key: 'title', label: 'Site Title', icon: Globe, type: 'input', placeholder: 'Medhashine — Learn. Teach. Excel.', hint: 'Displayed in browser tab and Google search results header.', max: 70, ideal: 60 },
    { key: 'description', label: 'Meta Description', icon: FileText, type: 'textarea', placeholder: 'Interactive concept-first learning portal for teachers and students across India...', hint: 'The snippet shown in search results. Aim for 150–160 characters.', max: 200, ideal: 160 },
    { key: 'keywords', label: 'Keywords', icon: Tag, type: 'input', placeholder: 'learning, tutoring, student portal, medhashine, cbse, icse', hint: 'Comma-separated search keywords for crawler indexing.', max: 300, ideal: 200 },
    { key: 'author', label: 'Author / Brand Name', icon: User, type: 'input', placeholder: 'Medhashine Team', hint: 'Used in the <meta name="author"> tag.', max: 80, ideal: 60 },
    { key: 'googleSiteVerification', label: 'Google Site Verification', icon: Search, type: 'input', placeholder: 'Paste verification token here', hint: 'From Google Search Console → Settings → Ownership verification.', max: 200, ideal: 200 },
    { key: 'robots', label: 'Robots Directive', icon: Bot, type: 'input', placeholder: 'index, follow', hint: 'Controls how Googlebot and other crawlers index your site.', max: 80, ideal: 80 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className={`px-4 py-3 rounded-xl text-xs font-bold shadow-2xl cursor-pointer flex items-center gap-2 ${
              t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            } text-white transition-all`}
          >
            {t.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {t.message}
          </div>
        ))}
      </div>

      <AdminHeader activePage="dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Executive Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 border border-white/10 p-6 sm:p-8 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[11px] font-bold uppercase tracking-wider mb-3">
                <ShieldCheck size={13} />
                Central Admin Console
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'Administrator'} 👋
              </h1>
              <p className="text-sm text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
                Control homepage CMS, update StatsBar numbers, manage educator banners, and monitor platform health.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 text-xs font-bold transition-all shadow-sm hover:text-white"
              >
                <span>Live Student Portal</span>
                <ExternalLink size={13} className="text-sky-400" />
              </a>

              <Link
                to="/home-settings?tab=stats"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
              >
                <Sliders size={13} />
                <span>Update Stats &amp; Banners</span>
              </Link>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 border-t border-white/10 pt-4">
            <button
              onClick={() => setSearchParams({ tab: 'overview' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard size={14} />
              Command Center
            </button>

            <button
              onClick={() => setSearchParams({ tab: 'seo' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'seo'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Search size={14} />
              SEO &amp; Search Meta
            </button>

            <button
              onClick={() => {
                fetchDashboardStats();
                fetchSeo();
                addToast('Refreshed latest platform metrics', 'success');
              }}
              className="ml-auto p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
              title="Refresh All Metrics"
            >
              <RefreshCw size={13} className={statsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: COMMAND CENTER & KPI OVERVIEW                                      */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top 5 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Metric 1: Total Users */}
              <Link
                to="/users"
                className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-white/10 p-5 hover:border-sky-500/40 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Users
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UsersIcon size={15} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white tracking-tight">
                    {statsLoading ? '...' : (stats?.users?.total || 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <span className="text-sky-400 font-semibold">{stats?.users?.students || 0}</span> students ·{' '}
                    <span className="text-purple-400 font-semibold">{stats?.users?.teachers || 0}</span> teachers
                  </div>
                </div>
              </Link>

              {/* Metric 2: Academic Insights */}
              <div className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-white/10 p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Insights Hub
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <BookOpen size={15} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white tracking-tight">
                    {statsLoading ? '...' : (stats?.insights || 0)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <span className="text-amber-400 font-semibold">Published</span> concept guides
                  </div>
                </div>
              </div>

              {/* Metric 3: Pending Teacher Applications */}
              <Link
                to="/applications"
                className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-white/10 p-5 hover:border-emerald-500/40 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Applications
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GraduationCap size={15} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white tracking-tight">
                      {statsLoading ? '...' : stats?.pendingApplications || 0}
                    </span>
                    {(stats?.pendingApplications || 0) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Review
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Pending teacher onboarding</div>
                </div>
              </Link>

              {/* Metric 4: Support Tickets */}
              <Link
                to="/support-tickets"
                className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-white/10 p-5 hover:border-red-500/40 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Support Desk
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <LifeBuoy size={15} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white tracking-tight">
                      {statsLoading ? '...' : stats?.openTickets || 0}
                    </span>
                    {(stats?.openTickets || 0) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        Open
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Student &amp; teacher inquiries</div>
                </div>
              </Link>

              {/* Metric 5: Active Hero Banners */}
              <Link
                to="/home-settings?tab=banners"
                className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-white/10 p-5 hover:border-purple-500/40 transition-all duration-200 hover:-translate-y-0.5 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quote Banners
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Layers size={15} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-white tracking-tight">
                      {statsLoading ? '...' : stats?.bannersCount || 2}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      Live
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Rotating hero slides</div>
                </div>
              </Link>
            </div>

            {/* Core Action Command Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Section 1: Homepage & CMS Studio */}
              <div className="rounded-3xl bg-slate-900 border border-white/10 p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">Homepage CMS Studio</h3>
                        <p className="text-xs text-slate-400">Live student portal visual controls</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-5">
                    {/* Item: Platform Stats */}
                    <Link
                      to="/home-settings?tab=stats"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-sky-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                          <BarChart3 size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                            Platform Stats (StatsBar)
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {stats?.homeStats?.learners || '10,000+'} Learners · {stats?.homeStats?.mentors || '50+'} Mentors
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    {/* Item: Hero Banners */}
                    <Link
                      to="/home-settings?tab=banners"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                          <Layers size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                            Hero &amp; Quote Banners
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {stats?.bannersCount || 2} slides · Quotes, background images &amp; CTAs
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    {/* Item: Educator Spotlight */}
                    <Link
                      to="/educator-cards"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                          <Sparkles size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                            Educator Spotlight Cards
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {stats?.activeTeacherCards || 4} verified mentor feature cards
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    {/* Item: Student Reviews */}
                    <Link
                      to="/testimonials"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          <Quote size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            Student Reviews &amp; Testimonials
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {stats?.activeTestimonials || 5} authentic student feedback items
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>

                <Link
                  to="/home-settings?tab=hub"
                  className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-sky-400 border border-white/10 hover:border-sky-500/30 transition-all"
                >
                  <span>Open Home Settings Hub</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {/* Section 2: Curriculum & Academics */}
              <div className="rounded-3xl bg-slate-900 border border-white/10 p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">Curriculum &amp; Taxonomy</h3>
                        <p className="text-xs text-slate-400">Class, subject &amp; chapter hierarchy</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-5">
                    {/* Item: Classes & Subjects */}
                    <Link
                      to="/taxonomy"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                          <BookOpen size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">
                            Classes &amp; Subjects Tree
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Grades 6–12, foundation &amp; competitive topics
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    {/* Item: Taxonomy Requests */}
                    <Link
                      to="/taxonomy-requests"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-sky-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                          <Send size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                            Curriculum Submissions
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Educator subject &amp; topic expansion requests
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    {/* Item: Live Portal Insights Feed */}
                    <a
                      href="http://localhost:3000/insights"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileText size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                            Explore Insights Stream
                            <ExternalLink size={10} className="text-slate-400" />
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Browse published student learning articles
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                    </a>
                  </div>
                </div>

                <Link
                  to="/taxonomy"
                  className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-purple-400 border border-white/10 hover:border-purple-500/30 transition-all"
                >
                  <span>Manage Academic Taxonomy</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>

              {/* Section 3: Operations & Support */}
              <div className="rounded-3xl bg-slate-900 border border-white/10 p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                        <UsersIcon size={16} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white leading-tight">Operations &amp; Support</h3>
                        <p className="text-xs text-slate-400">User accounts &amp; teacher applications</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 mt-5">
                    {/* Item: User Management */}
                    <Link
                      to="/users"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-sky-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                          <UsersIcon size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                            User Directory &amp; Roles
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Manage accounts, assign roles, toggle statuses
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-sky-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    {/* Item: Teacher Applications */}
                    <Link
                      to="/applications"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          <GraduationCap size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                            Teacher Onboarding
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {stats?.pendingApplications || 0} applications awaiting credential verification
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    {/* Item: Support Inquiries */}
                    <Link
                      to="/support-tickets"
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-red-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                          <LifeBuoy size={15} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">
                            Support Desk
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {stats?.openTickets || 0} active tickets needing staff response
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-red-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>

                <Link
                  to="/users"
                  className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-emerald-400 border border-white/10 hover:border-emerald-500/30 transition-all"
                >
                  <span>Open User Directory</span>
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>

            {/* Live Student Portal Real-Time Status Card */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-white/10 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-base font-bold text-white">Live Student Portal Status</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Synchronized with Next.js frontend at <code className="text-sky-400">http://localhost:3000</code>
                  </p>
                </div>

                <a
                  href="http://localhost:3000"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 text-xs font-bold transition-all w-fit"
                >
                  <span>Visit Portal</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="text-[11px] font-semibold text-slate-400">Live Learners Metric</span>
                  <p className="text-xl font-bold text-white mt-1">{stats?.homeStats?.learners || '10,000+'}</p>
                  <span className="text-[10px] text-slate-500">Rendered in StatsBar</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="text-[11px] font-semibold text-slate-400">Live Insights Metric</span>
                  <p className="text-xl font-bold text-white mt-1">{stats?.homeStats?.insights || '250+'}</p>
                  <span className="text-[10px] text-slate-500">Rendered in StatsBar</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="text-[11px] font-semibold text-slate-400">Live Mentors Metric</span>
                  <p className="text-xl font-bold text-white mt-1">{stats?.homeStats?.mentors || '50+'}</p>
                  <span className="text-[10px] text-slate-500">Rendered in StatsBar</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="text-[11px] font-semibold text-slate-400">Carousel Slides</span>
                  <p className="text-xl font-bold text-white mt-1">{stats?.bannersCount || 2} Active</p>
                  <span className="text-[10px] text-slate-500">Auto-cycling Hero</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SEO & SEARCH METADATA SETTINGS                                     */}
        {/* ========================================================================= */}
        {activeTab === 'seo' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* SEO Guidance Banner */}
            <div className="flex gap-3.5 p-5 rounded-2xl bg-sky-500/[0.08] border border-sky-500/20 text-sm text-slate-300 leading-relaxed shadow-lg">
              <Info size={18} className="text-sky-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block font-semibold mb-0.5">Google Search Console &amp; Site Meta</strong>
                <span>
                  Changes here immediately update the live student portal metadata headers. Individual blog articles and educator profile pages automatically dynamically override their respective OpenGraph tags.
                </span>
              </div>
            </div>

            {seoLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSaveSeo}>
                <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                  {/* Panel Header */}
                  <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Site-wide SEO Metadata</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Applied to homepage and search explore landing pages</p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchSeo}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <RefreshCw size={13} />
                      Reload
                    </button>
                  </div>

                  {/* Panel Body */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {seoFields.map(({ key, label, icon: Icon, type, placeholder, hint, max, ideal }) => (
                      <div key={key}>
                        <label htmlFor={key} className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                          <Icon size={14} className="text-sky-400" />
                          {label}
                        </label>
                        {type === 'textarea' ? (
                          <textarea
                            id={key}
                            rows={3}
                            placeholder={placeholder}
                            value={seo[key]}
                            onChange={setSeoField(key)}
                            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm resize-y focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600 transition-colors"
                          />
                        ) : (
                          <input
                            id={key}
                            type="text"
                            placeholder={placeholder}
                            value={seo[key]}
                            onChange={setSeoField(key)}
                            className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600 transition-colors"
                          />
                        )}
                        {hint && <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{hint}</p>}
                        <CharCount value={seo[key]} max={max} ideal={ideal} />
                      </div>
                    ))}

                    {/* Google SERP Live Simulation */}
                    <SerpPreview title={seo.title} description={seo.description} />

                    {/* Action Bar */}
                    <div className="flex justify-end pt-4 border-t border-white/10">
                      <button
                        type="submit"
                        disabled={savingSeo}
                        className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-sky-500 text-slate-950 text-sm font-bold hover:bg-sky-400 disabled:opacity-50 transition-all shadow-xl shadow-sky-500/25 cursor-pointer min-w-[170px] justify-center"
                      >
                        {savingSeo ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>Saving Changes…</span>
                          </>
                        ) : (
                          <>
                            <Save size={15} />
                            <span>Save SEO Settings</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
