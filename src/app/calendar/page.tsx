"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  month: string;
  category: string;
  description: string;
  applicableClasses?: string;
  coordinator?: string;
}

const ACADEMIC_MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March",
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; dot: string; icon: string }> = {
  Holiday: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500", icon: "beach_access" },
  Exam: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", icon: "quiz" },
  Event: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: "celebration" },
  Activity: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", icon: "sports_esports" },
  Term: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500", icon: "date_range" },
  PTM: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500", icon: "groups" },
  Sports: { bg: "bg-lime-50", text: "text-lime-700", border: "border-lime-200", dot: "bg-lime-600", icon: "sports_soccer" },
  Cultural: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", dot: "bg-pink-500", icon: "theater_comedy" },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMonth, setActiveMonth] = useState<string>("All");
  const [activeCat, setActiveCat] = useState<string>("All");

  useEffect(() => {
    const q = query(collection(db, "calendar"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CalendarEvent[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = events.filter((e) => {
    if (activeMonth !== "All" && e.month !== activeMonth) return false;
    if (activeCat !== "All" && e.category !== activeCat) return false;
    return true;
  });

  const grouped: Record<string, CalendarEvent[]> = {};
  filtered.forEach((evt) => {
    const m = evt.month || "Other";
    if (!grouped[m]) grouped[m] = [];
    grouped[m].push(evt);
  });

  const sortedMonths = Object.keys(grouped).sort((a, b) => {
    const ia = ACADEMIC_MONTHS.indexOf(a);
    const ib = ACADEMIC_MONTHS.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const categoryCounts: Record<string, number> = {};
  events.forEach((e) => { categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1; });

  return (
    <main className="flex-grow">
      {/* Hero */}
      <section className="px-margin-mobile md:px-margin-desktop py-20 text-center max-w-4xl mx-auto">
        <span className="font-label-caps text-secondary uppercase tracking-[0.3em] mb-4 block text-[10px] font-bold">Academic Year</span>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-6 uppercase tracking-tight">Annual Calendar</h1>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          Complete month-wise view of holidays, examinations, events, PTMs, sports, cultural programs, and term dates.
        </p>
      </section>

      {/* Category Legend */}
      {!loading && events.length > 0 && (
        <section className="px-margin-mobile md:px-margin-desktop pb-8">
          <div className="max-w-5xl mx-auto flex flex-wrap gap-2 justify-center">
            {Object.entries(CATEGORY_STYLES).map(([cat, style]) => (
              <button key={cat} onClick={() => setActiveCat(activeCat === cat ? "All" : cat)}
                className={`flex items-center gap-2 px-4 py-2 border transition-all ${activeCat === cat ? "ring-2 ring-primary shadow-md" : ""} ${style.border} ${style.bg}`}>
                <span className={`material-symbols-outlined text-sm ${style.text}`}>{style.icon}</span>
                <span className={`font-label-caps text-[10px] uppercase tracking-widest ${style.text}`}>
                  {cat} ({categoryCounts[cat] || 0})
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Month Tabs */}
      <section className="px-margin-mobile md:px-margin-desktop pb-8">
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <div className="flex gap-1 justify-start min-w-max pb-2">
            <button onClick={() => setActiveMonth("All")}
              className={`px-5 py-2.5 font-label-caps text-[10px] uppercase tracking-widest transition-all border whitespace-nowrap ${
                activeMonth === "All" ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"
              }`}>All Months</button>
            {ACADEMIC_MONTHS.map((m) => {
              const count = events.filter((e) => e.month === m).length;
              return (
                <button key={m} onClick={() => setActiveMonth(activeMonth === m ? "All" : m)}
                  className={`px-5 py-2.5 font-label-caps text-[10px] uppercase tracking-widest transition-all border whitespace-nowrap ${
                    activeMonth === m ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"
                  }`}>
                  {m.substring(0, 3)}{count > 0 && <span className="ml-1.5 text-[8px] opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Calendar Events */}
      <section className="px-margin-mobile md:px-margin-desktop pb-section-padding">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Loading calendar...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center italic text-on-surface-variant">
              {events.length === 0 ? "No calendar entries have been published yet." : "No entries match the selected filters."}
            </div>
          ) : (
            <div className="space-y-12">
              {sortedMonths.map((month) => (
                <div key={month}>
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="font-display-sm text-primary uppercase tracking-wider text-xl">{month}</h2>
                    <div className="flex-1 h-px bg-surface-variant"></div>
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                      {grouped[month].length} {grouped[month].length === 1 ? "entry" : "entries"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {grouped[month].map((evt) => {
                      const style = CATEGORY_STYLES[evt.category] || CATEGORY_STYLES.Event;
                      const dateObj = new Date(evt.date + "T00:00:00");
                      return (
                        <div key={evt.id} className="flex items-start gap-5 group">
                          {/* Date column */}
                          <div className="w-20 shrink-0 text-right pt-1">
                            <div className="font-mono text-2xl font-bold text-primary leading-none">{String(dateObj.getDate()).padStart(2, "0")}</div>
                            <div className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mt-0.5">
                              {dateObj.toLocaleString("en-US", { weekday: "short" })}
                            </div>
                          </div>
                          {/* Timeline dot */}
                          <div className="flex flex-col items-center pt-2">
                            <div className={`w-3 h-3 ${style.dot} shrink-0 rounded-full`}></div>
                            <div className="w-px flex-1 bg-surface-variant min-h-[20px]"></div>
                          </div>
                          {/* Card */}
                          <div className={`flex-1 p-4 border ${style.border} ${style.bg} group-hover:shadow-md transition-all mb-1`}>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`material-symbols-outlined text-sm ${style.text}`}>{style.icon}</span>
                              <span className={`font-label-caps text-[9px] uppercase tracking-widest ${style.text}`}>{evt.category}</span>
                              {evt.endDate && evt.endDate !== evt.date && (
                                <span className="font-body-sm text-on-surface-variant text-[10px]">{formatDate(evt.date)} – {formatDate(evt.endDate)}</span>
                              )}
                            </div>
                            <h3 className="font-body-sm font-bold text-on-surface">{evt.title}</h3>
                            {evt.description && <p className="font-body-sm text-on-surface-variant text-xs mt-1 leading-relaxed">{evt.description}</p>}
                            <div className="flex gap-4 mt-2 flex-wrap">
                              {evt.applicableClasses && (
                                <span className="text-[9px] text-on-surface-variant flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">school</span>
                                  {evt.applicableClasses}
                                </span>
                              )}
                              {evt.coordinator && (
                                <span className="text-[9px] text-on-surface-variant flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">person</span>
                                  {evt.coordinator}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
