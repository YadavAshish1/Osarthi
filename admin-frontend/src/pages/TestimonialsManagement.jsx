import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import { api } from '../api/client';
import {
  Quote,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Eye,
  EyeOff,
  Save,
  X,
  Star,
  AlertCircle,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function TestimonialsManagement() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: 'Class 10 Student, Delhi',
    avatar: '',
    review: '',
    rating: 5,
    isActive: true,
    order: 0,
  });

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/superadmin/testimonials');
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      role: 'Class 10 Student, Delhi',
      avatar: '',
      review: '',
      rating: 5,
      isActive: true,
      order: testimonials.length,
    });
    setShowModal(true);
  };

  const openEditModal = (t) => {
    setEditingItem(t);
    setFormData({
      name: t.name || '',
      role: t.role || 'Student',
      avatar: t.avatar || '',
      review: t.review || '',
      rating: t.rating || 5,
      isActive: t.isActive !== undefined ? t.isActive : true,
      order: t.order || 0,
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
      const res = await api.post('/superadmin/testimonials/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, avatar: res.data.url }));
        setSuccess('Student photo uploaded successfully!');
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
    if (!formData.name.trim() || !formData.review.trim()) {
      setError('Student name and review text are required');
      return;
    }

    try {
      if (editingItem) {
        await api.put(`/superadmin/testimonials/${editingItem._id}`, formData);
        setSuccess('Testimonial updated successfully!');
      } else {
        await api.post('/superadmin/testimonials', formData);
        setSuccess('New testimonial created successfully!');
      }
      setShowModal(false);
      fetchTestimonials();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save testimonial');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the review by "${name}"?`)) return;

    try {
      await api.delete(`/superadmin/testimonials/${id}`);
      setSuccess('Testimonial deleted successfully');
      setTestimonials((prev) => prev.filter((t) => t._id !== id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete testimonial');
    }
  };

  const handleToggleActive = async (t) => {
    try {
      const updated = !t.isActive;
      await api.put(`/superadmin/testimonials/${t._id}`, { isActive: updated });
      setTestimonials((prev) =>
        prev.map((item) => (item._id === t._id ? { ...item, isActive: updated } : item))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <AdminHeader activePage="testimonials" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Quote size={13} />
              Home Page Reviews
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Student Reviews & Testimonials
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage genuine student reviews, photos, school class details, and star ratings shown in the "Why students trust Medhashine" section.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            Add Student Review
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 font-medium">Total Reviews</div>
            <div className="text-2xl font-bold text-white mt-1">{testimonials.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Managed in database</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 font-medium">Active on Portal</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {testimonials.filter((t) => t.isActive).length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Visible to students</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 font-medium">Average Rating</div>
            <div className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-1.5">
              5.0 <Star size={18} className="fill-amber-400 text-amber-400" />
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Student satisfaction</div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            <span className="text-sm">Loading testimonials...</span>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-2xl bg-slate-900/20">
            <Quote size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-lg font-semibold text-white">No testimonials added yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Add genuine student reviews to display in the "Why students trust Medhashine" section.
            </p>
            <button
              onClick={openAddModal}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm cursor-pointer"
            >
              <Plus size={16} />
              Add First Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t._id}
                className={`relative rounded-2xl border transition-all duration-300 flex flex-col justify-between p-6 ${
                  t.isActive
                    ? 'bg-slate-900/70 border-white/15 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5'
                    : 'bg-slate-900/30 border-white/5 opacity-60'
                }`}
              >
                <div>
                  {/* Top Bar: Stars + Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={15}
                          className={`${
                            i < (t.rating || 5)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-xs font-bold text-slate-300">
                        {(t.rating || 5).toFixed(1)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(t)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        t.isActive
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-800 border-white/10 text-slate-400'
                      }`}
                      title={t.isActive ? 'Active on website — click to hide' : 'Hidden — click to show'}
                    >
                      {t.isActive ? (
                        <>
                          <Eye size={12} /> Live
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} /> Hidden
                        </>
                      )}
                    </button>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-slate-200 leading-relaxed font-serif italic mb-6">
                    "{t.review}"
                  </p>
                </div>

                {/* Bottom: Student Info + Action Buttons */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-white/15 bg-slate-800 shadow-sm">
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-amber-600">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{t.name}</div>
                      <div className="text-xs text-slate-400 truncate">{t.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Edit Review"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id, t.name)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Delete Review"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add / Edit Review */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Quote size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {editingItem ? 'Edit Student Review' : 'Add New Student Review'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Fill in the student's authentic feedback, class, and photograph.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Student Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Student Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Class / School / Role */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Class / Grade / City <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 10 Student, Delhi or Grade 12, Bengaluru"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Student Photo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Student Photograph
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Preview circle */}
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white/20 bg-slate-950 flex items-center justify-center">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users size={20} className="text-slate-500" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold cursor-pointer transition-colors border border-white/10">
                          <Upload size={14} />
                          {uploading ? 'Uploading...' : 'Upload Image'}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploading}
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs text-slate-400">or enter image path / URL below</span>
                      </div>
                      <input
                        type="text"
                        placeholder="/images/students/aarav-sharma.jpg or https://..."
                        value={formData.avatar}
                        onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Review / Testimonial Text <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write what the student said about their experience with Medhashine..."
                    value={formData.review}
                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                {/* Rating & Order */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Rating (1 - 5 Stars)
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    >
                      <option value={5}>5 Stars (★★★★★)</option>
                      <option value={4}>4 Stars (★★★★☆)</option>
                      <option value={3}>3 Stars (★★★☆☆)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Visible on Live Website
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Save size={16} />
                    {editingItem ? 'Save Changes' : 'Create Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
