// ============================================================
// Sarvada Modern Secondary School — AI Admission Agent Tools
// Functions for Eligibility, Document Lookup, Points, and Lead Capture
// ============================================================

import {
  DOE_AGE_CRITERIA,
  REQUIRED_DOCUMENTS,
  POINTS_CRITERIA,
  SCHOOL_INFO,
} from "./admission-knowledge";
import { db, ensureAuth } from "./firebase";
import { pushEnquiryToSkool24 } from "./skool24";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

export interface EligibilityResult {
  eligible: boolean;
  grade: string;
  sessionYear: number;
  asOnDate: string;
  calculatedAge: {
    years: number;
    months: number;
    days: number;
    formatted: string;
  };
  requiredCriteria: string;
  message: string;
  suggestion?: string;
}

/**
 * Calculates child's age as on March 31st of the session year and checks DOE compliance.
 */
export function checkEligibility(
  dobString: string,
  gradeInput: string,
  targetSessionYear: number = 2026
): EligibilityResult {
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) {
    return {
      eligible: false,
      grade: gradeInput,
      sessionYear: targetSessionYear,
      asOnDate: `31-03-${targetSessionYear}`,
      calculatedAge: { years: 0, months: 0, days: 0, formatted: "Invalid DOB" },
      requiredCriteria: "Valid Date of Birth required (YYYY-MM-DD)",
      message: "The provided date of birth is invalid. Please provide in YYYY-MM-DD format.",
    };
  }

  const cutoffDate = new Date(targetSessionYear, 2, 31); // March 31 of session year

  let years = cutoffDate.getFullYear() - birthDate.getFullYear();
  let months = cutoffDate.getMonth() - birthDate.getMonth();
  let days = cutoffDate.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonthDays = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth(), 0).getDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const formattedAge = `${years} years, ${months} months, ${days} days`;

  // Normalize grade string
  const cleanGrade = gradeInput.toLowerCase().trim();
  let matchedKey = "";
  if (cleanGrade.includes("nur") || cleanGrade.includes("pre-school") || cleanGrade.includes("play")) {
    matchedKey = "nursery";
  } else if (cleanGrade.includes("lkg") || cleanGrade.includes("lower")) {
    matchedKey = "lkg";
  } else if (cleanGrade.includes("ukg") || cleanGrade.includes("upper") || cleanGrade.includes("prep")) {
    matchedKey = "ukg";
  } else if (cleanGrade.includes("1") || cleanGrade.includes("first")) {
    matchedKey = "class-1";
  } else {
    for (let i = 2; i <= 9; i++) {
      if (cleanGrade.includes(`${i}`) || cleanGrade.includes(`${i}th`)) {
        matchedKey = `class-${i}`;
        break;
      }
    }
  }

  if (!matchedKey || !DOE_AGE_CRITERIA[matchedKey]) {
    return {
      eligible: true,
      grade: gradeInput,
      sessionYear: targetSessionYear,
      asOnDate: `31-03-${targetSessionYear}`,
      calculatedAge: { years, months, days, formatted: formattedAge },
      requiredCriteria: "Standard age progression",
      message: `As on 31st March ${targetSessionYear}, the student is ${formattedAge}. Please contact our admissions desk for special evaluation.`,
    };
  }

  const criteria = DOE_AGE_CRITERIA[matchedKey];
  const exactYears = years + months / 12 + days / 365;

  let eligible = false;
  let message = "";
  let suggestion = "";

  if (exactYears < criteria.minAgeYears) {
    eligible = false;
    message = `Student is underage for ${criteria.grade}. Current age is ${formattedAge} as of 31st March ${targetSessionYear}, but DOE requires at least ${criteria.minAgeYears} years.`;
    // Find suitable lower grade
    for (const [key, val] of Object.entries(DOE_AGE_CRITERIA)) {
      if (exactYears >= val.minAgeYears && (!val.maxAgeYears || exactYears < val.maxAgeYears)) {
        suggestion = `Based on age (${formattedAge}), the child is eligible for ${val.grade}.`;
        break;
      }
    }
  } else if (criteria.maxAgeYears && exactYears >= criteria.maxAgeYears) {
    eligible = false;
    message = `Student exceeds maximum DOE age limit for ${criteria.grade}. Current age is ${formattedAge} as of 31st March ${targetSessionYear} (allowed limit is strictly under ${criteria.maxAgeYears} years).`;
    for (const [key, val] of Object.entries(DOE_AGE_CRITERIA)) {
      if (exactYears >= val.minAgeYears && (!val.maxAgeYears || exactYears < val.maxAgeYears)) {
        suggestion = `Based on age (${formattedAge}), the child is eligible for ${val.grade}.`;
        break;
      }
    }
  } else {
    eligible = true;
    message = `Congratulations! The child is perfectly eligible for ${criteria.grade} (Age: ${formattedAge} as of 31st March ${targetSessionYear}, required: ${criteria.label}).`;
  }

  return {
    eligible,
    grade: criteria.grade,
    sessionYear: targetSessionYear,
    asOnDate: `31-03-${targetSessionYear}`,
    calculatedAge: { years, months, days, formatted: formattedAge },
    requiredCriteria: criteria.label,
    message,
    suggestion: suggestion || undefined,
  };
}

/**
 * Returns document requirements based on whether admission is for Nursery-1st or Class 2nd-9th.
 */
export function getRequiredDocuments(gradeInput: string) {
  const g = gradeInput.toLowerCase().trim();
  const isNurToFirst =
    g.includes("nur") ||
    g.includes("lkg") ||
    g.includes("ukg") ||
    g.includes("1") ||
    g.includes("first") ||
    g.includes("play");

  if (isNurToFirst) {
    return {
      category: "Class Nursery to 1st Standard",
      documents: REQUIRED_DOCUMENTS.nurseryToFirst,
      specialNotes: [
        "PAN Number is required for LKG, UKG, and Class 1st.",
        "Sibling Fee Slip is required only if real brother/sister is currently studying in Sarvada Modern School.",
        "SC/OBC certificate is mandatory for candidates applying under reserved category.",
      ],
    };
  } else {
    return {
      category: "New Admission for Class 2nd to 9th",
      documents: REQUIRED_DOCUMENTS.class2ndTo9th,
      specialNotes: [
        "Original Transfer Certificate (T.C.) countersigned by competent authority is mandatory.",
        "Student APAAR ID (Automated Permanent Academic Account Registry) must be provided.",
        "Student PAN number is required for higher grades.",
      ],
    };
  }
}

/**
 * Calculates Pre-School admission points based on Delhi DOE 100-point criteria.
 */
export function calculatePoints(criteria: {
  distanceKm: number;
  hasSibling: boolean;
  isAlumni: boolean;
  isSingleParent: boolean;
  isFirstChild: boolean;
}) {
  let score = 0;
  const breakdown: { item: string; points: number }[] = [];

  // Distance (0-3 KM): 60 points
  if (criteria.distanceKm <= 3) {
    score += 60;
    breakdown.push({ item: "Distance (0-3 KM)", points: 60 });
  } else if (criteria.distanceKm <= 6) {
    score += 40;
    breakdown.push({ item: "Distance (3-6 KM)", points: 40 });
  } else {
    score += 20;
    breakdown.push({ item: "Distance (>6 KM)", points: 20 });
  }

  if (criteria.hasSibling) {
    score += 20;
    breakdown.push({ item: "Sibling in school", points: 20 });
  }
  if (criteria.isAlumni) {
    score += 10;
    breakdown.push({ item: "Alumni Parent", points: 10 });
  }
  if (criteria.isSingleParent) {
    score += 5;
    breakdown.push({ item: "Single Parent", points: 5 });
  }
  if (criteria.isFirstChild) {
    score += 5;
    breakdown.push({ item: "First Born Child", points: 5 });
  }

  return {
    totalPoints: score,
    maxPoints: 100,
    breakdown,
  };
}

export interface LeadSubmissionData {
  studentName: string;
  parentName: string;
  fatherName?: string;
  motherName?: string;
  phone: string;
  grade: string;
  dob?: string;
  email?: string;
  address?: string;
  category?: string;
  siblingName?: string;
  siblingClass?: string;
  calculatedPoints?: number;
  notes?: string;
  source?: string;
}

/**
 * Persists an admission lead to Firestore and forwards to the Google Webhook.
 */
export async function submitAdmissionLead(data: LeadSubmissionData) {
  try {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `SMS-ADM-${year}-${rand}`;

    const leadPayload = {
      referenceNumber,
      studentName: data.studentName.trim(),
      parentName: data.parentName.trim(),
      fatherName: (data.fatherName || data.parentName || "").trim(),
      motherName: (data.motherName || "").trim(),
      phone: data.phone.trim(),
      grade: data.grade.trim(),
      dob: data.dob || "",
      email: data.email?.trim() || "",
      address: data.address?.trim() || "",
      category: data.category || "General",
      siblingName: data.siblingName || "",
      siblingClass: data.siblingClass || "",
      calculatedPoints: data.calculatedPoints || 0,
      notes: data.notes || "Captured via AI Admission Counselor",
      source: data.source || "AI_Agent_Chat",
      status: "NEW", // NEW | CONTACTED | VERIFIED | ENROLLED | NOT_INTERESTED | REJECTED
      workStatus: "PENDING", // PENDING | WORK_DONE
      createdAt: serverTimestamp(),
      createdDate: new Date().toISOString(),
    };

    let docId = "";

    // 1. Save to Firestore collection "admissions_leads" with timeout & auth protection
    try {
      await ensureAuth();
      const firestoreTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore write timed out")), 10000)
      );
      const docRef = await Promise.race([
        addDoc(collection(db, "admissions_leads"), leadPayload),
        firestoreTimeout,
      ]);
      docId = docRef.id;
    } catch (firestoreErr: any) {
      console.warn("Firestore lead persistence warning:", firestoreErr.message);
    }

    // 2. Forward to Webhook in background (optional/resilient)
    const webhookUrl = process.env.NEXT_PUBLIC_GOOGLE_WEBHOOK_URL;
    if (webhookUrl && webhookUrl.startsWith("http")) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...leadPayload,
            formType: "AIAssistedAdmissionLead",
          }),
        });
      } catch (err) {
        console.warn("Background webhook forwarding note:", err);
      }
    }

    // 3. Directly push to Skool24 School CRM in parallel (login_school_id: 57, login_session_id: 9)
    let skool24Result: any = null;
    let skool24LeadId: number | null = null;
    try {
      skool24Result = await pushEnquiryToSkool24({
        studentName: leadPayload.studentName,
        parentName: leadPayload.parentName,
        fatherName: (data.fatherName || leadPayload.parentName),
        motherName: (data.motherName || ""),
        aadhaarNumber: (data as any).aadhaar || "",
        phone: leadPayload.phone,
        grade: leadPayload.grade,
        dob: leadPayload.dob,
        email: leadPayload.email,
        address: leadPayload.address,
        referenceNumber: leadPayload.referenceNumber,
        notes: leadPayload.notes,
      });

      if (skool24Result?.success && skool24Result?.data?.value) {
        skool24LeadId = Number(skool24Result.data.value);
      }
    } catch (crmErr: any) {
      console.warn("Skool24 CRM push exception:", crmErr.message);
    }

    // 4. Update the Firestore record with Skool24 sync details
    if (docId) {
      try {
        const { updateDoc, doc: fsDoc } = await import("firebase/firestore");
        await updateDoc(fsDoc(db, "admissions_leads", docId), {
          skool24Synced: skool24Result?.success ?? false,
          skool24LeadId: skool24LeadId || null,
          storedInPortal: true,
          crmSyncedAt: new Date().toISOString(),
        });
      } catch (updateErr: any) {
        console.warn("Could not update lead with Skool24 sync status:", updateErr.message);
      }
    }

    return {
      success: true,
      referenceNumber,
      docId: docId || undefined,
      storedInPortal: true,
      skool24Synced: skool24Result?.success ?? false,
      skool24LeadId: skool24LeadId || undefined,
      message: `Admission enquiry registered successfully! Reference Number: ${referenceNumber}. Our admissions office will contact you shortly.`,
    };
  } catch (error: any) {
    console.error("Failed to submit admission lead:", error);
    return {
      success: false,
      error: error.message || "Failed to submit lead",
      message: "We encountered a temporary issue saving your enquiry. Please call our admission desk directly at +91 99994 39422.",
    };
  }
}

/**
 * Finds all existing leads matching a phone number to prevent duplicates and support siblings
 */
export async function findExistingLeads(phone: string): Promise<any[]> {
  try {
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) return [];

    await ensureAuth();
    const q = query(
      collection(db, "admissions_leads"),
      where("phone", "==", cleanPhone),
      limit(5)
    );

    const firestoreTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 3000)
    );

    const snap = await Promise.race([getDocs(q), firestoreTimeout]);
    if (snap.empty) return [];

    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("findExistingLeads warning:", err);
    return [];
  }
}

/**
 * Checks status of an enquiry by phone number or reference number
 */
export async function checkApplicationStatus(queryParam: string) {
  try {
    const clean = queryParam.trim();
    if (!clean) return { found: false, message: "Please provide a phone number or reference number." };

    await ensureAuth();
    let q;
    if (clean.toUpperCase().startsWith("SMS-ADM")) {
      q = query(collection(db, "admissions_leads"), where("referenceNumber", "==", clean), limit(1));
    } else {
      q = query(collection(db, "admissions_leads"), where("phone", "==", clean), limit(3));
    }

    const firestoreTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firestore query timed out")), 4000)
    );

    const snap = await Promise.race([getDocs(q), firestoreTimeout]);
    if (snap.empty) {
      return {
        found: false,
        message: `No application found for '${clean}'. Please verify your phone number or reference number.`,
      };
    }

    const records = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return {
      found: true,
      records,
      message: `Found ${records.length} record(s).`,
    };
  } catch (err: any) {
    console.warn("Status check warning:", err.message);
    return {
      found: false,
      error: err.message,
      message: "Unable to retrieve application status at this moment.",
    };
  }
}
