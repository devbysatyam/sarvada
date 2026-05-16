"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function Home() {
  const [admissionSettings, setAdmissionSettings] = useState({
    session: "2026-27",
    ageCriteria: "3+ as on 31.03.2026",
    deadline: "27th Dec 2025",
    spotlightText: "Registration for Pre-School (Nursery) is now open. Forms are available for collection and submission at the Primary Building campus on all working days.",
    isActive: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "admissions"), (snapshot) => {
      if (snapshot.exists()) {
        setAdmissionSettings(snapshot.data() as any);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center bg-surface-container overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-primary/10 mix-blend-multiply z-10"></div>
          <img 
            alt="School Campus" 
            className="w-full h-full object-cover grayscale opacity-40 scale-105 animate-pulse-slow"
            src="/images/hero-campus.jpg"
          />
        </div>
        
        <div className="relative z-20 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <span className="font-label-caps text-secondary uppercase tracking-[0.4em] mb-8 block animate-in slide-in-from-bottom duration-700">Established 1972</span>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary mb-10 tracking-tight leading-[0.9] uppercase animate-in slide-in-from-bottom duration-1000 delay-200">
            Sarvada Modern<br/>Secondary School
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-12 opacity-0 animate-in fade-in fill-mode-forwards delay-500 duration-1000">
            Nurturing minds, building character, and shaping the leaders of tomorrow through 54 years of academic excellence and holistic development.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 opacity-0 animate-in fade-in fill-mode-forwards delay-700 duration-1000">
            <Link href="/admissions" className="px-12 py-5 bg-primary text-on-primary font-label-caps tracking-widest uppercase hover:bg-secondary transition-all w-full sm:w-auto">
              Admissions 2026-27
            </Link>
            <Link href="/about" className="px-12 py-5 border border-primary text-primary font-label-caps tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all w-full sm:w-auto">
              Our Heritage
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Admissions Spotlight */}
      {admissionSettings.isActive && (
        <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-surface-container-low border-b border-outline-variant/30">
          <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-center">
            <div className="lg:col-span-7">
              <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-6 block">Admissions Spotlight</span>
              <h2 className="font-display-lg text-display-lg text-primary mb-8 leading-none">Registration Open: Session {admissionSettings.session}</h2>
              <p className="font-body-lg text-on-surface-variant mb-12 max-w-2xl">
                {admissionSettings.spotlightText}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                <div className="flex flex-col gap-2 p-6 bg-surface-container-lowest border-l-4 border-primary shadow-sm">
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Age Criteria</span>
                  <p className="font-headline-sm text-primary">{admissionSettings.ageCriteria}</p>
                </div>
                <div className="flex flex-col gap-2 p-6 bg-surface-container-lowest border-l-4 border-secondary shadow-sm">
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Deadline</span>
                  <p className="font-headline-sm text-primary">{admissionSettings.deadline}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <a className="inline-flex items-center justify-center px-10 py-5 bg-primary text-white font-label-caps tracking-widest uppercase hover:bg-secondary transition-all" href="/admission-form.pdf" download="SARVADA_Admission_Form.pdf">
                  Download Form
                </a>
                <a className="inline-flex items-center justify-center px-10 py-5 border border-primary text-primary font-label-caps tracking-widest uppercase hover:bg-primary hover:text-white transition-all" href="/slfrc-document.pdf" download="SLFRC_SARVADA_MODERN_SCHOOL.pdf">
                  SLFRC Document
                </a>
                <Link className="inline-flex items-center justify-center px-10 py-5 text-on-surface-variant font-label-caps tracking-widest uppercase hover:text-primary transition-all underline underline-offset-8" href="/admissions">
                  Detailed Process
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 bg-surface-container-lowest p-10 border border-outline-variant/30 shadow-xl mt-12 lg:mt-0">
              <h3 className="font-headline-sm text-primary mb-8 border-b pb-4 uppercase tracking-widest">Point Criteria</h3>
              <ul className="space-y-6 font-body-md text-on-surface-variant">
                {[
                  { label: "Distance", points: 60 },
                  { label: "Sibling", points: 20 },
                  { label: "Alumni", points: 10 },
                  { label: "Single Parent", points: 5 },
                  { label: "Staff Child", points: 5 }
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center border-b border-surface-variant/30 pb-2">
                    <span className="uppercase tracking-widest text-xs font-bold">{item.label}</span>
                    <span className="font-headline-sm text-primary">{item.points} Points</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-4 bg-surface-container-low p-4 text-center">
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">Total Score: 100 Points</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 4: Academic Philosophy */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="md:col-span-6">
              <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-6 block">Our Philosophy</span>
              <h2 className="font-display-md text-primary mb-12 leading-tight uppercase">Nurturing Achievers,<br/>Enlightening Souls</h2>
              <div className="space-y-8 font-body-lg text-on-surface-variant">
                <p>
                  Established in 1972, Sarvada Modern Secondary School has spread its branches like a banyan tree, serving humanity by enlightening students with the light of knowledge.
                </p>
                <p>
                  Our holistic approach ensures students excel across the spectrum, preparing them for prestigious institutions globally while keeping them rooted in our rich cultural heritage.
                </p>
              </div>
            </div>
            <div className="md:col-span-5 md:col-start-8 mt-12 md:mt-0">
              <div className="relative aspect-[4/5] bg-surface-container overflow-hidden">
                <img 
                  alt="Student Excellence" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                  src="/images/academics-robotics.jpg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Section 5: Life at Sarvada */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-surface-container-low">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-4 block">Student Life</span>
            <h2 className="font-display-md text-primary leading-tight uppercase">Life at Sarvada</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aspect-square relative overflow-hidden group">
              <img src="/images/cultural-performance.jpg" alt="Cultural Performance" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6 text-center">
                <span className="font-headline-sm text-on-primary uppercase tracking-widest">Cultural Events</span>
              </div>
            </div>
            <div className="aspect-square relative overflow-hidden group">
              <img src="/images/student-life-friends.jpg" alt="Student Friendship" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6 text-center">
                <span className="font-headline-sm text-on-primary uppercase tracking-widest">Lasting Bonds</span>
              </div>
            </div>
            <div className="aspect-square relative overflow-hidden group">
              <img src="/images/academics-robotics-class.jpg" alt="Interactive Learning" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6 text-center">
                <span className="font-headline-sm text-on-primary uppercase tracking-widest">Interactive Learning</span>
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/gallery" className="inline-block px-12 py-5 border-2 border-primary text-primary font-label-caps tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all">
              View Full Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Section 6: Infrastructure */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative aspect-[4/3] bg-surface-container overflow-hidden">
              <img 
                alt="Modern Infrastructure" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                src="/images/academics-computer-lab.jpg"
              />
            </div>
            <div className="order-1 md:order-2">
              <span className="font-label-caps text-secondary uppercase tracking-[0.2em] mb-6 block">World-Class Facilities</span>
              <h2 className="font-display-md text-primary mb-8 leading-tight uppercase">Modern<br/>Infrastructure</h2>
              <div className="space-y-6 font-body-lg text-on-surface-variant">
                <p>
                  Our campus is designed to provide an optimal learning environment. From high-tech computer labs to expansive play areas, every space is crafted to inspire.
                </p>
                <ul className="grid grid-cols-2 gap-4 mt-8">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-secondary"></div>
                    <span className="font-label-caps tracking-wider uppercase text-sm">Smart Classrooms</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-secondary"></div>
                    <span className="font-label-caps tracking-wider uppercase text-sm">Computer Labs</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-secondary"></div>
                    <span className="font-label-caps tracking-wider uppercase text-sm">Science Labs</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-secondary"></div>
                    <span className="font-label-caps tracking-wider uppercase text-sm">Library</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
