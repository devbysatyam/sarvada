import { NextResponse } from "next/server";
import { db, ensureAuth } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getWhatsAppConfig, sendWhatsAppMessage, generateLeadMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/leads/auto-followup
 * Autonomous Follow-Up Engine:
 * Identifies pending leads requiring follow-up, dispatches automated reminders, and updates CRM status.
 */
export async function POST(req: Request) {
  try {
    await ensureAuth();

    const config = await getWhatsAppConfig();
    const thresholdHours = config.autoFollowupHours || 24;
    const now = Date.now();

    // Fetch all leads
    const leadsSnap = await getDocs(collection(db, "admissions_leads"));
    const allLeads = leadsSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    // Find pending leads
    const pendingLeads = allLeads.filter(
      (l) => !l.status || l.status === "NEW" || l.workStatus === "PENDING"
    );

    const eligibleLeads = pendingLeads.filter((lead) => {
      // Calculate elapsed time since inquiry creation
      let createdTime = now;
      if (lead.createdAt?.seconds) {
        createdTime = lead.createdAt.seconds * 1000;
      } else if (lead.createdDate) {
        createdTime = new Date(lead.createdDate).getTime();
      }

      const hoursElapsed = Math.max(0, (now - createdTime) / (1000 * 60 * 60));

      // Don't spam: check if follow-up was already sent within the last 24 hours
      if (lead.lastWhatsAppSentAt) {
        const lastSentTime = new Date(lead.lastWhatsAppSentAt).getTime();
        const hoursSinceLastSent = (now - lastSentTime) / (1000 * 60 * 60);
        if (hoursSinceLastSent < 24) {
          return false; // Skip if already followed up today
        }
      }

      return hoursElapsed >= 2; // Eligible if created > 2 hours ago
    });

    const results: Array<{
      leadId: string;
      studentName: string;
      phone: string;
      status: "SENT_VIA_API" | "PREPARED_FOR_MANUAL" | "FAILED";
      error?: string;
      fallbackUrl?: string;
    }> = [];

    let dispatchedCount = 0;
    let manualQueueCount = 0;

    for (const lead of eligibleLeads) {
      const messageText = generateLeadMessage(lead, "reminder");
      const sendRes = await sendWhatsAppMessage(lead.phone, messageText);

      if (sendRes.success) {
        dispatchedCount++;
        const timestampStr = new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        const noteEntry = `[${timestampStr} - Autonomous Agent]: Automated WhatsApp reminder sent.`;
        const updatedNotes = lead.notes ? `${lead.notes}\n${noteEntry}` : noteEntry;

        await updateDoc(doc(db, "admissions_leads", lead.id), {
          workStatus: "WORK_DONE",
          lastWhatsAppSentAt: new Date().toISOString(),
          lastFollowUpAt: new Date().toISOString(),
          lastNote: "Automated WhatsApp follow-up reminder sent",
          notes: updatedNotes,
          updatedAt: serverTimestamp(),
        });

        results.push({
          leadId: lead.id,
          studentName: lead.studentName,
          phone: lead.phone,
          status: "SENT_VIA_API",
        });
      } else {
        manualQueueCount++;
        results.push({
          leadId: lead.id,
          studentName: lead.studentName,
          phone: lead.phone,
          status: "PREPARED_FOR_MANUAL",
          fallbackUrl: sendRes.fallbackUrl,
          error: sendRes.error,
        });
      }

      // Small pacing
      await new Promise((r) => setTimeout(r, 100));
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalPending: pendingLeads.length,
        eligibleEvaluated: eligibleLeads.length,
        dispatchedViaApi: dispatchedCount,
        queuedForManualWeb: manualQueueCount,
      },
      results,
      message: `Autonomous follow-up complete! Evaluated ${eligibleLeads.length} leads. Dispatched: ${dispatchedCount}, Queued: ${manualQueueCount}.`,
    });
  } catch (err: any) {
    console.error("Auto follow-up error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute auto follow-up" },
      { status: 500 }
    );
  }
}
