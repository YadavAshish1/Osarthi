"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

type EducatorStatus = "checking" | "approved" | "pending" | "denied";

interface PrivateRouteGuardProps {
  children: React.ReactNode;
  requireEducator?: boolean;
}

/**
 * Blocks unauthenticated access (and optional non-educator access) on private App Router routes,
 * redirecting signed-out guests cleanly without mounting protected UI.
 */
export default function PrivateRouteGuard({
  children,
  requireEducator = false,
}: PrivateRouteGuardProps) {
  const { user, ready, isLoggingOut } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  const isFastPathEducator = Boolean(
    user && ["teacher", "admin", "super_admin"].includes(user.role || "")
  );

  const [fetchedStatus, setFetchedStatus] = useState<{
    userId: string;
    status: Exclude<EducatorStatus, "checking">;
  } | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      if (isLoggingOut()) {
        // Hard replace clears private React state, quiz timers, and client router cache cleanly
        window.location.replace("/");
        return;
      }
      toast.info("Please sign in to access this page.", {
        id: "private-route-auth",
      });
      router.replace("/?auth=login");
      return;
    }

    redirectedRef.current = false;
  }, [ready, user, isLoggingOut, router]);

  useEffect(() => {
    if (!requireEducator || !ready || !user || isFastPathEducator) return;

    let active = true;
    const currentUserId = user.id;

    api
      .get("/teacher-applications/my-status")
      .then(({ data }) => {
        if (!active) return;
        const app = data?.application;
        if (app?.status === "approved") {
          setFetchedStatus({ userId: currentUserId, status: "approved" });
        } else if (app?.status === "pending") {
          setFetchedStatus({ userId: currentUserId, status: "pending" });
        } else {
          setFetchedStatus({ userId: currentUserId, status: "denied" });
        }
      })
      .catch(() => {
        if (!active) return;
        setFetchedStatus({ userId: currentUserId, status: "denied" });
      });

    return () => {
      active = false;
    };
  }, [requireEducator, ready, user, isFastPathEducator]);

  if (!ready || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A] px-6">
        <Loader2 className="w-8 h-8 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">
          {ready ? "Redirecting to Medhashine Home…" : "Verifying access…"}
        </p>
      </div>
    );
  }

  if (requireEducator) {
    const educatorStatus: EducatorStatus = isFastPathEducator
      ? "approved"
      : fetchedStatus && fetchedStatus.userId === user.id
      ? fetchedStatus.status
      : "checking";

    if (educatorStatus === "checking") {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A] px-6">
          <Loader2 className="w-8 h-8 text-[#A84C32] animate-spin mb-3" />
          <p className="font-serif-body text-sm text-[#5C5A55]">
            Verifying Educator Permissions…
          </p>
        </div>
      );
    }

    if (educatorStatus === "pending") {
      return (
        <div className="max-w-3xl mx-auto px-6 py-16 font-ui">
          <div className="p-8 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-300">
              <Clock className="h-7 w-7" />
            </div>
            <span className="eyebrow text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 font-bold inline-block">
              Teacher Application Under Review
            </span>
            <h1 className="font-serif-display text-3xl font-semibold text-amber-950">
              Your Application is Being Reviewed
            </h1>
            <p className="font-serif-body text-sm text-amber-800 max-w-lg mx-auto leading-relaxed">
              Our administrative team is currently verifying your teaching credentials. Once approved, Educator Studio will unlock automatically.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/profile"
                className="px-6 py-2.5 rounded-full bg-amber-900 text-white text-xs font-semibold hover:bg-amber-950 transition-colors inline-block"
              >
                View Application Status on Profile
              </Link>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-full bg-white border border-amber-300 text-amber-950 text-xs font-semibold hover:bg-amber-100 transition-colors inline-block"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (educatorStatus === "denied") {
      return (
        <div className="max-w-3xl mx-auto px-6 py-16 font-ui">
          <div className="p-8 rounded-3xl bg-white border border-[#E5E1D8] text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center mx-auto border border-[#A84C32]/20 font-bold">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-3 py-1 rounded-full border border-[#A84C32]/20 font-bold inline-block">
              Educator Studio Restricted
            </span>
            <h1 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">
              Educator Approval Required
            </h1>
            <p className="font-serif-body text-sm text-[#5C5A55] max-w-lg mx-auto leading-relaxed">
              Creating insights and quizzes requires an approved educator account on Medhashine.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/become-a-teacher"
                className="px-8 py-3 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                <span>Apply as Educator</span>
                <Sparkles className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="px-6 py-3 rounded-full bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] text-xs font-semibold hover:border-[#A84C32] transition-colors inline-block"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
