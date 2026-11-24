import type { MetadataRoute } from "next";
import { API, slugify, getTeacherSlug } from "@/lib/api";

// Force dynamic sitemap assembly per request while Data Cache (`revalidate: 3600`) caches API payloads;
// prevents Render cold-start timeouts during `next build` from baking an empty static sitemap onto CDN.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.medhashine.in").replace(/\/+$/, "");

  // Static routes — fixed metadata without regenerating misleading current-timestamp lastModified
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/insights`,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/teachers`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/become-a-teacher`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore && page <= 50) {
      const res = await fetch(`${API}/explore/blogs?page=${page}&limit=200`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) break;
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      for (const item of items) {
        const id = item._id || item.id;
        if (!id) continue;
        const rawSlug = item.slug || (item.title ? `${slugify(item.title)}-${id}` : id);
        const modDate = item.updatedAt || item.updated_at || item.createdAt || item.created_at;
        blogRoutes.push({
          url: `${baseUrl}/blog/${encodeURIComponent(rawSlug)}`,
          ...(modDate ? { lastModified: new Date(modDate) } : {}),
          changeFrequency: "weekly",
          priority: 0.9,
        });
      }
      hasMore = Boolean(data?.hasMore);
      page += 1;
    }
  } catch {}

  const teacherRoutes: MetadataRoute.Sitemap = [];
  try {
    const tRes = await fetch(`${API}/explore/teachers`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (tRes.ok) {
      const teachers = await tRes.json();
      if (Array.isArray(teachers)) {
        for (const t of teachers) {
          // Exclude sparse 0-article placeholder profiles matching robots noindex policy
          if ((t.blogsCount || 0) === 0 && (!t.bio || t.bio.trim().length < 60)) continue;
          const teacherSlug = getTeacherSlug(t._id, t.name);
          teacherRoutes.push({
            url: `${baseUrl}/teachers/${encodeURIComponent(teacherSlug)}`,
            changeFrequency: "monthly",
            priority: 0.8,
          });
        }
      }
    }
  } catch {}

  return [...staticRoutes, ...blogRoutes, ...teacherRoutes];
}
