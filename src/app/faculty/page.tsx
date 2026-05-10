"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StaffMember {
  id: string;
  name: string;
  designation: string;
  department: string;
  imageUrl: string;
}

export default function FacultyPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDepartment, setActiveDepartment] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let q = query(collection(db, "staff"), orderBy("createdAt", "asc"));
    
    if (activeDepartment !== "All") {
      q = query(
        collection(db, "staff"), 
        where("department", "==", activeDepartment),
        orderBy("createdAt", "asc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StaffMember[];
      setStaff(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeDepartment]);

  const departments = ["All", "Leadership", "Academic", "Administration", "Sports", "Arts & Culture"];

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex-grow w-full max-w-[1280px] mx-auto md:px-margin-desktop px-margin-mobile py-section-padding">
      {/* Page Header */}
      <div className="mb-20 text-center max-w-3xl mx-auto py-16">
        <span className="font-label-caps text-on-surface-variant uppercase tracking-[0.2em] mb-4 block text-[10px] font-bold">Our Community</span>
        <h1 className="font-display-lg md:text-display-xl text-primary mb-6 uppercase">Faculty & Staff Directory</h1>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">Meet the dedicated educators and professionals at Sarvada Modern School who shape the minds and futures of our students through rigorous academics and compassionate guidance.</p>
      </div>

      {/* Directory Filter & Search */}
      <div className="mb-16 flex flex-col lg:flex-row justify-between items-center gap-8 bg-surface-container-low p-6 border border-outline-variant/30 shadow-sm">
        <div className="flex gap-6 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
          {departments.map((dept) => (
            <button 
              key={dept}
              onClick={() => setActiveDepartment(dept)}
              className={`font-label-caps uppercase tracking-widest text-[11px] font-bold transition-all whitespace-nowrap pb-2 border-b-2 ${
                activeDepartment === dept ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:text-primary"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm transition-colors" 
            placeholder="Search name or designation..." 
            type="text"
          />
        </div>
      </div>

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {loading ? (
          <div className="col-span-full py-40 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Accessing Directory...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-full py-40 text-center border border-dashed border-surface-variant">
            <p className="font-body-lg text-on-surface-variant italic">No faculty members found matching your criteria.</p>
          </div>
        ) : filteredStaff.map((member) => (
          <div key={member.id} className="bg-surface-container-lowest p-8 border border-surface-variant hover:border-primary hover:shadow-2xl transition-all flex flex-col items-center text-center group relative">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-surface-variant group-hover:border-primary transition-colors">
                {member.imageUrl ? (
                  <img alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src={member.imageUrl}/>
                ) : (
                  <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl">person</span>
                  </div>
                )}
              </div>
            </div>
            <h4 className="font-headline-sm text-primary mb-2 line-clamp-1">{member.name}</h4>
            <p className="font-label-caps text-[10px] text-secondary uppercase tracking-widest mb-2 font-bold">{member.designation}</p>
            <p className="font-body-sm text-on-surface-variant uppercase text-[10px] tracking-widest">{member.department}</p>
            
            <div className="w-full border-t border-surface-variant mt-8 pt-6 flex justify-center items-center">
              <a aria-label={`Email ${member.name}`} className="text-on-surface-variant hover:text-primary transition-colors" href="#">
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
