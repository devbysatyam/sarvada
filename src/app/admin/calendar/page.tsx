"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  month: string;
  category: string;
  description: string;
  createdAt: any;
}

const CATEGORIES = ["Holiday", "Exam", "Event", "Activity", "Term"];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Holiday: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  Exam: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Event: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Activity: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Term: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

function getMonthFromDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleString("en-US", { month: "long" });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    endDate: "",
    category: "Holiday",
    description: "",
  });

  useEffect(() => {
    const q = query(collection(db, "calendar"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CalendarEvent[];
      setEvents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date) return;
    await addDoc(collection(db, "calendar"), {
      title: newEvent.title.trim(),
      date: newEvent.date,
      endDate: newEvent.endDate || "",
      month: getMonthFromDate(newEvent.date),
      category: newEvent.category,
      description: newEvent.description.trim(),
      createdAt: serverTimestamp(),
    });
    setIsModalOpen(false);
    setNewEvent({ title: "", date: "", endDate: "", category: "Holiday", description: "" });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this calendar entry?")) return;
    await deleteDoc(doc(db, "calendar", id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl">calendar_month</span>
          <div>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest">
              Annual Calendar Manager
            </h3>
            <p className="font-body-sm text-on-surface-variant">
              Add holidays, exams, events, activities, and term dates for the academic year.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-4 rounded hover:bg-secondary transition-all shadow-lg font-label-caps uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Add Entry</span>
        </button>
      </div>

      {/* Summary Stats */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => {
            const count = events.filter((e) => e.category === cat).length;
            const style = CATEGORY_STYLES[cat];
            return (
              <div
                key={cat}
                className={`p-4 border ${style.border} ${style.bg} text-center`}
              >
                <div className={`text-2xl font-bold font-mono ${style.text}`}>{count}</div>
                <div className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mt-1">
                  {cat}{count !== 1 ? "s" : ""}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Events List */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
            Loading calendar...
          </p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-20 text-center italic text-on-surface-variant border-2 border-dashed border-surface-variant bg-surface-container-low/30">
          No calendar entries yet. Add your first holiday or event above.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((evt) => {
            const style = CATEGORY_STYLES[evt.category] || CATEGORY_STYLES.Event;
            return (
              <div
                key={evt.id}
                className="bg-surface-container-lowest border border-surface-variant p-5 flex items-center gap-6 group hover:border-primary transition-all"
              >
                {/* Date badge */}
                <div className="w-16 h-16 bg-surface-container flex flex-col items-center justify-center shrink-0 border border-surface-variant">
                  <span className="font-mono text-xl font-bold text-primary leading-none">
                    {new Date(evt.date + "T00:00:00").getDate()}
                  </span>
                  <span className="font-label-caps text-[8px] uppercase tracking-widest text-on-surface-variant">
                    {new Date(evt.date + "T00:00:00").toLocaleString("en-US", { month: "short" })}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 border ${style.text} ${style.border} ${style.bg}`}
                    >
                      {evt.category}
                    </span>
                    <span className="font-body-sm text-on-surface-variant text-[10px]">
                      {formatDate(evt.date)}
                      {evt.endDate && evt.endDate !== evt.date && ` – ${formatDate(evt.endDate)}`}
                    </span>
                  </div>
                  <h4 className="font-body-sm font-semibold text-primary truncate">{evt.title}</h4>
                  {evt.description && (
                    <p className="font-body-sm text-on-surface-variant text-xs truncate mt-0.5">
                      {evt.description}
                    </p>
                  )}
                </div>
                {/* Delete */}
                <button
                  onClick={() => handleDelete(evt.id)}
                  title="Delete"
                  className="text-on-surface-variant hover:text-error transition-colors p-3 border border-surface-variant hover:bg-error-container/10 opacity-0 group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">
              Add Calendar Entry
            </h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Title
                </label>
                <input
                  required
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  placeholder="e.g., Republic Day, Mid-Term Exams Begin"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Start Date
                  </label>
                  <input
                    required
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Category
                  </label>
                  <select
                    value={newEvent.category}
                    title="Category"
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all"
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-4 pt-8">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary py-5 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md"
                >
                  Add Entry
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-surface-variant py-5 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
