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

interface ComplianceDoc {
  id: string;
  title: string;
  link: string;
  category: string;
  description: string;
  updatedAt: any;
}

const CATEGORIES = [
  "CBSE Mandatory", "Safety", "Trust Deed", "Affiliation",
  "NOC", "Infrastructure", "Academic", "Other",
];

export default function ComplianceAdmin() {
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDocInfo, setNewDocInfo] = useState({ title: "", link: "", category: "CBSE Mandatory", description: "" });
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

  const openAddModal = () => {
    setEditingId(null);
    setNewDocInfo({ title: "", link: "", category: "CBSE Mandatory", description: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (item: ComplianceDoc) => {
    setEditingId(item.id);
    setNewDocInfo({
      title: item.title,
      link: item.link,
      category: item.category || "CBSE Mandatory",
      description: item.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "compliance", editingId), {
          ...newDocInfo,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "compliance"), {
          ...newDocInfo,
          updatedAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewDocInfo({ title: "", link: "", category: "CBSE Mandatory", description: "" });
    } catch (error) {
      console.error("Error saving compliance doc:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove this mandatory disclosure document?")) {
      await deleteDoc(doc(db, "compliance", id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl">gavel</span>
          <div>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest">
              Compliance Management
            </h3>
            <p className="font-body-sm text-on-surface-variant">
              Manage CBSE Mandatory Disclosure documents and transparency records.
            </p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-4 rounded hover:bg-secondary transition-all shadow-lg font-label-caps uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">description</span>
          <span>Add Document</span>
        </button>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-surface-variant">
              <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Document Title</th>
              <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Category</th>
              <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Last Updated</th>
              <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant font-body-sm text-on-surface">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-10 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Synchronizing records...</p>
                  </div>
                </td>
              </tr>
            ) : docs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center italic text-on-surface-variant">
                  No compliance documents uploaded.
                </td>
              </tr>
            ) : (
              docs.map((docItem) => (
                <tr key={docItem.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="py-4 px-6">
                    <div className="font-medium text-primary uppercase tracking-wider">{docItem.title}</div>
                    {docItem.description && (
                      <div className="font-body-sm text-on-surface-variant text-xs mt-0.5 line-clamp-1">{docItem.description}</div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 border border-secondary/20 text-secondary">
                      {docItem.category || "General"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant uppercase text-[10px] tracking-widest">
                    {docItem.updatedAt?.toDate
                      ? docItem.updatedAt.toDate().toLocaleDateString()
                      : "Recently Added"}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <a
                      href={docItem.link}
                      target="_blank"
                      className="text-on-surface-variant hover:text-primary transition-colors p-1 inline-block"
                      title="View"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </a>
                    <button
                      onClick={() => openEditModal(docItem)}
                      className="text-on-surface-variant hover:text-primary transition-colors p-1"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(docItem.id)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">
              {editingId ? "Edit Document" : "Upload Mandatory Disclosure"}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Document Title
                </label>
                <input
                  required
                  type="text"
                  value={newDocInfo.title}
                  onChange={(e) => setNewDocInfo({ ...newDocInfo, title: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                  placeholder="e.g., Building Safety Certificate"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Category
                  </label>
                  <select
                    value={newDocInfo.category}
                    title="Category"
                    onChange={(e) => setNewDocInfo({ ...newDocInfo, category: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                    Direct Link / URL (PDF)
                  </label>
                  <input
                    required
                    type="url"
                    value={newDocInfo.link}
                    onChange={(e) => setNewDocInfo({ ...newDocInfo, link: e.target.value })}
                    className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newDocInfo.description}
                  onChange={(e) => setNewDocInfo({ ...newDocInfo, description: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all"
                  placeholder="Brief description of the document..."
                />
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-5 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md">
                  {editingId ? "Update Document" : "Publish Document"}
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
