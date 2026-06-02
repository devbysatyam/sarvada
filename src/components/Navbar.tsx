"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  return (
    <>
      {/* Top Alert Bar */}
      {isAlertVisible && (
        <div className="bg-[#0f172a] text-white w-full py-2.5 px-4 md:px-margin-desktop flex justify-between items-center z-[70] fixed top-0 left-0 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">campaign</span>
            <span className="font-label-caps text-[10px] md:text-[11px] uppercase tracking-[0.1em] truncate font-medium">
              Nursery Admissions Open for 2026-27. Apply Now.
            </span>
          </div>
          <button 
            onClick={() => setIsAlertVisible(false)}
            aria-label="Dismiss alert" 
            className="ml-4 hover:bg-white/10 rounded-full p-1.5 transition-colors shrink-0 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Navigation Shell */}
      <nav 
        aria-label="Main Navigation" 
        style={{ top: isAlertVisible ? '42px' : '0' }}
        className="bg-white/95 backdrop-blur-xl border-b border-black/5 fixed left-0 w-full z-[60] flex justify-between items-center px-4 md:px-margin-desktop h-20 md:h-24 transition-all duration-300"
      >
        <Link className="flex items-center gap-3 md:gap-4 group" href="/">
          <div className="w-10 h-10 md:w-14 md:h-14 relative overflow-hidden rounded-full border border-primary/10 group-hover:border-primary/30 transition-all flex items-center justify-center bg-white shadow-sm">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-2xl text-primary">school</span>';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display-lg text-[20px] md:text-[28px] leading-none text-[#1e293b] tracking-tight font-bold">Sarvada.</span>
            <span className="font-label-caps text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-slate-500 mt-0.5">Modern Sec. School</span>
          </div>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          {[
            { n: "About", h: "/about" },
            { n: "Academics", h: "/academics" },
            { n: "Admissions", h: "/admissions" },
            { n: "Timetable", h: "/timetable" },
            { n: "Updates", h: "/news" },
            { n: "Compliance", h: "/compliance" },
            { n: "Contact", h: "/contact" }
          ].map(link => (
            <Link key={link.n} className="font-label-caps text-[11px] uppercase tracking-[0.15em] text-[#334155] hover:text-primary transition-colors font-semibold" href={link.h}>{link.n}</Link>
          ))}
        </div>
        
        {/* Trailing Action & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <Link className="hidden md:inline-flex items-center justify-center px-6 py-2.5 bg-[#1a3a2a] text-white font-label-caps text-[11px] uppercase tracking-widest hover:shadow-lg transition-all duration-300 rounded-sm" href="/admissions">
            Enrol 26-27
          </Link>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"} 
            className="md:hidden text-[#1e293b] p-2 z-[80] relative hover:bg-slate-100 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[30px]">
              {isMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
          onClick={() => setIsMenuOpen(false)}
          className={`fixed inset-0 bg-black/40 backdrop-blur-md z-[70] transition-opacity duration-500 md:hidden ${
            isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        <div className={`fixed top-0 right-0 h-screen w-[85%] max-w-[400px] bg-[#0f172a] z-[75] flex flex-col p-10 pt-32 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) md:hidden ${
          isMenuOpen ? "translate-x-0 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.5)]" : "translate-x-full"
        }`}>
          <div className="flex flex-col gap-6">
            {[
              { n: "About Us", h: "/about", s: "Our 54-year legacy" },
              { n: "Academics", h: "/academics", s: "Curriculum & Excellence" },
              { n: "Admissions", h: "/admissions", s: "Join the 2026-27 Session" },
              { n: "Timetable", h: "/timetable", s: "Class-wise weekly schedule" },
              { n: "News & Updates", h: "/news", s: "Latest from Sarvada" },
              { n: "Compliance", h: "/compliance", s: "Official Disclosures" },
              { n: "Parent Feedback", h: "/feedback", s: "Share your experience" },
              { n: "Contact", h: "/contact", s: "Get in touch with us" }
            ].map((item, idx) => (
              <Link 
                key={item.n}
                onClick={() => setIsMenuOpen(false)}
                style={{ transitionDelay: `${isMenuOpen ? 150 + (idx * 50) : 0}ms` }}
                className={`group flex flex-col transition-all duration-500 ${isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}
                href={item.h}
              >
                <span className="font-display-lg text-white text-3xl md:text-4xl uppercase tracking-tighter group-hover:text-secondary transition-colors">
                  {item.n}
                </span>
                <span className="font-label-caps text-[10px] text-white/40 uppercase tracking-widest mt-1">
                  {item.s}
                </span>
              </Link>
            ))}
          </div>
          
          <div className={`mt-auto pt-10 border-t border-white/10 transition-all duration-700 delay-500 ${isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <Link 
              onClick={() => setIsMenuOpen(false)}
              className="w-full inline-flex items-center justify-center px-10 py-5 bg-secondary text-primary font-label-caps text-xs uppercase tracking-[0.2em] font-bold rounded-sm shadow-xl" 
              href="/admissions"
            >
              Apply for 26-27 Session
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
