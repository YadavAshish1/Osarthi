import type { MetadataRoute } from "next";
import { API, FALLBACK_BLOGS, slugify } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.medhashine.in";

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  let blogs: { id: string; slug: string; created_at?: string }[] = FALLBACK_BLOGS.map((b) => ({
    id: b.id,
    slug: b.slug || `${slugify(b.title)}-${b.id}`,
    created_at: b.created_at,
  }));

  try {
    const res = await fetch(`${API}/explore/blogs?limit=200`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        blogs = data.items.map((item: any) => {
          const id = item._id || item.id;
          const title = item.title || "";
          const slug = item.slug || (title ? `${slugify(title)}-${id}` : id);
          return {
            id,
            slug,
            created_at: item.createdAt || item.created_at,
          };
        });
      }
    }
  } catch {}

  const blogRoutes: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug}`,
    lastModified: blog.created_at ? new Date(blog.created_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...blogRoutes];
}
