import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif-display",
  subsets: ["latin"],
  weight: "400",
});

/* ── Viewport (separated per Next.js 16 guidelines) ── */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1c1c",
};

/* ── Global Metadata ── */
export const metadata: Metadata = {
  metadataBase: new URL("https://sarvadamodernschool.com"),
  title: {
    default: "Sarvada Modern School | Best CBSE School in Karawal Nagar, Delhi | Since 1972",
    template: "%s | Sarvada Modern School",
  },
  description:
    "Sarvada Modern Secondary School — CBSE-affiliated, established 1972 — is a premier K-12 institution in Sadatpur, Karawal Nagar, North East Delhi 110090. Offering holistic education with modern labs, sports, and co-curricular excellence for 54+ years.",
  keywords: [
    "Sarvada Modern School",
    "best school Karawal Nagar",
    "CBSE school North East Delhi",
    "school Sadatpur Delhi",
    "Sarvada Shiksha Samiti",
    "nursery admission Delhi 2026-27",
    "schools near Karawal Nagar",
    "secondary school Delhi 110090",
    "top school North East Delhi",
    "CBSE affiliated school Delhi",
  ],
  authors: [{ name: "Sarvada Modern School", url: "https://sarvadamodernschool.com" }],
  creator: "Sarvada Modern School",
  publisher: "Sarvada Shiksha Samiti",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sarvada Modern School | Excellence in Education Since 1972",
    description:
      "CBSE-affiliated K-12 school in Karawal Nagar, Delhi. 54 years of nurturing minds with academic rigor, character building, and holistic development.",
    url: "https://sarvadamodernschool.com",
    siteName: "Sarvada Modern School",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Sarvada Modern School Logo — Excellence in Education Since 1972",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sarvada Modern School | Best CBSE School in Karawal Nagar",
    description:
      "54 years of CBSE educational excellence. Nursery to Class XII. Karawal Nagar, Delhi.",
    images: ["/logo.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  verification: {
    // Add your Google Search Console verification code here:
    // google: "your-verification-code",
  },
  category: "education",
};

/* ── Structured Data (JSON-LD) — School + EducationalOrganization ── */
const jsonLdSchool = {
  "@context": "https://schema.org",
  "@type": "School",
  "@id": "https://sarvadamodernschool.com/#school",
  name: "Sarvada Modern Secondary School",
  alternateName: "Sarvada Modern School",
  url: "https://sarvadamodernschool.com",
  logo: "https://sarvadamodernschool.com/logo.png",
  image: "https://sarvadamodernschool.com/logo.png",
  description:
    "Sarvada Modern Secondary School is a CBSE-affiliated K-12 institution in Sadatpur, Karawal Nagar, Delhi, providing holistic education since 1972.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "A/18 Gali no. 1 Sukkar Bazar, Sadatpur, Karawal Nagar",
    addressLocality: "New Delhi",
    addressRegion: "Delhi",
    postalCode: "110090",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "28.7180",
    longitude: "77.2680",
  },
  telephone: "+91-9999439422",
  email: "info@sarvadamodernschool.com",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00",
    closes: "14:30",
  },
  foundingDate: "1972",
  numberOfStudents: "1500+",
  isicV4: "8520",
  areaServed: {
    "@type": "City",
    name: "Delhi",
  },
  parentOrganization: {
    "@type": "Organization",
    name: "Sarvada Shiksha Samiti",
  },
  memberOf: {
    "@type": "Organization",
    name: "CBSE",
    url: "https://www.cbse.gov.in",
  },
  sameAs: [],
};

/* ── BreadcrumbList for homepage ── */
const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://sarvadamodernschool.com",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchool) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${dmSerifDisplay.variable} bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col`}
      >
        <Navbar />
        <main className="flex-grow pt-[136px]">{children}</main>
        <Footer />
        <FloatingContact />
      </body>
    </html>
  );
}
