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

function saveToken(token: string) {
  localStorage.setItem("lumen_access_token", token);
}

function clearToken() {
  localStorage.removeItem("lumen_access_token");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [authModal, setAuthModal] = useState<AuthModalState>({
    open: false,
    mode: "login",
    onSuccess: null,
  });

  // On mount: try /api/auth/me with stored token
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("lumen_access_token");
        if (!token) throw new Error("no token");

        const { data } = await api.get("/auth/me");
        // backend returns { user: {...} }
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
        } else {
          clearToken();
        }
      } catch {
        clearToken();
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      // backend returns { accessToken, user }
      const accessToken = data.accessToken;
      const u = data.user;
      if (!accessToken || !u) throw new Error("Invalid response");
      saveToken(accessToken);
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
        const accessToken = data.accessToken;
        const u = data.user;
        if (!accessToken || !u) throw new Error("Invalid response");
        saveToken(accessToken);
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
    clearToken();
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
