"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdmissionChatbot from "@/components/AdmissionChatbot";
import AntiSpamCaptcha from "@/components/AntiSpamCaptcha";
import { REQUIRED_DOCUMENTS, DOE_AGE_CRITERIA } from "@/lib/admission-knowledge";

export default function AdmissionsPage() {
  const [admissionSettings, setAdmissionSettings] = useState({
    session: "2026-27",
    ageCriteria: "3+ as on 31.03.2026",
    deadline: "27th Dec 2025",
    isActive: true,
  });

  const [activeTab, setActiveTab] = useState<"ai_counselor" | "manual_form">("ai_counselor");
  const [documentCategory, setDocumentCategory] = useState<"nursery_to_1st" | "class_2nd_to_9th">("nursery_to_1st");

  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    phone: "",
    grade: "Nursery",
    message: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [leadRefNumber, setLeadRefNumber] = useState("");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "admissions"), (snapshot) => {
      if (snapshot.exists()) {
        setAdmissionSettings(snapshot.data() as any);
      }
    });
    return () => unsubscribe();
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
          studentName: formData.studentName,
          parentName: formData.parentName,
          phone: formData.phone,
          grade: formData.grade,
          message: formData.message,
          source: "Admissions_Page_Form",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setLeadRefNumber(data.referenceNumber || "");
      setStatus("success");
      setFormData({ studentName: "", parentName: "", phone: "", grade: "Nursery", message: "" });
      setTimeout(() => setStatus("idle"), 10000);
    } catch (error: any) {
      console.error("Submission error:", error);
      setErrorMessage(error.message || "Failed to submit enquiry.");
      setStatus("error");
    }
  };

  return (
    <main className="flex-grow">
      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="relative h-[55vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            alt="Admissions Hero"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2040&auto=format&fit=crop"
          />
          <div className="absolute inset-0 bg-primary/90 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary border border-secondary/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <span>✨</span> Directorate of Education (DOE) Delhi Guidelines
          </div>
          <h1 className="font-display-lg text-display-lg text-on-primary mb-4 uppercase tracking-tight">
            Admissions {admissionSettings.session}
          </h1>
          <p className="font-body-lg text-on-primary/80 max-w-2xl mx-auto">
            CBSE Affiliated · School ID: 1104340 · 54 Years of Academic Excellence in Karawal Nagar & Sadatpur.
          </p>
        </div>
      </section>

      {/* ── Main Content Grid ──────────────────────────────── */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-background">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          <div className="lg:col-span-7 space-y-12">
            {/* Age Criteria Banner as per DOE */}
            <div className="bg-surface-container-low p-8 border border-surface-variant/40 shadow-sm">
              <h2 className="font-headline-md text-primary mb-6 border-l-4 border-secondary pl-5 uppercase tracking-widest flex items-center justify-between">
                <span>DOE Delhi Age Criteria</span>
                <span className="text-xs bg-primary text-on-primary px-3 py-1 font-label-caps normal-case">
                  Cut-off: 31st March
                </span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { grade: "Nursery", req: "3+ Years", sub: "Under 4 yrs" },
                  { grade: "LKG", req: "4+ Years", sub: "Under 5 yrs" },
                  { grade: "UKG", req: "5+ Years", sub: "Under 6 yrs" },
                  { grade: "Class 1st", req: "6+ Years", sub: "Under 7 yrs" },
                ].map((item) => (
                  <div
                    key={item.grade}
                    className="p-4 bg-surface-container-lowest border-t-4 border-primary text-center shadow-xs"
                  >
                    <span className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider block">
                      {item.grade}
                    </span>
                    <p className="font-headline-sm text-primary text-xl font-bold mt-1">{item.req}</p>
                    <span className="text-[10px] text-secondary font-medium">{item.sub}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-lowest border-l-4 border-primary">
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest block mb-1">
                    Active Session
                  </span>
                  <p className="font-headline-sm text-primary">{admissionSettings.session}</p>
                </div>
                <div className="p-4 bg-surface-container-lowest border-l-4 border-secondary">
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest block mb-1">
                    Last Date / Deadline
                  </span>
                  <p className="font-headline-sm text-primary">{admissionSettings.deadline}</p>
                </div>
              </div>
            </div>

            {/* Document Checklist with Tabs */}
            <div className="bg-surface-container-lowest p-8 border border-surface-variant/40 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-surface-variant pb-4">
                <h3 className="font-headline-sm text-primary uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">inventory_2</span>
                  Mandatory Documents Required
                </h3>
                <div className="flex items-center gap-2 bg-surface-container p-1 rounded-sm">
                  <button
                    onClick={() => setDocumentCategory("nursery_to_1st")}
                    className={`px-3 py-1.5 text-xs font-label-caps uppercase tracking-wider transition-all ${
                      documentCategory === "nursery_to_1st"
                        ? "bg-primary text-on-primary font-bold shadow-sm"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    Nursery to 1st
                  </button>
                  <button
                    onClick={() => setDocumentCategory("class_2nd_to_9th")}
                    className={`px-3 py-1.5 text-xs font-label-caps uppercase tracking-wider transition-all ${
                      documentCategory === "class_2nd_to_9th"
                        ? "bg-primary text-on-primary font-bold shadow-sm"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    Class 2nd to 9th
                  </button>
                </div>
              </div>

              {documentCategory === "nursery_to_1st" ? (
                <div className="space-y-3">
                  <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-2">
                    Official Document Checklist for Class Nursery to 1st:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-on-surface-variant">
                    {REQUIRED_DOCUMENTS.nurseryToFirst.map((doc, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <strong className="text-primary">{doc.title}</strong>
                        <span className="text-xs text-on-surface-variant/80 ml-1">— {doc.desc}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm">
                    <strong>Note:</strong> PAN Number is mandatory for LKG, UKG, and Class 1st. Sibling fee slip is
                    only required if a real brother/sister is currently studying in Sarvada Modern School.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-2">
                    Official Document Checklist for New Admissions (Class 2nd to 9th):
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-on-surface-variant">
                    {REQUIRED_DOCUMENTS.class2ndTo9th.map((doc, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <strong className="text-primary">{doc.title}</strong>
                        <span className="text-xs text-on-surface-variant/80 ml-1">— {doc.desc}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-sm">
                    <strong>Note:</strong> Transfer Certificate (T.C.) countersigned by the education department and
                    Student APAAR ID are strictly mandatory for admissions from Class 2nd onward.
                  </div>
                </div>
              )}
            </div>

            {/* 100-Point Pre-School Criteria */}
            <div className="bg-surface-container-lowest p-8 border border-surface-variant/40 shadow-sm">
              <h3 className="font-headline-sm text-primary mb-6 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">military_tech</span>
                Point Criteria for Pre-School (100 Points Scale)
              </h3>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-surface-container border-b border-surface-variant">
                    <th className="py-3 px-5 font-label-caps text-xs uppercase tracking-widest">Criteria</th>
                    <th className="py-3 px-5 font-label-caps text-xs uppercase tracking-widest text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/30 text-primary">
                  {[
                    { c: "Distance (0-3 KM)", p: 60 },
                    { c: "Sibling in School", p: 20 },
                    { c: "Alumni Parent", p: 10 },
                    { c: "Single Parent", p: 5 },
                    { c: "First Child Born", p: 5 },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-5 font-bold uppercase tracking-wider text-xs">{row.c}</td>
                      <td className="py-3.5 px-5 text-right font-headline-sm text-base">{row.p}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary text-on-primary">
                    <td className="py-3.5 px-5 font-bold uppercase tracking-[0.2em]">Total Score</td>
                    <td className="py-3.5 px-5 text-right font-headline-md text-lg">100</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Offline Form Download Options */}
            <div className="p-6 bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-4 border border-surface-variant/40">
              <div>
                <h4 className="font-bold text-primary text-sm uppercase tracking-wide">
                  Official Registration Form & SLFRC
                </h4>
                <p className="text-xs text-on-surface-variant">
                  Download the 2-page hardcopy registration form to fill and submit at the school office.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-label-caps text-xs uppercase tracking-widest hover:bg-secondary transition-all"
                  href="/admission-form.pdf"
                  download
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Form (PDF)
                </a>
                <a
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-primary text-primary font-label-caps text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
                  href="/slfrc-document.pdf"
                  download
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  SLFRC Doc
                </a>
              </div>
            </div>
          </div>

          {/* ── Interactive Right Column: AI Counselor & Form ── */}
          <aside id="inquiry-form" className="lg:col-span-5 sticky top-24 scroll-mt-32">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setActiveTab("ai_counselor")}
                className={`flex-1 py-3 text-xs font-label-caps uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                  activeTab === "ai_counselor"
                    ? "bg-slate-900 text-amber-300 border-slate-900 font-bold shadow-md"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>🎓</span> AI Admission Counselor
              </button>
              <button
                onClick={() => setActiveTab("manual_form")}
                className={`flex-1 py-3 text-xs font-label-caps uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                  activeTab === "manual_form"
                    ? "bg-primary text-on-primary border-primary font-bold shadow-md"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>📝</span> Standard Form
              </button>
            </div>

            {activeTab === "ai_counselor" ? (
              <AdmissionChatbot embedded={true} />
            ) : (
              <div className="bg-surface-container p-8 border border-surface-variant relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-2 h-full bg-secondary"></div>
                <h3 className="font-headline-sm text-primary mb-1 uppercase tracking-widest">Inquiry Form</h3>
                <p className="font-body-sm text-on-surface-variant mb-6 text-xs italic">
                  Submit details for session {admissionSettings.session}
                </p>

                {status === "success" ? (
                  <div className="py-8 text-center animate-in zoom-in duration-300">
                    <span className="material-symbols-outlined text-4xl text-emerald-600 mb-2">check_circle</span>
                    <p className="font-body-md text-primary font-bold">Inquiry Registered!</p>
                    {leadRefNumber && (
                      <p className="text-xs font-mono font-bold bg-white p-2 border border-slate-200 rounded my-2 text-slate-900">
                        Reference: {leadRefNumber}
                      </p>
                    )}
                    <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                      Our admissions team will contact you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                        Student Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter student's full name"
                        value={formData.studentName}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                        Parent Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter parent's full name"
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                        Phone *
                      </label>
                      <input
                        required
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                        Applying for Grade *
                      </label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm text-sm"
                      >
                        <option>Nursery (Age 3+)</option>
                        <option>LKG (Age 4+)</option>
                        <option>UKG (Age 5+)</option>
                        <option>Class 1st (Age 6+)</option>
                        <option>Class 2nd</option>
                        <option>Class 3rd to 5th</option>
                        <option>Class 6th to 8th</option>
                        <option>Class 9th</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                        Message / Query (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Any additional information"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm text-sm resize-none"
                      />
                    </div>

                    {/* Anti-Spam Verification */}
                    <AntiSpamCaptcha onVerify={setIsCaptchaVerified} />

                    <button
                      type="submit"
                      disabled={status === "submitting" || !isCaptchaVerified}
                      className="w-full bg-primary text-on-primary py-3.5 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50 text-xs font-bold cursor-pointer"
                    >
                      {status === "submitting" ? "Syncing to CRM..." : "Submit Inquiry"}
                    </button>
                    {status === "error" && (
                      <p className="text-red-600 text-xs text-center font-bold">
                        {errorMessage || "Error submitting. Please call +91 99994 39422."}
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
