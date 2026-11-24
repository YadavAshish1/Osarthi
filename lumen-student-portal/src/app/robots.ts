import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.medhashine.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Never block /_next/ so Googlebot can fetch CSS and JS chunks for rendering.
        // /teacher/ keeps its trailing slash so /teachers public profiles stay crawlable.
        disallow: ["/api/", "/profile/", "/teacher/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
