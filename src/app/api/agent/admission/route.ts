import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import {
  checkEligibility,
  getRequiredDocuments,
  calculatePoints,
  submitAdmissionLead,
  checkApplicationStatus,
  findExistingLeads,
} from "@/lib/admission-tools";
import {
  SCHOOL_INFO,
  POINTS_CRITERIA,
  DOE_AGE_CRITERIA,
  AdmissionJourneyContext,
  JourneyStage,
} from "@/lib/admission-knowledge";

// ─────────────────────────────────────────────────────────────
// SYSTEM INSTRUCTION WITH STRICT GUARDRAILS & JOURNEY ROUTING
// ─────────────────────────────────────────────────────────────
function buildSystemInstruction(ctx: AdmissionJourneyContext) {
  const isHindiPreferred = ctx.language === "hi";
  return `
You are "Sarvada Shiksha Mitra" (सर्वदा शिक्षा मित्र), the official AI Admission Counselor for Sarvada Modern Secondary School, Sadatpur, Karawal Nagar, Delhi (Est. 1972, CBSE Affiliated, School ID: 1104340, Contact: +91 99994 39422).

${isHindiPreferred ? "CRITICAL MANDATE: The user is speaking in HINDI / HINGLISH. You MUST formulate your ENTIRE response in natural, polite HINDI or HINGLISH. Never answer in English when this flag is active." : "CRITICAL MANDATE: Mirror the language of the user. If they write in Hindi/Hinglish, reply in Hindi/Hinglish. If in English, reply in English."}

STRICT GUARDRAILS & INSTRUCTIONS:
1. STRICT LANGUAGE MIRRORING:
   - If the user asks or speaks in Hindi (e.g. 'मुझे 3rd क्लास में एडमिशन लेना है', 'कक्षा 3 में एडमिशन', 'क्या डाक्यूमेंट्स चाहिए', 'नमस्ते') or Hinglish (e.g. 'mujhe 3rd class me addmission lena hai', 'kya documents lagenge', 'fees kitni hai'), YOU MUST ALWAYS REPLY IN NATURAL, POLITE HINDI / HINGLISH.
   - Never respond in English to a Hindi or Hinglish inquiry!
2. SCOPE GUARDRAIL: Only assist with Sarvada Modern Secondary School admissions, CBSE curriculum, DOE age criteria, required documents, campus facilities, and student registration. Politely decline any off-topic queries (coding, politics, general trivia, other schools) in the user's language.
3. CONVERSATIONAL CONTINUITY: You remember details previously mentioned by the parent (Child's class: ${ctx.grade || "None"}, DOB: ${ctx.dob || "None"}). If they already specified Class 3rd, provide Class 3rd admission details and required documents immediately without re-asking!
4. NO OPTION OVERLOAD: Answer ONLY what was asked concisely. Do NOT repeat a long menu of bullet points in every message.
5. ONE CLEAR NEXT STEP: At the end of your answer, ask AT MOST ONE relevant question to gently guide the parent forward in their admission journey.
6. NO WHATSAPP ADMISSION SUPPORT: The school does NOT handle admissions or inquiries via WhatsApp. Never tell parents to contact via WhatsApp or provide WhatsApp links. Always guide them to call the Admission Desk directly (+91 99994 39422), download the PDF application form, or visit the school campus (Sadatpur, Karawal Nagar, Delhi).

CURRENT PARENT JOURNEY STATE:
• Detected Language Mode: ${ctx.language === "hi" ? "HINDI / HINGLISH (Mandatory response in Hindi/Hinglish)" : "ENGLISH"}
• Stage: ${ctx.stage}
• Target Grade/Class: ${ctx.grade || "Not specified yet"}
• Child Date of Birth: ${ctx.dob || "Not specified yet"}
• Age Calculated: ${ctx.calculatedAge || "N/A"}
• Eligibility: ${ctx.isEligible === true ? "Eligible" : ctx.isEligible === false ? "Not Eligible" : "Pending"}
• Student Name: ${ctx.studentName || "Not specified"}
• Parent/Father Name: ${ctx.parentName || ctx.fatherName || "Not specified"}
• Mother Name: ${ctx.motherName || "Not specified"}
• Mobile Number: ${ctx.phone || "Not specified"}
• Reference Number: ${ctx.referenceNumber || "None"}

JOURNEY MILESTONES:
1. ELIGIBILITY: If class or DOB is mentioned, evaluate against DOE Delhi rules (as of 31st March: Nursery 3+, LKG 4+, UKG 5+, 1st 6+, 2nd 7+, 3rd 8+, 4th 9+, 5th 10+, 6th 11+, 7th 12+, 8th 13+, 9th 14+).
2. DOCUMENTS:
   - Nursery to 1st: Birth cert, Student Aadhar, Parents Aadhar, 2 photos, SC/OBC cert (if applicable), PAN (LKG/UKG/1st), Sibling fee slip (if sibling is in school).
   - Class 2nd to 9th: Student Aadhar, Previous marksheet, Transfer Certificate (T.C.), Student PAN, Student APAAR ID, Parents Aadhar, 2 photos, SC/OBC cert.
3. REGISTRATION: When parent wants to apply, guide them step by step to collect:
   Child Name, Class, Parent Name, 10-digit Mobile Number. Call 'submitAdmissionLead' once details are ready.
`;
}

const toolDeclarations = [
  {
    name: "checkEligibility",
    description: "Checks if a child is eligible for a grade based on DOB and DOE Delhi guidelines (as of 31st March).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dob: { type: Type.STRING, description: "Date of Birth (YYYY-MM-DD or DD-MM-YYYY)" },
        grade: { type: Type.STRING, description: "Class (e.g. Nursery, LKG, UKG, Class 1st, Class 2nd)" },
        sessionYear: { type: Type.NUMBER, description: "Session starting year (default 2026)" },
      },
      required: ["dob", "grade"],
    },
  },
  {
    name: "getRequiredDocuments",
    description: "Returns the official document checklist for Nursery to 1st or Class 2nd to 9th.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        grade: { type: Type.STRING, description: "Grade/class name (e.g. Nursery, 1st, Class 6th)" },
      },
      required: ["grade"],
    },
  },
  {
    name: "calculatePointsCriteria",
    description: "Calculates the 100-point pre-school admission score.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        distanceKm: { type: Type.NUMBER, description: "Distance in KM from school" },
        hasSibling: { type: Type.BOOLEAN, description: "Sibling currently in school" },
        isAlumni: { type: Type.BOOLEAN, description: "Alumni parent" },
        isSingleParent: { type: Type.BOOLEAN, description: "Single parent" },
        isFirstChild: { type: Type.BOOLEAN, description: "First child" },
      },
      required: ["distanceKm"],
    },
  },
  {
    name: "submitAdmissionLead",
    description: "Saves verified admission lead to Firestore and generates an official reference number.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        studentName: { type: Type.STRING, description: "Student's full name" },
        parentName: { type: Type.STRING, description: "Parent's full name" },
        phone: { type: Type.STRING, description: "10-digit mobile number" },
        grade: { type: Type.STRING, description: "Class applying for" },
        dob: { type: Type.STRING, description: "Child Date of Birth (optional)" },
        notes: { type: Type.STRING, description: "Any query or note" },
      },
      required: ["studentName", "parentName", "phone", "grade"],
    },
  },
  {
    name: "checkApplicationStatus",
    description: "Looks up existing admission application status by phone or reference number.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        phoneOrRef: { type: Type.STRING, description: "Phone number or reference number" },
      },
      required: ["phoneOrRef"],
    },
  },
];

async function executeAgentTool(name: string, args: Record<string, any>) {
  switch (name) {
    case "checkEligibility": {
      let dob = args.dob;
      if (dob && dob.includes("/")) {
        const parts = dob.split("/");
        if (parts.length === 3 && parts[2].length === 4) {
          dob = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
      return checkEligibility(dob, args.grade, args.sessionYear || 2026);
    }
    case "getRequiredDocuments":
      return getRequiredDocuments(args.grade);
    case "calculatePointsCriteria":
      return calculatePoints({
        distanceKm: Number(args.distanceKm) || 0,
        hasSibling: Boolean(args.hasSibling),
        isAlumni: Boolean(args.isAlumni),
        isSingleParent: Boolean(args.isSingleParent),
        isFirstChild: Boolean(args.isFirstChild),
      });
    case "submitAdmissionLead":
      return await submitAdmissionLead(args as any);
    case "checkApplicationStatus":
      return await checkApplicationStatus(args.phoneOrRef);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// Generate context-aware suggested actions matching current journey stage
function generateSuggestedActions(ctx: AdmissionJourneyContext): string[] {
  switch (ctx.stage) {
    case "DISCOVERY":
      return ["Check Age Eligibility", "What documents are required?", "School Timings & Location"];
    case "ELIGIBILITY_EVALUATED":
      return [
        ctx.grade ? `Required Docs for ${ctx.grade}` : "Required Documents",
        "Register Admission Inquiry",
        "Calculate 100-Point Score",
      ];
    case "DOCUMENTS_REVIEWED":
      return ["Start Admission Registration", "School Timings & Address", "Call School Desk"];
    case "COLLECTING_DETAILS":
      if (!ctx.phone) return ["Provide Mobile Number", "Cancel Registration"];
      return ["Confirm Details", "Edit Details"];
    case "REGISTERED":
      return ["Download Admission Form (PDF)", "Track Application Status", "Office Location & Timings"];
    default:
      return ["Check Age Eligibility", "Required Documents", "Timings & Location"];
  }
}

function isHindiOrHinglish(text: string): boolean {
  const devanagari = /[\u0900-\u097F]/;
  const hinglishWords = /\b(mujhe|mera|mere|meri|humko|bacche|bachhe|bache|dakhila|dakila|chahiye|lena|lene|hona|hai|hain|kya|kaise|kitna|kitni|hoga|batao|bataiye|kahan|namaste|namaskar|shiksha|pravesh|kaagaz|kagaz|dastavez|form|bharna|addmission|admision|admisn|admission|kaksha|pata|fees|fee|kab|mein|me|se|ko|ka|ki|ke|bhi|aur|karna|karwana|karwa|bhejo|bhejiye|dhanyawad|shukriya|teesri|doosri|dusri|chauthi|panchvi|chhati|saatvi|aathvi|nauvi)\b/i;
  return devanagari.test(text) || hinglishWords.test(text);
}

// Helper to sanitize extracted name strings — removes noise words and punctuation
function cleanExtractedName(str: string): string {
  if (!str) return "";
  return str
    .replace(/\b(?:student|child|ba[ch]{1,5}[eaio]?|beta|beti|name|naam|is|hai|hain|ka|ki|ke|ko|se|mera|meri|mere|shri|smt|mr|mrs|dr|and|aur|date\s*of\s*birth|dob|class|grade|admission|dakhila|father|mother|parent|pita|mata|papa|mummy|of|phone|mobile|mob|no|num|number)\b/gi, " ")
    .replace(/[0-9:,.\/#!$%^&*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────
// SEMANTIC AGENTIC CLAUSE PARSER & ENTITY BINDER
// Eliminates brittle regexes by parsing labeled spans and multi-field inputs
// ─────────────────────────────────────────────────────────────
function extractEntities(text: string, currentCtx: AdmissionJourneyContext): Partial<AdmissionJourneyContext> {
  const updates: Partial<AdmissionJourneyContext> = {};

  if (isHindiOrHinglish(text) || currentCtx.language === "hi") {
    updates.language = "hi";
  }

  // 1. Direct Phone Extraction (matches with space, +91, 0)
  const phoneMatch = text.match(/(?:(?:\+?91|0)?\s*)?([6-9]\d{9})\b/);
  if (phoneMatch) {
    updates.phone = phoneMatch[1];
  }

  // 2. Direct DOB Extraction
  const dateMatch = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/) || text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (dateMatch) {
    if (dateMatch[1].length === 4) {
      updates.dob = dateMatch[0].replace(/\//g, "-");
    } else {
      const day = dateMatch[1].padStart(2, "0");
      const month = dateMatch[2].padStart(2, "0");
      const year = dateMatch[3];
      updates.dob = `${year}-${month}-${day}`;
    }
  }

  // 3. Direct Reference Number Extraction
  const refMatch = text.match(/\bSMS-ADM-\d{4}-\d{4,5}\b/i);
  if (refMatch) {
    updates.referenceNumber = refMatch[0].toUpperCase();
  }

  // 4. Grade / Class Extraction
  if (/nursery|pre-school|kg-1|नर्सरी/i.test(text)) {
    updates.grade = "Nursery";
  } else if (/\blkg\b|l\.k\.g|एलकेजी/i.test(text)) {
    updates.grade = "LKG";
  } else if (/\bukg\b|u\.k\.g|यूकेजी/i.test(text)) {
    updates.grade = "UKG";
  } else if (/\b(?:class\s*1(?:st)?|1st\s*(?:class)?|first\s*class|कक्षा\s*1|पहली\s*कक्षा)\b/i.test(text)) {
    updates.grade = "Class 1st";
  } else {
    const gradeMatch = text.match(/\b(?:class\s*([2-9]|1[0-2])(?:nd|rd|th)?|([2-9]|1[0-2])(?:nd|rd|th)\s*(?:class)?|([2-9]|1[0-2])\s*class|कक्षा\s*([2-9]|1[0-2])|([2-9]|1[0-2])\s*वीं)\b/i);
    if (gradeMatch) {
      const gNum = parseInt(gradeMatch[1] || gradeMatch[2] || gradeMatch[3] || gradeMatch[4] || gradeMatch[5], 10);
      const suffix = gNum === 2 ? "nd" : gNum === 3 ? "rd" : "th";
      updates.grade = `Class ${gNum}${suffix}`;
    } else {
      const wordMap: Record<string, string> = {
        "2nd": "Class 2nd", second: "Class 2nd", "दूसरी": "Class 2nd", doosri: "Class 2nd", dusri: "Class 2nd",
        "3rd": "Class 3rd", third: "Class 3rd", "तीसरी": "Class 3rd", teesri: "Class 3rd",
        "4th": "Class 4th", fourth: "Class 4th", "चौथी": "Class 4th", chauthi: "Class 4th",
        "5th": "Class 5th", fifth: "Class 5th", "पांचवीं": "Class 5th", panchvi: "Class 5th",
        "6th": "Class 6th", sixth: "Class 6th", "छठी": "Class 6th", chhati: "Class 6th",
        "7th": "Class 7th", seventh: "Class 7th", "सातवीं": "Class 7th", saatvi: "Class 7th",
        "8th": "Class 8th", eighth: "Class 8th", "आठवीं": "Class 8th", aathvi: "Class 8th",
        "9th": "Class 9th", ninth: "Class 9th", "नौवीं": "Class 9th", nauvi: "Class 9th",
      };
      for (const [kw, cls] of Object.entries(wordMap)) {
        if (new RegExp(`\\b${kw}\\b`, "i").test(text)) {
          updates.grade = cls;
          break;
        }
      }
    }
  }

  // 5. Locality / Address Extraction
  const localityPatterns = [
    { pattern: /\b(?:karawal\s*nagar|karaawal\s*nagar|karwal\s*nagar|करावल\s*नगर)\b/i, name: "Karawal Nagar" },
    { pattern: /\b(?:sadatpur|सादतपुर|सादतपर)\b/i, name: "Sadatpur Extension" },
    { pattern: /\b(?:khajuri|khajoori|खजूरी)\b/i, name: "Khajuri Khas" },
    { pattern: /\b(?:mustafabad|मुस्तफाबाद)\b/i, name: "Mustafabad" },
    { pattern: /\b(?:shiv\s*vihar|शिव\s*विहार)\b/i, name: "Shiv Vihar" },
    { pattern: /\b(?:bhajanpura|भजनपुरा)\b/i, name: "Bhajanpura" },
    { pattern: /\b(?:yamuna\s*vihar|यमुना\s*विहार)\b/i, name: "Yamuna Vihar" },
    { pattern: /\b(?:tukmirpur|तुकमीरपुर)\b/i, name: "Tukmirpur" },
    { pattern: /\b(?:sonia\s*vihar|सोनिया\s*विहार)\b/i, name: "Sonia Vihar" },
    { pattern: /\b(?:sabhapur|सभापुर)\b/i, name: "Sabhapur" },
    { pattern: /\b(?:dayalpur|दयालपुरा|दयालपर)\b/i, name: "Dayalpur" },
    { pattern: /\b(?:gokalpuri|गोकलपुरी)\b/i, name: "Gokalpuri" },
    { pattern: /\b(?:harsh\s*vihar|हर्ष\s*विहार)\b/i, name: "Harsh Vihar" },
    { pattern: /\b(?:johripur|जोहरीपुर)\b/i, name: "Johripur" },
    { pattern: /\b(?:maujpur|मौजपुर)\b/i, name: "Maujpur" },
  ];
  for (const loc of localityPatterns) {
    if (loc.pattern.test(text)) {
      updates.address = loc.name;
      break;
    }
  }

  // 6. SEMANTIC KEYED-LABEL PARSER: Handles compound multi-field inputs in ANY order
  // e.g. "NAME SATYAM MISHRA ADRESS KARWAL NAGAR FATHER NAME MAHENDRA MISHRA , MOTHER NAME RANJANA MISHRA AND NUMBER 7276520057"
  const labelAnchors = [
    { target: "fatherName", regex: /\b(?:father(?:\s*name|\s*ka\s*naam)?|pita(?:\s*ka\s*naam)?|papa(?:\s*ka\s*naam)?)\b\s*[:=-]?/i },
    { target: "motherName", regex: /\b(?:mother(?:\s*name|\s*ka\s*naam)?|mata(?:\s*ka\s*naam)?|mummy(?:\s*ka\s*naam)?)\b\s*[:=-]?/i },
    { target: "studentName", regex: /\b(?:name\s*of\s*student|student(?:\s*name|\s*ka\s*naam)?|child(?:\s*name|\s*ka\s*naam)?|name\s*of\s*child|bacche\s*ka\s*naam|chhatra\s*ka\s*naam|beta\s*ka\s*naam|beti\s*ka\s*naam)\b\s*[:=-]?/i },
    { target: "address", regex: /\b(?:adress|address|pata|rehta\s*hu|rehte\s*hai|location|area)\b\s*[:=-]?/i },
    { target: "phone", regex: /\b(?:number|phone|mobile|mob|contact|no)\b\s*[:=-]?/i },
    { target: "dob", regex: /\b(?:date\s*of\s*birth|dob|janam\s*tithi)\b\s*[:=-]?/i },
    { target: "directive", regex: /\b(?:aur\s*kuch\s*chahiye|proces\s*karo|process\s*karo|agla|kya\s*dena\s*hoga|kaise\s*hoga)\b/i },
    // Standalone "name" or "naam" anchor (ONLY if not part of father/mother/child name)
    { target: "studentNameFallback", regex: /(?<!\b(?:father|mother|pita|papa|mata|mummy|child|student|bacche)\s*)\b(?:name|naam)\b\s*[:=-]?/i }
  ];

  const occurrences: { target: string; start: number; end: number; matchedText: string }[] = [];
  const occupiedSpans: { start: number; end: number }[] = [];

  for (const anchor of labelAnchors) {
    let match;
    const globalRegex = new RegExp(anchor.regex.source, "gi");
    while ((match = globalRegex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      
      const overlaps = occupiedSpans.some(s => (start >= s.start && start < s.end) || (end > s.start && end <= s.end));
      if (!overlaps) {
        occupiedSpans.push({ start, end });
        occurrences.push({
          target: anchor.target === "studentNameFallback" ? "studentName" : anchor.target,
          start,
          end,
          matchedText: match[0]
        });
      }
    }
  }

  occurrences.sort((a, b) => a.start - b.start);

  for (let i = 0; i < occurrences.length; i++) {
    const current = occurrences[i];
    const nextStart = i + 1 < occurrences.length ? occurrences[i + 1].start : text.length;
    const rawVal = text.substring(current.end, nextStart).trim();

    const cleanVal = rawVal
      .replace(/^[,\-:=]+|[,\-:=]+$/g, "")
      .replace(/\b(?:and|aur|hai|hain|is|to|bhi|ka|ki|ke)\b$/gi, "")
      .trim();

    if (current.target === "studentName" && !updates.studentName) {
      const sanitized = cleanVal.replace(/[0-9]/g, "").replace(/\s+/g, " ").trim();
      if (sanitized.length >= 2 && !sanitized.toLowerCase().includes("sarvada")) {
        updates.studentName = sanitized;
      }
    } else if (current.target === "fatherName" && !updates.fatherName) {
      const sanitized = cleanVal.replace(/[0-9]/g, "").replace(/\s+/g, " ").trim();
      if (sanitized.length >= 2) {
        updates.fatherName = sanitized;
        updates.parentName = sanitized;
      }
    } else if (current.target === "motherName" && !updates.motherName) {
      const sanitized = cleanVal.replace(/[0-9]/g, "").replace(/\s+/g, " ").trim();
      if (sanitized.length >= 2) {
        updates.motherName = sanitized;
      }
    } else if (current.target === "address" && !updates.address) {
      if (cleanVal.length >= 3) {
        updates.address = cleanVal;
      }
    }
  }

  // 7. Backward label checks (e.g. "SATYAM MISHRA BACCCHE KA NAAM", "MAHENDRA MISHRA PITA KA NAAM")
  if (!updates.studentName) {
    const backMatch = text.match(/([A-Za-z\s]{2,30})\s+(?:bacche\s*ka\s*naam|student\s*name|chhatra\s*ka\s*naam)/i);
    if (backMatch && !backMatch[1].toLowerCase().includes("sarvada")) {
      updates.studentName = backMatch[1].trim();
    }
  }
  if (!updates.parentName && !updates.fatherName) {
    const backMatch = text.match(/([A-Za-z\s]{2,30})\s+(?:pita\s*ka\s*naam|father\s*name|papa\s*ka\s*naam)/i);
    if (backMatch) {
      updates.fatherName = backMatch[1].trim();
      updates.parentName = backMatch[1].trim();
    }
  }

  // 8. Conversational multi-turn name input (fallback when user just provides name without labels)
  if (!updates.studentName || !updates.parentName) {
    const textWithoutPhone = text
      .replace(/(?:(?:\+?91|0)?\s*)?[6-9]\d{9}\b/g, " ")
      .replace(/\b(?:phone|mobile|mob|contact|number|no|num)\b/gi, " ")
      .replace(/[0-9:,.\/#!$%^&*;:{}=\-_`~()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const words = textWithoutPhone.split(/\s+/).filter(Boolean);
    const isCommand = /admission|eligib|docu|fee|timing|address|school|nursery|lkg|ukg|class|hello|hi|namaste|yes|no|haan|nahi|chahiye|lena|karna|karwana|kaise|kya|aur|kuch|batao|proces|agla/i.test(textWithoutPhone);

    if (!isCommand && words.length >= 1 && words.length <= 4 && textWithoutPhone.length >= 2 && textWithoutPhone.length <= 40 && !textWithoutPhone.toLowerCase().includes("sarvada")) {
      if (!updates.studentName && !currentCtx.studentName) {
        updates.studentName = textWithoutPhone;
      } else if (!updates.parentName && !currentCtx.parentName && textWithoutPhone.toLowerCase() !== (updates.studentName || currentCtx.studentName || "").toLowerCase()) {
        updates.parentName = textWithoutPhone;
        updates.fatherName = textWithoutPhone;
      }
    }
  }

  if (!updates.parentName && updates.fatherName) {
    updates.parentName = updates.fatherName;
  }

  return updates;
}

// Scope check
function isOutOfScope(query: string): boolean {
  const q = query.toLowerCase();
  const prohibitedTriggers = [
    "write a python script",
    "write code",
    "solve this math problem",
    "who is prime minister",
    "who is president of",
    "recipe for",
    "crypto",
    "bitcoin",
    "jailbreak",
    "ignore previous instructions",
    "tell me a joke about",
  ];
  return prohibitedTriggers.some((trigger) => q.includes(trigger));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      message,
      history = [],
      sessionContext: incomingCtx = {},
      sessionYear = 2026,
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const trimmedMsg = message.trim();

    // Initialize & merge journey context
    const currentCtx: AdmissionJourneyContext = {
      stage: incomingCtx.stage || "DISCOVERY",
      grade: incomingCtx.grade,
      dob: incomingCtx.dob,
      calculatedAge: incomingCtx.calculatedAge,
      isEligible: incomingCtx.isEligible,
      studentName: incomingCtx.studentName,
      parentName: incomingCtx.parentName,
      fatherName: incomingCtx.fatherName,
      motherName: incomingCtx.motherName,
      address: incomingCtx.address,
      phone: incomingCtx.phone,
      referenceNumber: incomingCtx.referenceNumber,
      distanceKm: incomingCtx.distanceKm,
      calculatedPoints: incomingCtx.calculatedPoints,
      language: incomingCtx.language || "en",
    };

    // Extract any new entities from user message
    const extracted = extractEntities(trimmedMsg, currentCtx);
    Object.assign(currentCtx, extracted);

    const historyHadHindi = Array.isArray(history) && history.some((h: any) => isHindiOrHinglish(h.content || ""));
    const isHindi = isHindiOrHinglish(trimmedMsg) || currentCtx.language === "hi" || incomingCtx.language === "hi" || historyHadHindi;
    if (isHindi) currentCtx.language = "hi";

    // ─────────────────────────────────────────────────────────────
    // GUARDRAIL 1: Scope & Security Guardrail
    // ─────────────────────────────────────────────────────────────
    if (isOutOfScope(trimmedMsg)) {
      const declineMsg = isHindi
        ? "नमस्ते! 🙏 मैं **सर्वदा मॉडर्न सेकेंडरी स्कूल** का AI एडमिशन काउंसलर हूँ। मैं केवल स्कूल एडमिशन, CBSE पाठ्यक्रम, DOE उम्र पात्रता, आवश्यक दस्तावेज व विद्यालय की जानकारी में आपकी सहायता कर सकता हूँ।\n\nआप अपने बच्चे के एडमिशन के बारे में क्या जानना चाहते हैं?"
        : "Namaste! 🙏 I am the dedicated Admission Counselor for **Sarvada Modern Secondary School**. " +
          "I can only assist you with school admissions, DOE age criteria, required documents, CBSE curriculum, and campus information.\n\n" +
          "How can I help you regarding your child's schooling?";

      return NextResponse.json({
        reply: declineMsg,
        sessionContext: currentCtx,
        suggestedActions: isHindi
          ? ["उम्र पात्रता जांचें", "दस्तावेज क्या चाहिए?", "स्कूल का समय व पता"]
          : generateSuggestedActions(currentCtx),
        executedTools: [],
      });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    // ─────────────────────────────────────────────────────────────
    // 1. GEMINI LIVE MODEL WITH TOOL CALLING & FALLBACK LIST
    // ─────────────────────────────────────────────────────────────
    if (apiKey && apiKey.length > 10) {
      const candidateModels = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash"];
      for (const modelName of candidateModels) {
        try {
          const ai = new GoogleGenAI({ apiKey });

          const formattedContents: any[] = [];
          for (const item of history.slice(-6)) {
            formattedContents.push({
              role: item.role === "assistant" ? "model" : "user",
              parts: [{ text: item.content }],
            });
          }
          formattedContents.push({
            role: "user",
            parts: [{ text: trimmedMsg }],
          });

          const withTimeout = <T>(promise: Promise<T>, ms: number = 2500): Promise<T> =>
            Promise.race([
              promise,
              new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
              ),
            ]);

          let response = await withTimeout(
            ai.models.generateContent({
              model: modelName,
              contents: formattedContents,
              config: {
                systemInstruction: buildSystemInstruction(currentCtx),
                temperature: 0.3,
                tools: [{ functionDeclarations: toolDeclarations as any }],
              },
            })
          );

          const executedTools: any[] = [];
          let loops = 0;

          while (response.functionCalls && response.functionCalls.length > 0 && loops < 4) {
            loops++;
            const call = response.functionCalls[0];
            const toolResult = await executeAgentTool(call.name || "", (call.args as any) || {});
            executedTools.push({ name: call.name || "", args: call.args, result: toolResult });

            // Update context based on tool execution
            const res = toolResult as any;
            if (call.name === "checkEligibility" && res.calculatedAge) {
              currentCtx.stage = "ELIGIBILITY_EVALUATED";
              currentCtx.grade = res.grade;
              currentCtx.calculatedAge = res.calculatedAge.formatted;
              currentCtx.isEligible = res.eligible;
            } else if (call.name === "getRequiredDocuments") {
              currentCtx.stage = "DOCUMENTS_REVIEWED";
            } else if (call.name === "submitAdmissionLead" && res.referenceNumber) {
              currentCtx.stage = "REGISTERED";
              currentCtx.referenceNumber = res.referenceNumber;
            }

            formattedContents.push({
              role: "model",
              parts: (response.candidates?.[0]?.content?.parts as any) || [{ functionCall: call }],
            });

            formattedContents.push({
              role: "user",
              parts: [
                {
                  functionResponse: {
                    name: call.name,
                    response: { result: toolResult },
                  },
                },
              ],
            });

            response = await withTimeout(
              ai.models.generateContent({
                model: modelName,
                contents: formattedContents,
                config: {
                  systemInstruction: buildSystemInstruction(currentCtx),
                  temperature: 0.3,
                  tools: [{ functionDeclarations: toolDeclarations as any }],
                },
              })
            );
          }

          const reply = response.text || "Thank you. Please let me know how else I can assist your admission inquiry.";

          return NextResponse.json({
            reply,
            sessionContext: {
              ...currentCtx,
              language: isHindi ? "hi" : "en",
            },
            suggestedActions: isHindi
              ? [
                  currentCtx.grade ? `${currentCtx.grade} के दस्तावेज` : "आवश्यक दस्तावेज",
                  "उम्र पात्रता जांचें",
                  "एडमिशन फॉर्म भरें",
                ]
              : generateSuggestedActions(currentCtx),
            executedTools,
            referenceNumber: currentCtx.referenceNumber,
          });
        } catch (err: any) {
          console.warn(`Gemini model ${modelName} note:`, err.message);
          if (err.message && (err.message.includes('UNAUTHENTICATED') || err.message.includes('API key not valid') || err.message.includes('401') || err.message.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED'))) {
            break;
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. BILINGUAL CONTINUITY ROUTER & USER JOURNEY STATE MACHINE
    // ─────────────────────────────────────────────────────────────
    const rawLower = trimmedMsg.toLowerCase();
    const lower = rawLower.replace(/addmission|admision|admisn/g, "admission");
    const executedTools: any[] = [];

    // ROUTE 0: APPLICATION RESUME & LOOKUP BY REFERENCE ID OR PHONE
    if (
      currentCtx.referenceNumber ||
      (currentCtx.phone &&
        currentCtx.stage === "DISCOVERY" &&
        (lower.includes("status") || lower.includes("track") || lower.includes("application") || lower.trim() === currentCtx.phone))
    ) {
      const queryParam = currentCtx.referenceNumber || currentCtx.phone || "";
      const statusRes = await checkApplicationStatus(queryParam);
      executedTools.push({ name: "checkApplicationStatus", args: { queryParam }, result: statusRes });

      if (statusRes.found && statusRes.records?.length) {
        const primary = statusRes.records[0];
        currentCtx.studentName = primary.studentName || currentCtx.studentName;
        currentCtx.grade = primary.grade || currentCtx.grade;
        currentCtx.referenceNumber = primary.referenceNumber || currentCtx.referenceNumber;
        currentCtx.phone = primary.phone || currentCtx.phone;
        currentCtx.stage = "REGISTERED";

        if (isHindi) {
          return NextResponse.json({
            reply:
              `नमस्ते! 🙏 हमें आपके रिकॉर्ड की जानकारी मिल गई है:\n\n` +
              `• **रेफरेंस नंबर (Ref No):** \`${primary.referenceNumber}\`\n` +
              `• **छात्र का नाम:** ${primary.studentName}\n` +
              `• **कक्षा:** ${primary.grade}\n` +
              `• **आवेदन स्थिति (Status):** ${primary.status === "VERIFIED" ? "सत्यापित (Verified)" : "सक्रिय / विचाराधीन (Active / In Review)"}\n` +
              `• **पंजीकृत तिथि:** ${primary.createdDate ? primary.createdDate.slice(0, 10) : "2026"}\n\n` +
              `हमारी एडमिशन टीम आपसे जल्द ही संपर्क करेगी। क्या आप एडमिशन फॉर्म डाउनलोड करना चाहते हैं या किसी अन्य बच्चे के लिए नया दाखिला आवेदन करना चाहते हैं?`,
            sessionContext: currentCtx,
            suggestedActions: ["एडमिशन फॉर्म डाउनलोड करें (PDF)", "अन्य बच्चे का एडमिशन करें", "स्कूल का समय व पता"],
            executedTools,
            referenceNumber: primary.referenceNumber,
          });
        }

        return NextResponse.json({
          reply:
            `Namaste! 🙏 We found your active admission inquiry record:\n\n` +
            `• **Reference Number:** \`${primary.referenceNumber}\`\n` +
            `• **Student Name:** ${primary.studentName}\n` +
            `• **Class:** ${primary.grade}\n` +
            `• **Application Status:** ${primary.status === "VERIFIED" ? "Verified" : "Active / In Review"}\n` +
            `• **Submission Date:** ${primary.createdDate ? primary.createdDate.slice(0, 10) : "2026"}\n\n` +
            `Our admissions desk will contact you regarding next steps. Would you like to download the admission form PDF or register another child?`,
          sessionContext: currentCtx,
          suggestedActions: ["Download Admission Form (PDF)", "Register Another Child", "School Timings & Location"],
          executedTools,
          referenceNumber: primary.referenceNumber,
        });
      }
    }

    // Intent detections
    const isAskingProcedure = /kaise\s*hoga|kaise\s*hota\s*hai|process|procedure|steps|kaise\s*kare|kaise\s*karwaye|tarika|process\s*kya\s*hai|admission\s*process/i.test(lower);
    const isAskingDocuments = /kya\s*(?:kya\s*)?dena\s*hoga|kya\s*dena\s*hoga|kya\s*chahiye|documents|dastavez|kagaz|papers|tc|marksheet|apaar|transfer\s*certificate/i.test(lower);
    const isAskingFees = /fees?|kitna\s*lagega|kharcha|charges|shulk|fee\s*structure/i.test(lower);
    const hasLeadProgress = Boolean(currentCtx.studentName || currentCtx.phone || currentCtx.parentName || currentCtx.fatherName);

    // ROUTE 1: COMPOUND ADMISSION INQUIRY (Turn 1: Grade + Locality + Procedure + Documents)
    if (
      currentCtx.grade &&
      !currentCtx.referenceNumber &&
      !hasLeadProgress &&
      (isAskingProcedure || isAskingDocuments || Boolean(currentCtx.address) || lower.includes("admission") || lower.includes("dakhila"))
    ) {
      currentCtx.stage = "COLLECTING_DETAILS";
      const grade = currentCtx.grade;
      const docData = getRequiredDocuments(grade);
      executedTools.push({ name: "getRequiredDocuments", args: { grade }, result: docData });

      if (isHindi) {
        let reply = `नमस्ते! 🙏 **सर्वदा मॉडर्न सेकेंडरी स्कूल** (CBSE 1104340) में **${grade}** में एडमिशन के लिए आपका हार्दिक स्वागत है।\n\n`;

        if (currentCtx.address) {
          reply += `📍 **विद्यालय का स्थान (Location):**\nहमारा विद्यालय **सादतपुर एक्सटेंशन, करावल नगर रोड (सुक्कार बाजार, गली नं. 1)** में ही स्थित है, जो **${currentCtx.address}** के बिल्कुल निकट है।\n\n`;
        }

        reply += `### 1️⃣ एडमिशन प्रक्रिया (Admission Procedure — कैसे होगा?):\n`;
        reply += `1. **पंजीकरण:** छात्र व अभिभावक का प्राथमिक विवरण दर्ज कर सीट इनक्वायरी बनाई जाती है।\n`;
        reply += `2. **दस्तावेज सत्यापन:** आप विद्यालय कैंपस आकर मूल दस्तावेजों की जांच करवाते हैं।\n`;
        reply += `3. **प्रवेश पुष्टि व रोल नंबर:** सत्यापन के बाद फॉर्म सबमिट कर छात्र का प्रवेश सुनिश्चित कर दिया जाता है।\n\n`;

        reply += `### 2️⃣ ${grade} के लिए जरूरी दस्तावेज (Documents — क्या-क्या देना होगा?):\n`;
        docData.documents.forEach((d, i) => {
          reply += `${i + 1}. **${d.title}**\n`;
        });

        reply += `\nप्रक्रिया शुरू करने के लिए कृपया **बच्चे का नाम** और अपना **10 अंकों का मोबाइल नंबर** बताएं ताकि हमारे एडमिशन विभाग से आपकी सीट सुरक्षित की जा सके:`;

        return NextResponse.json({
          reply,
          sessionContext: currentCtx,
          suggestedActions: ["छात्र का नाम दर्ज करें", "उम्र पात्रता जांचें", "स्कूल का समय व पता"],
          executedTools,
        });
      }

      let reply = `Namaste! 🙏 Welcome to **Sarvada Modern Secondary School** (CBSE 1104340) for **${grade}** admissions.\n\n`;
      if (currentCtx.address) {
        reply += `📍 **Campus Proximity:**\nOur campus is situated on **Sadatpur Extension, Karawal Nagar Road**, right near **${currentCtx.address}**.\n\n`;
      }
      reply += `### 1️⃣ Admission Procedure (Step-by-step):\n`;
      reply += `1. **Inquiry & Registration:** Record applicant student and parent details.\n`;
      reply += `2. **Campus Visit & Verification:** Verify original documents at our admissions desk.\n`;
      reply += `3. **Enrollment Confirmation:** Complete enrollment and admission confirmation.\n\n`;
      reply += `### 2️⃣ Required Documents for ${grade}:\n`;
      docData.documents.forEach((d, i) => {
        reply += `${i + 1}. **${d.title}** — ${d.desc}\n`;
      });
      reply += `\nTo begin registration, please share your **Child's Full Name** and **10-digit Mobile Number**:`;

      return NextResponse.json({
        reply,
        sessionContext: currentCtx,
        suggestedActions: ["Register Admission Inquiry", "Check Age Eligibility", "School Timings & Location"],
        executedTools,
      });
    }

    // ROUTE 2: REGISTRATION & LEAD CAPTURE STATE MACHINE (Handles all multi-field inputs and multi-turn)
    if (
      currentCtx.stage === "COLLECTING_DETAILS" ||
      hasLeadProgress ||
      lower.includes("register") ||
      lower.includes("apply") ||
      lower.includes("admission lena") ||
      lower.includes("form bharna") ||
      lower.includes("dakhila lena") ||
      (lower.includes("yes") && currentCtx.stage === "DOCUMENTS_REVIEWED")
    ) {
      currentCtx.stage = "COLLECTING_DETAILS";

      // Step A: Missing Grade
      if (!currentCtx.grade) {
        return NextResponse.json({
          reply: isHindi
            ? `दाखिला पंजीकरण शुरू करने के लिए कृपया बताएं कि आप **किस कक्षा (Class)** में एडमिशन लेना चाहते हैं? (जैसे: Nursery, LKG, UKG, Class 1st, Class 6th, Class 7th):`
            : `To begin registration, please specify which **Class / Grade** you are seeking admission for (e.g. Nursery, LKG, UKG, Class 1st, Class 6th, Class 7th):`,
          sessionContext: currentCtx,
          suggestedActions: isHindi ? ["Nursery", "Class 1st", "Class 6th"] : ["Nursery", "Class 1st", "Class 6th"],
          executedTools,
        });
      }

      // Step B: Missing Student Name
      if (!currentCtx.studentName) {
        return NextResponse.json({
          reply: isHindi
            ? `**सर्वदा मॉडर्न सेकेंडरी स्कूल** में **${currentCtx.grade}** के लिए दाखिला पंजीकरण:\n\n1. कृपया **छात्र / छात्रा का पूरा नाम (Student's Full Name)** बताएं:`
            : `Admission registration for **${currentCtx.grade}** at **Sarvada Modern Secondary School**:\n\n1. Please provide the **Student's Full Name**:`,
          sessionContext: currentCtx,
          suggestedActions: isHindi ? ["छात्र का नाम दर्ज करें"] : ["Enter Student Name"],
          executedTools,
        });
      }

      // Step C: Missing Parent Name
      if (!currentCtx.parentName && !currentCtx.fatherName) {
        let ackText = `छात्र का नाम **${currentCtx.studentName}**`;
        if (currentCtx.phone) {
          ackText += ` और मोबाइल नंबर **${currentCtx.phone}**`;
        }
        return NextResponse.json({
          reply: isHindi
            ? `बहुत बढ़िया! ${ackText} नोट कर लिया गया है।\n\nकृपया **पिता या माता का पूरा नाम (Father's or Mother's Full Name)** बताएं ताकि आपका एडमिशन फॉर्म पूरा हो सके:`
            : `Great! Noted student **${currentCtx.studentName}**${currentCtx.phone ? ` and mobile **${currentCtx.phone}**` : ""}.\n\nPlease provide the **Father's or Mother's Full Name**:`,
          sessionContext: currentCtx,
          suggestedActions: isHindi ? ["पिता/माता का नाम लिखें"] : ["Enter Parent Name"],
          executedTools,
        });
      }

      // Step D: Missing or Invalid 10-digit Phone Number
      if (!currentCtx.phone || !/^[6-9]\d{9}$/.test(currentCtx.phone)) {
        return NextResponse.json({
          reply: isHindi
            ? `छात्र: **${currentCtx.studentName}** | अभिभावक: **${currentCtx.fatherName || currentCtx.parentName}**\n\nएडमिशन अपडेट और स्कूल वेरिफिकेशन के लिए कृपया अपना **10 अंकों का मोबाइल नंबर** दर्ज करें:`
            : `Student: **${currentCtx.studentName}** | Parent: **${currentCtx.fatherName || currentCtx.parentName}**\n\nPlease enter your **10-digit Mobile Number** for admission updates & verification:`,
          sessionContext: currentCtx,
          suggestedActions: isHindi ? ["10 अंकों का मोबाइल नंबर दर्ज करें"] : ["Enter 10-digit Mobile Number"],
          executedTools,
        });
      }

      // Step E: All 4 fields ready! CHECKING FILTER: Prevent duplicate student vs sibling registration
      const phone = currentCtx.phone;
      const studentName = currentCtx.studentName;
      const parentName = currentCtx.fatherName || currentCtx.parentName || "";
      const grade = currentCtx.grade;

      const existingLeads = await findExistingLeads(phone);
      const duplicateStudent = existingLeads.find(
        (r) => (r.studentName || "").toLowerCase().trim() === studentName.toLowerCase().trim()
      );

      // If duplicate student on this phone, resume existing inquiry without duplicate lead!
      if (duplicateStudent && duplicateStudent.referenceNumber) {
        currentCtx.stage = "REGISTERED";
        currentCtx.referenceNumber = duplicateStudent.referenceNumber;

        if (isHindi) {
          return NextResponse.json({
            reply:
              `नमस्ते **${parentName}** जी! आपके मोबाइल नंबर **${phone}** पर **${studentName}** (${duplicateStudent.grade || grade}) का एडमिशन रिकॉर्ड पहले से दर्ज है।\n\n` +
              `• **रेफरेंस नंबर (Ref No):** \`${duplicateStudent.referenceNumber}\`\n` +
              `• **स्थिति:** ${duplicateStudent.status === "VERIFIED" ? "सत्यापित" : "सक्रिय / विचाराधीन"}\n\n` +
              `आपकी इंक्वायरी पहले से हमारे एडमिशन रिकॉर्ड में सुरक्षित है। हमारा एडमिशन विभाग अगले 24 कार्य घंटों में आपसे संपर्क करेगा।`,
            sessionContext: currentCtx,
            suggestedActions: ["एडमिशन फॉर्म डाउनलोड करें (PDF)", "स्कूल का समय व पता", "स्थिति जांचें"],
            executedTools,
            referenceNumber: duplicateStudent.referenceNumber,
          });
        }

        return NextResponse.json({
          reply:
            `Welcome back, **${parentName}**! We found an existing admission record for **${studentName}** (${duplicateStudent.grade || grade}) under mobile **${phone}**.\n\n` +
            `• **Reference Number:** \`${duplicateStudent.referenceNumber}\`\n` +
            `• **Status:** ${duplicateStudent.status === "VERIFIED" ? "Verified" : "Active / In Review"}\n\n` +
            `Your application is already logged in our portal. Our admissions desk will call you shortly.`,
          sessionContext: currentCtx,
          suggestedActions: ["Download Admission Form (PDF)", "School Timings & Location", "Check Status"],
          executedTools,
          referenceNumber: duplicateStudent.referenceNumber,
        });
      }

      // Sibling / Fresh student submission:
      const siblingRecord = existingLeads.find((r) => r.phone === phone);
      const isSibling = Boolean(siblingRecord);

      const leadRes = await submitAdmissionLead({
        studentName,
        parentName,
        fatherName: currentCtx.fatherName || parentName,
        motherName: currentCtx.motherName || "",
        phone,
        grade,
        dob: currentCtx.dob,
        address: currentCtx.address || "",
        siblingName: isSibling ? siblingRecord.studentName : undefined,
        siblingClass: isSibling ? siblingRecord.grade : undefined,
        notes: isSibling ? `Sibling of ${siblingRecord.studentName} (${siblingRecord.grade})` : trimmedMsg,
        source: "AI_Counselor_Journey",
      });

      executedTools.push({ name: "submitAdmissionLead", args: { phone, grade, studentName }, result: leadRes });

      currentCtx.stage = "REGISTERED";
      currentCtx.referenceNumber = leadRes.referenceNumber;

      const asksNextStepOrDocs = /aur\s*kuch\s*chahiye|kya\s*chahiye|proces\s*karo|process\s*karo|agla|kya\s*dena\s*hoga|kaise\s*hoga/i.test(lower);
      const docData = getRequiredDocuments(grade);

      if (isHindi) {
        let reply = `🎉 **${grade} के लिए एडमिशन इंक्वायरी सफलतापूर्वक दर्ज हो गई है!**\n\n`;
        reply += `• **रेफरेंस नंबर (Ref No):** \`${leadRes.referenceNumber}\`\n`;
        reply += `• **छात्र का नाम:** ${studentName}\n`;
        reply += `• **पिता का नाम:** ${currentCtx.fatherName || parentName}\n`;
        if (currentCtx.motherName) reply += `• **माता का नाम:** ${currentCtx.motherName}\n`;
        reply += `• **कक्षा:** ${grade}\n`;
        reply += `• **मोबाइल नंबर:** ${phone}\n`;
        if (currentCtx.address) reply += `• **क्षेत्र / पता:** ${currentCtx.address}\n`;
        if (isSibling) reply += `• *(सहोदर रिकॉर्ड से संबद्ध: ${siblingRecord.studentName} - ${siblingRecord.grade})*\n`;
        reply += `\n**सर्वदा मॉडर्न सेकेंडरी स्कूल** में रुचि दिखाने के लिए धन्यवाद। हमारा एडमिशन विभाग अगले 24 कार्य घंटों में आपसे संपर्क करेगा।\n\n`;

        if (asksNextStepOrDocs) {
          reply += `📋 **अगला कदम एवं आवश्यक दस्तावेज (Next Steps & Documents):**\n`;
          reply += `आपने पूछा था *"और कुछ चाहिए तो बताओ"* — जी हाँ, स्कूल वेरिफिकेशन के समय निम्नलिखित दस्तावेज तैयार रखें:\n`;
          docData.documents.forEach((d, i) => {
            reply += `${i + 1}. **${d.title}**\n`;
          });
          reply += `\n`;
        }

        reply += `📍 **कैंपस विजिट व दस्तावेज सत्यापन:**\n`;
        reply += `आप किसी भी कार्य दिवस (सोमवार से शनिवार, प्रातः 8:00 से दोपहर 2:30 बजे) विद्यालय कार्यालय आकर दस्तावेज सत्यापन करवा सकते हैं:\n`;
        reply += `**A/18 गली नं. 1, सुक्कार बाजार, सादतपर एक्सटेंशन, करावल नगर रोड, नई दिल्ली — 110094**\n`;
        reply += `हेल्पलाइन: **${SCHOOL_INFO.phoneDisplay}**`;

        return NextResponse.json({
          reply,
          sessionContext: currentCtx,
          suggestedActions: ["एडमिशन फॉर्म डाउनलोड करें (PDF)", "स्कूल का समय व पता", "मुख्य पृष्ठ"],
          executedTools,
          referenceNumber: leadRes.referenceNumber,
        });
      }

      let reply = `🎉 **Admission Inquiry Registered Successfully!**\n\n`;
      reply += `• **Reference Number:** \`${leadRes.referenceNumber}\`\n`;
      reply += `• **Student Name:** ${studentName}\n`;
      reply += `• **Father's Name:** ${currentCtx.fatherName || parentName}\n`;
      if (currentCtx.motherName) reply += `• **Mother's Name:** ${currentCtx.motherName}\n`;
      reply += `• **Class:** ${grade}\n`;
      reply += `• **Contact Number:** ${phone}\n`;
      if (currentCtx.address) reply += `• **Locality / Address:** ${currentCtx.address}\n`;
      if (isSibling) reply += `• *(Linked to sibling record: ${siblingRecord.studentName} - ${siblingRecord.grade})*\n`;
      reply += `\nThank you for registering with **Sarvada Modern Secondary School**. Our admissions desk will call you within 24 business hours.\n\n`;

      if (asksNextStepOrDocs) {
        reply += `📋 **Required Documents for Campus Verification:**\n`;
        docData.documents.forEach((d, i) => {
          reply += `${i + 1}. **${d.title}** — ${d.desc}\n`;
        });
        reply += `\n`;
      }

      reply += `📍 **Campus Visit & Verification:**\n`;
      reply += `You may visit our school admissions counter Monday to Saturday between 8:00 AM – 2:30 PM:\n`;
      reply += `**A/18 Gali No. 1, Sukkar Bazar, Sadatpur Extn., Karawal Nagar Road, New Delhi — 110094**\n`;
      reply += `Helpline: **${SCHOOL_INFO.phoneDisplay}**`;

      return NextResponse.json({
        reply,
        sessionContext: currentCtx,
        suggestedActions: ["Download Admission Form (PDF)", "School Timings & Location", "Track Application Status"],
        executedTools,
        referenceNumber: leadRes.referenceNumber,
      });
    }

    // ROUTE 3: AGE ELIGIBILITY CHECK
    if (
      currentCtx.dob ||
      lower.includes("eligible") ||
      lower.includes("age") ||
      lower.includes("born") ||
      lower.includes("dob") ||
      lower.includes("umra") ||
      lower.includes("umr") ||
      lower.includes("patrata")
    ) {
      if (currentCtx.dob) {
        const gradeToTest = currentCtx.grade || "Nursery";
        const result = checkEligibility(currentCtx.dob, gradeToTest, sessionYear);
        executedTools.push({ name: "checkEligibility", args: { dob: currentCtx.dob, grade: gradeToTest }, result });

        currentCtx.stage = "ELIGIBILITY_EVALUATED";
        currentCtx.grade = result.grade;
        currentCtx.calculatedAge = result.calculatedAge.formatted;
        currentCtx.isEligible = result.eligible;

        if (isHindi) {
          const reply =
            `**उम्र पात्रता मूल्यांकन (DOE Delhi Guidelines)**\n\n` +
            `• **जांची गई कक्षा:** ${result.grade}\n` +
            `• **31 मार्च ${sessionYear} को उम्र:** ${result.calculatedAge.formatted}\n` +
            `• **निर्धारित मानदंड:** ${result.requiredCriteria}\n` +
            `• **स्थिति:** ${result.eligible ? "✅ **योग्य (Eligible)**" : "⚠️ **अपात्र (Not Eligible)**"}\n\n` +
            `${result.eligible ? "आपका बच्चा इस कक्षा के लिए पूरी तरह योग्य है।" : result.message}\n` +
            `\nक्या आप **${result.grade}** के लिए आवश्यक दस्तावेज देखना चाहते हैं या एडमिशन इंक्वायरी रजिस्टर करना चाहते हैं?`;

          return NextResponse.json({
            reply,
            sessionContext: currentCtx,
            suggestedActions: [`${result.grade} के दस्तावेज`, "एडमिशन फॉर्म भरें", "कार्यालय का पता"],
            executedTools,
          });
        }

        const reply =
          `**Age Eligibility Assessment (DOE Delhi Guidelines)**\n\n` +
          `• **Class Evaluated:** ${result.grade}\n` +
          `• **Age as on 31st March ${sessionYear}:** ${result.calculatedAge.formatted}\n` +
          `• **Required Criteria:** ${result.requiredCriteria}\n` +
          `• **Verdict:** ${result.eligible ? "✅ **Eligible**" : "⚠️ **Not Eligible**"}\n\n` +
          `${result.message}\n` +
          (result.suggestion ? `\n💡 ${result.suggestion}\n` : "") +
          `\nWould you like to review the required documents for **${result.grade}**, or shall we register your admission inquiry?`;

        return NextResponse.json({
          reply,
          sessionContext: currentCtx,
          suggestedActions: generateSuggestedActions(currentCtx),
          executedTools,
        });
      } else {
        if (isHindi) {
          return NextResponse.json({
            reply:
              `दिल्ली शिक्षा निदेशालय (DOE) के नियमों के अनुसार उम्र पात्रता जांचने के लिए, ` +
              `कृपया बच्चे की **जन्मतिथि (DD-MM-YYYY)** और वह **कक्षा (Class)** बताएं जिसमें आप दाखिला लेना चाहते हैं।`,
            sessionContext: currentCtx,
            suggestedActions: ["Nursery (Age 3+)", "LKG (Age 4+)", "Class 1st (Age 6+)", "Class 2nd to 9th"],
            executedTools,
          });
        }

        return NextResponse.json({
          reply:
            `To check your child's age eligibility under Directorate of Education (DOE) Delhi rules, ` +
            `please share their **Date of Birth (DD-MM-YYYY)** and the **Class** you wish to apply for.`,
          sessionContext: currentCtx,
          suggestedActions: ["Nursery (Age 3+)", "LKG (Age 4+)", "Class 1st (Age 6+)", "Class 2nd to 9th"],
          executedTools,
        });
      }
    }

    // ROUTE 4: REQUIRED DOCUMENTS
    if (
      lower.includes("document") ||
      lower.includes("kya chahiye") ||
      lower.includes("papers") ||
      lower.includes("tc") ||
      lower.includes("transfer certificate") ||
      lower.includes("marksheet") ||
      lower.includes("apaar") ||
      lower.includes("dastavez") ||
      lower.includes("kagaz")
    ) {
      const grade = currentCtx.grade || (lower.includes("2") || lower.includes("3") || lower.includes("4") || lower.includes("5") || lower.includes("6") || lower.includes("7") || lower.includes("8") || lower.includes("9") ? "Class 2nd to 9th" : "Nursery");
      const docData = getRequiredDocuments(grade);
      executedTools.push({ name: "getRequiredDocuments", args: { grade }, result: docData });

      currentCtx.stage = "DOCUMENTS_REVIEWED";

      if (isHindi) {
        let reply = `📋 **${docData.category} के लिए आवश्यक दस्तावेज (Mandatory Documents):**\n\n`;
        docData.documents.forEach((d, i) => {
          reply += `${i + 1}. **${d.title}** — ${d.desc}\n`;
        });
        reply += `\n**ध्यान देने योग्य बातें:**\n`;
        docData.specialNotes.forEach((n) => {
          reply += `• ${n}\n`;
        });
        reply += `\nक्या आप अभी अपनी एडमिशन इंक्वायरी रजिस्टर करना चाहेंगे?`;

        return NextResponse.json({
          reply,
          sessionContext: currentCtx,
          suggestedActions: ["हाँ, एडमिशन दर्ज करें", "उम्र पात्रता जांचें", "स्कूल का समय व पता"],
          executedTools,
        });
      }

      let reply = `📋 **Mandatory Documents Required for ${docData.category}:**\n\n`;
      docData.documents.forEach((d, i) => {
        reply += `${i + 1}. **${d.title}** — ${d.desc}\n`;
      });
      reply += `\n**Important Points to Note:**\n`;
      docData.specialNotes.forEach((n) => {
        reply += `• ${n}\n`;
      });
      reply += `\nWould you like me to register your admission inquiry now?`;

      return NextResponse.json({
        reply,
        sessionContext: currentCtx,
        suggestedActions: generateSuggestedActions(currentCtx),
        executedTools,
      });
    }

    // ROUTE 5: FEES & FEE STRUCTURE
    if (isAskingFees) {
      if (isHindi) {
        let reply = `💰 **सर्वदा मॉडर्न सेकेंडरी स्कूल — फीस संरचना (Fee Structure):**\n\n`;
        reply += `हमारा विद्यालय दिल्ली शिक्षा निदेशालय (DOE) एवं CBSE के दिशा-निर्देशों के अनुरूप अत्यंत किफायती एवं पारदर्शी शुल्क संरचना प्रदान करता है:\n\n`;
        reply += `• **प्री-प्राइमरी (Nursery, LKG, UKG):** बुनियादी विकास, एक्टिविटी-आधारित लर्निंग व स्मार्ट क्लासरूम।\n`;
        reply += `• **प्राइमरी (Class 1st से 5th):** संपूर्ण शैक्षणिक पाठ्यक्रम, कंप्यूटर लैब व खेलकूद गतिविधियां।\n`;
        reply += `• **मिडिल व सेकेंडरी (Class 6th से 10th):** CBSE बोर्ड तैयारी, साइंस लैब, डिजिटल स्मार्ट क्लासरूम व एक्स्ट्रा-करिकुलर।\n\n`;
        reply += `💡 **विशेष रियायतें (Concessions):**\n`;
        reply += `• सगे भाई/बहन (Sibling Concession) के लिए विशेष छूट उपलब्ध है।\n`;
        reply += `• मेधावी छात्रों के लिए मेरिट सहायता।\n\n`;
        if (currentCtx.grade) {
          reply += `**${currentCtx.grade}** के सटीक शुल्क विवरण के लिए आप विद्यालय कार्यालय आ सकते हैं या अपना नाम व मोबाइल नंबर बताएं ताकि एडमिशन टीम आपको विवरण प्रदान कर सके।`;
        } else {
          reply += `सटीक कक्षा-वार शुल्क विवरण के लिए कृपया बताएं कि आप **किस कक्षा** की फीस जानना चाहते हैं?`;
        }

        return NextResponse.json({
          reply,
          sessionContext: currentCtx,
          suggestedActions: ["आवश्यक दस्तावेज", "एडमिशन इंक्वायरी दर्ज करें", "स्कूल का समय व पता"],
          executedTools,
        });
      }

      let reply = `💰 **Sarvada Modern Secondary School — Fee Structure:**\n\n`;
      reply += `Our school maintains an affordable and transparent fee structure in full compliance with Directorate of Education (DOE) Delhi guidelines:\n\n`;
      reply += `• **Pre-Primary (Nursery, LKG, UKG):** Foundation learning, smart classrooms, activities.\n`;
      reply += `• **Primary (Class 1st to 5th):** Core CBSE curriculum, computer lab, sports & creative arts.\n`;
      reply += `• **Middle & Secondary (Class 6th to 10th):** Science lab, CBSE board prep, interactive smart boards.\n\n`;
      reply += `💡 **Concessions & Support:**\n`;
      reply += `• Sibling concession available for brothers/sisters enrolled concurrently.\n`;
      reply += `• Academic merit support.\n\n`;
      if (currentCtx.grade) {
        reply += `For the exact fee breakdown for **${currentCtx.grade}**, please share your contact number or visit our school accounts counter (Mon–Sat, 8:00 AM – 2:30 PM).`;
      } else {
        reply += `Please let me know which **Class** you are inquiring about for the exact breakdown.`;
      }

      return NextResponse.json({
        reply,
        sessionContext: currentCtx,
        suggestedActions: ["Required Documents", "Register Inquiry", "Office Timings & Location"],
        executedTools,
      });
    }

    // ROUTE 6: 100-POINT PRE-SCHOOL CRITERIA
    if (
      lower.includes("point") ||
      lower.includes("distance") ||
      lower.includes("criteria") ||
      lower.includes("sibling") ||
      lower.includes("door") ||
      lower.includes("doori")
    ) {
      if (isHindi) {
        let reply = `⭐ **प्री-स्कूल एडमिशन के लिए 100-पॉइंट क्राइटेरिया:**\n\n`;
        POINTS_CRITERIA.forEach((item) => {
          reply += `• **${item.criterion}:** ${item.points} Points (${item.desc})\n`;
        });
        reply += `\nअपना स्कोर जानने के लिए स्कूल से अपने घर की दूरी (KM में) बताएं!`;

        return NextResponse.json({
          reply,
          sessionContext: currentCtx,
          suggestedActions: ["दूरी 0-3 KM (60 Pts)", "भाई/बहन स्कूल में है (20 Pts)", "उम्र पात्रता जांचें"],
          executedTools,
        });
      }

      let reply = `⭐ **Point Criteria for Pre-School Admissions (Total: 100 Points):**\n\n`;
      POINTS_CRITERIA.forEach((item) => {
        reply += `• **${item.criterion}:** ${item.points} Points (${item.desc})\n`;
      });
      reply += `\nTell me your distance from the school campus (in KM) to calculate your score!`;

      return NextResponse.json({
        reply,
        sessionContext: currentCtx,
        suggestedActions: ["Distance 0-3 KM (60 Pts)", "Sibling in School (20 Pts)", "Check Age Eligibility"],
        executedTools,
      });
    }

    // ROUTE 7: STATUS CHECK
    if (lower.includes("status") || lower.includes("track") || lower.includes("sms-adm")) {
      const refMatch = trimmedMsg.match(/SMS-ADM-\d{4}-\d+/i);
      const queryParam = refMatch ? refMatch[0] : "";
      if (queryParam) {
        const statusRes = await checkApplicationStatus(queryParam);
        if (statusRes.found && statusRes.records) {
          const rec = statusRes.records[0] as any;
          if (isHindi) {
            return NextResponse.json({
              reply:
                `📋 **रेफरेंस \`${rec.referenceNumber || queryParam}\` की स्थिति:**\n\n` +
                `• **छात्र:** ${rec.studentName}\n` +
                `• **कक्षा:** ${rec.grade}\n` +
                `• **स्थिति:** **${rec.status || "NEW"}**\n` +
                `• **रजिस्ट्रेशन दिनांक:** ${rec.createdDate ? new Date(rec.createdDate).toLocaleDateString() : "Recent"}\n\n` +
                `हमारा एडमिशन विभाग आवेदनों की समीक्षा कर रहा है। आप हमें सीधे **${SCHOOL_INFO.phoneDisplay}** पर भी कॉल कर सकते हैं।`,
              sessionContext: currentCtx,
              suggestedActions: ["स्कूल का समय व पता", "एडमिशन फॉर्म डाउनलोड करें"],
              executedTools,
            });
          }

          return NextResponse.json({
            reply:
              `📋 **Inquiry Status for \`${rec.referenceNumber || queryParam}\`:**\n\n` +
              `• **Student:** ${rec.studentName}\n` +
              `• **Class:** ${rec.grade}\n` +
              `• **Status:** **${rec.status || "NEW"}**\n` +
              `• **Date Registered:** ${rec.createdDate ? new Date(rec.createdDate).toLocaleDateString() : "Recent"}\n\n` +
              `Our admissions team is reviewing applications. You can also call us directly at **${SCHOOL_INFO.phoneDisplay}**.`,
            sessionContext: currentCtx,
            suggestedActions: ["Office Timings & Location", "Download Admission Form"],
            executedTools,
          });
        }
      }
      return NextResponse.json({
        reply: isHindi
          ? "अपनी एप्लीकेशन का स्टेटस जानने के लिए कृपया अपना **रेफरेंस नंबर** बताएं (जैसे `SMS-ADM-2026-XXXX`)।"
          : "To check your application status, please provide your **Reference Number** (e.g. `SMS-ADM-2026-XXXX`).",
        sessionContext: currentCtx,
        suggestedActions: isHindi ? ["एडमिशन जानकारी"] : ["Back to Admissions"],
        executedTools,
      });
    }

    // ROUTE 8: CAMPUS, TIMINGS, CONTACT
    if (
      lower.includes("time") ||
      lower.includes("timing") ||
      lower.includes("address") ||
      lower.includes("where") ||
      lower.includes("kahan") ||
      lower.includes("samay") ||
      lower.includes("pata") ||
      lower.includes("contact") ||
      lower.includes("phone")
    ) {
      if (isHindi) {
        return NextResponse.json({
          reply:
            `🏫 **सर्वदा मॉडर्न सेकेंडरी स्कूल**\n\n` +
            `• **पता:** A/18 गली नं. 1, सुक्कार बाजार, सादतपर एक्सटेंशन, करावल नगर रोड, नई दिल्ली — 110094\n` +
            `• **कार्यालय समय:** सोमवार से शनिवार, प्रातः 8:00 से दोपहर 2:30 बजे तक\n` +
            `• **संपर्क नंबर:** +91 99994 39422\n` +
            `• **CBSE मान्यता संख्या:** स्कूल आईडी 1104340\n\n` +
            `क्या आप उम्र पात्रता जांचना चाहते हैं या एडमिशन इंक्वायरी रजिस्टर करना चाहते हैं?`,
          sessionContext: currentCtx,
          suggestedActions: ["उम्र पात्रता जांचें", "दस्तावेज क्या चाहिए?", "एडमिशन इंक्वायरी दर्ज करें"],
          executedTools,
        });
      }

      return NextResponse.json({
        reply:
          `🏫 **Sarvada Modern Secondary School**\n\n` +
          `• **Address:** A/18 Gali No. 1, Sukkar Bazar, Sadatpur Extn., Karawal Nagar Road, New Delhi — 110094\n` +
          `• **Office Timings:** Monday to Saturday, 8:00 AM – 2:30 PM\n` +
          `• **Contact Number:** +91 99994 39422\n` +
          `• **CBSE Affiliation:** School ID 1104340\n\n` +
          `Would you like to check age eligibility or register for admission?`,
        sessionContext: currentCtx,
        suggestedActions: ["Check Age Eligibility", "What documents are required?", "Register Admission Inquiry"],
        executedTools,
      });
    }

    // ANTI-AMNESIA GUARD: If partial context exists, NEVER show generic welcome greeting!
    if (currentCtx.grade || currentCtx.studentName || currentCtx.phone || currentCtx.parentName || currentCtx.fatherName) {
      currentCtx.stage = "COLLECTING_DETAILS";

      if (isHindi) {
        let ack = `नमस्ते! 🙏 **सर्वदा मॉडर्न सेकेंडरी स्कूल** में `;
        if (currentCtx.grade) ack += `**${currentCtx.grade}** `;
        if (currentCtx.studentName) ack += `छात्र **${currentCtx.studentName}** `;
        ack += `के एडमिशन संदर्भ में:\n\n`;

        if (!currentCtx.studentName) {
          ack += `कृपया **छात्र / छात्रा का पूरा नाम (Student's Full Name)** बताएं:`;
        } else if (!currentCtx.parentName && !currentCtx.fatherName) {
          ack += `कृपया **पिता या माता का नाम (Father's or Mother's Name)** बताएं:`;
        } else if (!currentCtx.phone || !/^[6-9]\d{9}$/.test(currentCtx.phone)) {
          ack += `कृपया अपना **10 अंकों का मोबाइल नंबर** दर्ज करें:`;
        } else {
          ack += `क्या आप फॉर्म सबमिट कर अपना एडमिशन रेफरेंस नंबर जारी करवाना चाहते हैं?`;
        }

        return NextResponse.json({
          reply: ack,
          sessionContext: currentCtx,
          suggestedActions: ["हाँ, फॉर्म पूरा करें", "आवश्यक दस्तावेज", "स्कूल का समय व पता"],
          executedTools,
        });
      }

      let ack = `Namaste! 🙏 Regarding admission `;
      if (currentCtx.grade) ack += `for **${currentCtx.grade}** `;
      if (currentCtx.studentName) ack += `for student **${currentCtx.studentName}** `;
      ack += `at **Sarvada Modern Secondary School**:\n\n`;

      if (!currentCtx.studentName) {
        ack += `Please share the **Student's Full Name**:`;
      } else if (!currentCtx.parentName && !currentCtx.fatherName) {
        ack += `Please share the **Father's or Mother's Full Name**:`;
      } else if (!currentCtx.phone || !/^[6-9]\d{9}$/.test(currentCtx.phone)) {
        ack += `Please provide your **10-digit Mobile Number**:`;
      } else {
        ack += `Would you like to finalize and submit your admission registration?`;
      }

      return NextResponse.json({
        reply: ack,
        sessionContext: currentCtx,
        suggestedActions: ["Submit Inquiry", "Required Documents", "Timings & Location"],
        executedTools,
      });
    }

    // DEFAULT ROUTE: CLEAN & WELCOMING (BILINGUAL) — ONLY WHEN CONTEXT IS COMPLETELY EMPTY
    if (isHindi) {
      return NextResponse.json({
        reply:
          `नमस्ते! 🙏 **सर्वदा मॉडर्न सेकेंडरी स्कूल** (CBSE 1104340) में आपका स्वागत है।\n\n` +
          `मैं आपका **AI एडमिशन काउंसलर** हूँ। आप अपने बच्चे के लिए किस **कक्षा (Class)** में दाखिला लेना चाहते हैं या उनकी **जन्मतिथि (DOB)** बताएं ताकि मैं तुरंत पूरी सहायता कर सकूँ!`,
        sessionContext: currentCtx,
        suggestedActions: ["उम्र पात्रता जांचें", "आवश्यक दस्तावेज", "स्कूल का समय व पता"],
        executedTools,
      });
    }

    return NextResponse.json({
      reply:
        `Namaste! 🙏 Welcome to **Sarvada Modern Secondary School**.\n\n` +
        `How can I help you today? Please tell me which **Class** you are interested in or share your child's **Date of Birth** to get started.`,
      sessionContext: currentCtx,
      suggestedActions: generateSuggestedActions(currentCtx),
      executedTools,
    });
  } catch (error: any) {
    console.error("Admission agent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process inquiry" },
      { status: 500 }
    );
  }
}
