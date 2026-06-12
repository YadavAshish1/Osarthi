import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../utils/mediaUrl';
import {
  BookOpen,
  Briefcase,
  Camera,
  Check,
  GraduationCap,
  Pencil,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef();

  // Editable form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);

  useEffect(() => {
    api.get('/profile').then((r) => {
      setProfile(r.data);
      setName(r.data.name || '');
      setBio(r.data.bio || '');
      setEducation(r.data.education || []);
      setExperience(r.data.experience || []);
      setLoading(false);
    });
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append('avatar', file);
      const res = await api.post('/profile/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((p) => ({ ...p, avatar: res.data.avatar }));
      await refreshUser();
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/profile', { name, bio, education, experience });
      setProfile(res.data);
      await refreshUser();
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(profile.name || '');
    setBio(profile.bio || '');
    setEducation(profile.education || []);
    setExperience(profile.experience || []);
    setEditing(false);
  };

  const addEducation = () =>
    setEducation((e) => [...e, { institution: '', degree: '', year: '' }]);
  const updateEducation = (i, field, val) =>
    setEducation((e) => e.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  const removeEducation = (i) => setEducation((e) => e.filter((_, idx) => idx !== i));

  const addExperience = () =>
    setExperience((e) => [...e, { title: '', organization: '', duration: '' }]);
  const updateExperience = (i, field, val) =>
    setExperience((e) => e.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  const removeExperience = (i) => setExperience((e) => e.filter((_, idx) => idx !== i));

  const getAvatarSrc = () => {
    if (!profile?.avatar) return null;
    if (profile.avatar.startsWith('http')) return profile.avatar;
    return mediaUrl(profile.avatar);
  };

  const defaultName = profile?.email?.split('@')[0] || '';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-10 px-4">
      {/* Header Card */}
      <div className="glass mb-8 rounded-3xl p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-brand-500/30 bg-slate-800 shadow-xl">
              {getAvatarSrc() ? (
                <img src={getAvatarSrc()} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-500">
                  <User className="h-14 w-14" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
              title="Change photo"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-500 disabled:opacity-50 transition"
            >
              {avatarUploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Name / Email / Role */}
          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={defaultName}
                className="mb-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-2xl font-bold outline-none focus:border-brand-500"
              />
            ) : (
              <h1 className="mb-1 text-3xl font-bold">{profile.name || defaultName}</h1>
            )}
            <p className="text-sm text-slate-400">{profile.email}</p>
            <span className="mt-2 inline-block rounded-full bg-brand-600/20 px-3 py-0.5 text-xs font-semibold capitalize text-brand-300">
              {profile.role}
            </span>
          </div>

          {/* Edit / Save buttons */}
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold hover:bg-brand-500 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : saved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
              >
                <Pencil className="h-4 w-4" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mt-6">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">Bio</label>
          {editing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell something about yourself…"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed outline-none focus:border-brand-500"
            />
          ) : (
            <p className="text-sm leading-relaxed text-slate-300">
              {profile.bio || <span className="text-slate-500 italic">No bio yet. Click Edit Profile to add one.</span>}
            </p>
          )}
        </div>
      </div>

      {/* Education */}
      <div className="glass mb-6 rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <GraduationCap className="h-5 w-5 text-brand-400" /> Education
          </h2>
          {editing && (
            <button
              onClick={addEducation}
              className="flex items-center gap-1 rounded-lg bg-brand-600/20 px-3 py-1.5 text-xs text-brand-300 hover:bg-brand-600/30"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>

        {(editing ? education : profile.education || []).length === 0 ? (
          <p className="text-sm italic text-slate-500">No education details added.</p>
        ) : (
          <div className="space-y-4">
            {(editing ? education : profile.education || []).map((edu, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/3 p-4">
                {editing ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      value={edu.institution}
                      onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                      placeholder="Institution"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                    <input
                      value={edu.degree}
                      onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                      placeholder="Degree / Field"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                    <div className="flex gap-2">
                      <input
                        value={edu.year}
                        onChange={(e) => updateEducation(i, 'year', e.target.value)}
                        placeholder="Year (e.g. 2020)"
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-500"
                      />
                      <button onClick={() => removeEducation(i)} className="text-red-400/70 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-slate-200">{edu.degree}</p>
                    <p className="text-sm text-slate-400">{edu.institution}</p>
                    {edu.year && <p className="mt-0.5 text-xs text-slate-500">{edu.year}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Briefcase className="h-5 w-5 text-brand-400" /> Experience
          </h2>
          {editing && (
            <button
              onClick={addExperience}
              className="flex items-center gap-1 rounded-lg bg-brand-600/20 px-3 py-1.5 text-xs text-brand-300 hover:bg-brand-600/30"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>

        {(editing ? experience : profile.experience || []).length === 0 ? (
          <p className="text-sm italic text-slate-500">No experience details added.</p>
        ) : (
          <div className="space-y-4">
            {(editing ? experience : profile.experience || []).map((exp, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/3 p-4">
                {editing ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      value={exp.title}
                      onChange={(e) => updateExperience(i, 'title', e.target.value)}
                      placeholder="Role / Title"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                    <input
                      value={exp.organization}
                      onChange={(e) => updateExperience(i, 'organization', e.target.value)}
                      placeholder="Organization"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                    <div className="flex gap-2">
                      <input
                        value={exp.duration}
                        onChange={(e) => updateExperience(i, 'duration', e.target.value)}
                        placeholder="Duration (e.g. 2021–now)"
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-500"
                      />
                      <button onClick={() => removeExperience(i)} className="text-red-400/70 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-slate-200">{exp.title}</p>
                    <p className="text-sm text-slate-400">{exp.organization}</p>
                    {exp.duration && <p className="mt-0.5 text-xs text-slate-500">{exp.duration}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
