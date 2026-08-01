import type { Metadata } from "next";
import BlogDetailClient from "./BlogDetailClient";
import { API, BlogItem, FALLBACK_BLOGS, mapContentToBlog, getDefaultSubjectCover } from "@/lib/api";

function extractIdFromSlug(slug: string): string {
  const mongoMatch = slug.match(/([a-f0-9]{24})$/);
  if (mongoMatch) return mongoMatch[1];
  const lastHyphen = slug.lastIndexOf("-");
  if (lastHyphen !== -1) {
    const suffix = slug.slice(lastHyphen + 1);
    if (/^\d+$/.test(suffix)) return `blog-${suffix}`;
    return suffix;
  }
  return slug;
}

async function fetchBlogServer(id: string, slug: string): Promise<BlogItem | null> {
  try {
    const res = await fetch(`${API}/explore/blogs/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return mapContentToBlog(data);
      }
    }
  } catch {}

  return FALLBACK_BLOGS.find((b) => b.id === id || b.slug === slug) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug || "";
  const slug = decodeURIComponent(rawSlug);
  const id = extractIdFromSlug(slug);

  const blog = await fetchBlogServer(id, slug);

  if (!blog) {
    return {
      title: "Insight Not Found",
      description: "The requested insight could not be found.",
    };
  }

  const title = blog.title;
  const description = blog.excerpt || `Read "${blog.title}" by ${blog.teacher_name} on Medhashine Student Portal.`;
  const coverUrl = blog.cover || getDefaultSubjectCover(blog.subject);

  return {
    title,
    description,
    keywords: [
      blog.subject,
      blog.topic,
      blog.class_level,
      blog.teacher_name,
      "Medhashine",
      "essays",
      "insights",
      "education",
    ],
    authors: [{ name: blog.teacher_name }],
    openGraph: {
      title: `${blog.title} | Medhashine Student Portal`,
      description,
      type: "article",
      publishedTime: blog.created_at,
      authors: [blog.teacher_name],
      images: coverUrl ? [{ url: coverUrl, alt: blog.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${blog.title} | Medhashine Student Portal`,
      description,
      images: coverUrl ? [coverUrl] : [],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const rawSlug = resolvedParams.slug || "";
  const slug = decodeURIComponent(rawSlug);
  const id = extractIdFromSlug(slug);

  const blog = await fetchBlogServer(id, slug);

  // Structured Data (JSON-LD) for Schema.org BlogPosting / Article for Google Search
  const jsonLd = blog
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.excerpt,
        image: blog.cover || getDefaultSubjectCover(blog.subject),
        datePublished: blog.created_at,
        author: {
          "@type": "Person",
          name: blog.teacher_name,
        },
        publisher: {
          "@type": "Organization",
          name: "Medhashine Student Portal",
          url: "http://localhost:3000",
        },
        articleSection: blog.subject,
        keywords: [blog.subject, blog.topic, blog.class_level],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogDetailClient id={id} slug={slug} initialBlog={blog} />
    </>
  );
}
