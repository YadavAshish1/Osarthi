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

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function BecomeTeacherClient() {
  const router = useRouter();
  const { user, openAuth, login, sendOtp, register, ready } = useAuth();

  const [view, setView] = useState<"overview" | "form" | "submitted">("overview");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [statusChecked, setStatusChecked] = useState<boolean>(false);
  const [reapplyAllowed, setReapplyAllowed] = useState<boolean>(false);

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

  // Existing account detection & confirmation state
  const [existingAccount, setExistingAccount] = useState<{
    email: string;
    name: string;
    role: string;
  } | null>(null);
  const [verifyingExisting, setVerifyingExisting] = useState<boolean>(false);

  const handleStartApplication = () => {
    if (user) {
      if (user.role === "teacher" || existingStatus === "approved") {
        toast.info("You are already an approved Educator on Medhashine!");
        router.push("/teacher/dashboard");
        return;
      }
      if (existingStatus === "pending") {
        toast.info("Your application is currently under review by our academic team.");
        return;
      }
      if (existingStatus === "rejected" && !reapplyAllowed) {
        toast.info("Your previous application was not approved. Review editorial notes below or contact support.");
        return;
      }
    }
    setView("form");
  };

  const handleGoogleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[Google Auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured in environment variables.");
      }
      toast.error("Google Sign-In is temporarily unavailable. Please continue with your email.");
      return;
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const redirectUri = `${origin}/api/auth/callback/google`;
    const returnTo = "/become-a-teacher?apply=true";
    const state = btoa(JSON.stringify({ returnTo, mode: "login" }));

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "select_account");
    googleAuthUrl.searchParams.set("state", state);

    window.location.href = googleAuthUrl.toString();
  };

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
    setExistingAccount(null);
    try {
      const res = await sendOtp(name.trim(), email.toLowerCase().trim(), password, "student");
      if (res.ok) {
        setOtpSent(true);
        toast.success("Verification code sent to " + email);
      } else if (res.code === "EMAIL_EXISTS") {
        setExistingAccount({
          email: email.toLowerCase().trim(),
          name: res.name || name.trim(),
          role: res.role || "student",
        });
        if (res.role === "teacher") {
          toast.info("This email is already an approved Educator profile.");
        } else {
          toast.info("Existing student account found. Please confirm to link it.");
        }
      } else {
        toast.error(res.error || "Failed to send verification code");
      }
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleConfirmExistingAccount = async () => {
    if (!password) {
      toast.error("Please enter your account password to verify your identity");
      return;
    }

    setVerifyingExisting(true);
    try {
      const res = await login(email.toLowerCase().trim(), password);
      if (res.ok) {
        toast.success("Account verified! Proceeding with your Educator application.");
        setExistingAccount(null);
      } else {
        toast.error(res.error || "Incorrect password. Please verify your password or reset it.");
      }
    } catch {
      toast.error("Verification failed. Please check your password.");
    } finally {
      setVerifyingExisting(false);
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

      if (user) {
        try {
          const { data: statusData } = await api.get("/teacher-applications/my-status");
          if (statusData?.application) {
            const st = statusData.application.status;
            setExistingStatus(st);
            if (statusData.application.rejectionReason) {
              setRejectionReason(statusData.application.rejectionReason);
            }
            if (statusData.application.phone) {
              setPhone((prev) => prev || statusData.application.phone);
            }
          }
        } catch {} finally {
          setStatusChecked(true);
        }
      } else {
        setStatusChecked(true);
      }
    })();
  }, [user]);

  // View routing based on status & user
  useEffect(() => {
    if (!statusChecked) return;

    // If an existing status exists and reapply is not allowed, never open form
    if (existingStatus && !reapplyAllowed) {
      return;
    }

    if (user && user.role === "teacher") {
      return;
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("apply") === "true") {
        setView("form");
        return;
      }
    }

    if (user && user.role === "student" && !existingStatus) {
      setView("form");
    }
  }, [user, existingStatus, statusChecked, reapplyAllowed]);

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
        toast.error("Please sign in or complete email OTP verification to proceed");
        return false;
      }
      if (user.role === "teacher") {
        toast.info("You are already an approved Educator on Medhashine.");
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
      if (!phone || !phone.trim()) {
        toast.error("Please enter your mobile number");
        return false;
      }
      const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");
      if (cleanPhone.length < 10) {
        toast.error("Please enter a valid 10-digit mobile number");
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
    if (!phone || !phone.trim()) {
      toast.error("Mobile number is mandatory");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        phone: phone.trim(),
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

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#A84C32]" />
      </div>
    );
  }

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
            <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2.5 px-4 sm:px-6 py-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md max-w-full">
              <span className="text-xs sm:text-sm text-white/80 font-medium">Your Application Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
                  existingStatus === "approved"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : existingStatus === "rejected"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {existingStatus === "rejected" ? "Not Approved" : existingStatus}
              </span>
              <Link
                href="/profile"
                className="text-xs text-[#E8A88A] hover:underline font-semibold ml-1 whitespace-nowrap"
              >
                View in Profile →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── MAIN CONTENT AREA ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-12 py-16">
        {/* ── CASE 1: REJECTED APPLICATION VIEW ── */}
        {existingStatus === "rejected" && !reapplyAllowed && view !== "submitted" && (
          <div className="max-w-2xl mx-auto bg-white p-8 sm:p-12 md:p-14 rounded-3xl border border-[#E5E1D8] shadow-sm text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200">
              <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 mb-3">
                Application Not Approved
              </span>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
                Application Review Update
              </h2>
              <p className="font-ui text-xs sm:text-sm text-[#5C5A55] leading-relaxed mt-2 max-w-lg mx-auto">
                Thank you for your interest in joining Medhashine as an educator. Our academic editorial team has completed evaluating your profile against our curriculum and content publication standards.
              </p>
            </div>

            {/* Editorial Review Feedback Callout */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] text-xs sm:text-sm text-left space-y-2">
              <div className="flex items-center gap-2 text-[#A84C32] font-semibold text-xs uppercase tracking-wider">
                <FileText className="h-4 w-4 shrink-0" />
                <span>Editorial Review Feedback:</span>
              </div>
              <p className="text-[#5C5A55] leading-relaxed italic bg-white p-3 rounded-xl border border-[#E5E1D8]/60">
                "{rejectionReason && rejectionReason.trim()
                  ? rejectionReason
                  : "We are unable to approve your educator profile at this time based on our current subject domain coverage and qualification criteria."}"
              </p>
            </div>

            {/* Student Account Active Reassurance */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Your Student Account is Active & Fully Functional</span>
              </div>
              <p className="text-emerald-800/90 leading-relaxed text-[11px] sm:text-xs pl-6">
                You retain complete, uninterrupted access to read all conceptual insights, take interactive quizzes, save bookmarks, and participate in discussions on Medhashine.
              </p>
            </div>

            {/* Contact Team & Action Paths */}
            <div className="pt-2 border-t border-[#E5E1D8]/80 space-y-4">
              <p className="text-xs text-[#5C5A55] max-w-md mx-auto leading-relaxed">
                Facing an issue or believe this decision was made in error? If you have questions, updated credentials, or need clarification, our editorial team is available to assist you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8B3A25] transition-all inline-flex items-center justify-center gap-2 shadow-xs active:scale-[0.99]"
                >
                  <Mail className="h-4 w-4" /> Reach Out to Editorial Team
                </Link>
                <Link
                  href="/"
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#E5E1D8] bg-white text-xs font-medium text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors text-center"
                >
                  Explore Platform Insights
                </Link>
                <Link
                  href="/profile"
                  className="w-full sm:w-auto px-5 py-3 rounded-full border border-[#E5E1D8] bg-white text-xs font-medium text-[#5C5A55] hover:text-[#1A1A1A] transition-colors text-center"
                >
                  View in Profile →
                </Link>
              </div>

              {/* Best Practice Re-application Option */}
              <div className="pt-4 border-t border-[#E5E1D8]/60 text-center">
                <p className="text-[11px] text-[#8C8983] mb-2">
                  Have your academic qualifications, degree, or publications updated?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReapplyAllowed(true);
                    setView("form");
                    setCurrentStep(1);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#A84C32] hover:underline font-semibold cursor-pointer"
                >
                  Re-apply with Updated Credentials →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CASE 2: PENDING APPLICATION VIEW ── */}
        {existingStatus === "pending" && !reapplyAllowed && view !== "submitted" && (
          <div className="max-w-2xl mx-auto bg-white p-8 sm:p-12 md:p-14 rounded-3xl border border-[#E5E1D8] shadow-sm text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 mb-3">
                Application Under Review
              </span>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
                Your Educator Application is Under Review
              </h2>
              <p className="font-ui text-xs sm:text-sm text-[#5C5A55] leading-relaxed mt-2 max-w-lg mx-auto">
                Thank you for applying to teach on Medhashine! Our academic review team is currently evaluating your qualifications and subject expertise.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Your Student Account Remains Active</span>
              </div>
              <p className="text-emerald-800/90 leading-relaxed text-[11px] sm:text-xs pl-6">
                While your application is being evaluated, you can continue to enjoy full student features (reading essays, attempting quizzes, bookmarking). Once approved, your account will automatically upgrade to a Verified Educator.
              </p>
            </div>

            <div className="pt-2 border-t border-[#E5E1D8]/80 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/profile"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors"
              >
                Track Status in Profile
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#E5E1D8] bg-white text-xs font-medium text-[#5C5A55] hover:text-[#1A1A1A] transition-colors text-center"
              >
                Need Help? Contact Us
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#E5E1D8] bg-white text-xs font-medium text-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors text-center"
              >
                Explore Insights
              </Link>
            </div>
          </div>
        )}

        {/* ── CASE 3: APPROVED EDUCATOR VIEW ── */}
        {(existingStatus === "approved" || (user && user.role === "teacher")) && !reapplyAllowed && view !== "submitted" && (
          <div className="max-w-2xl mx-auto bg-white p-8 sm:p-12 md:p-14 rounded-3xl border border-[#E5E1D8] shadow-sm text-center space-y-6 animate-fadeIn">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 mb-3">
                Approved Educator
              </span>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-medium text-[#1A1A1A]">
                You are a Verified Medhashine Educator
              </h2>
              <p className="font-ui text-xs sm:text-sm text-[#5C5A55] leading-relaxed mt-2 max-w-lg mx-auto">
                Your educator profile is active! You can write and publish conceptual insights, create interactive quizzes, and reach learners across the platform.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/teacher/dashboard"
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                Go to Educator Studio <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/profile"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#E5E1D8] bg-white text-xs font-medium text-[#5C5A55] hover:text-[#1A1A1A] transition-colors text-center"
              >
                View Profile
              </Link>
            </div>
          </div>
        )}

        {/* ── CASE 4: OVERVIEW LANDING PAGE ── */}
        {view === "overview" && (!existingStatus || reapplyAllowed) && (
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
                  onClick={handleStartApplication}
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
        {view === "form" && (!existingStatus || reapplyAllowed) && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E5E1D8] shadow-sm overflow-hidden">
            {/* Form Progress Header */}
            <div className="bg-[#FAF8F5] px-4 sm:px-8 py-4 sm:py-6 border-b border-[#E5E1D8]">
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

            <div className="p-4 sm:p-8 md:p-10">
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
                    <div className="space-y-4">
                      {user.role === "teacher" && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 border border-blue-200 text-[#1A1A1A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-blue-900">
                                You are already an approved Educator on Medhashine!
                              </p>
                              <p className="text-[11px] text-blue-700 mt-0.5">
                                Logged in as {user.name} ({user.email}). You can publish insights and quizzes directly.
                              </p>
                            </div>
                          </div>
                          <Link
                            href="/teacher/dashboard"
                            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0 inline-flex items-center gap-1.5"
                          >
                            Educator Studio <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      )}

                      {user.role === "student" && (
                        /* ── CONNECTED STUDENT ACCOUNT CARD ── */
                        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-2">
                          <div className="flex items-start sm:items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
                            <div className="break-all sm:break-normal leading-snug">
                              <span>Connected Account: </span>
                              <strong className="font-semibold text-emerald-950">{user.name}</strong>{" "}
                              <span className="text-emerald-800">({user.email})</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-emerald-800 leading-relaxed border-t border-emerald-200/60 pt-2">
                            ✓ <strong>Teacher Registration In Progress:</strong> Your account remains fully active as a student while under review and will automatically unlock Educator tools once approved by the editorial team.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-4">
                      {/* ── 1-CLICK GOOGLE FAST TRACK ── */}
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full h-11 px-4 border border-[#E5E1D8] rounded-xl bg-white text-[#1A1A1A] font-medium text-sm flex items-center justify-center gap-3 hover:bg-[#FAF8F5] hover:border-[#A84C32]/40 transition-all cursor-pointer shadow-2xs active:scale-[0.99]"
                      >
                        <GoogleIcon className="w-5 h-5 shrink-0" />
                        <span>Continue with Google</span>
                      </button>

                      {/* ── DIVIDER ── */}
                      <div className="relative flex items-center justify-center my-1 sm:my-2">
                        <div className="border-t border-[#E5E1D8] w-full" />
                        <span className="bg-[#FAF8F5] px-3 text-[11px] uppercase tracking-wider text-[#8C8983] shrink-0 font-medium">
                          or continue with email
                        </span>
                        <div className="border-t border-[#E5E1D8] w-full" />
                      </div>

                      <div className="flex items-center justify-between pb-1 border-b border-[#E5E1D8]">
                        <span className="text-xs font-bold text-[#A84C32] uppercase tracking-wider">
                          Email OTP Signup
                        </span>
                        <button
                          type="button"
                          onClick={() => openAuth("login")}
                          className="text-xs text-[#A84C32] hover:underline font-semibold cursor-pointer"
                        >
                          Already registered? Sign In →
                        </button>
                      </div>

                      {/* ── EXISTING STUDENT ACCOUNT CONFIRMATION CARD ── */}
                      {existingAccount && (
                        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-[#1A1A1A] space-y-3 animate-in fade-in">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div className="flex-1 text-xs">
                              <p className="font-semibold text-amber-900">
                                {existingAccount.role === "teacher"
                                  ? "Active Educator Profile Detected"
                                  : "Existing Student Account Found"}
                              </p>
                              <p className="text-amber-800/90 mt-1 leading-relaxed">
                                {existingAccount.role === "teacher"
                                  ? `An educator profile already exists for ${existingAccount.email}. You do not need to submit another application.`
                                  : `We found a registered student account for ${existingAccount.email}${existingAccount.name ? ` (${existingAccount.name})` : ""}. Confirm your password below to use this account for your teacher application.`}
                              </p>
                            </div>
                          </div>

                          {existingAccount.role === "teacher" ? (
                            <div className="pt-1 flex items-center gap-2">
                              <Link
                                href="/teacher/dashboard"
                                className="px-4 py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors inline-flex items-center gap-1.5"
                              >
                                Go to Educator Studio <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          ) : (
                            <div className="pt-1 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={handleConfirmExistingAccount}
                                disabled={verifyingExisting}
                                className="px-4 py-2 rounded-xl bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8B3A25] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                              >
                                {verifyingExisting ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                                  </>
                                ) : (
                                  <>
                                    Confirm & Use This Account <Check className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setExistingAccount(null);
                                  setEmail("");
                                  setPassword("");
                                }}
                                className="px-3 py-2 rounded-xl border border-[#E5E1D8] bg-white text-[#5C5A55] hover:text-[#1A1A1A] text-xs font-medium cursor-pointer"
                              >
                                Use Different Email
                              </button>
                              <button
                                type="button"
                                onClick={() => openAuth("forgot")}
                                className="text-xs text-[#A84C32] hover:underline font-semibold ml-auto cursor-pointer"
                              >
                                Forgot Password?
                              </button>
                            </div>
                          )}
                        </div>
                      )}

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
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                              placeholder="123456"
                              className="w-full sm:flex-1 min-w-0 px-4 py-3 sm:py-2.5 rounded-xl border border-[#A84C32] text-center tracking-[6px] sm:tracking-[8px] font-mono text-lg font-bold focus:outline-none bg-white shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtpAndSignup}
                              disabled={verifyingOtp || otp.length !== 6}
                              className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8B3A25] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
                            >
                              {verifyingOtp ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                                </>
                              ) : (
                                <>
                                  Verify OTP & Sign Up <Check className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#5C5A55]">
                            <button
                              type="button"
                              onClick={() => setOtpSent(false)}
                              className="text-[#5C5A55] hover:text-[#1A1A1A] underline cursor-pointer"
                            >
                              Edit Details
                            </button>
                            <button
                              type="button"
                              onClick={handleSendOtpCode}
                              disabled={sendingOtp}
                              className="text-[#A84C32] font-semibold hover:underline cursor-pointer disabled:opacity-50"
                            >
                              {sendingOtp ? "Resending..." : "Resend OTP"}
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
                            Mobile Number *
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-3 h-4 w-4 text-[#5C5A55]" />
                            <input
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="e.g. +91 98765 43210"
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
                        <div className="w-full sm:w-1/3">
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
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          placeholder="e.g. व्याकरण, हिंदी पद्य, Robotics..."
                          className="w-full sm:flex-1 min-w-0 px-3.5 py-2 rounded-xl border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#A84C32] bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddProposedSubject}
                          className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors shrink-0 cursor-pointer"
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
                        <div className="w-full sm:w-1/2">
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
                      <p className="text-xs text-[#5C5A55]">{email} • {phone}</p>
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
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#E5E1D8]">
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
              Thank you for submitting your application to join Medhashine as a verified educator! While our academic team reviews your profile, your account continues to function normally as a student (you can read insights and take quizzes). Once approved, your profile will automatically upgrade to a verified Educator with full Educator Studio access.
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
