import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Interest Form | Sarvada Modern School",
  robots: { index: false, follow: false },
};

export default function StudentInterestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
