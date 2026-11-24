import type { Metadata } from "next";
import PrivateRouteGuard from "@/components/auth/PrivateRouteGuard";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrivateRouteGuard>{children}</PrivateRouteGuard>;
}
