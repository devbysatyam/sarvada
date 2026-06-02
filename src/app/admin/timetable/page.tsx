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
} from "firebase/firestore";
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
  createdAt: any;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const SUBJECTS = [
  "Mathematics", "English", "Hindi", "Science", "Social Studies",
  "Computer Science", "Physical Training", "Art & Craft",
  "Music", "Moral Science", "General Knowledge", "Sanskrit",
  "Environmental Studies", "Library",
];

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

function emptySchedule(periods: PeriodSlot[]): Record<string, string[]> {
  const periodCount = periods.filter((p) => p.type === "period").length;
  const sched: Record<string, string[]> = {};
  DAYS.forEach((d) => {
    sched[d] = Array(periodCount).fill("");
  });
  return sched;
}

export default function AdminTimetable() {
  const [timetables, setTimetables] = useState<TimetableDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Editor state
  const [editClassName, setEditClassName] = useState("");
  const [editPeriods, setEditPeriods] = useState<PeriodSlot[]>(defaultPeriods);
  const [editSchedule, setEditSchedule] = useState<Record<string, string[]>>(
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

  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    const periods = [...defaultPeriods];
    await addDoc(collection(db, "timetables"), {
      className: newClassName.trim(),
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
    const newSched: Record<string, string[]> = {};
    DAYS.forEach((d) => {
      const existing = editSchedule[d] || [];
      newSched[d] = [...existing];
      while (newSched[d].length < periodCount) newSched[d].push("");
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
      const newSched: Record<string, string[]> = {};
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
              Classes ({timetables.length})
            </p>
            {timetables.map((tt) => (
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
                  className="flex-1 text-left font-body-sm font-semibold uppercase tracking-wider"
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
                <div className="flex gap-3">
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
                              const val =
                                schedIdx !== null
                                  ? editSchedule[day]?.[schedIdx] || ""
                                  : "";
                              const isEditing =
                                editingCell?.day === day &&
                                editingCell?.idx === schedIdx;
                              return (
                                <td
                                  key={day}
                                  className="p-1 border-r border-surface-variant border-b border-b-surface-variant last:border-r-0 relative"
                                >
                                  {isEditing && schedIdx !== null ? (
                                    <select
                                      autoFocus
                                      value={val}
                                      onChange={(e) => {
                                        const newSched = { ...editSchedule };
                                        newSched[day] = [...(newSched[day] || [])];
                                        newSched[day][schedIdx] = e.target.value;
                                        setEditSchedule(newSched);
                                        setEditingCell(null);
                                      }}
                                      onBlur={() => setEditingCell(null)}
                                      className="w-full p-2 bg-white border border-primary outline-none text-xs font-body-sm"
                                    >
                                      <option value="">— Select —</option>
                                      {SUBJECTS.map((s) => (
                                        <option key={s} value={s}>
                                          {s}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        schedIdx !== null &&
                                        setEditingCell({ day, idx: schedIdx })
                                      }
                                      className="w-full p-2 text-center text-xs font-body-sm hover:bg-surface-container transition-colors min-h-[40px] cursor-pointer"
                                    >
                                      {val || (
                                        <span className="text-on-surface-variant/30 italic">
                                          click
                                        </span>
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
