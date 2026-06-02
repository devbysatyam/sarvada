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

interface ResultItem {
  id: string;
  title: string;
  session: string;
  category: string;
  className: string;
  description: string;
  link: string;
}

const CATEGORIES = [
  "Board Results", "Academic Performance", "Competitive Exams",
  "Unit Test", "Half Yearly", "Annual", "Pre-Board",
];

export default function ResultsAdmin() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newResult, setNewResult] = useState({
    title: "", session: "2025-26", category: "Board Results",
    className: "", description: "", link: "",
  });
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");

  useEffect(() => {
    const q = query(collection(db, "results"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ResultItem[];
      setResults(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setNewResult({ title: "", session: "2025-26", category: "Board Results", className: "", description: "", link: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ResultItem) => {
    setEditingId(item.id);
    setNewResult({
      title: item.title,
      session: item.session,
      category: item.category,
      className: item.className || "",
      description: item.description || "",
      link: item.link,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "results", editingId), {
          ...newResult,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "results"), {
          ...newResult,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewResult({ title: "", session: "2025-26", category: "Board Results", className: "", description: "", link: "" });
    } catch (error) {
      console.error("Error saving result:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove this result record?")) {
      await deleteDoc(doc(db, "results", id));
    }
  };

  const filtered = filterCat ? results.filter((r) => r.category === filterCat) : results;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl">assignment</span>
          <div>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest">Results Management</h3>
            <p className="font-body-sm text-on-surface-variant">
              Publish and manage academic results, board performance, and exam records.
            </p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-4 rounded hover:bg-secondary transition-all shadow-lg font-label-caps uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">analytics</span>
          <span>Upload Result</span>
        </button>
      </div>

      {/* Category Filter */}
      {results.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterCat("")} className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest border transition-all ${!filterCat ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"}`}>
            All ({results.length})
          </button>
          {[...new Set(results.map((r) => r.category))].map((cat) => (
            <button key={cat} onClick={() => setFilterCat(cat)} className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest border transition-all ${filterCat === cat ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"}`}>
              {cat} ({results.filter((r) => r.category === cat).length})
            </button>
          ))}
        </div>
      )}

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-variant">
              <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Title</th>
              <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Class</th>
              <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Session</th>
              <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Category</th>
              <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant font-body-sm text-on-surface">
            {loading ? (
              <tr><td colSpan={5} className="p-10 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Loading records...</p>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-10 text-center italic text-on-surface-variant">
                {filterCat ? `No results in "${filterCat}" category.` : "No result records found."}
              </td></tr>
            ) : filtered.map((res) => (
              <tr key={res.id} className="hover:bg-surface-container-low transition-colors group">
                <td className="py-4 px-6">
                  <div className="font-medium text-primary uppercase tracking-wider">{res.title}</div>
                  {res.description && <div className="font-body-sm text-on-surface-variant text-xs mt-0.5 line-clamp-1">{res.description}</div>}
                </td>
                <td className="py-4 px-6 text-on-surface-variant">{res.className || "—"}</td>
                <td className="py-4 px-6 text-on-surface-variant">{res.session}</td>
                <td className="py-4 px-6">
                  <span className="font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 border border-secondary/20 text-secondary">{res.category}</span>
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  {res.link && (
                    <a href={res.link} target="_blank" className="text-on-surface-variant hover:text-primary transition-colors p-1 inline-block" title="View">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </a>
                  )}
                  <button onClick={() => openEditModal(res)} title="Edit" className="text-on-surface-variant hover:text-primary transition-colors p-1">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button onClick={() => handleDelete(res.id)} title="Delete" className="text-on-surface-variant hover:text-error transition-colors p-1">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">
              {editingId ? "Edit Result Record" : "Upload Result Record"}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Result Title</label>
                <input required type="text" value={newResult.title} onChange={(e) => setNewResult({ ...newResult, title: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="e.g., Class XII Board Results Summary" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Class</label>
                  <input type="text" value={newResult.className} onChange={(e) => setNewResult({ ...newResult, className: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="e.g., Class XII" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Session</label>
                  <input required type="text" value={newResult.session} onChange={(e) => setNewResult({ ...newResult, session: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="e.g., 2025-26" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Category</label>
                  <select value={newResult.category} title="Category" onChange={(e) => setNewResult({ ...newResult, category: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all">
                    {CATEGORIES.map((c) => (<option key={c}>{c}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Highlights / Description</label>
                <textarea rows={3} value={newResult.description} onChange={(e) => setNewResult({ ...newResult, description: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all" placeholder="e.g., 100% pass rate, 3 students above 95%..." />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Document Link / URL</label>
                <input type="url" value={newResult.link} onChange={(e) => setNewResult({ ...newResult, link: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="https://..." />
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-5 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md">
                  {editingId ? "Update Result" : "Publish Result"}
                </button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="flex-1 border border-surface-variant py-5 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all">
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
