"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface FeedbackItem {
  id: string;
  parentName: string;
  studentName: string;
  studentClass: string;
  ratings: {
    academics: number;
    infrastructure: number;
    safety: number;
    activities: number;
    communication: number;
    overall: number;
  };
  suggestions?: string;
  lang: "en" | "hi";
  submittedAt: any;
}

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  // Stats calculation
  const [stats, setStats] = useState({
    total: 0,
    overallAvg: 0,
    academicsAvg: 0,
    infraAvg: 0,
    safetyAvg: 0,
    activitiesAvg: 0,
    commAvg: 0
  });

  useEffect(() => {
    const q = query(collection(db, "feedbacks"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeedbackItem[];
      setFeedbacks(data);
      
      // Calculate Stats
      if (data.length > 0) {
        const sum = data.reduce((acc, curr) => {
          acc.overall += curr.ratings?.overall || 0;
          acc.academics += curr.ratings?.academics || 0;
          acc.infrastructure += curr.ratings?.infrastructure || 0;
          acc.safety += curr.ratings?.safety || 0;
          acc.activities += curr.ratings?.activities || 0;
          acc.communication += curr.ratings?.communication || 0;
          return acc;
        }, { overall: 0, academics: 0, infrastructure: 0, safety: 0, activities: 0, communication: 0 });

        const count = data.length;
        setStats({
          total: count,
          overallAvg: parseFloat((sum.overall / count).toFixed(1)),
          academicsAvg: parseFloat((sum.academics / count).toFixed(1)),
          infraAvg: parseFloat((sum.infrastructure / count).toFixed(1)),
          safetyAvg: parseFloat((sum.safety / count).toFixed(1)),
          activitiesAvg: parseFloat((sum.activities / count).toFixed(1)),
          commAvg: parseFloat((sum.communication / count).toFixed(1))
        });
      } else {
        setStats({
          total: 0,
          overallAvg: 0,
          academicsAvg: 0,
          infraAvg: 0,
          safetyAvg: 0,
          activitiesAvg: 0,
          commAvg: 0
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteFeedback = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening the detail modal
    if (window.confirm("Are you sure you want to permanently delete this feedback entry?")) {
      try {
        await deleteDoc(doc(db, "feedbacks", id));
        if (selectedFeedback?.id === id) {
          setSelectedFeedback(null);
        }
      } catch (err) {
        console.error("Error deleting feedback:", err);
        alert("Failed to delete the feedback entry.");
      }
    }
  };

  // Extract unique classes present in the feedback for filtering dropdown
  const classesList = Array.from(new Set(feedbacks.map(f => f.studentClass))).sort();

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((item) => {
    const matchesSearch = 
      item.parentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter ? item.studentClass === classFilter : true;
    return matchesSearch && matchesClass;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={`material-symbols-outlined text-[18px] ${
              star <= rating ? "text-[#d97706] symbol-fill" : "text-slate-200"
            }`}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Header and Title */}
      <div className="flex items-center gap-4">
        <span className="material-symbols-outlined text-primary text-4xl">rate_review</span>
        <div>
          <h3 className="font-display-sm text-primary uppercase tracking-widest text-xl font-bold">Parent Feedback Dashboard</h3>
          <p className="font-body-sm text-on-surface-variant font-light">Monitor parent satisfaction, survey statistics, and read recommendations.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant font-medium">Accessing Feedback database...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="bg-surface-container-lowest p-5 border border-surface-variant/40 shadow-sm text-center flex flex-col justify-center">
              <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest block mb-1 font-bold">Total Feedbacks</span>
              <p className="font-display-lg text-4xl text-primary font-bold">{stats.total}</p>
            </div>
            
            <div className="bg-surface-container-lowest p-5 border border-surface-variant/40 shadow-sm text-center flex flex-col justify-center">
              <span className="font-label-caps text-[9px] text-[#d97706] uppercase tracking-widest block mb-1 font-bold">Overall Rating</span>
              <p className="font-display-lg text-4xl text-[#d97706] font-bold flex items-center justify-center gap-1">
                {stats.overallAvg}
                <span className="material-symbols-outlined text-[20px] symbol-fill">star</span>
              </p>
            </div>

            <div className="bg-surface-container-lowest p-5 border border-surface-variant/40 shadow-sm text-center flex flex-col justify-center">
              <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest block mb-1 font-bold">Academics</span>
              <p className="font-display-lg text-3xl text-primary font-bold">{stats.academicsAvg}/5</p>
            </div>

            <div className="bg-surface-container-lowest p-5 border border-surface-variant/40 shadow-sm text-center flex flex-col justify-center">
              <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest block mb-1 font-bold">Infrastructure</span>
              <p className="font-display-lg text-3xl text-primary font-bold">{stats.infraAvg}/5</p>
            </div>

            <div className="bg-surface-container-lowest p-5 border border-surface-variant/40 shadow-sm text-center flex flex-col justify-center">
              <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest block mb-1 font-bold">Safety</span>
              <p className="font-display-lg text-3xl text-primary font-bold">{stats.safetyAvg}/5</p>
            </div>

            <div className="bg-surface-container-lowest p-5 border border-surface-variant/40 shadow-sm text-center flex flex-col justify-center">
              <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest block mb-1 font-bold">Activities</span>
              <p className="font-display-lg text-3xl text-primary font-bold">{stats.activitiesAvg}/5</p>
            </div>

            <div className="bg-surface-container-lowest p-5 border border-surface-variant/40 shadow-sm text-center flex flex-col justify-center">
              <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest block mb-1 font-bold">Communication</span>
              <p className="font-display-lg text-3xl text-primary font-bold">{stats.commAvg}/5</p>
            </div>
          </div>

          {/* Action and Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between gap-4 bg-surface-container-low/30 p-4 border border-surface-variant/20 rounded-sm">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-surface-variant rounded-sm focus:border-primary focus:ring-0 font-body-sm text-on-surface placeholder:text-on-surface-variant transition-colors outline-none" 
                placeholder="Search by Parent or Student name..." 
                title="Search feedback"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-60">
              <select 
                value={classFilter}
                title="Filter by Class"
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant rounded-sm focus:border-primary focus:ring-0 font-body-sm text-on-surface transition-colors outline-none"
              >
                <option value="">All Classes (सभी कक्षाएं)</option>
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-variant">
                    <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Parent Name</th>
                    <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Student & Class</th>
                    <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-center">Lang</th>
                    <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Overall Rating</th>
                    <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Submitted On</th>
                    <th className="py-4 px-6 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/40 font-body-sm text-on-surface">
                  {filteredFeedbacks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-on-surface-variant italic">
                        No feedback items found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredFeedbacks.map((item) => (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedFeedback(item)}
                        className="hover:bg-surface-container-low/30 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-6 font-medium">{item.parentName}</td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-primary">{item.studentName}</div>
                          <div className="text-[11px] font-label-caps text-on-surface-variant uppercase tracking-wider mt-0.5">{item.studentClass}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold border ${
                            item.lang === "hi" 
                              ? "border-secondary/30 text-secondary bg-secondary/5" 
                              : "border-primary/30 text-primary bg-primary/5"
                          }`}>
                            {item.lang}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1">
                            {renderStars(item.ratings?.overall || 0)}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-on-surface-variant">
                          {item.submittedAt?.toDate ? item.submittedAt.toDate().toLocaleString() : "Just now"}
                        </td>
                        <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => setSelectedFeedback(item)}
                              className="text-on-surface-variant hover:text-primary transition-colors p-2 hover:bg-surface-container rounded" 
                              title="View Details"
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button 
                              onClick={(e) => handleDeleteFeedback(item.id, e)}
                              className="text-on-surface-variant hover:text-error transition-colors p-2 hover:bg-error-container/10 rounded" 
                              title="Delete Feedback"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Details Modal */}
          {selectedFeedback && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest w-full max-w-2xl p-8 md:p-12 shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
                
                {/* Modal close icon */}
                <button 
                  onClick={() => setSelectedFeedback(null)}
                  className="absolute top-6 right-6 p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors rounded-full flex items-center justify-center"
                  title="Close Modal"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>

                <div className="space-y-8">
                  {/* Header info */}
                  <div>
                    <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest font-bold">Feedback Details</span>
                    <h3 className="font-display-sm text-primary text-2xl uppercase tracking-wider mt-2 font-bold">{selectedFeedback.parentName}</h3>
                    <p className="font-body-sm text-on-surface-variant mt-1 leading-none font-light">
                      Submitted on: {selectedFeedback.submittedAt?.toDate ? selectedFeedback.submittedAt.toDate().toLocaleString() : "Just now"}
                    </p>
                  </div>

                  {/* Student & Class Card */}
                  <div className="grid grid-cols-2 gap-4 bg-surface-container-low/40 p-5 border border-surface-variant/20 rounded-sm">
                    <div>
                      <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider block font-bold">Student Name</span>
                      <span className="font-body-md text-primary font-semibold">{selectedFeedback.studentName}</span>
                    </div>
                    <div>
                      <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider block font-bold">Class / Section</span>
                      <span className="font-body-md text-primary font-semibold">{selectedFeedback.studentClass}</span>
                    </div>
                  </div>

                  {/* Ratings breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-label-caps text-xs text-secondary uppercase tracking-[0.2em] border-b border-surface-variant/40 pb-2 font-bold">Survey Scores</h4>
                    
                    <div className="space-y-3 font-body-sm text-on-surface">
                      {[
                        { key: "academics", label: "Academic Quality" },
                        { key: "infrastructure", label: "Infrastructure & Facilities" },
                        { key: "safety", label: "Safety & Security" },
                        { key: "activities", label: "Co-curricular Activities" },
                        { key: "communication", label: "Teacher-Parent Communication" },
                        { key: "overall", label: "Overall Satisfaction", isBold: true }
                      ].map((aspect) => {
                        const score = (selectedFeedback.ratings as any)[aspect.key] || 0;
                        return (
                          <div 
                            key={aspect.key} 
                            className={`flex justify-between items-center py-2 ${
                              aspect.isBold ? "border-t border-surface-variant/40 pt-4 mt-2" : "border-b border-surface-variant/10"
                            }`}
                          >
                            <span className={aspect.isBold ? "font-semibold text-primary uppercase text-xs tracking-wider" : "text-on-surface"}>
                              {aspect.label}
                            </span>
                            <div className="flex items-center gap-3">
                              {renderStars(score)}
                              <span className="font-headline-sm text-sm text-primary font-bold w-4 text-right">{score}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suggestions textbox */}
                  <div className="space-y-3">
                    <h4 className="font-label-caps text-xs text-secondary uppercase tracking-[0.2em] border-b border-surface-variant/40 pb-2 font-bold">Suggestions & Comments</h4>
                    <div className="bg-surface-container-low/40 p-5 border border-surface-variant/20 font-body-sm text-on-surface-variant leading-relaxed min-h-24 whitespace-pre-wrap font-light rounded-sm">
                      {selectedFeedback.suggestions?.trim() 
                        ? selectedFeedback.suggestions 
                        : <span className="italic text-slate-400">No suggestions or comments provided.</span>
                      }
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex gap-4 pt-4 border-t border-surface-variant/40">
                    <button 
                      onClick={(e) => {
                        handleDeleteFeedback(selectedFeedback.id, e);
                      }} 
                      className="flex-1 border border-error text-error py-4 font-label-caps text-xs uppercase tracking-widest hover:bg-error-container/10 transition-all font-bold flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Delete Feedback
                    </button>
                    <button 
                      onClick={() => setSelectedFeedback(null)} 
                      className="flex-1 bg-primary text-on-primary py-4 font-label-caps text-xs uppercase tracking-widest hover:bg-secondary transition-all font-bold"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
