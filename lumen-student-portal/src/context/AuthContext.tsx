"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  bio?: string;
  classRef?: { _id: string; name: string } | string | null;
  education?: Array<{ institution?: string; degree?: string; year?: string }>;
  experience?: Array<{ title?: string; organization?: string; duration?: string }>;
  savedTeachers?: string[];
}

interface AuthModalState {
  open: boolean;
  mode: "login" | "register" | "forgot";
  onSuccess: (() => void) | null;
}

interface AuthContextType {
  user: User | null;
  ready: boolean;
  authModal: AuthModalState;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; user?: any }>;
  sendOtp: (name: string, email: string, password: string, role: string) => Promise<{ ok: boolean; error?: string; code?: string; role?: string; name?: string }>;
  register: (name: string, email: string, password: string, role: string, otp: string) => Promise<{ ok: boolean; error?: string; user?: any }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  requireAuth: (onSuccess?: () => void) => boolean;
  openAuth: (mode?: "login" | "register" | "forgot") => void;
  closeAuth: () => void;
  setAuthModal: React.Dispatch<React.SetStateAction<AuthModalState>>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [authModal, setAuthModal] = useState<AuthModalState>({
    open: false,
    mode: "login",
    onSuccess: null,
  });

  // Listen for auth:logout event triggered when refresh token expires
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // On mount: try /api/auth/me and handle OAuth redirect params
  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const googleCode = url.searchParams.get("googleCode");
        const authError = url.searchParams.get("authError");

        if (googleCode) {
          // Immediately scrub code from URL so the address bar stays clean
          url.searchParams.delete("googleCode");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));

          const protocol = window.location.protocol;
          const host = window.location.host;
          const redirectUri = `${protocol}//${host}/api/auth/callback/google`;

          try {
            // Direct browser-to-backend call with credentials — sets HTTP-only cookies on backend domain
            const { data } = await api.post("/auth/google/callback", {
              code: googleCode,
              redirectUri,
            });

            const u = data?.user;
            if (u && u._id) {
              setUser({
                id: u._id,
                name: u.name,
                email: u.email,
                role: u.role,
                avatar: u.avatar,
                bio: u.bio || "",
                classRef: u.classRef || null,
                education: Array.isArray(u.education) ? u.education : [],
                experience: Array.isArray(u.experience) ? u.experience : [],
                savedTeachers: Array.isArray(u.savedTeachers) ? u.savedTeachers.map((id: any) => id.toString()) : [],
              });
              toast.success("Signed in with Google successfully!");
              setReady(true);
              return;
            } else {
              toast.error("Google sign-in failed. Please try again.");
            }
          } catch (err: any) {
            toast.error(err?.response?.data?.message || "Google sign-in failed. Please try again.");
          }
        } else if (authError) {
          if (authError === "google_cancelled") {
            toast.info("Google sign-in was cancelled");
          } else if (authError === "server_error") {
            toast.error("Unable to complete Google sign-in at this time. Please try again or sign in with your email.");
          } else {
            toast.error(decodeURIComponent(authError));
          }
          url.searchParams.delete("authError");
          window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
        }
      }

      try {
        const { data } = await api.get("/auth/me");
        const u = data?.user;
        if (u && u._id) {
          setUser({
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            bio: u.bio || "",
            classRef: u.classRef || null,
            education: Array.isArray(u.education) ? u.education : [],
            experience: Array.isArray(u.experience) ? u.experience : [],
            savedTeachers: Array.isArray(u.savedTeachers) ? u.savedTeachers.map((id: any) => id.toString()) : [],
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const u = data.user;
      if (!u) throw new Error("Invalid response");
      setUser({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        bio: u.bio || "",
        classRef: u.classRef || null,
        education: Array.isArray(u.education) ? u.education : [],
        experience: Array.isArray(u.experience) ? u.experience : [],
        savedTeachers: Array.isArray(u.savedTeachers) ? u.savedTeachers.map((id: any) => id.toString()) : [],
      });
      return { ok: true, user: u };
    } catch (e: any) {
      return {
        ok: false,
        error:
          formatApiErrorDetail(e?.response?.data?.message) ||
          formatApiErrorDetail(e?.response?.data?.detail) ||
          e.message ||
          "Login failed",
      };
    }
  }, []);

  const sendOtp = useCallback(
    async (name: string, email: string, password: string, role: string) => {
      try {
        await api.post("/auth/send-otp", {
          name,
          email,
          password,
          role: role || "student",
        });
        return { ok: true };
      } catch (e: any) {
        return {
          ok: false,
          code: e?.response?.data?.code,
          role: e?.response?.data?.role,
          name: e?.response?.data?.name,
          error:
            formatApiErrorDetail(e?.response?.data?.message) ||
            formatApiErrorDetail(e?.response?.data?.detail) ||
            e.message ||
            "Failed to send verification code",
        };
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string, role: string, otp: string) => {
      try {
        const { data } = await api.post("/auth/register", {
          name,
          email,
          password,
          role: role || "student",
          otp,
        });
        const u = data.user;
        if (!u) throw new Error("Invalid response");
        setUser({ id: u._id, name: u.name, email: u.email, role: u.role, avatar: u.avatar });
        return { ok: true, user: u };
      } catch (e: any) {
        return {
          ok: false,
          error:
            formatApiErrorDetail(e?.response?.data?.message) ||
            formatApiErrorDetail(e?.response?.data?.detail) ||
            e.message ||
            "Registration failed",
        };
      }
    },
    []
  );

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await api.post("/auth/forgot-password", { email });
      return { ok: true };
    } catch (e: any) {
      return {
        ok: false,
        error:
          formatApiErrorDetail(e?.response?.data?.message) ||
          formatApiErrorDetail(e?.response?.data?.detail) ||
          e.message ||
          "Failed to send reset code",
      };
    }
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    try {
      await api.post("/auth/reset-password", { email, otp, newPassword });
      return { ok: true };
    } catch (e: any) {
      return {
        ok: false,
        error:
          formatApiErrorDetail(e?.response?.data?.message) ||
          formatApiErrorDetail(e?.response?.data?.detail) ||
          e.message ||
          "Failed to reset password",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(null);
  }, []);

  const requireAuth = useCallback(
    (onSuccess?: () => void) => {
      if (user) {
        return true;
      }
      setAuthModal({
        open: true,
        mode: "login",
        onSuccess: onSuccess || null,
      });
      return false;
    },
    [user]
  );

  const openAuth = useCallback((mode: "login" | "register" | "forgot" = "login") => {
    setAuthModal({
      open: true,
      mode,
      onSuccess: null,
    });
  }, []);

  const closeAuth = useCallback(() => {
    setAuthModal((s) => ({ ...s, open: false }));
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        authModal,
        login,
        sendOtp,
        register,
        forgotPassword,
        resetPassword,
        logout,
        requireAuth,
        openAuth,
        closeAuth,
        setAuthModal,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
