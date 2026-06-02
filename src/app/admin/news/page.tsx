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

interface EventItem {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  category: string;
  imageUrl?: string;
}

export default function NewsAdmin() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    eventDate: "",
    category: "School News",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(true);

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

  const openAddModal = () => {
    setEditingId(null);
    setNewEvent({ title: "", description: "", eventDate: "", category: "School News", imageUrl: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingId(event.id);
    setNewEvent({
      title: event.title,
      description: event.description,
      eventDate: event.eventDate || "",
      category: event.category,
      imageUrl: event.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "news", editingId), {
          ...newEvent,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "news"), {
          ...newEvent,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewEvent({ title: "", description: "", eventDate: "", category: "School News", imageUrl: "" });
    } catch (error) {
      console.error("Error saving news item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove this editorial entry?")) {
      await deleteDoc(doc(db, "news", id));
    }
  };

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
              Publish stories, achievements, and upcoming event highlights.
            </p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-4 rounded hover:bg-secondary transition-all shadow-lg font-label-caps uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">add</span>
          <span>New Editorial</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
              Accessing Newsroom...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center italic text-on-surface-variant border-2 border-dashed border-surface-variant bg-surface-container-low/30">
            No editorials published yet. Start your first story!
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-surface-container-lowest border border-surface-variant p-6 flex flex-col md:flex-row items-center gap-8 group hover:border-primary transition-all shadow-sm"
            >
              {event.imageUrl && (
                <div className="w-full md:w-48 h-32 shrink-0 bg-surface-container overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest border border-secondary/20 px-2 py-0.5">
                    {event.category}
                  </span>
                  <span className="font-body-sm text-on-surface-variant text-[10px] uppercase tracking-widest">
                    {event.eventDate || "General Update"}
                  </span>
                </div>
                <h4 className="font-headline-sm text-primary mb-2 group-hover:text-secondary transition-colors uppercase leading-tight">
                  {event.title}
                </h4>
                <p className="font-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">
                  {event.description}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(event)}
                  title="Edit Story"
                  className="text-on-surface-variant hover:text-primary transition-colors p-3 border border-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  title="Delete Story"
                  className="text-on-surface-variant hover:text-error transition-colors p-3 border border-surface-variant hover:bg-error-container/10"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">
              {editingId ? "Edit Editorial" : "Publish New Editorial"}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Story Title
                </label>
                <input
                  required
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  placeholder="e.g., National Science Symposium Success"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
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
                    <option>School News</option>
                    <option>Events</option>
                    <option>Achievements</option>
                    <option>Workshops</option>
                    <option>Sports</option>
                    <option>Cultural</option>
                    <option>Academic</option>
                    <option>Announcement</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Date Label
                  </label>
                  <input
                    type="text"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                    placeholder="e.g., Oct 15, 2024"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Feature Image URL
                </label>
                <input
                  type="url"
                  value={newEvent.imageUrl}
                  onChange={(e) => setNewEvent({ ...newEvent, imageUrl: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                {newEvent.imageUrl && (
                  <div className="mt-2 w-full h-40 bg-surface-container border border-surface-variant overflow-hidden">
                    <img
                      src={newEvent.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Full Description
                  </label>
                  <span className="font-body-sm text-on-surface-variant/50 text-[10px]">
                    {newEvent.description.length} chars
                  </span>
                </div>
                <textarea
                  required
                  rows={6}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all"
                  placeholder="Share the full story here..."
                />
              </div>

              <div className="flex gap-4 pt-8">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary py-5 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md"
                >
                  {editingId ? "Update Story" : "Publish Story"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="flex-1 border border-surface-variant py-5 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all"
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
