"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Notice {
  id: string;
  title: string;
  category: string;
  date: any;
  status: string;
  description?: string;
}

export default function AdminDashboard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNotice, setNewNotice] = useState({ title: "", category: "General", status: "Live", description: "" });
  const [loading, setLoading] = useState(true);

  // Real-time fetch from Firestore
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

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "notices", editingId), {
          ...newNotice,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "notices"), {
          ...newNotice,
          date: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewNotice({ title: "", category: "General", status: "Live", description: "" });
    } catch (error) {
      console.error("Error saving notice:", error);
    }
  };

  const openEditModal = (notice: Notice) => {
    setNewNotice({
      title: notice.title,
      category: notice.category,
      status: notice.status,
      description: notice.description || ""
    });
    setEditingId(notice.id);
    setIsModalOpen(true);
  };

  const handleDeleteNotice = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      await deleteDoc(doc(db, "notices", id));
    }
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-surface-variant rounded focus:border-primary focus:ring-0 font-body-sm text-on-surface placeholder:text-on-surface-variant transition-colors outline-none" 
            placeholder="Search notices..." 
            title="Search notices"
            type="text"
          />
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setNewNotice({ title: "", category: "General", status: "Live", description: "" });
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 bg-primary text-on-primary px-6 py-3 rounded hover:bg-inverse-surface transition-colors shadow-sm font-body-sm w-full sm:w-auto justify-center"
        >
          <span className="material-symbols-outlined">add</span>
          <span>New Notice</span>
        </button>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Title</th>
                <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant font-body-sm text-on-surface">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center text-on-surface-variant italic">Loading notices...</td></tr>
              ) : notices.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-on-surface-variant italic">No notices found. Create one to get started.</td></tr>
              ) : notices.map((notice) => (
                <tr key={notice.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="py-4 px-6 font-medium">{notice.title}</td>
                  <td className="py-4 px-6 text-on-surface-variant">{notice.category}</td>
                  <td className="py-4 px-6 text-on-surface-variant">
                    {notice.date?.toDate ? notice.date.toDate().toLocaleDateString() : "Just now"}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      notice.status === 'Live' ? 'border-primary text-primary' : 'border-surface-variant text-on-surface-variant'
                    }`}>
                      {notice.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button 
                      onClick={() => openEditModal(notice)}
                      className="text-on-surface-variant hover:text-primary transition-colors p-1" 
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteNotice(notice.id)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1" 
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-xl p-10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display-sm text-primary mb-8">{editingId ? 'Edit Notice' : 'Create New Notice'}</h3>
            <form onSubmit={handleSaveNotice} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase">Notice Title</label>
                <input
                  required
                  type="text"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  placeholder="e.g., Annual Sports Meet Schedule Updated"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase">Category</label>
                  <select 
                    value={newNotice.category}
                    title="Category"
                    onChange={(e) => setNewNotice({...newNotice, category: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  >
                    <option>General</option>
                    <option>Academic</option>
                    <option>Examination</option>
                    <option>Events</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase">Status</label>
                  <select 
                    value={newNotice.status}
                    title="Status"
                    onChange={(e) => setNewNotice({...newNotice, status: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  >
                    <option>Live</option>
                    <option>Draft</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase">Full Description / Content</label>
                <textarea
                  required
                  rows={4}
                  value={newNotice.description}
                  onChange={(e) => setNewNotice({...newNotice, description: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-y"
                  placeholder="Enter the full circular text here..."
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-4 font-label-caps uppercase tracking-widest hover:bg-inverse-surface transition-all">Save Notice</button>
                <button type="button" onClick={() => {setIsModalOpen(false); setEditingId(null);}} className="flex-1 border border-surface-variant py-4 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
