import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Gallery | Campus & Events | Sarvada Modern School",
  description: "Explore the visual showcase of Sarvada Modern School — campus infrastructure, academic laboratories, cultural performances, sports events, and student celebrations captured over 54 years of excellence.",
  keywords: ["Sarvada school gallery", "school photos Delhi", "Karawal Nagar school campus", "CBSE school infrastructure", "school cultural events photos"],
  alternates: { canonical: "/gallery" },
  openGraph: {
    title: "Photo Gallery | Sarvada Modern School",
    description: "A visual journey through the vibrant life at Sarvada Modern School. Explore infrastructure, academics, and celebrations.",
    url: "https://sarvadamodernschool.com/gallery",
    type: "website",
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
