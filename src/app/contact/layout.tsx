import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Location & Enquiry | Sarvada Modern School",
  description: "Get in touch with Sarvada Modern School, located at A/18 Gali no. 1, Sukkar Bazar, Sadatpur, Karawal Nagar, Delhi 110090. Call +91-09999439422 for admissions, general enquiries, and campus visits.",
  keywords: ["Sarvada school contact", "school address Karawal Nagar", "school phone number Delhi", "Sadatpur school location", "school enquiry North East Delhi"],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Us | Sarvada Modern School",
    description: "Reach out for admissions, enquiries, and campus visits. Located in Sadatpur, Karawal Nagar, Delhi.",
    url: "https://sarvadamodernschool.com/contact",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
