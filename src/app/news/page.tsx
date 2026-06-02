"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  category: string;
  imageUrl?: string;
  createdAt: any;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch News & Events
    const newsQ = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(6));
    const unsubNews = onSnapshot(newsQ, (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem)));
    });

    // Fetch Latest Notices
    const noticesQ = query(collection(db, "notices"), orderBy("date", "desc"), limit(4));
    const unsubNotices = onSnapshot(noticesQ, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubNews();
      unsubNotices();
    };
  }, []);

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-20 text-center max-w-4xl mx-auto">
        <span className="font-label-caps text-secondary uppercase tracking-[0.3em] mb-4 block text-[10px] font-bold">Stay Updated</span>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-6 uppercase tracking-tight">News & Editorial</h1>
        <p className="font-body-lg text-on-surface-variant leading-relaxed">
          The latest updates, academic achievements, and official announcements from the Sarvada Modern School community.
        </p>
      </section>

      {/* Magazine Grid Section */}
      <section className="px-margin-mobile md:px-margin-desktop pb-section-padding">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Syncing Editorial...</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-10 space-y-10">
            {news.map((item, index) => (
              <article key={item.id} className={`break-inside-avoid bg-surface-container-lowest border border-surface-variant group hover:border-primary transition-all shadow-sm ${index === 0 ? 'md:col-span-2' : ''} overflow-hidden`}>
                {item.imageUrl && (
                  <div className="w-full h-48 bg-surface-container overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-label-caps text-[10px] text-secondary uppercase tracking-widest border border-secondary/30 px-2 py-0.5">{item.category}</span>
                  <span className="font-body-sm text-on-surface-variant text-[10px] uppercase tracking-widest">
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                  </span>
                </div>
                <h2 className="font-headline-sm text-primary mb-4 group-hover:text-secondary transition-colors uppercase leading-tight">{item.title}</h2>
                <p className="font-body-md text-on-surface-variant line-clamp-4 leading-relaxed mb-6">{item.description}</p>
                {item.eventDate && (
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    {item.eventDate}
                  </div>
                )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Circulars & Quick Notices Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-section-padding bg-surface-container-low border-t border-outline-variant/30">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-4">
            <h2 className="font-display-md text-primary mb-6 uppercase leading-none">Official<br/>Circulars</h2>
            <p className="font-body-md text-on-surface-variant mb-8">Download formal notices and guidelines for parents and students.</p>
            <Link href="/notices" className="inline-flex items-center gap-2 text-secondary font-label-caps uppercase tracking-widest hover:text-primary transition-colors border-b border-secondary hover:border-primary pb-1">
              Notice Archive
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="lg:col-span-8 bg-surface-container-lowest border border-surface-variant p-8 shadow-xl">
             <ul className="divide-y divide-surface-variant">
                {notices.map((notice) => (
                  <li key={notice.id} className="py-6 flex justify-between items-center group">
                    <div>
                      <h4 className="font-headline-sm text-primary group-hover:text-secondary transition-colors">{notice.title}</h4>
                      <p className="font-body-sm text-on-surface-variant uppercase text-[10px] tracking-widest mt-1">{notice.category}</p>
                    </div>
                    <Link href="/notices" className="text-on-surface-variant hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">visibility</span>
                    </Link>
                  </li>
                ))}
             </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
