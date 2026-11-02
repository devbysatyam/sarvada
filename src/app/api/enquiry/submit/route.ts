import { NextResponse } from "next/server";
import { db, ensureAuth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { pushEnquiryToSkool24 } from "@/lib/skool24";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Honeypot check (anti-bot)
    if (body.school_security_honeypot) {
      console.warn("Spam bot detected via honeypot field. Dropping request.");
      return NextResponse.json(
        { success: false, error: "Invalid submission" },
        { status: 400 }
      );
    }

    // 2. Strict Phone Validation (10-digit Indian Mobile)
    const rawPhone = String(body.phone || body.mobile_no || "").trim();
    const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
        },
        { status: 400 }
      );
    }

    // 3. Name Sanitization
    const studentName = String(body.studentName || body.childName || body.name || "").trim();
    const parentName = String(body.parentName || body.father_name || "Parent/Guardian").trim();
    const motherName = String(body.mother_name || "").trim();
    const grade = String(body.grade || body.classApplying || body.applyingFor || body.class_apply_for || "Nursery").trim();
    const dob = String(body.dob || body.childDOB || "").trim();
    const email = String(body.email || "").trim();
    const address = String(body.address || "").trim();
    const aadhaar = String(body.aadhaar_no || body.aadhaar || "").trim();
    const notes = String(body.message || body.notes || "").trim();
    const source = String(body.source || "Website_Enquiry_Form").trim();

    if (studentName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter the student's full name." },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `SMS-ENQ-${year}-${rand}`;

    const leadPayload = {
      referenceNumber,
      studentName,
      parentName,
      motherName,
      phone: cleanPhone,
      grade,
      dob,
      email,
      address,
      aadhaar,
      notes,
      source,
      status: "NEW", // NEW | CONTACTED | VERIFIED | ENROLLED | NOT_INTERESTED | REJECTED
      workStatus: "PENDING", // PENDING | WORK_DONE
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString(),
    };

    // 4. Save to Firestore
    let docId = "";
    try {
      await ensureAuth();
      const docRef = await addDoc(collection(db, "admissions_leads"), leadPayload);
      docId = docRef.id;
    } catch (fsErr: any) {
      console.warn("Firestore enquiry save warning:", fsErr.message);
    }

    // 5. Direct Push to Skool24 CRM in parallel
    let skool24Res: any = null;
    let skool24LeadId: number | null = null;
    try {
      skool24Res = await pushEnquiryToSkool24({
        studentName,
        parentName,
        fatherName: parentName,
        motherName,
        phone: cleanPhone,
        grade,
        dob,
        email,
        address,
        aadhaarNumber: aadhaar,
        referenceNumber,
        notes,
      });

      if (skool24Res?.success && skool24Res?.data?.value) {
        skool24LeadId = Number(skool24Res.data.value);
      }
    } catch (crmErr: any) {
      console.warn("Skool24 push error:", crmErr.message);
    }

    // Update Firestore with Skool24 sync details
    if (docId) {
      try {
        const { updateDoc, doc: fsDoc } = await import("firebase/firestore");
        await updateDoc(fsDoc(db, "admissions_leads", docId), {
          skool24Synced: skool24Res?.success ?? false,
          skool24LeadId: skool24LeadId || null,
          storedInPortal: true,
          crmSyncedAt: new Date().toISOString(),
        });
      } catch (uErr: any) {
        console.warn("Could not update lead with Skool24 sync details:", uErr.message);
      }
    }

    // 6. Optional Google Webhook
    const webhookUrl = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL;
    if (webhookUrl && webhookUrl.startsWith("http")) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadPayload,
          skool24LeadId,
          skool24Synced: skool24Res?.success ?? false,
          formType: "WebsiteEnquiryForm",
        }),
      }).catch((err) => console.warn("Webhook forwarding error:", err));
    }

    return NextResponse.json({
      success: true,
      referenceNumber,
      docId: docId || undefined,
      storedInPortal: true,
      skool24Synced: skool24Res?.success ?? false,
      skool24LeadId: skool24LeadId || undefined,
      message: `Enquiry registered successfully! Reference Number: ${referenceNumber}. Stored in School Software and Skool24 CRM.`,
    });
  } catch (error: any) {
    console.error("Enquiry submission API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process enquiry submission.",
      },
      { status: 500 }
    );
  }
}
