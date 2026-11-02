"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AntiSpamCaptcha from "@/components/AntiSpamCaptcha";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL || "";
const PHONE = "+919999439422";
const PHONE_DISPLAY = "+91 99994 39422";
const BASE_URL = "https://sarvadamodernschool.com";

type Status = "idle" | "submitting" | "success" | "error";

// Floating decorative elements
const FLOATERS = [
  { emoji: "⭐", size: "text-5xl", top: "8%",  left: "5%",  delay: "0s",    dur: "6s"  },
  { emoji: "🌟", size: "text-3xl", top: "15%", left: "88%", delay: "1s",    dur: "7s"  },
  { emoji: "🎈", size: "text-4xl", top: "25%", left: "92%", delay: "0.5s",  dur: "5s"  },
  { emoji: "☁️", size: "text-5xl", top: "40%", left: "2%",  delay: "2s",    dur: "8s"  },
  { emoji: "🌈", size: "text-3xl", top: "60%", left: "90%", delay: "1.5s",  dur: "6s"  },
  { emoji: "✨", size: "text-4xl", top: "70%", left: "4%",  delay: "0.8s",  dur: "7s"  },
  { emoji: "🎀", size: "text-3xl", top: "80%", left: "85%", delay: "2.5s",  dur: "5.5s"},
  { emoji: "🌸", size: "text-4xl", top: "90%", left: "8%",  delay: "1.2s",  dur: "6.5s"},
];

export default function NurseryEnquiryPage() {
  const [session, setSession] = useState("2026-27");
  const [deadline, setDeadline] = useState("27th Dec 2025");
  const [status, setStatus] = useState<Status>("idle");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    parentName: "",
    childName: "",
    childDOB: "",
    phone: "",
    classApplying: "Playgroup (Age 2-3)",
    message: "",
  });
  const formRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "admissions"), snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.session)  setSession(d.session);
        if (d.deadline) setDeadline(d.deadline);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isCaptchaVerified) {
      setErrorMessage("Please complete the human verification question below.");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/enquiry/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: form.childName,
          parentName: form.parentName,
          childDOB: form.childDOB,
          phone: form.phone,
          grade: form.classApplying,
          message: form.message,
          source: "Nursery_Landing_Page",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setRefNumber(data.referenceNumber || "");
      setStatus("success");
      setForm({ parentName: "", childName: "", childDOB: "", phone: "", classApplying: "Playgroup (Age 2-3)", message: "" });
    } catch (err: any) {
      console.error("Nursery form error:", err);
      setErrorMessage(err.message || "Something went wrong.");
      setStatus("error");
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-18px) rotate(5deg); }
          66% { transform: translateY(-8px) rotate(-3deg); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
        }
        .floater { animation: float var(--dur, 6s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
        .wiggle  { animation: wiggle 2s ease-in-out infinite; }
        .confetti-piece { animation: confetti-fall 2s ease-out forwards; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section
        className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 40%, #d1fae5 100%)" }}
      >
        {/* Floating decorators */}
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className={`absolute ${f.size} select-none pointer-events-none floater opacity-70`}
            style={{ top: f.top, left: f.left, "--delay": f.delay, "--dur": f.dur } as any}
          >
            {f.emoji}
          </span>
        ))}

        {/* Big star badge */}
        <div className="relative z-10 mb-6 wiggle">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-xl"
            style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
            🌟
          </div>
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4"
            style={{ color: "#92400e" }}>
            Sarvada Modern School · Admissions {session}
          </p>
          <h1 className="font-bold leading-tight mb-6"
            style={{ fontSize: "clamp(2.2rem, 7vw, 4rem)", color: "#1c1917", lineHeight: 1.1 }}>
            Give Your Little One the{" "}
            <span style={{ color: "#d97706" }}>Best Start</span>{" "}
            in Life 🌈
          </h1>
          <p className="text-lg mb-3 max-w-xl mx-auto" style={{ color: "#57534e" }}>
            Nurturing curious minds at Playgroup, Nursery & KG level.
            Where learning feels like playing! 🎨📚
          </p>
          <p className="text-sm font-semibold mb-10" style={{ color: "#dc2626" }}>
            ⏰ Last date: {deadline} · Limited seats available!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={scrollToForm}
              className="px-10 py-4 rounded-full text-white font-bold text-base shadow-xl hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
            >
              ✍️ Fill Enquiry Form
            </button>
            <a
              href={`tel:${PHONE}`}
              className="px-10 py-4 rounded-full font-bold text-base border-2 hover:scale-105 transition-transform"
              style={{ borderColor: "#10b981", color: "#059669", background: "#f0fdf4" }}
            >
              📞 Call Us Now
            </a>
          </div>
        </div>

        {/* Wave bottom */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
        </svg>
      </section>

      {/* ── WHY SARVADA ───────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#1c1917" }}>
            Why Parents Love Sarvada 💛
          </h2>
          <p style={{ color: "#78716c" }}>Delhi's trusted school since 1972 — 54 years of nurturing young minds</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { emoji: "🏫", title: "Safe & Joyful Campus", desc: "Bright, secure, child-friendly environment with dedicated play areas and activity rooms." },
            { emoji: "👩‍🏫", title: "Caring Teachers", desc: "Experienced, trained educators who treat every child with warmth and individual attention." },
            { emoji: "🎨", title: "Play-Based Learning", desc: "Activity-based curriculum that makes learning fun through art, music, stories & more." },
          ].map(item => (
            <div key={item.title} className="text-center p-8 rounded-2xl border-2 hover:shadow-lg transition-shadow"
              style={{ borderColor: "#fde68a", background: "#fffbeb" }}>
              <div className="text-5xl mb-4">{item.emoji}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "#1c1917" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#78716c" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ENQUIRY FORM ──────────────────────────────────── */}
      <section
        id="form"
        ref={formRef}
        className="py-16 px-6 scroll-mt-24"
        style={{ background: "linear-gradient(135deg, #fef3c7 0%, #ecfdf5 100%)" }}
      >
        <div className="max-w-xl mx-auto">
          {/* Form card */}
          <div className="rounded-3xl shadow-2xl overflow-hidden" style={{ background: "white" }}>
            {/* Card header */}
            <div className="px-8 py-7 text-center"
              style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <div className="text-4xl mb-2">🎒</div>
              <h2 className="text-2xl font-bold text-white">Admission Enquiry</h2>
              <p className="text-amber-100 text-sm mt-1">Playgroup · Nursery · KG · Class 1 · Session {session}</p>
            </div>

            {/* Form body */}
            <div className="px-8 py-8">
              {status === "success" ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: "#059669" }}>
                    Enquiry Submitted!
                  </h3>
                  {refNumber && (
                    <p className="inline-block text-xs font-mono font-bold px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg mb-3">
                      Reference ID: {refNumber}
                    </p>
                  )}
                  <p style={{ color: "#57534e" }} className="mb-6">
                    Our admissions team will call you within 24 hours. Your details have been registered!
                  </p>
                  <button
                    onClick={() => { setStatus("idle"); setIsCaptchaVerified(false); }}
                    className="px-8 py-3 rounded-full text-white font-bold cursor-pointer"
                    style={{ background: "#f59e0b" }}
                  >
                    Submit Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {[
                    { label: "Parent / Guardian Name *", key: "parentName", type: "text", placeholder: "Your full name" },
                    { label: "Child's Name *",           key: "childName",  type: "text", placeholder: "Child's full name" },
                    { label: "Child's Date of Birth *",  key: "childDOB",   type: "date", placeholder: "" },
                    { label: "Phone Number *",           key: "phone",      type: "tel",  placeholder: "+91 XXXXX XXXXX" },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#92400e" }}>
                        {field.label}
                      </label>
                      <input
                        required
                        type={field.type}
                        placeholder={field.placeholder}
                        value={(form as any)[field.key]}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
                        style={{ borderColor: "#fde68a", background: "#fffbeb" }}
                        onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                        onBlur={e  => (e.target.style.borderColor = "#fde68a")}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#92400e" }}>
                      Applying For *
                    </label>
                    <select
                      value={form.classApplying}
                      onChange={e => setForm(f => ({ ...f, classApplying: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none"
                      style={{ borderColor: "#fde68a", background: "#fffbeb" }}
                    >
                      {["Playgroup (Age 2-3)", "Nursery (Age 3-4)", "KG (Age 4-5)", "Class 1 (Age 5-6)"].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#92400e" }}>
                      Any Questions? (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Write any questions or special requirements..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none resize-none"
                      style={{ borderColor: "#fde68a", background: "#fffbeb" }}
                    />
                  </div>

                  {/* Anti-Spam Verification */}
                  <AntiSpamCaptcha onVerify={setIsCaptchaVerified} />

                  {status === "error" && (
                    <p className="text-red-600 text-sm text-center font-medium">
                      {errorMessage || `Something went wrong. Please call us directly at ${PHONE_DISPLAY}`}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "submitting" || !isCaptchaVerified}
                    className="w-full py-4 rounded-full text-white font-bold text-base shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:scale-100 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                  >
                    {status === "submitting" ? "⏳ Syncing to CRM..." : "🚀 Submit Enquiry"}
                  </button>

                  <p className="text-center text-xs" style={{ color: "#a8a29e" }}>
                    Or call us directly —
                    <a href={`tel:${PHONE}`} className="font-bold ml-1" style={{ color: "#d97706" }}>
                      {PHONE_DISPLAY}
                    </a>
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { emoji: "🏅", label: "Since 1972" },
              { emoji: "🎓", label: "CBSE Affiliated" },
              { emoji: "👨‍👩‍👧", label: "1500+ Students" },
            ].map(b => (
              <div key={b.label} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl mb-1">{b.emoji}</div>
                <p className="text-xs font-bold" style={{ color: "#57534e" }}>{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT STRIP ─────────────────────────────────── */}
      <section className="py-10 px-6 text-center" style={{ background: "#1c1917", color: "white" }}>
        <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "#fbbf24" }}>
          📍 Visit Us
        </p>
        <p className="mb-4 text-white/80 text-sm">
          A/18 Gali No. 1, Sukkar Bazar, Sadatpur, Karawal Nagar, New Delhi — 110090
        </p>
        <a
          href={`tel:${PHONE}`}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform"
          style={{ background: "#f59e0b", color: "#1c1917" }}
        >
          📞 {PHONE_DISPLAY}
        </a>
        <p className="mt-4 text-white/40 text-xs">
          Mon–Sat, 8:00 AM – 2:30 PM
        </p>
      </section>
    </div>
  );
}
