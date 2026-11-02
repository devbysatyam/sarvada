"use client";

import { useState, useEffect, useRef } from "react";
import AdmissionChatbot from "./AdmissionChatbot";

const PHONE = "+919999439422";
const PHONE_DISPLAY = "+91 99994 39422";
const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL || "";

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const fab = document.getElementById("floating-contact-fab");
      if (fab && !fab.contains(target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Trap scroll on modal open (mobile)
  useEffect(() => {
    if (showForm || showChatbot) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm, showChatbot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, formType: "FloatingContact" }),
      });
      setStatus("success");
      setForm({ name: "", phone: "", subject: "General Inquiry", message: "" });
      setTimeout(() => {
        setStatus("idle");
        setShowForm(false);
      }, 3000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {/* ── AI Admission Counselor Modal ───────────────────── */}
      {showChatbot && (
        <div
          className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 md:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowChatbot(false);
          }}
        >
          <div className="w-full h-full sm:h-auto sm:max-w-[480px] flex items-end sm:items-center justify-center animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <AdmissionChatbot onClose={() => setShowChatbot(false)} />
          </div>
        </div>
      )}

      {/* ── Quick Enquiry Form Modal ───────────────────────── */}
      {showForm && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div className="w-full max-w-md bg-white shadow-2xl rounded-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal header */}
            <div className="bg-primary px-6 py-5 flex items-center justify-between">
              <div>
                <p className="font-label-caps text-[9px] text-on-primary/60 uppercase tracking-[0.25em] mb-0.5">
                  Sarvada Modern School
                </p>
                <h2 className="font-headline-sm text-on-primary text-lg uppercase tracking-widest leading-none">
                  Quick Enquiry
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-on-primary text-[22px]">close</span>
              </button>
            </div>

            {/* Form body */}
            <div className="p-6">
              {status === "success" ? (
                <div className="py-10 text-center animate-in zoom-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-primary text-[32px]">check_circle</span>
                  </div>
                  <p className="font-headline-sm text-primary font-bold">Message Received!</p>
                  <p className="font-body-sm text-on-surface-variant text-sm mt-1">
                    Our team will reach out to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                      <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">
                        Your Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Full name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-colors"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">
                        Phone Number *
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-colors"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">
                        Subject
                      </label>
                      <select
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm"
                      >
                        {["General Inquiry", "Admissions", "Fee Structure", "Academic Query", "Other"].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-widest">
                        Message
                      </label>
                      <textarea
                        rows={3}
                        placeholder="How can we help you?"
                        value={form.message}
                        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-colors"
                      />
                    </div>
                  </div>

                  {status === "error" && (
                    <p className="text-error text-xs text-center font-medium">
                      Failed to send. Please call us directly.
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <a
                      href={`tel:${PHONE}`}
                      className="flex items-center justify-center gap-1.5 px-4 py-3 border border-primary text-primary font-label-caps text-[9px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-[15px]">call</span>
                      Call Us
                    </a>
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-label-caps text-[10px] uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-60"
                    >
                      {status === "submitting" ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">send</span>
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Action Button & Speed-Dial ─────────────── */}
      <div
        id="floating-contact-fab"
        className="fixed bottom-6 right-5 z-[190] flex flex-col items-end gap-3"
        style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
      >
        {/* Speed-dial options (appear when isOpen) */}
        <div
          className={`flex flex-col items-end gap-3 transition-all duration-300 ${
            isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {/* AI Admission Counselor option (Top highlighted) */}
          <button
            onClick={() => {
              setShowChatbot(true);
              setIsOpen(false);
            }}
            className="flex items-center gap-3 group"
            aria-label="Open AI Admission Counselor"
          >
            <span className="bg-slate-900 text-amber-300 font-label-caps text-[10px] uppercase tracking-wider px-3.5 py-2 shadow-xl border border-amber-500/40 group-hover:border-amber-400 group-hover:scale-105 transition-all rounded-md flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              AI Admission Counselor
            </span>
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-xl hover:scale-110 transition-transform border-2 border-white">
              <span className="text-2xl">🎓</span>
            </div>
          </button>

          {/* Quick enquiry form option */}
          <button
            onClick={() => {
              setShowForm(true);
              setIsOpen(false);
            }}
            className="flex items-center gap-3 group"
            aria-label="Open enquiry form"
          >
            <span className="bg-white text-on-surface font-label-caps text-[9px] uppercase tracking-widest px-3 py-1.5 shadow-lg border border-surface-variant group-hover:border-primary group-hover:text-primary transition-all rounded-sm whitespace-nowrap">
              Quick Form
            </span>
            <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg hover:bg-secondary hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[22px]">edit_note</span>
            </div>
          </button>

          {/* Call option */}
          <a
            href={`tel:${PHONE}`}
            className="flex items-center gap-3 group"
            aria-label="Call us"
            onClick={() => setIsOpen(false)}
          >
            <span className="bg-white text-on-surface font-label-caps text-[9px] uppercase tracking-widest px-3 py-1.5 shadow-lg border border-surface-variant group-hover:border-primary group-hover:text-primary transition-all rounded-sm whitespace-nowrap">
              {PHONE_DISPLAY}
            </span>
            <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg hover:bg-green-700 transition-colors">
              <span className="material-symbols-outlined text-[22px] symbol-fill">call</span>
            </div>
          </a>
        </div>

        {/* Main FAB toggle button */}
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? "Close options" : "Need help with admissions?"}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? "bg-surface-container-lowest border-2 border-primary text-primary rotate-45"
              : "bg-primary text-on-primary hover:bg-secondary hover:text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[26px] transition-transform duration-300">
            {isOpen ? "close" : "smart_toy"}
          </span>
        </button>
      </div>
    </>
  );
}
