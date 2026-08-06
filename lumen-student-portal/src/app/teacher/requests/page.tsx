"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  BookOpen,
  Layers,
  MessageSquare,
  Sparkles,
  Info,
} from "lucide-react";

interface RequestItem {
  _id: string;
  type: "class" | "subject";
  name: string;
  originalName?: string;
  approvedName?: string;
  adminNote?: string;
  className?: string;
  classRef?: { name: string };
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  adminSuggestion?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TeacherRequestsPage() {
  const { user, ready } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/taxonomy-requests/my-requests");
      setRequests(data || []);
    } catch {
      toast.error("Failed to load your taxonomy requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !user) return;
    fetchRequests();
  }, [user, ready]);

  if (!ready || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-ui text-[#1A1A1A]">
        <Loader2 className="w-8 h-8 text-[#A84C32] animate-spin mb-3" />
        <p className="font-serif-body text-sm text-[#5C5A55]">Loading Your Academic Requests…</p>
      </div>
    );
  }

  const filteredRequests = requests.filter((r) => {
    if (filter === "pending") return r.status === "pending";
    if (filter === "approved") return r.status === "approved";
    if (filter === "rejected") return r.status === "rejected";
    return true;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 md:py-14 space-y-8 font-ui">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/write"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C5A55] hover:text-[#A84C32] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Insight Studio</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-[#E5E1D8] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="eyebrow text-[#A84C32] bg-[#FBF4F2] px-3 py-1 rounded-full border border-[#A84C32]/20 font-bold inline-flex items-center gap-1 mb-2">
            <Send className="h-3.5 w-3.5" /> Academic Category Requests
          </span>
          <h1 className="font-serif-display text-3xl font-semibold text-[#1A1A1A]">
            Class & Subject Request Statuses
          </h1>
          <p className="font-serif-body text-sm text-[#5C5A55] mt-1">
            Track real-time admin review statuses, approval notifications, and suggestions for your category requests.
          </p>
        </div>

        <Link
          href="/teacher/write"
          className="px-6 py-3 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors inline-flex items-center gap-2 shrink-0 shadow-xs"
        >
          <Sparkles className="h-4 w-4" />
          <span>Submit New Request</span>
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs space-y-1">
          <p className="text-[#5C5A55] font-semibold uppercase tracking-wider">Total Requests</p>
          <h3 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">{requests.length}</h3>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-xs space-y-1">
          <p className="text-amber-800 font-semibold uppercase tracking-wider">Pending Review</p>
          <h3 className="font-serif-display text-2xl font-semibold text-amber-950">{pendingCount}</h3>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs space-y-1">
          <p className="text-emerald-800 font-semibold uppercase tracking-wider">Approved & Added</p>
          <h3 className="font-serif-display text-2xl font-semibold text-emerald-950">{approvedCount}</h3>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-xs space-y-1">
          <p className="text-rose-800 font-semibold uppercase tracking-wider">Rejected</p>
          <h3 className="font-serif-display text-2xl font-semibold text-rose-950">{rejectedCount}</h3>
        </div>
      </div>

      {/* Requests History List */}
      <div className="p-8 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-4">
          <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">
            Request History & Admin Feedback
          </h3>

          <div className="flex items-center gap-2 font-ui text-xs">
            {(["all", "pending", "approved", "rejected"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-full capitalize font-semibold transition-all ${
                  filter === t
                    ? "bg-[#1A1A1A] text-white shadow-2xs"
                    : "bg-[#FAF8F5] border border-[#E5E1D8] text-[#5C5A55] hover:text-[#1A1A1A]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center space-y-3 font-serif-body">
            <div className="w-12 h-12 rounded-full bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center mx-auto border border-[#A84C32]/20">
              <Send className="h-6 w-6" />
            </div>
            <h4 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">No requests found</h4>
            <p className="text-sm text-[#5C5A55] max-w-sm mx-auto">
              If a Class or Subject is missing for your insight, you can request it anytime from the Insight Studio.
            </p>
          </div>
        ) : (
          <div className="space-y-4 font-ui">
            {filteredRequests.map((r) => (
              <div key={r._id} className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1D8] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-2 rounded-xl text-xs font-semibold border ${
                        r.type === "class"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-purple-50 text-purple-800 border-purple-200"
                      }`}
                    >
                      {r.type === "class" ? <BookOpen className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                    </span>
                    <div>
                      <h4 className="font-serif-display text-lg font-semibold text-[#1A1A1A]">
                        {r.approvedName || r.name}
                      </h4>
                      {r.originalName && r.approvedName && r.originalName.toLowerCase() !== r.approvedName.toLowerCase() && (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mb-1">
                          Standardised from "{r.originalName}" to "{r.approvedName}"
                        </span>
                      )}
                      <p className="text-xs text-[#5C5A55]">
                        Type: <strong className="capitalize">{r.type}</strong>
                        {r.className || r.classRef?.name ? ` • Under ${r.className || r.classRef?.name}` : ""}
                        {" • "}
                        Submitted on {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    {r.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="h-3.5 w-3.5" /> Pending Admin Review
                      </span>
                    )}
                    {r.status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approved & Added to Taxonomy
                      </span>
                    )}
                    {r.status === "rejected" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        <XCircle className="h-3.5 w-3.5" /> Rejected by Admin
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin Note Box for Approved Requests */}
                {r.status === "approved" && (r.adminNote || (r.originalName && r.approvedName && r.originalName.toLowerCase() !== r.approvedName.toLowerCase())) && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1 text-xs">
                    {r.originalName && r.approvedName && r.originalName.toLowerCase() !== r.approvedName.toLowerCase() && (
                      <div>
                        <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] block">Standardisation Notice:</span>
                        <p className="text-emerald-950 font-serif-body">Requested as <strong>"{r.originalName}"</strong> and approved as official <strong>"{r.approvedName}"</strong>.</p>
                      </div>
                    )}
                    {r.adminNote && (
                      <div>
                        <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px] block">Admin Note:</span>
                        <p className="text-emerald-950 font-serif-body">{r.adminNote}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Feedback Box for Rejected Requests */}
                {r.status === "rejected" && (r.rejectionReason || r.adminSuggestion) && (
                  <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2 text-xs">
                    {r.rejectionReason && (
                      <div>
                        <span className="font-bold text-rose-900 uppercase tracking-wider text-[10px] block">Rejection Reason:</span>
                        <p className="text-rose-950 font-serif-body mt-0.5">{r.rejectionReason}</p>
                      </div>
                    )}
                    {r.adminSuggestion && (
                      <div className="pt-2 border-t border-rose-200/60">
                        <span className="font-bold text-blue-900 uppercase tracking-wider text-[10px] block">Admin Suggestion / Recommendation:</span>
                        <p className="text-blue-950 font-serif-body mt-0.5">{r.adminSuggestion}</p>
                      </div>
                    )}
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
