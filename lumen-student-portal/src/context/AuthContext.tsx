"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, formatApiErrorDetail } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
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
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  sendOtp: (name: string, email: string, password: string, role: string) => Promise<{ ok: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role: string, otp: string) => Promise<{ ok: boolean; error?: string }>;
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

  // Listen for auth:logout event triggered when refresh session expires
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // Helper to load user profile with automatic cookie refresh fallback
  const fetchUserProfile = useCallback(async () => {
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
          savedTeachers: Array.isArray(u.savedTeachers) ? u.savedTeachers.map((id: any) => id.toString()) : [],
        });
        return;
      }

      // No active access token, try silent refresh via httpOnly refreshToken cookie
      try {
        const { data: refreshData } = await api.post("/auth/refresh");
        const refreshedUser = refreshData?.user;
        if (refreshedUser && refreshedUser._id) {
          setUser({
            id: refreshedUser._id,
            name: refreshedUser.name,
            email: refreshedUser.email,
            role: refreshedUser.role,
            avatar: refreshedUser.avatar,
            savedTeachers: Array.isArray(refreshedUser.savedTeachers) ? refreshedUser.savedTeachers.map((id: any) => id.toString()) : [],
          });
          return;
        }
      } catch {
        // No active session cookie
      }

      setUser(null);
    } catch {
      setUser(null);
    }
  }, []);

  // On mount: check auth state
  useEffect(() => {
    fetchUserProfile().finally(() => setReady(true));
  }, [fetchUserProfile]);

  // Proactive background silent refresh every 10 minutes while the student is logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        await api.post("/auth/refresh");
      } catch {
        // silent refresh handled by interceptor if token expires
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [user]);

  // On tab focus: ensure session is kept warm
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && user) {
        api.post("/auth/refresh").catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user]);

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
        savedTeachers: Array.isArray(u.savedTeachers) ? u.savedTeachers.map((id: any) => id.toString()) : [],
      });
      return { ok: true };
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
        return { ok: true };
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
