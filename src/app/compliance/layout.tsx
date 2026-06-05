import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mandatory Public Disclosure | CBSE Compliance | Sarvada Modern School",
  description: "Access CBSE-mandated public disclosure documents for Sarvada Modern School — affiliation certificates, safety compliance, trust deed, land certificates, and essential institutional records.",
  keywords: ["CBSE compliance", "school public disclosure Delhi", "mandatory documents CBSE", "Sarvada affiliation", "school certificates Karawal Nagar"],
  alternates: { canonical: "/compliance" },
  openGraph: {
    title: "Mandatory Public Disclosure | Sarvada Modern School",
    description: "CBSE compliance documents and institutional records for public review.",
    url: "https://sarvadamodernschool.com/compliance",
    type: "website",
  },
};

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
