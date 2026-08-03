import type { Metadata } from "next";
import TeachersListClient from "./TeachersListClient";
import { API, TeacherProfile, FALLBACK_FACETS } from "@/lib/api";

export const metadata: Metadata = {
  title: "Find My Teachers & Educators | Medhashine Student Portal",
  description:
    "Explore and connect with verified Medhashine faculty members, read their academic articles, and discover educator profiles designed for curious minds.",
  keywords: [
    "Find My Teachers",
    "Educator Directory",
    "Medhashine Teachers",
    "Faculty Profiles",
    "Student Portal Teachers",
    "Academic Mentors",
  ],
  openGraph: {
    title: "Find My Teachers & Educators | Medhashine Student Portal",
    description:
      "Explore and connect with verified Medhashine faculty members, read their academic articles, and discover educator profiles.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find My Teachers & Educators | Medhashine Student Portal",
    description:
      "Explore and connect with verified Medhashine faculty members, read their academic articles, and discover educator profiles.",
  },
};

const DEFAULT_TEACHERS: TeacherProfile[] = [
  {
    _id: "t-ramesh",
    name: "Dr. Ramesh Yaduvanshi",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    role: "Senior Physics & Hindi Faculty",
    bio: "Dedicated Physics & Hindi educator with over 12 years of experience inspiring students through conceptual clarity, mechanics, and real-world experiments.",
    subjects: ["Physics", "हिन्दी पद्य", "हिंदी", "Hindi", "Science"],
    education: [
      { degree: "Ph.D. in Physics", institution: "Indian Institute of Science", year: "2015" },
      { degree: "M.Sc. Physics", institution: "Central University", year: "2011" },
    ],
    experience: [
      { title: "Lead Educator", organization: "Medhashine Education", duration: "2020 - Present" },
    ],
  },
  {
    _id: "t-rohan",
    name: "Mr. Rohan Iyer",
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&q=85&w=800",
    role: "Mathematics Faculty",
    bio: "Passionate mathematics mentor specializing in number theory, calculus, and making complex mathematical concepts simple and engaging.",
    subjects: ["Mathematics", "Calculus", "Math"],
    education: [
      { degree: "M.Sc. Mathematics", institution: "National University", year: "2017" },
      { degree: "B.Ed", institution: "State University", year: "2015" },
    ],
    experience: [
      { title: "Senior Math Faculty", organization: "Medhashine Education", duration: "2021 - Present" },
    ],
  },
  {
    _id: "t-meera",
    name: "Ms. Meera Kapoor",
    avatar:
      "https://images.pexels.com/photos/27086922/pexels-photo-27086922.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    role: "Literature & Language Faculty",
    bio: "Literature enthusiast and creative writer focusing on metaphor analysis, modern prose, and empowering students to communicate effectively.",
    subjects: ["Literature", "English", "हिन्दी गद्य"],
    education: [
      { degree: "M.A. English Literature", institution: "St. Xavier's College", year: "2018" },
    ],
    experience: [
      { title: "Faculty of Literature", organization: "Medhashine Education", duration: "2022 - Present" },
    ],
  },
];

async function getTeachers(): Promise<TeacherProfile[]> {
  try {
    const res = await fetch(`${API}/explore/teachers`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((t: any) => ({
          _id: t._id || t.id,
          name: t.name || "Faculty Member",
          avatar: t.avatar || "",
          bio: t.bio || "",
          education: Array.isArray(t.education) ? t.education : [],
          experience: Array.isArray(t.experience) ? t.experience : [],
          blogsCount: t.blogsCount || 0,
          subjects: Array.isArray(t.subjects) ? t.subjects : [],
        }));
      }
    }
  } catch {}

  return DEFAULT_TEACHERS;
}

const DEFAULT_SUBJECTS = [
  "Physics",
  "Mathematics",
  "Literature",
  "Science",
  "Chemistry",
  "Biology",
  "English",
  "History",
];

async function getSubjects(): Promise<string[]> {
  try {
    const res = await fetch(`${API}/explore/subjects`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const names = data.map((s: any) => s.name).filter(Boolean);
        if (names.length > 0) {
          return Array.from(new Set<string>(names));
        }
      }
    }
  } catch {}

  return DEFAULT_SUBJECTS;
}

export default async function FindTeachersPage() {
  const [teachers, dbSubjects] = await Promise.all([
    getTeachers(),
    getSubjects(),
  ]);

  // JSON-LD Schema.org ItemList for Google indexing
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Medhashine Faculty & Educators",
    description: "Verified teachers and academic mentors on Medhashine Student Portal",
    itemListElement: teachers.map((teacher, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        name: teacher.name,
        image: teacher.avatar || undefined,
        description: teacher.bio || undefined,
        jobTitle: "Educator",
        worksFor: {
          "@type": "EducationalOrganization",
          name: "Medhashine",
        },
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TeachersListClient initialTeachers={teachers} initialSubjects={dbSubjects} />
    </>
  );
}
