"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Notice {
  id: string;
  title: string;
  category: string;
  date: any;
  status: string;
  description?: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let q = query(
      collection(db, "notices"), 
      where("status", "==", "Live"),
      orderBy("date", "desc")
    );

    if (activeCategory !== "All") {
      q = query(
        collection(db, "notices"),
        where("status", "==", "Live"),
        where("category", "==", activeCategory),
        orderBy("date", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notice[];
      setNotices(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeCategory]);

  const categories = ["All", "Admissions", "Examinations", "General", "Events", "Urgent"];

  return (
    <main className="max-w-container-max mx-auto md:px-margin-desktop px-margin-mobile py-section-padding">
      {/* Header Section */}
      <header className="mb-24 md:mb-32 grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-8 md:col-start-3 text-center">
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-6 uppercase">Notice Board & Circulars</h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto">Stay updated with official institutional announcements and academic schedules directly from the management office.</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Filters Sidebar */}
        <aside className="md:col-span-3 mb-12 md:mb-0">
          <div className="sticky top-32">
            <h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-8 tracking-widest border-b pb-4">Categories</h3>
            <ul className="space-y-4 font-body-md">
              {categories.map((cat) => (
                <li key={cat}>
                  <button 
                    onClick={() => setActiveCategory(cat)}
                    className={`w-full text-left transition-all flex justify-between items-center group uppercase tracking-widest text-xs font-bold ${
                      activeCategory === cat ? "text-primary" : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    <span>{cat === "All" ? "All Circulars" : cat}</span>
                    <span className={`material-symbols-outlined text-secondary transition-opacity ${
                      activeCategory === cat ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}>arrow_right_alt</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Notices List */}
        <div className="md:col-span-8 md:col-start-5">
          <div className="bg-surface-container-lowest p-8 md:p-12 border border-surface-variant shadow-sm min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Synchronizing Circulars...</p>
              </div>
            ) : notices.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">info</span>
                <p className="font-body-lg text-on-surface-variant italic">No circulars currently available in this category.</p>
              </div>
            ) : notices.map((notice) => (
              <article key={notice.id} className="group pb-10 mb-10 border-b border-surface-variant last:border-b-0 last:pb-0 last:mb-0">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <span className={`font-label-caps text-[10px] uppercase border px-3 py-1 ${
                        notice.category === 'Urgent' ? 'border-error text-error bg-error-container/20' : 'border-surface-variant text-secondary'
                      }`}>
                        {notice.category}
                      </span>
                      <time className="font-body-sm text-on-surface-variant text-xs uppercase tracking-wider">
                        {notice.date?.toDate ? notice.date.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Recently Added"}
                      </time>
                    </div>
                    <h2 
                      className="font-headline-sm text-primary mb-3 hover:text-secondary transition-colors cursor-pointer leading-snug"
                      onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
                    >
                      {notice.title}
                    </h2>
                    {notice.description && (
                      <div className="mt-2">
                        <div
                          className={`font-body-md text-on-surface-variant rich-content ${expandedId === notice.id ? '' : 'line-clamp-2'}`}
                          dangerouslySetInnerHTML={{ __html: notice.description }}
                        />
                        {notice.description.length > 100 && (
                          <button 
                            onClick={() => setExpandedId(expandedId === notice.id ? null : notice.id)}
                            className="text-secondary font-label-caps text-[10px] uppercase tracking-widest mt-2 hover:text-primary transition-colors"
                          >
                            {expandedId === notice.id ? 'Read Less' : 'Read Full Circular'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 mt-4 md:mt-0">
                    <button className="flex items-center justify-center w-12 h-12 border border-surface-variant text-primary hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all">
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
