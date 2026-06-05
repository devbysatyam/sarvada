import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results & Achievements | Board Exam Performance | Sarvada Modern School",
  description: "View academic results, board examination performance, and co-curricular achievements at Sarvada Modern School. 54 years of excellence in CBSE board results and holistic student development.",
  keywords: ["Sarvada school results", "CBSE board results Delhi", "school achievements Karawal Nagar", "10th 12th results Sarvada", "school academic performance"],
  alternates: { canonical: "/results" },
  openGraph: {
    title: "Results & Achievements | Sarvada Modern School",
    description: "Celebrating academic excellence and holistic achievements at Sarvada Modern School since 1972.",
    url: "https://sarvadamodernschool.com/results",
    type: "website",
  },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
