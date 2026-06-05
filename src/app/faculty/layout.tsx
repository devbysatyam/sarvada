import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faculty & Staff Directory | Meet Our Educators | Sarvada Modern School",
  description: "Meet the dedicated educators and professionals at Sarvada Modern School, Karawal Nagar. Browse our faculty directory by department — Leadership, Academic, Science, Sports, and more.",
  keywords: ["Sarvada teachers", "school faculty Delhi", "Karawal Nagar school staff", "CBSE school teachers", "school principal Delhi"],
  alternates: { canonical: "/faculty" },
  openGraph: {
    title: "Faculty & Staff Directory | Sarvada Modern School",
    description: "Meet the dedicated educators who shape futures at Sarvada Modern School.",
    url: "https://sarvadamodernschool.com/faculty",
    type: "website",
  },
};

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
