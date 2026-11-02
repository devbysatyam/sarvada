import { NextResponse } from "next/server";
import { db, ensureAuth } from "@/lib/firebase";
import { type AdminSection, type AdminRole, getDefaultPermissions } from "@/lib/rbac";

/**
 * PATCH /api/admin/users/[uid]
 * Update an admin user's role, permissions, or active status
 * Next.js 16: params is now a Promise
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    await ensureAuth();
    const { uid } = await params;
    const body = await req.json();
    const { role, permissions, isActive, displayName } = body;

    const { collection, query, where, getDocs, updateDoc } = await import("firebase/firestore");
    const q = query(collection(db, "adminUsers"), where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    const docRef = snapshot.docs[0].ref;
    const updates: Record<string, any> = {};

    if (role !== undefined) {
      const validRoles: AdminRole[] = ["superadmin", "editor", "department_head", "viewer"];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = role;
      // If role changes but no explicit permissions, reset to role defaults
      if (permissions === undefined) {
        updates.permissions = getDefaultPermissions(role);
      }
    }

    if (permissions !== undefined) updates.permissions = permissions as AdminSection[];
    if (isActive !== undefined) updates.isActive = isActive;
    if (displayName !== undefined) updates.displayName = displayName;

    await updateDoc(docRef, updates);
    return NextResponse.json({ success: true, uid });
  } catch (error: any) {
    console.error("Failed to update admin user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[uid]
 * Deactivates (soft-delete) an admin user — does NOT delete Firebase Auth user
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    await ensureAuth();
    const { uid } = await params;
    const { collection, query, where, getDocs, updateDoc } = await import("firebase/firestore");
    const q = query(collection(db, "adminUsers"), where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 });
    }

    await updateDoc(snapshot.docs[0].ref, { isActive: false });
    return NextResponse.json({ success: true, uid, deactivated: true });
  } catch (error: any) {
    console.error("Failed to deactivate admin user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
