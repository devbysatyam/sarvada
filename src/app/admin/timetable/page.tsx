"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PeriodSlot {
  label: string;
  startTime: string;
  endTime: string;
  type: "period" | "break";
}

interface CellData {
  subject: string;
  teacher: string;
  room: string;
}

interface TimetableDoc {
  id: string;
  className: string;
  academicYear?: string;
  periods: PeriodSlot[];
  schedule: Record<string, (string | CellData)[]>;
  createdAt: any;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SUBJECTS = [
  "Mathematics", "English", "Hindi", "Science", "Social Studies",
  "Computer Science", "Physical Training", "Art & Craft",
  "Music", "Moral Science", "General Knowledge", "Sanskrit",
  "Environmental Studies", "Library", "Robotics", "Activity",
];

const SPECIAL_ROOMS = [
  "Computer Lab", "Science Lab", "Library", "Robotics Lab",
  "Music Room", "Art Room", "Activity Hall", "Sports Ground",
];

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-50 text-blue-700 border-blue-200",
  English: "bg-violet-50 text-violet-700 border-violet-200",
  Hindi: "bg-orange-50 text-orange-700 border-orange-200",
  Science: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Social Studies": "bg-amber-50 text-amber-700 border-amber-200",
  "Computer Science": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "Physical Training": "bg-lime-50 text-lime-700 border-lime-200",
  "Art & Craft": "bg-pink-50 text-pink-700 border-pink-200",
  Music: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "Moral Science": "bg-teal-50 text-teal-700 border-teal-200",
  "General Knowledge": "bg-sky-50 text-sky-700 border-sky-200",
  Sanskrit: "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Environmental Studies": "bg-green-50 text-green-700 border-green-200",
  Library: "bg-stone-50 text-stone-700 border-stone-200",
  Robotics: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Activity: "bg-rose-50 text-rose-700 border-rose-200",
};

const defaultPeriods: PeriodSlot[] = [
  { label: "Period 1", startTime: "08:00", endTime: "08:40", type: "period" },
  { label: "Period 2", startTime: "08:40", endTime: "09:20", type: "period" },
  { label: "Break", startTime: "09:20", endTime: "09:40", type: "break" },
  { label: "Period 3", startTime: "09:40", endTime: "10:20", type: "period" },
  { label: "Period 4", startTime: "10:20", endTime: "11:00", type: "period" },
  { label: "Period 5", startTime: "11:00", endTime: "11:40", type: "period" },
  { label: "Lunch", startTime: "11:40", endTime: "12:20", type: "break" },
  { label: "Period 6", startTime: "12:20", endTime: "13:00", type: "period" },
  { label: "Period 7", startTime: "13:00", endTime: "13:40", type: "period" },
];

function emptySchedule(periods: PeriodSlot[]): Record<string, CellData[]> {
  const periodCount = periods.filter((p) => p.type === "period").length;
  const sched: Record<string, CellData[]> = {};
  DAYS.forEach((d) => {
    sched[d] = Array.from({ length: periodCount }, () => ({ subject: "", teacher: "", room: "" }));
  });
  return sched;
}

function getCell(schedule: Record<string, (string | CellData)[]>, day: string, idx: number): CellData {
  const raw = schedule?.[day]?.[idx];
  if (!raw) return { subject: "", teacher: "", room: "" };
  if (typeof raw === "string") return { subject: raw, teacher: "", room: "" };
  return raw as CellData;
}

export default function AdminTimetable() {
  const [timetables, setTimetables] = useState<TimetableDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState("2025-26");
  const [academicYears, setAcademicYears] = useState<string[]>(["2024-25", "2025-26", "2026-27"]);

  // Editor state
  const [editClassName, setEditClassName] = useState("");
  const [editPeriods, setEditPeriods] = useState<PeriodSlot[]>(defaultPeriods);
  const [editSchedule, setEditSchedule] = useState<Record<string, (string | CellData)[]>>(
    emptySchedule(defaultPeriods)
  );
  const [editingCell, setEditingCell] = useState<{ day: string; idx: number } | null>(null);
  const [saving, setSaving] = useState(false);

  // Add class modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  // Period editor modal
  const [showPeriodEditor, setShowPeriodEditor] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const docRef = doc(db, "settings", "calendar");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.years && Array.isArray(data.years) && data.years.length > 0) {
            setAcademicYears(data.years);
          }
        }
      } catch (err) {
        console.error("Failed to load settings in timetable editor:", err);
      }
    };
    loadSettings();

    const q = query(collection(db, "timetables"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as TimetableDoc[];
      setTimetables(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredTimetables = timetables.filter((t: any) => {
    const y = t.academicYear || "2025-26";
    return y === selectedYear;
  });

  // Load selected timetable into editor
  useEffect(() => {
    if (selectedId) {
      const tt = timetables.find((t) => t.id === selectedId);
      if (tt) {
        setEditClassName(tt.className);
        setEditPeriods(tt.periods || defaultPeriods);
        setEditSchedule(tt.schedule || emptySchedule(tt.periods || defaultPeriods));
      }
    }
  }, [selectedId, timetables]);

  // Handle selected year changes and selection auto-routing
  useEffect(() => {
    if (filteredTimetables.length > 0) {
      if (!selectedId || !filteredTimetables.find((t) => t.id === selectedId)) {
        setSelectedId(filteredTimetables[0].id);
      }
    } else {
      setSelectedId(null);
      setEditClassName("");
      setEditPeriods(defaultPeriods);
      setEditSchedule(emptySchedule(defaultPeriods));
    }
  }, [selectedYear, timetables]);

  const handleExportTimetableCSV = () => {
    if (!selectedId) return;
    const tt = timetables.find(t => t.id === selectedId);
    if (!tt) return;

    const headers = ["Period / Slot", ...DAYS];
    
    let pIdx = 0;
    const periodIndexMap: (number | null)[] = [];
    editPeriods.forEach((slot) => {
      periodIndexMap.push(slot.type === "period" ? pIdx++ : null);
    });

    const rows = editPeriods.map((slot, slotIdx) => {
      const labelCol = `"${slot.label} (${slot.startTime} - ${slot.endTime})"`;
      const schedIdx = periodIndexMap[slotIdx];
      const isBreak = slot.type === "break";

      const dayCols = DAYS.map(day => {
        if (isBreak) return `"${slot.label}"`;
        const cell = schedIdx !== null ? getCell(editSchedule, day, schedIdx) : { subject: "", teacher: "", room: "" };
        if (!cell.subject) return `""`;
        let cellText = cell.subject;
        if (cell.teacher) cellText += `\nTeacher: ${cell.teacher}`;
        if (cell.room) cellText += `\nRoom: ${cell.room}`;
        return `"${cellText.replace(/"/g, '""')}"`;
      });

      return [labelCol, ...dayCols];
    });

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sarvada_Timetable_${editClassName || "Class"}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplateCSV = () => {
    const headers = [
      "Period Label",
      "Start Time",
      "End Time",
      "Type (period/break)",
      ...DAYS.flatMap(day => [`${day} Subject`, `${day} Teacher`, `${day} Room`])
    ];

    const sampleRow = [
      "Period 1",
      "08:30",
      "09:10",
      "period",
      "Mathematics",
      "Dr. Sharma",
      "Robotics Lab",
      "English",
      "Mrs. Sen",
      "Room 102",
      "Science",
      "Mr. Verma",
      "Physics Lab",
      "History",
      "Mrs. Gupta",
      "Room 103",
      "Geography",
      "Mr. Iyer",
      "Room 104",
      "Art",
      "Miss Das",
      "Art Room"
    ];

    const sampleBreakRow = [
      "Short Break",
      "09:10",
      "09:30",
      "break",
      "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
    ];

    const csvContent = "\ufeff" + [
      headers.join(","),
      sampleRow.join(","),
      sampleBreakRow.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Sarvada_Timetable_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          alert("Invalid CSV file: missing headers or data rows.");
          return;
        }

        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const newPeriods: PeriodSlot[] = [];
        const newSchedule: Record<string, CellData[]> = {};
        
        DAYS.forEach(day => {
          newSchedule[day] = [];
        });

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cells = parseCSVLine(line);
          const label = cells[0] || `Period ${i}`;
          const startTime = cells[1] || "08:00";
          const endTime = cells[2] || "08:40";
          const type = (cells[3] || "period").toLowerCase() === "break" ? "break" : "period";

          newPeriods.push({ label, startTime, endTime, type });

          if (type === "period") {
            DAYS.forEach((day, dayIdx) => {
              const baseIdx = 4 + dayIdx * 3;
              const subject = cells[baseIdx] || "";
              const teacher = cells[baseIdx + 1] || "";
              const room = cells[baseIdx + 2] || "";
              newSchedule[day].push({ subject, teacher, room });
            });
          }
        }

        if (newPeriods.length === 0) {
          alert("No valid period data rows found in the CSV.");
          return;
        }

        setEditPeriods(newPeriods);
        setEditSchedule(newSchedule);
        alert("Timetable CSV imported successfully! Review the grid below and click Save to store it.");
      } catch (err) {
        console.error(err);
        alert("Error parsing CSV. Please check that it matches the template format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const getClashes = (day: string, idx: number, cellData: CellData) => {
    const clashes: { type: "teacher" | "room"; cls: string; item: string }[] = [];
    if (!selectedId) return clashes;

    const teacherTrimmed = cellData.teacher.trim().toLowerCase();
    const room = cellData.room;

    if (!teacherTrimmed && !room) return clashes;

    timetables.forEach((tt) => {
      if (tt.id === selectedId) return;

      // Ensure the other timetable is in the same academic year
      const otherYear = tt.academicYear || "2025-26";
      if (otherYear !== selectedYear) return;

      const otherCell = getCell(tt.schedule, day, idx);
      
      // Teacher clash
      if (teacherTrimmed && otherCell.teacher.trim().toLowerCase() === teacherTrimmed) {
        clashes.push({ type: "teacher", cls: tt.className, item: otherCell.teacher.trim() });
      }

      // Room clash
      if (room && otherCell.room === room) {
        clashes.push({ type: "room", cls: tt.className, item: room });
      }
    });

    return clashes;
  };

  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    const periods = [...defaultPeriods];
    await addDoc(collection(db, "timetables"), {
      className: newClassName.trim(),
      academicYear: selectedYear,
      periods,
      schedule: emptySchedule(periods),
      createdAt: serverTimestamp(),
    });
    setNewClassName("");
    setShowAddModal(false);
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm("Delete this class timetable permanently?")) return;
    await deleteDoc(doc(db, "timetables", id));
    if (selectedId === id) {
      setSelectedId(null);
      setEditClassName("");
      setEditPeriods(defaultPeriods);
      setEditSchedule(emptySchedule(defaultPeriods));
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "timetables", selectedId), {
        className: editClassName,
        periods: editPeriods,
        schedule: editSchedule,
        academicYear: selectedYear,
      });
    } catch (err) {
      console.error("Save error:", err);
    }
    setSaving(false);
  };

  // Period manipulation
  const addPeriod = (type: "period" | "break") => {
    const last = editPeriods[editPeriods.length - 1];
    const newStart = last ? last.endTime : "08:00";
    const [h, m] = newStart.split(":").map(Number);
    const endMin = m + 40;
    const endTime = `${String(h + Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    const label = type === "break" ? "Break" : `Period ${editPeriods.filter((p) => p.type === "period").length + 1}`;
    const newPeriods = [...editPeriods, { label, startTime: newStart, endTime, type }];
    setEditPeriods(newPeriods);
    // Rebuild schedule to match new period count
    const periodCount = newPeriods.filter((p) => p.type === "period").length;
    const newSched: Record<string, (string | CellData)[]> = {};
    DAYS.forEach((d) => {
      const existing = editSchedule[d] || [];
      newSched[d] = [...existing];
      while (newSched[d].length < periodCount) newSched[d].push({ subject: "", teacher: "", room: "" });
    });
    setEditSchedule(newSched);
  };

  const removePeriod = (idx: number) => {
    const slot = editPeriods[idx];
    const newPeriods = editPeriods.filter((_, i) => i !== idx);
    setEditPeriods(newPeriods);
    if (slot.type === "period") {
      // Find which period-index this was
      let periodIdx = 0;
      for (let i = 0; i < idx; i++) {
        if (editPeriods[i].type === "period") periodIdx++;
      }
      const newSched: Record<string, (string | CellData)[]> = {};
      DAYS.forEach((d) => {
        const arr = [...(editSchedule[d] || [])];
        arr.splice(periodIdx, 1);
        newSched[d] = arr;
      });
      setEditSchedule(newSched);
    }
  };

  const updatePeriodField = (idx: number, field: keyof PeriodSlot, value: string) => {
    const updated = [...editPeriods];
    (updated[idx] as any)[field] = value;
    setEditPeriods(updated);
  };

  // Build a mapping: for each period slot in editPeriods, what is the index into the schedule array?
  const periodIndexMap: (number | null)[] = [];
  let pIdx = 0;
  editPeriods.forEach((slot) => {
    if (slot.type === "period") {
      periodIndexMap.push(pIdx);
      pIdx++;
    } else {
      periodIndexMap.push(null);
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl">schedule</span>
          <div>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest">
              Timetable Manager
            </h3>
            <p className="font-body-sm text-on-surface-variant">
              Configure class-wise period structure and subject assignments.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-4 rounded hover:bg-secondary transition-all shadow-lg font-label-caps uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Add Class</span>
        </button>
      </div>

      {/* Year Switcher Banner */}
      <div className="flex items-center gap-3 bg-surface-container-low p-4 border border-surface-variant">
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

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
            Loading timetables...
          </p>
        </div>
      ) : timetables.length === 0 ? (
        <div className="py-20 text-center italic text-on-surface-variant border-2 border-dashed border-surface-variant bg-surface-container-low/30">
          No class timetables configured yet. Add your first class above.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Class List Sidebar */}
          <div className="lg:w-64 shrink-0 space-y-2">
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
              Classes ({filteredTimetables.length})
            </p>
            {filteredTimetables.map((tt) => (
              <div
                key={tt.id}
                className={`flex items-center justify-between p-4 border cursor-pointer transition-all group ${
                  selectedId === tt.id
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container-lowest border-surface-variant hover:border-primary"
                }`}
              >
                <button
                  onClick={() => setSelectedId(tt.id)}
                  className="flex-1 text-left font-body-sm font-semibold uppercase tracking-wider text-xs"
                >
                  {tt.className}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClass(tt.id);
                  }}
                  title="Delete"
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 ${
                    selectedId === tt.id
                      ? "text-on-primary/70 hover:text-on-primary"
                      : "text-on-surface-variant hover:text-error"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))}
          </div>

          {/* Editor Area */}
          {selectedId ? (
            <div className="flex-1 space-y-6">
              {/* Class Name + Actions Bar */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <input
                  type="text"
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="font-headline-sm text-primary uppercase tracking-widest bg-transparent border-b-2 border-surface-variant focus:border-primary outline-none py-2 px-1 flex-1 min-w-[200px]"
                />
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleDownloadTemplateCSV}
                    className="flex items-center gap-2 px-6 py-3 border border-surface-variant font-label-caps text-xs uppercase tracking-widest hover:bg-surface-container transition-all"
                    title="Download Excel/CSV Timetable Template"
                  >
                    <span className="material-symbols-outlined text-[18px]">download_sheet</span>
                    Template
                  </button>
                  <label
                    className="flex items-center gap-2 px-6 py-3 border border-surface-variant font-label-caps text-xs uppercase tracking-widest hover:bg-surface-container transition-all cursor-pointer"
                    title="Import Filled Excel/CSV Timetable"
                  >
                    <span className="material-symbols-outlined text-[18px]">upload_file</span>
                    <span>Import</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleImportCSV}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleExportTimetableCSV}
                    className="flex items-center gap-2 px-6 py-3 border border-surface-variant font-label-caps text-xs uppercase tracking-widest hover:bg-surface-container transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Export
                  </button>
                  <button
                    onClick={() => setShowPeriodEditor(true)}
                    className="flex items-center gap-2 px-6 py-3 border border-surface-variant font-label-caps text-xs uppercase tracking-widest hover:bg-surface-container transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    Periods
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary font-label-caps text-xs uppercase tracking-widest hover:bg-secondary transition-all shadow-md disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {/* Timetable Grid */}
              <div className="overflow-x-auto border border-surface-variant">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-primary text-on-primary">
                      <th className="p-3 text-left font-label-caps text-[10px] uppercase tracking-widest border-r border-primary/30 w-[140px]">
                        Time / Day
                      </th>
                      {DAYS.map((day) => (
                        <th
                          key={day}
                          className="p-3 text-center font-label-caps text-[10px] uppercase tracking-widest border-r border-primary/30 last:border-r-0"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {editPeriods.map((slot, slotIdx) => {
                      const schedIdx = periodIndexMap[slotIdx];
                      const isBreak = slot.type === "break";
                      return (
                        <tr
                          key={slotIdx}
                          className={
                            isBreak
                              ? "bg-secondary/10"
                              : slotIdx % 2 === 0
                              ? "bg-surface-container-lowest"
                              : "bg-white"
                          }
                        >
                          <td className="p-3 border-r border-surface-variant border-b border-b-surface-variant">
                            <div className="font-body-sm font-semibold text-primary text-[12px]">
                              {slot.label}
                            </div>
                            <div className="font-body-sm text-on-surface-variant text-[10px]">
                              {slot.startTime} – {slot.endTime}
                            </div>
                          </td>
                          {isBreak ? (
                            <td
                              colSpan={DAYS.length}
                              className="p-3 text-center font-label-caps text-[10px] uppercase tracking-widest text-secondary border-b border-surface-variant italic"
                            >
                              {slot.label}
                            </td>
                          ) : (
                            DAYS.map((day) => {
                              const cell = schedIdx !== null ? getCell(editSchedule, day, schedIdx) : { subject: "", teacher: "", room: "" };
                              const isEditing = editingCell?.day === day && editingCell?.idx === schedIdx;
                              const colorClass = SUBJECT_COLORS[cell.subject] || "";
                              return (
                                <td
                                  key={day}
                                  className={`p-0.5 border-r border-surface-variant border-b border-b-surface-variant last:border-r-0 relative ${cell.subject ? colorClass.split(" ")[0] : ""}`}
                                >
                                  {isEditing && schedIdx !== null ? (
                                    <div className="absolute z-50 top-0 left-0 w-64 bg-white border-2 border-primary shadow-2xl p-3 space-y-2 rounded" onMouseDown={(e) => e.stopPropagation()}>
                                      <select
                                        autoFocus
                                        value={cell.subject}
                                        onChange={(e) => {
                                          const newSched = { ...editSchedule };
                                          newSched[day] = [...(newSched[day] || [])];
                                          newSched[day][schedIdx] = { ...cell, subject: e.target.value };
                                          setEditSchedule(newSched);
                                        }}
                                        className="w-full p-2 bg-surface-container border border-surface-variant outline-none text-xs font-body-sm focus:border-primary"
                                      >
                                        <option value="">— Subject —</option>
                                        {SUBJECTS.map((s) => (
                                          <option key={s} value={s}>{s}</option>
                                        ))}
                                      </select>
                                      <input
                                        type="text"
                                        placeholder="Teacher name"
                                        value={cell.teacher}
                                        onChange={(e) => {
                                          const newSched = { ...editSchedule };
                                          newSched[day] = [...(newSched[day] || [])];
                                          newSched[day][schedIdx] = { ...cell, teacher: e.target.value };
                                          setEditSchedule(newSched);
                                        }}
                                        className="w-full p-2 bg-surface-container border border-surface-variant outline-none text-xs font-body-sm focus:border-primary"
                                      />
                                      <select
                                        value={cell.room}
                                        onChange={(e) => {
                                          const newSched = { ...editSchedule };
                                          newSched[day] = [...(newSched[day] || [])];
                                          newSched[day][schedIdx] = { ...cell, room: e.target.value };
                                          setEditSchedule(newSched);
                                        }}
                                        className="w-full p-2 bg-surface-container border border-surface-variant outline-none text-xs font-body-sm focus:border-primary"
                                      >
                                        <option value="">— Classroom —</option>
                                        {SPECIAL_ROOMS.map((r) => (
                                          <option key={r} value={r}>{r}</option>
                                        ))}
                                      </select>
                                      {/* Conflict Warnings */}
                                      {(() => {
                                        const clashes = getClashes(day, schedIdx, cell);
                                        if (clashes.length === 0) return null;
                                        return (
                                          <div className="space-y-1 bg-rose-50 border border-rose-200 p-2 rounded text-[10px] text-rose-700 max-h-24 overflow-y-auto">
                                            {clashes.map((c, cIdx) => (
                                              <div key={cIdx} className="flex items-start gap-1 font-medium">
                                                <span className="material-symbols-outlined text-[12px] shrink-0 mt-0.5 text-rose-600">warning</span>
                                                <span>
                                                  {c.type === "teacher" 
                                                    ? `Teacher "${c.item}" already scheduled in ${c.cls}`
                                                    : `Room "${c.item}" already booked by ${c.cls}`
                                                  }
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                      <button
                                        onClick={() => setEditingCell(null)}
                                        className="w-full py-1.5 bg-primary text-on-primary text-xs font-label-caps uppercase tracking-widest hover:bg-secondary transition-all"
                                      >Done</button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        schedIdx !== null &&
                                        setEditingCell({ day, idx: schedIdx })
                                      }
                                      className={`w-full p-1.5 text-center text-[10px] font-body-sm hover:bg-surface-container transition-colors min-h-[52px] cursor-pointer flex flex-col items-center justify-center gap-0.5 ${cell.subject ? colorClass.split(" ").slice(1).join(" ") : ""}`}
                                    >
                                      {cell.subject ? (
                                        <>
                                          <span className="font-semibold leading-tight">{cell.subject}</span>
                                          {cell.teacher && <span className="opacity-60 text-[8px] leading-tight">{cell.teacher}</span>}
                                          {cell.room && <span className="opacity-50 text-[8px] leading-tight italic">{cell.room}</span>}
                                        </>
                                      ) : (
                                        <span className="text-on-surface-variant/30 italic text-[9px]">click</span>
                                      )}
                                    </button>
                                  )}
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
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-20 text-center text-on-surface-variant italic border-2 border-dashed border-surface-variant bg-surface-container-low/30">
              Select a class from the left to edit its timetable.
            </div>
          )}
        </div>
      )}

      {/* Room Availability Dashboard */}
      {!loading && timetables.length > 0 && (
        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3 border-t border-surface-variant pt-6">
            <span className="material-symbols-outlined text-primary text-2xl">meeting_room</span>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest text-sm">Room Availability</h3>
            <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest bg-surface-container px-3 py-1 border border-surface-variant">All Classes</span>
          </div>
          {SPECIAL_ROOMS.map((room) => {
            const bookings: { day: string; period: string; time: string; cls: string; subject: string }[] = [];
            timetables.forEach((tt) => {
              let pIdx = 0;
              (tt.periods || []).forEach((slot) => {
                if (slot.type === "period") {
                  DAYS.forEach((day) => {
                    const c = getCell(tt.schedule, day, pIdx);
                    if (c.room === room) bookings.push({ day, period: slot.label, time: `${slot.startTime}–${slot.endTime}`, cls: tt.className, subject: c.subject });
                  });
                  pIdx++;
                }
              });
            });
            if (bookings.length === 0) return null;
            return (
              <div key={room} className="border border-surface-variant bg-surface-container-lowest p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-secondary text-lg">door_open</span>
                  <span className="font-body-sm font-bold text-primary">{room}</span>
                  <span className="font-label-caps text-[8px] text-on-surface-variant uppercase tracking-widest ml-auto">{bookings.length} slots booked</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bookings.map((b, i) => (
                    <div key={i} className="text-[9px] px-2.5 py-1.5 bg-surface-container border border-surface-variant flex items-center gap-2">
                      <span className="font-semibold text-primary">{b.cls}</span>
                      <span className="text-on-surface-variant">{b.day.slice(0, 3)} {b.time}</span>
                      <span className="text-secondary">{b.subject}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">
              Add New Class
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Class / Division Name
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  placeholder="e.g., Grade 5-A, Grade 12 Science"
                  onKeyDown={(e) => e.key === "Enter" && handleAddClass()}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddClass}
                  className="flex-1 bg-primary text-on-primary py-5 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md"
                >
                  Create Class
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewClassName("");
                  }}
                  className="flex-1 border border-surface-variant py-5 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Period Structure Editor Modal */}
      {showPeriodEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden max-h-[85vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="font-display-sm text-primary mb-6 uppercase tracking-widest text-xl">
              Period Structure
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 mb-6">
              {editPeriods.map((slot, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 border ${
                    slot.type === "break"
                      ? "border-secondary/30 bg-secondary/5"
                      : "border-surface-variant bg-white"
                  }`}
                >
                  <input
                    type="text"
                    value={slot.label}
                    onChange={(e) => updatePeriodField(idx, "label", e.target.value)}
                    className="flex-1 px-3 py-2 bg-transparent border border-surface-variant focus:border-primary outline-none font-body-sm text-sm"
                  />
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updatePeriodField(idx, "startTime", e.target.value)}
                    className="px-2 py-2 bg-transparent border border-surface-variant focus:border-primary outline-none font-body-sm text-sm w-28"
                  />
                  <span className="text-on-surface-variant text-xs">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updatePeriodField(idx, "endTime", e.target.value)}
                    className="px-2 py-2 bg-transparent border border-surface-variant focus:border-primary outline-none font-body-sm text-sm w-28"
                  />
                  <span
                    className={`font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                      slot.type === "break"
                        ? "text-secondary border-secondary/30"
                        : "text-primary border-primary/30"
                    }`}
                  >
                    {slot.type}
                  </span>
                  <button
                    onClick={() => removePeriod(idx)}
                    className="text-on-surface-variant hover:text-error transition-colors p-1"
                    title="Remove"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => addPeriod("period")}
                className="flex items-center gap-2 px-6 py-3 border border-primary text-primary font-label-caps text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all flex-1 justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Period
              </button>
              <button
                onClick={() => addPeriod("break")}
                className="flex items-center gap-2 px-6 py-3 border border-secondary text-secondary font-label-caps text-xs uppercase tracking-widest hover:bg-secondary hover:text-white transition-all flex-1 justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">coffee</span>
                Add Break
              </button>
            </div>
            <button
              onClick={() => setShowPeriodEditor(false)}
              className="w-full bg-primary text-on-primary py-4 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
