import type { Metadata } from "next";
import { API, mapContentToBlog } from "@/lib/api";
import type { TreeNode } from "@/components/FilterBar";
import InsightsClient from "./InsightsClient";

const PAGE_SIZE = 21;

type SearchParams = Promise<{
  q?: string;
  teacher_id?: string;
  class_level?: string;
  subject?: string;
  topic?: string;
  page?: string;
}>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const pageNum = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const hasFilters = Boolean(
    sp.q || sp.teacher_id || sp.class_level || sp.subject || sp.topic || pageNum > 1
  );

  return {
    title: pageNum > 1 ? `All Insights — Page ${pageNum}` : "All Insights & Study Notes",
    description:
      "Browse free NCERT, UP Board, and CBSE educational insights and study notes across Hindi, Science, Mathematics, and Sanskrit written by verified educators.",
    alternates: {
      canonical: "/insights",
    },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: "All Insights & Study Notes | Medhashine",
      description:
        "Browse free educational insights and study notes written by verified educators on Medhashine.",
      url: "https://www.medhashine.in/insights",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "All Insights & Study Notes | Medhashine",
      description:
        "Browse free educational insights and study notes written by verified educators on Medhashine.",
    },
  };
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const pageNum = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const query = new URLSearchParams({
    page: String(pageNum),
    limit: String(PAGE_SIZE),
  });
  if (sp.q) query.set("search", sp.q);
  if (sp.class_level) query.set("classId", sp.class_level);
  if (sp.subject) query.set("subjectId", sp.subject);
  if (sp.topic) query.set("topicId", sp.topic);
  if (sp.teacher_id) query.set("teacherId", sp.teacher_id);

  let initialBlogs: ReturnType<typeof mapContentToBlog>[] | null = null;
  let initialTotal = 0;
  let initialHasMore = false;
  let initialTree: TreeNode[] = [];
  let initialTeachers: { id: string; name: string }[] = [];

  try {
    const [blogsRes, treeRes, teachersRes] = await Promise.all([
      fetch(`${API}/explore/blogs?${query.toString()}`, {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${API}/explore/tree`, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`${API}/explore/teachers`, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    if (blogsRes.ok) {
      const data = await blogsRes.json();
      if (data && Array.isArray(data.items)) {
        initialBlogs = data.items.map(mapContentToBlog);
        initialTotal = data.total || 0;
        initialHasMore = Boolean(data.hasMore);
      }
    }
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (Array.isArray(treeData)) initialTree = treeData;
    }
    if (teachersRes.ok) {
      const teacherData = await teachersRes.json();
      if (Array.isArray(teacherData)) {
        initialTeachers = teacherData.map((t: { _id: string; name: string }) => ({
          id: t._id,
          name: t.name,
        }));
      }
    }
  } catch {}

  return (
    <InsightsClient
      initialBlogs={initialBlogs}
      initialTotal={initialTotal}
      initialHasMore={initialHasMore}
      initialPage={pageNum}
      initialTree={initialTree}
      initialTeachers={initialTeachers}
      initialQuery={{
        q: sp.q || "",
        teacher_id: sp.teacher_id || "",
        class_level: sp.class_level || "",
        subject: sp.subject || "",
        topic: sp.topic || "",
      }}
    />
  );
}
