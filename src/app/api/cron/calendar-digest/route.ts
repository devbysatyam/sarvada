import { NextResponse } from "next/server";
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { db, ensureAuth } from "@/lib/firebase";
import {
  weeklyDigestEmail,
  monthlyDigestEmail,
  examAlertEmail,
  admissionAlertEmail,
  type DigestEvent,
} from "@/lib/email-templates";

// Vercel cron — CRON_SECRET must match vercel.json cron header
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const type = searchParams.get("type") || "weekly"; // weekly | monthly | exam | admission
    const cronSecret = process.env.CRON_SECRET || "sarvada_secret_cron_123";

    // Accept both ?secret= query param AND Vercel's Authorization header
    const authHeader = req.headers.get("authorization");
    const headerSecret = authHeader?.replace("Bearer ", "");
    const isAuthorized = secret === cronSecret || headerSecret === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL || "";
    if (!WEBHOOK_URL?.startsWith("http")) {
      return NextResponse.json({ error: "Webhook URL is not configured." }, { status: 500 });
    }

    // ── Academic year calculation ──────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    const month = today.getMonth();
    const activeYear = month >= 3
      ? `${year}-${String(year + 1).slice(-2)}`
      : `${year - 1}-${String(year).slice(-2)}`;

    const getAcademicYear = (dateStr: string): string => {
      if (!dateStr) return "";
      const d = new Date(dateStr + "T00:00:00");
      const y = d.getFullYear();
      const m = d.getMonth();
      return m >= 3 ? `${y}-${String(y + 1).slice(-2)}` : `${y - 1}-${String(y).slice(-2)}`;
    };

    // Ensure authenticated session to avoid gRPC permission errors
    await ensureAuth();

    // ── Load recipient settings ────────────────────────────────
    let recipients = "admin@sarvadaschool.com";
    try {
      const settingsSnap = await getDoc(doc(db, "settings", "emailConfig"));
      if (settingsSnap.exists()) {
        recipients = settingsSnap.data().recipients || recipients;
      }
    } catch (_) {}

    // ──────────────────────────────────────────────────────────
    // WEEKLY / MONTHLY  — calendar events
    // ──────────────────────────────────────────────────────────
    if (type === "weekly" || type === "monthly") {
      const snapshot = await getDocs(collection(db, "calendar"));
      const allEvents: DigestEvent[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.date && getAcademicYear(data.date) === activeYear) {
          allEvents.push({ date: data.date, title: data.title, category: data.category, description: data.description });
        }
      });

      const windowDays = type === "weekly" ? 7 : 30;
      const filtered = allEvents.filter((e) => {
        const evtDate = new Date(e.date + "T00:00:00");
        const diff = Math.ceil((evtDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff >= 0 && diff <= windowDays;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const { subject, html } = type === "weekly"
        ? weeklyDigestEmail(filtered, activeYear)
        : monthlyDigestEmail(filtered, activeYear);

      await sendViaWebhook(WEBHOOK_URL, { subject, html, recipients, formType: "CalendarDigest" });
      return NextResponse.json({ success: true, type, eventsFound: filtered.length, recipients });
    }

    // ──────────────────────────────────────────────────────────
    // EXAM — events with category "Exam" in next 3 days
    // ──────────────────────────────────────────────────────────
    if (type === "exam") {
      const snapshot = await getDocs(collection(db, "calendar"));
      const upcomingExams: DigestEvent[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.category === "Exam" && data.date) {
          const evtDate = new Date(data.date + "T00:00:00");
          const diff = Math.ceil((evtDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff <= 3) {
            upcomingExams.push({ date: data.date, title: data.title, category: "Exam", description: data.description });
          }
        }
      });

      if (upcomingExams.length === 0) {
        return NextResponse.json({ success: true, type, message: "No exams in next 3 days — email skipped." });
      }

      const { subject, html } = examAlertEmail(upcomingExams);
      await sendViaWebhook(WEBHOOK_URL, { subject, html, recipients, formType: "ExamAlert" });
      return NextResponse.json({ success: true, type, examsFound: upcomingExams.length, recipients });
    }

    // ──────────────────────────────────────────────────────────
    // ADMISSION — pending applications
    // ──────────────────────────────────────────────────────────
    if (type === "admission") {
      const snapshot = await getDocs(collection(db, "admissions"));
      const pending: Array<{ applicantName?: string; class?: string; applicationDate?: string; status?: string }> = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.status === "pending" || data.status === "Pending" || !data.status) {
          pending.push({
            applicantName: data.studentName || data.name || data.applicantName,
            class: data.class || data.gradeApplied,
            applicationDate: data.createdAt?.toDate?.()?.toLocaleDateString() || data.applicationDate,
            status: data.status || "Pending",
          });
        }
      });

      const { subject, html } = admissionAlertEmail(pending);
      await sendViaWebhook(WEBHOOK_URL, { subject, html, recipients, formType: "AdmissionAlert" });
      return NextResponse.json({ success: true, type, pendingCount: pending.length, recipients });
    }

    return NextResponse.json({ error: `Unknown cron type: ${type}` }, { status: 400 });

  } catch (error: any) {
    console.error("Cron function failed:", error);
    return NextResponse.json({ error: error.message || "Cron execution failed" }, { status: 500 });
  }
}

// ── Shared webhook sender ─────────────────────────────────────
async function sendViaWebhook(url: string, payload: {
  subject: string;
  html: string;
  recipients: string;
  formType: string;
}) {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      formType: payload.formType,
      subject: payload.subject,
      htmlMessage: payload.html,
      recipients: payload.recipients,
      timestamp: new Date().toISOString(),
    }),
  });
}
