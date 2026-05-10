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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  category: string;
}

export default function GalleryAdmin() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ url: "", caption: "", category: "Infrastructure" });
  const [loading, setLoading] = useState(true);

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

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "gallery"), {
        ...newItem,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewItem({ url: "", caption: "", category: "Infrastructure" });
    } catch (error) {
      console.error("Error adding gallery item:", error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm("Delete this image from the gallery?")) {
      await deleteDoc(doc(db, "gallery", id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-sm text-primary uppercase tracking-widest">Gallery Portfolio</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-primary text-on-primary px-6 py-3 rounded hover:bg-inverse-surface transition-colors shadow-sm font-body-sm"
        >
          <span className="material-symbols-outlined">add_photo_alternate</span>
          <span>Add Image</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center italic text-on-surface-variant">Loading gallery...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center italic text-on-surface-variant border-2 border-dashed border-surface-variant">
            No images in gallery. Upload one to display.
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="group relative bg-surface-container-lowest border border-surface-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-square bg-surface-container overflow-hidden">
              <img src={item.url} alt={item.caption} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
            </div>
            <div className="p-4">
              <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest block mb-2">{item.category}</span>
              <p className="font-body-sm text-on-surface line-clamp-1 mb-4">{item.caption}</p>
              <div className="flex justify-end border-t border-surface-variant pt-3">
                <button 
                  onClick={() => handleDeleteItem(item.id)}
                  title="Delete Image"
                  className="text-on-surface-variant hover:text-error transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-xl p-10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display-sm text-primary mb-8">Add to Gallery</h3>
            <form onSubmit={handleAddItem} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase">Image URL</label>
                <input
                  required
                  type="url"
                  value={newItem.url}
                  onChange={(e) => setNewItem({...newItem, url: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase">Caption</label>
                <input
                  required
                  type="text"
                  value={newItem.caption}
                  onChange={(e) => setNewItem({...newItem, caption: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  placeholder="e.g., Annual Science Exhibition 2024"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase">Category</label>
                <select 
                  value={newItem.category}
                  title="Category"
                  onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                >
                  <option>Infrastructure</option>
                  <option>Academic</option>
                  <option>Cultural</option>
                  <option>Sports</option>
                  <option>Celebrations</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-4 font-label-caps uppercase tracking-widest hover:bg-inverse-surface transition-all">Upload Item</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-surface-variant py-4 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
