"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface GalleryItem {
  id: string;
  url: string;
  caption: string;
  category: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const localGalleryItems: GalleryItem[] = [
    { id: '1', url: '/images/cultural-performance.jpg', caption: 'Annual Day Performance', category: 'Cultural' },
    { id: '2', url: '/images/cultural-fancy-dress.jpg', caption: 'Fancy Dress Competition', category: 'Cultural' },
    { id: '3', url: '/images/student-life-birthday.jpg', caption: 'Student Birthday Celebration', category: 'Celebrations' },
    { id: '4', url: '/images/student-life-friends.jpg', caption: 'Student Bonds', category: 'Academic' },
    { id: '5', url: '/images/infrastructure-building.jpg', caption: 'Main Building', category: 'Infrastructure' },
    { id: '6', url: '/images/infrastructure-staircase.jpg', caption: 'Colorful Hallways', category: 'Infrastructure' },
    { id: '7', url: '/images/academics-computer-lab.jpg', caption: 'Computer Lab', category: 'Academic' },
    { id: '8', url: '/images/infrastructure-reception.jpg', caption: 'School Reception', category: 'Infrastructure' },
    { id: '9', url: '/images/academics-robotics-class.jpg', caption: 'Robotics Workshop', category: 'Academic' },
    { id: '10', url: '/images/academics-robotics-close.jpg', caption: 'Hands-on Learning', category: 'Academic' },
    { id: '11', url: '/images/academics-lab.jpg', caption: 'Science Laboratory', category: 'Academic' },
    { id: '12', url: '/images/cultural-celebration.jpg', caption: 'Festival Celebrations', category: 'Celebrations' },
    { id: '13', url: '/images/hero-campus.jpg', caption: 'School Campus', category: 'Infrastructure' }
  ];

  useEffect(() => {
    let q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    
    if (activeCategory !== "All") {
      q = query(
        collection(db, "gallery"), 
        where("category", "==", activeCategory),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firebaseData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GalleryItem[];
      
      // Merge local authentic images with any firebase data
      let filteredLocal = localGalleryItems;
      if (activeCategory !== "All") {
        filteredLocal = localGalleryItems.filter(item => item.category === activeCategory);
      }
      
      setItems([...firebaseData, ...filteredLocal]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeCategory]);

  const categories = ["All", "Infrastructure", "Academic", "Cultural", "Sports", "Celebrations"];

  return (
    <main className="flex-grow">
      {/* Hero Header */}
      <section className="px-margin-mobile md:px-margin-desktop py-section-padding max-w-container-max mx-auto text-center md:text-left">
        <div className="max-w-3xl">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-gutter uppercase tracking-tighter">Visual Showcase</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            A window into the vibrant life at Sarvada Modern School. Explore our world-class infrastructure, academic achievements, and moments of celebration.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-16">
        <div className="flex border-b border-surface-variant gap-8 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              title={`Filter by ${cat}`}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-4 pt-4 whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? "border-b-primary text-primary" 
                  : "border-b-transparent text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="font-label-caps text-xs font-bold uppercase tracking-widest">{cat}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Masonry Grid */}
      <section className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto mb-section-padding">
        {loading ? (
          <div className="py-40 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Aesthetic Loading...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-40 text-center border border-dashed border-surface-variant">
            <p className="font-body-lg text-on-surface-variant italic">No images currently published in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden bg-surface-container group cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500">
                <img 
                  alt={item.caption} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" 
                  src={item.url}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                  <span className="text-secondary font-label-caps text-[10px] uppercase tracking-widest mb-2 border border-secondary w-fit px-2 py-0.5">{item.category}</span>
                  <h3 className="text-on-primary font-headline-sm leading-snug">{item.caption}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Institutional Heritage Section */}
      <section className="bg-surface-container-low py-section-padding px-margin-mobile md:px-margin-desktop border-t border-outline-variant/30">
        <div className="max-w-container-max mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-gutter">
            <div className="max-w-2xl">
              <h2 className="font-headline-md text-headline-md text-primary mb-4 uppercase">Institutional Heritage</h2>
              <p className="font-body-lg text-on-surface-variant">Archival moments that define our 54-year legacy since 1972.</p>
            </div>
            <Link className="text-secondary font-label-caps text-xs uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-colors border-b border-secondary hover:border-primary pb-1" href="/about">
              Our Full History
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
             {/* Static Heritage placeholders preserved as they are historical */}
            {[
              { year: "1972", title: "The Founding Ceremony", img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2098&auto=format&fit=crop" },
              { year: "1980s", title: "Original Campus Layout", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop" },
              { year: "1995", title: "Silver Jubilee Celebration", img: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop" }
            ].map((archive, index) => (
              <div key={index} className="flex flex-col group">
                <div className="aspect-[4/3] bg-surface-variant overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 border border-surface-variant">
                  <img alt={archive.title} className="w-full h-full object-cover" src={archive.img} />
                </div>
                <h4 className="font-headline-sm text-lg text-primary mt-6 group-hover:text-secondary transition-colors">{archive.title}</h4>
                <p className="font-body-sm text-on-surface-variant uppercase tracking-widest text-[10px] mt-1">{archive.year}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
