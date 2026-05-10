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

interface StaffMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  imageUrl: string;
}

export default function StaffAdmin() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({ name: "", designation: "", department: "Academic", imageUrl: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "staff"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StaffMember[];
      setStaff(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "staff"), {
        ...newMember,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewMember({ name: "", designation: "", department: "Academic", imageUrl: "" });
    } catch (error) {
      console.error("Error adding staff member:", error);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm("Remove this staff member from the directory?")) {
      await deleteDoc(doc(db, "staff", id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-headline-sm text-primary uppercase tracking-widest">Faculty Directory</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-primary text-on-primary px-6 py-3 rounded hover:bg-inverse-surface transition-colors shadow-sm font-body-sm"
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>Add Faculty</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center italic text-on-surface-variant">Synchronizing staff data...</div>
        ) : staff.length === 0 ? (
          <div className="col-span-full py-20 text-center italic text-on-surface-variant border-2 border-dashed border-surface-variant">
            Directory is empty. Add faculty members to display.
          </div>
        ) : staff.map((member) => (
          <div key={member.id} className="bg-surface-container-lowest border border-surface-variant p-6 flex items-center gap-6 shadow-sm hover:border-primary transition-all group">
            <div className="w-16 h-16 rounded-full bg-surface-container overflow-hidden shrink-0">
              {member.imageUrl ? (
                <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined">person</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-body-md font-bold text-primary">{member.name}</h4>
              <p className="font-body-sm text-on-surface-variant">{member.designation}</p>
              <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest mt-1 block">{member.department}</span>
            </div>
            <button 
              onClick={() => handleDeleteMember(member.id)}
              title="Delete Faculty Member"
              className="text-on-surface-variant hover:text-error transition-colors p-2"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-xl p-10 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="font-display-sm text-primary mb-8 uppercase tracking-widest text-xl">Add Faculty Member</h3>
            <form onSubmit={handleAddMember} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Full Name</label>
                <input
                  required
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  placeholder="e.g., Dr. Ananya Sharma"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Designation</label>
                  <input
                    required
                    type="text"
                    value={newMember.designation}
                    onChange={(e) => setNewMember({...newMember, designation: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                    placeholder="e.g., PGT Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Department</label>
                  <select 
                    value={newMember.department}
                    title="Department"
                    onChange={(e) => setNewMember({...newMember, department: e.target.value})}
                    className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  >
                    <option>Leadership</option>
                    <option>Academic</option>
                    <option>Administration</option>
                    <option>Sports</option>
                    <option>Arts & Culture</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Profile Image URL (Optional)</label>
                <input
                  type="url"
                  value={newMember.imageUrl}
                  onChange={(e) => setNewMember({...newMember, imageUrl: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-4 font-label-caps uppercase tracking-widest hover:bg-inverse-surface transition-all">Add to Directory</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-surface-variant py-4 font-label-caps uppercase tracking-widest hover:bg-surface-container transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
