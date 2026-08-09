"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Search,
  BookOpen,
  LifeBuoy,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Mail,
  Lock,
  Clock,
  Sparkles,
  PenSquare,
  GlobeOff,
  RotateCcw,
  Users,
  AlertTriangle,
  Send,
  X,
  FileText,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Check,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  category: "student" | "educator" | "account";
  categoryLabel: string;
  excerpt: string;
  readTime: string;
  tags: string[];
  content: {
    summary: string;
    steps: string[];
    proTip?: string;
    warning?: string;
  };
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "student" | "educator" | "account";
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "auto-save-recovery",
    title: "Draft Auto-Save & Crash Recovery Guide",
    category: "educator",
    categoryLabel: "Educator Studio",
    excerpt: "Learn how your draft insights are automatically saved locally and protected during power outages or system crashes.",
    readTime: "2 min read",
    tags: ["Auto-Save Recovery", "Crash Protection", "Drafts"],
    content: {
      summary: "Medhashine automatically protects your work against unexpected system crashes, browser freezes, or sudden power cuts while writing an insight.",
      steps: [
        "As you write or edit inside the Native Editor, your title and content blocks are automatically saved to local browser storage 1 second after you stop typing.",
        "An 'Auto-saved (time)' green indicator appears in the editor header so you always know your progress is safe.",
        "If your system turns off or the browser closes unexpectedly, simply open /teacher/write again.",
        "The editor will automatically detect your unsaved draft and restore it instantly with a notice: 'Restored unsaved draft from your previous session'.",
        "If you want to discard the restored local draft and start fresh, click the 'Discard Unsaved Draft' button in the header.",
        "Once you click 'Save Draft' or 'Publish Live', the local cache is automatically cleared from your browser.",
      ],
      proTip: "You do not need to click Save after every line. The automatic background saver keeps your draft synced continuously.",
    },
  },
  {
    id: "unpublish-live-insights",
    title: "How to Unpublish & Switch Live Insights to Drafts",
    category: "educator",
    categoryLabel: "Educator Studio",
    excerpt: "Step-by-step instructions on moving a live published blog back into draft status without losing student reach data.",
    readTime: "1 min read",
    tags: ["Unpublish Insight", "Draft Status", "Publishing"],
    content: {
      summary: "Educators can unpublish live insights at any time to update content privately or temporarily hide them from student view.",
      steps: [
        "Go to your Educator Studio Dashboard (/teacher/dashboard).",
        "Find the insight you wish to unpublish under the Content Management table.",
        "Click the amber 'Unpublish' button under the Publish Control column.",
        "Alternatively, inside the Native Editor for that insight, click the 'Unpublish' button in the top action bar.",
        "The insight status will immediately change to Draft, removing it from live student reading rooms while keeping your views and likes intact.",
      ],
      proTip: "Unpublishing does NOT erase student likes, views, or bookmarks. When you republish, all analytics resume seamlessly.",
    },
  },
  {
    id: "recycle-bin-30-days",
    title: "30-Day Recycle Bin Retention & Restoration",
    category: "educator",
    categoryLabel: "Educator Studio",
    excerpt: "Understand how soft deletion works, the 30-day safety retention window, and how to restore (unbin) deleted insights.",
    readTime: "2 min read",
    tags: ["Recycle Bin 30 Days", "Soft Delete", "Restore"],
    content: {
      summary: "All deleted insights and subjects are safely kept in a 30-Day Recycle Bin before permanent deletion, giving you total peace of mind.",
      steps: [
        "When you click Delete on an insight, a custom confirmation modal opens requiring you to type the insight title.",
        "Upon confirmation, the insight is soft-deleted and moved to your Recycle Bin for 30 days.",
        "To view your deleted items, open /teacher/dashboard and select the 'Recycle Bin' filter tab.",
        "Each item shows a live countdown badge: '[N] days left' remaining in retention.",
        "Click 'Restore (Unbin)' at any time within 30 days to instantly restore the insight to active drafts.",
        "After 30 days, items in the Recycle Bin are automatically purged from the database.",
      ],
      warning: "Permanent Delete inside the Recycle Bin is irreversible and erases all data forever from the database.",
    },
  },
  {
    id: "native-editor-formatting",
    title: "Mastering the Native Block Editor & Formatting",
    category: "educator",
    categoryLabel: "Educator Studio",
    excerpt: "Add Headings, Paragraphs, Blockquotes, Lists, Media uploads, and custom text formatting with auto-expanding blocks.",
    readTime: "3 min read",
    tags: ["Native Block Editor", "Formatting", "Media Upload"],
    content: {
      summary: "Create rich, beautifully formatted educational insights using our block-based interactive editor.",
      steps: [
        "Use the '+ Insert Content Block' bar to add Headings (H1/H2), Paragraphs, Blockquotes, Bullet Lists, Images, or Videos.",
        "Select any text inside a paragraph or heading to open the sticky formatting bar.",
        "Apply Bold, Italic, Underline, Background Highlights, or Custom Font Colors with a single click.",
        "Text blocks auto-expand vertically as you type so you never experience internal scrollbars inside writing blocks.",
        "Use the Live Preview button to preview the exact reading experience students will see on Medhashine.",
      ],
      proTip: "Click the AI Tools button in the formatting bar to generate auto-summaries and target readership recommendations for your insight.",
    },
  },
  {
    id: "audience-reach-analytics",
    title: "Understanding Audience Reach & Class Level Analytics",
    category: "educator",
    categoryLabel: "Educator Studio",
    excerpt: "How real student view metrics and class-level readership maps are calculated dynamically in your Educator Studio.",
    readTime: "2 min read",
    tags: ["Audience Reach", "Class Level Analytics", "Real Database Metrics"],
    content: {
      summary: "Track how your subject expertise impacts real students across different class levels and competitive exams.",
      steps: [
        "Open /teacher/dashboard to view your real database analytics cards: Total Insights, Total Student Reach, Appreciations, and Bookmarks.",
        "The 'Audience Reach by Your Active Classes' breakdown dynamically groups your views ONLY for the classes in which you have posted insights.",
        "Each class card displays your exact student view reach, total published insights in that class, and a relative readership bar.",
        "Metrics update in real time whenever students read or appreciate your published insights.",
      ],
    },
  },
  {
    id: "student-bookmarks-teachers",
    title: "Student Guide: Reading Room, Bookmarks & Finding Teachers",
    category: "student",
    categoryLabel: "Students Hub",
    excerpt: "Discover verified educators, filter academic insights by Class & Subject, and save bookmarks to your personal reading list.",
    readTime: "2 min read",
    tags: ["Find Teachers", "Bookmark Articles", "Reading Room"],
    content: {
      summary: "Medhashine gives students a quiet, distraction-free environment to learn directly from verified subject experts.",
      steps: [
        "Browse the Reading Room on the homepage or visit /teachers to search verified educators by name or subject.",
        "Use the class and subject taxonomy filters to narrow down insights tailored to your grade or competitive exam syllabus.",
        "Click the Bookmark icon on any insight card to save it to your personal profile (/profile/saved) for revision.",
        "Click the Heart icon to appreciate educators and encourage more in-depth academic guides.",
        "Use the 'Request Guidance' button on teacher profiles to ask academic questions directly.",
      ],
      proTip: "All reading content on Medhashine is free to read with zero paywalls or intrusive ads.",
    },
  },
  {
    id: "password-reset-account",
    title: "Password Reset & Account Security Protocol",
    category: "account",
    categoryLabel: "Account & Security",
    excerpt: "How to securely reset your password using OTP verification and update your profile credentials.",
    readTime: "1 min read",
    tags: ["Password Reset", "OTP Verification", "Account Security"],
    content: {
      summary: "Maintain secure access to your Medhashine student or educator account with multi-factor OTP verification.",
      steps: [
        "If you forget your password, click 'Sign In' in the top header and select 'Forgot Password?'.",
        "Enter your registered email address to receive a secure 6-digit One-Time Password (OTP).",
        "Enter the 6-digit OTP along with your new strong password to instantly reset access.",
        "To update your display name, bio, or avatar, visit your Account Profile (/profile).",
      ],
      warning: "Never share your OTP or account password with anyone. Medhashine support will never ask for your password.",
    },
  },
  {
    id: "teacher-verification-application",
    title: "How to Apply for Verified Educator Status",
    category: "educator",
    categoryLabel: "Educator Studio",
    excerpt: "Requirements and step-by-step process for subject teachers to get verified and start publishing on Medhashine.",
    readTime: "2 min read",
    tags: ["Teacher Verification", "Educator Application"],
    content: {
      summary: "Verified Educators get access to the Native Content Studio, real audience analytics, and direct student reach.",
      steps: [
        "Sign up for a Medhashine account and select 'Teacher / Educator' during registration or click 'Become a Teacher'.",
        "Submit your educator application detailing your subject specialization, teaching experience, and institution.",
        "Our academic governance team reviews credentials within 24–48 hours.",
        "Once approved, a 'Verified Educator' badge appears on your profile and your 'Write New Insight' studio activates instantly.",
      ],
    },
  },
];

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "What happens if my laptop shuts down while writing an insight?",
    answer: "Your work is completely safe! Medhashine automatically saves your title and content blocks to your browser's local cache every second. When you return to /teacher/write, your unsaved draft will be automatically restored with a timestamp notice.",
    category: "educator",
  },
  {
    id: "faq-2",
    question: "How long do deleted insights stay in the Recycle Bin?",
    answer: "Deleted items remain in the Recycle Bin for exactly 30 days. During this period, you can click 'Restore (Unbin)' anytime to bring them back. After 30 days, they are permanently purged from the database.",
    category: "educator",
  },
  {
    id: "faq-3",
    question: "Is Medhashine free for students to read and bookmark?",
    answer: "Yes, 100%! Medhashine is built on the principle of free, quiet reflection with no paywalls, zero subscription fees, and no intrusive popups.",
    category: "student",
  },
  {
    id: "faq-4",
    question: "Can I unpublish a live insight without deleting student likes or views?",
    answer: "Yes! Unpublishing changes the insight status back to Draft, hiding it from live reading rooms. All student views, appreciations, and bookmarks are preserved intact when you republish.",
    category: "educator",
  },
  {
    id: "faq-5",
    question: "How do I reset my password if I forget it?",
    answer: "Click 'Sign In' in the navbar, select 'Forgot Password?', enter your email, and a 6-digit OTP will be sent to verify your identity before setting a new password.",
    category: "account",
  },
  {
    id: "faq-6",
    question: "How can I become an Approved Verified Educator on Medhashine?",
    answer: "Click 'Become a Teacher' in the navigation bar or footer, fill out your teaching background and subject expertise, and our academic governance team will review your application within 24–48 hours.",
    category: "educator",
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "student" | "educator" | "account">("all");
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // FAQ Expand state
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-1");

  // Support Ticket Modal state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "student",
    category: "technical",
    subject: "",
    message: "",
  });
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Filter Articles
  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return HELP_ARTICLES.filter((article) => {
      const matchesTab = activeTab === "all" || article.category === activeTab;
      const matchesQuery =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.excerpt.toLowerCase().includes(q) ||
        article.tags.some((t) => t.toLowerCase().includes(q));
      return matchesTab && matchesQuery;
    });
  }, [searchQuery, activeTab]);

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQS.filter((faq) => {
      const matchesTab = activeTab === "all" || faq.category === activeTab;
      const matchesQuery =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [searchQuery, activeTab]);

  // Quick tag selection
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  // Submit Support Ticket Form to Backend
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.name.trim() || !ticketForm.email.trim() || !ticketForm.message.trim()) {
      toast.error("Please fill in your name, email, and message details.");
      return;
    }

    setSubmittingTicket(true);
    try {
      const { data } = await api.post("/support/tickets", ticketForm);
      setTicketId(data.ticketId || `MS-${Math.floor(100000 + Math.random() * 900000)}`);
      setTicketSubmitted(true);
      toast.success(data.message || `Support Ticket submitted successfully!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit support ticket");
    } finally {
      setSubmittingTicket(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] font-ui">
      {/* ─── HERO SEARCH HEADER (BILLION DOLLAR STYLE) ────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F4EFE6] to-[#FAF8F5] border-b border-[#E5E1D8] pt-16 pb-20 md:pt-24 md:pb-28 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FBF4F2] border border-[#A84C32]/20 text-[#A84C32] text-xs font-bold tracking-wider uppercase shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" /> Medhashine Help & Knowledge Center
          </div>

          <h1 className="font-serif-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#1A1A1A] leading-[1.15]">
            How can we help you today?
          </h1>

          <p className="font-serif-body text-base sm:text-lg text-[#5C5A55] max-w-2xl mx-auto leading-relaxed">
            Search our knowledge base articles, educator guides, and crash recovery protocols, or submit a support request.
          </p>

          {/* Large Hero Interactive Search Bar */}
          <div className="max-w-2xl mx-auto relative pt-4">
            <div className="relative flex items-center">
              <Search className="absolute left-5 text-[#A84C32] h-5 w-5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, e.g. 'Auto-save recovery', 'Unpublish', '30-day bin'…"
                className="w-full pl-14 pr-12 py-4 text-sm md:text-base font-medium rounded-full bg-white border-2 border-[#E5E1D8] shadow-lg focus:outline-none focus:border-[#A84C32] focus:ring-4 focus:ring-[#A84C32]/10 transition-all placeholder:text-[#5C5A55]/60 text-[#1A1A1A]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-[#5C5A55] hover:text-[#1A1A1A] p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Popular Search Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap mt-4 text-xs">
              <span className="text-[#5C5A55] font-semibold text-[11px] uppercase tracking-wider">Popular Searches:</span>
              {[
                "Auto-Save Recovery",
                "Unpublish Insight",
                "Recycle Bin 30 Days",
                "Teacher Verification",
                "Password Reset",
                "Bookmarks",
              ].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    searchQuery.toLowerCase() === tag.toLowerCase()
                      ? "bg-[#A84C32] text-white border-[#A84C32]"
                      : "bg-white border-[#E5E1D8] text-[#5C5A55] hover:border-[#A84C32] hover:text-[#1A1A1A]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE SYSTEM STATUS & SUPPORT SLA RIBBON ──────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        <div className="p-4 md:p-6 rounded-3xl bg-white border border-[#E5E1D8] shadow-md grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-ui">
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF8F5]">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-[#1A1A1A] text-sm">All Systems Operational</p>
              <p className="text-[#5C5A55]">Database, API & Auto-Save active</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF8F5]">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-[#1A1A1A] text-sm">Response Time SLA</p>
              <p className="text-[#5C5A55]">Average ticket response: &lt; 2 hours</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FAF8F5]">
            <div className="w-10 h-10 rounded-xl bg-[#FBF4F2] text-[#A84C32] flex items-center justify-center border border-[#A84C32]/20 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-[#1A1A1A] text-sm">Verified Helpdesk Desk</p>
              <p className="text-[#5C5A55]">24/7 Support for Students & Teachers</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MAIN KNOWLEDGE BASE CONTENT AREA ─────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Category Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E1D8] pb-4">
          <div>
            <span className="eyebrow text-[#A84C32] block mb-1">Browse Help Library</span>
            <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
              Knowledge Base Guides & Instructions
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap font-ui text-xs">
            {[
              { id: "all", label: "All Topics" },
              { id: "educator", label: "Educator Studio 👩‍🏫" },
              { id: "student", label: "Students Hub 🎓" },
              { id: "account", label: "Account & Security 🔐" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-full font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#1A1A1A] text-white shadow-xs"
                    : "bg-white border border-[#E5E1D8] text-[#5C5A55] hover:text-[#1A1A1A] hover:border-[#A84C32]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Knowledge Base Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.length === 0 ? (
            <div className="col-span-full py-16 text-center space-y-3 font-serif-body bg-white rounded-3xl border border-[#E5E1D8] p-8">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A]">No matching guides found</h3>
              <p className="text-sm text-[#5C5A55] max-w-sm mx-auto">
                Try adjusting your search query or switch categories to explore guides.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                }}
                className="px-5 py-2 rounded-full bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-colors cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="p-6 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs hover:shadow-md hover:border-[#A84C32]/40 transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#FBF4F2] text-[#A84C32] border border-[#A84C32]/20">
                      {article.categoryLabel}
                    </span>
                    <span className="text-[11px] text-[#5C5A55] flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5" /> {article.readTime}
                    </span>
                  </div>

                  <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A] group-hover:text-[#A84C32] transition-colors leading-snug">
                    {article.title}
                  </h3>

                  <p className="font-serif-body text-xs text-[#5C5A55] line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E1D8]/60 flex items-center justify-between text-xs font-semibold text-[#A84C32] group-hover:translate-x-1 transition-transform">
                  <span>Read Full Guide</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── FREQUENTLY ASKED QUESTIONS (ACCORDION SECTION) ─────────────────── */}
        <div className="p-8 md:p-10 rounded-3xl bg-white border border-[#E5E1D8] shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
            <div>
              <span className="eyebrow text-[#A84C32] block mb-1">Quick Answers</span>
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
                Frequently Asked Questions
              </h2>
            </div>
            <MessageSquare className="h-6 w-6 text-[#A84C32]" />
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;

              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-[#E5E1D8] overflow-hidden bg-[#FAF8F5]/60 transition-colors"
                >
                  <button
                    onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-serif-display text-base font-semibold text-[#1A1A1A] hover:text-[#A84C32] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-[#A84C32] shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[#5C5A55] shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 font-serif-body text-sm text-[#5C5A55] leading-relaxed border-t border-[#E5E1D8]/60 pt-4 bg-white animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── DIRECT SUPPORT CHANNELS & TICKET BANNER ───────────────────────── */}
        <div className="p-8 md:p-10 rounded-3xl bg-[#FAF8F5] border border-[#E5E1D8] flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="eyebrow text-[#A84C32] block">Need Personal Assistance?</span>
            <h3 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#1A1A1A]">
              Still have questions? Our support team is ready to help.
            </h3>
            <p className="font-serif-body text-sm text-[#5C5A55]">
              Submit a support ticket or reach out to our dedicated educator & student support desk.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <button
              onClick={() => {
                setTicketSubmitted(false);
                setTicketModalOpen(true);
              }}
              className="lumen-button-primary py-3.5 px-6 text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Submit Support Ticket</span>
            </button>

            <a
              href="mailto:support@medhashine.com"
              className="px-5 py-3.5 rounded-full bg-white border border-[#E5E1D8] text-[#1A1A1A] text-xs font-semibold hover:border-[#A84C32] transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Mail className="h-4 w-4 text-[#A84C32]" />
              <span>Email Support</span>
            </a>
          </div>
        </div>
      </main>

      {/* ─── MODAL 1: KNOWLEDGE BASE ARTICLE READER MODAL ─────────────────────── */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-[#E5E1D8] shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in duration-200 font-ui">
            <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FBF4F2] text-[#A84C32] border border-[#A84C32]/20">
                  {selectedArticle.categoryLabel}
                </span>
                <span className="text-xs text-[#5C5A55]">• {selectedArticle.readTime}</span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-[#5C5A55] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif-display text-2xl md:text-3xl font-semibold text-[#1A1A1A]">
                {selectedArticle.title}
              </h2>

              <p className="font-serif-body text-sm text-[#5C5A55] bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E1D8] leading-relaxed">
                {selectedArticle.content.summary}
              </p>

              {/* Step by step instructions */}
              <div className="space-y-3 pt-2">
                <h4 className="font-serif-display text-base font-semibold text-[#1A1A1A]">
                  Step-by-Step Instructions:
                </h4>
                <ol className="space-y-2 text-xs md:text-sm font-serif-body text-[#2A2A2A]">
                  {selectedArticle.content.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#FAF8F5]/80 border border-[#E5E1D8]/60">
                      <span className="w-5 h-5 rounded-full bg-[#1A1A1A] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-ui">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Pro Tip Callout Box */}
              {selectedArticle.content.proTip && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <Sparkles className="h-4 w-4 text-emerald-600" /> Pro Tip:
                  </p>
                  <p>{selectedArticle.content.proTip}</p>
                </div>
              )}

              {/* Warning Callout Box */}
              {selectedArticle.content.warning && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-rose-900">
                    <ShieldAlert className="h-4 w-4 text-rose-600" /> Warning Notice:
                  </p>
                  <p>{selectedArticle.content.warning}</p>
                </div>
              )}
            </div>

            {/* Modal Footer Rating */}
            <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between text-xs text-[#5C5A55]">
              <span>Was this guide helpful?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success("Thank you for your feedback!")}
                  className="px-3 py-1.5 rounded-full border border-[#E5E1D8] hover:border-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer bg-white"
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> Yes
                </button>
                <button
                  onClick={() => toast.success("Thank you! We will improve this guide.")}
                  className="px-3 py-1.5 rounded-full border border-[#E5E1D8] hover:border-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer bg-white"
                >
                  <ThumbsDown className="h-3.5 w-3.5" /> No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SUPPORT TICKET SUBMISSION MODAL ────────────────────────── */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-[#E5E1D8] shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 font-ui">
            <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-4">
              <h3 className="font-serif-display text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Send className="h-5 w-5 text-[#A84C32]" /> Submit Support Request
              </h3>
              <button
                onClick={() => setTicketModalOpen(false)}
                className="text-[#5C5A55] hover:text-[#1A1A1A] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {ticketSubmitted ? (
              /* Success State */
              <div className="py-8 text-center space-y-4 font-serif-body">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 font-bold text-[#1A1A1A]">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h4 className="font-serif-display text-2xl font-semibold text-[#1A1A1A]">Ticket Submitted!</h4>
                <p className="text-sm text-[#5C5A55] max-w-sm mx-auto">
                  Your ticket ID is <strong className="text-[#1A1A1A]">{ticketId}</strong>. Our support team will reply to <strong>{ticketForm.email}</strong> within 2 hours.
                </p>
                <button
                  onClick={() => setTicketModalOpen(false)}
                  className="px-6 py-2.5 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold hover:bg-[#A84C32] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Ticket Form */
              <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs font-ui">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1A1A1A] mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                      placeholder="e.g. Ashish Yadav"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] text-[#1A1A1A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1A1A1A] mb-1">Your Email *</label>
                    <input
                      type="email"
                      required
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                      placeholder="e.g. ashish@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] text-[#1A1A1A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1A1A1A] mb-1">
                      Mobile Number <span className="text-[#8E8B82] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={ticketForm.phone}
                      onChange={(e) => setTicketForm({ ...ticketForm, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] text-[#1A1A1A]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1A1A1A] mb-1">I am a *</label>
                    <select
                      value={ticketForm.role}
                      onChange={(e) => setTicketForm({ ...ticketForm, role: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] text-[#1A1A1A] bg-white cursor-pointer"
                    >
                      <option value="student">Student</option>
                      <option value="educator">Educator / Teacher</option>
                      <option value="other">General Reader</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1A1A1A] mb-1">Issue Category *</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] text-[#1A1A1A] bg-white cursor-pointer"
                    >
                      <option value="technical">Technical Glitch / Editor</option>
                      <option value="verification">Teacher Verification</option>
                      <option value="account">Account & Password</option>
                      <option value="content">Content Query</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1A1A1A] mb-1">Subject Summary *</label>
                    <input
                      type="text"
                      required
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                      placeholder="Brief description of your issue…"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] text-[#1A1A1A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">Detailed Message *</label>
                  <textarea
                    rows={4}
                    required
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    placeholder="Explain what happened or what help you need…"
                    className="w-full p-3.5 rounded-xl border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A84C32] text-[#1A1A1A] leading-relaxed resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setTicketModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-full border border-[#E5E1D8] text-[#5C5A55] text-xs font-semibold hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket}
                    className="flex-1 py-3 px-4 rounded-full bg-[#A84C32] text-white text-xs font-semibold hover:bg-[#8C3A27] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {submittingTicket ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
