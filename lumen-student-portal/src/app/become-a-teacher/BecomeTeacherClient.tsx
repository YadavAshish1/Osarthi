"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  GraduationCap,
  Briefcase,
  Calendar,
  Mail,
  User as UserIcon,
  Phone,
  BookOpen,
  FileText,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

interface ExperienceEntry {
  title: string;
  organization: string;
  duration: string;
}

export default function BecomeTeacherClient() {
  const router = useRouter();
  const { user, openAuth, sendOtp, register } = useAuth();

  const [view, setView] = useState<"overview" | "form" | "submitted">("overview");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");

  // OTP Signup state for guest users
  const [password, setPassword] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);

  const handleSendOtpCode = async () => {
    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendOtp(name.trim(), email.toLowerCase().trim(), password, "student");
      if (res.ok) {
        setOtpSent(true);
        toast.success("Verification code sent to " + email);
      } else {
        toast.error(res.error || "Failed to send verification code");
      }
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtpAndSignup = async () => {
    if (!otp || otp.trim().length !== 6) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await register(name.trim(), email.toLowerCase().trim(), password, "student", otp.trim());
      if (res.ok) {
        toast.success("Account created & email verified! Continue filling your details.");
      } else {
        toast.error(res.error || "Verification failed");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const [educationList, setEducationList] = useState<EducationEntry[]>([
    { degree: "", institution: "", year: "" },
  ]);

  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [requestedSubjects, setRequestedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState<string>("");

  const [experienceList, setExperienceList] = useState<ExperienceEntry[]>([
    { title: "", organization: "", duration: "" },
  ]);

  const [bio, setBio] = useState<string>("");
  const [motivation, setMotivation] = useState<string>("");

  // Populate from logged-in user if available
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  // Fetch unique subjects & existing application status
  useEffect(() => {
    (async () => {
      try {
        const { data: subData } = await api.get("/explore/subjects");
        if (Array.isArray(subData) && subData.length > 0) {
          const names = subData.map((s: any) => s.name).filter(Boolean);
          if (names.length > 0) {
            setAvailableSubjects(Array.from(new Set<string>(names)));
          }
        }
      } catch {}

      try {
        const { data: statusData } = await api.get("/teacher-applications/my-status");
        if (statusData?.application) {
          setExistingStatus(statusData.application.status);
        }
      } catch {}
    })();
  }, []);

  const handleAddEducation = () => {
    setEducationList((prev) => [...prev, { degree: "", institution: "", year: "" }]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducationList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEducationChange = (index: number, field: keyof EducationEntry, value: string) => {
    setEducationList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddExperience = () => {
    setExperienceList((prev) => [...prev, { title: "", organization: "", duration: "" }]);
  };

  const handleRemoveExperience = (index: number) => {
    setExperienceList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (index: number, field: keyof ExperienceEntry, value: string) => {
    setExperienceList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleAddProposedSubject = () => {
    const trimmed = customSubject.trim();
    if (!trimmed) return;

    // Check if it already exists in available DB subjects
    const existingMatch = availableSubjects.find(
      (s) => s.toLowerCase().trim() === trimmed.toLowerCase()
    );

    if (existingMatch) {
      if (!selectedSubjects.includes(existingMatch)) {
        setSelectedSubjects((prev) => [...prev, existingMatch]);
        toast.success(`Selected "${existingMatch}" from existing subjects.`);
      }
      setCustomSubject("");
      return;
    }

    if (!requestedSubjects.includes(trimmed)) {
      setRequestedSubjects((prev) => [...prev, trimmed]);
      toast.success(`Added "${trimmed}" to proposed subjects for admin approval.`);
    }
    setCustomSubject("");
  };

  const handleRemoveProposedSubject = (sub: string) => {
    setRequestedSubjects((prev) => prev.filter((s) => s !== sub));
  };

  const calculateAge = (dobString: string): number | null => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!user) {
        toast.error("Please complete Email OTP Verification & Sign Up to proceed");
        return false;
      }
      if (!name.trim()) {
        toast.error("Please enter your full name");
        return false;
      }
      if (!email.trim() || !email.includes("@")) {
        toast.error("Please enter a valid email address");
        return false;
      }
      if (!dateOfBirth) {
        toast.error("Please select your date of birth");
        return false;
      }
      const age = calculateAge(dateOfBirth);
      if (age !== null && age <= 18) {
        toast.error("You must be over 18 years old to apply as a teacher on Medhashine.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      const hasValidEdu = educationList.some((e) => e.degree.trim() && e.institution.trim());
      if (!hasValidEdu) {
        toast.error("Please provide at least one degree and institution");
        return false;
      }
      if (selectedSubjects.length === 0 && requestedSubjects.length === 0) {
        toast.error("Please select at least one existing subject or propose a new subject to teach");
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!bio.trim() || bio.trim().length < 20) {
        toast.error("Please enter a brief bio (at least 20 characters)");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth || undefined,
        education: educationList.filter((e) => e.degree.trim() && e.institution.trim()),
        subjects: selectedSubjects,
        requestedSubjects: requestedSubjects,
        experience: experienceList.filter((e) => e.title.trim() && e.organization.trim()),
        bio,
        motivation,
      };

      const { data } = await api.post("/teacher-applications", payload);
      toast.success(data.message || "Application submitted successfully!");
      setView("submitted");
      setExistingStatus("pending");
    } catch (err: any) {
      const msg =
        formatApiErrorDetail(err?.response?.data?.message) ||
        err.message ||
        "Failed to submit application";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A]">
      {/* ── Top Header Hero ── */}
      <section className="relative bg-[#1A1A1A] text-white py-16 md:py-24 overflow-hidden border-b border-[#A84C32]/20">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#A84C32_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative max-w-screen-xl mx-auto px-6 md:px-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#A84C32]/20 text-[#E8A88A] border border-[#A84C32]/30 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Educator Onboarding
          </div>
          <h1 className="font-serif-display text-4xl md:text-6xl font-medium tracking-tight mb-4">
            Become a <span className="text-[#E8A88A]">Medhashine</span> Teacher
          </h1>
          <p className="font-ui text-base md:text-lg text-[#FAF8F5]/70 max-w-2xl mx-auto">
            Empower thousands of ambitious students, share your conceptual mastery, and join an elite network of dedicated educators.
          </p>

          {existingStatus && (
            <div className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
              <span className="text-sm text-white/80 font-medium">Your Application Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  existingStatus === "approved"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : existingStatus === "rejected"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {existingStatus}
              </span>
              <Link
                href="/profile"
                className="text-xs text-[#E8A88A] hover:underline font-semibold ml-2"
              >
                View in Profile →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── MAIN CONTENT AREA ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-12 py-16">
        {view === "overview" && (
          <div className="space-y-20">
            {/* ── 3-Step Process Cards ── */}
            <div>
              <div className="text-center max-w-xl mx-auto mb-14">
                <h2 className="font-serif-display text-3xl md:text-4xl font-medium mb-3 text-[#1A1A1A]">
                  How Our Platform Works
                </h2>
                <p className="font-ui text-sm text-[#5C5A55]">
                  Three simple steps to start teaching and building your online audience.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Step 1 */}
                <div className="relative bg-white rounded-3xl p-8 border border-[#E5E1D8] shadow-sm hover:shadow-md transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-[#A84C32]/10 text-[#A84C32] flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                    1
                  </div>
                  <h3 className="font-serif-display text-2xl font-medium mb-3 text-[#1A1A1A]">
                    Sign Up & Profile
                  </h3>
                  <p className="font-ui text-sm text-[#5C5A55] leading-relaxed mb-6">
                    Fill out our quick educator application with your qualifications, subject expertise, and teaching experience.
                  </p>
                  <div className="flex items-center text-xs font-semibold text-[#A84C32]">
                    Multi-step application flow <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative bg-white rounded-3xl p-8 border border-[#E5E1D8] shadow-sm hover:shadow-md transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-[#A84C32]/10 text-[#A84C32] flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                    2
                  </div>
                  <h3 className="font-serif-display text-2xl font-medium mb-3 text-[#1A1A1A]">
                    Get Approved
                  </h3>
                  <p className="font-ui text-sm text-[#5C5A55] leading-relaxed mb-6">
                    Our academic review team evaluates your credentials. Once verified, you will receive an instant email invitation.
                  </p>
                  <div className="flex items-center text-xs font-semibold text-[#A84C32]">
                    Fast admin verification <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative bg-white rounded-3xl p-8 border border-[#E5E1D8] shadow-sm hover:shadow-md transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-[#A84C32]/10 text-[#A84C32] flex items-center justify-center font-bold text-xl mb-6 group-hover:scale-110 transition-transform">
                    3
                  </div>
                  <h3 className="font-serif-display text-2xl font-medium mb-3 text-[#1A1A1A]">
                    Start Posting
                  </h3>
                  <p className="font-ui text-sm text-[#5C5A55] leading-relaxed mb-6">
                    Access your teacher portal dashboard, write rich interactive insights, create quizzes, and connect with eager learners.
                  </p>
                  <div className="flex items-center text-xs font-semibold text-[#A84C32]">
                    Dedicated Teacher Portal <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </div>
              </div>

              {/* Call to Action Button */}
              <div className="mt-14 text-center">
                <button
                  onClick={() => setView("form")}
                  className="group inline-flex items-center gap-3 px-10 py-4 rounded-full font-ui text-base font-semibold text-white bg-gradient-to-r from-[#A84C32] to-[#8B3A25] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Create a Profile Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* ── Feature Highlights Grid ── */}
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#E5E1D8]">
              <h3 className="font-serif-display text-2xl md:text-3xl font-medium mb-8 text-[#1A1A1A]">
                Why Educators Choose Medhashine
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] mb-3">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-base text-[#1A1A1A]">Verified Educator Badge</h4>
                  <p className="text-xs text-[#5C5A55] leading-relaxed">
                    Gain credibility with an official verified badge on all your published articles and teacher directory profile.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] mb-3">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-base text-[#1A1A1A]">Rich Rich-Text Editor</h4>
                  <p className="text-xs text-[#5C5A55] leading-relaxed">
                    Create content with rich formatting, mathematical markups, quotes, diagrams, and image/video embeds effortlessly.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E1D8] flex items-center justify-center text-[#A84C32] mb-3">
                    <Award className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-base text-[#1A1A1A]">Student Engagement Insights</h4>
                  <p className="text-xs text-[#5C5A55] leading-relaxed">
                    Track readers, likes, bookmarks, and direct student appreciation in real-time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MULTI-STEP APPLICATION FORM ── */}
        {view === "form" && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E5E1D8] shadow-sm overflow-hidden">
            {/* Form Progress Header */}
            <div className="bg-[#FAF8F5] px-8 py-6 border-b border-[#E5E1D8]">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setView("overview")}
                  className="text-xs font-medium text-[#5C5A55] hover:text-[#A84C32] flex items-center gap-1"
                >
                  ← Back to Overview
                </button>
                <span className="text-xs font-semibold text-[#A84C32] uppercase tracking-wider">
                  Step {currentStep} of 4
                </span>
              </div>

              {/* Progress Steps Indicator */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { title: "Personal", step: 1 },
                  { title: "Education", step: 2 },
                  { title: "Experience", step: 3 },
                  { title: "Review", step: 4 },
                ].map((s) => (
                  <div key={s.step} className="space-y-1.5">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentStep >= s.step ? "bg-[#A84C32]" : "bg-[#E5E1D8]"
                      }`}
                    />
                    <p
                      className={`text-[11px] font-semibold text-center hidden sm:block ${
                        currentStep >= s.step ? "text-[#1A1A1A]" : "text-[#5C5A55]/60"
                      }`}
                    >
                      {s.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 md:p-10">
              {/* STEP 1: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="font-serif-display text-2xl font-medium text-[#1A1A1A] mb-1">
                      {user ? "Personal Details" : "Sign Up & Verify Email"}
                    </h2>
                    <p className="font-ui text-xs text-[#5C5A55]">
                      {user
                        ? "Verify your contact info and personal details for your teacher profile."
                        : "First, create your Medhashine account with email OTP verification before submitting teacher application details."}
                    </p>
                  </div>

                  {user ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>
                          Account verified as <strong>{user.name}</strong> ({user.email})
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Verified
                      </span>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
                        <span className="text-xs font-bold text-[#A84C32] uppercase tracking-wider">
                          Email OTP Signup
                        </span>
                        <button
                          type="button"
                          onClick={() => openAuth("login")}
                          className="text-xs text-[#A84C32] hover:underline font-semibold"
                        >
                          Already registered? Sign In →
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                          Full Name *
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#5C5A55]" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Dr. Ramesh Yaduvanshi"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                            Email Address *
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#5C5A55]" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="e.g. ramesh@example.com"
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                            Account Password *
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            className="w-full px-4 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] bg-white"
                          />
                        </div>
                      </div>

                      {!otpSent ? (
                        <button
                          type="button"
                          onClick={handleSendOtpCode}
                          disabled={sendingOtp}
                          className="w-full py-3 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {sendingOtp ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Sending OTP Code...
                            </>
                          ) : (
                            <>
                              Send Verification Code via Email <Mail className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-3 pt-2 border-t border-[#E5E1D8] animate-fadeIn">
                          <label className="block text-xs font-semibold text-[#A84C32] uppercase tracking-wider">
                            Enter 6-Digit OTP Code (sent to {email})
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value)}
                              placeholder="123456"
                              className="flex-1 px-4 py-2.5 rounded-xl border border-[#A84C32] text-center tracking-[8px] font-mono text-lg font-bold focus:outline-none bg-white"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtpAndSignup}
                              disabled={verifyingOtp}
                              className="px-6 py-2.5 rounded-xl bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8B3A25] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {verifyingOtp ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  Verify & Sign Up <Check className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3 h-4 w-4 text-[#5C5A55]" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">
                          Date of Birth *
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-[#5C5A55]" />
                          <input
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32]"
                          />
                        </div>
                        {dateOfBirth && (() => {
                          const age = calculateAge(dateOfBirth);
                          if (age === null) return null;
                          if (age <= 18) {
                            return (
                              <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
                                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong>Age: {age} years.</strong> Applicants must be over 18 years old to apply as a teacher on Medhashine.
                                </div>
                              </div>
                            );
                          }
                          return (
                            <p className="mt-1.5 text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-fadeIn">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Age: {age} years (Eligible)
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Education & Subjects */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-fadeIn">
                  <div>
                    <h2 className="font-serif-display text-2xl font-medium text-[#1A1A1A] mb-1">
                      Education & Subject Expertise
                    </h2>
                    <p className="font-ui text-xs text-[#5C5A55]">
                      List your academic degrees and the subjects you want to write insights for.
                    </p>
                  </div>

                  {/* Education List */}
                  <div className="space-y-4">
                    <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                      Academic Qualifications *
                    </label>

                    {educationList.map((edu, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3 relative group"
                      >
                        {educationList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEducation(idx)}
                            className="absolute right-3 top-3 text-[#5C5A55] hover:text-rose-600 transition-colors p-1"
                            title="Remove Education"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[11px] text-[#5C5A55]">Degree / Specialization</span>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => handleEducationChange(idx, "degree", e.target.value)}
                              placeholder="e.g. Ph.D. in Physics"
                              className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[11px] text-[#5C5A55]">Institution / University</span>
                            <input
                              type="text"
                              value={edu.institution}
                              onChange={(e) => handleEducationChange(idx, "institution", e.target.value)}
                              placeholder="e.g. IISc Bangalore"
                              className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] bg-white"
                            />
                          </div>
                        </div>
                        <div className="w-1/3">
                          <span className="text-[11px] text-[#5C5A55]">Completion Year</span>
                          <input
                            type="text"
                            value={edu.year}
                            onChange={(e) => handleEducationChange(idx, "year", e.target.value)}
                            placeholder="e.g. 2018"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] bg-white"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddEducation}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#A84C32] hover:underline cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add Another Qualification
                    </button>
                  </div>

                  {/* Subjects Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">
                        Select Existing Database Subjects *
                      </label>
                      {availableSubjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {availableSubjects.map((sub) => {
                            const isSelected = selectedSubjects.includes(sub);
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => toggleSubject(sub)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#A84C32] text-white border-[#A84C32] shadow-sm"
                                    : "bg-[#FAF8F5] text-[#1A1A1A] border-[#E5E1D8] hover:border-[#A84C32]"
                                }`}
                              >
                                {sub} {isSelected && "✓"}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-[#5C5A55] italic">Loading subjects from database...</p>
                      )}
                    </div>

                    {/* Propose New Subject */}
                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3">
                      <label className="block text-xs font-semibold text-[#A84C32] uppercase tracking-wider">
                        Propose New Subject (Pending Admin Approval)
                      </label>
                      <p className="text-[11px] text-[#5C5A55]">
                        Can't find your subject in the list above? Type it below to request admin to add it to the database.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          placeholder="e.g. व्याकरण, हिंदी पद्य, Robotics..."
                          className="flex-1 px-3.5 py-2 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#A84C32] bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddProposedSubject}
                          className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors shrink-0 cursor-pointer"
                        >
                          Propose Subject
                        </button>
                      </div>

                      {requestedSubjects.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E5E1D8]">
                          {requestedSubjects.map((sub) => (
                            <span
                              key={sub}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium"
                            >
                              {sub} <span className="text-[10px] text-amber-700">(Proposed)</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveProposedSubject(sub)}
                                className="text-amber-700 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Experience & Bio */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-fadeIn">
                  <div>
                    <h2 className="font-serif-display text-2xl font-medium text-[#1A1A1A] mb-1">
                      Experience & Bio
                    </h2>
                    <p className="font-ui text-xs text-[#5C5A55]">
                      Share your teaching background and what drives your commitment to education.
                    </p>
                  </div>

                  {/* Experience List */}
                  <div className="space-y-4">
                    <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">
                      Teaching / Professional Experience
                    </label>

                    {experienceList.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3 relative group"
                      >
                        {experienceList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(idx)}
                            className="absolute right-3 top-3 text-[#5C5A55] hover:text-rose-600 transition-colors p-1"
                            title="Remove Experience"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-[11px] text-[#5C5A55]">Role / Title</span>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => handleExperienceChange(idx, "title", e.target.value)}
                              placeholder="e.g. Senior Physics Faculty"
                              className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[11px] text-[#5C5A55]">Organization / Institute</span>
                            <input
                              type="text"
                              value={exp.organization}
                              onChange={(e) => handleExperienceChange(idx, "organization", e.target.value)}
                              placeholder="e.g. Medhashine Education"
                              className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] bg-white"
                            />
                          </div>
                        </div>
                        <div className="w-1/2">
                          <span className="text-[11px] text-[#5C5A55]">Duration</span>
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={(e) => handleExperienceChange(idx, "duration", e.target.value)}
                            placeholder="e.g. 2020 - Present (4 yrs)"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] bg-white"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#A84C32] hover:underline cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Add Another Experience
                    </button>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">
                      Professional Bio *
                    </label>
                    <textarea
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write a brief professional bio introducing your teaching methodology and passion for your domain..."
                      className="w-full p-4 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32]"
                    />
                  </div>

                  {/* Motivation */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-2">
                      Why Medhashine? (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      placeholder="Tell us why you want to contribute insights to Medhashine..."
                      className="w-full p-4 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32]"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="font-serif-display text-2xl font-medium text-[#1A1A1A] mb-1">
                      Review Your Application
                    </h2>
                    <p className="font-ui text-xs text-[#5C5A55]">
                      Please confirm all your details before sending for admin review.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-2xl bg-[#FAF8F5] p-6 border border-[#E5E1D8]">
                    {/* Personal Summary */}
                    <div className="pb-4 border-b border-[#E5E1D8]">
                      <h4 className="text-xs font-bold text-[#A84C32] uppercase tracking-wider mb-2">
                        Personal Info
                      </h4>
                      <p className="text-sm font-semibold text-[#1A1A1A]">{name}</p>
                      <p className="text-xs text-[#5C5A55]">{email} {phone && `• ${phone}`}</p>
                      {dateOfBirth && <p className="text-xs text-[#5C5A55]">DOB: {dateOfBirth}</p>}
                    </div>

                    {/* Education Summary */}
                    <div className="pb-4 border-b border-[#E5E1D8]">
                      <h4 className="text-xs font-bold text-[#A84C32] uppercase tracking-wider mb-2">
                        Education & Subjects
                      </h4>
                      <ul className="text-xs text-[#1A1A1A] space-y-1 mb-2">
                        {educationList.map((e, i) => (
                          <li key={i}>• {e.degree} — {e.institution} ({e.year})</li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSubjects.map((s) => (
                          <span key={s} className="px-2.5 py-0.5 rounded-full bg-white border border-[#E5E1D8] text-[11px] text-[#1A1A1A]">
                            {s}
                          </span>
                        ))}
                        {requestedSubjects.map((s) => (
                          <span key={s} className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-[11px] text-amber-900 font-medium">
                            {s} (Proposed)
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bio Summary */}
                    <div>
                      <h4 className="text-xs font-bold text-[#A84C32] uppercase tracking-wider mb-1">
                        Bio
                      </h4>
                      <p className="text-xs text-[#5C5A55] italic">{bio}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Bar */}
              <div className="mt-10 flex items-center justify-between pt-6 border-t border-[#E5E1D8]">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-[#E5E1D8] text-xs font-medium text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-1.5 px-8 py-2.5 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors cursor-pointer"
                  >
                    Next Step <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitApplication}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-10 py-3 rounded-full bg-gradient-to-r from-[#A84C32] to-[#8B3A25] text-white text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application <Check className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SUBMITTED SUCCESS VIEW ── */}
        {view === "submitted" && (
          <div className="max-w-xl mx-auto text-center bg-white p-10 md:p-14 rounded-3xl border border-[#E5E1D8] shadow-sm space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="font-serif-display text-3xl font-medium text-[#1A1A1A]">
              Application Received!
            </h2>
            <p className="font-ui text-sm text-[#5C5A55] leading-relaxed">
              Thank you for submitting your application to join Medhashine as a verified teacher. Our admin team will review your profile and send an email notification as soon as your status is updated.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/profile"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors"
              >
                Track Status in Profile
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-3 rounded-full border border-[#E5E1D8] text-xs font-medium text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
