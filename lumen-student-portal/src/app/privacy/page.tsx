import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy & Student Data Charter | Medhashine",
  description:
    "Learn how Medhashine protects student and educator data with our enterprise-grade privacy policy, zero data-selling guarantee, and full DPDP Act & COPPA compliance.",
  keywords: [
    "Medhashine privacy policy",
    "student data protection",
    "edtech privacy",
    "DPDP Act compliance",
    "COPPA compliance",
    "child online safety",
    "secure educational platform",
  ],
  alternates: {
    canonical: "https://www.medhashine.in/privacy",
  },
  openGraph: {
    title: "Privacy Policy & Student Data Charter | Medhashine",
    description:
      "Our founding commitment: Student data is sacred. Zero data selling, zero behavioral advertising, enterprise-grade encryption, and full privacy transparency.",
    url: "https://www.medhashine.in/privacy",
    type: "website",
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
