"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <>
      {/* Top Alert Bar */}
      <div className="bg-primary text-on-primary w-full py-3 px-margin-mobile md:px-margin-desktop flex justify-between items-center z-[60] relative">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[16px]">campaign</span>
          <span className="font-label-caps text-[12px] uppercase tracking-widest">URGENT: NURSERY ADMISSIONS OPEN FOR 2026-27 ACADEMIC YEAR. APPLY NOW.</span>
        </div>
        <button aria-label="Dismiss alert" className="text-on-primary/70 hover:text-on-primary transition-colors p-1">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Navigation Shell */}
      <nav aria-label="Main Navigation" className="bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 fixed top-[40px] left-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-24 transition-all duration-300">
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
          <button aria-label="Open menu" className="md:hidden text-primary p-2">
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}
