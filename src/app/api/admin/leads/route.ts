import { NextResponse } from "next/server";
import { db, ensureAuth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  where,
  limit,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/leads
 * Query params:
 * - status: 'all' | 'NEW' | 'CONTACTED' | 'VERIFIED' | 'ENROLLED' | 'REJECTED'
 * - days: number of days to analyze (default 30)
 */
export async function GET(req: Request) {
  try {
    await ensureAuth();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "all";

    const leadsQuery = query(
      collection(db, "admissions_leads"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(leadsQuery);
    const allLeads = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));

    // Calculate Dashboard Analytics
    const total = allLeads.length;
    const newCount = allLeads.filter((l) => !l.status || l.status === "NEW").length;
    const contactedCount = allLeads.filter((l) => l.status === "CONTACTED").length;
    const verifiedCount = allLeads.filter((l) => l.status === "VERIFIED").length;
    const enrolledCount = allLeads.filter((l) => l.status === "ENROLLED").length;
    const notInterestedCount = allLeads.filter((l) => l.status === "NOT_INTERESTED").length;
    const rejectedCount = allLeads.filter((l) => l.status === "REJECTED").length;
    const crmSyncedCount = allLeads.filter((l) => Boolean(l.skool24Synced)).length;
    const crmPendingCount = total - crmSyncedCount;

    const conversionRate = total > 0 ? ((enrolledCount / total) * 100).toFixed(1) : "0.0";

    // Grade / Class Distribution
    const classDistribution: Record<string, number> = {};
    for (const lead of allLeads) {
      const g = lead.grade || "Unspecified";
      classDistribution[g] = (classDistribution[g] || 0) + 1;
    }

    // Source Distribution (AI Counselor vs Web Forms)
    const sourceDistribution: Record<string, number> = {};
    for (const lead of allLeads) {
      const s = lead.source || "Website_Form";
      sourceDistribution[s] = (sourceDistribution[s] || 0) + 1;
    }

    // Today's Follow-up Worklist (Pending leads created more than 4 hours ago or in CONTACTED state)
    const now = Date.now();
    const todayFollowUps = allLeads
      .filter((l) => l.status === "NEW" || l.status === "CONTACTED")
      .map((l) => {
        let createdTime = now;
        if (l.createdAt?.seconds) {
          createdTime = l.createdAt.seconds * 1000;
        } else if (l.createdDate) {
          createdTime = new Date(l.createdDate).getTime();
        }
        const hoursElapsed = Math.max(0, Math.round((now - createdTime) / (1000 * 60 * 60)));
        const isOverdue = hoursElapsed >= 24;

        return {
          ...l,
          hoursElapsed,
          isOverdue,
          suggestedAction:
            l.status === "NEW"
              ? isOverdue
                ? "Urgent: First Call Overdue"
                : "Initial Discovery Call"
              : "Campus Visit Follow-up",
        };
      })
      .sort((a, b) => b.hoursElapsed - a.hoursElapsed);

    // Filter leads if specific status requested
    const filteredLeads =
      statusFilter === "all"
        ? allLeads
        : allLeads.filter((l) => (l.status || "NEW").toUpperCase() === statusFilter.toUpperCase());

    return NextResponse.json({
      success: true,
      summary: {
        total,
        new: newCount,
        contacted: contactedCount,
        verified: verifiedCount,
        enrolled: enrolledCount,
        notInterested: notInterestedCount,
        rejected: rejectedCount,
        crmSynced: crmSyncedCount,
        crmPending: crmPendingCount,
        conversionRate: `${conversionRate}%`,
        pendingFollowUpsToday: todayFollowUps.length,
        overdueFollowUps: todayFollowUps.filter((f) => f.isOverdue).length,
      },
      classDistribution,
      sourceDistribution,
      todayFollowUps,
      leads: filteredLeads,
    });
  } catch (error: any) {
    console.error("Failed to fetch leads analytics:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/leads
 * Update lead status, assign counselor, or log follow-up actions
 */
export async function PATCH(req: Request) {
  try {
    await ensureAuth();

    const body = await req.json();
    const { leadId, status, followUpNote, counselorName, nextFollowUpDate } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "Missing leadId" },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
      lastFollowUpAt: new Date().toISOString(),
    };

    if (status) updates.status = status;
    if (counselorName) updates.counselorName = counselorName;
    if (nextFollowUpDate) updates.nextFollowUpDate = nextFollowUpDate;
    if (followUpNote) {
      updates.lastNote = followUpNote;
      updates.notes = updates.notes
        ? `${updates.notes}\n[${new Date().toLocaleDateString()}]: ${followUpNote}`
        : `[${new Date().toLocaleDateString()}]: ${followUpNote}`;
    }

    await updateDoc(doc(db, "admissions_leads", leadId), updates);

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully",
      updates,
    });
  } catch (error: any) {
    console.error("Failed to update lead:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}
