import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { urgentNoticeEmail, type UrgentNoticeData } from "@/lib/email-templates";

/**
 * POST /api/send-email
 * General-purpose email trigger — called from admin UI
 * Body: { type, notice?, eventIds?, recipients?, academicYear? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, notice, recipients: customRecipients, academicYear } = body;

    const WEBHOOK_URL = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL || "";
    if (!WEBHOOK_URL?.startsWith("http")) {
      return NextResponse.json({ error: "Webhook URL is not configured." }, { status: 500 });
    }

    // ── Load default recipients ───────────────────────────────
    let recipients = customRecipients || "admin@sarvadaschool.com";

    // ── Urgent Notice ─────────────────────────────────────────
    if (type === "urgent_notice" && notice) {
      const noticeData: UrgentNoticeData = {
        title: notice.title,
        category: notice.category || "Urgent",
        description: notice.description,
      };
      const { subject, html } = urgentNoticeEmail(noticeData);
      await sendViaWebhook(WEBHOOK_URL, { subject, html, recipients, formType: "UrgentNotice" });
      return NextResponse.json({ success: true, type, subject });
    }

    // ── Manual Calendar Digest (all types) ───────────────────
    if (type === "manual_digest") {
      const digestType = body.digestType || "weekly";
      const url = new URL(`/api/cron/calendar-digest`, getBaseUrl(req));
      url.searchParams.set("type", digestType);
      url.searchParams.set("secret", process.env.CRON_SECRET || "sarvada_secret_cron_123");
      if (academicYear) url.searchParams.set("academicYear", academicYear);
      if (customRecipients) url.searchParams.set("recipients", customRecipients);

      const result = await fetch(url.toString());
      const data = await result.json();
      return NextResponse.json({ success: true, ...data });
    }

    return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });

  } catch (error: any) {
    console.error("Send email API failed:", error);
    return NextResponse.json({ error: error.message || "Email send failed" }, { status: 500 });
  }
}

function getBaseUrl(req: Request): string {
  const host = req.headers.get("host") || "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

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
