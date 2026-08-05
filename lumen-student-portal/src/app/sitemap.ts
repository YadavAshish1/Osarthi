import type { MetadataRoute } from "next";
import { API, FALLBACK_BLOGS, slugify, getTeacherSlug } from "@/lib/api";

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
      url: `${baseUrl}/teachers`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/become-a-teacher`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
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

  let teacherRoutes: MetadataRoute.Sitemap = [];
  try {
    const tRes = await fetch(`${API}/explore/teachers`, { next: { revalidate: 3600 } });
    if (tRes.ok) {
      const teachers = await tRes.json();
      if (Array.isArray(teachers)) {
        teacherRoutes = teachers.map((t: any) => ({
          url: `${baseUrl}/teachers/${getTeacherSlug(t._id, t.name)}`,
          lastModified: new Date(),
          changeFrequency: "monthly",
          priority: 0.8,
        }));
      }
    }
  } catch {}

  if (teacherRoutes.length === 0) {
    const uniqueTeachers = Array.from(
      new Map(FALLBACK_BLOGS.map((b) => [b.teacher_id, b.teacher_name])).entries()
    );
    teacherRoutes = uniqueTeachers.map(([id, name]) => ({
      url: `${baseUrl}/teachers/${getTeacherSlug(id, name)}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...blogRoutes, ...teacherRoutes];
}
