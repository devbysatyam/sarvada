"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdmissionsPage() {
  const [admissionSettings, setAdmissionSettings] = useState({
    session: "2026-27",
    ageCriteria: "3+ as on 31.03.2026",
    deadline: "27th Dec 2025",
    isActive: true
  });

  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    phone: "",
    grade: "Nursery",
    message: ""
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

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
    setStatus("submitting");

    try {
      const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL || "";

      await fetch(WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          formType: "Admissions"
        }),
      });

      setStatus("success");
      setFormData({ studentName: "", parentName: "", phone: "", grade: "Nursery", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      console.error("Submission error:", error);
      setStatus("error");
    }
  };

  return (
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img alt="Admissions Hero" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2040&auto=format&fit=crop" />
          <div className="absolute inset-0 bg-primary/90 mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 text-center px-margin-mobile md:px-margin-desktop max-w-4xl mx-auto">
          <h1 className="font-display-lg text-display-lg text-on-primary mb-6 uppercase tracking-tight">Admissions {admissionSettings.session}</h1>
          <p className="font-body-lg text-on-primary/80 max-w-2xl mx-auto">Registration is open for all Indian citizens. Secure your child's future with 54 years of academic excellence.</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-section-padding px-margin-mobile md:px-margin-desktop bg-background">
        <div className="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">

          <div className="lg:col-span-8 space-y-16">
            {/* Admission Details */}
            <div className="bg-surface-container-low p-10 border border-surface-variant/30">
              <h2 className="font-headline-md text-primary mb-10 border-l-4 border-secondary pl-6 uppercase tracking-widest">Admission Notice</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="p-6 bg-surface-container-lowest border-l-4 border-primary">
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest block mb-1">Age Eligibility</span>
                  <p className="font-headline-sm text-primary">{admissionSettings.ageCriteria}</p>
                </div>
                <div className="p-6 bg-surface-container-lowest border-l-4 border-secondary">
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest block mb-1">Last Date</span>
                  <p className="font-headline-sm text-primary">{admissionSettings.deadline}</p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-on-surface-variant font-body-md leading-relaxed">
                <p>Registration open from **15th December** for different classes. Following are necessary for admission:</p>
                <ul className="list-decimal pl-5 space-y-3 mt-4">
                  <li>Birth Certificate (for play to class Ist) issued by concerned authority.</li>
                  <li>S.L.C. issued by school last attended (only recognized or Govt. school) for admission to class II onward.</li>
                  <li>Copy of Ration Card for Residential proof.</li>
                  <li>Photocopy of Election Card.</li>
                  <li>Three Passport size photographs (recent).</li>
                </ul>
              </div>
            </div>

            {/* Points Criteria Table */}
            <div className="bg-surface-container-lowest p-10 border border-surface-variant/30 shadow-sm">
              <h3 className="font-headline-sm text-primary mb-8 uppercase tracking-widest">Point Criteria for Pre-School</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-surface-variant">
                    <th className="py-4 px-6 font-label-caps text-xs uppercase tracking-widest">Criteria</th>
                    <th className="py-4 px-6 font-label-caps text-xs uppercase tracking-widest text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/30 font-body-md text-primary">
                  {[
                    { c: "Distance (0-3 KM)", p: 60 },
                    { c: "Sibling", p: 20 },
                    { c: "Alumni", p: 10 },
                    { c: "Single Parent", p: 5 },
                    { c: "First Child Born", p: 5 }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-6 uppercase tracking-wider text-xs font-bold">{row.c}</td>
                      <td className="py-4 px-6 text-right font-headline-sm">{row.p}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary text-on-primary">
                    <td className="py-4 px-6 font-bold uppercase tracking-[0.2em]">Total Score</td>
                    <td className="py-4 px-6 text-right font-headline-md">100</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Inquiry Form */}
          <aside id="inquiry-form" className="lg:col-span-4 sticky top-24 scroll-mt-32">
            <div className="bg-surface-container p-10 border border-surface-variant relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-2 h-full bg-secondary"></div>
              <h3 className="font-headline-sm text-primary mb-2 uppercase tracking-widest">Inquiry Form</h3>
              <p className="font-body-sm text-on-surface-variant mb-8 italic">Submit your query for {admissionSettings.session}</p>

              {status === "success" ? (
                <div className="py-10 text-center animate-in zoom-in duration-300">
                  <span className="material-symbols-outlined text-4xl text-primary mb-4">check_circle</span>
                  <p className="font-body-md text-primary font-bold">Inquiry Received!</p>
                  <p className="font-body-sm text-on-surface-variant">Our team will contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Student Name</label>
                    <input
                      required
                      type="text"
                      title="Student Name"
                      placeholder="Enter student's full name"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Parent Name</label>
                    <input
                      required
                      type="text"
                      title="Parent Name"
                      placeholder="Enter parent's full name"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Phone</label>
                    <input
                      required
                      type="tel"
                      title="Phone Number"
                      placeholder="Enter contact number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Applying for Grade</label>
                    <select
                      value={formData.grade}
                      title="Applying for Grade"
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm"
                    >
                      <option>Nursery</option>
                      <option>K.G.</option>
                      <option>Class I</option>
                      <option>Class II-VIII</option>
                      <option>Secondary (IX-X)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Message (Optional)</label>
                    <textarea
                      rows={3}
                      title="Message"
                      placeholder="Any additional information"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-surface-variant focus:border-primary outline-none font-body-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full bg-primary text-on-primary py-4 font-label-caps uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50"
                  >
                    {status === "submitting" ? "Sending..." : "Submit Inquiry"}
                  </button>
                  {status === "error" && <p className="text-error text-[10px] text-center font-bold">Error sending. Please call us directly.</p>}
                </form>
              )}

              <div className="mt-10 pt-6 border-t border-surface-variant/30 space-y-4">
                <a className="flex items-center gap-3 text-primary font-bold text-sm hover:text-secondary transition-colors" href="/admission-form.pdf" download>
                  <span className="material-symbols-outlined">download</span>
                  Download Full Form
                </a>
                <a className="flex items-center gap-3 text-primary font-bold text-sm hover:text-secondary transition-colors" href="/slfrc-document.pdf" download>
                  <span className="material-symbols-outlined">description</span>
                  SLFRC Document
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
