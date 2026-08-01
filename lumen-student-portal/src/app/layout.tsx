import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Medhashine | Insights for Curious Minds",
    template: "%s | Medhashine Student Portal",
  },
  description:
    "A quiet library of insights, ideas, and encouragements — written by teachers, meant for curious young minds.",
  keywords: [
    "education",
    "insights",
    "student portal",
    "learning",
    "physics",
    "mathematics",
    "literature",
    "teachers",
    "Osarthi",
  ],
  authors: [{ name: "Medhashine Education Team" }],
  creator: "Osarthi Team",
  publisher: "Medhashine Student Portal",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://localhost:3000",
    title: "Medhashine | Insights for Curious Minds",
    description:
      "A quiet library of insights, ideas, and encouragements — written by teachers, meant for curious young minds.",
    siteName: "Medhashine Student Portal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medhashine | Insights for Curious Minds",
    description:
      "A quiet library of insights, ideas, and encouragements — written by teachers, meant for curious young minds.",
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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // JSON-LD Structured Data for Organization and Educational Portal
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Medhashine Student Portal",
    url: "http://localhost:3000",
    description:
      "A quiet library of insights, ideas, and encouragements — written by teachers, meant for curious young minds.",
    sameAs: [],
  };

  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FAF8F5] text-[#1A1A1A]">
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
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
