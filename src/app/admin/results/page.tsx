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

interface ResultItem {
  id: string;
  title: string;
  session: string;
  category: string;
  link: string;
}

export default function ResultsAdmin() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newResult, setNewResult] = useState({ title: "", session: "2024-25", category: "Board Results", link: "" });
  const [loading, setLoading] = useState(true);

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

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "results"), {
        ...newResult,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewResult({ title: "", session: "2024-25", category: "Board Results", link: "" });
    } catch (error) {
      console.error("Error adding result:", error);
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (window.confirm("Remove this result record?")) {
      await deleteDoc(doc(db, "results", id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-sm text-primary uppercase tracking-widest">Results Management</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-primary text-on-primary px-6 py-3 rounded hover:bg-inverse-surface transition-colors shadow-sm font-body-sm"
        >
          <span className="material-symbols-outlined">analytics</span>
          <span>Upload Result</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-variant">
              <th className="py-4 px-6 font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Title</th>
              <th className="py-4 px-6 font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Session</th>
              <th className="py-4 px-6 font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Category</th>
              <th className="py-4 px-6 font-label-caps text-xs text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant font-body-sm text-on-surface">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center italic text-on-surface-variant">Loading records...</td></tr>
            ) : results.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center italic text-on-surface-variant">No result records found.</td></tr>
            ) : results.map((res) => (
              <tr key={res.id} className="hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-6 font-medium text-primary uppercase tracking-wider">{res.title}</td>
                <td className="py-4 px-6 text-on-surface-variant">{res.session}</td>
                <td className="py-4 px-6 text-on-surface-variant uppercase tracking-widest text-[10px]">{res.category}</td>
                <td className="py-4 px-6 text-right space-x-2">
                  <button 
                    onClick={() => handleDeleteResult(res.id)} 
                    title="Delete Result"
                    className="text-on-surface-variant hover:text-error transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-xl p-10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">Upload Result Record</h3>
            <form onSubmit={handleAddResult} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Result Title</label>
                <input
                  required
                  type="text"
                  value={newResult.title}
                  onChange={(e) => setNewResult({...newResult, title: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  placeholder="e.g., Class XII Board Results Summary"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Session</label>
                  <input
                    required
                    type="text"
                    value={newResult.session}
                    onChange={(e) => setNewResult({...newResult, session: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                    placeholder="e.g., 2024-25"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Category</label>
                  <select 
                    value={newResult.category}
                    title="Category"
                    onChange={(e) => setNewResult({...newResult, category: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  >
                    <option>Board Results</option>
                    <option>Academic Performance</option>
                    <option>Competitive Exams</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Document Link / URL</label>
                <input
                  required
                  type="url"
                  value={newResult.link}
                  onChange={(e) => setNewResult({...newResult, link: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-4 font-label-caps uppercase tracking-widest hover:bg-inverse-surface transition-all">Publish Result</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-surface-variant py-4 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
