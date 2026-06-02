"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ResultItem {
  id: string;
  title: string;
  session: string;
  category: string;
  className?: string;
  description?: string;
  link: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
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

  return (
    <main className="flex-grow flex flex-col items-center w-full pb-section-padding">
      {/* Hero Section */}
      <section className="w-full max-w-container-max px-margin-mobile md:px-margin-desktop py-24 flex flex-col items-center text-center">
        <span className="font-label-caps text-secondary uppercase tracking-[0.4em] mb-4 block text-[10px] font-bold">Academic Prestige</span>
        <h1 className="font-display-lg md:font-display-xl text-primary mb-6 uppercase tracking-tighter">Results & Achievements</h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Celebrating 54 years of excellence. A legacy built on academic rigor, discipline, and the consistent pursuit of success in board examinations and beyond.
        </p>
      </section>

      {/* Dynamic Results Table */}
      <section className="w-full max-w-container-max px-margin-mobile md:px-margin-desktop mb-20">
        <div className="bg-surface-container-low p-10 border border-surface-variant/30 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
          <h2 className="font-headline-md text-primary mb-10 uppercase tracking-widest border-b border-surface-variant pb-4">Academic Records</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b-2 border-primary">
                  <th className="py-5 px-6 font-label-caps text-xs text-primary uppercase tracking-widest">Performance Record</th>
                  <th className="py-5 px-6 font-label-caps text-xs text-primary uppercase tracking-widest text-center">Session</th>
                  <th className="py-5 px-6 font-label-caps text-xs text-primary uppercase tracking-widest text-right">View / Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant font-body-md text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-20 text-center italic text-on-surface-variant">Accessing archives...</td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-20 text-center italic text-on-surface-variant">No academic records published for this session yet.</td>
                  </tr>
                ) : (
                  results.map((res) => (
                    <tr key={res.id} className="hover:bg-surface-container-lowest transition-colors group">
                      <td className="py-6 px-6">
                        <p className="font-bold text-primary uppercase tracking-wider">{res.title}</p>
                        <p className="text-[10px] text-secondary font-label-caps uppercase tracking-widest mt-1">
                          {res.category}{res.className ? ` · ${res.className}` : ''}
                        </p>
                        {res.description && <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">{res.description}</p>}
                      </td>
                      <td className="py-6 px-6 text-center text-on-surface-variant font-medium">{res.session}</td>
                      <td className="py-6 px-6 text-right">
                        <a 
                          href={res.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary font-label-caps text-xs font-bold uppercase tracking-widest hover:text-secondary transition-colors"
                        >
                          View Report
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Co-curricular Excellence */}
      <section className="w-full max-w-container-max px-margin-mobile md:px-margin-desktop py-section-padding border-t border-outline-variant/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          <div className="lg:col-span-5 relative aspect-[4/5] bg-surface-container overflow-hidden">
            <img 
              alt="Sports Excellence" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" 
              src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2040&auto=format&fit=crop"
            />
            <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>
          </div>
          <div className="lg:col-span-7">
            <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-6 block text-[10px] font-bold">Beyond Academics</span>
            <h2 className="font-display-md text-primary mb-10 uppercase leading-none">Holistic<br/>Achievements</h2>
            <div className="space-y-10">
              {[
                { t: "State Athletics Championship", d: "Secured 12 Gold Medals across track and field events in 2023-24.", icon: "emoji_events" },
                { t: "National Science Symposium", d: "First Runners-Up in the Regional Innovation Challenge for water purification systems.", icon: "science" },
                { t: "Inter-School Cultural Fest", d: "Overall Champions in the Delhi Private Schools Association performing arts meet.", icon: "theater_comedy" }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 items-start group">
                  <div className="w-12 h-12 bg-surface-container flex items-center justify-center shrink-0 border border-surface-variant group-hover:border-primary transition-colors">
                    <span className="material-symbols-outlined text-primary">{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-primary mb-2 uppercase tracking-wider">{item.t}</h4>
                    <p className="font-body-md text-on-surface-variant leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
