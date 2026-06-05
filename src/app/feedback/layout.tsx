import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parent Feedback | Share Your Experience | Sarvada Modern School",
  description: "Share your feedback as a parent of Sarvada Modern School. Your valuable input helps us improve our academic standards, safety measures, and overall school experience.",
  alternates: { canonical: "/feedback" },
  openGraph: {
    title: "Parent Feedback | Sarvada Modern School",
    description: "Help us improve by sharing your experience as a parent at Sarvada Modern School.",
    url: "https://sarvadamodernschool.com/feedback",
    type: "website",
  },
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
