"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRBAC, PermissionGuard, WriteGuard } from "@/context/RBACContext";

interface EmailConfig {
  recipients: string;
  weeklyEnabled: boolean;
  monthlyEnabled: boolean;
  examEnabled: boolean;
  admissionEnabled: boolean;
  lastWeeklySent?: any;
  lastMonthlySent?: any;
  lastExamSent?: any;
  lastAdmissionSent?: any;
}

const DEFAULT_CONFIG: EmailConfig = {
  recipients: "admin@sarvadaschool.com",
  weeklyEnabled: true,
  monthlyEnabled: true,
  examEnabled: true,
  admissionEnabled: true,
};

interface SendStatus {
  type: string;
  status: "sending" | "success" | "error";
  message?: string;
}

export default function EmailSettingsPage() {
  return (
    <PermissionGuard section="email_settings">
      <EmailSettingsContent />
    </PermissionGuard>
  );
}

function EmailSettingsContent() {
  const { canWrite } = useRBAC();
  const canEditSettings = canWrite("email_settings");

  const [config, setConfig] = useState<EmailConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "emailConfig"));
        if (snap.exists()) {
          setConfig({ ...DEFAULT_CONFIG, ...snap.data() as EmailConfig });
        }
      } catch (e) {
        console.error("Failed to load email config:", e);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "emailConfig"), {
        ...config,
        updatedAt: serverTimestamp(),
      });
      showToast("Email settings saved successfully!");
    } catch (e) {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleManualTrigger = async (digestType: "weekly" | "monthly" | "exam" | "admission") => {
    setSendStatus({ type: digestType, status: "sending" });
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "manual_digest",
          digestType,
          recipients: config.recipients,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSendStatus({ type: digestType, status: "success", message: "Email dispatched!" });
      setTimeout(() => setSendStatus(null), 3000);
    } catch (e: any) {
      setSendStatus({ type: digestType, status: "error", message: e.message });
      setTimeout(() => setSendStatus(null), 4000);
    }
  };

  const CRON_TYPES: { key: "weekly" | "monthly" | "exam" | "admission"; label: string; schedule: string; icon: string; desc: string }[] = [
    {
      key: "weekly", label: "Weekly Digest", schedule: "Every Monday, 7:00 AM",
      icon: "calendar_view_week", desc: "Upcoming events in the next 7 days",
    },
    {
      key: "monthly", label: "Monthly Planner", schedule: "1st of every month, 7:00 AM",
      icon: "calendar_month", desc: "Full 30-day event planning digest",
    },
    {
      key: "exam", label: "Exam Alert", schedule: "Daily, 7:00 AM",
      icon: "quiz", desc: "Exams scheduled in next 3 days — skipped if none",
    },
    {
      key: "admission", label: "Admission Review", schedule: "Every Friday, 7:00 AM",
      icon: "school", desc: "Pending admission applications requiring action",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 shadow-lg border ${
          toast.type === "success"
            ? "bg-surface-container-lowest border-primary text-on-surface"
            : "bg-error-container border-error text-error"
        }`}>
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="font-body-sm text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="font-headline-sm text-primary text-xl uppercase tracking-widest">Email Automation</h2>
        <p className="font-body-sm text-on-surface-variant text-sm mt-1">
          Configure automated email digests delivered via Google Apps Script + Gmail
        </p>
      </div>

      {/* Architecture info card */}
      <div className="bg-surface-container-lowest border border-surface-variant p-6">
        <h4 className="font-label-caps text-[10px] text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">settings_ethernet</span>
          Email Delivery Architecture
        </h4>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: "schedule", label: "Vercel Cron", desc: "Fires on schedule" },
            { icon: "code", label: "Next.js API", desc: "Generates HTML email" },
            { icon: "webhook", label: "Apps Script", desc: "Google Webhook relay" },
            { icon: "mail", label: "Gmail SMTP", desc: "Delivers to recipients" },
          ].map((step, i) => (
            <div key={step.label} className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[20px]">{step.icon}</span>
              </div>
              <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface">{step.label}</p>
              <p className="font-body-sm text-xs text-on-surface-variant">{step.desc}</p>
              {i < 3 && (
                <div className="hidden md:block absolute" style={{ display: "none" }}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recipients */}
      <div className="bg-surface-container-lowest border border-surface-variant p-6 space-y-4">
        <h4 className="font-label-caps text-[10px] text-secondary uppercase tracking-widest border-b border-surface-variant pb-3">
          📬 Recipient Email Addresses
        </h4>
        <div className="space-y-2">
          <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
            Recipient Emails (comma-separated)
          </label>
          <textarea
            value={config.recipients}
            onChange={e => setConfig(c => ({ ...c, recipients: e.target.value }))}
            disabled={!canEditSettings}
            rows={3}
            placeholder="admin@sarvadaschool.com, principal@sarvadaschool.com"
            className="w-full px-4 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm text-sm resize-none disabled:opacity-60"
          />
          <p className="font-body-sm text-xs text-on-surface-variant">
            All automated emails will be sent to these addresses. Separate multiple emails with commas.
          </p>
        </div>
      </div>

      {/* Cron schedule cards */}
      <div className="space-y-4">
        <h4 className="font-label-caps text-[10px] text-secondary uppercase tracking-widest">
          ⏰ Automated Schedules (Vercel Cron)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CRON_TYPES.map(cron => {
            const enabledKey = `${cron.key}Enabled` as keyof EmailConfig;
            const isSending = sendStatus?.type === cron.key && sendStatus.status === "sending";
            const isDone = sendStatus?.type === cron.key && sendStatus.status === "success";
            const isError = sendStatus?.type === cron.key && sendStatus.status === "error";

            return (
              <div key={cron.key} className="bg-surface-container-lowest border border-surface-variant p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]">{cron.icon}</span>
                    </div>
                    <div>
                      <p className="font-body-sm font-medium text-on-surface text-sm">{cron.label}</p>
                      <p className="font-body-sm text-xs text-on-surface-variant">{cron.desc}</p>
                    </div>
                  </div>
                  {canEditSettings && (
                    <button
                      onClick={() => setConfig(c => ({ ...c, [enabledKey]: !c[enabledKey] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        config[enabledKey] ? "bg-primary" : "bg-surface-variant"
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                        config[enabledKey] ? "left-5" : "left-0.5"
                      }`}></span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {cron.schedule}
                  </span>
                  <span className={`font-label-caps text-[9px] uppercase tracking-widest px-2 py-0.5 border ${
                    config[enabledKey]
                      ? "border-primary text-primary"
                      : "border-surface-variant text-on-surface-variant"
                  }`}>
                    {config[enabledKey] ? "Enabled" : "Disabled"}
                  </span>
                </div>

                {/* Manual trigger */}
                <button
                  onClick={() => handleManualTrigger(cron.key)}
                  disabled={isSending}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 border transition-all font-label-caps text-[10px] uppercase tracking-widest ${
                    isDone
                      ? "border-primary bg-primary/5 text-primary"
                      : isError
                      ? "border-error text-error"
                      : "border-surface-variant text-on-surface-variant hover:border-primary hover:text-primary"
                  } disabled:opacity-50`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isSending ? "sync" : isDone ? "check_circle" : isError ? "error" : "send"}
                  </span>
                  {isSending ? "Sending..." : isDone ? "Sent!" : isError ? sendStatus?.message : "Send Now"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* vercel.json reminder */}
      <div className="bg-surface-container-lowest border border-amber-200 p-6 space-y-3">
        <h4 className="font-label-caps text-[10px] text-amber-700 uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          Vercel Cron Configuration Required
        </h4>
        <p className="font-body-sm text-sm text-on-surface-variant">
          For cron jobs to fire automatically on Vercel, ensure your <code className="bg-surface-container px-1.5 py-0.5 text-xs">vercel.json</code> contains:
        </p>
        <pre className="bg-surface-container text-xs font-mono p-4 overflow-x-auto border border-surface-variant">
{`{
  "crons": [
    { "path": "/api/cron/calendar-digest?type=weekly",    "schedule": "30 1 * * 1" },
    { "path": "/api/cron/calendar-digest?type=monthly",   "schedule": "30 1 1 * *" },
    { "path": "/api/cron/calendar-digest?type=exam",      "schedule": "30 1 * * *"  },
    { "path": "/api/cron/calendar-digest?type=admission", "schedule": "30 1 * * 5" }
  ]
}`}
        </pre>
        <p className="font-body-sm text-xs text-on-surface-variant">
          All times in UTC (30 1 = 07:00 IST). Cron jobs only run on Vercel Pro/Hobby plans on production deployments.
        </p>
      </div>

      {/* Save button */}
      {canEditSettings && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary hover:bg-secondary transition-all font-label-caps text-xs uppercase tracking-widest shadow-md disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {saving ? "Saving..." : "Save Email Settings"}
          </button>
        </div>
      )}
    </div>
  );
}
