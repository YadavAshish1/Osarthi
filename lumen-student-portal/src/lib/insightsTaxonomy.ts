import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  API,
  BlogItem,
  MIN_INDEXABLE_TAXONOMY_COUNT,
  getInsightTaxonomyPath,
  mapContentToBlog,
  toTaxonomySlug,
} from "@/lib/api";
import type { InsightSort, TreeNode } from "@/components/FilterBar";

export const PAGE_SIZE = 21;
const VALID_SORTS = new Set<InsightSort>(["newest", "popular", "liked", "oldest"]);

export type InsightsSearchParams = {
  q?: string;
  teacher_id?: string;
  sort?: string;
  page?: string;
};

export interface TaxonomyContext {
  canonicalPath: string;
  eyebrow: string;
  title: string;
  accentTitle: string;
  description: string;
  breadcrumbs: { label: string; href?: string }[];
  childLinks: { label: string; href: string; active?: boolean }[];
  childLinksLabel?: string;
}

export interface ResolvedTaxonomyPageData {
  blogs: BlogItem[] | null;
  total: number;
  hasMore: boolean;
  pageNum: number;
  sortParam: InsightSort;
  tree: TreeNode[];
  teachers: { id: string; name: string }[];
  popularBlogs: BlogItem[];
  matchedIds: {
    classId: string;
    subjectId: string;
    topicId: string;
  };
  taxonomyContext: TaxonomyContext;
  searchQuery: {
    q: string;
    teacher_id: string;
  };
}

export function normalizeSort(val?: string): InsightSort {
  if (val && VALID_SORTS.has(val as InsightSort)) return val as InsightSort;
  return "newest";
}

function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val).trim();
  } catch {
    return val.trim();
  }
}

function normalizeClassAlias(slug: string): string {
  return slug.toLowerCase().replace(/(\d+)(?:st|nd|rd|th)\b/g, "$1");
}

function matchBySlug<T extends { name: string }>(
  items: T[],
  rawSlug: string,
  allowClassOrdinalAlias = false
): { item: T; exactMatch: boolean } | null {
  const decoded = safeDecode(rawSlug);
  const normalizedInput = toTaxonomySlug(decoded);

  for (const item of items) {
    const canonical = toTaxonomySlug(item.name);
    if (canonical === decoded) {
      return { item, exactMatch: true };
    }
  }

  for (const item of items) {
    const canonical = toTaxonomySlug(item.name);
    if (canonical === normalizedInput) {
      return { item, exactMatch: false };
    }
    if (allowClassOrdinalAlias && normalizeClassAlias(canonical) === normalizeClassAlias(normalizedInput)) {
      return { item, exactMatch: false };
    }
  }

  return null;
}

export async function fetchExploreTree(): Promise<TreeNode[]> {
  try {
    const res = await fetch(`${API}/explore/tree`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

function resolveTaxonomySelection(
  tree: TreeNode[],
  params: { classSlug: string; subjectSlug?: string; topicSlug?: string }
) {
  const classMatch = matchBySlug(tree, params.classSlug, true);
  if (!classMatch) return null;

  const cls = classMatch.item;
  let needsRedirect = !classMatch.exactMatch;

  type SubjectNode = NonNullable<TreeNode["subjects"]>[number];
  type TopicNode = NonNullable<SubjectNode["topics"]>[number];

  let subject: SubjectNode | undefined;
  if (params.subjectSlug !== undefined) {
    const subMatch = matchBySlug(cls.subjects || [], params.subjectSlug, false);
    if (!subMatch) return null;
    subject = subMatch.item;
    if (!subMatch.exactMatch) needsRedirect = true;
  }

  let topic: TopicNode | undefined;
  if (params.topicSlug !== undefined) {
    if (!subject) return null;
    const topMatch = matchBySlug(subject.topics || [], params.topicSlug, false);
    if (!topMatch) return null;
    topic = topMatch.item;
    if (!topMatch.exactMatch) needsRedirect = true;
  }

  const canonicalPath = getInsightTaxonomyPath(cls.name, subject?.name, topic?.name);
  const encodedCanonicalPath = getInsightTaxonomyPath(cls.name, subject?.name, topic?.name, true);

  return {
    cls,
    subject,
    topic,
    canonicalPath,
    encodedCanonicalPath,
    needsRedirect,
  };
}

async function fetchCountAndItems(query: URLSearchParams) {
  const res = await fetch(`${API}/explore/blogs?${query.toString()}`, {
    next: { revalidate: 60 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getTaxonomyMetadata(
  params: { classSlug: string; subjectSlug?: string; topicSlug?: string },
  sp: InsightsSearchParams
): Promise<Metadata> {
  const tree = await fetchExploreTree();
  const resolved = resolveTaxonomySelection(tree, params);

  if (!resolved) {
    return {
      title: "Study Notes Not Found",
      robots: { index: false, follow: false },
    };
  }

  const { cls, subject, topic, canonicalPath } = resolved;
  const pageNum = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const sortParam = normalizeSort(sp.sort);
  const hasFilters = Boolean(sp.q || sp.teacher_id || sortParam !== "newest" || pageNum > 1);

  const countQuery = new URLSearchParams({
    page: "1",
    limit: "1",
    classId: cls._id,
  });
  if (subject) countQuery.set("subjectId", subject._id);
  if (topic) countQuery.set("topicId", topic._id);

  let unfilteredTotal = 0;
  try {
    const data = await fetchCountAndItems(countQuery);
    unfilteredTotal = data?.total || 0;
  } catch {}

  const scopeParts = [cls.name, subject?.name, topic?.name].filter(Boolean);
  const scopeLabel = scopeParts.join(" — ");
  const pageSuffix = pageNum > 1 ? ` (Page ${pageNum})` : "";

  const title = topic
    ? `${topic.name} (${cls.name} ${subject?.name || ""}) Notes & Study Guides${pageSuffix}`
    : subject
    ? `${cls.name} ${subject.name} Notes & Insights${pageSuffix}`
    : `${cls.name} Study Notes & Insights${pageSuffix}`;

  const description = topic
    ? `Read free ${cls.name} ${subject?.name || ""} insights and chapter notes on ${topic.name} written by verified teachers on Medhashine.`
    : subject
    ? `Explore free ${cls.name} ${subject.name} study notes, topic guides, and conceptual explanations written by verified educators on Medhashine.`
    : `Browse all free ${cls.name} study notes and insights across subjects written by verified educators on Medhashine.`;

  const isIndexable = !hasFilters && unfilteredTotal >= MIN_INDEXABLE_TAXONOMY_COUNT;
  const encodedUrl = `https://www.medhashine.in${getInsightTaxonomyPath(cls.name, subject?.name, topic?.name, true)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    robots: isIndexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `${scopeLabel} | Medhashine`,
      description,
      url: encodedUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${scopeLabel} | Medhashine`,
      description,
    },
  };
}

export async function loadTaxonomyInsightsPage(
  params: { classSlug: string; subjectSlug?: string; topicSlug?: string },
  sp: InsightsSearchParams
): Promise<ResolvedTaxonomyPageData> {
  const tree = await fetchExploreTree();
  const resolved = resolveTaxonomySelection(tree, params);

  if (!resolved) {
    notFound();
  }

  const pageNum = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const sortParam = normalizeSort(sp.sort);

  if (resolved.needsRedirect) {
    const qs = new URLSearchParams();
    if (sp.q) qs.set("q", sp.q);
    if (sp.teacher_id) qs.set("teacher_id", sp.teacher_id);
    if (sortParam !== "newest") qs.set("sort", sortParam);
    if (pageNum > 1) qs.set("page", String(pageNum));
    const qStr = qs.toString();
    permanentRedirect(qStr ? `${resolved.encodedCanonicalPath}?${qStr}` : resolved.encodedCanonicalPath);
  }

  const { cls, subject, topic, canonicalPath } = resolved;

  const query = new URLSearchParams({
    page: String(pageNum),
    limit: String(PAGE_SIZE),
    sort: sortParam,
    classId: cls._id,
  });
  if (subject) query.set("subjectId", subject._id);
  if (topic) query.set("topicId", topic._id);
  if (sp.q) query.set("search", sp.q);
  if (sp.teacher_id) query.set("teacherId", sp.teacher_id);

  let blogs: BlogItem[] | null = null;
  let total = 0;
  let hasMore = false;
  let teachers: { id: string; name: string }[] = [];
  let popularBlogs: BlogItem[] = [];

  try {
    const [blogsData, teachersRes, popularRes] = await Promise.all([
      fetchCountAndItems(query),
      fetch(`${API}/explore/teachers`, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(6000),
      }),
      fetch(`${API}/explore/blogs?page=1&limit=3&sort=popular`, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(6000),
      }),
    ]);

    if (blogsData && Array.isArray(blogsData.items)) {
      blogs = blogsData.items.map(mapContentToBlog);
      total = blogsData.total || 0;
      hasMore = Boolean(blogsData.hasMore);
    }
    if (teachersRes.ok) {
      const tData = await teachersRes.json();
      if (Array.isArray(tData)) {
        teachers = tData.map((t: { _id: string; name: string }) => ({ id: t._id, name: t.name }));
      }
    }
    if (popularRes.ok) {
      const pData = await popularRes.json();
      if (pData && Array.isArray(pData.items)) {
        popularBlogs = pData.items.map(mapContentToBlog);
      }
    }
  } catch {}

  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "All Insights", href: "/insights" },
    { label: cls.name, href: subject ? getInsightTaxonomyPath(cls.name) : undefined },
  ];
  if (subject) {
    breadcrumbs.push({
      label: subject.name,
      href: topic ? getInsightTaxonomyPath(cls.name, subject.name) : undefined,
    });
  }
  if (topic) {
    breadcrumbs.push({ label: topic.name });
  }

  let childLinks: { label: string; href: string; active?: boolean }[] = [];
  let childLinksLabel = "";

  if (!subject) {
    childLinks = (cls.subjects || []).map((s) => ({
      label: s.name,
      href: getInsightTaxonomyPath(cls.name, s.name),
    }));
    if (childLinks.length > 0) childLinksLabel = `Subjects in ${cls.name}`;
  } else {
    childLinks = (subject.topics || []).map((t) => ({
      label: t.name,
      href: getInsightTaxonomyPath(cls.name, subject.name, t.name),
      active: topic?._id === t._id,
    }));
    if (childLinks.length > 0) {
      childLinksLabel = topic ? `More Topics in ${subject.name}` : `Topics in ${subject.name}`;
    }
  }

  const eyebrow = topic
    ? `${cls.name} • ${subject?.name}`
    : subject
    ? `${cls.name} Curriculum`
    : "Grade Directory";

  const title = topic ? `${topic.name} ` : subject ? `${cls.name} ` : `${cls.name} `;
  const accentTitle = topic
    ? `— ${subject?.name || cls.name}`
    : subject
    ? `${subject.name} Insights`
    : "Study Insights";

  const description = topic
    ? `Study notes, conceptual explanations, and verified educator guides for ${topic.name} (${cls.name} ${subject?.name || ""}).`
    : subject
    ? `Explore chapter-wise ${cls.name} ${subject.name} insights, topic explanations, and board exam notes curated by verified educators.`
    : `Explore all ${cls.name} educational insights and subject-wise notes written by verified teachers on Medhashine.`;

  return {
    blogs,
    total,
    hasMore,
    pageNum,
    sortParam,
    tree,
    teachers,
    popularBlogs,
    matchedIds: {
      classId: cls._id,
      subjectId: subject?._id || "",
      topicId: topic?._id || "",
    },
    taxonomyContext: {
      canonicalPath,
      eyebrow,
      title,
      accentTitle,
      description,
      breadcrumbs,
      childLinks,
      childLinksLabel,
    },
    searchQuery: {
      q: sp.q || "",
      teacher_id: sp.teacher_id || "",
    },
  };
}
