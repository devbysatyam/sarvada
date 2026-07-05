"use client";

import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp,
  getDoc, setDoc
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

  const [todayStr, setTodayStr] = useState("");
  const [shiftingEvent, setShiftingEvent] = useState<CalendarEvent | null>(null);
  const [newShiftDate, setNewShiftDate] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState("2025-26");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [recipientEmails, setRecipientEmails] = useState("admin@sarvadaschool.com");
  const [savingSettings, setSavingSettings] = useState(false);
  const [academicYears, setAcademicYears] = useState<string[]>(["2024-25", "2025-26", "2026-27"]);
  const [newYearInput, setNewYearInput] = useState("");

  const getAcademicYear = (dateStr: string): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    const year = d.getFullYear();
    const month = d.getMonth();
    if (month >= 3) {
      return `${year}-${String(year + 1).slice(-2)}`;
    } else {
      return `${year - 1}-${String(year).slice(-2)}`;
    }
  };

  const handleExportCalendarCSV = () => {
    const headers = ["Title", "Start Date", "End Date", "Category", "Target Classes", "Coordinator", "Description"];
    const rows = filtered.map(e => [
      `"${(e.title || "").replace(/"/g, '""')}"`,
      `"${e.date || ""}"`,
      `"${e.endDate || ""}"`,
      `"${e.category || ""}"`,
      `"${(e.applicableClasses || "").replace(/"/g, '""')}"`,
      `"${(e.coordinator || "").replace(/"/g, '""')}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = "\ufeff" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sarvada_School_Calendar_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendEmailDigest = async () => {
    setSendingEmail(true);
    try {
      const todayObj = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
      
      const weekly = events.filter(e => {
        if (getAcademicYear(e.date) !== selectedYear) return false;
        if (!e.date) return false;
        const evtDate = new Date(e.date + "T00:00:00");
        const diff = evtDate.getTime() - todayObj.getTime();
        const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const monthly = events.filter(e => {
        if (getAcademicYear(e.date) !== selectedYear) return false;
        if (!e.date) return false;
        const evtDate = new Date(e.date + "T00:00:00");
        const diff = evtDate.getTime() - todayObj.getTime();
        const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let messageText = `Academic Calendar Event Digest for ${selectedYear} (Generated: ${todayObj.toLocaleDateString()})\n\n`;
      
      messageText += `--- 📅 WEEKLY UPCOMING EVENTS (Next 7 Days) ---\n`;
      if (weekly.length === 0) {
        messageText += `No events scheduled in the next 7 days.\n`;
      } else {
        weekly.forEach(e => {
          messageText += `- ${e.date}: ${e.title} (${e.category})\n`;
          if (e.description) messageText += `  Prep Notes: ${e.description}\n`;
        });
      }
      
      messageText += `\n--- 📋 MONTHLY PLANNING DIGEST (Next 30 Days) ---\n`;
      if (monthly.length === 0) {
        messageText += `No events scheduled in the next 30 days.\n`;
      } else {
        monthly.forEach(e => {
          messageText += `- ${e.date}: ${e.title} (${e.category})\n`;
          if (e.description) messageText += `  Prep Notes: ${e.description}\n`;
        });
      }

      const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL || "";
      if (!WEBHOOK_URL) {
        throw new Error("Webhook URL is not configured.");
      }

      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formType: "CalendarDigest",
          subject: weekly.length === 0 && monthly.length === 0
            ? `Sarvada Calendar Alert: No Upcoming School Events for ${selectedYear}`
            : `Sarvada Calendar Digest: ${weekly.length} Weekly / ${monthly.length} Monthly Events`,
          weeklyCount: weekly.length,
          monthlyCount: monthly.length,
          message: messageText,
          recipients: recipientEmails,
          timestamp: new Date().toISOString()
        }),
      });

      showToast("Calendar digest email dispatched successfully!");
    } catch (error) {
      console.error("Error dispatching email digest:", error);
      alert("Failed to send email digest. Please ensure Google Webhook URL is configured.");
    } finally {
      setSendingEmail(false);
    }
  };

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
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setTodayStr(`${yyyy}-${mm}-${dd}`);

    const loadSettings = async () => {
      try {
        const docRef = doc(db, "settings", "calendar");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRecipientEmails(data.recipients || "admin@sarvadaschool.com");
          if (data.years && Array.isArray(data.years) && data.years.length > 0) {
            setAcademicYears(data.years);
          }
        }
      } catch (err) {
        console.error("Failed to load calendar settings:", err);
      }
    };
    loadSettings();

    const q = query(collection(db, "calendar"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CalendarEvent[]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "calendar"), {
        recipients: recipientEmails,
        years: academicYears
      }, { merge: true });
      showToast("Calendar settings updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddYear = async () => {
    const formatted = newYearInput.trim();
    if (!formatted) return;
    if (!/^\d{4}-\d{2}$/.test(formatted)) {
      alert("Invalid format! Please use YYYY-YY (e.g. 2027-28).");
      return;
    }
    if (academicYears.includes(formatted)) {
      alert("This academic year session already exists.");
      return;
    }
    const updatedYears = [...academicYears, formatted].sort((a, b) => {
      const yearA = parseInt(a.split("-")[0]);
      const yearB = parseInt(b.split("-")[0]);
      return yearA - yearB;
    });
    setAcademicYears(updatedYears);
    setNewYearInput("");
    
    try {
      await setDoc(doc(db, "settings", "calendar"), {
        recipients: recipientEmails,
        years: updatedYears
      }, { merge: true });
      showToast(`Academic session "${formatted}" added successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to save updated sessions to database.");
    }
  };

  const handleDeleteYear = async (yearToDelete: string) => {
    if (["2024-25", "2025-26", "2026-27"].includes(yearToDelete)) {
      alert("Core academic years (2024-25, 2025-26, 2026-27) cannot be deleted.");
      return;
    }
    if (!confirm(`Are you sure you want to delete the academic session "${yearToDelete}"?`)) {
      return;
    }
    const updatedYears = academicYears.filter(y => y !== yearToDelete);
    setAcademicYears(updatedYears);
    if (selectedYear === yearToDelete) {
      setSelectedYear("2025-26");
    }
    try {
      await setDoc(doc(db, "settings", "calendar"), {
        recipients: recipientEmails,
        years: updatedYears
      }, { merge: true });
      showToast(`Academic session "${yearToDelete}" deleted successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to save updated sessions to database.");
    }
  };

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShiftConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftingEvent || !newShiftDate) return;
    const newMonth = getMonthFromDate(newShiftDate);
    await updateDoc(doc(db, "calendar", shiftingEvent.id), {
      date: newShiftDate,
      month: newMonth,
      updatedAt: serverTimestamp(),
    });
    showToast(`Shifted "${shiftingEvent.title}" to ${formatDate(newShiftDate)}`);
    setShiftingEvent(null);
    setNewShiftDate("");
  };

  const copyNotes = (text: string, title: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`Copied notes for "${title}" to clipboard!`);
    }).catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast(`Copied notes for "${title}" to clipboard!`);
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this calendar entry?")) return;
    await deleteDoc(doc(db, "calendar", id));
  };

  // Filtered events
  const filtered = events.filter((e) => {
    if (getAcademicYear(e.date) !== selectedYear) return false;
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

      {/* Year Switcher and Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low p-4 border border-surface-variant">
        <div className="flex items-center gap-3">
          <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Academic Year:</span>
          <div className="flex border border-surface-variant rounded overflow-hidden">
            {academicYears.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest transition-all ${
                  selectedYear === y
                    ? "bg-primary text-on-primary font-bold"
                    : "bg-white hover:bg-surface-container text-on-surface-variant"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Email Digest Button */}
          <button
            onClick={handleSendEmailDigest}
            disabled={sendingEmail}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-highest hover:bg-surface-variant border border-surface-variant text-primary font-label-caps text-[10px] uppercase tracking-widest transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            <span>{sendingEmail ? "Sending..." : "Email Alerts Digest"}</span>
          </button>
          
          {/* Export CSV Button */}
          <button
            onClick={handleExportCalendarCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-secondary text-on-primary font-label-caps text-[10px] uppercase tracking-widest transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      {/* Alert / Notification Settings Row */}
      <div className="bg-surface-container-lowest p-6 border-x border-b border-surface-variant mb-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email settings */}
        <div className="space-y-3">
          <div>
            <h4 className="font-label-caps text-[10px] text-primary uppercase tracking-widest font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">mail</span>
              <span>Email Digest Settings</span>
            </h4>
            <p className="text-[10px] text-on-surface-variant/70 italic mt-0.5">
              These recipients receive the Weekly/Monthly planning digest when executing manual digests or triggers.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={recipientEmails}
              onChange={(e) => setRecipientEmails(e.target.value)}
              placeholder="e.g. principal@sarvada.in, admin@sarvada.in"
              className="flex-1 px-3 py-2 border border-surface-variant text-xs focus:outline-none focus:border-primary font-mono bg-white"
            />
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-5 py-2 bg-primary hover:bg-secondary text-on-primary text-xs font-label-caps uppercase tracking-widest transition-all shrink-0 font-bold"
            >
              {savingSettings ? "Saving..." : "Save Recipients"}
            </button>
          </div>
        </div>

        {/* Academic sessions management */}
        <div className="space-y-3 border-t md:border-t-0 md:border-l border-surface-variant/50 pt-4 md:pt-0 md:pl-6">
          <div>
            <h4 className="font-label-caps text-[10px] text-primary uppercase tracking-widest font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">history</span>
              <span>Manage Academic Sessions</span>
            </h4>
            <p className="text-[10px] text-on-surface-variant/70 italic mt-0.5">
              Configure active academic years (format: YYYY-YY). Core years cannot be deleted.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 items-center bg-surface-container-low p-2 border border-surface-variant/60 rounded">
            {academicYears.map((y) => {
              const isCore = ["2024-25", "2025-26", "2026-27"].includes(y);
              return (
                <span key={y} className="inline-flex items-center gap-1 bg-white border border-surface-variant text-[11px] px-2.5 py-1 rounded font-mono">
                  <span>{y}</span>
                  {!isCore && (
                    <button
                      onClick={() => handleDeleteYear(y)}
                      className="text-red-600 hover:text-red-800 font-bold flex items-center justify-center w-3 h-3 hover:bg-red-50 rounded-full"
                      title={`Delete session ${y}`}
                    >
                      <span className="material-symbols-outlined text-[12px] font-bold">close</span>
                    </button>
                  )}
                </span>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newYearInput}
              onChange={(e) => setNewYearInput(e.target.value)}
              placeholder="e.g. 2027-28"
              className="flex-1 px-3 py-2 border border-surface-variant text-xs focus:outline-none focus:border-primary font-mono bg-white"
            />
            <button
              onClick={handleAddYear}
              className="px-5 py-2 bg-primary hover:bg-secondary text-on-primary text-xs font-label-caps uppercase tracking-widest transition-all shrink-0 font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">add</span>
              <span>Add Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Stats */}
      {!loading && events.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => {
            const count = events.filter((e) => getAcademicYear(e.date) === selectedYear && e.category === cat).length;
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

      {/* Alert Dashboard */}
      {!loading && events.length > 0 && (
        <div className="border border-surface-variant bg-surface-container-lowest p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-variant pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">event_upcoming</span>
              <h4 className="font-display-sm text-primary uppercase tracking-widest text-base font-semibold">Administrative Planning & Alerts</h4>
            </div>
            {todayStr && (
              <div className="text-xs text-on-surface-variant font-medium">
                Current Date: <span className="font-mono text-primary font-bold">{formatDate(todayStr)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Alert */}
            <div className="space-y-3">
              <h5 className="font-label-caps text-[10px] text-primary uppercase tracking-widest font-bold">📅 Weekly Upcoming (Next 7 Days)</h5>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {(() => {
                  const todayObj = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
                  const weekly = events.filter(e => {
                    if (getAcademicYear(e.date) !== selectedYear) return false;
                    if (!e.date) return false;
                    const evtDate = new Date(e.date + "T00:00:00");
                    const diff = evtDate.getTime() - todayObj.getTime();
                    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 7;
                  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                  if (weekly.length === 0) {
                    return <p className="text-xs text-on-surface-variant italic">No events in the next 7 days.</p>;
                  }

                  return weekly.map(evt => (
                    <div key={evt.id} className="text-xs p-2 bg-surface-container border border-surface-variant/40 flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-primary">{formatDate(evt.date)}</span>
                        <p className="text-on-surface-variant">{evt.title}</p>
                      </div>
                      <span className="text-[10px] text-on-primary bg-primary px-1.5 py-0.5 rounded font-mono">
                        {Math.ceil((new Date(evt.date + "T00:00:00").getTime() - todayObj.getTime()) / (1000 * 60 * 60 * 24))}d
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Monthly Digest & Prep Notes */}
            <div className="space-y-3 lg:col-span-2 border-t lg:border-t-0 lg:border-l border-surface-variant/50 pt-4 lg:pt-0 lg:pl-6">
              <h5 className="font-label-caps text-[10px] text-primary uppercase tracking-widest font-bold">📋 Monthly Planning Digest & Prep Notes</h5>
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {(() => {
                  const todayObj = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
                  const monthly = events.filter(e => {
                    if (getAcademicYear(e.date) !== selectedYear) return false;
                    if (!e.date) return false;
                    const evtDate = new Date(e.date + "T00:00:00");
                    const diff = evtDate.getTime() - todayObj.getTime();
                    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 30;
                  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                  if (monthly.length === 0) {
                    return <p className="text-xs text-on-surface-variant italic">No events in the next 30 days.</p>;
                  }

                  return monthly.map(evt => (
                    <div key={evt.id} className="text-xs p-3 bg-surface-container border border-surface-variant/40 space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-primary">{formatDate(evt.date)} — {evt.title} ({evt.category})</span>
                        {evt.description && (
                          <button onClick={() => copyNotes(evt.description, evt.title)}
                            className="flex items-center gap-1 text-[10px] border border-primary text-primary px-2 py-1 bg-white hover:bg-primary hover:text-on-primary transition-all shrink-0">
                            <span className="material-symbols-outlined text-[12px]">content_copy</span>
                            <span>Copy Notes</span>
                          </button>
                        )}
                      </div>
                      {evt.description ? (
                        <p className="text-on-surface-variant text-[11px] bg-white p-2 border border-surface-variant/30 font-serif italic whitespace-pre-line">{evt.description}</p>
                      ) : (
                        <p className="text-on-surface-variant/60 italic text-[11px]">No preparation notes added. Click edit to add notes.</p>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* Quarterly Forecast */}
          {(() => {
            const todayObj = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
            const quarterly = events.filter(e => {
              if (getAcademicYear(e.date) !== selectedYear) return false;
              if (!e.date) return false;
              const evtDate = new Date(e.date + "T00:00:00");
              const diff = evtDate.getTime() - todayObj.getTime();
              const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
              return diffDays >= 0 && diffDays <= 90;
            });

            const qCounts: Record<string, number> = {};
            quarterly.forEach(e => {
              qCounts[e.category] = (qCounts[e.category] || 0) + 1;
            });

            let breakdown = Object.entries(qCounts).map(([w, c]) => `${c} ${w}`).join(', ');
            if (breakdown) breakdown = ' (' + breakdown + ')';

            return (
              <div className="bg-primary/5 p-3 border border-primary/20 text-xs text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">online_prediction</span>
                <span>
                  <strong>Quarterly Forecast (Next 90 Days):</strong> {quarterly.length} events scheduled{breakdown}.
                </span>
              </div>
            );
          })()}
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setShiftingEvent(evt); setNewShiftDate(evt.date || ""); }} title="Shift Date" className="text-on-surface-variant hover:text-primary transition-colors p-2 border border-transparent hover:border-surface-variant hover:bg-white/50">
                          <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                        </button>
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
      {/* Shift Modal */}
      {shiftingEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <button className="absolute top-6 right-6 text-on-surface-variant hover:text-primary" onClick={() => setShiftingEvent(null)}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="font-display-sm text-primary mb-4 uppercase tracking-widest text-lg font-semibold">
              🔄 Shift Event Date
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Reschedule <strong>"{shiftingEvent.title}"</strong>. The system will automatically recalculate the month and update Firestore.
            </p>
            <form onSubmit={handleShiftConfirm} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">New Date</label>
                <input required type="date" value={newShiftDate}
                  onChange={(e) => setNewShiftDate(e.target.value)}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-4 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md text-xs">
                  Confirm Shift
                </button>
                <button type="button" onClick={() => setShiftingEvent(null)}
                  className="flex-1 border border-surface-variant py-4 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-primary text-on-primary px-6 py-4 shadow-xl z-[150] transition-all duration-300 font-body-sm text-xs border border-white/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
