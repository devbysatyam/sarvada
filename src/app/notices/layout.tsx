import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notice Board & Official Circulars | Sarvada Modern School",
  description: "Access official notices, circulars, and institutional announcements from Sarvada Modern School. Stay informed about admissions, examinations, events, and important academic updates.",
  keywords: ["school circulars", "Sarvada notices", "school announcements Delhi", "CBSE school notices", "Karawal Nagar school circulars"],
  alternates: { canonical: "/notices" },
  openGraph: {
    title: "Notice Board & Circulars | Sarvada Modern School",
    description: "Official institutional announcements and academic schedules from Sarvada Modern School management.",
    url: "https://sarvadamodernschool.com/notices",
    type: "website",
  },
};

export default function NoticesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
