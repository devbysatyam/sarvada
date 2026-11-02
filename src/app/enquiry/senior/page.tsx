"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AntiSpamCaptcha from "@/components/AntiSpamCaptcha";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL || "";
const PHONE = "+919999439422";
const PHONE_DISPLAY = "+91 99994 39422";

type Status = "idle" | "submitting" | "success" | "error";

const FLOATERS = [
  { emoji: "🎓", top: "6%",  left: "4%",  delay: "0s",   dur: "6s"  },
  { emoji: "📐", top: "15%", left: "89%", delay: "1s",   dur: "7s"  },
  { emoji: "🔬", top: "35%", left: "93%", delay: "0.5s", dur: "5s"  },
  { emoji: "💻", top: "55%", left: "2%",  delay: "2s",   dur: "8s"  },
  { emoji: "🏅", top: "70%", left: "91%", delay: "1.5s", dur: "6s"  },
  { emoji: "📊", top: "85%", left: "5%",  delay: "0.8s", dur: "7s"  },
];

export default function SeniorEnquiryPage() {
  const [session, setSession] = useState("2026-27");
  const [deadline, setDeadline] = useState("27th Dec 2025");
  const [status, setStatus] = useState<Status>("idle");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    parentName: "",
    studentName: "",
    currentClass: "Class 5",
    applyingFor: "Class 6",
    phone: "",
    stream: "General",
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
          studentName: form.studentName,
          parentName: form.parentName,
          phone: form.phone,
          grade: form.applyingFor,
          message: `Current class: ${form.currentClass}, Stream: ${form.stream}. ${form.message || ""}`,
          source: "Senior_Landing_Page",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setRefNumber(data.referenceNumber || "");
      setStatus("success");
      setForm({ parentName: "", studentName: "", currentClass: "Class 5", applyingFor: "Class 6", phone: "", stream: "General", message: "" });
    } catch (err: any) {
      console.error("Senior enquiry error:", err);
      setErrorMessage(err.message || "Failed to submit enquiry.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-15px) rotate(4deg); }
          66%  { transform: translateY(-6px) rotate(-3deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .floater  { animation: float var(--dur, 6s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
        .shimmer-text {
          background: linear-gradient(90deg, #059669, #34d399, #059669);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────── */}
      <section
        className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-6 py-24"
        style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ecfdf5 100%)" }}
      >
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className="absolute text-4xl select-none pointer-events-none floater opacity-50"
            style={{ top: f.top, left: f.left, "--delay": f.delay, "--dur": f.dur } as any}
          >
            {f.emoji}
          </span>
        ))}

        <div className="relative z-10 mb-8">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl shadow-2xl rotate-3"
            style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
            🎓
          </div>
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-[0.3em] mb-4" style={{ color: "#065f46" }}>
            Sarvada Modern School · Admissions {session}
          </p>
          <h1 className="font-bold leading-tight mb-6"
            style={{ fontSize: "clamp(1.9rem, 6vw, 3.6rem)", color: "#1a1c1c", lineHeight: 1.1 }}>
            Unlock Your Child's{" "}
            <span className="shimmer-text">Full Potential</span>{" "}
            in Classes 6–10
          </h1>
          <p className="text-lg mb-4 max-w-xl mx-auto" style={{ color: "#374151" }}>
            Strong academics, CBSE excellence, sports & co-curriculars — everything
            your growing achiever needs to thrive.
          </p>
          <p className="text-sm font-bold mb-10" style={{ color: "#dc2626" }}>
            ⚠️ Deadline: {deadline} · Seats are limited — don't wait!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="px-10 py-4 rounded-xl text-white font-bold text-base shadow-xl hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}
            >
              ✍️ Enquire Now
            </button>
            <a href={`tel:${PHONE}`}
              className="px-10 py-4 rounded-xl font-bold text-base border-2 hover:scale-105 transition-transform"
              style={{ borderColor: "#059669", color: "#047857", background: "#f0fdf4" }}>
              📞 Call Admissions
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
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#1a1c1c" }}>
            Why Top Families Choose Sarvada 🌿
          </h2>
          <p style={{ color: "#6b7280" }}>54 years · CBSE Affiliated · North East Delhi's premier institution</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { emoji: "📈", title: "Proven Board Results", desc: "Consistently excellent CBSE results with students securing top ranks and prestigious college admissions." },
            { emoji: "💪", title: "All-Round Development", desc: "Beyond academics — leadership, sports, debate, cultural activities that build tomorrow's leaders." },
            { emoji: "👩‍💼", title: "Expert Faculty", desc: "Qualified, passionate teachers with subject mastery and a commitment to individual student growth." },
          ].map(item => (
            <div key={item.title}
              className="text-center p-8 rounded-2xl border-2 hover:shadow-xl transition-all hover:-translate-y-1 cursor-default"
              style={{ borderColor: "#a7f3d0", background: "#f0fdf4" }}>
              <div className="text-5xl mb-4">{item.emoji}</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: "#1a1c1c" }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ENQUIRY FORM ──────────────────────────────────── */}
      <section
        id="form"
        ref={formRef}
        className="py-16 px-6 scroll-mt-24"
        style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" }}
      >
        <div className="max-w-xl mx-auto">
          <div className="rounded-2xl shadow-2xl overflow-hidden bg-white">
            <div className="px-8 py-7 text-center"
              style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
              <div className="text-4xl mb-2">🎯</div>
              <h2 className="text-2xl font-bold text-white">Admission Enquiry</h2>
              <p className="text-emerald-200 text-sm mt-1">Classes 6–10 · Session {session}</p>
            </div>

            <div className="px-8 py-8">
              {status === "success" ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: "#059669" }}>Enquiry Sent!</h3>
                  {refNumber && (
                    <p className="inline-block text-xs font-mono font-bold px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg mb-3">
                      Reference ID: {refNumber}
                    </p>
                  )}
                  <p style={{ color: "#6b7280" }} className="mb-6">
                    Our admissions team will reach out within 24 hours. Your details have been registered!
                  </p>
                  <button onClick={() => { setStatus("idle"); setIsCaptchaVerified(false); }}
                    className="px-8 py-3 rounded-xl text-white font-bold cursor-pointer"
                    style={{ background: "#059669" }}>
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
                      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#065f46" }}>
                        {f.label}
                      </label>
                      <input
                        required type={f.type} placeholder={f.ph}
                        value={(form as any)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
                        style={{ borderColor: "#a7f3d0", background: "#f0fdf4" }}
                        onFocus={e => (e.target.style.borderColor = "#059669")}
                        onBlur={e  => (e.target.style.borderColor = "#a7f3d0")}
                      />
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Currently In",   key: "currentClass", opts: ["Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9"] },
                      { label: "Applying For *",  key: "applyingFor",  opts: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"] },
                    ].map(sel => (
                      <div key={sel.key}>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#065f46" }}>
                          {sel.label}
                        </label>
                        <select
                          value={(form as any)[sel.key]}
                          onChange={e => setForm(prev => ({ ...prev, [sel.key]: e.target.value }))}
                          className="w-full px-3 py-3 rounded-xl border-2 text-sm outline-none"
                          style={{ borderColor: "#a7f3d0", background: "#f0fdf4" }}
                        >
                          {sel.opts.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#065f46" }}>
                      Message / Query (Optional)
                    </label>
                    <textarea rows={3} placeholder="Any specific questions about the school, curriculum, fees..."
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none resize-none"
                      style={{ borderColor: "#a7f3d0", background: "#f0fdf4" }}
                    />
                  </div>

                  {/* Anti-Spam Verification */}
                  <AntiSpamCaptcha onVerify={setIsCaptchaVerified} />

                  {status === "error" && (
                    <p className="text-red-600 text-sm text-center font-medium">
                      {errorMessage || `Error sending. Please call ${PHONE_DISPLAY}`}
                    </p>
                  )}

                  <button type="submit" disabled={status === "submitting" || !isCaptchaVerified}
                    className="w-full py-4 rounded-xl text-white font-bold text-base shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-60 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #059669, #047857)" }}>
                    {status === "submitting" ? "⏳ Syncing to CRM..." : "📨 Submit Enquiry"}
                  </button>

                  <p className="text-center text-xs" style={{ color: "#9ca3af" }}>
                    Or call directly —
                    <a href={`tel:${PHONE}`} className="font-bold ml-1" style={{ color: "#059669" }}>
                      {PHONE_DISPLAY}
                    </a>
                  </p>
                </form>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { emoji: "📅", label: "Est. 1972" },
              { emoji: "🏛️", label: "CBSE Affiliated" },
              { emoji: "🎯", label: "Top Results" },
            ].map(b => (
              <div key={b.label} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl mb-1">{b.emoji}</div>
                <p className="text-xs font-bold" style={{ color: "#6b7280" }}>{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 px-6 text-center" style={{ background: "#1a1c1c", color: "white" }}>
        <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "#6ee7b7" }}>📍 Visit Us</p>
        <p className="mb-4 text-white/70 text-sm">A/18 Gali No. 1, Sukkar Bazar, Sadatpur, Karawal Nagar, New Delhi — 110090</p>
        <a href={`tel:${PHONE}`}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
          style={{ background: "#059669", color: "white" }}>
          📞 {PHONE_DISPLAY}
        </a>
      </section>
    </div>
  );
}
