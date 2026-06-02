"use client";

import { useState, useEffect } from "react";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdmissionsAdmin() {
  const [settings, setSettings] = useState({
    session: "2026-27",
    ageCriteria: "3+ as on 31.03.2026",
    deadline: "27th Dec 2025",
    spotlightText:
      "Registration for Pre-School (Nursery) is now open. Forms are available for collection and submission at the Primary Building campus.",
    isActive: true,
    classesOffered: "Nursery, LKG, UKG, Grade 1 to Grade 12",
    feeStructure: "",
    contactNumber: "",
    documentsRequired:
      "Birth Certificate, Aadhar Card (Student & Parents), Transfer Certificate (if applicable), 4 Passport-size Photographs, Previous Year Report Card",
    admissionProcess:
      "1. Collect admission form from the school office\n2. Submit filled form with required documents\n3. Interaction with the student and parents\n4. Confirmation and fee payment",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "settings", "admissions"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSettings((prev) => ({ ...prev, ...data }));
        }
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await setDoc(doc(db, "settings", "admissions"), {
        ...settings,
        updatedAt: serverTimestamp(),
      });
      setMessage("Admissions settings updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error updating admissions:", error);
      setMessage("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="py-20 text-center flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
          Loading settings...
        </p>
      </div>
    );

  return (
    <div className="max-w-5xl space-y-8">
      <div className="flex justify-between items-center border-b border-surface-variant pb-6">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary text-4xl">school</span>
          <div>
            <h3 className="font-headline-sm text-primary uppercase tracking-widest">
              Admission Controls
            </h3>
            <p className="font-body-sm text-on-surface-variant">
              Manage the {settings.session} admission cycle, requirements, and homepage spotlight.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`w-3 h-3 rounded-full ${
              settings.isActive ? "bg-primary" : "bg-surface-variant"
            }`}
          ></span>
          <span className="font-label-caps text-xs uppercase tracking-widest">
            {settings.isActive ? "Active Session" : "Paused"}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 text-sm font-medium flex items-center gap-3 ${
            message.includes("Failed")
              ? "bg-error-container text-error"
              : "bg-primary/10 text-primary"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {message.includes("Failed") ? "error" : "check_circle"}
          </span>
          {message}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-10 bg-surface-container-lowest p-10 border border-surface-variant shadow-sm"
      >
        {/* Section: Core Settings */}
        <div>
          <h4 className="font-label-caps text-xs text-secondary uppercase tracking-widest mb-6 border-b border-surface-variant pb-3">
            Core Session Settings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Academic Session
              </label>
              <input
                required
                type="text"
                value={settings.session}
                onChange={(e) =>
                  setSettings({ ...settings, session: e.target.value })
                }
                className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                placeholder="e.g., 2026-27"
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Age Criteria
              </label>
              <input
                required
                type="text"
                value={settings.ageCriteria}
                onChange={(e) =>
                  setSettings({ ...settings, ageCriteria: e.target.value })
                }
                className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                placeholder="e.g., 3+ as on 31.03.2026"
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Application Deadline
              </label>
              <input
                required
                type="text"
                value={settings.deadline}
                onChange={(e) =>
                  setSettings({ ...settings, deadline: e.target.value })
                }
                className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                placeholder="e.g., 27th Dec 2025"
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Inquiry Contact Number
              </label>
              <input
                type="text"
                value={settings.contactNumber}
                onChange={(e) =>
                  setSettings({ ...settings, contactNumber: e.target.value })
                }
                className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                placeholder="e.g., +91 98765 43210"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Classes Offered
              </label>
              <input
                type="text"
                value={settings.classesOffered}
                onChange={(e) =>
                  setSettings({ ...settings, classesOffered: e.target.value })
                }
                className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm transition-all"
                placeholder="e.g., Nursery, LKG, UKG, Grade 1 to Grade 12"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Status
              </label>
              <div className="flex items-center gap-4 h-[40px]">
                <button
                  type="button"
                  title={
                    settings.isActive
                      ? "Disable Admissions"
                      : "Enable Admissions"
                  }
                  onClick={() =>
                    setSettings({ ...settings, isActive: !settings.isActive })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.isActive ? "bg-primary" : "bg-surface-variant"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="font-body-sm text-on-surface">
                  Enable Admissions on Website
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Requirements */}
        <div>
          <h4 className="font-label-caps text-xs text-secondary uppercase tracking-widest mb-6 border-b border-surface-variant pb-3">
            Requirements & Process
          </h4>
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Documents Required
              </label>
              <textarea
                rows={3}
                value={settings.documentsRequired}
                onChange={(e) =>
                  setSettings({ ...settings, documentsRequired: e.target.value })
                }
                className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all"
                placeholder="List the documents required for admission..."
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Admission Process Steps
              </label>
              <textarea
                rows={5}
                value={settings.admissionProcess}
                onChange={(e) =>
                  setSettings({ ...settings, admissionProcess: e.target.value })
                }
                className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all"
                placeholder="Step-by-step admission process..."
              />
            </div>
            <div className="space-y-2">
              <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                Fee Structure Note
              </label>
              <textarea
                rows={3}
                value={settings.feeStructure}
                onChange={(e) =>
                  setSettings({ ...settings, feeStructure: e.target.value })
                }
                className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all"
                placeholder="Brief fee information or note for parents..."
              />
            </div>
          </div>
        </div>

        {/* Section: Spotlight */}
        <div>
          <h4 className="font-label-caps text-xs text-secondary uppercase tracking-widest mb-6 border-b border-surface-variant pb-3">
            Homepage Spotlight
          </h4>
          <div className="space-y-2">
            <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
              Spotlight Notice (Homepage Banner)
            </label>
            <textarea
              required
              rows={4}
              value={settings.spotlightText}
              onChange={(e) =>
                setSettings({ ...settings, spotlightText: e.target.value })
              }
              className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm resize-none transition-all"
              placeholder="Write the summary for the homepage spotlight section..."
            />
          </div>
        </div>

        <div className="pt-6 border-t border-surface-variant">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-12 py-5 bg-primary text-on-primary font-label-caps uppercase tracking-[0.2em] hover:bg-secondary transition-all disabled:opacity-50 shadow-md"
          >
            {saving ? "Saving Changes..." : "Update Admission Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
