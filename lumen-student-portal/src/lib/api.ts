import axios from "axios";
import type { ContentBlock } from "./renderMarks";

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";
export const API = `${BACKEND_URL}/api`;

// axios instance — attaches JWT token from localStorage automatically
export const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization header on every request if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lumen_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function formatApiErrorDetail(detail: any): string {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  }
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

// ─── Blog / Content types ───────────────────────────────────────────────────

export interface BlogItem {
  id: string;
  slug: string; // SEO-friendly URL slug from title
  title: string;
  excerpt: string;
  content?: string;
  blocks?: ContentBlock[]; // raw backend blocks with marks/formatting
  cover: string;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string;
  class_level: string;
  subject: string;
  topic: string;
  read_minutes: number;
  created_at: string;
  likes_count?: number;
  user_liked?: boolean;
}

export interface Facets {
  teachers: { id: string; name: string }[];
  class_levels: string[];
  subjects: string[];
  topics: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  year?: string;
}

export interface ExperienceItem {
  title: string;
  organization: string;
  duration?: string;
}

export interface TeacherProfile {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  role?: string;
  education?: EducationItem[];
  experience?: ExperienceItem[];
  blogsCount?: number;
  subjects?: string[];
  createdAt?: string;
}

export interface TeacherProfileResponse {
  teacher: TeacherProfile;
  blogs: BlogItem[];
}

export interface CommentItem {
  id: string;
  blog_id: string;
  user_name: string;
  user_id?: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
  likes_count: number;
  user_liked?: boolean;
  replies?: CommentItem[];
}

// ─── Mapper: backend Content → BlogItem ────────────────────────────────────

/**
 * Generate a URL-friendly slug for a teacher profile.
 * e.g. "Dr. Aisha Verma" + "6839abc123" → "dr-aisha-verma-6839abc123"
 */
export function getTeacherSlug(id: string, name: string = "educator"): string {
  if (!id) return "";
  const cleanName = slugify(name);
  return `${cleanName}-${id}`;
}

/**
 * Generate a URL-friendly slug from a title.
 * e.g. "The Wonders of Science!" → "the-wonders-of-science"
 */
export function slugify(text: string): string {
  const clean = text
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "") // preserve Unicode letters, matras/marks (\p{M}), numbers
    .replace(/[\s_]+/g, "-")               // spaces/underscores → hyphens
    .replace(/-+/g, "-")                    // collapse multiple hyphens
    .replace(/^-+|-+$/g, "");               // trim leading/trailing hyphens
  return clean || "essay";
}

/**
 * Returns a subject-relevant default cover image URL for blog listing cards.
 */
export function getDefaultSubjectCover(subject?: string): string {
  const s = (subject || "").toLowerCase();

  if (s.includes("hindi") || s.includes("हिन्दी") || s.includes("हिंदी") || s.includes("पद्य") || s.includes("गद्य")) {
    return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"; // Warm aesthetic open book
  }
  if (s.includes("science") || s.includes("physics") || s.includes("chem") || s.includes("bio") || s.includes("विज्ञान") || s.includes("भौतिक")) {
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"; // Vibrant science art
  }
  if (s.includes("math") || s.includes("algebra") || s.includes("geom") || s.includes("गणित")) {
    return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"; // Glowing math geometry
  }
  if (s.includes("english") || s.includes("lit") || s.includes("साहित्य") || s.includes("भाषा")) {
    return "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"; // Warm library
  }
  if (s.includes("hist") || s.includes("social") || s.includes("geog") || s.includes("इतिहास") || s.includes("भूगोल")) {
    return "https://images.unsplash.com/photo-1461360370896-922624d12aa1?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"; // Vintage history
  }

  // Default educational book stack
  return "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?crop=entropy&cs=srgb&fm=jpg&q=85&w=800";
}

/**
 * Maps a raw /api/explore/blogs item (or /api/explore/blogs/:id) to BlogItem
 * used by the frontend components.
 */
export function mapContentToBlog(raw: any): BlogItem {
  const blocks: any[] = raw.blocks || [];

  // Build excerpt from first paragraph block text (max 200 chars)
  const firstPara = blocks.find((b) => b.type === "paragraph" && b.text?.trim());
  const excerpt = firstPara
    ? firstPara.text.slice(0, 200) + (firstPara.text.length > 200 ? "…" : "")
    : raw.title || "";

  // Build markdown-ish content string from blocks
  const content = blocks
    .map((b) => {
      if (b.type === "heading") return `## ${b.text}`;
      if (b.type === "paragraph") return b.text || "";
      if (b.type === "quote") return `> ${b.text}`;
      if (b.type === "list")
        return (b.items || []).map((item: string) => `- ${item}`).join("\n");
      if (b.type === "divider") return "---";
      return "";
    })
    .filter(Boolean)
    .join("\n\n");

  // Find first image block as cover (only set if explicit image block exists)
  const imgBlock = blocks.find((b) => b.type === "image" && b.url);
  const cover = imgBlock?.url ? imgBlock.url : "";

  // Estimate read time (avg 200 wpm)
  const wordCount = content.split(/\s+/).length;
  const read_minutes = Math.max(1, Math.ceil(wordCount / 200));

  const id = raw._id || raw.id;
  const title = raw.title || "Untitled";

  return {
    id,
    slug: `${slugify(title)}-${id}`, // e.g. "the-wonders-of-science-6839abc123"
    title,
    excerpt,
    content,
    blocks, // preserve raw blocks for rich rendering
    cover,
    teacher_id: raw.createdBy?._id || raw.createdBy || "",
    teacher_name: raw.createdBy?.name || "Teacher",
    teacher_avatar: raw.createdBy?.avatar || "",
    class_level: raw.classRef?.name || raw.classRef || "",
    subject: raw.subjectRef?.name || raw.subjectRef || "",
    topic: raw.topicRef?.name || raw.topicRef || "",
    read_minutes,
    created_at: raw.createdAt || raw.created_at || new Date().toISOString(),
    likes_count: raw.likes_count || 0,
    user_liked: raw.user_liked || false,
  };
}

// ─── Fallback data (shown when backend is unreachable) ──────────────────────

export const FALLBACK_BLOGS: BlogItem[] = [
  {
    id: "blog-1",
    slug: "the-elegance-of-newtons-third-law-in-everyday-life-blog-1",
    title: "The Elegance of Newton's Third Law in Everyday Life",
    excerpt: "From walking to rocket propulsion, every action has an equal and opposite reaction — and it shapes the world we live in.",
    content: "In every discipline, the questions we choose to ask reveal the shape of our curiosity. This piece invites you to slow down — to notice what is often hidden in plain sight.\n\n## Starting with wonder\nThe world does not offer its secrets easily. It waits for the patient observer, the one willing to look twice at the ordinary. As students, your greatest instrument is not memory but attention — the deliberate quality of noticing.\n\n## The idea in motion\nIdeas travel best when they are anchored in experience. Consider a simple observation from your own life and hold it against the framework we will build. The point is not to master a formula, but to feel how it clarifies what was murky moments ago.\n\n## Where this leads\nYou are not learning to pass an exam. You are learning to see. And once you have seen, the world quietly rearranges itself around your understanding. Carry this piece with you into your next quiet moment — and let the questions surface on their own.",
    cover: "https://images.unsplash.com/photo-1509869175650-a1d97972541a?crop=entropy&cs=srgb&fm=jpg&q=85",
    teacher_id: "t-ramesh",
    teacher_name: "Dr. Ramesh Yaduvanshi",
    teacher_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=srgb&fm=jpg&q=85",
    class_level: "Grade 10",
    subject: "Physics",
    topic: "Mechanics",
    read_minutes: 5,
    created_at: "2026-07-29T15:34:14.879874+00:00",
    likes_count: 14,
  },
  {
    id: "blog-2",
    slug: "why-prime-numbers-refuse-to-be-predictable-blog-2",
    title: "Why Prime Numbers Refuse to Be Predictable",
    excerpt: "The distribution of primes has puzzled mathematicians for centuries. Let's step into their curious world.",
    content: "Prime numbers are the atoms of arithmetic. Every integer greater than 1 is either a prime itself or can be built by multiplying primes together in a unique way.\n\n## The mystery of distribution\nWhile primes become less frequent as numbers get larger, they never cease. Euclid proved over two millennia ago that there are infinitely many primes.\n\n## Patterns in the chaos\nWhen mathematicians plotted prime distributions, subtle rhythms began to emerge.",
    cover: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?crop=entropy&cs=srgb&fm=jpg&q=85",
    teacher_id: "t-rohan",
    teacher_name: "Mr. Rohan Iyer",
    teacher_avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&q=85",
    class_level: "Grade 11",
    subject: "Mathematics",
    topic: "Number Theory",
    read_minutes: 6,
    created_at: "2026-07-28T15:34:14.880487+00:00",
    likes_count: 9,
  },
  {
    id: "blog-3",
    slug: "reading-between-the-lines-how-metaphor-shapes-thought-blog-3",
    title: "Reading Between the Lines: How Metaphor Shapes Thought",
    excerpt: "Metaphors are not just decorations — they are the scaffolding of how we perceive reality itself.",
    content: "We often think of metaphors as literary flourishes used by poets to dress up plain statements. But cognitive science reveals something far deeper.\n\n## Words as windows\nWhen we describe time as money, we don't just speak differently — we behave differently.\n\n## The literature of empathy\nBy stepping into stories built on rich metaphorical frameworks, readers build cognitive pathways for empathy.",
    cover: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?crop=entropy&cs=srgb&fm=jpg&q=85",
    teacher_id: "t-meera",
    teacher_name: "Ms. Meera Kapoor",
    teacher_avatar: "https://images.pexels.com/photos/27086922/pexels-photo-27086922.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    class_level: "Grade 12",
    subject: "Literature",
    topic: "Language & Style",
    read_minutes: 7,
    created_at: "2026-07-27T15:34:14.881470+00:00",
    likes_count: 22,
  },
];

export const FALLBACK_FACETS: Facets = {
  teachers: [
    { id: "t-ramesh", name: "Dr. Ramesh Yaduvanshi" },
    { id: "t-rohan", name: "Mr. Rohan Iyer" },
    { id: "t-meera", name: "Ms. Meera Kapoor" },
  ],
  class_levels: ["Grade 10", "Grade 11", "Grade 12"],
  subjects: ["Physics", "Mathematics", "Literature"],
  topics: ["Mechanics", "Number Theory", "Language & Style", "Calculus", "Optics", "Modernism"],
};
