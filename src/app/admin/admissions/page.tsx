"use client";

import { useState, useEffect } from "react";
import { 
  doc, 
  onSnapshot, 
  setDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdmissionsAdmin() {
  const [settings, setSettings] = useState({
    session: "2026-27",
    ageCriteria: "3+ as on 31.03.2026",
    deadline: "27th Dec 2025",
    spotlightText: "Registration for Pre-School (Nursery) is now open. Forms are available for collection and submission at the Primary Building campus.",
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "admissions"), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as any);
      }
      setLoading(false);
    });
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

  if (loading) return <div className="py-20 text-center italic text-on-surface-variant uppercase tracking-widest text-xs">Loading settings...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center border-b border-surface-variant pb-6">
        <div>
          <h3 className="font-headline-sm text-primary uppercase tracking-widest">Admission Controls</h3>
          <p className="font-body-sm text-on-surface-variant">Manage the 2026-27 admission cycle and homepage spotlight.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${settings.isActive ? 'bg-primary' : 'bg-surface-variant'}`}></span>
          <span className="font-label-caps text-xs uppercase tracking-widest">{settings.isActive ? 'Active Session' : 'Paused'}</span>
        </div>
      </div>

      {message && (
        <div className={`p-4 text-sm font-medium flex items-center gap-3 ${message.includes('Failed') ? 'bg-error-container text-error' : 'bg-primary/10 text-primary'}`}>
          <span className="material-symbols-outlined text-[20px]">{message.includes('Failed') ? 'error' : 'check_circle'}</span>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-10 bg-surface-container-lowest p-10 border border-surface-variant shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Academic Session</label>
            <input
              required
              type="text"
              value={settings.session}
              onChange={(e) => setSettings({...settings, session: e.target.value})}
              className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-md"
              placeholder="e.g., 2026-27"
            />
          </div>
          <div className="space-y-2">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Age Criteria</label>
            <input
              required
              type="text"
              value={settings.ageCriteria}
              onChange={(e) => setSettings({...settings, ageCriteria: e.target.value})}
              className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-md"
              placeholder="e.g., 3+ as on 31.03.2026"
            />
          </div>
          <div className="space-y-2">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Application Deadline</label>
            <input
              required
              type="text"
              value={settings.deadline}
              onChange={(e) => setSettings({...settings, deadline: e.target.value})}
              className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-md"
              placeholder="e.g., 27th Dec 2025"
            />
          </div>
          <div className="space-y-2">
            <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Status</label>
            <div className="flex items-center gap-4 h-[60px]">
              <button 
                type="button"
                title={settings.isActive ? "Disable Admissions" : "Enable Admissions"}
                onClick={() => setSettings({...settings, isActive: !settings.isActive})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.isActive ? 'bg-primary' : 'bg-surface-variant'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="font-body-sm text-on-surface">Enable Admissions on Website</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest">Spotlight Notice (Homepage)</label>
          <textarea
            required
            rows={4}
            value={settings.spotlightText}
            onChange={(e) => setSettings({...settings, spotlightText: e.target.value})}
            className="w-full px-4 py-4 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-md resize-none"
            placeholder="Write the summary for the homepage spotlight section..."
          />
        </div>

        <div className="pt-6 border-t border-surface-variant">
          <button 
            type="submit" 
            disabled={saving}
            className="w-full md:w-auto px-12 py-5 bg-primary text-on-primary font-label-caps uppercase tracking-[0.2em] hover:bg-inverse-surface transition-all disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Update Admission Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
