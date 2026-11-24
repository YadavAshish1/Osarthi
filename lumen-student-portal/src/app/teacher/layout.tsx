import type { Metadata } from "next";
import PrivateRouteGuard from "@/components/auth/PrivateRouteGuard";

export const metadata: Metadata = {
  title: "Educator Studio",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TeacherPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PrivateRouteGuard requireEducator>{children}</PrivateRouteGuard>;
}
