import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import { api } from '../api/client';
import {
  BarChart3,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Quote,
  Search,
  LayoutTemplate,
  Layers,
  ArrowRight,
  Upload,
  X,
  Star,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export default function HomeSettingsManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'stats';

  const [loading, setLoading] = useState(true);
  const [savingStats, setSavingStats] = useState(false);
  const [savingBanners, setSavingBanners] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Stats state
  const [stats, setStats] = useState({
    learners: '10,000+',
    insights: '250+',
    mentors: '50+',
    subjects: '20+',
  });

  // Banners state
  const [banners, setBanners] = useState([]);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBannerIndex, setEditingBannerIndex] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [bannerForm, setBannerForm] = useState({
    tag: '',
    title: '',
    subtitle: '',
    quote: '',
    author: '',
    ctaText: '',
    ctaLink: '/insights',
    secondaryCtaText: '',
    secondaryCtaLink: '/teachers',
    bgImage: '',
    active: true,
    order: 0,
  });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const fetchHomeSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/superadmin/home-settings');
      if (data?.stats) {
        setStats({
          learners: data.stats.learners || '10,000+',
          insights: data.stats.insights || '250+',
          mentors: data.stats.mentors || '50+',
          subjects: data.stats.subjects || '20+',
        });
      }
      if (Array.isArray(data?.banners)) {
        setBanners(data.banners);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load home settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeSettings();
  }, []);

  const handleStatsChange = (field, value) => {
    setStats((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveStats = async (e) => {
    e?.preventDefault();
    try {
      setSavingStats(true);
      const { data } = await api.put('/superadmin/home-settings', { stats });
      if (data?.stats) {
        setStats(data.stats);
      }
      addToast('Platform stats updated successfully! Student portal now reflects new numbers.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update stats', 'error');
    } finally {
      setSavingStats(false);
    }
  };

  const handleResetDefaults = () => {
    setStats({
      learners: '10,000+',
      insights: '250+',
      mentors: '50+',
      subjects: '20+',
    });
  };

  // Banner Actions
  const openAddBannerModal = () => {
    setEditingBannerIndex(null);
    setBannerForm({
      tag: '',
      title: '',
      subtitle: '',
      quote: '',
      author: '',
      ctaText: '',
      ctaLink: '/insights',
      secondaryCtaText: '',
      secondaryCtaLink: '/teachers',
      bgImage: '',
      active: true,
      order: banners.length,
    });
    setBannerModalOpen(true);
  };

  const openEditBannerModal = (index) => {
    setEditingBannerIndex(index);
    setBannerForm({
      tag: banners[index]?.tag || '',
      title: banners[index]?.title || '',
      subtitle: banners[index]?.subtitle || '',
      quote: banners[index]?.quote || '',
      author: banners[index]?.author || '',
      ctaText: banners[index]?.ctaText || '',
      ctaLink: banners[index]?.ctaLink || '/insights',
      secondaryCtaText: banners[index]?.secondaryCtaText || '',
      secondaryCtaLink: banners[index]?.secondaryCtaLink || '/teachers',
      bgImage: banners[index]?.bgImage || '',
      active: banners[index]?.active !== false,
      order: banners[index]?.order ?? index,
    });
    setBannerModalOpen(true);
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/superadmin/home-settings/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data?.url) {
        setBannerForm((prev) => ({ ...prev, bgImage: data.url }));
        addToast('Banner image uploaded successfully', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    // Validate that at least something is provided
    if (
      !bannerForm.title.trim() &&
      !bannerForm.quote.trim() &&
      !bannerForm.bgImage.trim() &&
      !bannerForm.ctaText.trim()
    ) {
      addToast('Please provide at least a title, quote, CTA, or background image for the banner.', 'error');
      return;
    }

    try {
      setSavingBanners(true);
      let updatedBanners;
      if (editingBannerIndex !== null) {
        updatedBanners = banners.map((b, i) => (i === editingBannerIndex ? bannerForm : b));
      } else {
        updatedBanners = [...banners, bannerForm];
      }

      const { data } = await api.put('/superadmin/home-settings', { banners: updatedBanners });
      setBanners(data?.banners || updatedBanners);
      setBannerModalOpen(false);
      addToast(
        editingBannerIndex !== null ? 'Banner updated successfully!' : 'New banner added successfully!',
        'success'
      );
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save banner', 'error');
    } finally {
      setSavingBanners(false);
    }
  };

  const handleToggleBannerActive = async (index) => {
    try {
      const updated = banners.map((b, i) => (i === index ? { ...b, active: !b.active } : b));
      const { data } = await api.put('/superadmin/home-settings', { banners: updated });
      setBanners(data?.banners || updated);
      addToast('Banner visibility updated', 'success');
    } catch (err) {
      addToast('Failed to update banner visibility', 'error');
    }
  };

  const handleDeleteBanner = async (index) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      const updated = banners.filter((_, i) => i !== index);
      const { data } = await api.put('/superadmin/home-settings', { banners: updated });
      setBanners(data?.banners || updated);
      addToast('Banner deleted successfully', 'success');
    } catch (err) {
      addToast('Failed to delete banner', 'error');
    }
  };

  const handleMoveBanner = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= banners.length) return;
    const reordered = [...banners];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // re-assign order numbers
    const updated = reordered.map((b, i) => ({ ...b, order: i }));
    try {
      setBanners(updated);
      const { data } = await api.put('/superadmin/home-settings', { banners: updated });
      setBanners(data?.banners || updated);
      addToast('Banner order updated', 'success');
    } catch (err) {
      addToast('Failed to update banner order', 'error');
    }
  };

  const activeBannersCount = banners.filter((b) => b.active !== false).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans pb-16">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl cursor-pointer flex items-center gap-2 ${
              t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            } text-white animate-fade-in`}
          >
            {t.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {t.message}
          </div>
        ))}
      </div>

      <AdminHeader activePage="home-settings" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header & Sub-nav */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <LayoutTemplate size={14} />
            Homepage CMS &amp; Content
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Homepage Settings &amp; Stats
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Manage platform stats and hero carousel banners shown on the student portal homepage.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-8">
          <button
            onClick={() => setSearchParams({ tab: 'stats' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'stats'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 size={15} />
            Platform Stats (StatsBar)
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'banners' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'banners'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={15} />
            Hero Banners ({banners.length})
            {activeBannersCount > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold leading-none">
                {activeBannersCount} Live
              </span>
            )}
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'hub' })}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              currentTab === 'hub'
                ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={15} />
            Homepage CMS Hub
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : currentTab === 'stats' ? (
          /* ========================================================================= */
          /* TAB 1: STATS BAR CONTROLLER & LIVE PREVIEW                                */
          /* ========================================================================= */
          <div className="space-y-8">
            {/* Live Student Portal Preview Card */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Live Portal Preview (Matches StatsBar.tsx)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">
                  Updates in real-time as you type below
                </span>
              </div>

              {/* Exact Mock of StatsBar */}
              <div className="rounded-2xl bg-[#FAF8F5] border border-[#EAE5DC] p-4 sm:p-8 text-slate-900 shadow-inner">
                {/* 3-Column Pill Card */}
                <div className="max-w-3xl mx-auto rounded-2xl bg-white border border-[#E5E1D8] shadow-sm py-4 px-3 sm:px-8">
                  <div className="grid grid-cols-3 divide-x divide-[#E5E1D8]">
                    {/* Stat 1 */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3 px-2 sm:px-4">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-[#FAF0EC] text-[#A84C32] border border-[#F0D5CC] shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                      </div>
                      <div className="flex flex-col text-center sm:text-left min-w-0">
                        <span className="font-serif text-base sm:text-2xl font-bold text-[#1A1A1A] tracking-tight leading-none">
                          {stats.learners || '0'}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#78756F] font-semibold mt-1">
                          Learners
                        </span>
                      </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3 px-2 sm:px-4">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-[#FFF5EB] text-[#E67E22] border border-[#FDE3CF] shrink-0">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                      </div>
                      <div className="flex flex-col text-center sm:text-left min-w-0">
                        <span className="font-serif text-base sm:text-2xl font-bold text-[#1A1A1A] tracking-tight leading-none">
                          {stats.insights || '0'}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#78756F] font-semibold mt-1">
                          Insights
                        </span>
                      </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3 px-2 sm:px-4">
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-[#FAF0EC] text-[#A84C32] border border-[#F0D5CC] shrink-0">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                      </div>
                      <div className="flex flex-col text-center sm:text-left min-w-0">
                        <span className="font-serif text-base sm:text-2xl font-bold text-[#1A1A1A] tracking-tight leading-none">
                          {stats.mentors || '0'}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#78756F] font-semibold mt-1">
                          Mentors
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Social Proof Headline */}
                <div className="text-center mt-6">
                  <h2 className="font-serif text-base sm:text-2xl font-medium text-[#1A1A1A] tracking-tight">
                    Why {stats.learners || 'our'} learners trust{' '}
                    <span className="italic underline decoration-[#A84C32]/30 decoration-wavy underline-offset-4">
                      Medhashine
                    </span>
                    .
                  </h2>
                  <div className="flex items-center justify-center flex-wrap gap-2 mt-2 text-xs text-[#5C5A55]">
                    <span className="inline-flex items-center gap-1 font-bold text-[#A84C32] bg-[#FAF0EC] px-2 py-0.5 rounded-full border border-[#F0D5CC]">
                      <Star className="w-3 h-3 fill-[#A84C32] text-[#A84C32]" /> 4.8 Rating
                    </span>
                    <span>by 5,000+ students &amp; educators · Concept-First · Free Forever</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Stats Form */}
            <form onSubmit={handleSaveStats} className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Edit Marketing Stats Values</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter the count with signs like <code className="text-sky-300">10,000+</code> or <code className="text-sky-300">50K+</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <RotateCcw size={12} />
                  Reset Defaults
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Field 1: Learners */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                    <Users size={14} className="text-[#A84C32]" />
                    Learners Count
                  </label>
                  <input
                    type="text"
                    value={stats.learners}
                    onChange={(e) => handleStatsChange('learners', e.target.value)}
                    placeholder="e.g. 10,000+"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-sky-500/50"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Displayed in Stat 1 and headline.
                  </p>
                </div>

                {/* Field 2: Insights */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                    <BookOpen size={14} className="text-[#E67E22]" />
                    Insights Published
                  </label>
                  <input
                    type="text"
                    value={stats.insights}
                    onChange={(e) => handleStatsChange('insights', e.target.value)}
                    placeholder="e.g. 250+"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-sky-500/50"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Articles &amp; concept notes published.
                  </p>
                </div>

                {/* Field 3: Mentors */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                    <GraduationCap size={14} className="text-[#A84C32]" />
                    Mentors &amp; Teachers
                  </label>
                  <input
                    type="text"
                    value={stats.mentors}
                    onChange={(e) => handleStatsChange('mentors', e.target.value)}
                    placeholder="e.g. 50+"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-sky-500/50"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Active verified educators.
                  </p>
                </div>

                {/* Field 4: Subjects */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                    <BarChart3 size={14} className="text-sky-400" />
                    Subjects Available
                  </label>
                  <input
                    type="text"
                    value={stats.subjects}
                    onChange={(e) => handleStatsChange('subjects', e.target.value)}
                    placeholder="e.g. 20+"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-sky-500/50"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Curriculum subject depth.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-white/10">
                <button
                  type="submit"
                  disabled={savingStats}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-sm hover:bg-sky-400 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
                >
                  {savingStats ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Save Stats to Database
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : currentTab === 'banners' ? (
          /* ========================================================================= */
          /* TAB 2: HERO CAROUSEL BANNERS (QuoteBanner.tsx Controller)                 */
          /* ========================================================================= */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Hero Carousel Banners
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    {activeBannersCount} of {banners.length} Active on Portal
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage the slides displayed at the very top of the student portal. If 1 banner is active, it displays statically. If 2 or 3+, it automatically rotates with touch-swipe and navigation dots.
                </p>
              </div>
              <button
                onClick={openAddBannerModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs sm:text-sm hover:bg-sky-400 transition-all cursor-pointer shadow-lg shadow-sky-500/20 shrink-0"
              >
                <Plus size={16} />
                Add New Banner
              </button>
            </div>

            {banners.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-white/10">
                <ImageIcon size={36} className="mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-semibold text-white">No banners in database yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click 'Add New Banner' above to create custom hero slides with quotes, CTAs, or announcement banners.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {banners.map((banner, index) => {
                  const hasBg = Boolean(banner.bgImage);
                  return (
                    <div
                      key={index}
                      className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                        banner.active !== false
                          ? 'bg-slate-900 border-white/10 shadow-lg'
                          : 'bg-slate-900/40 border-white/5 opacity-60'
                      }`}
                    >
                      {/* Banner Visual Preview Strip */}
                      <div
                        className="relative p-5 sm:p-6 min-h-[180px] flex flex-col justify-between border-b border-white/10"
                        style={{
                          backgroundImage: hasBg ? `url(${banner.bgImage})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundColor: hasBg ? undefined : '#1a100a',
                        }}
                      >
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/60 pointer-events-none" />

                        {/* Top Meta info */}
                        <div className="relative z-10 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
                              Slide #{index + 1}
                            </span>
                            {banner.tag && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-amber-300 bg-amber-500/15 border border-amber-500/25 truncate max-w-[200px]">
                                {banner.tag}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              banner.active !== false
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {banner.active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Content Preview */}
                        <div className="relative z-10 my-3">
                          {banner.title ? (
                            <h4 className="text-base sm:text-lg font-serif font-bold text-white line-clamp-2 leading-snug">
                              {banner.title}
                            </h4>
                          ) : (
                            <span className="text-xs italic text-slate-400">
                              (No title heading configured)
                            </span>
                          )}

                          {banner.subtitle && (
                            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                              {banner.subtitle}
                            </p>
                          )}
                        </div>

                        {/* Optional Quote Card Preview */}
                        {banner.quote && (
                          <div className="relative z-10 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 my-2">
                            <div className="flex items-center gap-1 text-[9px] font-semibold text-amber-300 uppercase tracking-wider mb-1">
                              <Sparkles size={10} /> Thought For Today
                            </div>
                            <p className="text-xs italic text-white line-clamp-2">
                              "{banner.quote}"
                            </p>
                            {banner.author && (
                              <p className="text-[10px] text-white/70 text-right mt-1 font-semibold">
                                — {banner.author}
                              </p>
                            )}
                          </div>
                        )}

                        {/* CTAs Preview */}
                        <div className="relative z-10 flex items-center gap-2 flex-wrap pt-2">
                          {banner.ctaText && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-[#A84C32] shadow-sm">
                              <BookOpen size={11} /> {banner.ctaText}
                            </span>
                          )}
                          {banner.secondaryCtaText && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/80 bg-white/15 border border-white/20">
                              {banner.secondaryCtaText}
                            </span>
                          )}
                          {!banner.ctaText && !banner.secondaryCtaText && (
                            <span className="text-[10px] text-slate-400 italic">No CTAs</span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-4 bg-slate-900 flex items-center justify-between border-t border-white/5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveBanner(index, -1)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            title="Move Up / Earlier in Slide Order"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBanner(index, 1)}
                            disabled={index === banners.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            title="Move Down / Later in Slide Order"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleBannerActive(index)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            title={banner.active !== false ? 'Deactivate (Hide)' : 'Activate (Show)'}
                          >
                            {banner.active !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => openEditBannerModal(index)}
                            className="p-2 rounded-lg text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-all"
                            title="Edit Banner"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(index)}
                            className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                            title="Delete Banner"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* TAB 3: HOMEPAGE CMS HUB OVERVIEW                                          */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Educator Spotlight */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/40 transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center mb-4">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                  Educator Spotlight
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Manage the 3D rotating teacher spotlight cards shown below the hero section on the student portal.
                </p>
              </div>
              <Link
                to="/educator-cards"
                className="mt-6 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-300"
              >
                <span>Manage Teacher Cards</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card 2: Student Testimonials */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center mb-4">
                  <Quote size={20} />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Student Testimonials
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Curate authentic student quotes, ratings, and avatars shown in the social proof review carousel.
                </p>
              </div>
              <Link
                to="/testimonials"
                className="mt-6 flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:text-emerald-300"
              >
                <span>Manage Reviews &amp; Ratings</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card 3: Site SEO & Google Preview */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-sky-500/40 transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25 flex items-center justify-center mb-4">
                  <Search size={20} />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                  SEO &amp; Search Console
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Configure site meta title, meta descriptions, Google Search Console verification, and robots tags.
                </p>
              </div>
              <Link
                to="/dashboard"
                className="mt-6 flex items-center justify-between text-xs font-semibold text-sky-400 group-hover:text-sky-300"
              >
                <span>Edit SEO Settings</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Banner Add / Edit Modal */}
      {bannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 text-slate-100 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingBannerIndex !== null ? `Edit Slide #${editingBannerIndex + 1}` : 'Create New Hero Banner'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  All fields are optional. Leave any field blank if you do not want it shown on this banner.
                </p>
              </div>
              <button
                onClick={() => setBannerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live Visual Preview of the Banner */}
            <div className="mb-6 p-4 rounded-xl border border-white/10 bg-black/40">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                <Eye size={12} className="text-sky-400" />
                Live Banner Preview
              </span>
              <div
                className="rounded-xl p-5 min-h-[140px] relative overflow-hidden flex flex-col justify-between"
                style={{
                  backgroundImage: bannerForm.bgImage ? `url(${bannerForm.bgImage})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: bannerForm.bgImage ? undefined : '#1a100a',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/60 pointer-events-none" />

                <div className="relative z-10 flex flex-col gap-2">
                  {bannerForm.tag && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#F7D8C8] bg-white/15 border border-white/20 w-fit">
                      <Sparkles size={10} className="text-[#E67E22]" /> {bannerForm.tag}
                    </span>
                  )}
                  {bannerForm.title && (
                    <h4 className="font-serif text-lg font-bold text-white leading-snug">
                      {bannerForm.title}
                    </h4>
                  )}
                  {bannerForm.subtitle && (
                    <p className="text-xs text-white/80 leading-relaxed max-w-lg">
                      {bannerForm.subtitle}
                    </p>
                  )}
                  {(bannerForm.ctaText || bannerForm.secondaryCtaText) && (
                    <div className="flex items-center gap-2 pt-1">
                      {bannerForm.ctaText && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-[#A84C32]">
                          {bannerForm.ctaText} →
                        </span>
                      )}
                      {bannerForm.secondaryCtaText && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-white/20">
                          {bannerForm.secondaryCtaText}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {bannerForm.quote && (
                  <div className="relative z-10 mt-3 p-3 rounded-lg bg-black/50 border border-white/20">
                    <p className="text-xs italic text-white">"{bannerForm.quote}"</p>
                    {bannerForm.author && (
                      <p className="text-[10px] text-white/70 text-right mt-0.5 font-semibold">
                        — {bannerForm.author}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              {/* Category Tag */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tag / Category Badge <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={bannerForm.tag}
                  onChange={(e) => setBannerForm({ ...bannerForm, tag: e.target.value })}
                  placeholder="e.g. Free Academic Insights · Written by India's Educators"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Title / Heading */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Main Headline / Title <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="e.g. Where curious minds master what truly matters."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subtitle / Description <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="e.g. Deep, concept-first insights and faculty guidance for grades 6–12 & competitive exams."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Quote & Author Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1">
                    <Quote size={12} /> Thought / Quote <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={bannerForm.quote}
                    onChange={(e) => setBannerForm({ ...bannerForm, quote: e.target.value })}
                    placeholder="e.g. The mind is not a vessel to be filled, but a fire to be kindled."
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    Quote Author <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={bannerForm.author}
                    onChange={(e) => setBannerForm({ ...bannerForm, author: e.target.value })}
                    placeholder="e.g. Plutarch"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400/50"
                  />
                </div>
              </div>

              {/* Primary CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Primary CTA Button Text <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                    placeholder="e.g. Explore All Insights"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Primary CTA Link
                  </label>
                  <input
                    type="text"
                    value={bannerForm.ctaLink}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                    placeholder="/insights"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              {/* Secondary CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Secondary CTA Button Text <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={bannerForm.secondaryCtaText}
                    onChange={(e) => setBannerForm({ ...bannerForm, secondaryCtaText: e.target.value })}
                    placeholder="e.g. Find a Teacher"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Secondary CTA Link
                  </label>
                  <input
                    type="text"
                    value={bannerForm.secondaryCtaLink}
                    onChange={(e) => setBannerForm({ ...bannerForm, secondaryCtaLink: e.target.value })}
                    placeholder="/teachers"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              {/* Background Image & Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Background Image URL <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bannerForm.bgImage}
                    onChange={(e) => setBannerForm({ ...bannerForm, bgImage: e.target.value })}
                    placeholder="https://images.unsplash.com/... or upload below"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500/50"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer shrink-0">
                    <Upload size={13} />
                    {uploadingImage ? 'Uploading…' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Status Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={bannerForm.active !== false}
                  onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                  className="rounded border-white/20 text-sky-500 focus:ring-0"
                />
                <label htmlFor="bannerActive" className="text-xs text-slate-300 cursor-pointer">
                  Active (show this banner in the student portal hero carousel)
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBanners}
                  className="px-5 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs hover:bg-sky-400 transition-all cursor-pointer shadow-md shadow-sky-500/20"
                >
                  {savingBanners ? 'Saving…' : editingBannerIndex !== null ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
