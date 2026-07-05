"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRBAC, PermissionGuard } from "@/context/RBACContext";
import {
  ROLE_LABELS,
  ROLE_BADGE_STYLES,
  ROLE_DEFAULTS,
  SECTION_LABELS,
  getDefaultPermissions,
  type AdminRole,
  type AdminSection,
  type AdminUser,
} from "@/lib/rbac";

const ALL_SECTIONS: AdminSection[] = [
  "notice_board", "news_events", "timetable", "calendar",
  "gallery", "admissions", "compliance", "staff", "results",
  "feedback", "user_management", "email_settings",
];

const ROLES: AdminRole[] = ["superadmin", "editor", "department_head", "viewer"];

interface AdminUserRecord extends AdminUser {
  docId?: string;
  lastLogin?: any;
  createdAt?: any;
}

export default function UserManagementPage() {
  return (
    <PermissionGuard section="user_management">
      <UserManagementContent />
    </PermissionGuard>
  );
}

function UserManagementContent() {
  const { adminUser: currentUser, isSuperAdmin } = useRBAC();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Add user form
  const [addForm, setAddForm] = useState({
    uid: "", email: "", displayName: "", role: "editor" as AdminRole, permissions: getDefaultPermissions("editor"),
  });

  // Edit user form
  const [editForm, setEditForm] = useState({
    role: "editor" as AdminRole,
    permissions: [] as AdminSection[],
    displayName: "",
    isActive: true,
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time listener for admin users
  useEffect(() => {
    const q = query(collection(db, "adminUsers"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ docId: d.id, ...d.data() } as AdminUserRecord));
      setUsers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openEdit = (u: AdminUserRecord) => {
    setEditingUser(u);
    setEditForm({
      role: u.role,
      permissions: u.permissions || [],
      displayName: u.displayName,
      isActive: u.isActive !== false,
    });
  };

  const handleRoleChange = (role: AdminRole) => {
    setAddForm(f => ({ ...f, role, permissions: getDefaultPermissions(role) }));
  };

  const handleEditRoleChange = (role: AdminRole) => {
    setEditForm(f => ({ ...f, role, permissions: getDefaultPermissions(role) }));
  };

  const togglePermission = (section: AdminSection, isAdd: boolean) => {
    if (isAdd) {
      setAddForm(f => ({
        ...f,
        permissions: f.permissions.includes(section)
          ? f.permissions.filter(p => p !== section)
          : [...f.permissions, section],
      }));
    } else {
      setEditForm(f => ({
        ...f,
        permissions: f.permissions.includes(section)
          ? f.permissions.filter(p => p !== section)
          : [...f.permissions, section],
      }));
    }
  };

  const handleAddUser = async () => {
    if (!addForm.uid.trim() || !addForm.email.trim()) {
      showToast("UID and email are required", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, createdBy: currentUser?.uid }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("Admin user added successfully!");
      setIsAddModalOpen(false);
      setAddForm({ uid: "", email: "", displayName: "", role: "editor", permissions: getDefaultPermissions("editor") });
    } catch (e: any) {
      showToast(e.message || "Failed to add user", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast("User updated successfully!");
      setEditingUser(null);
    } catch (e: any) {
      showToast(e.message || "Failed to update user", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: AdminUserRecord) => {
    if (u.uid === currentUser?.uid) {
      showToast("You cannot deactivate your own account", "error");
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${u.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      showToast(u.isActive ? "User deactivated" : "User reactivated");
    } catch (e: any) {
      showToast(e.message || "Failed to update user", "error");
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "Never";
    if (ts.toDate) return ts.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return "—";
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 shadow-lg border ${
          toast.type === "success"
            ? "bg-surface-container-lowest border-primary text-on-surface"
            : "bg-error-container border-error text-error"
        }`}>
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="font-body-sm text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-sm text-primary text-xl uppercase tracking-widest">User Management</h2>
          <p className="font-body-sm text-on-surface-variant text-sm mt-1">
            Manage admin access and role-based permissions for the portal
          </p>
        </div>
        {isSuperAdmin() && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 hover:bg-secondary transition-all font-label-caps text-xs uppercase tracking-widest"
          >
            <span className="material-symbols-outlined">person_add</span>
            Add Admin User
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {ROLES.map(role => {
          const count = users.filter(u => u.role === role && u.isActive).length;
          return (
            <div key={role} className="bg-surface-container-lowest border border-surface-variant p-5 text-center">
              <div className="text-2xl font-bold font-mono text-primary">{count}</div>
              <div className={`inline-block mt-2 font-label-caps text-[9px] px-2 py-0.5 border rounded uppercase tracking-wider ${ROLE_BADGE_STYLES[role]}`}>
                {ROLE_LABELS[role]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-surface-container-lowest border border-surface-variant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant">
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">User</th>
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Role</th>
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Permissions</th>
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Last Login</th>
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant font-body-sm text-on-surface">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-on-surface-variant text-sm">
                  No admin users found. Add one to get started.
                </td></tr>
              ) : users.map(u => (
                <tr key={u.uid} className={`hover:bg-surface-container-low transition-colors ${!u.isActive ? "opacity-50" : ""}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                      </div>
                      <div>
                        <div className="font-medium text-on-surface text-sm">{u.displayName}</div>
                        <div className="text-xs text-on-surface-variant">{u.email}</div>
                        {u.uid === currentUser?.uid && (
                          <span className="font-label-caps text-[8px] text-primary uppercase tracking-wider">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`font-label-caps text-[9px] px-2 py-1 border rounded uppercase tracking-wider ${ROLE_BADGE_STYLES[u.role]}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(u.permissions || []).slice(0, 4).map(p => (
                        <span key={p} className="font-label-caps text-[8px] px-1.5 py-0.5 bg-surface-container border border-surface-variant text-on-surface-variant uppercase tracking-wide rounded">
                          {SECTION_LABELS[p]}
                        </span>
                      ))}
                      {(u.permissions || []).length > 4 && (
                        <span className="font-label-caps text-[8px] px-1.5 py-0.5 text-on-surface-variant">
                          +{(u.permissions || []).length - 4} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-on-surface-variant">{formatDate(u.lastLogin)}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 font-label-caps text-[9px] uppercase tracking-wider px-2 py-1 border ${
                      u.isActive
                        ? "border-primary text-primary"
                        : "border-surface-variant text-on-surface-variant"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-primary" : "bg-surface-variant"}`}></span>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-1">
                    {isSuperAdmin() && (
                      <>
                        <button
                          onClick={() => openEdit(u)}
                          className="text-on-surface-variant hover:text-primary transition-colors p-1.5 border border-transparent hover:border-surface-variant"
                          title="Edit permissions"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`transition-colors p-1.5 border border-transparent hover:border-surface-variant ${
                            u.isActive ? "text-on-surface-variant hover:text-error" : "text-on-surface-variant hover:text-primary"
                          }`}
                          title={u.isActive ? "Deactivate user" : "Reactivate user"}
                        >
                          <span className="material-symbols-outlined text-[18px]">{u.isActive ? "person_off" : "person"}</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add User Modal ─────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-surface-variant">
            <div className="p-6 border-b border-surface-variant flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-primary uppercase tracking-widest">Add Admin User</h3>
                <p className="font-body-sm text-on-surface-variant text-xs mt-1">
                  User must already exist in Firebase Auth. Enter their UID from Firebase Console.
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Firebase UID (required) */}
              <div className="bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <p className="font-bold mb-1">📋 How to find the Firebase UID:</p>
                <p>Firebase Console → Authentication → Users → Click the user → copy the UID</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Firebase UID *</label>
                  <input
                    value={addForm.uid}
                    onChange={e => setAddForm(f => ({ ...f, uid: e.target.value }))}
                    placeholder="e.g. abc123XYZ..."
                    className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Email *</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="teacher@sarvadaschool.com"
                    className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Display Name</label>
                  <input
                    value={addForm.displayName}
                    onChange={e => setAddForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="e.g. Ms. Sharma"
                    className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Role</label>
                  <select
                    value={addForm.role}
                    onChange={e => handleRoleChange(e.target.value as AdminRole)}
                    className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm text-sm appearance-none"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>

              {/* Permissions grid */}
              <div className="space-y-3">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Section Permissions (customize defaults)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_SECTIONS.map(section => (
                    <label key={section} className="flex items-center gap-2 cursor-pointer group">
                      <div
                        onClick={() => togglePermission(section, true)}
                        className={`w-4 h-4 border-2 flex items-center justify-center transition-colors cursor-pointer ${
                          addForm.permissions.includes(section)
                            ? "bg-primary border-primary"
                            : "border-surface-variant group-hover:border-primary"
                        }`}
                      >
                        {addForm.permissions.includes(section) && (
                          <span className="material-symbols-outlined text-on-primary text-[12px]">check</span>
                        )}
                      </div>
                      <span className="font-body-sm text-sm text-on-surface">{SECTION_LABELS[section]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-surface-variant flex justify-end gap-3">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-3 border border-surface-variant hover:bg-surface-container transition-all font-label-caps text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary hover:bg-secondary transition-all font-label-caps text-xs uppercase tracking-widest disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                {saving ? "Adding..." : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-surface-variant">
            <div className="p-6 border-b border-surface-variant flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-primary uppercase tracking-widest">Edit User Permissions</h3>
                <p className="font-body-sm text-on-surface-variant text-xs mt-1">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Display Name</label>
                  <input
                    value={editForm.displayName}
                    onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                    className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Role</label>
                  <select
                    value={editForm.role}
                    onChange={e => handleEditRoleChange(e.target.value as AdminRole)}
                    className="w-full px-3 py-3 bg-surface-container border border-surface-variant focus:border-primary outline-none font-body-sm text-sm appearance-none"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Section Permissions</label>
                  <button
                    onClick={() => setEditForm(f => ({ ...f, permissions: getDefaultPermissions(f.role) }))}
                    className="font-label-caps text-[9px] uppercase tracking-wider text-primary hover:underline"
                  >
                    Reset to role defaults
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_SECTIONS.map(section => (
                    <label key={section} className="flex items-center gap-2 cursor-pointer group">
                      <div
                        onClick={() => togglePermission(section, false)}
                        className={`w-4 h-4 border-2 flex items-center justify-center transition-colors cursor-pointer ${
                          editForm.permissions.includes(section)
                            ? "bg-primary border-primary"
                            : "border-surface-variant group-hover:border-primary"
                        }`}
                      >
                        {editForm.permissions.includes(section) && (
                          <span className="material-symbols-outlined text-on-primary text-[12px]">check</span>
                        )}
                      </div>
                      <span className="font-body-sm text-sm text-on-surface">{SECTION_LABELS[section]}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-surface-variant flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-6 py-3 border border-surface-variant hover:bg-surface-container transition-all font-label-caps text-xs uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-on-primary hover:bg-secondary transition-all font-label-caps text-xs uppercase tracking-widest disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How-to guide */}
      <div className="bg-surface-container-lowest border border-surface-variant p-6">
        <h4 className="font-label-caps text-[10px] text-secondary uppercase tracking-widest mb-4">How to Add a New Admin User</h4>
        <ol className="space-y-3">
          {[
            "Go to Firebase Console → Authentication → Users → Add User",
            "Enter the user's email and a temporary password",
            "Copy the UID shown in the users list",
            "Click \"Add Admin User\" above and paste the UID",
            "Set their role and permissions, then save",
            "Share the temporary password with the user — they can change it on next login",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-caps text-[10px] flex-shrink-0 mt-0.5">{i + 1}</span>
              <span className="font-body-sm text-sm text-on-surface-variant">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
