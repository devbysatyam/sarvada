"use client";

import { useState, useEffect, lazy, Suspense } from "react";
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

const RichTextEditor = lazy(() => import("@/components/RichTextEditor"));

interface EventItem {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  category: string;
  imageUrl?: string;
  isPinned?: boolean;
  createdAt: any;
}

const CATEGORIES = [
  "School News", "Events", "Achievements", "Workshops",
  "Sports", "Cultural", "Academic", "Announcement",
];

export default function NewsAdmin() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    eventDate: "",
    category: "School News",
    imageUrl: "",
    isPinned: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventItem[];
      setEvents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", description: "", eventDate: "", category: "School News", imageUrl: "", isPinned: false });
    setPreviewMode(false);
    setIsEditorOpen(true);
  };

  const openEdit = (event: EventItem) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate || "",
      category: event.category,
      imageUrl: event.imageUrl || "",
      isPinned: event.isPinned || false,
    });
    setPreviewMode(false);
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "news", editingId), {
          ...form,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "news"), {
          ...form,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditorOpen(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving news item:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove this story?")) {
      await deleteDoc(doc(db, "news", id));
    }
  };

  const togglePin = async (id: string, currentPin: boolean) => {
    await updateDoc(doc(db, "news", id), { isPinned: !currentPin });
  };

  // Full-page editor mode
  if (isEditorOpen) {
    return (
      <div className="space-y-6">
        {/* Editor Header */}
        <div className="flex items-center justify-between border-b border-surface-variant pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="p-2 hover:bg-surface-container transition-colors border border-surface-variant"
              title="Back to list"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <h3 className="font-headline-sm text-primary uppercase tracking-widest">
                {editingId ? "Edit Story" : "Compose New Story"}
              </h3>
              <p className="font-body-sm text-on-surface-variant text-xs">
                Use the rich editor to craft your story with formatting, images, and links.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-2 px-6 py-3 font-label-caps text-xs uppercase tracking-widest border transition-all ${
                previewMode
                  ? "bg-secondary text-white border-secondary"
                  : "border-surface-variant hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {previewMode ? "edit" : "visibility"}
              </span>
              {previewMode ? "Editor" : "Preview"}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary font-label-caps text-xs uppercase tracking-widest hover:bg-secondary transition-all shadow-md disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">publish</span>
              {saving ? "Saving..." : editingId ? "Update" : "Publish"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title Input */}
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Story Headline..."
              className="w-full px-0 py-4 bg-transparent border-0 border-b-2 border-surface-variant focus:border-primary outline-none font-headline-sm text-primary text-2xl uppercase tracking-wider placeholder:text-on-surface-variant/30"
            />

            {previewMode ? (
              /* Preview Mode */
              <div className="bg-surface-container-lowest border border-surface-variant p-8 min-h-[400px]">
                {form.imageUrl && (
                  <div className="w-full h-64 mb-6 overflow-hidden border border-surface-variant">
                    <img src={form.imageUrl} alt="Feature" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className="rich-content font-body-md text-on-surface"
                  dangerouslySetInnerHTML={{ __html: form.description || "<p><em>No content yet...</em></p>" }}
                />
              </div>
            ) : (
              /* Rich Text Editor */
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
                  placeholder="Start writing your story here... Use the toolbar above to add formatting, images, links, and more."
                  minHeight="350px"
                />
              </Suspense>
            )}
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-6">
            <div className="bg-surface-container-lowest border border-surface-variant p-6 space-y-5">
              <h4 className="font-label-caps text-xs text-secondary uppercase tracking-widest font-bold border-b border-surface-variant pb-3">
                Story Settings
              </h4>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Category</label>
                <select
                  value={form.category}
                  title="Category"
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all text-sm"
                >
                  {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Date Label</label>
                <input
                  type="text"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all text-sm"
                  placeholder="e.g., Jun 15, 2026"
                />
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Feature Image URL</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all text-sm"
                  placeholder="https://..."
                />
                {form.imageUrl && (
                  <div className="mt-2 w-full h-32 bg-surface-container border border-surface-variant overflow-hidden">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  title={form.isPinned ? "Unpin Story" : "Pin Story"}
                  onClick={() => setForm({ ...form, isPinned: !form.isPinned })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.isPinned ? "bg-primary" : "bg-surface-variant"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.isPinned ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
                <span className="font-body-sm text-on-surface text-sm">Pin to Top</span>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-surface-container-low border border-surface-variant p-5">
              <h5 className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-3 font-bold">Editor Tips</h5>
              <ul className="space-y-2 font-body-sm text-on-surface-variant text-xs">
                <li className="flex items-start gap-2"><span className="text-primary">•</span> Use headings for sections</li>
                <li className="flex items-start gap-2"><span className="text-primary">•</span> Insert images between paragraphs</li>
                <li className="flex items-start gap-2"><span className="text-primary">•</span> Ctrl+B for bold, Ctrl+I for italic</li>
                <li className="flex items-start gap-2"><span className="text-primary">•</span> Use quotes for key highlights</li>
                <li className="flex items-start gap-2"><span className="text-primary">•</span> Add links to reference sources</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl">article</span>
          <div>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest">
              Editorial & News Management
            </h3>
            <p className="font-body-sm text-on-surface-variant">
              {events.length} published stories. Use the rich editor to create compelling content.
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-4 rounded hover:bg-secondary transition-all shadow-lg font-label-caps uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">add</span>
          <span>New Story</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Accessing Newsroom...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center italic text-on-surface-variant border-2 border-dashed border-surface-variant bg-surface-container-low/30">
            No stories published. Create your first article!
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-surface-container-lowest border border-surface-variant p-5 flex flex-col md:flex-row items-start gap-6 group hover:border-primary transition-all shadow-sm"
            >
              {event.imageUrl && (
                <div className="w-full md:w-40 h-28 shrink-0 bg-surface-container overflow-hidden">
                  <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {event.isPinned && (
                    <span className="font-label-caps text-[9px] text-primary uppercase tracking-widest border border-primary/30 px-2 py-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">push_pin</span> Pinned
                    </span>
                  )}
                  <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest border border-secondary/20 px-2 py-0.5">{event.category}</span>
                  <span className="font-body-sm text-on-surface-variant text-[10px] uppercase tracking-widest">
                    {event.eventDate || (event.createdAt?.toDate ? event.createdAt.toDate().toLocaleDateString() : "Recent")}
                  </span>
                </div>
                <h4 className="font-headline-sm text-primary mb-1 group-hover:text-secondary transition-colors uppercase leading-tight text-lg">{event.title}</h4>
                <div
                  className="font-body-sm text-on-surface-variant line-clamp-2 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: event.description.replace(/<[^>]*>/g, ' ').substring(0, 200) + '...' }}
                />
              </div>
              <div className="flex md:flex-col gap-2 shrink-0">
                <button onClick={() => openEdit(event)} title="Edit Story" className="text-on-surface-variant hover:text-primary transition-colors p-2 border border-surface-variant hover:bg-surface-container">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button onClick={() => togglePin(event.id, event.isPinned || false)} title={event.isPinned ? "Unpin" : "Pin"} className="text-on-surface-variant hover:text-primary transition-colors p-2 border border-surface-variant hover:bg-surface-container">
                  <span className="material-symbols-outlined text-[18px]">{event.isPinned ? "push_pin" : "keep"}</span>
                </button>
                <button onClick={() => handleDelete(event.id)} title="Delete" className="text-on-surface-variant hover:text-error transition-colors p-2 border border-surface-variant hover:bg-error-container/10">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
