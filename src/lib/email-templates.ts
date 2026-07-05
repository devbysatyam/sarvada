// ============================================================
// Email Templates — Sarvada Modern School
// Rich HTML email templates for all notification types
// ============================================================

const SCHOOL_NAME = "Sarvada Modern School";
const SCHOOL_COLOR = "#8B0000"; // Deep maroon
const ACCENT_COLOR = "#C8960C"; // Gold
const BG_COLOR = "#F9F5F0";
const CARD_BG = "#FFFFFF";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_MUTED = "#6B6B6B";

// ── Shared wrapper ─────────────────────────────────────────────
function baseWrapper(title: string, preview: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:'Georgia',serif;">
  <!-- Preview text (hidden) -->
  <span style="display:none;font-size:1px;color:${BG_COLOR};max-height:0;max-width:0;overflow:hidden;">${preview}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:${SCHOOL_COLOR};padding:32px 40px;text-align:center;">
              <p style="margin:0;font-family:'Georgia',serif;font-size:11px;letter-spacing:4px;color:${ACCENT_COLOR};text-transform:uppercase;">
                Official Communication
              </p>
              <h1 style="margin:8px 0 0 0;font-family:'Georgia',serif;font-size:26px;color:#FFFFFF;font-weight:700;letter-spacing:1px;">
                ${SCHOOL_NAME}
              </h1>
              <p style="margin:6px 0 0 0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:3px;text-transform:uppercase;">
                Estd. 2004 · Excellence in Education
              </p>
            </td>
          </tr>

          <!-- Gold rule -->
          <tr>
            <td style="background-color:${ACCENT_COLOR};height:3px;"></td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:${CARD_BG};padding:40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${SCHOOL_COLOR};padding:24px 40px;text-align:center;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">
                This is an automated message from ${SCHOOL_NAME}
              </p>
              <p style="margin:8px 0 0 0;font-family:Arial,sans-serif;font-size:11px;color:rgba(255,255,255,0.5);">
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Category color badges ─────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Holiday:  { bg: "#FEE2E2", text: "#B91C1C" },
  Exam:     { bg: "#FEF3C7", text: "#92400E" },
  Event:    { bg: "#D1FAE5", text: "#065F46" },
  Activity: { bg: "#DBEAFE", text: "#1E40AF" },
  Term:     { bg: "#EDE9FE", text: "#5B21B6" },
  PTM:      { bg: "#CCFBF1", text: "#0F766E" },
  Sports:   { bg: "#ECFCCB", text: "#3F6212" },
  Cultural: { bg: "#FCE7F3", text: "#9D174D" },
  Urgent:   { bg: "#FEE2E2", text: "#B91C1C" },
  General:  { bg: "#F3F4F6", text: "#374151" },
  Academic: { bg: "#EFF6FF", text: "#1E40AF" },
};

function categoryBadge(category: string): string {
  const c = CATEGORY_COLORS[category] || { bg: "#F3F4F6", text: "#374151" };
  return `<span style="display:inline-block;padding:3px 10px;border-radius:4px;background-color:${c.bg};color:${c.text};font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">${category}</span>`;
}

function sectionTitle(text: string): string {
  return `<p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${ACCENT_COLOR};border-bottom:1px solid #E5E7EB;padding-bottom:8px;">${text}</p>`;
}

function eventRow(e: { date: string; title: string; category: string; description?: string; daysLeft?: number }): string {
  const daysLabel = e.daysLeft !== undefined
    ? `<span style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${e.daysLeft <= 3 ? "#B91C1C" : SCHOOL_COLOR};margin-left:8px;">${e.daysLeft === 0 ? "TODAY" : e.daysLeft === 1 ? "TOMORROW" : `in ${e.daysLeft} days`}</span>`
    : "";

  return `<tr>
    <td style="padding:12px 0;border-bottom:1px solid #F3F4F6;vertical-align:top;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="80" style="vertical-align:top;">
            <div style="background-color:${SCHOOL_COLOR};color:#FFFFFF;text-align:center;padding:6px 8px;border-radius:4px;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;font-weight:700;line-height:1;">${formatDay(e.date)}</p>
              <p style="margin:2px 0 0 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:1px;opacity:0.8;">${formatMonAbbr(e.date)}</p>
            </div>
          </td>
          <td style="padding-left:16px;vertical-align:top;">
            <p style="margin:0 0 4px 0;font-family:'Georgia',serif;font-size:15px;color:${TEXT_PRIMARY};font-weight:700;">${e.title}${daysLabel}</p>
            <div style="margin-bottom:6px;">${categoryBadge(e.category)}</div>
            ${e.description ? `<p style="margin:4px 0 0 0;font-family:Arial,sans-serif;font-size:12px;color:${TEXT_MUTED};line-height:1.5;">${e.description}</p>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function formatDay(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").getDate().toString().padStart(2, "0");
}

function formatMonAbbr(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleString("en-US", { month: "short" }).toUpperCase();
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Template 1: Weekly Calendar Digest ───────────────────────
export interface DigestEvent {
  date: string;
  title: string;
  category: string;
  description?: string;
}

export function weeklyDigestEmail(events: DigestEvent[], academicYear: string): { subject: string; html: string } {
  const subject = events.length === 0
    ? `Sarvada School — No Upcoming Events This Week`
    : `Sarvada School — ${events.length} Event${events.length > 1 ? "s" : ""} This Week`;

  const body = `
    <h2 style="margin:0 0 8px 0;font-family:'Georgia',serif;font-size:22px;color:${SCHOOL_COLOR};">Weekly Events Digest</h2>
    <p style="margin:0 0 24px 0;font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};">Academic Year ${academicYear} · ${new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>

    ${sectionTitle("📅 Upcoming This Week (Next 7 Days)")}
    ${events.length === 0
      ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};padding:20px 0;">No events scheduled in the next 7 days. Enjoy the peaceful week!</p>`
      : `<table width="100%" cellpadding="0" cellspacing="0">${events.map(e => eventRow({ ...e, daysLeft: daysUntil(e.date) })).join("")}</table>`
    }

    <div style="margin-top:32px;padding:20px;background-color:${BG_COLOR};border-left:3px solid ${SCHOOL_COLOR};">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:${TEXT_MUTED};">
        This digest is automatically generated every Monday at 7:00 AM. Manage events on the <strong>School Admin Portal</strong>.
      </p>
    </div>`;

  return { subject, html: baseWrapper(subject, `${events.length} upcoming events this week at Sarvada Modern School`, body) };
}

// ── Template 2: Monthly Planning Digest ──────────────────────
export function monthlyDigestEmail(events: DigestEvent[], academicYear: string): { subject: string; html: string } {
  const subject = `Sarvada School — Monthly Event Planner for ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}`;

  // Group by category
  const grouped: Record<string, DigestEvent[]> = {};
  for (const e of events) {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  }

  const groupBlocks = Object.entries(grouped).map(([cat, evts]) => `
    <div style="margin-bottom:24px;">
      <div style="margin-bottom:12px;">${categoryBadge(cat)}</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${evts.map(e => eventRow(e)).join("")}
      </table>
    </div>
  `).join("");

  const body = `
    <h2 style="margin:0 0 8px 0;font-family:'Georgia',serif;font-size:22px;color:${SCHOOL_COLOR};">Monthly Planning Digest</h2>
    <p style="margin:0 0 24px 0;font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};">Academic Year ${academicYear} · ${events.length} events in the next 30 days</p>

    ${sectionTitle("📋 All Events — Next 30 Days")}
    ${events.length === 0
      ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};padding:20px 0;">No events scheduled in the next 30 days.</p>`
      : groupBlocks
    }`;

  return { subject, html: baseWrapper(subject, `Monthly planner: ${events.length} events at Sarvada Modern School`, body) };
}

// ── Template 3: Exam Alert (3-day countdown) ─────────────────
export function examAlertEmail(exams: DigestEvent[]): { subject: string; html: string } {
  const subject = exams.length === 1
    ? `⚠️ Sarvada School — Exam Alert: ${exams[0].title} in ${daysUntil(exams[0].date)} day(s)`
    : `⚠️ Sarvada School — ${exams.length} Exams Coming Up Soon`;

  const body = `
    <div style="background-color:#FEF3C7;border:1px solid #F59E0B;padding:16px 20px;margin-bottom:28px;border-radius:4px;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:#92400E;font-weight:700;">
        ⚠️ Examination Reminder — Action Required
      </p>
      <p style="margin:6px 0 0 0;font-family:Arial,sans-serif;font-size:12px;color:#92400E;">
        The following examination(s) are scheduled in the next 3 days. Please ensure all preparations are complete.
      </p>
    </div>

    <h2 style="margin:0 0 24px 0;font-family:'Georgia',serif;font-size:22px;color:${SCHOOL_COLOR};">Upcoming Examinations</h2>

    ${sectionTitle("📝 Exam Schedule")}
    <table width="100%" cellpadding="0" cellspacing="0">
      ${exams.map(e => eventRow({ ...e, daysLeft: daysUntil(e.date) })).join("")}
    </table>

    <div style="margin-top:32px;padding:20px;background-color:#FEF3C7;border-left:3px solid #F59E0B;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#92400E;">
        <strong>Checklist:</strong> Verify invigilation assignments · Ensure hall-tickets are issued · Confirm seating arrangements · Check stationery supplies
      </p>
    </div>`;

  return { subject, html: baseWrapper(subject, `Exam alert: ${exams.length} examination(s) in the next 3 days`, body) };
}

// ── Template 4: Urgent Notice Blast ──────────────────────────
export interface UrgentNoticeData {
  title: string;
  category: string;
  description?: string;
  date?: string;
}

export function urgentNoticeEmail(notice: UrgentNoticeData): { subject: string; html: string } {
  const subject = `🚨 URGENT — ${SCHOOL_NAME}: ${notice.title}`;

  const body = `
    <div style="background-color:#FEE2E2;border:2px solid #EF4444;padding:16px 20px;margin-bottom:28px;border-radius:4px;text-align:center;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#B91C1C;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
        🚨 URGENT NOTICE
      </p>
    </div>

    <h2 style="margin:0 0 8px 0;font-family:'Georgia',serif;font-size:22px;color:${SCHOOL_COLOR};">${notice.title}</h2>
    <p style="margin:0 0 24px 0;font-family:Arial,sans-serif;font-size:12px;color:${TEXT_MUTED};">
      Issued: ${new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      &nbsp;·&nbsp;${categoryBadge(notice.category)}
    </p>

    ${notice.description ? `
      ${sectionTitle("Notice Details")}
      <div style="font-family:Arial,sans-serif;font-size:14px;color:${TEXT_PRIMARY};line-height:1.7;background-color:${BG_COLOR};padding:20px;border-left:3px solid #EF4444;">
        ${notice.description.replace(/<[^>]*>/g, " ").substring(0, 500)}${notice.description.length > 500 ? "..." : ""}
      </div>
    ` : ""}

    <div style="margin-top:32px;padding:16px;background-color:#FEF2F2;border:1px solid #FECACA;text-align:center;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#B91C1C;">
        This urgent notice was automatically dispatched from the ${SCHOOL_NAME} admin portal. Please acknowledge receipt and take appropriate action.
      </p>
    </div>`;

  return { subject, html: baseWrapper(subject, `Urgent notice from ${SCHOOL_NAME}: ${notice.title}`, body) };
}

// ── Template 5: Admission Deadline Alert ─────────────────────
export interface AdmissionEntry {
  applicantName?: string;
  class?: string;
  applicationDate?: string;
  status?: string;
}

export function admissionAlertEmail(pending: AdmissionEntry[], deadlineInfo?: string): { subject: string; html: string } {
  const subject = `Sarvada School — ${pending.length} Pending Admission Application${pending.length !== 1 ? "s" : ""} Require Attention`;

  const rows = pending.slice(0, 20).map(a => `
    <tr style="border-bottom:1px solid #F3F4F6;">
      <td style="padding:10px 12px;font-family:Arial,sans-serif;font-size:13px;color:${TEXT_PRIMARY};">${a.applicantName || "—"}</td>
      <td style="padding:10px 12px;font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};">Class ${a.class || "—"}</td>
      <td style="padding:10px 12px;font-family:Arial,sans-serif;font-size:12px;color:${TEXT_MUTED};">${a.applicationDate || "—"}</td>
      <td style="padding:10px 12px;">${categoryBadge(a.status || "Pending")}</td>
    </tr>
  `).join("");

  const body = `
    <h2 style="margin:0 0 8px 0;font-family:'Georgia',serif;font-size:22px;color:${SCHOOL_COLOR};">Admission Applications Update</h2>
    <p style="margin:0 0 24px 0;font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};">${deadlineInfo || "Weekly review of pending applications"}</p>

    ${sectionTitle(`📋 Pending Applications (${pending.length} total)`)}
    ${pending.length === 0
      ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};padding:20px 0;">No pending applications at this time.</p>`
      : `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:4px;overflow:hidden;">
          <thead>
            <tr style="background-color:${SCHOOL_COLOR};">
              <th style="padding:10px 12px;text-align:left;font-family:Arial,sans-serif;font-size:10px;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;">Applicant</th>
              <th style="padding:10px 12px;text-align:left;font-family:Arial,sans-serif;font-size:10px;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;">Class</th>
              <th style="padding:10px 12px;text-align:left;font-family:Arial,sans-serif;font-size:10px;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;">Applied On</th>
              <th style="padding:10px 12px;text-align:left;font-family:Arial,sans-serif;font-size:10px;color:#FFFFFF;letter-spacing:2px;text-transform:uppercase;">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${pending.length > 20 ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:${TEXT_MUTED};margin-top:8px;">...and ${pending.length - 20} more. Login to the admin portal to view all.</p>` : ""}`
    }`;

  return { subject, html: baseWrapper(subject, `${pending.length} pending admission applications at Sarvada Modern School`, body) };
}

// ── Template 6: Event Reminder (1 week before) ───────────────
export function eventReminderEmail(event: DigestEvent): { subject: string; html: string } {
  const days = daysUntil(event.date);
  const subject = `Sarvada School — Reminder: "${event.title}" is ${days === 1 ? "Tomorrow" : `in ${days} Days`}`;

  const body = `
    <h2 style="margin:0 0 8px 0;font-family:'Georgia',serif;font-size:22px;color:${SCHOOL_COLOR};">Event Reminder</h2>
    <p style="margin:0 0 24px 0;font-family:Arial,sans-serif;font-size:13px;color:${TEXT_MUTED};">This is an automated reminder for an upcoming school event.</p>

    <div style="border:2px solid ${SCHOOL_COLOR};padding:28px;text-align:center;margin-bottom:28px;">
      <div style="margin-bottom:16px;">${categoryBadge(event.category)}</div>
      <h3 style="margin:0 0 8px 0;font-family:'Georgia',serif;font-size:24px;color:${SCHOOL_COLOR};">${event.title}</h3>
      <p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:14px;color:${TEXT_MUTED};">${formatFullDate(event.date)}</p>
      <div style="display:inline-block;background-color:${days <= 1 ? "#FEE2E2" : SCHOOL_COLOR};color:${days <= 1 ? "#B91C1C" : "#FFFFFF"};padding:8px 24px;font-family:Arial,sans-serif;font-size:16px;font-weight:700;border-radius:4px;">
        ${days === 0 ? "TODAY" : days === 1 ? "TOMORROW" : `${days} DAYS AWAY`}
      </div>
    </div>

    ${event.description ? `
      ${sectionTitle("Event Details")}
      <p style="font-family:Arial,sans-serif;font-size:13px;color:${TEXT_PRIMARY};line-height:1.7;">${event.description}</p>
    ` : ""}`;

  return { subject, html: baseWrapper(subject, `Reminder: ${event.title} at Sarvada Modern School`, body) };
}
