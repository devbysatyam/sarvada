"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(true);
  const [admissionSettings, setAdmissionSettings] = useState({
    session: "2026-27",
    deadline: "27th Dec 2025",
    spotlightText: "Nursery Admissions Open for 2026-27. Apply Now.",
    isActive: true,
  });

  // Subscribe to Firestore admission settings — live updates
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "admissions"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAdmissionSettings({
          session:       data.session       || "2026-27",
          deadline:      data.deadline      || "",
          spotlightText: data.spotlightText || "Admissions Open. Apply Now.",
          isActive:      data.isActive      !== false,
        });
      }
    });
    return () => unsub();
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  // Short alert text — trim to fit single line on mobile
  const alertText = admissionSettings.spotlightText.length > 80
    ? admissionSettings.spotlightText.substring(0, 77) + "..."
    : admissionSettings.spotlightText;

  return (
    <>
      {/* ── Dynamic Top Alert Bar ───────────────────────────── */}
      {isAlertVisible && admissionSettings.isActive && (
        <div className="bg-[#0f172a] text-white w-full py-2.5 px-4 md:px-margin-desktop flex justify-between items-center z-[70] fixed top-0 left-0 border-b border-white/10">
          {/* Entire left side is a clickable link to /admissions#inquiry-form */}
          <Link
            href="/admissions#inquiry-form"
            className="flex items-center gap-3 overflow-hidden group flex-1 min-w-0"
            aria-label={`Admissions open: ${alertText}. Click to apply.`}
          >
            <span className="material-symbols-outlined text-[18px] text-secondary shrink-0">campaign</span>
            <span className="font-label-caps text-[10px] md:text-[11px] uppercase tracking-[0.1em] truncate font-medium group-hover:text-secondary transition-colors">
              {alertText}
            </span>
            {admissionSettings.deadline && (
              <span className="hidden md:inline-flex items-center gap-1 font-label-caps text-[10px] text-secondary/80 tracking-widest uppercase shrink-0">
                <span className="material-symbols-outlined text-[13px]">event</span>
                Deadline: {admissionSettings.deadline}
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1 font-label-caps text-[10px] text-secondary border border-secondary/40 px-2 py-0.5 shrink-0 group-hover:bg-secondary group-hover:text-primary transition-all">
              Apply →
            </span>
          </Link>

          <button
            onClick={() => setIsAlertVisible(false)}
            aria-label="Dismiss alert"
            className="ml-3 hover:bg-white/10 rounded-full p-1.5 transition-colors shrink-0 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* ── Navigation Shell ────────────────────────────────── */}
      <nav
        aria-label="Main Navigation"
        style={{ top: isAlertVisible && admissionSettings.isActive ? "42px" : "0" }}
        className="bg-white/95 backdrop-blur-xl border-b border-black/5 fixed left-0 w-full z-[60] flex justify-between items-center px-4 md:px-margin-desktop h-20 md:h-24 transition-all duration-300"
      >
        <Link className="flex items-center gap-3 md:gap-4 group" href="/">
          <div className="w-10 h-10 md:w-14 md:h-14 relative overflow-hidden rounded-full border border-primary/10 group-hover:border-primary/30 transition-all flex items-center justify-center bg-white shadow-sm">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement!.innerHTML =
                  '<span class="material-symbols-outlined text-2xl text-primary">school</span>';
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
            { n: "About",      h: "/about" },
            { n: "Academics",  h: "/academics" },
            { n: "Admissions", h: "/admissions" },
            { n: "Updates",    h: "/news" },
            { n: "Compliance", h: "/compliance" },
            { n: "Contact",    h: "/contact" },
          ].map((link) => (
            <Link
              key={link.n}
              className="font-label-caps text-[11px] uppercase tracking-[0.15em] text-[#334155] hover:text-primary transition-colors font-semibold"
              href={link.h}
            >
              {link.n}
            </Link>
          ))}
        </div>

        {/* Trailing Action & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <Link
            className="hidden md:inline-flex items-center justify-center px-6 py-2.5 bg-[#1a3a2a] text-white font-label-caps text-[11px] uppercase tracking-widest hover:shadow-lg transition-all duration-300 rounded-sm"
            href="/admissions#inquiry-form"
          >
            Enrol {admissionSettings.session}
          </Link>
          {/* Only show hamburger when drawer is closed */}
          {!isMenuOpen && (
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden text-[#1e293b] p-2 z-[80] relative hover:bg-slate-100 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[30px]">menu</span>
            </button>
          )}
        </div>

        {/* Mobile Menu Overlay */}
        <div
          onClick={() => setIsMenuOpen(false)}
          className={`fixed inset-0 bg-black/40 backdrop-blur-md z-[70] transition-opacity duration-500 md:hidden ${
            isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        <div
          className={`fixed top-0 right-0 h-[100dvh] w-[85%] max-w-[380px] bg-[#0f172a] z-[75] flex flex-col overflow-hidden transition-all duration-500 md:hidden ${
            isMenuOpen ? "translate-x-0 shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.5)]" : "translate-x-full"
          }`}
        >
          {/* ── Section 1: Header ─────────────────── flex-none */}
          <div className="flex-none flex items-center justify-between px-6 pt-6 pb-3 border-b border-white/10">
            <div>
              <p className="font-label-caps text-[9px] text-white/40 uppercase tracking-[0.25em]">Sarvada Modern School</p>
              <span className="font-display-lg text-white text-base tracking-tight leading-none">Navigation</span>
            </div>
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-white text-[20px]">close</span>
            </button>
          </div>

          {/* ── Section 2: Links ──────────────── flex-1 min-h-0 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3 flex flex-col gap-1">
            {[
              { n: "About Us",        h: "/about",      s: "Our 54-year legacy" },
              { n: "Academics",       h: "/academics",  s: "Curriculum & Excellence" },
              { n: "Admissions",      h: "/admissions", s: `Join the ${admissionSettings.session} Session` },
              { n: "News & Updates",  h: "/news",       s: "Latest from Sarvada" },
              { n: "Compliance",      h: "/compliance", s: "Official Disclosures" },
              { n: "Parent Feedback", h: "/feedback",   s: "Share your experience" },
              { n: "Contact",         h: "/contact",    s: "Get in touch with us" },
            ].map((item, idx) => (
              <Link
                key={item.n}
                onClick={() => setIsMenuOpen(false)}
                style={{ transitionDelay: `${isMenuOpen ? 100 + idx * 40 : 0}ms` }}
                className={`group flex items-center gap-3 py-3 border-b border-white/5 transition-all duration-400 ${
                  isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                }`}
                href={item.h}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-display-lg text-white text-lg uppercase tracking-tight group-hover:text-secondary transition-colors leading-none block">
                    {item.n}
                  </span>
                  <span className="font-label-caps text-[8px] text-white/35 uppercase tracking-widest mt-0.5 block">
                    {item.s}
                  </span>
                </div>
                <span className="material-symbols-outlined text-white/20 group-hover:text-secondary text-[16px] transition-colors flex-shrink-0">
                  arrow_forward
                </span>
              </Link>
            ))}
          </div>

          {/* ── Section 3: CTA ────────────────────── flex-none */}
          <div
            className={`flex-none px-6 pt-3 border-t border-white/10 transition-all duration-500 delay-300 ${
              isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}
          >
            <Link
              onClick={() => setIsMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-secondary text-primary font-label-caps text-[10px] uppercase tracking-[0.2em] font-bold rounded-sm"
              href="/admissions#inquiry-form"
            >
              <span className="material-symbols-outlined text-[15px]">edit_note</span>
              Apply · Session {admissionSettings.session}
            </Link>
            <p className="text-center font-label-caps text-[8px] text-white/25 uppercase tracking-widest mt-2 mb-1">
              Secure your child's future today
            </p>
          </div>
        </div>

      </nav>
    </>
  );
}
