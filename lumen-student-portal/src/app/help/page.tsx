import type { Metadata } from "next";
import HelpClient from "@/components/help/HelpClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.medhashine.in";

export const metadata: Metadata = {
  title: "Help & Knowledge Center",
  description:
    "Official Medhashine Help & Knowledge Center. Browse student guides, educator crash recovery protocols, draft management, and contact support.",
  keywords: [
    "Medhashine help",
    "student support",
    "educator studio guides",
    "knowledge center",
    "auto save recovery",
    "recycle bin restoration",
    "helpdesk",
  ],
  alternates: {
    canonical: "/help",
  },
  openGraph: {
    title: "Help & Knowledge Center | Medhashine",
    description:
      "Official Medhashine Help & Knowledge Center. Browse guides, draft recovery protocols, and support.",
    url: `${siteUrl}/help`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Help & Knowledge Center | Medhashine",
    description:
      "Official Medhashine Help & Knowledge Center. Browse guides, draft recovery protocols, and support.",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What happens if my laptop shuts down while writing an insight?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your work is completely safe! Medhashine automatically saves your title and content blocks to your browser's local cache every second. When you return to /teacher/write, your unsaved draft will be automatically restored with a timestamp notice.",
      },
    },
    {
      "@type": "Question",
      name: "How long do deleted insights stay in the Recycle Bin?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Deleted items remain in the Recycle Bin for exactly 30 days. During this period, you can click 'Restore (Unbin)' anytime to bring them back. After 30 days, they are permanently purged from the database.",
      },
    },
    {
      "@type": "Question",
      name: "Is Medhashine free for students to read and bookmark?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, 100%! Medhashine is built on the principle of free, quiet reflection with no paywalls, zero subscription fees, and no intrusive popups.",
      },
    },
    {
      "@type": "Question",
      name: "Can I unpublish a live insight without deleting student likes or views?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! Unpublishing changes the insight status back to Draft, hiding it from live reading rooms. All student views, appreciations, and bookmarks are preserved intact when you republish.",
      },
    },
    {
      "@type": "Question",
      name: "How do I reset my password if I forget it?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Click 'Sign In' in the navbar, select 'Forgot Password?', enter your email, and a 6-digit OTP will be sent to verify your identity before setting a new password.",
      },
    },
    {
      "@type": "Question",
      name: "How can I become an Approved Verified Educator on Medhashine?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Click 'Become a Teacher' in the navigation bar or footer, fill out your teaching background and subject expertise, and our academic governance team will review your application within 24–48 hours.",
      },
    },
  ],
};

export default function HelpCenterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HelpClient />
    </>
  );
}
