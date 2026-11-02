import { NextResponse } from "next/server";
import { ensureAuth } from "@/lib/firebase";
import { getWhatsAppConfig, saveWhatsAppConfig, WhatsAppConfig } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/whatsapp/config
 * Retrieves current WhatsApp settings (masks secret tokens for security)
 */
export async function GET() {
  try {
    await ensureAuth();
    const config = await getWhatsAppConfig();

    return NextResponse.json({
      success: true,
      config: {
        phoneNumberId: config.phoneNumberId || "",
        businessAccountId: config.businessAccountId || "",
        defaultTemplateName: config.defaultTemplateName || "admission_followup_reminder",
        isEnabled: config.isEnabled,
        autoFollowupHours: config.autoFollowupHours,
        schoolHelpNumber: config.schoolHelpNumber || "+91 99994 39422",
        hasAccessToken: Boolean(config.accessToken && config.accessToken.length > 5),
        // Mask token for UI display
        maskedAccessToken: config.accessToken
          ? `${config.accessToken.slice(0, 6)}...${config.accessToken.slice(-4)}`
          : "",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load WhatsApp config" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/whatsapp/config
 * Updates WhatsApp Cloud API credentials and preferences
 */
export async function POST(req: Request) {
  try {
    await ensureAuth();
    const body = await req.json();

    const updates: Partial<WhatsAppConfig> = {};

    if (body.phoneNumberId !== undefined) updates.phoneNumberId = body.phoneNumberId.trim();
    if (body.accessToken !== undefined && body.accessToken.trim() !== "") {
      updates.accessToken = body.accessToken.trim();
    }
    if (body.businessAccountId !== undefined) updates.businessAccountId = body.businessAccountId.trim();
    if (body.defaultTemplateName !== undefined) updates.defaultTemplateName = body.defaultTemplateName.trim();
    if (body.isEnabled !== undefined) updates.isEnabled = Boolean(body.isEnabled);
    if (body.autoFollowupHours !== undefined) updates.autoFollowupHours = Number(body.autoFollowupHours) || 24;
    if (body.schoolHelpNumber !== undefined) updates.schoolHelpNumber = body.schoolHelpNumber.trim();

    await saveWhatsAppConfig(updates);

    return NextResponse.json({
      success: true,
      message: "WhatsApp configuration updated successfully!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save WhatsApp config" },
      { status: 500 }
    );
  }
}
