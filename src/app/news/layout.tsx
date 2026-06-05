import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News & Events | Latest Updates | Sarvada Modern School",
  description: "Stay updated with the latest news, events, academic achievements, and official announcements from Sarvada Modern School, Karawal Nagar, Delhi. Read stories about school activities, workshops, and more.",
  keywords: ["Sarvada news", "school events Delhi", "Karawal Nagar school updates", "CBSE school news", "Sarvada Modern School announcements"],
  alternates: { canonical: "/news" },
  openGraph: {
    title: "News & Events | Sarvada Modern School",
    description: "The latest updates, academic achievements, and official announcements from the Sarvada Modern School community.",
    url: "https://sarvadamodernschool.com/news",
    type: "website",
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
