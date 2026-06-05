import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academic Calendar | Sarvada Modern School",
  robots: { index: false, follow: false },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
