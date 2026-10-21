import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import { api } from '../api/client';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Upload,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  Save,
  X,
  PlaySquare,
  AlertCircle,
} from 'lucide-react';

const THEME_PRESETS = [
  { name: 'Terracotta (Rust)', color: '#A84C32' },
  { name: 'Deep Navy', color: '#2B3A67' },
  { name: 'Forest Sage', color: '#2E7D32' },
  { name: 'Warm Amber', color: '#D97706' },
  { name: 'Royal Purple', color: '#7C3AED' },
];

export default function EducatorCards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    headerText: 'Academic Mentor',
    name: '',
    image: '',
    themeColor: '#A84C32',
    ctaUrl: '',
    metricCount: 'Expert Educator',
    verifiedText: 'Verified Mentor',
    active: true,
    order: 0,
  });

  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/superadmin/top-teachers');
      setCards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load educator cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const openAddModal = () => {
    setEditingCard(null);
    setFormData({
      headerText: 'Academic Mentor',
      name: '',
      image: '',
      themeColor: '#A84C32',
      ctaUrl: '',
      metricCount: 'Expert Educator',
      verifiedText: 'Verified Mentor',
      active: true,
      order: cards.length,
    });
    setShowModal(true);
  };

  const openEditModal = (card) => {
    setEditingCard(card);
    setFormData({
      headerText: card.headerText || 'Academic Mentor',
      name: card.name || '',
      image: card.image || '',
      themeColor: card.themeColor || '#A84C32',
      ctaUrl: card.ctaUrl || '',
      metricCount: card.metricCount || 'Expert Educator',
      verifiedText: card.verifiedText || 'Verified Mentor',
      active: card.active !== undefined ? card.active : true,
      order: card.order || 0,
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    try {
      setUploading(true);
      setError('');
      const res = await api.post('/superadmin/top-teachers/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, image: res.data.url }));
        setSuccess('Image uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.image.trim()) {
      setError('Teacher name and image are required');
      return;
    }

    try {
      if (editingCard) {
        await api.put(`/superadmin/top-teachers/${editingCard._id}`, formData);
        setSuccess('Card updated successfully!');
      } else {
        await api.post('/superadmin/top-teachers', formData);
        setSuccess('New card created successfully!');
      }
      setShowModal(false);
      fetchCards();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save card');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this educator card?')) return;
    try {
      await api.delete(`/superadmin/top-teachers/${id}`);
      setSuccess('Card deleted successfully');
      fetchCards();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete card');
    }
  };

  const toggleActive = async (card) => {
    try {
      await api.put(`/superadmin/top-teachers/${card._id}`, { active: !card.active });
      fetchCards();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AdminHeader activePage="educator-cards" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles size={14} />
              Home Page Carousel
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Educator Spotlight Cards
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage the 3D circular carousel cards shown in the "Meet the Educators" section.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
          >
            <Plus size={16} />
            Add Educator Card
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-white/5 border border-white/10 animate-pulse p-6"
              />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Sparkles className="mx-auto w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-lg font-bold text-white">No Educator Cards Found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              Create your first educator card to showcase on the student portal carousel.
            </p>
            <button
              onClick={openAddModal}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs"
            >
              <Plus size={14} /> Add Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => {
              const themeColor = card.themeColor || '#A84C32';

              return (
                <div
                  key={card._id}
                  className={`relative rounded-3xl bg-slate-900 border p-5 flex flex-col justify-between transition-all ${
                    card.active
                      ? 'border-white/15 shadow-xl hover:border-white/30'
                      : 'border-white/5 opacity-60 bg-slate-900/50'
                  }`}
                >
                  {/* Status & Order Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase text-white shadow-xs"
                      style={{ backgroundColor: themeColor }}
                    >
                      {card.headerText || 'Mentor'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        #{card.order ?? 0}
                      </span>
                      <button
                        onClick={() => toggleActive(card)}
                        className={`p-1 rounded-md text-xs cursor-pointer ${
                          card.active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-white/5'
                        }`}
                        title={card.active ? 'Active (Click to hide)' : 'Hidden (Click to activate)'}
                      >
                        {card.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Card Visual Mock Preview (Seekho style: Free cutout image with blurry glow and moti patti arc) */}
                  <div className="relative w-full h-44 rounded-2xl bg-[#F5F2EB] flex flex-col items-center justify-end overflow-hidden my-2 border border-[#E5E1D8]">
                    {/* Blurry glow in exact theme color */}
                    <div
                      className="absolute top-2 w-28 h-28 rounded-full pointer-events-none blur-xl opacity-75"
                      style={{ background: themeColor }}
                    />

                    {/* Teacher cutout image */}
                    {card.image ? (
                      <img
                        src={card.image}
                        alt={card.name}
                        className="relative z-10 w-28 h-32 object-contain object-bottom drop-shadow-md"
                      />
                    ) : (
                      <div className="relative z-10 w-20 h-20 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold mb-4">
                        No Img
                      </div>
                    )}

                    {/* Thick curved swoop arc (moti patti) */}
                    <svg
                      className="absolute bottom-0 left-0 right-0 w-full h-8 pointer-events-none z-20"
                      viewBox="0 0 223 42"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M111.737 30.4283C70.9465 30.4283 32.7486 19.334 0 0V13.3271C33.1309 31.6007 71.2189 42 111.737 42C152.062 42 189.98 31.6996 223 13.5881V0.279393C190.357 19.4408 152.331 30.4283 111.737 30.4283Z"
                        fill={themeColor}
                      />
                    </svg>
                  </div>

                  {/* Name and Meta */}
                  <div className="text-center mt-2">
                    <h3 className="font-bold text-white text-base tracking-tight truncate">
                      {card.name}
                    </h3>
                    <p className="text-xs mt-0.5">
                      {card.ctaUrl ? (
                        <a
                          href={card.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          View Profile <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">No profile link</span>
                      )}
                    </p>
                  </div>

                  {/* Bottom Stats Preview */}
                  <div className="flex items-center justify-around w-full py-2 mt-3 border-t border-white/5 text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 font-semibold">
                      <PlaySquare size={12} style={{ color: themeColor }} />
                      {card.metricCount || 'Mentor'}
                    </span>
                    <span className="w-px h-3 bg-white/10" />
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <CheckCircle2 size={12} />
                      {card.verifiedText || 'Verified'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10 mt-2">
                    <button
                      onClick={() => openEditModal(card)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Edit Card"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(card._id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Delete Card"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-sky-400" />
                {editingCard ? 'Edit Educator Card' : 'Add New Educator Card'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Header Pill Text */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Header Pill Tag (e.g. Science & Physics Mentor, Mathematics Mentor)
                </label>
                <input
                  type="text"
                  required
                  value={formData.headerText}
                  onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                  placeholder="Science & Physics Mentor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Teacher Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Educator / Teacher Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="A.K Singh"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Image Upload / URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Teacher Image (Cutout PNG or Studio Photo)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="/images/ak-singh.png or Cloudinary URL"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:border-sky-500 focus:outline-none"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer shrink-0">
                    <Upload size={14} />
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.image && (
                  <div className="mt-2 flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-12 h-12 object-contain bg-[#F5F2EB] rounded-md border border-white/10"
                    />
                    <span className="text-[11px] text-slate-400 truncate flex-1">{formData.image}</span>
                  </div>
                )}
              </div>

              {/* Theme Color Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Theme Accent Color (For Moti Patti & Blurry Glow)
                </label>
                <div className="flex flex-wrap gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setFormData({ ...formData, themeColor: preset.color })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        formData.themeColor === preset.color
                          ? 'border-white text-white shadow-sm'
                          : 'border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/30"
                        style={{ backgroundColor: preset.color }}
                      />
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Click CTA URL (Target destination when card is clicked)
                </label>
                <input
                  type="text"
                  value={formData.ctaUrl}
                  onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                  placeholder="/teachers/ak-singh or /insights"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Metric & Verified Text */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Metric Text (Left)
                  </label>
                  <input
                    type="text"
                    value={formData.metricCount}
                    onChange={(e) => setFormData({ ...formData, metricCount: e.target.value })}
                    placeholder="115 Insights"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Badge Text (Right)
                  </label>
                  <input
                    type="text"
                    value={formData.verifiedText}
                    onChange={(e) => setFormData({ ...formData, verifiedText: e.target.value })}
                    placeholder="Verified Mentor"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              {/* Order & Active */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-300">Display Order:</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-white text-xs text-center"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-500"
                  />
                  Active (Visible on Portal)
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <Save size={14} />
                  {editingCard ? 'Update Card' : 'Save Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
