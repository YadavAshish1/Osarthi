import type { Metadata } from "next";
import TeacherProfileClient from "./TeacherProfileClient";
import { API, TeacherProfile, BlogItem, mapContentToBlog } from "@/lib/api";

function extractTeacherIdFromSlug(slug: string): string {
  const mongoMatch = slug.match(/([a-f0-9]{24})$/);
  if (mongoMatch) return mongoMatch[1];
  const lastHyphen = slug.lastIndexOf("-");
  if (lastHyphen !== -1) {
    return slug.slice(lastHyphen + 1);
  }
  return slug;
}

async function fetchTeacherServer(slugOrId: string): Promise<{ teacher: TeacherProfile | null; blogs: BlogItem[] }> {
  const id = extractTeacherIdFromSlug(slugOrId);
  try {
    const res = await fetch(`${API}/explore/teachers/${id}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.teacher) {
        const blogs = Array.isArray(data.blogs) ? data.blogs.map((b: any) => mapContentToBlog(b)) : [];
        return { teacher: data.teacher, blogs };
      }
    }
  } catch {}

  return { teacher: null, blogs: [] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id || "";

  const { teacher } = await fetchTeacherServer(id);

  if (!teacher) {
    return {
      title: "Educator Profile Not Found | Medhashine",
      description: "The requested educator profile could not be found.",
    };
  }

  const title = `${teacher.name} | Medhashine Educator Profile`;
  const description =
    teacher.bio ||
    `Read academic insights, qualifications, and educational articles authored by ${teacher.name} on Medhashine Student Portal.`;

  return {
    title,
    description,
    keywords: [teacher.name, "Educator", "Medhashine", "Faculty", "Teacher Profile", "Insights"],
    authors: [{ name: teacher.name }],
    openGraph: {
      title,
      description,
      type: "profile",
      images: teacher.avatar ? [{ url: teacher.avatar, alt: teacher.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
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
  const id = resolvedParams.id || "";

  const { teacher, blogs } = await fetchTeacherServer(id);

  // Structured Data (JSON-LD) for Schema.org Person / Educator for Google Search indexing
  const jsonLd = teacher
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: teacher.name,
        image: teacher.avatar || undefined,
        description: teacher.bio || undefined,
        jobTitle: "Educator / Faculty",
        worksFor: {
          "@type": "EducationalOrganization",
          name: "Medhashine",
          url: "https://www.medhashine.in",
        },
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
      <TeacherProfileClient id={id} initialTeacher={teacher} initialBlogs={blogs} />
    </>
  );
}
