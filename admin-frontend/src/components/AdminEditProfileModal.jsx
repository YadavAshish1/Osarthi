import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Camera,
  Trash2,
  Plus,
  Briefcase,
  GraduationCap,
  Check,
  Loader2,
  Mail,
  Shield,
} from 'lucide-react';
import { api } from '../api/client';

export default function AdminEditProfileModal({ isOpen, onClose, user, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('general');
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [educationList, setEducationList] = useState(
    Array.isArray(user?.education) && user.education.length > 0
      ? user.education
      : [{ institution: '', degree: '', year: '' }]
  );

  const [experienceList, setExperienceList] = useState(
    Array.isArray(user?.experience) && user.experience.length > 0
      ? user.experience
      : [{ title: '', organization: '', duration: '' }]
  );

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setEducationList(
        Array.isArray(user.education) && user.education.length > 0
          ? user.education
          : [{ institution: '', degree: '', year: '' }]
      );
      setExperienceList(
        Array.isArray(user.experience) && user.experience.length > 0
          ? user.experience
          : [{ title: '', organization: '', duration: '' }]
      );
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Avatar Upload Handler
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setErrorMsg('Image size exceeds 500 KB limit. Please choose a smaller file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      const { data } = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.avatar) {
        setAvatar(data.avatar);
        onUserUpdated({ avatar: data.avatar });
        setSuccessMsg('Profile picture updated successfully!');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setErrorMsg('');
    try {
      await api.delete('/profile/avatar');
      setAvatar('');
      onUserUpdated({ avatar: '' });
      setSuccessMsg('Profile picture removed.');
    } catch (err) {
      setErrorMsg('Failed to remove profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Education handlers
  const handleAddEducation = () => {
    setEducationList((prev) => [...prev, { institution: '', degree: '', year: '' }]);
  };

  const handleUpdateEducation = (idx, field, val) => {
    setEducationList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveEducation = (idx) => {
    setEducationList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Experience handlers
  const handleAddExperience = () => {
    setExperienceList((prev) => [...prev, { title: '', organization: '', duration: '' }]);
  };

  const handleUpdateExperience = (idx, field, val) => {
    setExperienceList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveExperience = (idx) => {
    setExperienceList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const cleanEducation = educationList.filter(
        (e) => (e.institution && e.institution.trim()) || (e.degree && e.degree.trim())
      );
      const cleanExperience = experienceList.filter(
        (e) => (e.title && e.title.trim()) || (e.organization && e.organization.trim())
      );

      const payload = {
        name: name.trim(),
        bio: bio.trim(),
        education: cleanEducation,
        experience: cleanExperience,
      };

      const { data } = await api.put('/profile', payload);
      onUserUpdated(data);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white">Edit Profile</h3>
              <p className="text-xs text-slate-400">Manage your educator & administrator profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center border-b border-white/10 px-6 md:px-8 bg-slate-950/30 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <User size={14} />
            <span>General & Bio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('education')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'education'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap size={14} />
            <span>Education</span>
            {educationList.some((e) => e.degree || e.institution) && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('experience')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'experience'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase size={14} />
            <span>Experience</span>
            {experienceList.some((e) => e.title || e.organization) && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            )}
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
            <Check size={14} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Avatar Section */}
              <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="relative shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={name}
                      className="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-xl font-bold uppercase border border-sky-500/30">
                      {name?.[0] || 'A'}
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                      <Loader2 size={18} className="animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white">Profile Photo</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    JPG, PNG, WebP up to 500 KB
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Camera size={13} />
                      <span>{avatar ? 'Change' : 'Upload'}</span>
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Yaduvanshi"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950/60 text-sm text-white focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              {/* Email & Role display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-slate-400">
                    <Mail size={13} />
                    <span className="truncate">{user?.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Assigned Role
                  </label>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 text-xs text-sky-400 font-semibold uppercase">
                    <Shield size={13} />
                    <span>{user?.role}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Bio & Educator Statement
                  </label>
                  <span className="text-[11px] text-slate-500">{bio.length}/500</span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  placeholder="Share a short bio, subjects taught, academic achievements, or teaching philosophy..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950/60 text-sm text-white focus:outline-none focus:border-sky-500 transition-all resize-none leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This bio appears on your public teacher profile and educator spotlight cards.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: EDUCATION */}
          {activeTab === 'education' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h4 className="text-sm font-semibold text-white">Qualifications & Degrees</h4>
                  <p className="text-xs text-slate-400">Colleges, universities, or academic honors</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Degree</span>
                </button>
              </div>

              {educationList.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                      Degree #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEducation(idx)}
                      className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Degree / Course</label>
                      <input
                        type="text"
                        value={item.degree || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                        placeholder="e.g. M.Sc Physics, Ph.D"
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-950/60 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">University / Institute</label>
                      <input
                        type="text"
                        value={item.institution || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                        placeholder="e.g. Delhi University"
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-950/60 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">Year / Period</label>
                      <input
                        type="text"
                        value={item.year || ''}
                        onChange={(e) => handleUpdateEducation(idx, 'year', e.target.value)}
                        placeholder="e.g. 2016 - 2018"
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-950/60 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: EXPERIENCE */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div>
                  <h4 className="text-sm font-semibold text-white">Teaching & Work Experience</h4>
                  <p className="text-xs text-slate-400">Schools, coaching institutes, or platforms</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Role</span>
                </button>
              </div>

              {experienceList.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                      Position #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(idx)}
                      className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Designation / Role</label>
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'title', e.target.value)}
                        placeholder="e.g. Senior Hindi Educator"
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-950/60 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Organization / School</label>
                      <input
                        type="text"
                        value={item.organization || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'organization', e.target.value)}
                        placeholder="e.g. Medhashine / Kendriya Vidyalaya"
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-950/60 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">Duration / Years</label>
                      <input
                        type="text"
                        value={item.duration || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'duration', e.target.value)}
                        placeholder="e.g. 2020 - Present (4+ years)"
                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-950/60 text-xs text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving Changes…</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
