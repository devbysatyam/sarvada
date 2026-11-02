import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
  defaultTemplateName?: string;
  isEnabled: boolean;
  autoFollowupHours: number; // e.g. 24 hours
  schoolHelpNumber?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
  fallbackUrl?: string;
  simulated?: boolean;
}

/**
 * Normalizes phone numbers to standard 12-digit Indian format (91XXXXXXXXXX)
 */
export function formatIndianPhoneNumber(rawPhone: string): string {
  const digits = (rawPhone || "").replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }
  // Default fallback if already has country code or non-standard length
  return digits;
}

/**
 * Loads WhatsApp configuration from Firestore (or fallback environment variables)
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const envConfig: WhatsAppConfig = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
    defaultTemplateName: process.env.WHATSAPP_DEFAULT_TEMPLATE || "admission_followup_reminder",
    isEnabled: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
    autoFollowupHours: Number(process.env.WHATSAPP_AUTO_FOLLOWUP_HOURS) || 24,
    schoolHelpNumber: "+91 99994 39422",
  };

  try {
    const snap = await getDoc(doc(db, "settings", "whatsapp"));
    if (snap.exists()) {
      const data = snap.data();
      return {
        phoneNumberId: data.phoneNumberId || envConfig.phoneNumberId,
        accessToken: data.accessToken || envConfig.accessToken,
        businessAccountId: data.businessAccountId || envConfig.businessAccountId,
        defaultTemplateName: data.defaultTemplateName || envConfig.defaultTemplateName,
        isEnabled: data.isEnabled ?? envConfig.isEnabled,
        autoFollowupHours: data.autoFollowupHours || envConfig.autoFollowupHours,
        schoolHelpNumber: data.schoolHelpNumber || envConfig.schoolHelpNumber,
      };
    }
  } catch (err: any) {
    console.warn("Could not read Firestore whatsapp settings, using env config:", err.message);
  }

  return envConfig;
}

/**
 * Saves WhatsApp configuration to Firestore
 */
export async function saveWhatsAppConfig(config: Partial<WhatsAppConfig>): Promise<void> {
  await setDoc(
    doc(db, "settings", "whatsapp"),
    {
      ...config,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Generates formatted WhatsApp follow-up text for a lead based on template choice
 */
export function generateLeadMessage(
  lead: {
    studentName?: string;
    parentName?: string;
    grade?: string;
    referenceNumber?: string;
    phone?: string;
  },
  templateKey: "welcome" | "docs" | "fees" | "reminder" | "enrolled" | "custom",
  customText?: string
): string {
  const parent = lead.parentName || "Parent";
  const student = lead.studentName || "your child";
  const grade = lead.grade || "the applied grade";
  const ref = lead.referenceNumber ? ` (Ref ID: ${lead.referenceNumber})` : "";
  const cleanGrade = (lead.grade || "").toLowerCase();
  const isNurToFirst =
    cleanGrade.includes("nur") ||
    cleanGrade.includes("lkg") ||
    cleanGrade.includes("ukg") ||
    cleanGrade.includes("1st") ||
    cleanGrade.includes("class 1");

  if (templateKey === "custom" && customText) {
    return customText
      .replace(/{studentName}/gi, student)
      .replace(/{parentName}/gi, parent)
      .replace(/{grade}/gi, grade)
      .replace(/{referenceNumber}/gi, lead.referenceNumber || "");
  }

  switch (templateKey) {
    case "welcome":
      return (
        `Namaste ${parent} ji! 🙏\n\n` +
        `Greetings from *Sarvada Modern Secondary School*, Sadatpur, Karawal Nagar, Delhi.\n\n` +
        `We received your admission inquiry for *${student}* for *${grade}*${ref}.\n\n` +
        `🏫 Our school campus is open Monday to Saturday from 8:00 AM to 2:30 PM for campus tours, syllabus counseling, and document verification.\n\n` +
        `📍 Address: Karawal Nagar Road, Sadatpur Extn, Delhi-110094\n` +
        `📞 School Helpline: +91 99994 39422\n\n` +
        `Please let us know what date or time is convenient for your campus visit!`
      );

    case "docs":
      return (
        `Namaste ${parent} ji! 🙏\n\n` +
        `Here is the official *Document Checklist* required for admission of *${student}* in *${grade}*:\n\n` +
        (isNurToFirst
          ? `1. Child's Original Birth Certificate (Municipal Corp / Panchayat)\n` +
            `2. Student's Aadhaar Card (Copy)\n` +
            `3. Both Parents' Aadhaar Cards & 2 Photos each\n` +
            `4. Category Certificate (SC/ST/OBC) if applicable\n` +
            `5. Sibling Fee Receipt (if sibling is already studying at Sarvada)\n`
          : `1. Original Transfer Certificate (T.C. / SLC)\n` +
            `2. Previous Class Marksheet / Report Card\n` +
            `3. Student's Aadhaar Card & APAAR / PEN ID\n` +
            `4. Both Parents' Aadhaar Cards & 2 Photos each\n` +
            `5. Category Certificate (if applicable)\n`) +
        `\nPlease carry original documents for verification at the admission desk.\n\n` +
        `Helpline: +91 99994 39422 · Sarvada Modern Secondary School`
      );

    case "fees":
      return (
        `Namaste ${parent} ji! 🙏\n\n` +
        `Thank you for inquiring about admission for *${student}* (*${grade}*) at *Sarvada Modern Secondary School*.\n\n` +
        `🕒 School Timings: 8:00 AM to 1:40 PM\n` +
        `🚌 Safe Van & Transport Facility: Available across Sadatpur, Karawal Nagar, Khajuri, Sonia Vihar, Bhajanpura, and nearby areas.\n` +
        `💻 Digital Smart Classes, Composite Science Lab, Sports Ground & CBSE Curriculum.\n\n` +
        `Kindly visit the school counter or call +91 99994 39422 for fee installment options and scholarship assistance.`
      );

    case "reminder":
    default:
      return (
        `Namaste ${parent} ji! 🙏\n\n` +
        `This is a gentle reminder regarding the admission inquiry for *${student}* in *${grade}* at *Sarvada Modern Secondary School*.\n\n` +
        `Limited seats are remaining for Academic Session 2026-27.\n\n` +
        `We would love to welcome ${student} to our school family. Kindly confirm your campus visit this week to reserve the seat and complete document verification.\n\n` +
        `Admission Helpline: +91 99994 39422 (Mon-Sat, 8:00 AM - 2:30 PM)`
      );

    case "enrolled":
      return (
        `Congratulations ${parent} ji! 🎉🎓\n\n` +
        `We are delighted to confirm that admission for *${student}* in *${grade}* is completed at *Sarvada Modern Secondary School*.\n\n` +
        `Admission Ref ID: ${lead.referenceNumber || ""}\n\n` +
        `Welcome to the Sarvada family! Books and uniform distribution schedule and orientation dates will be shared with you shortly.\n\n` +
        `Helpline: +91 99994 39422 · Sarvada Modern Secondary School (Est. 1972 · CBSE Affiliation 1104340)`
      );
  }
}

/**
 * Sends a single WhatsApp message using Meta WhatsApp Cloud API (v21.0)
 * Falls back to wa.me URL if credentials are not configured
 */
export async function sendWhatsAppMessage(
  rawPhone: string,
  messageText: string,
  options: {
    templateName?: string;
    templateLanguage?: string;
    templateParameters?: string[];
  } = {}
): Promise<SendWhatsAppResult> {
  const formattedPhone = formatIndianPhoneNumber(rawPhone);
  const fallbackUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;

  const config = await getWhatsAppConfig();

  // If Cloud API credentials are not provided, provide fallback URL for staff
  if (!config.phoneNumberId || !config.accessToken) {
    return {
      success: false,
      error: "WhatsApp Cloud API credentials not configured in settings. Use WhatsApp Web link.",
      fallbackUrl,
    };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;

    // Construct Payload
    let payload: Record<string, any>;

    if (options.templateName) {
      // Send approved Meta template
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "template",
        template: {
          name: options.templateName,
          language: { code: options.templateLanguage || "en" },
          components: options.templateParameters?.length
            ? [
                {
                  type: "body",
                  parameters: options.templateParameters.map((param) => ({
                    type: "text",
                    text: param,
                  })),
                },
              ]
            : undefined,
        },
      };
    } else {
      // Send regular text message
      payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "text",
        text: {
          preview_url: false,
          body: messageText,
        },
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg = data.error?.message || "Meta WhatsApp API returned an error";
      console.warn("Meta WhatsApp API Error:", data.error);
      return {
        success: false,
        error: errorMsg,
        fallbackUrl,
      };
    }

    const messageId = data.messages?.[0]?.id;
    return {
      success: true,
      messageId,
      fallbackUrl,
    };
  } catch (err: any) {
    console.error("WhatsApp Send Exception:", err);
    return {
      success: false,
      error: err.message || "Network error sending WhatsApp message",
      fallbackUrl,
    };
  }
}

/**
 * Bulk Dispatch Engine: Sends WhatsApp messages in paced batches to prevent rate limits
 */
export async function sendBulkWhatsApp(
  leads: Array<{
    id: string;
    studentName: string;
    parentName: string;
    grade: string;
    phone: string;
    referenceNumber?: string;
    notes?: string;
  }>,
  templateKey: "welcome" | "docs" | "fees" | "reminder" | "enrolled" | "custom",
  customText?: string
): Promise<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    leadId: string;
    studentName: string;
    phone: string;
    success: boolean;
    error?: string;
    fallbackUrl?: string;
  }>;
}> {
  const results: Array<{
    leadId: string;
    studentName: string;
    phone: string;
    success: boolean;
    error?: string;
    fallbackUrl?: string;
  }> = [];

  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    const messageText = generateLeadMessage(lead, templateKey, customText);
    const result = await sendWhatsAppMessage(lead.phone, messageText);

    if (result.success) {
      sent++;
      // Update Firestore lead record with follow-up note & timestamp
      try {
        const timestampStr = new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
        const noteEntry = `[${timestampStr} - WhatsApp Automation]: Sent "${templateKey}" reminder message.`;
        const existingNotes = lead.notes ? `${lead.notes}\n${noteEntry}` : noteEntry;

        await updateDoc(doc(db, "admissions_leads", lead.id), {
          workStatus: "WORK_DONE",
          lastWhatsAppSentAt: new Date().toISOString(),
          lastFollowUpAt: new Date().toISOString(),
          lastNote: `WhatsApp reminder sent (${templateKey})`,
          notes: existingNotes,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn(`Could not update lead ${lead.id} with WhatsApp note:`, err);
      }
    } else {
      failed++;
    }

    results.push({
      leadId: lead.id,
      studentName: lead.studentName,
      phone: lead.phone,
      success: result.success,
      error: result.error,
      fallbackUrl: result.fallbackUrl,
    });

    // Pacing delay (100ms) to respect API rate-limits
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    total: leads.length,
    sent,
    failed,
    results,
  };
}
