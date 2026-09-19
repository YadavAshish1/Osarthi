import type { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
  title: "Terms of Service & Copyright Charter | Medhashine",
  description:
    "Official Terms of Service, Intellectual Property Policy, and Statutory Copyright Charter protecting educational content authored by Medhashine, its creators, and contributing educators.",
  keywords: [
    "Medhashine terms of service",
    "Medhashine copyright notice",
    "educator intellectual property",
    "educational content copyright act 1957",
    "intellectual property protection",
    "anti-piracy policy",
    "teacher data protection",
  ],
  alternates: {
    canonical: "https://www.medhashine.in/terms",
  },
  openGraph: {
    title: "Terms of Service & Copyright Charter | Medhashine",
    description:
      "Statutory intellectual property rights, study material licensing, and anti-piracy legal framework for Medhashine, its creators, and contributing teachers.",
    url: "https://www.medhashine.in/terms",
    type: "website",
  },
};


export default function TermsPage() {
  return <TermsClient />;
}
