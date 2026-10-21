import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  width: "device-width",
  initialScale: 1,
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.medhashine.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Medhashine | Insights for Curious Minds",
    template: "%s | Medhashine",
  },
  description:
    "Medhashine — free educational insights for Class 9, 10, 11, 12 students. NCERT, UP Board, CBSE notes on Hindi, Science, Maths, Sanskrit, Social Science written by verified teachers.",
  keywords: [
    // Brand
    "Medhashine", "medhashine.in",
    // Platform
    "free education", "learning platform", "educational insights", "student notes",
    // Board & Exams
    "UP Board", "CBSE", "NCERT", "board exam preparation",
    "UP Board Hindi notes", "UP Board Science notes", "UP Board Maths notes",
    "class 9 notes", "class 10 notes", "class 11 notes", "class 12 notes",
    // Subjects
    "Hindi", "हिंदी", "Sanskrit", "संस्कृत",
    "Mathematics", "गणित", "Science", "विज्ञान",
    "Physics", "भौतिकी", "Chemistry", "रसायन विज्ञान",
    "Biology", "जीव विज्ञान", "English",
    "Social Science", "सामाजिक विज्ञान",
    "History", "इतिहास", "Geography", "भूगोल",
    "Civics", "नागरिक शास्त्र", "Economics", "अर्थशास्त्र",
    "Computer Science",
    // Content type
    "essay", "निबंध", "question answer", "प्रश्न उत्तर",
    "summary", "सारांश", "explanation", "व्याख्या",
    "teachers", "verified educators",
  ],
  authors: [{ name: "Medhashine Education Team" }],
  creator: "Osarthi Team",
  publisher: "Medhashine",
  openGraph: {
    type: "website",
    locale: "hi_IN",
    alternateLocale: ["en_US", "en_IN"],
    url: siteUrl,
    title: "Medhashine | Insights for Curious Minds",
    description:
      "Medhashine — free educational insights for Class 9, 10, 11, 12 students. NCERT, UP Board, CBSE notes on Hindi, Science, Maths, English written by verified teachers.",
    siteName: "Medhashine",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medhashine | Insights for Curious Minds",
    description:
      "Free Class 9-12 notes on Hindi, Science, Maths, Sanskrit — written by verified educators. UP Board, CBSE, NCERT.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/logo/favicon.ico" },
      { url: "/logo/icon.svg", type: "image/svg+xml" },
      { url: "/logo/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/logo/favicon.ico",
    apple: "/logo/apple-icon.png",
  },
  other: {
    "google-adsense-account": "ca-pub-3501059367732668",
  },
};

const adsenseClientId =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-3501059367732668";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // JSON-LD Structured Data for Organization and Educational Portal
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Medhashine",
    url: siteUrl,
    description:
      "Medhashine — free educational insights for Class 9, 10, 11, 12 students on Hindi, Science, Maths, Sanskrit written by verified teachers.",
    sameAs: [
      "https://www.medhashine.in",
    ],
  };

  return (
    <html lang="hi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#1A1A1A]">
        {/* Organization JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
          crossOrigin="anonymous"
        />
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <AuthProvider>
          <Suspense fallback={<div className="h-16 border-b border-[#E5E1D8] bg-[#FAF8F5]" />}>
            <Header />
          </Suspense>
          <main data-testid="main-content" className="flex-1">
            <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
              {children}
            </Suspense>
          </main>
          <Footer />
          <AuthModal />
          <CookieConsentBanner />
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
