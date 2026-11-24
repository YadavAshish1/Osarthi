import { Metadata } from "next";
import NotificationsClient from "./NotificationsClient";
import PrivateRouteGuard from "@/components/auth/PrivateRouteGuard";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Stay updated with new quizzes, educator insights, and updates on Medhashine.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotificationsPage() {
  return (
    <PrivateRouteGuard>
      <NotificationsClient />
    </PrivateRouteGuard>
  );
}
