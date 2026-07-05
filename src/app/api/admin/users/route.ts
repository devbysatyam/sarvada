import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDefaultPermissions, type AdminRole, type AdminSection } from "@/lib/rbac";

/**
 * GET /api/admin/users
 * Returns all admin users from Firestore adminUsers collection
 * Only accessible to authenticated admins (RBAC enforced via Firestore rules)
 */
export async function GET() {
  try {
    const q = query(collection(db, "adminUsers"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }));
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Create a new admin user entry in Firestore
 * Firebase Auth user must already exist (created manually in Firebase Console or via Admin SDK)
 * Body: { uid, email, displayName, role, permissions? }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, displayName, role, permissions, createdBy } = body;

    if (!uid || !email || !role) {
      return NextResponse.json({ error: "uid, email, and role are required" }, { status: 400 });
    }

    const validRoles: AdminRole[] = ["superadmin", "editor", "department_head", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const effectivePermissions: AdminSection[] = permissions || getDefaultPermissions(role as AdminRole);

    await addDoc(collection(db, "adminUsers"), {
      uid,
      email,
      displayName: displayName || email.split("@")[0],
      role,
      permissions: effectivePermissions,
      isActive: true,
      createdBy: createdBy || "system",
      createdAt: serverTimestamp(),
      lastLogin: null,
    });

    return NextResponse.json({ success: true, uid });
  } catch (error: any) {
    console.error("Failed to create admin user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
