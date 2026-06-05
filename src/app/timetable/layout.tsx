import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Class Timetable | Sarvada Modern School",
  robots: { index: false, follow: false },
};

export default function TimetableLayout({ children }: { children: React.ReactNode }) {
  return children;
}
