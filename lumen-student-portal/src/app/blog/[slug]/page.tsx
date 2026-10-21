import type { Metadata } from "next";
import BlogDetailClient from "./BlogDetailClient";
import { API, BlogItem, FALLBACK_BLOGS, mapContentToBlog, getDefaultSubjectCover } from "@/lib/api";
import { romanizeHindi, hasDevanagari } from "@/lib/transliterate";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.medhashine.in";

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

// Detect article language based on subject + title content
function detectLanguage(subject: string, title: string): "hi-IN" | "en-IN" {
  const hindiSubjects = [
    "Hindi", "हिंदी", "हिन्दी", "Sanskrit", "संस्कृत",
    "हिंदी पद्य", "हिन्दी पद्य", "हिंदी गद्य", "हिन्दी गद्य",
    "व्याकरण", "पद्य", "गद्य", "कहानी", "कविता",
  ];
  if (hindiSubjects.includes(subject)) return "hi-IN";
  if (hasDevanagari(title) || hasDevanagari(subject)) return "hi-IN";
  return "en-IN";
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
  const lang = detectLanguage(blog.subject, blog.title);
  const isHindi = lang === "hi-IN";

  const romanizedTitle = isHindi ? romanizeHindi(blog.title) : "";
  const romanizedTopic = isHindi && blog.topic ? romanizeHindi(blog.topic) : "";

  const description =
    blog.excerpt ||
    (isHindi && (romanizedTopic || romanizedTitle)
      ? `Read "${blog.title}" (${romanizedTopic || romanizedTitle}) notes, explanation, and summary for ${blog.class_level || ""} ${blog.subject || ""} on Medhashine.`
      : `Read "${blog.title}" by ${blog.teacher_name} on Medhashine.`);
  const coverUrl = blog.cover || getDefaultSubjectCover(blog.subject);

  const canonicalSlug = blog.slug || rawSlug;
  const canonicalUrl = `/blog/${canonicalSlug}`;

  return {
    title,
    description,
    keywords: [
      // Core content identifiers
      blog.subject,
      blog.topic,
      blog.class_level,
      blog.teacher_name,
      // Combination keywords
      blog.class_level && blog.subject ? `${blog.class_level} ${blog.subject}` : null,
      blog.class_level && blog.subject ? `${blog.class_level} ${blog.subject} notes` : null,
      blog.class_level && blog.subject ? `${blog.class_level} ${blog.subject} Medhashine` : null,
      blog.topic && blog.subject ? `${blog.topic} ${blog.subject}` : null,
      blog.topic ? `${blog.topic} notes` : null,
      blog.topic ? `${blog.topic} question answer` : null,
      // Hindi-specific Devanagari variants
      isHindi && blog.topic ? `${blog.topic} प्रश्न उत्तर` : null,
      isHindi && blog.topic ? `${blog.topic} सारांश` : null,
      isHindi && blog.topic ? `${blog.topic} व्याख्या` : null,
      isHindi && blog.topic ? `${blog.topic} निबंध` : null,
      // Hinglish & Romanized transliterated search variants (Google & Bing ranking)
      romanizedTopic ? romanizedTopic : null,
      romanizedTopic ? `${romanizedTopic} notes` : null,
      romanizedTopic ? `${romanizedTopic} summary` : null,
      romanizedTopic ? `${romanizedTopic} vyakhya` : null,
      romanizedTopic ? `${romanizedTopic} question answer` : null,
      romanizedTopic && blog.class_level ? `${romanizedTopic} ${blog.class_level}` : null,
      romanizedTopic && blog.class_level ? `${romanizedTopic} ${blog.class_level} up board` : null,
      romanizedTitle && romanizedTitle !== romanizedTopic ? romanizedTitle : null,
      romanizedTitle ? `${romanizedTitle} notes` : null,
      romanizedTitle ? `${romanizedTitle} vyakhya` : null,
      // English-specific variants
      !isHindi && blog.topic ? `${blog.topic} summary` : null,
      !isHindi && blog.topic ? `${blog.topic} explanation` : null,
      !isHindi && blog.topic ? `${blog.topic} solved` : null,
      !isHindi && blog.topic ? `${blog.topic} essay` : null,
      // Board variants
      blog.class_level && blog.subject ? `UP Board ${blog.class_level} ${blog.subject}` : null,
      blog.class_level && blog.subject ? `CBSE ${blog.class_level} ${blog.subject}` : null,
      blog.class_level && blog.subject ? `NCERT ${blog.class_level} ${blog.subject}` : null,
      // Brand
      "Medhashine", "medhashine.in",
      "educational insights", "student notes", "board exam",
    ].filter(Boolean) as string[],
    authors: [{ name: blog.teacher_name }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${blog.title} | Medhashine`,
      description,
      url: `${siteUrl}${canonicalUrl}`,
      type: "article",
      locale: isHindi ? "hi_IN" : "en_IN",
      publishedTime: blog.created_at,
      authors: [blog.teacher_name],
      images: coverUrl ? [{ url: coverUrl, alt: blog.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${blog.title} | Medhashine`,
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
        "@type": "Article",
        headline: blog.title,
        description: blog.excerpt,
        image: blog.cover || getDefaultSubjectCover(blog.subject),
        datePublished: blog.created_at,
        dateModified: blog.updated_at || blog.created_at,
        inLanguage: detectLanguage(blog.subject, blog.title),
        educationalLevel: blog.class_level || undefined,
        about: [
          blog.subject ? { "@type": "Thing", name: blog.subject } : null,
          blog.topic ? { "@type": "Thing", name: blog.topic } : null,
        ].filter(Boolean),
        author: {
          "@type": "Person",
          name: blog.teacher_name,
          worksFor: {
            "@type": "EducationalOrganization",
            name: "Medhashine",
            url: siteUrl,
          },
        },
        publisher: {
          "@type": "EducationalOrganization",
          name: "Medhashine",
          url: siteUrl,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteUrl}/blog/${blog.slug || ""}`,
        },
        keywords: [
          blog.subject,
          blog.topic,
          blog.class_level,
          romanizeHindi(blog.topic),
          romanizeHindi(blog.title),
        ]
          .filter(Boolean)
          .join(", "),
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
