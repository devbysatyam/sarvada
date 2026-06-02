"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ComplianceDoc {
  id: string;
  title: string;
  link: string;
  category?: string;
  description?: string;
  updatedAt: any;
}

export default function CompliancePage() {
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
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

  return (
    <main className="pt-[140px] pb-section-padding px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      {/* Header Section */}
      <section className="mb-16 border-b border-surface-variant pb-16">
        <span className="font-label-caps text-secondary uppercase tracking-[0.3em] mb-4 block text-[10px] font-bold">Official Disclosures</span>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-6 uppercase tracking-tight">Mandatory Public Disclosure</h1>
        <p className="font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          In compliance with CBSE guidelines and our commitment to institutional transparency, Sarvada Modern School provides the following essential documents for public review.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
        {/* Left Column: General Info */}
        <aside className="md:col-span-4">
          <div className="sticky top-[140px] space-y-12">
            <div className="bg-surface-container-low p-8 border border-surface-variant shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <h3 className="font-headline-sm text-primary mb-8 uppercase tracking-widest text-sm">General Information</h3>
              <div className="space-y-6">
                {[
                  { l: "School Name", v: "Sarvada Modern School" },
                  { l: "Affiliation No.", v: "2730164" },
                  { l: "School Code", v: "07030327105" },
                  { l: "Principal", v: "Sh. Rakesh Kapoor" },
                  { l: "Address", v: "A/18 Gali no. 1 sukkar Bazar, Sadatpur, Karawal Nagar, Delhi 110090" }
                ].map((item, i) => (
                  <div key={i} className="border-b border-surface-variant/30 pb-2">
                    <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest mb-1">{item.l}</span>
                    <span className="block font-body-md text-primary font-bold">{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: Dynamic Documents */}
        <div className="md:col-span-8">
          <h2 className="font-headline-md text-primary mb-12 uppercase tracking-widest border-b border-surface-variant pb-4">Essential Documents & Certificates</h2>
          
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Accessing Documents...</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-surface-variant bg-surface-container-low">
              <p className="font-body-md text-on-surface-variant italic">No compliance documents currently listed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {docs.map((docItem) => (
                <div key={docItem.id} className="group bg-surface-container-lowest border border-surface-variant hover:border-primary p-6 transition-all shadow-sm flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-surface-container flex items-center justify-center shrink-0 border border-surface-variant group-hover:border-primary transition-colors">
                      <span className="material-symbols-outlined text-primary">description</span>
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-primary group-hover:text-secondary transition-colors uppercase text-sm tracking-wider">{docItem.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        {docItem.category && (
                          <span className="font-label-caps text-[9px] text-secondary uppercase tracking-widest border border-secondary/20 px-2 py-0.5">{docItem.category}</span>
                        )}
                        <p className="font-body-sm text-on-surface-variant text-[10px] uppercase tracking-widest">
                          Updated: {docItem.updatedAt?.toDate ? docItem.updatedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                        </p>
                      </div>
                      {docItem.description && (
                        <p className="font-body-sm text-on-surface-variant text-xs mt-1 line-clamp-1">{docItem.description}</p>
                      )}
                    </div>
                  </div>
                  <a 
                    href={docItem.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary font-label-caps text-[10px] font-bold uppercase tracking-widest hover:text-secondary transition-all border border-surface-variant px-4 py-2 hover:bg-surface-container-low"
                  >
                    View <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              ))}
            </div>
          )}

          <div className="mt-20 p-8 bg-error-container/10 border border-error/20">
            <h4 className="font-label-caps text-error text-[10px] uppercase tracking-widest mb-4 font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              Note to Public
            </h4>
            <p className="font-body-sm text-on-surface-variant leading-relaxed">
              These documents are strictly for public disclosure as per academic regulations. Any unauthorized reproduction or distribution is prohibited. For verification of original certificates, please contact the school office.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
