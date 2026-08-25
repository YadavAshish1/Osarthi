import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import AdminHeader from '../components/AdminHeader';
import {
  Bot, ShieldCheck, Zap, RefreshCw, CheckCircle2,
  AlertCircle, Shield, ArrowUp, ArrowDown,
  Layers, Check, Server, Lock, Users, CreditCard,
  Sliders, Clock, Plus, Trash2, Tag, Sparkles,
  Search, RotateCcw, Gift, Award, Calendar, AlertTriangle
} from 'lucide-react';

export default function AiSettings() {
  const [activeTab, setActiveTab] = useState('quotas'); // 'quotas' | 'users' | 'pricing' | 'models'
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

  // User Quota Management State
  const [userList, setUserList] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [exhaustedOnly, setExhaustedOnly] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [resettingUser, setResettingUser] = useState(null);
  const [bonusModalUser, setBonusModalUser] = useState(null);
  const [bonusAmount, setBonusAmount] = useState(10);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/settings');
      const data = res.data || {};

      if (!data.fallbackSequence || !Array.isArray(data.fallbackSequence) || data.fallbackSequence.length === 0) {
        data.fallbackSequence = ['azure_openai', 'gemini', 'openai'];
      }
      if (!data.defaultProvider) {
        data.defaultProvider = 'azure_openai';
      }
      if (!data.defaultFreeQuota) {
        data.defaultFreeQuota = { student: 5, teacher: 10, admin: -1, super_admin: -1 };
      }
      if (!data.quotaResetPeriod) {
        data.quotaResetPeriod = 'monthly';
      }

      setSettings(data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load AI settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchUsers = useCallback(async () => {
    setUserLoading(true);
    try {
      const res = await api.get('/ai/admin/quotas', {
        params: {
          search: userSearch,
          role: userRoleFilter,
          exhaustedOnly: exhaustedOnly.toString(),
          limit: 100,
        },
      });
      setUserList(res.data?.users || []);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load user quota list', 'error');
    } finally {
      setUserLoading(false);
    }
  }, [userSearch, userRoleFilter, exhaustedOnly, addToast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  // Save Settings
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.put('/ai/settings', settings);
      addToast('AI settings, quotas & pricing saved successfully!');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset Quota for single user
  const handleResetUserQuota = async (userId, userName) => {
    setResettingUser(userId);
    try {
      await api.post('/ai/admin/quotas/reset', { userId });
      addToast(`Quota reset to 0 for ${userName}!`);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reset quota', 'error');
    } finally {
      setResettingUser(null);
    }
  };

  // Bulk Reset
  const handleBulkReset = async (role = 'all') => {
    const roleLabel = role === 'student' ? 'All Students' : role === 'teacher' ? 'All Teachers' : 'All Users';
    if (!window.confirm(`Are you sure you want to reset message quotas for ${roleLabel}?`)) return;

    setSaving(true);
    try {
      const res = await api.post('/ai/admin/quotas/reset', { role });
      addToast(`Successfully reset quota for ${res.data?.modifiedCount || 0} user(s)!`);
      fetchUsers();
      fetchSettings();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed bulk reset', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Grant Bonus Messages
  const handleGrantBonus = async () => {
    if (!bonusModalUser) return;
    try {
      await api.post('/ai/admin/quotas/add-bonus', {
        userId: bonusModalUser._id,
        bonusCount: bonusAmount,
      });
      addToast(`Granted +${bonusAmount} bonus messages to ${bonusModalUser.name}!`);
      setBonusModalUser(null);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to grant bonus messages', 'error');
    }
  };

  // Model sequencing helper
  const updateDefaultProvider = (providerId) => {
    setSettings((prev) => {
      const currentSeq = prev.fallbackSequence || ['azure_openai', 'gemini', 'openai'];
      const newSeq = [providerId, ...currentSeq.filter((p) => p !== providerId)];
      return {
        ...prev,
        defaultProvider: providerId,
        fallbackSequence: newSeq,
      };
    });
  };

  const moveSequenceItem = (index, direction) => {
    setSettings((prev) => {
      const seq = [...(prev.fallbackSequence || ['azure_openai', 'gemini', 'openai'])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= seq.length) return prev;

      const temp = seq[index];
      seq[index] = seq[targetIndex];
      seq[targetIndex] = temp;

      return {
        ...prev,
        fallbackSequence: seq,
        defaultProvider: seq[0],
      };
    });
  };

  const updateProvider = (providerId, field, value) => {
    setSettings((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: { ...prev.providers?.[providerId], [field]: value },
      },
    }));
  };

  const updateFreeQuota = (role, value) => {
    setSettings((prev) => ({
      ...prev,
      defaultFreeQuota: {
        ...prev.defaultFreeQuota,
        [role]: parseInt(value, 10) || 0,
      },
    }));
  };

  const updatePlanField = (index, field, value) => {
    setSettings((prev) => {
      const plans = [...(prev.pricingPlans || [])];
      plans[index] = { ...plans[index], [field]: value };
      return { ...prev, pricingPlans: plans };
    });
  };

  const updatePlanFeature = (planIndex, featureIndex, value) => {
    setSettings((prev) => {
      const plans = [...(prev.pricingPlans || [])];
      const features = [...(plans[planIndex].features || [])];
      features[featureIndex] = value;
      plans[planIndex] = { ...plans[planIndex], features };
      return { ...prev, pricingPlans: plans };
    });
  };

  const addPlanFeature = (planIndex) => {
    setSettings((prev) => {
      const plans = [...(prev.pricingPlans || [])];
      const features = [...(plans[planIndex].features || []), 'New feature bullet point'];
      plans[planIndex] = { ...plans[planIndex], features };
      return { ...prev, pricingPlans: plans };
    });
  };

  const removePlanFeature = (planIndex, featureIndex) => {
    setSettings((prev) => {
      const plans = [...(prev.pricingPlans || [])];
      const features = plans[planIndex].features.filter((_, i) => i !== featureIndex);
      plans[planIndex] = { ...plans[planIndex], features };
      return { ...prev, pricingPlans: plans };
    });
  };

  const providerMeta = {
    azure_openai: {
      id: 'azure_openai',
      name: 'Azure OpenAI',
      icon: '🔷',
      envVar: 'AZURE_OPENAI_API_KEY & AZURE_OPENAI_ENDPOINT',
      description: 'Microsoft Azure enterprise-grade OpenAI deployment (GPT-4o, GPT-4o-mini)',
      tag: 'Enterprise Cloud',
    },
    gemini: {
      id: 'gemini',
      name: 'Google Gemini',
      icon: '✨',
      envVar: 'GEMINI_API_KEY',
      description: 'Google Gemini 2.0 Flash / 1.5 Flash multimodal intelligence & ultra-fast inference',
      tag: 'Ultra Fast & Economical',
    },
    openai: {
      id: 'openai',
      name: 'OpenAI Direct',
      icon: '⚡',
      envVar: 'OPENAI_API_KEY',
      description: 'Direct OpenAI API gateway for GPT-4o / GPT-4o-mini models',
      tag: 'Direct Gateway',
    },
  };

  const providersList = [
    providerMeta.azure_openai,
    providerMeta.gemini,
    providerMeta.openai,
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <AdminHeader title="AI Agent Quota, Pricing & Execution Engine" />

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-right-4 ${
              t.type === 'error'
                ? 'bg-rose-950/90 border-rose-800 text-rose-200'
                : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
            }`}
          >
            {t.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header Card */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-white/[0.08] rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
                  <Bot size={22} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    AI Study Copilot Operations & Quota Center
                  </h1>
                  <p className="text-xs text-slate-400">
                    Manage message allowances per role, automated resets, 3-tier paywall pricing, and LLM model cascading.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchSettings}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 pt-4 border-t border-white/[0.08] overflow-x-auto">
            {[
              { id: 'quotas', label: 'Role Quotas & Auto-Reset', icon: Sliders },
              { id: 'users', label: 'User Quota Manager', icon: Users },
              { id: 'pricing', label: '3-Tier Paywall & Pricing', icon: CreditCard },
              { id: 'models', label: 'LLM Engines & Cascading', icon: Layers },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading AI settings and quota configurations...</p>
          </div>
        ) : settings && (
          <div className="space-y-6">

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 1: ROLE QUOTAS & AUTO-RESET
               ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'quotas' && (
              <div className="space-y-6">
                {/* Free Quotas per Role Card */}
                <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sliders size={18} className="text-indigo-400" />
                      <span>Default Free Allowed Messages Per Person</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Set how many free AI messages each user can send before requiring a plan or admin quota reset.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Student Quota */}
                    <div className="p-5 rounded-2xl bg-slate-950/60 border border-indigo-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Students</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                          Free Allowance
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={settings.defaultFreeQuota?.student ?? 5}
                          onChange={(e) => updateFreeQuota('student', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-lg text-center focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="text-xs text-slate-400 font-semibold">msgs</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Default for newly registered students (e.g. 5 questions).
                      </p>
                    </div>

                    {/* Teacher Quota */}
                    <div className="p-5 rounded-2xl bg-slate-950/60 border border-amber-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Teachers</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                          Free Allowance
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={settings.defaultFreeQuota?.teacher ?? 10}
                          onChange={(e) => updateFreeQuota('teacher', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-lg text-center focus:border-amber-500 focus:outline-none"
                        />
                        <span className="text-xs text-slate-400 font-semibold">msgs</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Default for verified educator accounts (e.g. 10 questions).
                      </p>
                    </div>

                    {/* Admin (Unlimited) */}
                    <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Admins</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          Unlimited
                        </span>
                      </div>
                      <div className="py-2 text-center">
                        <span className="text-2xl font-black text-emerald-400">∞</span >
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Internal managers and platform moderators have zero quota limits.
                      </p>
                    </div>

                    {/* Super Admin (Unlimited) */}
                    <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Super Admins</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          Unlimited
                        </span>
                      </div>
                      <div className="py-2 text-center">
                        <span className="text-2xl font-black text-emerald-400">∞</span >
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Platform owners and infrastructure managers with full access.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Automated Reset Cycle & Bulk Reset Controls */}
                <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-400" />
                      <span>Quota Reset Schedule & Bulk Management</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose how often user message counters automatically refresh, or instantly trigger a bulk quota reset.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: 'monthly',
                        title: 'Monthly Reset (Recommended)',
                        desc: 'Every student and teacher gets their full free message allowance refreshed on the 1st of every month.',
                      },
                      {
                        id: 'weekly',
                        title: 'Weekly Reset',
                        desc: 'Refreshes free message counters every Monday at 00:00 UTC.',
                      },
                      {
                        id: 'manual',
                        title: 'Manual Reset Only',
                        desc: 'Quota never resets automatically. Only resets when triggered by an Admin or upon plan subscription.',
                      },
                    ].map(({ id, title, desc }) => (
                      <div
                        key={id}
                        onClick={() => setSettings((prev) => ({ ...prev, quotaResetPeriod: id }))}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          settings.quotaResetPeriod === id
                            ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                            : 'bg-slate-950/40 border-white/[0.06] hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-white">{title}</span>
                            {settings.quotaResetPeriod === id && (
                              <CheckCircle2 size={16} className="text-indigo-400" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Immediate 1-Click Action Buttons */}
                  <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-slate-400">
                      {settings.lastGlobalResetAt && (
                        <span>Last Global Reset: <strong className="text-white">{new Date(settings.lastGlobalResetAt).toLocaleString()}</strong></span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleBulkReset('student')}
                        disabled={saving}
                        className="px-4 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Reset All Students Quota
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkReset('teacher')}
                        disabled={saving}
                        className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Reset All Teachers Quota
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkReset('all')}
                        disabled={saving}
                        className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Reset All Users
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 2: USER QUOTA MANAGER
               ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                    <div className="relative w-full sm:max-w-md">
                      <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search student or teacher name / email..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-3 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all">All Roles</option>
                      <option value="student">Students</option>
                      <option value="teacher">Teachers</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                      <input
                        type="checkbox"
                        checked={exhaustedOnly}
                        onChange={(e) => setExhaustedOnly(e.target.checked)}
                        className="rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-0"
                      />
                      <span>Exhausted Quota Only (0 remaining)</span>
                    </label>

                    <button
                      type="button"
                      onClick={fetchUsers}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                      title="Refresh user list"
                    >
                      <RefreshCw size={15} className={userLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {/* User Quotas Table */}
                <div className="bg-slate-900 border border-white/[0.08] rounded-3xl overflow-hidden shadow-sm">
                  {userLoading ? (
                    <div className="p-12 text-center">
                      <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Loading user quotas...</p>
                    </div>
                  ) : userList.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      No users found matching your filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.08] bg-slate-950/40 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="px-6 py-3.5">User</th>
                            <th className="px-4 py-3.5">Role</th>
                            <th className="px-4 py-3.5">Questions Used</th>
                            <th className="px-4 py-3.5">Total Allowed</th>
                            <th className="px-4 py-3.5">Remaining</th>
                            <th className="px-4 py-3.5">Active Plan</th>
                            <th className="px-6 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {userList.map((u) => (
                            <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                                    {u.name?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white text-xs">{u.name}</div>
                                    <div className="text-[11px] text-slate-400">{u.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  u.role === 'teacher'
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                    : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                                }`}>
                                  {u.role}
                                </span>
                              </td>

                              <td className="px-4 py-4 font-bold text-white">
                                {u.messagesUsed}
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-300">
                                {u.totalAllowed === -1 ? (
                                  <span className="text-emerald-400 font-bold">Unlimited</span>
                                ) : (
                                  <span>{u.totalAllowed} msgs</span>
                                )}
                                {u.bonusMessages > 0 && (
                                  <span className="ml-1 text-[10px] text-amber-400 font-mono">(+{u.bonusMessages} bonus)</span>
                                )}
                              </td>

                              <td className="px-4 py-4">
                                {u.totalAllowed === -1 ? (
                                  <span className="text-emerald-400 font-bold">Unlimited</span>
                                ) : u.remaining <= 0 ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-[11px]">
                                    <AlertTriangle size={11} />
                                    <span>Exhausted (0)</span>
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">
                                    {u.remaining} left
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold">
                                  {u.activePlan === 'free' ? 'Free Allowance' : u.activePlan.toUpperCase()}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleResetUserQuota(u._id, u.name)}
                                    disabled={resettingUser === u._id}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                                    title="Reset messages used to 0"
                                  >
                                    <RotateCcw size={12} className={`inline mr-1 ${resettingUser === u._id ? 'animate-spin' : ''}`} />
                                    <span>Reset Quota</span>
                                  </button>

                                  <button
                                    onClick={() => setBonusModalUser(u)}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-colors cursor-pointer"
                                    title="Grant bonus messages"
                                  >
                                    <Gift size={12} className="inline mr-1" />
                                    <span>+Bonus</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 3: 3-TIER PRICING & PAYWALL EDITOR
               ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <CreditCard size={18} className="text-indigo-400" />
                        <span>3-Tier Paywall Comparison & Dynamic Pricing Configurator</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        These 3 options are dynamically displayed to students and teachers when their free quota is exhausted.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      Save Pricing Plans
                    </button>
                  </div>

                  {/* 3 Tier Cards Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {(settings.pricingPlans || []).map((plan, planIdx) => (
                      <div
                        key={plan.id || planIdx}
                        className={`rounded-3xl border p-6 flex flex-col justify-between space-y-6 transition-all ${
                          plan.isFeatured
                            ? 'bg-gradient-to-b from-indigo-950/50 to-slate-900 border-indigo-500/80 shadow-xl shadow-indigo-500/10'
                            : 'bg-slate-950/60 border-white/[0.08]'
                        }`}
                      >
                        {/* Plan Header */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                              Tier {planIdx + 1} ({plan.id})
                            </span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={plan.isFeatured}
                                onChange={(e) => updatePlanField(planIdx, 'isFeatured', e.target.checked)}
                                className="rounded border-white/20 bg-slate-950 text-indigo-600 focus:ring-0"
                              />
                              <span className="text-[11px] text-indigo-300 font-bold">Featured / Popular</span>
                            </label>
                          </div>

                          {/* Plan Name */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Plan Name
                            </label>
                            <input
                              type="text"
                              value={plan.name}
                              onChange={(e) => updatePlanField(planIdx, 'name', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-sm focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          {/* Badge Tag */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Tag / Badge Text
                            </label>
                            <input
                              type="text"
                              value={plan.tag}
                              onChange={(e) => updatePlanField(planIdx, 'tag', e.target.value)}
                              placeholder="e.g. Most Popular ⭐"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-amber-300 text-xs font-bold focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          {/* Price & Billing Period */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Price (₹ INR)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                                <input
                                  type="number"
                                  value={plan.price}
                                  onChange={(e) => updatePlanField(planIdx, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-base focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Billing Period
                              </label>
                              <select
                                value={plan.billingPeriod}
                                onChange={(e) => updatePlanField(planIdx, 'billingPeriod', e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:border-indigo-500 focus:outline-none"
                              >
                                <option value="one-time">One-Time Pack</option>
                                <option value="monthly">Per Month</option>
                                <option value="yearly">Per Year</option>
                              </select>
                            </div>
                          </div>

                          {/* Message Quota */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              AI Questions / Messages Granted
                            </label>
                            <input
                              type="number"
                              value={plan.messageQuota}
                              onChange={(e) => updatePlanField(planIdx, 'messageQuota', parseInt(e.target.value, 10) || 0)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 font-bold text-sm focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          {/* Short Description */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={plan.description || ''}
                              onChange={(e) => updatePlanField(planIdx, 'description', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none resize-none"
                            />
                          </div>

                          {/* Features Checklist */}
                          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Feature Highlights
                              </label>
                              <button
                                type="button"
                                onClick={() => addPlanFeature(planIdx)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={11} /> Add Bullet
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {(plan.features || []).map((feat, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-1.5">
                                  <Check size={12} className="text-indigo-400 shrink-0" />
                                  <input
                                    type="text"
                                    value={feat}
                                    onChange={(e) => updatePlanFeature(planIdx, fIdx, e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-slate-200 text-xs focus:border-indigo-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removePlanFeature(planIdx, fIdx)}
                                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Enable / Disable toggle */}
                        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-semibold">Plan Status:</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-xs font-bold text-white">
                              {plan.isActive ? 'Active on Paywall' : 'Hidden'}
                            </span>
                            <div
                              onClick={() => updatePlanField(planIdx, 'isActive', !plan.isActive)}
                              className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${
                                plan.isActive ? 'bg-emerald-500' : 'bg-slate-700'
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
                                  plan.isActive ? 'left-4.5' : 'left-0.5'
                                }`}
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Gateway Settings (Razorpay & UPI) */}
                <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <CreditCard size={18} className="text-emerald-400" />
                        <span>Payment Gateway Settings (Razorpay & UPI)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Configure Razorpay merchant credentials and UPI VPA handle for processing student subscriptions.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
                    >
                      Save Gateway Credentials
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Razorpay Key ID
                      </label>
                      <input
                        type="text"
                        value={settings.paymentGateway?.razorpayKeyId || ''}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            paymentGateway: { ...(prev.paymentGateway || {}), razorpayKeyId: e.target.value },
                          }))
                        }
                        placeholder="rzp_live_xxxxxxxx or rzp_test_xxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Razorpay Key Secret
                      </label>
                      <input
                        type="password"
                        value={settings.paymentGateway?.razorpayKeySecret || ''}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            paymentGateway: { ...(prev.paymentGateway || {}), razorpayKeySecret: e.target.value },
                          }))
                        }
                        placeholder="••••••••••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Merchant UPI VPA ID
                      </label>
                      <input
                        type="text"
                        value={settings.paymentGateway?.upiId || 'medhashine@okhdfcbank'}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            paymentGateway: { ...(prev.paymentGateway || {}), upiId: e.target.value },
                          }))
                        }
                        placeholder="yourname@okhdfcbank"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Gateway Environment
                      </label>
                      <select
                        value={settings.paymentGateway?.isLive ? 'live' : 'test'}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            paymentGateway: { ...(prev.paymentGateway || {}), isLive: e.target.value === 'live' },
                          }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="test">Sandbox / Test Mode (Instant Testing)</option>
                        <option value="live">Live Production Gateway</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════════════
                TAB 4: LLM ENGINES & CASCADING
               ══════════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'models' && (
              <div className="space-y-6">
                {/* Fallback Priority Sequencing Card */}
                <div className="bg-slate-900 border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers size={18} className="text-indigo-400" />
                      <span>Model Priority & Auto-Failover Cascade</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Medhashine executes the first provider in sequence. If Azure/Gemini experiences rate limits or network issues, it instantly fails over to the next provider.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {(settings.fallbackSequence || ['azure_openai', 'gemini', 'openai']).map((providerId, index) => {
                      const meta = providerMeta[providerId] || { name: providerId, icon: '🤖', description: '' };
                      const isDefault = index === 0;

                      return (
                        <div
                          key={providerId}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                            isDefault
                              ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                              : 'bg-slate-950/60 border-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{meta.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{meta.name}</span>
                                {isDefault ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                    Primary Engine
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
                                    Failover #{index}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => moveSequenceItem(index, -1)}
                              disabled={index === 0}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSequenceItem(index, 1)}
                              disabled={index === (settings.fallbackSequence?.length || 3) - 1}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Provider Details & Status */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Provider Deployment & Environment Status
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">Managed via .env</span>
                  </div>

                  {providersList.map(({ id, name, icon, description, envVar }) => {
                    const isEnabled = settings.providers?.[id]?.enabled ?? true;
                    return (
                      <div key={id} className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden p-5 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{name}</h4>
                              <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                <Server size={10} className="inline mr-1 text-indigo-400" />
                                {envVar}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs font-semibold text-slate-400">
                            {isEnabled ? 'Active' : 'Disabled'}
                          </span>
                          <div
                            onClick={() => updateProvider(id, 'enabled', !isEnabled)}
                            className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${
                              isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                                isEnabled ? 'left-5' : 'left-0.5'
                              }`}
                            />
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Bonus Grant Modal */}
      {bonusModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Gift size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Grant Bonus AI Messages</h4>
                <p className="text-xs text-slate-400">{bonusModalUser.name} ({bonusModalUser.email})</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Number of Bonus Questions</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setBonusAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      bonusAmount === amt
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    +{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="1000"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm font-bold text-center focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setBonusModalUser(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrantBonus}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-indigo-600/30"
              >
                Grant Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
