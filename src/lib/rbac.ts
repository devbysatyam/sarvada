// ============================================================
// RBAC — Role-Based Access Control
// Sarvada Modern School Admin Portal
// ============================================================

export type AdminRole = "superadmin" | "editor" | "department_head" | "viewer";

export type AdminSection =
  | "notice_board"
  | "news_events"
  | "timetable"
  | "calendar"
  | "gallery"
  | "admissions"
  | "compliance"
  | "staff"
  | "results"
  | "feedback"
  | "user_management"
  | "email_settings";

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  permissions: AdminSection[];
  isActive: boolean;
  createdAt?: any;
  createdBy?: string;
  lastLogin?: any;
}

// ── Default permission sets per role ──────────────────────────
export const ROLE_DEFAULTS: Record<AdminRole, AdminSection[]> = {
  superadmin: [
    "notice_board",
    "news_events",
    "timetable",
    "calendar",
    "gallery",
    "admissions",
    "compliance",
    "staff",
    "results",
    "feedback",
    "user_management",
    "email_settings",
  ],
  editor: [
    "notice_board",
    "news_events",
    "calendar",
    "gallery",
    "timetable",
  ],
  department_head: [
    "notice_board",
    "news_events",
    "calendar",
    "results",
  ],
  viewer: [
    "notice_board",
    "news_events",
    "calendar",
    "gallery",
    "timetable",
    "admissions",
    "compliance",
    "staff",
    "results",
    "feedback",
  ],
};

// Roles that have write access by default (viewers are read-only)
const READ_ONLY_ROLES: AdminRole[] = ["viewer"];

// ── Human-readable labels ─────────────────────────────────────
export const SECTION_LABELS: Record<AdminSection, string> = {
  notice_board: "Notice Board",
  news_events: "News & Events",
  timetable: "Timetable",
  calendar: "Calendar",
  gallery: "Gallery",
  admissions: "Admissions",
  compliance: "Compliance",
  staff: "Staff",
  results: "Results",
  feedback: "Parent Feedback",
  user_management: "User Management",
  email_settings: "Email Settings",
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  superadmin: "Super Admin",
  editor: "Editor",
  department_head: "Department Head",
  viewer: "Viewer",
};

export const ROLE_BADGE_STYLES: Record<AdminRole, string> = {
  superadmin: "bg-purple-100 text-purple-800 border-purple-200",
  editor: "bg-blue-100 text-blue-800 border-blue-200",
  department_head: "bg-amber-100 text-amber-800 border-amber-200",
  viewer: "bg-gray-100 text-gray-600 border-gray-200",
};

// ── Permission helpers ────────────────────────────────────────

/** Check if a user has access to view a section */
export function hasPermission(user: AdminUser | null, section: AdminSection): boolean {
  if (!user || !user.isActive) return false;
  return user.permissions.includes(section);
}

/** Check if a user can perform write operations in a section */
export function canWrite(user: AdminUser | null, section: AdminSection): boolean {
  if (!user || !user.isActive) return false;
  if (READ_ONLY_ROLES.includes(user.role)) return false;
  return user.permissions.includes(section);
}

/** Check if a user is a superadmin */
export function isSuperAdmin(user: AdminUser | null): boolean {
  return user?.role === "superadmin" && user.isActive === true;
}

/** Get default permissions for a role */
export function getDefaultPermissions(role: AdminRole): AdminSection[] {
  return [...ROLE_DEFAULTS[role]];
}

// ── Nav item mapping ──────────────────────────────────────────
export const NAV_SECTION_MAP: Record<string, AdminSection> = {
  "/admin": "notice_board",
  "/admin/news": "news_events",
  "/admin/timetable": "timetable",
  "/admin/calendar": "calendar",
  "/admin/gallery": "gallery",
  "/admin/admissions": "admissions",
  "/admin/compliance": "compliance",
  "/admin/staff": "staff",
  "/admin/results": "results",
  "/admin/feedback": "feedback",
  "/admin/email-settings": "email_settings",
  "/admin/users": "user_management",
};
