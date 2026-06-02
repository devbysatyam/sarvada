"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PeriodSlot {
  label: string;
  startTime: string;
  endTime: string;
  type: "period" | "break";
}

interface TimetableDoc {
  id: string;
  className: string;
  periods: PeriodSlot[];
  schedule: Record<string, string[]>;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const [timetables, setTimetables] = useState<TimetableDoc[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "timetables"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as TimetableDoc[];
      setTimetables(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const selected = timetables.find((t) => t.id === selectedId);

  // Build period-index map
  const periodIndexMap: (number | null)[] = [];
  if (selected) {
    let pIdx = 0;
    selected.periods.forEach((slot) => {
      if (slot.type === "period") {
        periodIndexMap.push(pIdx);
        pIdx++;
      } else {
        periodIndexMap.push(null);
      }
    });
  }

  return (
    <main className="flex-grow">
      {/* Hero */}
      <section className="px-margin-mobile md:px-margin-desktop py-20 text-center max-w-4xl mx-auto">
        <span className="font-label-caps text-secondary uppercase tracking-[0.3em] mb-4 block text-[10px] font-bold">
          Academic Schedule
        </span>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-6 uppercase tracking-tight">
          Class Timetable
        </h1>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          View the weekly period schedule for each class. Select your class below to see the complete timetable with timings and subject assignments.
        </p>
      </section>

      {/* Content */}
      <section className="px-margin-mobile md:px-margin-desktop pb-section-padding">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
              Loading timetables...
            </p>
          </div>
        ) : timetables.length === 0 ? (
          <div className="py-20 text-center italic text-on-surface-variant">
            No timetables have been published yet. Please check back soon.
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Class Selector Tabs */}
            <div className="flex flex-wrap gap-2 justify-center">
              {timetables.map((tt) => (
                <button
                  key={tt.id}
                  onClick={() => setSelectedId(tt.id)}
                  className={`px-6 py-3 font-label-caps text-[11px] uppercase tracking-widest transition-all border ${
                    selectedId === tt.id
                      ? "bg-primary text-on-primary border-primary shadow-lg"
                      : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary hover:text-primary"
                  }`}
                >
                  {tt.className}
                </button>
              ))}
            </div>

            {/* Timetable Grid */}
            {selected && (
              <div className="overflow-x-auto border border-surface-variant bg-surface-container-lowest shadow-xl">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="p-4 text-left font-label-caps text-[10px] uppercase tracking-widest border-r border-primary/30 w-[160px]">
                        Period / Time
                      </th>
                      {DAYS.map((day) => (
                        <th
                          key={day}
                          className="p-4 text-center font-label-caps text-[10px] uppercase tracking-widest border-r border-primary/30 last:border-r-0"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.periods.map((slot, slotIdx) => {
                      const schedIdx = periodIndexMap[slotIdx];
                      const isBreak = slot.type === "break";
                      return (
                        <tr
                          key={slotIdx}
                          className={
                            isBreak
                              ? "bg-secondary/8"
                              : slotIdx % 2 === 0
                              ? "bg-white"
                              : "bg-surface-container-lowest"
                          }
                        >
                          <td className="p-4 border-r border-surface-variant border-b border-b-surface-variant">
                            <div className="font-body-sm font-bold text-primary text-sm">
                              {slot.label}
                            </div>
                            <div className="font-body-sm text-on-surface-variant text-xs mt-0.5">
                              {slot.startTime} – {slot.endTime}
                            </div>
                          </td>
                          {isBreak ? (
                            <td
                              colSpan={DAYS.length}
                              className="p-4 text-center font-label-caps text-[11px] uppercase tracking-widest text-secondary border-b border-surface-variant"
                            >
                              {slot.label}
                            </td>
                          ) : (
                            DAYS.map((day) => {
                              const subject =
                                schedIdx !== null
                                  ? selected.schedule?.[day]?.[schedIdx] || ""
                                  : "";
                              return (
                                <td
                                  key={day}
                                  className="p-4 text-center border-r border-surface-variant border-b border-b-surface-variant last:border-r-0"
                                >
                                  <span className="font-body-sm text-sm text-on-surface">
                                    {subject || (
                                      <span className="text-on-surface-variant/20">—</span>
                                    )}
                                  </span>
                                </td>
                              );
                            })
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
