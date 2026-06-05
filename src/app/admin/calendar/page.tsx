"use client";

import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
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
  applicableClasses?: string;
  coordinator?: string;
  createdAt: any;
}

const CATEGORIES = ["Holiday", "Exam", "Event", "Activity", "Term", "PTM", "Sports", "Cultural"];

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

const ACADEMIC_MONTHS = [
  "April", "May", "June", "July", "August", "September",
  "October", "November", "December", "January", "February", "March",
];

function getMonthFromDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleString("en-US", { month: "long" });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("All");
  const [filterMonth, setFilterMonth] = useState("All");
  const [newEvent, setNewEvent] = useState({
    title: "", date: "", endDate: "", category: "Holiday",
    description: "", applicableClasses: "", coordinator: "",
  });

  const openAddModal = () => {
    setEditingId(null);
    setNewEvent({ title: "", date: "", endDate: "", category: "Holiday", description: "", applicableClasses: "", coordinator: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (evt: CalendarEvent) => {
    setEditingId(evt.id);
    setNewEvent({
      title: evt.title, date: evt.date, endDate: evt.endDate || "",
      category: evt.category, description: evt.description || "",
      applicableClasses: evt.applicableClasses || "", coordinator: evt.coordinator || "",
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    const q = query(collection(db, "calendar"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CalendarEvent[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date) return;
    const payload = {
      title: newEvent.title.trim(), date: newEvent.date, endDate: newEvent.endDate || "",
      month: getMonthFromDate(newEvent.date), category: newEvent.category,
      description: newEvent.description.trim(),
      applicableClasses: newEvent.applicableClasses.trim(),
      coordinator: newEvent.coordinator.trim(),
    };
    if (editingId) {
      await updateDoc(doc(db, "calendar", editingId), { ...payload, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, "calendar"), { ...payload, createdAt: serverTimestamp() });
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this calendar entry?")) return;
    await deleteDoc(doc(db, "calendar", id));
  };

  // Filtered events
  const filtered = events.filter((e) => {
    if (filterCat !== "All" && e.category !== filterCat) return false;
    if (filterMonth !== "All" && e.month !== filterMonth) return false;
    return true;
  });

  // Group by month
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl">calendar_month</span>
          <div>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest">Annual Calendar Manager</h3>
            <p className="font-body-sm text-on-surface-variant">Holidays, exams, events, PTMs, sports days, and term dates.</p>
          </div>
        </div>
        <button onClick={openAddModal} className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-4 rounded hover:bg-secondary transition-all shadow-lg font-label-caps uppercase tracking-widest text-xs">
          <span className="material-symbols-outlined">add</span>
          <span>Add Entry</span>
        </button>
      </div>

      {/* Category Stats */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => {
            const count = events.filter((e) => e.category === cat).length;
            const style = CATEGORY_STYLES[cat];
            return (
              <button key={cat} onClick={() => setFilterCat(filterCat === cat ? "All" : cat)}
                className={`p-3 border text-center transition-all ${filterCat === cat ? "ring-2 ring-primary shadow-md" : ""} ${style.border} ${style.bg}`}>
                <span className={`material-symbols-outlined text-lg ${style.text}`}>{style.icon}</span>
                <div className={`text-xl font-bold font-mono ${style.text}`}>{count}</div>
                <div className="font-label-caps text-[8px] uppercase tracking-widest text-on-surface-variant">{cat}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Month Filter */}
      {!loading && events.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-2">
          <button onClick={() => setFilterMonth("All")}
            className={`px-4 py-2 font-label-caps text-[9px] uppercase tracking-widest border whitespace-nowrap transition-all ${filterMonth === "All" ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"}`}>
            All
          </button>
          {ACADEMIC_MONTHS.map((m) => (
            <button key={m} onClick={() => setFilterMonth(filterMonth === m ? "All" : m)}
              className={`px-4 py-2 font-label-caps text-[9px] uppercase tracking-widest border whitespace-nowrap transition-all ${filterMonth === m ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"}`}>
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {/* Events List grouped by month */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Loading calendar...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center italic text-on-surface-variant border-2 border-dashed border-surface-variant bg-surface-container-low/30">
          {events.length === 0 ? "No calendar entries yet. Add your first event above." : "No entries match the selected filters."}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedMonths.map((month) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-4">
                <h4 className="font-display-sm text-primary uppercase tracking-wider text-lg">{month}</h4>
                <div className="flex-1 h-px bg-surface-variant"></div>
                <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">{grouped[month].length} entries</span>
              </div>
              <div className="space-y-2">
                {grouped[month].map((evt) => {
                  const style = CATEGORY_STYLES[evt.category] || CATEGORY_STYLES.Event;
                  const dateObj = new Date(evt.date + "T00:00:00");
                  return (
                    <div key={evt.id} className={`border ${style.border} ${style.bg} p-4 flex items-start gap-5 group hover:shadow-md transition-all`}>
                      {/* Date badge */}
                      <div className="w-14 h-14 bg-white/80 flex flex-col items-center justify-center shrink-0 border border-black/5">
                        <span className="font-mono text-lg font-bold text-primary leading-none">{String(dateObj.getDate()).padStart(2, "0")}</span>
                        <span className="font-label-caps text-[7px] uppercase tracking-widest text-on-surface-variant">{dateObj.toLocaleString("en-US", { weekday: "short" })}</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`material-symbols-outlined text-sm ${style.text}`}>{style.icon}</span>
                          <span className={`font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 border ${style.text} ${style.border}`}>{evt.category}</span>
                          <span className="font-body-sm text-on-surface-variant text-[10px]">
                            {formatDate(evt.date)}{evt.endDate && evt.endDate !== evt.date ? ` – ${formatDate(evt.endDate)}` : ""}
                          </span>
                        </div>
                        <h4 className="font-body-sm font-semibold text-primary">{evt.title}</h4>
                        {evt.description && <p className="font-body-sm text-on-surface-variant text-xs mt-0.5 line-clamp-2">{evt.description}</p>}
                        <div className="flex gap-4 mt-1.5 flex-wrap">
                          {evt.applicableClasses && (
                            <span className="text-[9px] text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">school</span>{evt.applicableClasses}
                            </span>
                          )}
                          {evt.coordinator && (
                            <span className="text-[9px] text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">person</span>{evt.coordinator}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => openEditModal(evt)} title="Edit" className="text-on-surface-variant hover:text-primary transition-colors p-2 border border-transparent hover:border-surface-variant hover:bg-white/50">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(evt.id)} title="Delete" className="text-on-surface-variant hover:text-red-600 transition-colors p-2 border border-transparent hover:border-red-200 hover:bg-red-50/50">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">
              {editingId ? "Edit Calendar Entry" : "Add Calendar Entry"}
            </h3>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Title</label>
                <input required type="text" value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  placeholder="e.g., Republic Day, Mid-Term Exams" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Start Date</label>
                  <input required type="date" value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">End Date</label>
                  <input type="date" value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Category</label>
                  <select value={newEvent.category} title="Category"
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Applicable Classes</label>
                  <input type="text" value={newEvent.applicableClasses}
                    onChange={(e) => setNewEvent({ ...newEvent, applicableClasses: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                    placeholder="e.g., All, Grade 10-12, Nursery-5" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Coordinator / In-charge</label>
                  <input type="text" value={newEvent.coordinator}
                    onChange={(e) => setNewEvent({ ...newEvent, coordinator: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                    placeholder="e.g., Mrs. Sharma, PT Dept" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Description</label>
                <textarea rows={3} value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all"
                  placeholder="Additional details..." />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-5 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md">
                  {editingId ? "Update Entry" : "Add Entry"}
                </button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                  className="flex-1 border border-surface-variant py-5 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all">
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
