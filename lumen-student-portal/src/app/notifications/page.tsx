import { Metadata } from "next";
import NotificationsClient from "./NotificationsClient";

export const metadata: Metadata = {
  title: "Notifications | Medhashine",
  description: "Stay updated with new quizzes, educator insights, and updates on Medhashine.",
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
