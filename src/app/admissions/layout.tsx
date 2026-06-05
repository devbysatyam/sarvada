import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admissions Open 2026-27 | Nursery to Class XII | Sarvada Modern School",
  description: "Apply now for admissions at Sarvada Modern School, Karawal Nagar, Delhi. Nursery to Class XII admissions open for 2026-27. CBSE-affiliated, 54 years of educational excellence. Fee structure, required documents, and application process.",
  keywords: ["Sarvada admissions", "school admission Delhi 2026", "nursery admission Karawal Nagar", "CBSE school admission", "best school admission North East Delhi", "Sarvada Modern School fees"],
  alternates: { canonical: "/admissions" },
  openGraph: {
    title: "Admissions Open 2026-27 | Sarvada Modern School",
    description: "Join Sarvada Modern School — 54 years of CBSE educational excellence in North East Delhi. Nursery to Class XII.",
    url: "https://sarvadamodernschool.com/admissions",
    type: "website",
  },
};

export default function AdmissionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
