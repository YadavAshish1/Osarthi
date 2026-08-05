import { Metadata } from "next";
import BecomeTeacherClient from "./BecomeTeacherClient";

export const metadata: Metadata = {
  title: "Become a Teacher — Medhashine Educator Platform",
  description:
    "Join Medhashine as a verified educator. Share conceptual insights, publish interactive blogs, reach thousands of students, and inspire the next generation.",
  keywords: [
    "become a teacher",
    "educator application",
    "teach online",
    "medhashine faculty",
    "publish insights",
    "tutoring platform",
  ],
  openGraph: {
    title: "Become a Teacher — Medhashine Educator Platform",
    description:
      "Share your expertise with thousands of eager learners. Apply to become a verified teacher on Medhashine.",
    url: "https://medhashine.com/become-a-teacher",
    siteName: "Medhashine",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Become a Teacher — Medhashine",
    description:
      "Apply to join Medhashine's elite network of verified educators.",
  },
};

export default function BecomeTeacherPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Become a Teacher on Medhashine",
    description:
      "Application portal for educators to join Medhashine and publish learning insights.",
    url: "https://medhashine.com/become-a-teacher",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BecomeTeacherClient />
    </>
  );
}
