import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import AdminHeader from '../components/AdminHeader';
import {
  Bot, ShieldCheck, Zap, RefreshCw, CheckCircle2,
  AlertCircle, Shield, ArrowUp, ArrowDown,
  Layers, Check, Server, Lock
} from 'lucide-react';

export default function AiSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

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
      
      // Ensure fallbackSequence exists
      if (!data.fallbackSequence || !Array.isArray(data.fallbackSequence) || data.fallbackSequence.length === 0) {
        data.fallbackSequence = ['azure_openai', 'gemini', 'openai'];
      }
      // Ensure defaultProvider exists
      if (!data.defaultProvider) {
        data.defaultProvider = 'azure_openai';
      }

      setSettings(data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load AI settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/ai/settings', settings);
      addToast('AI settings and model sequence saved successfully!');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

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

      // Swap items
      const temp = seq[index];
      seq[index] = seq[targetIndex];
      seq[targetIndex] = temp;

      const newDefault = seq[0];

      return {
        ...prev,
        fallbackSequence: seq,
        defaultProvider: newDefault,
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

  const updateRateLimit = (role, value) => {
    setSettings((prev) => ({
      ...prev,
      rateLimits: { ...prev.rateLimits, [role]: parseInt(value) || 0 },
    }));
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
      description: 'Google DeepMind models (Gemini 3.5 Flash, Gemini Flash Latest)',
      tag: 'Multimodal AI',
    },
    openai: {
      id: 'openai',
      name: 'OpenAI Direct',
      icon: '🟢',
      envVar: 'OPENAI_API_KEY',
      description: 'Direct OpenAI API gateway connection (GPT-4o, GPT-4o-mini)',
      tag: 'Direct API',
    },
  };

  const providersList = Object.values(providerMeta);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <AdminHeader activePage="ai-settings" />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const currentSequence = settings?.fallbackSequence || ['azure_openai', 'gemini', 'openai'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl cursor-pointer flex items-center gap-2 ${
              t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            } text-white`}
          >
            {t.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {t.message}
          </div>
        ))}
      </div>

      <AdminHeader activePage="ai-settings" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Security Notice */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-1">Super Admin</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Bot className="text-violet-400" size={28} /> AI Settings & Model Sequencing
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure default LLM provider, execution fallback hierarchy, and rate limits.
          </p>
        </div>

        {/* Security Info Card */}
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              Server-Side Credential Isolation (Zero-Trust Security)
            </h4>
            <p className="text-xs text-emerald-400/80 mt-0.5 leading-relaxed">
              API Keys are strictly loaded from server environment variables (<code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-[11px]">.env</code>) and are never requested through the browser or stored in the database.
            </p>
          </div>
        </div>

        {settings && (
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* ─── 1. DEFAULT PROVIDER SELECTION ─── */}
            <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-amber-400" />
                  <h3 className="text-base font-bold text-white">Default LLM Provider</h3>
                </div>
                <span className="text-xs text-slate-400">Primary model called first</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {providersList.map(({ id, name, icon, tag }) => {
                    const isSelected = settings.defaultProvider === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateDefaultProvider(id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                            : 'border-white/10 bg-black/20 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-2xl">{icon}</div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white">{name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{tag}</div>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-wider mt-2 block">
                            Active Default
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── 2. MODEL EXECUTION & FALLBACK SEQUENCING ─── */}
            <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-sky-400" />
                  <h3 className="text-base font-bold text-white">Model Execution & Fallback Sequencing</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">Auto-cascading failover chain</span>
              </div>
              <div className="p-6">
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Arrange the execution hierarchy. If the primary model encounters a temporary outage or rate limit (503/429), the orchestrator automatically cascades down this sequence in real-time.
                </p>

                <div className="space-y-2.5">
                  {currentSequence.map((provId, index) => {
                    const meta = providerMeta[provId] || { name: provId, icon: '🤖', description: '', envVar: '' };
                    const isPrimary = index === 0;
                    const isEnabled = settings.providers?.[provId]?.enabled ?? true;

                    return (
                      <div
                        key={provId}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isPrimary
                            ? 'bg-violet-500/5 border-violet-500/30'
                            : 'bg-black/20 border-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                            isPrimary ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-300'
                          }`}>
                            #{index + 1}
                          </div>
                          <span className="text-xl">{meta.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{meta.name}</span>
                              {isPrimary ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                  Primary (Default)
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                                  Fallback #{index}
                                </span>
                              )}
                              {!isEnabled && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{meta.description}</p>
                          </div>
                        </div>

                        {/* Reorder Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSequenceItem(index, -1)}
                            disabled={index === 0}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Move Up in Priority"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSequenceItem(index, 1)}
                            disabled={index === currentSequence.length - 1}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            title="Move Down in Priority"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ─── 3. PROVIDER STATUS & TOGGLES ─── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Provider Availability & Service Status
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">Managed via .env</span>
              </div>

              {providersList.map(({ id, name, icon, description, envVar }) => {
                const isEnabled = settings.providers?.[id]?.enabled ?? true;
                return (
                  <div key={id} className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{name}</h4>
                            <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              <Server size={10} className="inline mr-1 text-sky-400" />
                              {envVar}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
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
                          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                            isEnabled ? 'left-5' : 'left-0.5'
                          }`} />
                        </div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ─── 4. RATE LIMITS ─── */}
            <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
                <Shield size={16} className="text-amber-400" />
                <h3 className="text-base font-bold text-white">Rate Limits (messages per hour)</h3>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { role: 'student', label: 'Student' },
                  { role: 'teacher', label: 'Teacher' },
                  { role: 'admin', label: 'Admin' },
                  { role: 'super_admin', label: 'Super Admin' },
                ].map(({ role, label }) => (
                  <div key={role}>
                    <label className="text-xs font-semibold text-slate-300 mb-2 block">{label}</label>
                    <input
                      type="number"
                      value={settings.rateLimits?.[role] ?? 0}
                      onChange={(e) => updateRateLimit(role, e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-sm text-center focus:outline-none focus:border-violet-500/50"
                    />
                    {settings.rateLimits?.[role] === -1 && (
                      <p className="text-[10px] text-slate-500 mt-1 text-center">Unlimited</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── 5. SAVE & RELOAD ACTIONS ─── */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={fetchSettings}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <RefreshCw size={13} /> Reload
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-400 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25 cursor-pointer min-w-[160px] justify-center"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                ) : (
                  <><ShieldCheck size={15} /> Save Settings & Sequence</>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
