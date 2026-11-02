import { NextResponse } from "next/server";
import { db, ensureAuth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { pushEnquiryToSkool24 } from "@/lib/skool24";

export async function POST(req: Request) {
  try {
    await ensureAuth();

    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "Missing leadId" },
        { status: 400 }
      );
    }

    const docRef = doc(db, "admissions_leads", leadId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Lead record not found in database" },
        { status: 404 }
      );
    }

    const lead = snap.data();

    // Call Skool24 CRM API
    const pushRes = await pushEnquiryToSkool24({
      studentName: lead.studentName,
      parentName: lead.parentName,
      fatherName: lead.parentName,
      motherName: lead.motherName,
      phone: lead.phone,
      grade: lead.grade,
      dob: lead.dob,
      email: lead.email,
      address: lead.address,
      aadhaarNumber: lead.aadhaar,
      referenceNumber: lead.referenceNumber,
      notes: lead.notes,
    });

    if (pushRes.success && pushRes.data?.value) {
      const skool24LeadId = Number(pushRes.data.value);
      await updateDoc(docRef, {
        skool24Synced: true,
        skool24LeadId,
        storedInPortal: true,
        crmSyncedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        skool24LeadId,
        message: `Successfully synced lead to Skool24 CRM! CRM Reference ID: #${skool24LeadId}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: pushRes.message || "Failed to sync to Skool24 CRM",
        details: pushRes,
      });
    }
  } catch (error: any) {
    console.error("CRM Sync Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
