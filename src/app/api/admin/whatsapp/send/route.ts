import { NextResponse } from "next/server";
import { db, ensureAuth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  sendWhatsAppMessage,
  sendBulkWhatsApp,
  generateLeadMessage,
  formatIndianPhoneNumber,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/whatsapp/send
 * Body options:
 * Single lead: { leadId, message, templateKey, customText }
 * Bulk leads:  { leadIds: string[], templateKey, customText }
 */
export async function POST(req: Request) {
  try {
    await ensureAuth();

    const body = await req.json();
    const { leadId, leadIds, message, templateKey = "reminder", customText } = body;

    // Handle Bulk Sending
    if (Array.isArray(leadIds) && leadIds.length > 0) {
      const leadsToProcess: Array<{
        id: string;
        studentName: string;
        parentName: string;
        grade: string;
        phone: string;
        referenceNumber?: string;
        notes?: string;
      }> = [];

      for (const id of leadIds) {
        const snap = await getDoc(doc(db, "admissions_leads", id));
        if (snap.exists()) {
          const d = snap.data();
          leadsToProcess.push({
            id: snap.id,
            studentName: d.studentName || "Student",
            parentName: d.parentName || "Parent",
            grade: d.grade || "Class",
            phone: d.phone || "",
            referenceNumber: d.referenceNumber,
            notes: d.notes,
          });
        }
      }

      if (leadsToProcess.length === 0) {
        return NextResponse.json(
          { success: false, error: "No valid leads found for the provided IDs" },
          { status: 400 }
        );
      }

      const bulkResult = await sendBulkWhatsApp(leadsToProcess, templateKey, customText);

      return NextResponse.json({
        success: true,
        ...bulkResult,
        message: `Processed ${bulkResult.total} leads. Sent: ${bulkResult.sent}, Fallback/Manual: ${bulkResult.failed}`,
      });
    }

    // Handle Single Lead Sending
    if (leadId) {
      const snap = await getDoc(doc(db, "admissions_leads", leadId));
      if (!snap.exists()) {
        return NextResponse.json(
          { success: false, error: "Lead record not found" },
          { status: 404 }
        );
      }

      const lead = snap.data();
      const textToSend = message || generateLeadMessage(lead, templateKey, customText);
      const sendRes = await sendWhatsAppMessage(lead.phone, textToSend);

      // If sent successfully, update lead record
      if (sendRes.success) {
        const timestampStr = new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        const noteEntry = `[${timestampStr} - WhatsApp]: Sent "${templateKey}" message.`;
        const updatedNotes = lead.notes ? `${lead.notes}\n${noteEntry}` : noteEntry;

        await updateDoc(doc(db, "admissions_leads", leadId), {
          workStatus: "WORK_DONE",
          lastWhatsAppSentAt: new Date().toISOString(),
          lastFollowUpAt: new Date().toISOString(),
          lastNote: `WhatsApp message sent (${templateKey})`,
          notes: updatedNotes,
          updatedAt: serverTimestamp(),
        });
      }

      return NextResponse.json({
        success: sendRes.success,
        messageId: sendRes.messageId,
        fallbackUrl: sendRes.fallbackUrl,
        error: sendRes.error,
        message: sendRes.success
          ? "WhatsApp message dispatched successfully!"
          : sendRes.error || "Could not dispatch via API",
      });
    }

    return NextResponse.json(
      { success: false, error: "Provide either leadId or leadIds array." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("WhatsApp API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process WhatsApp request" },
      { status: 500 }
    );
  }
}
