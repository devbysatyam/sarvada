/**
 * Skool24 CRM Direct Integration Service
 * Pushes admission enquiry leads directly into the school's Skool24 ERP system.
 * 
 * Target Endpoint: https://node.skool24.com:8443/api/enquiry/savePublicEnquiryFormInfo
 * School: SARVADA MODERN SECONDARY SCHOOL (ID: 57, Session: 9)
 */

export interface Skool24LeadInput {
  studentName: string;
  fatherName?: string;
  motherName?: string;
  parentName?: string; // Fallback if father/mother not separated
  phone: string;
  dob?: string;
  grade?: string;
  gender?: string;
  email?: string;
  aadhaarNumber?: string;
  previousSchool?: string;
  previousClass?: string;
  address?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface Skool24PushResult {
  success: boolean;
  status?: number;
  message?: string;
  data?: any;
  error?: string;
}

const SKOOL24_API_URL =
  process.env.SKOOL24_API_URL ||
  "https://node.skool24.com:8443/api/enquiry/savePublicEnquiryFormInfo";

const SKOOL24_SCHOOL_ID = Number(process.env.SKOOL24_SCHOOL_ID) || 57;
const SKOOL24_SESSION_ID = Number(process.env.SKOOL24_SESSION_ID) || 9; // Session 2026-2027
const SKOOL24_SCHOOL_NAME =
  process.env.SKOOL24_SCHOOL_NAME || "SARVADA MODERN SECONDARY SCHOOL";

// Authorization Bearer token provided for Sarvada Modern Secondary School
const SKOOL24_BEARER_TOKEN =
  process.env.SKOOL24_BEARER_TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYzNTAzLCJlbWFpbCI6InNhdHlhbW1pc2hyYTA0MDJAZ21haWwuY29tIiwidXNlclR5cGUiOiJTVEFGRiIsInBsYXRmb3JtIjoiV0VCIiwiaWF0IjoxNzkzMDg0OTEzLCJleHAiOjE3OTMxNzEzMTN9.YgjVm2g9IwOWSj56i8NWJnggz-d13_63Beb_aGF_3_c";

/**
 * Skool24 Class ID mapping for Sarvada Modern Secondary School (School ID: 57, Session: 9)
 */
export const SKOOL24_CLASS_MAP: Record<string, number> = {
  playway: 1374,
  playgroup: 1374,
  "playgroup (age 2-3)": 1374,
  nur: 1375,
  nursery: 1375,
  "nursery (age 3+)": 1375,
  "nursery (age 3-4)": 1375,
  lkg: 2267,
  "lkg (age 4+)": 2267,
  "kg (age 4-5)": 2267,
  ukg: 1376,
  "ukg (age 5+)": 1376,
  "1": 1377,
  "1st": 1377,
  "class 1": 1377,
  "class 1st": 1377,
  "class 1st (age 6+)": 1377,
  "class 1 (age 5-6)": 1377,
  "2": 1378,
  "2nd": 1378,
  "class 2": 1378,
  "class 2nd": 1378,
  "3": 1379,
  "3rd": 1379,
  "class 3": 1379,
  "class 3rd": 1379,
  "class 3rd to 5th": 1379,
  "4": 1380,
  "4th": 1380,
  "class 4": 1380,
  "class 4th": 1380,
  "5": 1381,
  "5th": 1381,
  "class 5": 1381,
  "class 5th": 1381,
  "6": 1382,
  "6th": 1382,
  "class 6": 1382,
  "class 6th": 1382,
  "class 6th to 8th": 1382,
  "7": 1383,
  "7th": 1383,
  "class 7": 1383,
  "class 7th": 1383,
  "8": 1384,
  "8th": 1384,
  "class 8": 1384,
  "class 8th": 1384,
  "9": 1385,
  "9th": 1385,
  "class 9": 1385,
  "class 9th": 1385,
  "10": 1386,
  "10th": 1386,
  "class 10": 1386,
  "class 10th": 1386,
};

export function resolveSkool24ClassId(gradeInput?: string): number {
  if (!gradeInput) return 1375; // Default to Nursery
  const clean = gradeInput.toLowerCase().trim();
  if (SKOOL24_CLASS_MAP[clean]) {
    return SKOOL24_CLASS_MAP[clean];
  }
  for (const [key, id] of Object.entries(SKOOL24_CLASS_MAP)) {
    if (clean.includes(key)) {
      return id;
    }
  }
  return 1375;
}

/**
 * Normalizes Date of Birth to YYYY-MM-DD
 */
function normalizeDOB(raw?: string): string {
  if (!raw || !raw.trim()) return "";
  const cleaned = raw.trim().replace(/\//g, "-");
  const parts = cleaned.split("-");
  // If DD-MM-YYYY
  if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return cleaned;
}

/**
 * Pushes admission enquiry lead into Skool24 CRM.
 * Resilient: returns structured response without throwing, ensuring Firestore persistence is never blocked.
 */
export async function pushEnquiryToSkool24(
  lead: Skool24LeadInput
): Promise<Skool24PushResult> {
  try {
    const studentName = (lead.studentName?.trim() || "Student").replace(/[^a-zA-Z ]/g, "").slice(0, 50);
    const fatherName = (
      lead.fatherName?.trim() ||
      lead.parentName?.trim() ||
      ""
    ).replace(/[^a-zA-Z ]/g, "").slice(0, 50);
    const motherName = (lead.motherName?.trim() || "").replace(/[^a-zA-Z ]/g, "").slice(0, 50);
    const cleanPhone = (lead.phone || "").replace(/\D/g, "").slice(-10) || "9999439422";
    const dob = normalizeDOB(lead.dob);
    const classId = resolveSkool24ClassId(lead.grade);
    const gender = lead.gender?.toLowerCase().includes("f") ? "Female" : "Male";
    const address = (
      lead.address?.trim() || ""
    ).slice(0, 190);
    const cleanAadhaar = (lead.aadhaarNumber || "").replace(/\D/g, "").slice(0, 12);
    const aadhaar = cleanAadhaar.length >= 4 ? cleanAadhaar : "";

    const payload = {
      login_school_id: SKOOL24_SCHOOL_ID,
      login_session_id: SKOOL24_SESSION_ID,
      school_name: SKOOL24_SCHOOL_NAME,
      data: {
        name: studentName,
        father_name: fatherName,
        mother_name: motherName,
        dob: dob,
        mobile_no: cleanPhone,
        class_id: classId,
        aadhaar_card: aadhaar,
        gender: gender,
        email_id: lead.email?.trim() || "enquiry@sarvadamodernschool.com",
        status: "pending",
        previous_school_name: (lead.previousSchool?.trim() || "").slice(0, 50),
        previous_class: (lead.previousClass?.trim() || "").slice(0, 10),
        address: address,
        father_mobile_no: cleanPhone,
        mother_mobile_no: cleanPhone,
        any_suggestion: (lead.notes || "Inquiry from School Website & AI Counselor").slice(0, 450),
        know_from: "Website",
      },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(SKOOL24_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        Origin: "https://skool24.com",
        Referer: "https://skool24.com/",
        Authorization: `Bearer ${SKOOL24_BEARER_TOKEN}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let resData: any = null;
    try {
      resData = await response.json();
    } catch (_) {
      resData = null;
    }

    if (response.ok && resData?.status === "TRUE") {
      return {
        success: true,
        status: response.status,
        message: "Enquiry pushed to Skool24 CRM successfully",
        data: resData,
      };
    } else {
      console.warn("Skool24 CRM response:", response.status, resData);
      return {
        success: false,
        status: response.status,
        message: resData?.message || `Skool24 returned error (${response.status})`,
        data: resData,
      };
    }
  } catch (err: any) {
    console.warn("Skool24 CRM push warning (network or offline):", err.message);
    return {
      success: false,
      error: err.message || "Failed to connect to Skool24 CRM",
    };
  }
}
