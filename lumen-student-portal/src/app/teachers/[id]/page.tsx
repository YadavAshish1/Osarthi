import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import TeacherProfileClient from "./TeacherProfileClient";
import { API, TeacherProfile, BlogItem, mapContentToBlog, getTeacherSlug } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.medhashine.in";

function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function extractTeacherIdFromSlug(slug: string): string {
  const trailing = slug.match(/([a-f0-9]{24})$/i);
  if (trailing) return trailing[1];
  const leading = slug.match(/^([a-f0-9]{24})(?:-|$)/i);
  if (leading) return leading[1];
  const lastHyphen = slug.lastIndexOf("-");
  if (lastHyphen !== -1) {
    return slug.slice(lastHyphen + 1);
  }
  return slug;
}

async function fetchTeacherServer(slugOrId: string): Promise<{
  teacher: TeacherProfile | null;
  blogs: BlogItem[];
  total: number;
  hasMore: boolean;
}> {
  const id = extractTeacherIdFromSlug(slugOrId);
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return { teacher: null, blogs: [], total: 0, hasMore: false };
  }
  try {
    const res = await fetch(`${API}/explore/teachers/${id}?page=1&limit=20`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.teacher) {
        const blogs = Array.isArray(data.blogs)
          ? data.blogs.map((b: Record<string, unknown>) => mapContentToBlog(b))
          : [];
        return {
          teacher: data.teacher,
          blogs,
          total: data.total ?? blogs.length,
          hasMore: data.hasMore ?? false,
        };
      }
    }
  } catch {}

  return { teacher: null, blogs: [], total: 0, hasMore: false };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = safeDecode(resolvedParams.id || "");

  const { teacher, total } = await fetchTeacherServer(rawSlug);

  if (!teacher) {
    return {
      title: "Educator Profile Not Found",
      description: "The requested educator profile could not be found on Medhashine.",
      robots: { index: false, follow: false },
    };
  }

  // Title without "| Medhashine" suffix — root layout template adds it automatically
  const title = `${teacher.name} — Educator Profile`;
  const ogTitle = `${teacher.name} | Medhashine Educator`;
  const description =
    teacher.bio ||
    `Read academic insights, qualifications, and educational articles authored by ${teacher.name} on Medhashine.`;

  const teacherSlug = getTeacherSlug(teacher._id, teacher.name);
  const canonicalUrl = `/teachers/${teacherSlug}`;
  const isSparseProfile = total === 0 && (!teacher.bio || teacher.bio.trim().length < 60);

  // Keyword variants that match "Ashish by Medhashine", "Ashish Medhashine teacher" etc.
  const nameKeywords = [
    teacher.name,
    `${teacher.name} Medhashine`,
    `${teacher.name} by Medhashine`,
    `${teacher.name} teacher Medhashine`,
    `${teacher.name} educator`,
    `${teacher.name} insights`,
    ...(teacher.subjects ? teacher.subjects.map((s: string) => `${teacher.name} ${s}`) : []),
  ];

  return {
    title,
    description,
    keywords: [...nameKeywords, "Educator", "Medhashine", "Faculty", "Teacher Profile", "Insights"],
    authors: [{ name: teacher.name }],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isSparseProfile
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: ogTitle,
      description,
      url: `${siteUrl}/teachers/${encodeURIComponent(teacherSlug)}`,
      type: "profile",
      images: teacher.avatar ? [{ url: teacher.avatar, alt: teacher.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: teacher.avatar ? [teacher.avatar] : [],
    },
  };
}

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const rawSlug = safeDecode(resolvedParams.id || "");

  const { teacher, blogs, total, hasMore } = await fetchTeacherServer(rawSlug);
  if (!teacher) {
    notFound();
  }

  const expectedSlug = getTeacherSlug(teacher._id, teacher.name);
  if (expectedSlug && rawSlug !== expectedSlug) {
    permanentRedirect(`/teachers/${encodeURIComponent(expectedSlug)}`);
  }

  // Structured Data (JSON-LD) for Schema.org Person / Educator for Google Search indexing
  const teacherSlugForLd = expectedSlug || rawSlug;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: teacher.name,
    url: `${siteUrl}/teachers/${encodeURIComponent(teacherSlugForLd)}`,
    image: teacher.avatar || undefined,
    description: teacher.bio || undefined,
    jobTitle: (teacher.subjects && teacher.subjects.length > 0)
      ? `${teacher.subjects[0]} Educator`
      : "Educator",
    knowsAbout: teacher.subjects || [],
    worksFor: {
      "@type": "EducationalOrganization",
      name: "Medhashine",
      url: "https://www.medhashine.in",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TeacherProfileClient
        id={rawSlug}
        initialTeacher={teacher}
        initialBlogs={blogs}
        initialTotal={total}
        initialHasMore={hasMore}
      />
    </>
  );
}
