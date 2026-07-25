"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL || "";
const PHONE = "+919999439422";
const PHONE_DISPLAY = "+91 99994 39422";

type Status = "idle" | "submitting" | "success" | "error";

const FLOATERS = [
  { emoji: "✏️", top: "6%",  left: "4%",  delay: "0s",   dur: "6s"  },
  { emoji: "📚", top: "12%", left: "89%", delay: "1s",   dur: "7s"  },
  { emoji: "🚀", top: "30%", left: "93%", delay: "0.5s", dur: "5s"  },
  { emoji: "🔭", top: "55%", left: "2%",  delay: "2s",   dur: "8s"  },
  { emoji: "⚽", top: "72%", left: "91%", delay: "1.5s", dur: "6s"  },
  { emoji: "🎨", top: "85%", left: "5%",  delay: "0.8s", dur: "7s"  },
  { emoji: "🏆", top: "20%", left: "2%",  delay: "2.5s", dur: "5.5s"},
  { emoji: "💡", top: "90%", left: "88%", delay: "1.2s", dur: "6.5s"},
];

export default function PrimaryEnquiryPage() {
  const [session, setSession] = useState("2026-27");
  const [deadline, setDeadline] = useState("27th Dec 2025");
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({
    parentName: "",
    studentName: "",
    currentClass: "Pre-Class 1",
    applyingFor: "Class 1",
    phone: "",
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
    setStatus("submitting");
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, formType: "PrimaryEnquiry", session }),
      });
      setStatus("success");
      setForm({ parentName: "", studentName: "", currentClass: "Pre-Class 1", applyingFor: "Class 1", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-18px) rotate(5deg); }
          66%  { transform: translateY(-8px) rotate(-3deg); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .floater     { animation: float var(--dur, 6s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
        .pulse-ring  { animation: pulse-ring 2s ease-out infinite; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section
        className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 45%, #fef3c7 100%)" }}
      >
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className="absolute text-4xl select-none pointer-events-none floater opacity-60"
            style={{ top: f.top, left: f.left, "--delay": f.delay, "--dur": f.dur } as any}
          >
            {f.emoji}
          </span>
        ))}

        {/* Icon badge */}
        <div className="relative z-10 mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl shadow-2xl"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              📚
            </div>
            <div className="absolute inset-0 rounded-full pulse-ring"
              style={{ border: "3px solid #3b82f6" }} />
          </div>
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4" style={{ color: "#1e40af" }}>
            Sarvada Modern School · Admissions {session}
          </p>
          <h1 className="font-bold leading-tight mb-6"
            style={{ fontSize: "clamp(2rem, 6.5vw, 3.8rem)", color: "#1e3a5f", lineHeight: 1.1 }}>
            Build Champions —{" "}
            <span style={{ color: "#f97316" }}>Classes 1 to 5</span>{" "}
            🏆
          </h1>
          <p className="text-lg mb-4 max-w-xl mx-auto" style={{ color: "#475569" }}>
            Top-quality primary education with sports, arts, science and values.
            Shaping confident, curious learners every day!
          </p>
          <p className="text-sm font-bold mb-10" style={{ color: "#dc2626" }}>
            🔔 Deadline: {deadline} · Register before seats fill!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="px-10 py-4 rounded-full text-white font-bold text-base shadow-xl hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
            >
              ✍️ Fill Enquiry Form
            </button>
            <a
              href={`tel:${PHONE}`}
              className="px-10 py-4 rounded-full font-bold text-base border-2 hover:scale-105 transition-transform"
              style={{ borderColor: "#f97316", color: "#ea580c", background: "#fff7ed" }}
            >
              📞 Call Us Now
            </a>
          </div>
        </div>

        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
        </svg>
      </section>

      {/* ── BENEFITS ──────────────────────────────────────── */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#1e3a5f" }}>
            A School That Builds Winners 🥇
          </h2>
          <p style={{ color: "#64748b" }}>Trusted by thousands of North East Delhi families since 1972</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { emoji: "🔬", title: "Smart Classrooms & Labs", desc: "Computer labs, science labs, and tech-enabled classrooms to spark curiosity and innovation." },
            { emoji: "🎭", title: "Sports & Co-curriculars", desc: "Comprehensive programs in sports, music, debate, art that develop well-rounded personalities." },
            { emoji: "📊", title: "Excellent Academic Record", desc: "Consistent top results in board exams with personalised attention and strong mentoring." },
          ].map(item => (
            <div key={item.title} className="text-center p-8 rounded-2xl border-2 hover:shadow-lg transition-all hover:-translate-y-1"
              style={{ borderColor: "#bfdbfe", background: "#eff6ff" }}>
              <div className="text-5xl mb-4">{item.emoji}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "#1e3a5f" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ENQUIRY FORM ──────────────────────────────────── */}
      <section
        id="form"
        ref={formRef}
        className="py-16 px-6 scroll-mt-24"
        style={{ background: "linear-gradient(135deg, #dbeafe 0%, #fef9c3 100%)" }}
      >
        <div className="max-w-xl mx-auto">
          <div className="rounded-3xl shadow-2xl overflow-hidden bg-white">
            {/* Header */}
            <div className="px-8 py-7 text-center"
              style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
              <div className="text-4xl mb-2">🚀</div>
              <h2 className="text-2xl font-bold text-white">Admission Enquiry</h2>
              <p className="text-blue-200 text-sm mt-1">Classes 1–5 · Session {session}</p>
            </div>

            <div className="px-8 py-8">
              {status === "success" ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4">🎊</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: "#1d4ed8" }}>
                    Enquiry Received!
                  </h3>
                  <p style={{ color: "#64748b" }} className="mb-6">
                    Our team will contact you within 24 hours!
                  </p>
                  <button onClick={() => setStatus("idle")}
                    className="px-8 py-3 rounded-full text-white font-bold"
                    style={{ background: "#3b82f6" }}>
                    Submit Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {[
                    { label: "Parent / Guardian Name *", key: "parentName",  type: "text", ph: "Your full name" },
                    { label: "Student Name *",           key: "studentName", type: "text", ph: "Student's full name" },
                    { label: "Contact Phone *",          key: "phone",       type: "tel",  ph: "+91 XXXXX XXXXX" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#1e40af" }}>
                        {f.label}
                      </label>
                      <input
                        required type={f.type} placeholder={f.ph}
                        value={(form as any)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
                        style={{ borderColor: "#bfdbfe", background: "#eff6ff" }}
                        onFocus={e => (e.target.style.borderColor = "#3b82f6")}
                        onBlur={e  => (e.target.style.borderColor = "#bfdbfe")}
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Current Class", key: "currentClass", opts: ["Pre-Class 1", "Class 1", "Class 2", "Class 3", "Class 4", "Not in school yet"] },
                      { label: "Applying For *", key: "applyingFor",  opts: ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5"] },
                    ].map(sel => (
                      <div key={sel.key}>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#1e40af" }}>
                          {sel.label}
                        </label>
                        <select
                          value={(form as any)[sel.key]}
                          onChange={e => setForm(prev => ({ ...prev, [sel.key]: e.target.value }))}
                          className="w-full px-3 py-3 rounded-xl border-2 text-sm outline-none"
                          style={{ borderColor: "#bfdbfe", background: "#eff6ff" }}
                        >
                          {sel.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#1e40af" }}>
                      Any Questions? (Optional)
                    </label>
                    <textarea rows={3} placeholder="Write your queries..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none resize-none"
                      style={{ borderColor: "#bfdbfe", background: "#eff6ff" }}
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-red-600 text-sm text-center">
                      Error sending. Please call {PHONE_DISPLAY}
                    </p>
                  )}

                  <button type="submit" disabled={status === "submitting"}
                    className="w-full py-4 rounded-full text-white font-bold text-base shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}>
                    {status === "submitting" ? "⏳ Submitting..." : "🚀 Submit Enquiry"}
                  </button>

                  <p className="text-center text-xs" style={{ color: "#94a3b8" }}>
                    Or call —
                    <a href={`tel:${PHONE}`} className="font-bold ml-1" style={{ color: "#3b82f6" }}>
                      {PHONE_DISPLAY}
                    </a>
                  </p>
                </form>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { emoji: "🏫", label: "Est. 1972" },
              { emoji: "📋", label: "CBSE Board" },
              { emoji: "🌟", label: "Top Results" },
            ].map(b => (
              <div key={b.label} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl mb-1">{b.emoji}</div>
                <p className="text-xs font-bold" style={{ color: "#64748b" }}>{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER STRIP ──────────────────────────────────── */}
      <section className="py-10 px-6 text-center" style={{ background: "#1e3a5f", color: "white" }}>
        <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "#93c5fd" }}>📍 Find Us</p>
        <p className="mb-4 text-white/70 text-sm">A/18 Gali No. 1, Sukkar Bazar, Sadatpur, Karawal Nagar, New Delhi — 110090</p>
        <a href={`tel:${PHONE}`}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform"
          style={{ background: "#3b82f6", color: "white" }}>
          📞 {PHONE_DISPLAY}
        </a>
      </section>
    </div>
  );
}
