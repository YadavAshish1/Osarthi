import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import AdminHeader from '../components/AdminHeader';
import {
  BookOpen, Layers, Plus, Edit2, Power, History,
  CheckCircle2, XCircle, Search, AlertCircle,
  Trash2, Merge, ChevronDown, ChevronRight, Sparkles,
  RotateCcw, Trash, AlertTriangle, Clock, ShieldAlert,
} from 'lucide-react';

export default function TaxonomyManagement() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Class-wise data with counts
  const [classWiseData, setClassWiseData] = useState([]);
  const [countsLoading, setCountsLoading] = useState(false);

  // Recycle Bin state
  const [binSubjects, setBinSubjects] = useState([]);
  const [binClasses, setBinClasses] = useState([]);
  const [binFilter, setBinFilter] = useState('all'); // 'all' | 'classes' | 'subjects'
  const [binLoading, setBinLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('class-wise');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [addClassModalOpen, setAddClassModalOpen] = useState(false);
  const [addSubjectModalOpen, setAddSubjectModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Merge modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState(null);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [mergeClassSubjects, setMergeClassSubjects] = useState([]);

  // Soft Delete confirm modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState('');
  const [confirmNameInput, setConfirmNameInput] = useState('');

  // Permanent Delete confirm modal
  const [permDeleteModalOpen, setPermDeleteModalOpen] = useState(false);
  const [permDeleteItem, setPermDeleteItem] = useState(null);
  const [permConfirmInput, setPermConfirmInput] = useState('');

  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [editName, setEditName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Expanded classes in class-wise view
  const [expandedClasses, setExpandedClasses] = useState(new Set());

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/taxonomy/admin/overview');
      if (data?.classes) setClasses(data.classes);
      if (data?.subjects) setSubjects(data.subjects);
      if (data?.auditLogs) setAuditLogs(data.auditLogs);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to fetch taxonomy data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchClassWiseData = useCallback(async () => {
    setCountsLoading(true);
    try {
      const { data } = await api.get('/taxonomy/admin/subjects-with-counts');
      if (data?.classes) setClassWiseData(data.classes);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to fetch subject counts', 'error');
    } finally {
      setCountsLoading(false);
    }
  }, [addToast]);

  const fetchBinData = useCallback(async () => {
    setBinLoading(true);
    try {
      const { data } = await api.get('/taxonomy/admin/bin');
      if (data?.subjects) setBinSubjects(data.subjects);
      if (data?.classes) setBinClasses(data.classes);
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to fetch recycle bin', 'error');
    } finally {
      setBinLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
    fetchClassWiseData();
    fetchBinData();
  }, [fetchData, fetchClassWiseData, fetchBinData]);

  const refreshAll = () => {
    fetchData();
    fetchClassWiseData();
    fetchBinData();
  };

  const handleAddClassSubmit = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/taxonomy/admin/classes', { name: newClassName.trim() });
      addToast(data.message || 'Class created!', 'success');
      setNewClassName('');
      setAddClassModalOpen(false);
      refreshAll();
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to create class', 'error'); }
    finally { setSubmitting(false); }
  };

  const handleAddSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !selectedClassId) { addToast('Enter subject name and select class', 'error'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/taxonomy/admin/subjects', { name: newSubjectName.trim(), classId: selectedClassId });
      addToast(data.message || 'Subject created!', 'success');
      setNewSubjectName(''); setSelectedClassId(''); setAddSubjectModalOpen(false); refreshAll();
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to create subject', 'error'); }
    finally { setSubmitting(false); }
  };

  const openEditModal = (item, type) => {
    setSelectedItem({ ...item, type });
    setEditName(item.name);
    setEditIsActive(item.isActive !== false);
    setSelectedClassId(item.classRef?._id || item.classRef || '');
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !editName.trim()) return;
    setSubmitting(true);
    try {
      const endpoint = selectedItem.type === 'class' ? `/taxonomy/admin/classes/${selectedItem._id}` : `/taxonomy/admin/subjects/${selectedItem._id}`;
      const payload = { name: editName.trim(), isActive: editIsActive, ...(selectedItem.type === 'subject' && { classId: selectedClassId }) };
      const { data } = await api.put(endpoint, payload);
      addToast(data.message || 'Updated!', 'success');
      setEditModalOpen(false); refreshAll();
    } catch (err) { addToast(err?.response?.data?.message || 'Failed to update', 'error'); }
    finally { setSubmitting(false); }
  };

  const toggleActiveStatus = async (item, type) => {
    const nextStatus = item.isActive === false;
    const actionText = nextStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${actionText} "${item.name}"?`)) return;
    try {
      const endpoint = type === 'class' ? `/taxonomy/admin/classes/${item._id}` : `/taxonomy/admin/subjects/${item._id}`;
      const { data } = await api.put(endpoint, { isActive: nextStatus });
      addToast(data.message || `Successfully ${actionText}d`, 'success'); refreshAll();
    } catch (err) { addToast(err?.response?.data?.message || `Failed to ${actionText}`, 'error'); }
  };

  // ─── DELETE (MOVE TO BIN) HANDLERS ──────────────────────────────────────────

  const openDeleteConfirm = (item, type) => {
    if (!isSuperAdmin) {
      addToast('Only Super Admin can delete items', 'error');
      return;
    }
    setDeleteItem(item);
    setDeleteItemType(type);
    setConfirmNameInput('');
    setDeleteConfirmOpen(true);
  };

  const handleDeleteToBin = async () => {
    if (!deleteItem || !isSuperAdmin) return;
    if (confirmNameInput.trim().toLowerCase() !== deleteItem.name.trim().toLowerCase()) {
      addToast('Subject name does not match confirmation input', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = deleteItemType === 'class'
        ? `/taxonomy/admin/classes/${deleteItem._id}`
        : `/taxonomy/admin/subjects/${deleteItem._id}`;
      const { data } = await api.delete(endpoint);
      addToast(data.message || 'Moved to Recycle Bin (30 days retention)', 'success');
      setDeleteConfirmOpen(false);
      setDeleteItem(null);
      setConfirmNameInput('');
      refreshAll();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to delete', 'error');
    } finally { setSubmitting(false); }
  };

  // ─── RECYCLE BIN HANDLERS (RESTORE & PERMANENT DELETE) ──────────────────────
  const handleRestoreFromBin = async (item, type = 'subject') => {
    setSubmitting(true);
    try {
      const endpoint = type === 'class'
        ? `/taxonomy/admin/classes/${item._id}/restore`
        : `/taxonomy/admin/subjects/${item._id}/restore`;
      const { data } = await api.post(endpoint);
      addToast(data.message || 'Restored successfully!', 'success');
      refreshAll();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to restore item', 'error');
    } finally { setSubmitting(false); }
  };

  // Open Permanent Delete Modal
  const openPermDeleteModal = (item, type = 'subject') => {
    if (!isSuperAdmin) {
      addToast('Only Super Admin can permanently delete items', 'error');
      return;
    }
    setPermDeleteItem({ ...item, itemType: type });
    setPermConfirmInput('');
    setPermDeleteModalOpen(true);
  };

  // Execute Permanent Delete
  const handleConfirmPermanentDelete = async () => {
    if (!permDeleteItem || !isSuperAdmin) return;
    if (permConfirmInput.trim().toLowerCase() !== permDeleteItem.name.trim().toLowerCase()) {
      addToast('Name does not match confirmation input', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = permDeleteItem.itemType === 'class'
        ? `/taxonomy/admin/classes/${permDeleteItem._id}/permanent`
        : `/taxonomy/admin/subjects/${permDeleteItem._id}/permanent`;
      const { data } = await api.delete(endpoint);
      addToast(data.message || 'Permanently deleted forever.', 'success');
      setPermDeleteModalOpen(false);
      setPermDeleteItem(null);
      setPermConfirmInput('');
      refreshAll();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to permanently delete', 'error');
    } finally { setSubmitting(false); }
  };

  const handleCleanEmpty = async () => {
    if (!isSuperAdmin) {
      addToast('Only Super Admin can bulk clean empty subjects', 'error');
      return;
    }
    if (!confirm('Move ALL subjects with 0 blogs to the Recycle Bin (30-day retention)?')) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/taxonomy/admin/subjects/clean-empty');
      addToast(data.message || 'Moved empty subjects to bin!', 'success');
      refreshAll();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to clean empty subjects', 'error');
    } finally { setSubmitting(false); }
  };

  // ─── MERGE HANDLERS ──────────────────────────────────────────────────────────

  const openMergeModal = (source, classData) => {
    setMergeSource(source);
    const otherSubjects = classData.subjects.filter((s) => s._id !== source._id);
    setMergeClassSubjects(otherSubjects);
    setMergeTargetId(otherSubjects.length > 0 ? otherSubjects[0]._id : '');
    setMergeModalOpen(true);
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTargetId) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/taxonomy/admin/subjects/merge', {
        sourceId: mergeSource._id,
        targetId: mergeTargetId,
      });
      addToast(data.message || 'Merged!', 'success');
      setMergeModalOpen(false);
      setMergeSource(null);
      setMergeTargetId('');
      refreshAll();
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to merge', 'error');
    } finally { setSubmitting(false); }
  };

  // ─── EXPAND / COLLAPSE CLASS ──────────────────────────────────────────────────

  const toggleClassExpanded = (classId) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedClasses(new Set(classWiseData.map((c) => c._id)));
  };

  const collapseAll = () => setExpandedClasses(new Set());

  // ─── FLAT LIST ITEMS ─────────────────────────────────────────────────────────

  const allCategoryItems = [
    ...classes.map((c) => ({ ...c, itemType: 'class' })),
    ...subjects.map((s) => ({ ...s, itemType: 'subject' })),
  ];

  const filteredItems = allCategoryItems.filter((item) => {
    const matchesTab = activeTab === 'all' || (activeTab === 'classes' && item.itemType === 'class') || (activeTab === 'subjects' && item.itemType === 'subject');
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && item.isActive !== false) || (statusFilter === 'deactivated' && item.isActive === false);
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || item.name.toLowerCase().includes(q) || (item.classRef?.name && item.classRef.name.toLowerCase().includes(q));
    return matchesTab && matchesStatus && matchesQuery;
  });

  const totalClassesCount = classes.length;
  const totalSubjectsCount = subjects.length;
  const activeCount = allCategoryItems.filter((i) => i.isActive !== false).length;
  const deactivatedCount = allCategoryItems.filter((i) => i.isActive === false).length;
  const emptySubjectsCount = classWiseData.reduce((sum, c) => sum + c.subjects.filter((s) => s.blogCount === 0).length, 0);

  const actionBadge = (action) => {
    const map = {
      create: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      edit: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      activate: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      deactivate: 'bg-red-500/15 text-red-400 border-red-500/30',
      delete: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      soft_delete: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
      restore: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
      permanent_delete: 'bg-red-600/20 text-red-400 border-red-600/40',
      merge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    };
    return map[action] || 'bg-slate-700 text-slate-400 border-slate-600';
  };

  const isDeleteNameMatched = deleteItem && confirmNameInput.trim().toLowerCase() === deleteItem.name.trim().toLowerCase();
  const isPermNameMatched = permDeleteItem && permConfirmInput.trim().toLowerCase() === permDeleteItem.name.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-slide-in ${t.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>
            {t.message}
          </div>
        ))}
      </div>

      <AdminHeader activePage="taxonomy" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1">Academic Structure</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Class & Subject Governance</h1>
            <p className="text-sm text-slate-400 mt-1">Manage official classes, subjects, 30-day recycle bin retention, and audit history.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isSuperAdmin && emptySubjectsCount > 0 && (
              <button
                onClick={handleCleanEmpty}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500/25 transition-all cursor-pointer disabled:opacity-40"
              >
                <Sparkles size={15} /> Bin {emptySubjectsCount} Empty
              </button>
            )}
            <button onClick={() => setAddClassModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 text-xs font-bold hover:bg-sky-500/25 transition-all cursor-pointer">
              <Plus size={15} /> Add Class
            </button>
            <button onClick={() => { if (!classes.length) { addToast('Create a class first', 'error'); return; } setSelectedClassId(classes[0]._id); setAddSubjectModalOpen(true); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/25 cursor-pointer">
              <Plus size={15} /> Add Subject
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Classes', value: totalClassesCount, icon: BookOpen, color: 'text-sky-400' },
            { label: 'Total Subjects', value: totalSubjectsCount, icon: Layers, color: 'text-purple-400' },
            { label: 'Active', value: activeCount, icon: CheckCircle2, color: 'text-emerald-400' },
            { label: 'Deactivated', value: deactivatedCount, icon: Power, color: 'text-red-400' },
            { label: 'Recycle Bin', value: binClasses.length + binSubjects.length, icon: Trash2, color: (binClasses.length + binSubjects.length) > 0 ? 'text-orange-400' : 'text-slate-500' },
            { label: 'Audit Logs', value: auditLogs.length, icon: History, color: 'text-amber-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-900 border border-white/[0.06] rounded-2xl p-5">
              <div className={`flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2`}>
                <Icon size={15} className={color} /> {label}
              </div>
              <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs & Search */}
        <div className="bg-slate-900 border border-white/[0.06] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'class-wise', label: 'Class-wise View' },
              { id: 'all', label: `All (${allCategoryItems.length})` },
              { id: 'classes', label: `Classes (${totalClassesCount})` },
              { id: 'subjects', label: `Subjects (${totalSubjectsCount})` },
              { id: 'bin', label: `Recycle Bin (${binClasses.length + binSubjects.length})`, isBin: true },
              { id: 'history', label: `History (${auditLogs.length})`, isHistory: true },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? tab.isHistory ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : tab.isBin ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                      : tab.id === 'class-wise' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                      : 'bg-sky-500 text-slate-950'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                }`}>
                {tab.isHistory && <History size={12} className="inline mr-1 -mt-0.5" />}
                {tab.isBin && <Trash2 size={12} className="inline mr-1 -mt-0.5" />}
                {tab.label}
              </button>
            ))}
          </div>

          {!['history', 'class-wise', 'bin'].includes(activeTab) && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..."
                  className="pl-9 pr-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-xs w-48 focus:outline-none focus:border-sky-500/50 placeholder:text-slate-500" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-500/50 cursor-pointer">
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          )}
        </div>

        {/* ─── CLASS-WISE VIEW ────────────────────────────────────────────────── */}
        {activeTab === 'class-wise' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <button onClick={expandAll} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:text-white transition-all cursor-pointer">
                  Expand All
                </button>
                <button onClick={collapseAll} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-semibold hover:text-white transition-all cursor-pointer">
                  Collapse All
                </button>
              </div>
              <p className="text-xs text-slate-400">💡 Delete sends items to 30-day Recycle Bin {isSuperAdmin ? '(Super Admin permission enabled)' : '(Restricted to Super Admin)'}</p>
            </div>

            {countsLoading ? (
              <div className="p-16 text-center text-slate-500">Loading class-wise data...</div>
            ) : classWiseData.length === 0 ? (
              <div className="p-16 text-center text-slate-600">No classes found.</div>
            ) : (
              classWiseData.map((cls) => {
                const isExpanded = expandedClasses.has(cls._id);
                const emptyCount = cls.subjects.filter((s) => s.blogCount === 0).length;

                return (
                  <div key={cls._id} className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden">
                    {/* Class header */}
                    <button
                      onClick={() => toggleClassExpanded(cls._id)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={18} className="text-sky-400" /> : <ChevronRight size={18} className="text-slate-500" />}
                        <BookOpen size={16} className="text-sky-400" />
                        <span className="text-base font-bold text-white">{cls.name}</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          {cls.subjects.length} subjects
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                          {cls.totalBlogs} blogs
                        </span>
                        {emptyCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            {emptyCount} empty
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {isSuperAdmin && (
                          <button
                            onClick={() => openDeleteConfirm(cls, 'class')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer"
                          >
                            <Trash2 size={11} /> Delete Class
                          </button>
                        )}
                      </div>
                    </button>

                    {/* Subjects table */}
                    {isExpanded && (
                      <div className="border-t border-white/[0.06]">
                        {cls.subjects.length === 0 ? (
                          <div className="p-8 text-center text-slate-600 text-sm">No subjects in this class.</div>
                        ) : (
                          <>
                            {/* Desktop */}
                            <div className="hidden md:block overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-wider text-left">
                                    <th className="px-6 py-3">Subject Name</th>
                                    <th className="px-4 py-3">Blogs</th>
                                    <th className="px-4 py-3">Topics</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cls.subjects.map((sub) => (
                                    <tr key={sub._id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${sub.isActive === false ? 'opacity-50' : ''}`}>
                                      <td className="px-6 py-3.5 font-bold text-white">{sub.name}</td>
                                      <td className="px-4 py-3.5">
                                        {sub.blogCount === 0 ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                            0 blogs
                                          </span>
                                        ) : (
                                          <span className="text-sky-400 font-bold text-xs">{sub.blogCount} blogs</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5 text-slate-400 text-xs">{sub.topicCount}</td>
                                      <td className="px-4 py-3.5">
                                        {sub.isActive !== false ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                            <CheckCircle2 size={10} /> Active
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                            <XCircle size={10} /> Off
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <button onClick={() => openEditModal({ ...sub, classRef: { _id: cls._id, name: cls.name } }, 'subject')}
                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer">
                                            <Edit2 size={11} /> Edit
                                          </button>
                                          {cls.subjects.length > 1 && (
                                            <button onClick={() => openMergeModal(sub, cls)}
                                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold hover:bg-violet-500/20 transition-all cursor-pointer">
                                              <Merge size={11} /> Merge
                                            </button>
                                          )}
                                          {/* Delete button — Super Admin Only */}
                                          {isSuperAdmin && (
                                            <button onClick={() => openDeleteConfirm(sub, 'subject')}
                                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer">
                                              <Trash2 size={11} /> Delete
                                            </button>
                                          )}
                                          <button onClick={() => toggleActiveStatus({ ...sub, classRef: cls._id }, 'subject')}
                                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${sub.isActive !== false ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                            <Power size={11} /> {sub.isActive !== false ? 'Off' : 'On'}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile */}
                            <div className="md:hidden p-4 space-y-3">
                              {cls.subjects.map((sub) => (
                                <div key={sub._id} className={`bg-slate-800/60 border border-white/[0.06] rounded-xl p-4 ${sub.isActive === false ? 'opacity-50' : ''}`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-white text-sm">{sub.name}</h4>
                                    <div className="flex gap-2">
                                      {sub.blogCount === 0 ? (
                                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full">0 blogs</span>
                                      ) : (
                                        <span className="text-[10px] font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-full">{sub.blogCount} blogs</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => openEditModal({ ...sub, classRef: { _id: cls._id, name: cls.name } }, 'subject')}
                                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold cursor-pointer">
                                      <Edit2 size={12} /> Edit
                                    </button>
                                    {cls.subjects.length > 1 && (
                                      <button onClick={() => openMergeModal(sub, cls)}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold cursor-pointer">
                                        <Merge size={12} /> Merge
                                      </button>
                                    )}
                                    {isSuperAdmin && (
                                      <button onClick={() => openDeleteConfirm(sub, 'subject')}
                                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold cursor-pointer">
                                        <Trash2 size={12} /> Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── RECYCLE BIN VIEW (ACCESSIBLE TO ADMIN & SUPER ADMIN) ───────────── */}
        {activeTab === 'bin' && (
          <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-orange-400 flex items-center gap-2">
                  <Trash2 size={16} /> Recycle Bin (30-Day Retention Period)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Classes and subjects deleted remain here for 30 days. Both Admins and Super Admins can view & restore (unbin) them.
                </p>
              </div>

              {/* Sub-filter tabs inside Recycle Bin */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBinFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    binFilter === 'all'
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  All ({binClasses.length + binSubjects.length})
                </button>
                <button
                  onClick={() => setBinFilter('classes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    binFilter === 'classes'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  Classes ({binClasses.length})
                </button>
                <button
                  onClick={() => setBinFilter('subjects')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    binFilter === 'subjects'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                  }`}
                >
                  Subjects ({binSubjects.length})
                </button>
              </div>
            </div>

            {binLoading ? (
              <div className="p-16 text-center text-slate-500">Loading recycle bin...</div>
            ) : (binClasses.length + binSubjects.length) === 0 ? (
              <div className="p-16 text-center text-slate-600">
                <Trash2 size={32} className="mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="font-semibold text-slate-400">Recycle Bin is empty</p>
                <p className="text-xs text-slate-500">Deleted classes and subjects will appear here for 30 days before being permanently removed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-wider text-left">
                      <th className="px-6 py-3.5">Item Name</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Parent / Scope</th>
                      <th className="px-5 py-3.5">Contents Included</th>
                      <th className="px-5 py-3.5">Deleted At</th>
                      <th className="px-5 py-3.5">Deleted By</th>
                      <th className="px-5 py-3.5">Retention Remaining</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...binClasses.map((c) => ({ ...c, itemType: 'class' })),
                      ...binSubjects.map((s) => ({ ...s, itemType: 'subject' })),
                    ]
                      .filter((item) => {
                        if (binFilter === 'classes') return item.itemType === 'class';
                        if (binFilter === 'subjects') return item.itemType === 'subject';
                        return true;
                      })
                      .map((item) => (
                        <tr key={`${item.itemType}-${item._id}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                            {item.name}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              item.itemType === 'class'
                                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            }`}>
                              {item.itemType}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-xs">
                            {item.itemType === 'class' ? (
                              <span className="text-slate-500">Top-Level Class</span>
                            ) : (
                              item.classRef?.name || '—'
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {item.itemType === 'class' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                {item.subjectCount || 0} subjects, {item.blogCount || 0} blogs
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                {item.blogCount || 0} blogs, {item.topicCount || 0} topics
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-xs">{item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : '—'}</td>
                          <td className="px-5 py-4 text-slate-400 text-xs">{item.deletedBy?.name || 'Admin'}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
                              <Clock size={12} /> {item.daysLeft ?? 30} days left
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Restore is available for Admin & Super Admin */}
                              <button
                                onClick={() => handleRestoreFromBin(item, item.itemType)}
                                disabled={submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all cursor-pointer disabled:opacity-40"
                              >
                                <RotateCcw size={13} /> Restore (Unbin)
                              </button>
                              {/* Permanent Delete Modal for Super Admin */}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => openPermDeleteModal(item, item.itemType)}
                                  disabled={submitting}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-40"
                                >
                                  <Trash size={13} /> Permanent Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── AUDIT HISTORY ──────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2"><History size={16} /> Audit Trail</h3>
              <span className="text-xs text-slate-500">{auditLogs.length} records</span>
            </div>
            {auditLogs.length === 0 ? (
              <div className="p-16 text-center text-slate-600">No audit records yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-wider text-left">
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Item</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Action</th>
                      <th className="px-5 py-3.5">Details</th>
                      <th className="px-5 py-3.5">Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="px-5 py-4 font-bold text-white">{log.targetName}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${log.targetType === 'class' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-purple-500/15 text-purple-400 border-purple-500/30'}`}>
                            {log.targetType}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${actionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-300 text-xs max-w-xs truncate">{log.details || '—'}</td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white text-xs">{log.performedBy?.name || 'Admin'}</div>
                          <div className="text-[11px] text-slate-500">{log.performedBy?.email}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── FLAT LIST VIEWS (all, classes, subjects) ───────────────────────── */}
        {['all', 'classes', 'subjects'].includes(activeTab) && (
          <div className="bg-slate-900 border border-white/[0.06] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-500">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div className="p-16 text-center text-slate-600">No matching categories found.</div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-black/20 text-slate-500 text-[11px] uppercase tracking-wider text-left">
                        <th className="px-5 py-3.5">Name</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5">Parent Class</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Created</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item) => (
                        <tr key={`${item.itemType}-${item._id}`} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${item.isActive === false ? 'opacity-50' : ''}`}>
                          <td className="px-5 py-4 font-bold text-white">{item.name}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${item.itemType === 'class' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-purple-500/15 text-purple-400 border-purple-500/30'}`}>
                              {item.itemType === 'class' ? <BookOpen size={10} /> : <Layers size={10} />} {item.itemType}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-xs">{item.itemType === 'subject' ? (item.classRef?.name || '—') : '—'}</td>
                          <td className="px-5 py-4">
                            {item.isActive !== false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 size={10} /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                                <XCircle size={10} /> Off
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openEditModal(item, item.itemType)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer">
                                <Edit2 size={11} /> Edit
                              </button>
                              {isSuperAdmin && (
                                <button onClick={() => openDeleteConfirm(item, item.itemType)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer">
                                  <Trash2 size={11} /> Delete
                                </button>
                              )}
                              <button onClick={() => toggleActiveStatus(item, item.itemType)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${item.isActive !== false ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}>
                                <Power size={11} /> {item.isActive !== false ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-3">
                  {filteredItems.map((item) => (
                    <div key={`m-${item.itemType}-${item._id}`} className={`bg-slate-800/60 border border-white/[0.06] rounded-xl p-4 ${item.isActive === false ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-white text-sm">{item.name}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${item.itemType === 'class' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' : 'bg-purple-500/15 text-purple-400 border-purple-500/30'}`}>
                          {item.itemType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span>{item.itemType === 'subject' ? `Under: ${item.classRef?.name || '—'}` : 'Class Level'}</span>
                        {item.isActive !== false ? (
                          <span className="text-emerald-400 font-semibold">● Active</span>
                        ) : (
                          <span className="text-red-400 font-semibold">● Off</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditModal(item, item.itemType)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-semibold cursor-pointer">
                          <Edit2 size={12} /> Edit
                        </button>
                        {isSuperAdmin && (
                          <button onClick={() => openDeleteConfirm(item, item.itemType)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold cursor-pointer">
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Modal: Add Class */}
      {addClassModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2"><BookOpen size={18} /> Add New Class</h3>
              <button onClick={() => setAddClassModalOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>
            <form onSubmit={handleAddClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Class Name <span className="text-red-400">*</span></label>
                <input type="text" required value={newClassName} onChange={(e) => setNewClassName(e.target.value)} placeholder="e.g. Class 11, Competitive Exam"
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddClassModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={submitting || !newClassName.trim()} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-slate-950 text-sm font-bold cursor-pointer hover:bg-sky-400 disabled:opacity-40 transition-all">
                  {submitting ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Subject */}
      {addSubjectModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-purple-400 flex items-center gap-2"><Layers size={18} /> Add New Subject</h3>
              <button onClick={() => setAddSubjectModalOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>
            <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Parent Class <span className="text-red-400">*</span></label>
                <select required value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 cursor-pointer">
                  <option value="">Select Class</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Subject Name <span className="text-red-400">*</span></label>
                <input type="text" required value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="e.g. Physics, Mathematics"
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 placeholder:text-slate-600" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setAddSubjectModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={submitting || !newSubjectName.trim() || !selectedClassId} className="flex-1 py-2.5 rounded-lg bg-purple-500 text-white text-sm font-bold cursor-pointer hover:bg-purple-400 disabled:opacity-40 transition-all">
                  {submitting ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit */}
      {editModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2"><Edit2 size={18} /> Edit {selectedItem.type === 'class' ? 'Class' : 'Subject'}</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Name <span className="text-red-400">*</span></label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-sky-500/50" />
              </div>
              {selectedItem.type === 'subject' && (
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">Parent Class</label>
                  <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 cursor-pointer">
                    {classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5">Status</label>
                <select value={editIsActive ? 'true' : 'false'} onChange={(e) => setEditIsActive(e.target.value === 'true')}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500/50 cursor-pointer">
                  <option value="true">Active</option>
                  <option value="false">Deactivated</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={submitting || !editName.trim()} className="flex-1 py-2.5 rounded-lg bg-sky-500 text-slate-950 text-sm font-bold cursor-pointer hover:bg-sky-400 disabled:opacity-40 transition-all">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: SOFT DELETE CONFIRMATION WITH TYPED NAME & 30-DAY RETENTION ─── */}
      {deleteConfirmOpen && deleteItem && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                <AlertTriangle size={20} /> Move to Recycle Bin ({deleteItemType === 'class' ? 'Class' : 'Subject'})
              </h3>
              <button onClick={() => setDeleteConfirmOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>

            <div className="mb-5 space-y-3">
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300 space-y-1">
                <p className="font-semibold text-rose-200 text-sm flex items-center gap-1.5">
                  <Clock size={15} /> 30-Day Retention Period Notice
                </p>
                <p>
                  Deleting <strong>"{deleteItem.name}"</strong> will move it to the <strong>Recycle Bin</strong> for <strong>30 days</strong>.
                </p>
                <p className="text-slate-400">
                  During these 30 days, it can be restored (unbinned) at any time from the Recycle Bin tab. After 30 days, it will be automatically and permanently deleted.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  To confirm, type <span className="text-rose-400 font-extrabold select-all">{deleteItem.name}</span> below:
                </label>
                <input
                  type="text"
                  value={confirmNameInput}
                  onChange={(e) => setConfirmNameInput(e.target.value)}
                  placeholder={`Type "${deleteItem.name}"`}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-white font-semibold text-sm focus:outline-none focus:border-rose-500/70 placeholder:text-slate-600"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteToBin}
                disabled={submitting || !isDeleteNameMatched || !isSuperAdmin}
                className="flex-1 py-2.5 rounded-lg bg-rose-500 text-white text-sm font-bold cursor-pointer hover:bg-rose-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-500/20"
              >
                {submitting ? 'Moving to Bin...' : 'Move to Recycle Bin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PERMANENT DELETE CONFIRMATION (HIGH-SECURITY) ─────────────── */}
      {permDeleteModalOpen && permDeleteItem && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
              <h3 className="text-lg font-extrabold text-rose-400 flex items-center gap-2">
                <ShieldAlert size={22} className="text-rose-500 shrink-0" /> Permanent Erasure Warning
              </h3>
              <button onClick={() => setPermDeleteModalOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>

            <div className="space-y-3">
              <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-4 text-xs text-rose-200 space-y-2">
                <p className="font-extrabold text-rose-300 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ Irreversible Database Erasure
                </p>
                <p>
                  You are about to permanently delete <strong>"{permDeleteItem.name}"</strong> from the database.
                </p>
                <p className="text-rose-400 font-semibold">
                  Once deleted, this item CANNOT be restored or unbinned. All associated orphan topics will be permanently destroyed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  To confirm PERMANENT erasure, type <span className="text-rose-400 font-extrabold select-all">{permDeleteItem.name}</span> below:
                </label>
                <input
                  type="text"
                  value={permConfirmInput}
                  onChange={(e) => setPermConfirmInput(e.target.value)}
                  placeholder={`Type "${permDeleteItem.name}"`}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/60 border border-rose-500/40 text-white font-bold text-sm focus:outline-none focus:border-rose-500 placeholder:text-slate-600"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPermDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPermanentDelete}
                disabled={submitting || !isPermNameMatched || !isSuperAdmin}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-extrabold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-600/30"
              >
                {submitting ? 'Erasing Forever...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Merge Subjects */}
      {mergeModalOpen && mergeSource && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-violet-400 flex items-center gap-2"><Merge size={18} /> Merge Subject</h3>
              <button onClick={() => setMergeModalOpen(false)} className="text-slate-500 hover:text-white text-xl cursor-pointer">×</button>
            </div>

            <div className="mb-5">
              <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 mb-4">
                <p className="text-sm text-violet-300">
                  All blogs and topics from <strong>"{mergeSource.name}"</strong> will be moved to the target subject. The source subject will be deleted after merge.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Source (will be removed)</label>
                  <div className="px-3 py-2.5 rounded-lg bg-black/30 border border-rose-500/30 text-rose-300 text-sm font-semibold">
                    {mergeSource.name}
                    <span className="ml-2 text-[10px] text-slate-500">
                      ({mergeSource.blogCount} blogs, {mergeSource.topicCount} topics)
                    </span>
                  </div>
                </div>
                <div className="text-center text-slate-500 text-xs">↓ merge into ↓</div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target (will keep)</label>
                  {mergeClassSubjects.length === 0 ? (
                    <div className="px-3 py-2.5 rounded-lg bg-black/30 border border-white/10 text-slate-500 text-sm">
                      No other subjects in this class to merge with.
                    </div>
                  ) : (
                    <select value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-300 text-sm font-semibold focus:outline-none focus:border-emerald-500/50 cursor-pointer">
                      {mergeClassSubjects.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.blogCount} blogs, {s.topicCount} topics)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setMergeModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-white/10 text-slate-400 text-sm font-semibold cursor-pointer hover:bg-white/5 transition-all">
                Cancel
              </button>
              <button onClick={handleMerge} disabled={submitting || !mergeTargetId || mergeClassSubjects.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-violet-500 text-white text-sm font-bold cursor-pointer hover:bg-violet-400 disabled:opacity-40 transition-all">
                {submitting ? 'Merging...' : 'Merge Subjects'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
