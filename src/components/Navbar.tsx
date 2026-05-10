"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  return (
    <>
      {/* Top Alert Bar */}
      {isAlertVisible && (
        <div className="bg-primary text-on-primary w-full py-3 px-margin-mobile md:px-margin-desktop flex justify-between items-center z-[60] fixed top-0 left-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[16px]">campaign</span>
            <span className="font-label-caps text-[12px] uppercase tracking-widest truncate">URGENT: NURSERY ADMISSIONS OPEN FOR 2026-27. APPLY NOW.</span>
          </div>
          <button 
            onClick={() => setIsAlertVisible(false)}
            aria-label="Dismiss alert" 
            className="text-on-primary/70 hover:text-on-primary transition-colors p-1 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Navigation Shell */}
      <nav 
        aria-label="Main Navigation" 
        style={{ top: isAlertVisible ? '44px' : '0' }}
        className="bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 fixed left-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-24 transition-all duration-300"
      >
        <Link className="flex items-center gap-4 group" href="/">
          <div className="w-14 h-14 relative overflow-hidden rounded-full border-2 border-primary/10 group-hover:border-primary/30 transition-all flex items-center justify-center bg-white">
            <img 
              src="/logo.png" 
              alt="Sarvada Modern School Logo" 
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-3xl text-primary">school</span>';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display-lg-mobile text-[28px] leading-none text-primary tracking-tight">Sarvada.</span>
            <span className="font-label-caps text-[9px] uppercase tracking-[0.2em] text-on-surface-variant mt-1">Modern Sec. School</span>
          </div>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-10">
          <Link className="font-label-caps text-[12px] uppercase tracking-[0.15em] text-primary hover:opacity-70 transition-opacity" href="/about">About</Link>
          <Link className="font-label-caps text-[12px] uppercase tracking-[0.15em] text-primary hover:opacity-70 transition-opacity" href="/academics">Academics</Link>
          <Link className="font-label-caps text-[12px] uppercase tracking-[0.15em] text-primary hover:opacity-70 transition-opacity" href="/admissions">Admissions</Link>
          <Link className="font-label-caps text-[12px] uppercase tracking-[0.15em] text-primary hover:opacity-70 transition-opacity" href="/news">Updates</Link>
          <Link className="font-label-caps text-[12px] uppercase tracking-[0.15em] text-primary hover:opacity-70 transition-opacity" href="/compliance">Compliance</Link>
          <Link className="font-label-caps text-[12px] uppercase tracking-[0.15em] text-primary hover:opacity-70 transition-opacity" href="/contact">Contact</Link>
        </div>
        
        {/* Trailing Action & Mobile Toggle */}
        <div className="flex items-center gap-6">
          <Link className="hidden md:inline-flex items-center justify-center px-8 py-3 bg-[#1a3a2a] text-white font-label-caps text-[12px] uppercase tracking-widest hover:bg-[#11261b] transition-colors duration-300" href="/admissions">
            Admissions 26-27
          </Link>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"} 
            className="md:hidden text-primary p-2 z-[70] relative"
          >
            <span className="material-symbols-outlined text-[28px]">
              {isMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 bg-primary z-[65] flex flex-col items-center justify-center gap-8 transition-transform duration-500 md:hidden ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}>
          {[
            { n: "About", h: "/about" },
            { n: "Academics", h: "/academics" },
            { n: "Admissions", h: "/admissions" },
            { n: "Updates", h: "/news" },
            { n: "Compliance", h: "/compliance" },
            { n: "Contact", h: "/contact" }
          ].map((item) => (
            <Link 
              key={item.n}
              onClick={() => setIsMenuOpen(false)}
              className="font-display-lg text-on-primary text-4xl uppercase tracking-tighter" 
              href={item.h}
            >
              {item.n}
            </Link>
          ))}
          <Link 
            onClick={() => setIsMenuOpen(false)}
            className="mt-8 px-10 py-4 bg-secondary text-primary font-label-caps text-sm uppercase tracking-widest font-bold" 
            href="/admissions"
          >
            Admissions 26-27
          </Link>
        </div>
      </nav>
    </>
  );
}
