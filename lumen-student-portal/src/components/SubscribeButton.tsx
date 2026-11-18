"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface SubscribeButtonProps {
  teacherId: string;
  teacherName?: string;
  initialSubscribed?: boolean;
  initialCount?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "button" | "menu-item";
  className?: string;
  onSubscriptionChange?: (subscribed: boolean, newCount: number) => void;
}

export default function SubscribeButton({
  teacherId,
  teacherName = "Teacher",
  initialSubscribed = false,
  initialCount,
  showCount = false,
  size = "md",
  variant = "button",
  className = "",
  onSubscriptionChange,
}: SubscribeButtonProps) {
  const { user, openAuth } = useAuth();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [count, setCount] = useState<number | null>(initialCount ?? null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // If user is the teacher themselves, don't show subscribe button
  const isSelf = user?.id === teacherId;

  // Check subscription status if user is logged in
  useEffect(() => {
    if (!teacherId || !user || isSelf) return;

    let mounted = true;
    const checkStatus = async () => {
      try {
        setChecking(true);
        const { data } = await api.get(`/subscriptions/check/${teacherId}`);
        if (mounted && data) {
          setSubscribed(!!data.subscribed);
        }
      } catch {
        // Silently fail check
      } finally {
        if (mounted) setChecking(false);
      }
    };

    checkStatus();
    return () => {
      mounted = false;
    };
  }, [teacherId, user, isSelf]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info(`Please sign in to subscribe to ${teacherName}`);
      openAuth("login");
      return;
    }

    if (isSelf) {
      toast.info("You cannot subscribe to your own educator profile");
      return;
    }

    setLoading(true);
    const nextSubscribed = !subscribed;
    const currentCount = count ?? 0;
    const nextCount = Math.max(0, currentCount + (nextSubscribed ? 1 : -1));

    // Optimistic update
    setSubscribed(nextSubscribed);
    if (count !== null) setCount(nextCount);

    try {
      const { data } = await api.post("/subscriptions/toggle", { teacherId });
      const serverSubscribed = data?.subscribed ?? nextSubscribed;
      setSubscribed(serverSubscribed);

      if (serverSubscribed) {
        toast.success(`Subscribed to ${teacherName}! You will receive notifications for new quizzes.`);
      } else {
        toast.info(`Unsubscribed from ${teacherName}`);
      }

      onSubscriptionChange?.(serverSubscribed, nextCount);
    } catch (err: any) {
      // Revert on error
      setSubscribed(!nextSubscribed);
      if (count !== null) setCount(currentCount);
      toast.error(err?.response?.data?.message || "Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };

  if (isSelf) return null;

  if (variant === "menu-item") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading || checking}
        title={subscribed ? `Unsubscribe from ${teacherName}` : `Subscribe to ${teacherName} for new quizzes`}
        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#F5F2EB] text-[#1A1A1A] transition-colors cursor-pointer disabled:opacity-60 font-ui text-xs ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-[#A84C32]" />
            <span className="font-medium text-[#5C5A55]">Updating...</span>
          </>
        ) : subscribed ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" />
            <span className="font-medium text-emerald-700">Subscribed</span>
          </>
        ) : (
          <>
            <Bell className="h-4 w-4 text-[#A84C32]" />
            <span className="font-medium text-[#A84C32]">Subscribe</span>
          </>
        )}
      </button>
    );
  }

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-4 py-2 text-xs sm:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm sm:text-base gap-2.5",
  }[size];

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-4.5 w-4.5",
  }[size];

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading || checking}
      title={subscribed ? `Unsubscribe from ${teacherName}` : `Subscribe to ${teacherName} for new quizzes`}
      className={`inline-flex items-center justify-center font-ui font-semibold rounded-full transition-all duration-200 cursor-pointer shadow-xs select-none disabled:opacity-60 ${
        subscribed
          ? "bg-[#FAF8F5] border border-[#E5E1D8] text-[#1A1A1A] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
          : "bg-[#A84C32] hover:bg-[#8B3A25] text-white hover:shadow-md"
      } ${sizeClasses} ${className}`}
    >
      {loading ? (
        <Loader2 className={`${iconSizes} animate-spin`} />
      ) : subscribed ? (
        <>
          <Check className={`${iconSizes} text-emerald-600`} />
          <span>Subscribed</span>
          <BellOff className={`${iconSizes} opacity-0 group-hover:opacity-100 hidden`} />
        </>
      ) : (
        <>
          <Bell className={`${iconSizes}`} />
          <span>Subscribe</span>
        </>
      )}

      {showCount && count !== null && count > 0 && (
        <span
          className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            subscribed ? "bg-[#E5E1D8]/60 text-[#5C5A55]" : "bg-black/20 text-white"
          }`}
        >
          {count.toLocaleString()}
        </span>
      )}
    </button>
  );
}

