import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sarvadamodernschool.com"),
  themeColor: "#1a1c1c",
  title: {
    default: "Sarvada Modern School | Excellence in North East Delhi | 54 Years of Heritage",
    template: "%s | Sarvada Modern School"
  },
  description: "Affiliated to CBSE, Sarvada Modern Secondary School is a leading institution in Sadatpur, Karawal Nagar, Delhi. Providing holistic education for over 54 years with a legacy of excellence since 1972.",
  keywords: ["Sarvada Modern School", "Karawal Nagar School", "Best School in North East Delhi", "CBSE School Sadatpur", "Sarvada Shiksha Samiti", "Nursery Admissions Delhi 2026", "Schools in Sadatpur", "Secondary School Karawal Nagar"],
  authors: [{ name: "Sarvada Modern School" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sarvada Modern School | Excellence in Education Since 1972",
    description: "Nurturing minds and building character in North East Delhi. Affiliated to CBSE.",
    url: "https://sarvadamodernschool.com",
    siteName: "Sarvada Modern School",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Sarvada Modern School Campus and Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarvada Modern School | CBSE Affiliated School in Delhi",
    description: "54 years of excellence in education. Located in Karawal Nagar, Delhi.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "School",
  "name": "Sarvada Modern Secondary School",
  "url": "https://sarvadamodernschool.com",
  "logo": "https://sarvadamodernschool.com/logo.png",
  "image": "https://sarvadamodernschool.com/logo.png",
  "description": "Affiliated to CBSE, Sarvada Modern Secondary School is a leading institution in Sadatpur, Karawal Nagar, Delhi, providing holistic education since 1972.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "A/18 Gali no. 1 sukkar Bazar, Sadatpur, Karawal Nagar",
    "addressLocality": "New Delhi",
    "addressRegion": "Delhi",
    "postalCode": "110090",
    "addressCountry": "IN"
  },
  "telephone": "+91-09999439422",
  "openingHours": "Mo-Sa 08:00-14:30",
  "foundingDate": "1972",
  "schoolId": "07030327105",
  "affiliation": {
    "@type": "Organization",
    "name": "CBSE"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-grow pt-[136px]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

