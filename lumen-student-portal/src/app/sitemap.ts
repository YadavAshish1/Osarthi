import type { MetadataRoute } from "next";
import { FALLBACK_BLOGS } from "@/lib/api";

export default async function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "http://localhost:3000";

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

  // Dynamic blog routes
  const blogRoutes: MetadataRoute.Sitemap = FALLBACK_BLOGS.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug || blog.id}`,
    lastModified: new Date(blog.created_at || Date.now()),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...blogRoutes];
}
