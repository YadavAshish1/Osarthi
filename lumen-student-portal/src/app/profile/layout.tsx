import type { Metadata } from "next";
import PrivateRouteGuard from "@/components/auth/PrivateRouteGuard";

export const metadata: Metadata = {
  title: "Student Profile",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrivateRouteGuard>{children}</PrivateRouteGuard>;
}
