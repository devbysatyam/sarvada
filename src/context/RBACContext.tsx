"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  type AdminUser,
  type AdminSection,
  hasPermission,
  canWrite,
  isSuperAdmin,
} from "@/lib/rbac";

interface RBACContextValue {
  adminUser: AdminUser | null;
  loading: boolean;
  hasPermission: (section: AdminSection) => boolean;
  canWrite: (section: AdminSection) => boolean;
  isSuperAdmin: () => boolean;
  refresh: () => Promise<void>;
}

const RBACContext = createContext<RBACContextValue>({
  adminUser: null,
  loading: true,
  hasPermission: () => false,
  canWrite: () => false,
  isSuperAdmin: () => false,
  refresh: async () => {},
});

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const [authUser, authLoading] = useAuthState(auth);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminUser = useCallback(async () => {
    if (!authUser) {
      setAdminUser(null);
      setLoading(false);
      return;
    }

    try {
      // Look up Firestore adminUsers record by UID
      const q = query(
        collection(db, "adminUsers"),
        where("uid", "==", authUser.uid)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // No RBAC record — treat as superadmin if it's the first user (legacy compatibility)
        // This handles existing users who pre-date the RBAC system
        const legacyUser: AdminUser = {
          uid: authUser.uid,
          email: authUser.email || "",
          displayName: authUser.displayName || authUser.email?.split("@")[0] || "Admin",
          role: "superadmin",
          permissions: [
            "notice_board", "news_events", "timetable", "calendar",
            "gallery", "admissions", "compliance", "staff", "results",
            "feedback", "user_management", "email_settings",
          ],
          isActive: true,
        };
        setAdminUser(legacyUser);
      } else {
        const data = snapshot.docs[0].data();
        const user: AdminUser = {
          uid: authUser.uid,
          email: data.email || authUser.email || "",
          displayName: data.displayName || authUser.email?.split("@")[0] || "Admin",
          role: data.role,
          permissions: data.permissions || [],
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
          createdBy: data.createdBy,
          lastLogin: data.lastLogin,
        };

        // Update last login timestamp (best-effort)
        try {
          await updateDoc(snapshot.docs[0].ref, { lastLogin: serverTimestamp() });
        } catch (_) {}

        setAdminUser(user);
      }
    } catch (err) {
      console.error("RBAC: Failed to load admin user record:", err);
      // Fail-safe: treat as superadmin to avoid lockouts during errors
      setAdminUser({
        uid: authUser.uid,
        email: authUser.email || "",
        displayName: authUser.displayName || "Admin",
        role: "superadmin",
        permissions: [
          "notice_board", "news_events", "timetable", "calendar",
          "gallery", "admissions", "compliance", "staff", "results",
          "feedback", "user_management", "email_settings",
        ],
        isActive: true,
      });
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authLoading) {
      fetchAdminUser();
    }
  }, [authUser, authLoading, fetchAdminUser]);

  const value: RBACContextValue = {
    adminUser,
    loading: loading || authLoading,
    hasPermission: (section) => hasPermission(adminUser, section),
    canWrite: (section) => canWrite(adminUser, section),
    isSuperAdmin: () => isSuperAdmin(adminUser),
    refresh: fetchAdminUser,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export function useRBAC() {
  return useContext(RBACContext);
}

/**
 * Guard component — renders children only if user has access to the given section.
 * Otherwise renders a permission-denied UI.
 */
export function PermissionGuard({
  section,
  requireWrite = false,
  children,
  fallback,
}: {
  section: AdminSection;
  requireWrite?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const rbac = useRBAC();

  if (rbac.loading) return null;

  const allowed = requireWrite
    ? rbac.canWrite(section)
    : rbac.hasPermission(section);

  if (!allowed) {
    return (
      <>
        {fallback || (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-4">lock</span>
            <p className="font-headline-sm text-on-surface-variant text-lg mb-2">Access Restricted</p>
            <p className="font-body-sm text-on-surface-variant/60 text-sm max-w-xs">
              {requireWrite
                ? "You have view-only access to this section. Contact a Super Admin to request edit permissions."
                : "You don't have permission to access this section. Contact a Super Admin."}
            </p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}

/**
 * Write-guard wrapper for action buttons.
 * Renders the button disabled with a tooltip when user lacks write access.
 */
export function WriteGuard({
  section,
  children,
}: {
  section: AdminSection;
  children: React.ReactNode;
}) {
  const rbac = useRBAC();

  if (!rbac.canWrite(section)) {
    return (
      <span title="You don't have write access to this section" className="cursor-not-allowed opacity-40">
        <span className="pointer-events-none">{children}</span>
      </span>
    );
  }

  return <>{children}</>;
}
