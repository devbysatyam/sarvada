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

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  category: string;
}

const CATEGORIES = [
  "Infrastructure", "Academic", "Cultural", "Sports", "Celebrations",
  "Technology", "Workshop", "Field Trips", "Laboratory", "Assembly",
];

export default function GalleryAdmin() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ url: "", caption: "", category: "Infrastructure" });
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");

  useEffect(() => {
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GalleryItem[];
      setItems(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setNewItem({ url: "", caption: "", category: "Infrastructure" });
    setIsModalOpen(true);
  };

  const openEditModal = (item: GalleryItem) => {
    setEditingId(item.id);
    setNewItem({ url: item.url, caption: item.caption, category: item.category });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "gallery", editingId), {
          ...newItem,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "gallery"), {
          ...newItem,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewItem({ url: "", caption: "", category: "Infrastructure" });
    } catch (error) {
      console.error("Error saving gallery item:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this image from the gallery?")) {
      await deleteDoc(doc(db, "gallery", id));
    }
  };

  const filtered = filterCat ? items.filter((i) => i.category === filterCat) : items;
  const catCounts: Record<string, number> = {};
  items.forEach((i) => {
    catCounts[i.category] = (catCounts[i.category] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl">collections</span>
          <div>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest">Gallery Portfolio</h3>
            <p className="font-body-sm text-on-surface-variant">
              Manage school photography across {items.length} images.
            </p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-4 rounded hover:bg-secondary transition-all shadow-lg font-label-caps uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">add_photo_alternate</span>
          <span>Add Image</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCat("")}
            className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest border transition-all ${
              !filterCat
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"
            }`}
          >
            All ({items.length})
          </button>
          {Object.entries(catCounts).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest border transition-all ${
                filterCat === cat
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"
              }`}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Loading gallery...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center italic text-on-surface-variant border-2 border-dashed border-surface-variant bg-surface-container-low/30">
            {filterCat ? `No images in "${filterCat}" category.` : "No images in gallery. Upload one to display."}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="group relative bg-surface-container-lowest border border-surface-variant overflow-hidden shadow-sm hover:shadow-md hover:border-primary transition-all"
            >
              <div className="aspect-square bg-surface-container overflow-hidden">
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className="p-4">
                <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest block mb-2">
                  {item.category}
                </span>
                <p className="font-body-sm text-on-surface line-clamp-1 mb-4">{item.caption}</p>
                <div className="flex justify-end border-t border-surface-variant pt-3 gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    title="Edit"
                    className="text-on-surface-variant hover:text-primary transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete Image"
                    className="text-on-surface-variant hover:text-error transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">
              {editingId ? "Edit Gallery Image" : "Add to Gallery"}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Image URL
                </label>
                <input
                  required
                  type="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  placeholder="https://images.unsplash.com/..."
                />
                {newItem.url && (
                  <div className="mt-2 w-full h-48 bg-surface-container border border-surface-variant overflow-hidden">
                    <img
                      src={newItem.url}
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
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Caption
                </label>
                <input
                  required
                  type="text"
                  value={newItem.caption}
                  onChange={(e) => setNewItem({ ...newItem, caption: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  placeholder="e.g., Annual Science Exhibition 2024"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Category
                </label>
                <select
                  value={newItem.category}
                  title="Category"
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-8">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-on-primary py-5 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md"
                >
                  {editingId ? "Update Image" : "Upload Item"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
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
