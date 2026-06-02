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

interface StaffMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  qualification: string;
  subject: string;
  experience: string;
  imageUrl: string;
}

const DEPARTMENTS = [
  "Leadership", "Academic", "Administration", "Sports",
  "Arts & Culture", "Science", "Mathematics", "Languages",
  "Computer", "Primary", "Pre-Primary",
];

export default function StaffAdmin() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: "", designation: "", department: "Academic",
    qualification: "", subject: "", experience: "", imageUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("");

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

  const openAddModal = () => {
    setEditingId(null);
    setNewMember({ name: "", designation: "", department: "Academic", qualification: "", subject: "", experience: "", imageUrl: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingId(member.id);
    setNewMember({
      name: member.name,
      designation: member.designation,
      department: member.department,
      qualification: member.qualification || "",
      subject: member.subject || "",
      experience: member.experience || "",
      imageUrl: member.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, "staff", editingId), {
          ...newMember,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "staff"), {
          ...newMember,
          createdAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      setEditingId(null);
      setNewMember({ name: "", designation: "", department: "Academic", qualification: "", subject: "", experience: "", imageUrl: "" });
    } catch (error) {
      console.error("Error saving staff member:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove this staff member from the directory?")) {
      await deleteDoc(doc(db, "staff", id));
    }
  };

  const filtered = filterDept ? staff.filter((s) => s.department === filterDept) : staff;
  const deptCounts: Record<string, number> = {};
  staff.forEach((s) => {
    deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl">group</span>
          <div>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest">Faculty Directory</h3>
            <p className="font-body-sm text-on-surface-variant">
              {staff.length} faculty members across {Object.keys(deptCounts).length} departments.
            </p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary text-on-primary px-8 py-4 rounded hover:bg-secondary transition-all shadow-lg font-label-caps uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined">person_add</span>
          <span>Add Faculty</span>
        </button>
      </div>

      {/* Department Filter */}
      {staff.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterDept("")}
            className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest border transition-all ${
              !filterDept ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"
            }`}
          >
            All ({staff.length})
          </button>
          {Object.entries(deptCounts).map(([dept, count]) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-4 py-2 font-label-caps text-[10px] uppercase tracking-widest border transition-all ${
                filterDept === dept ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-surface-variant text-on-surface-variant hover:border-primary"
              }`}
            >
              {dept} ({count})
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Synchronizing staff data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center italic text-on-surface-variant border-2 border-dashed border-surface-variant bg-surface-container-low/30">
            {filterDept ? `No faculty in "${filterDept}" department.` : "Directory is empty. Add faculty members to display."}
          </div>
        ) : (
          filtered.map((member) => (
            <div key={member.id} className="bg-surface-container-lowest border border-surface-variant p-6 shadow-sm hover:border-primary transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-surface-container overflow-hidden shrink-0">
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-body-md font-bold text-primary truncate">{member.name}</h4>
                  <p className="font-body-sm text-on-surface-variant text-xs">{member.designation}</p>
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest border border-secondary/20 px-2 py-0.5">{member.department}</span>
                </div>
                {member.subject && (
                  <p className="font-body-sm text-on-surface-variant text-xs">
                    <span className="text-on-surface-variant/50">Subject:</span> {member.subject}
                  </p>
                )}
                {member.qualification && (
                  <p className="font-body-sm text-on-surface-variant text-xs">
                    <span className="text-on-surface-variant/50">Qualification:</span> {member.qualification}
                  </p>
                )}
                {member.experience && (
                  <p className="font-body-sm text-on-surface-variant text-xs">
                    <span className="text-on-surface-variant/50">Experience:</span> {member.experience}
                  </p>
                )}
              </div>
              <div className="flex justify-end border-t border-surface-variant pt-3 gap-2">
                <button onClick={() => openEditModal(member)} title="Edit" className="text-on-surface-variant hover:text-primary transition-colors p-1">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
                <button onClick={() => handleDelete(member.id)} title="Delete" className="text-on-surface-variant hover:text-error transition-colors p-1">
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
              {editingId ? "Edit Faculty Member" : "Add Faculty Member"}
            </h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Full Name</label>
                  <input required type="text" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="e.g., Dr. Ananya Sharma" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Designation</label>
                  <input required type="text" value={newMember.designation} onChange={(e) => setNewMember({ ...newMember, designation: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="e.g., PGT Mathematics" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Department</label>
                  <select value={newMember.department} title="Department" onChange={(e) => setNewMember({ ...newMember, department: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm appearance-none transition-all">
                    {DEPARTMENTS.map((d) => (<option key={d}>{d}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Subject Taught</label>
                  <input type="text" value={newMember.subject} onChange={(e) => setNewMember({ ...newMember, subject: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="e.g., Mathematics" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Qualification</label>
                  <input type="text" value={newMember.qualification} onChange={(e) => setNewMember({ ...newMember, qualification: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="e.g., M.Sc. Mathematics, B.Ed." />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Experience</label>
                  <input type="text" value={newMember.experience} onChange={(e) => setNewMember({ ...newMember, experience: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="e.g., 12 years" />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Profile Image URL (Optional)</label>
                  <input type="url" value={newMember.imageUrl} onChange={(e) => setNewMember({ ...newMember, imageUrl: e.target.value })} className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all" placeholder="https://..." />
                </div>
              </div>
              <div className="flex gap-4 pt-8">
                <button type="submit" className="flex-1 bg-primary text-on-primary py-5 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all shadow-md">
                  {editingId ? "Update Member" : "Add to Directory"}
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
