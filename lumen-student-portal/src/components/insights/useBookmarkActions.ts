"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const EMPTY_BOOKMARK_SET = new Set<string>();

export function useBookmarkActions() {
  const { user, requireAuth } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkBusyId, setBookmarkBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const { data } = await api.get("/profile/activity");
        if (!active || !data) return;
        const ids = new Set<string>(
          (data.savedBlogs || []).map((b: { _id?: string; id?: string }) => b._id || b.id || "")
        );
        ids.delete("");
        setBookmarkedIds(ids);
      } catch {
        // silent
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const effectiveBookmarkedIds = user ? bookmarkedIds : EMPTY_BOOKMARK_SET;

  const handleToggleBookmark = useCallback(
    async (blogId: string) => {
      if (!user) {
        requireAuth();
        return;
      }

      const wasSaved = bookmarkedIds.has(blogId);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(blogId);
        else next.add(blogId);
        return next;
      });
      setBookmarkBusyId(blogId);

      try {
        const { data } = await api.post("/profile/bookmarks/toggle", { blogId });
        toast.success(data?.saved ? "Saved to your reading list" : "Removed from saved insights");
      } catch {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(blogId);
          else next.delete(blogId);
          return next;
        });
        toast.error("Could not update bookmark. Please try again.");
      } finally {
        setBookmarkBusyId(null);
      }
    },
    [user, requireAuth, bookmarkedIds]
  );

  return {
    user,
    effectiveBookmarkedIds,
    bookmarkBusyId,
    handleToggleBookmark,
  };
}
