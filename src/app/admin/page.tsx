"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRBAC, WriteGuard } from "@/context/RBACContext";

const RichTextEditor = lazy(() => import("@/components/RichTextEditor"));

interface Notice {
  id: string;
  title: string;
  category: string;
  date: any;
  status: string;
  priority: string;
  description?: string;
}

const CATEGORIES = ["General", "Academic", "Examination", "Events", "Admissions", "Urgent", "Administrative"];

export default function AdminDashboard() {
  const { canWrite } = useRBAC();
  const canEditNotices = canWrite("notice_board");
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", category: "General", status: "Live", priority: "Normal", description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingAlert, setSendingAlert] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notice[];
      setNotices(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", category: "General", status: "Live", priority: "Normal", description: "" });
    setIsEditorOpen(true);
  };

  const openEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setForm({
      title: notice.title,
      category: notice.category,
      status: notice.status,
      priority: notice.priority || "Normal",
      description: notice.description || "",
    });
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "notices", editingId), {
          ...form,
          updatedAt: serverTimestamp(),
        });
      } else {
        const newDocRef = await addDoc(collection(db, "notices"), {
          ...form,
          date: serverTimestamp(),
        });
        // Auto-trigger email blast for Urgent notices
        if (form.priority === "Urgent" && form.status === "Live") {
          try {
            await fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "urgent_notice",
                notice: { title: form.title, category: form.category, description: form.description },
              }),
            });
          } catch (e) {
            console.warn("Urgent email blast failed (non-blocking):", e);
          }
        }
      }
      setIsEditorOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving notice:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSendAlert = async (notice: Notice) => {
    setSendingAlert(notice.id);
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "urgent_notice",
          notice: { title: notice.title, category: notice.category, description: notice.description },
        }),
      });
    } catch (e) {
      console.error("Failed to send alert:", e);
    } finally {
      setSendingAlert(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this notice permanently?")) {
      await deleteDoc(doc(db, "notices", id));
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Live" ? "Draft" : "Live";
    await updateDoc(doc(db, "notices", id), { status: newStatus });
  };

  // Editor View
  if (isEditorOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-surface-variant pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="p-2 hover:bg-surface-container transition-colors border border-surface-variant"
              title="Back"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <h3 className="font-headline-sm text-primary uppercase tracking-widest">
                {editingId ? "Edit Notice" : "Create Notice"}
              </h3>
              <p className="font-body-sm text-on-surface-variant text-xs">
                Draft a notice with rich formatting for the public notice board.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setForm({ ...form, status: "Draft" });
                handleSave();
              }}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 font-label-caps text-xs uppercase tracking-widest border border-surface-variant hover:bg-surface-container transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Draft
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary font-label-caps text-xs uppercase tracking-widest hover:bg-secondary transition-all shadow-md disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              {saving ? "Saving..." : editingId ? "Update" : "Publish"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Notice Title..."
              className="w-full px-0 py-4 bg-transparent border-0 border-b-2 border-surface-variant focus:border-primary outline-none font-headline-sm text-primary text-2xl uppercase tracking-wider placeholder:text-on-surface-variant/30"
            />

            <Suspense
              fallback={
                <div className="border border-surface-variant p-10 text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Loading Editor...</p>
                </div>
              }
            >
              <RichTextEditor
                content={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder="Write the full circular content here... Use formatting, images, and lists to make it clear and official."
                minHeight="300px"
              />
            </Suspense>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-lowest border border-surface-variant p-6 space-y-5">
              <h4 className="font-label-caps text-xs text-secondary uppercase tracking-widest font-bold border-b border-surface-variant pb-3">
                Notice Settings
              </h4>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Category</label>
                <select value={form.category} title="Category" onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all text-sm">
                  {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Visibility</label>
                <select value={form.status} title="Status" onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all text-sm">
                  <option>Live</option>
                  <option>Draft</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Priority</label>
                <select value={form.priority} title="Priority" onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all text-sm">
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  const filtered = notices.filter((n) => {
    const matchesStatus = !filterStatus || n.status === filterStatus;
    const matchesSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const liveCount = notices.filter((n) => n.status === "Live").length;
  const draftCount = notices.filter((n) => n.status === "Draft").length;

  return (
    <div className="space-y-8">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-surface-variant p-5 text-center">
          <div className="text-3xl font-bold font-mono text-primary">{notices.length}</div>
          <div className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mt-1">Total Notices</div>
        </div>
        <div className="bg-surface-container-lowest border border-surface-variant p-5 text-center">
          <div className="text-3xl font-bold font-mono text-primary">{liveCount}</div>
          <div className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mt-1">Live</div>
        </div>
        <div className="bg-surface-container-lowest border border-surface-variant p-5 text-center">
          <div className="text-3xl font-bold font-mono text-on-surface-variant">{draftCount}</div>
          <div className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mt-1">Drafts</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm text-sm transition-colors"
              placeholder="Search notices..."
              type="text"
            />
          </div>
          <div className="flex gap-1">
            {["", "Live", "Draft"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest border transition-all ${
                  filterStatus === s
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"
                }`}
              >
                {s || "All"}
              </button>
            ))}
          </div>
        </div>
        <WriteGuard section="notice_board">
          <button
            onClick={openCreate}
            className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-3 hover:bg-secondary transition-all shadow-md font-label-caps uppercase tracking-widest text-xs"
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Notice</span>
          </button>
        </WriteGuard>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Title</th>
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant font-body-sm text-on-surface">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Loading...</p>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-on-surface-variant italic">
                  {searchQuery ? "No notices match your search." : "No notices yet. Create one to get started."}
                </td></tr>
              ) : filtered.map((notice) => (
                <tr key={notice.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="py-4 px-6">
                    <div className="font-medium text-primary">{notice.title}</div>
                    {notice.description && (
                      <div className="text-xs text-on-surface-variant mt-0.5 line-clamp-1" dangerouslySetInnerHTML={{ __html: notice.description.replace(/<[^>]*>/g, ' ').substring(0, 100) }} />
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                      notice.category === "Urgent" ? "border-error text-error" : "border-secondary/20 text-secondary"
                    }`}>{notice.category}</span>
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant text-xs">
                    {notice.date?.toDate ? notice.date.toDate().toLocaleDateString() : "Just now"}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => toggleStatus(notice.id, notice.status)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border cursor-pointer transition-all ${
                        notice.status === "Live"
                          ? "border-primary text-primary hover:bg-primary/5"
                          : "border-surface-variant text-on-surface-variant hover:border-primary"
                      }`}
                      title={`Click to ${notice.status === "Live" ? "unpublish" : "publish"}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${notice.status === "Live" ? "bg-primary" : "bg-surface-variant"}`}></span>
                      {notice.status}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right space-x-1">
                    {notice.priority === "Urgent" && (
                      <button
                        onClick={() => handleSendAlert(notice)}
                        disabled={sendingAlert === notice.id}
                        className="text-on-surface-variant hover:text-error transition-colors p-1.5 border border-transparent hover:border-surface-variant disabled:opacity-50"
                        title="Send urgent email alert"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {sendingAlert === notice.id ? "sync" : "notification_important"}
                        </span>
                      </button>
                    )}
                    <WriteGuard section="notice_board">
                      <button onClick={() => openEdit(notice)} className="text-on-surface-variant hover:text-primary transition-colors p-1.5 border border-transparent hover:border-surface-variant" title="Edit">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </WriteGuard>
                    <WriteGuard section="notice_board">
                      <button onClick={() => handleDelete(notice.id)} className="text-on-surface-variant hover:text-error transition-colors p-1.5 border border-transparent hover:border-surface-variant" title="Delete">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </WriteGuard>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
