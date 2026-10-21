"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User as UserIcon,
  GraduationCap,
  Briefcase,
  Plus,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { api } from "@/lib/api";
import { User } from "@/context/AuthContext";
import { toast } from "sonner";

interface EducationItem {
  institution?: string;
  degree?: string;
  year?: string;
}

interface ExperienceItem {
  title?: string;
  organization?: string;
  duration?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdated: (updatedUser: any) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "education" | "experience">("general");

  // Form states
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [classId, setClassId] = useState<string>(
    typeof user.classRef === "object" && user.classRef?._id
      ? user.classRef._id
      : typeof user.classRef === "string"
      ? user.classRef
      : ""
  );

  const [educationList, setEducationList] = useState<EducationItem[]>(
    Array.isArray(user.education) && user.education.length > 0
      ? user.education
      : [{ institution: "", degree: "", year: "" }]
  );

  const [experienceList, setExperienceList] = useState<ExperienceItem[]>(
    Array.isArray(user.experience) && user.experience.length > 0
      ? user.experience
      : [{ title: "", organization: "", duration: "" }]
  );

  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // Sync state when modal opens or user updates
  useEffect(() => {
    if (isOpen) {
      setName(user.name || "");
      setBio(user.bio || "");
      setClassId(
        typeof user.classRef === "object" && user.classRef?._id
          ? user.classRef._id
          : typeof user.classRef === "string"
          ? user.classRef
          : ""
      );
      setEducationList(
        Array.isArray(user.education) && user.education.length > 0
          ? user.education
          : [{ institution: "", degree: "", year: "" }]
      );
      setExperienceList(
        Array.isArray(user.experience) && user.experience.length > 0
          ? user.experience
          : [{ title: "", organization: "", duration: "" }]
      );
    }
  }, [isOpen, user]);

  // Fetch available classes from explore tree
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const { data } = await api.get("/explore/tree");
        if (Array.isArray(data)) {
          setAvailableClasses(
            data.map((c: any) => ({
              id: c._id,
              name: c.name,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load classes for profile edit:", err);
      }
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  // Education handlers
  const handleAddEducation = () => {
    setEducationList((prev) => [...prev, { institution: "", degree: "", year: "" }]);
  };

  const handleUpdateEducation = (index: number, field: keyof EducationItem, val: string) => {
    setEducationList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveEducation = (index: number) => {
    setEducationList((prev) => prev.filter((_, i) => i !== index));
  };

  // Experience handlers
  const handleAddExperience = () => {
    setExperienceList((prev) => [...prev, { title: "", organization: "", duration: "" }]);
  };

  const handleUpdateExperience = (index: number, field: keyof ExperienceItem, val: string) => {
    setExperienceList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveExperience = (index: number) => {
    setExperienceList((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Full name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      // Filter out empty rows
      const cleanEducation = educationList.filter(
        (e) => (e.institution && e.institution.trim()) || (e.degree && e.degree.trim())
      );
      const cleanExperience = experienceList.filter(
        (e) => (e.title && e.title.trim()) || (e.organization && e.organization.trim())
      );

      const payload: any = {
        name: name.trim(),
        bio: bio.trim(),
        education: cleanEducation,
        experience: cleanExperience,
      };

      if (classId) {
        payload.classId = classId;
      } else {
        payload.classId = null;
      }

      const { data } = await api.put("/profile", payload);
      toast.success("Profile updated successfully!");
      onProfileUpdated(data);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E5E1D8] shadow-2xl z-10 overflow-hidden font-ui flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-[#E5E1D8] bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#A84C32]/10 text-[#A84C32] flex items-center justify-center border border-[#A84C32]/20">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-display text-xl md:text-2xl font-semibold text-[#1A1A1A]">
                Edit Profile
              </h3>
              <p className="text-xs text-[#5C5A55] mt-0.5">
                Update your personal information, bio, and background
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-[#5C5A55] hover:text-[#1A1A1A] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-[#E5E1D8] px-6 md:px-8 bg-white gap-2 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "general"
                ? "border-[#A84C32] text-[#A84C32]"
                : "border-transparent text-[#5C5A55] hover:text-[#1A1A1A]"
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>General Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("education")}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "education"
                ? "border-[#A84C32] text-[#A84C32]"
                : "border-transparent text-[#5C5A55] hover:text-[#1A1A1A]"
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Education</span>
            {educationList.some((e) => e.degree || e.institution) && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#A84C32]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("experience")}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "experience"
                ? "border-[#A84C32] text-[#A84C32]"
                : "border-transparent text-[#5C5A55] hover:text-[#1A1A1A]"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Experience</span>
            {experienceList.some((e) => e.title || e.organization) && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#A84C32]" />
            )}
          </button>
        </div>

        {/* Modal Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* TAB 1: GENERAL INFO */}
          {activeTab === "general" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Yaduvanshi"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#A84C32] focus:bg-white transition-all"
                />
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5A55] mb-1.5">
                  Email Address (Verified)
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#F5F2EB] text-sm text-[#5C5A55] cursor-not-allowed"
                />
              </div>

              {/* Class (For Students) */}
              {user.role === "student" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
                    Class / Grade
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#A84C32] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">Select your class (optional)</option>
                    {availableClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#5C5A55] mt-1">
                    Selecting your class tailors recommended insights and chapters to your syllabus.
                  </p>
                </div>
              )}

              {/* Bio / About */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]">
                    Bio / About Me
                  </label>
                  <span
                    className={`text-[11px] ${
                      bio.length > 450 ? "text-amber-600 font-bold" : "text-[#5C5A55]"
                    }`}
                  >
                    {bio.length}/500
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 500))}
                  placeholder="Share a short summary about your academic interests, subjects you love, or teaching background..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] bg-[#FAF8F5] text-sm text-[#1A1A1A] focus:outline-none focus:border-[#A84C32] focus:bg-white transition-all leading-relaxed resize-none"
                />
                <p className="text-[11px] text-[#5C5A55] mt-1">
                  Your bio appears on your public profile and helps educators and peers connect with you.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: EDUCATION */}
          {activeTab === "education" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">Education History</h4>
                  <p className="text-xs text-[#5C5A55]">
                    Degrees, colleges, schools, or certifications
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#A84C32]/10 text-[#A84C32] hover:bg-[#A84C32] hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Another</span>
                </button>
              </div>

              {educationList.length === 0 ? (
                <div className="text-center py-8 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5E1D8]">
                  <GraduationCap className="h-8 w-8 text-[#A84C32]/40 mx-auto mb-2" />
                  <p className="text-xs text-[#5C5A55]">No education entries added yet.</p>
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="mt-3 text-xs text-[#A84C32] font-semibold hover:underline"
                  >
                    + Add your first degree or school
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {educationList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-[#E5E1D8] bg-[#FAF8F5] relative group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-[#A84C32] uppercase tracking-wider">
                          Entry #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(idx)}
                          className="text-[#5C5A55] hover:text-red-600 transition-colors p-1"
                          title="Remove this item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                            Degree / Course
                          </label>
                          <input
                            type="text"
                            value={item.degree || ""}
                            onChange={(e) => handleUpdateEducation(idx, "degree", e.target.value)}
                            placeholder="e.g. M.A. Hindi Literature, B.Sc"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                            Institution / Board / University
                          </label>
                          <input
                            type="text"
                            value={item.institution || ""}
                            onChange={(e) =>
                              handleUpdateEducation(idx, "institution", e.target.value)
                            }
                            placeholder="e.g. Banaras Hindu University"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                            Year / Duration
                          </label>
                          <input
                            type="text"
                            value={item.year || ""}
                            onChange={(e) => handleUpdateEducation(idx, "year", e.target.value)}
                            placeholder="e.g. 2018 - 2020 or Class of 2022"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXPERIENCE */}
          {activeTab === "experience" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">Experience History</h4>
                  <p className="text-xs text-[#5C5A55]">
                    Teaching positions, academic projects, or professional roles
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#A84C32]/10 text-[#A84C32] hover:bg-[#A84C32] hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Another</span>
                </button>
              </div>

              {experienceList.length === 0 ? (
                <div className="text-center py-8 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E5E1D8]">
                  <Briefcase className="h-8 w-8 text-[#A84C32]/40 mx-auto mb-2" />
                  <p className="text-xs text-[#5C5A55]">No experience entries added yet.</p>
                  <button
                    type="button"
                    onClick={handleAddExperience}
                    className="mt-3 text-xs text-[#A84C32] font-semibold hover:underline"
                  >
                    + Add your first role or position
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {experienceList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-[#E5E1D8] bg-[#FAF8F5] relative group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold text-[#A84C32] uppercase tracking-wider">
                          Role #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(idx)}
                          className="text-[#5C5A55] hover:text-red-600 transition-colors p-1"
                          title="Remove this item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                            Title / Role
                          </label>
                          <input
                            type="text"
                            value={item.title || ""}
                            onChange={(e) => handleUpdateExperience(idx, "title", e.target.value)}
                            placeholder="e.g. Senior Hindi Faculty"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                            Organization / School / Platform
                          </label>
                          <input
                            type="text"
                            value={item.organization || ""}
                            onChange={(e) =>
                              handleUpdateExperience(idx, "organization", e.target.value)
                            }
                            placeholder="e.g. Kendriya Vidyalaya / Medhashine"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-[#1A1A1A] mb-1">
                            Duration / Years
                          </label>
                          <input
                            type="text"
                            value={item.duration || ""}
                            onChange={(e) =>
                              handleUpdateExperience(idx, "duration", e.target.value)
                            }
                            placeholder="e.g. 2019 - Present (5 years)"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:border-[#A84C32]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full border border-[#E5E1D8] bg-white text-[#5C5A55] hover:text-[#1A1A1A] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-7 py-2.5 rounded-full bg-[#1A1A1A] text-white hover:bg-[#A84C32] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes…</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
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
