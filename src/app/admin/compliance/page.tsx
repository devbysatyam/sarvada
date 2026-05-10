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

interface ComplianceDoc {
  id: string;
  title: string;
  link: string;
  updatedAt: any;
}

export default function ComplianceAdmin() {
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDocInfo, setNewDocInfo] = useState({ title: "", link: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "compliance"), orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ComplianceDoc[];
      setDocs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "compliance"), {
        ...newDocInfo,
        updatedAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewDocInfo({ title: "", link: "" });
    } catch (error) {
      console.error("Error adding compliance doc:", error);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (window.confirm("Remove this mandatory disclosure document?")) {
      await deleteDoc(doc(db, "compliance", id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-headline-sm text-primary uppercase tracking-widest">Compliance Management</h3>
          <p className="font-body-sm text-on-surface-variant">Manage CBSE Mandatory Disclosure documents and transparency records.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-primary text-on-primary px-6 py-3 rounded hover:bg-inverse-surface transition-colors shadow-sm font-body-sm"
        >
          <span className="material-symbols-outlined">description</span>
          <span>Add Document</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-variant">
              <th className="py-4 px-6 font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Document Title</th>
              <th className="py-4 px-6 font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Last Updated</th>
              <th className="py-4 px-6 font-label-caps text-xs text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant font-body-sm text-on-surface">
            {loading ? (
              <tr><td colSpan={3} className="p-10 text-center italic text-on-surface-variant">Synchronizing records...</td></tr>
            ) : docs.length === 0 ? (
              <tr><td colSpan={3} className="p-10 text-center italic text-on-surface-variant">No compliance documents uploaded.</td></tr>
            ) : docs.map((docItem) => (
              <tr key={docItem.id} className="hover:bg-surface-container-low transition-colors">
                <td className="py-4 px-6 font-medium text-primary uppercase tracking-wider">{docItem.title}</td>
                <td className="py-4 px-6 text-on-surface-variant uppercase text-[10px] tracking-widest">
                  {docItem.updatedAt?.toDate ? docItem.updatedAt.toDate().toLocaleDateString() : "Recently Added"}
                </td>
                <td className="py-4 px-6 text-right space-x-2">
                  <a href={docItem.link} target="_blank" className="text-on-surface-variant hover:text-primary transition-colors p-1" title="View">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </a>
                  <button onClick={() => handleDeleteDoc(docItem.id)} className="text-on-surface-variant hover:text-error transition-colors p-1" title="Delete">
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
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">Upload Mandatory Disclosure</h3>
            <form onSubmit={handleAddDoc} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Document Title</label>
                <input
                  required
                  type="text"
                  value={newDocInfo.title}
                  onChange={(e) => setNewDocInfo({...newDocInfo, title: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  placeholder="e.g., Building Safety Certificate"
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Direct Link / URL (PDF)</label>
                <input
                  required
                  type="url"
                  value={newDocInfo.link}
                  onChange={(e) => setNewDocInfo({...newDocInfo, link: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-4 font-label-caps uppercase tracking-widest hover:bg-inverse-surface transition-all">Publish Document</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-surface-variant py-4 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
