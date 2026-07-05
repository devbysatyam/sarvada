"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { RBACProvider, useRBAC } from "@/context/RBACContext";
import { ROLE_LABELS, ROLE_BADGE_STYLES, type AdminSection } from "@/lib/rbac";

// ── Inner layout (has access to RBAC context) ─────────────────
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const { adminUser, loading: rbacLoading, hasPermission } = useRBAC();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [user, loading, router, pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileSidebarOpen]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading || rbacLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const ALL_NAV_ITEMS = [
    { label: "Notice Board",    icon: "dashboard",       href: "/admin",               section: "notice_board"   as AdminSection, fill: true },
    { label: "News & Events",   icon: "event",           href: "/admin/news",           section: "news_events"    as AdminSection },
    { label: "Timetable",       icon: "schedule",        href: "/admin/timetable",      section: "timetable"      as AdminSection },
    { label: "Calendar",        icon: "calendar_month",  href: "/admin/calendar",       section: "calendar"       as AdminSection },
    { label: "Gallery",         icon: "collections",     href: "/admin/gallery",        section: "gallery"        as AdminSection },
    { label: "Admissions",      icon: "school",          href: "/admin/admissions",     section: "admissions"     as AdminSection },
    { label: "Compliance",      icon: "gavel",           href: "/admin/compliance",     section: "compliance"     as AdminSection },
    { label: "Staff",           icon: "group",           href: "/admin/staff",          section: "staff"          as AdminSection },
    { label: "Results",         icon: "assignment",      href: "/admin/results",        section: "results"        as AdminSection },
    { label: "Parent Feedback", icon: "rate_review",     href: "/admin/feedback",       section: "feedback"       as AdminSection },
    { label: "Email Automation",icon: "mark_email_read", href: "/admin/email-settings", section: "email_settings" as AdminSection },
    { label: "User Management", icon: "manage_accounts", href: "/admin/users",          section: "user_management" as AdminSection },
  ];

  const navItems = ALL_NAV_ITEMS.filter(item => hasPermission(item.section));
  const currentSection = navItems.find(n => n.href === pathname);
  const roleStyle = adminUser ? ROLE_BADGE_STYLES[adminUser.role] : "";
  const roleLabel = adminUser ? ROLE_LABELS[adminUser.role] : "Admin";

  // ── Shared sidebar content ─────────────────────────────────
  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-surface-variant flex-shrink-0">
        <Link href="/" className="font-display-sm text-primary block">Sarvada Admin</Link>
        <p className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant mt-1">Management Portal</p>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 min-h-0">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-3 rounded transition-colors font-body-sm ${
              pathname === item.href
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span
              className={`material-symbols-outlined flex-shrink-0 ${item.fill && pathname === item.href ? "symbol-fill" : ""}`}
            >
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User info + sign out — pinned to bottom */}
      <div className="border-t border-surface-variant flex-shrink-0">
        {adminUser && (
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-[18px]">person</span>
            </div>
            <div className="min-w-0">
              <p className="font-body-sm font-medium text-on-surface text-sm truncate">{adminUser.displayName}</p>
              <span className={`inline-block font-label-caps text-[9px] px-1.5 py-0.5 border rounded uppercase tracking-wider ${roleStyle}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        )}
        <div className="px-3 pb-4">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded text-error hover:bg-error-container transition-colors font-body-sm"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="w-64 bg-surface-container-lowest border-r border-surface-variant flex flex-col h-full flex-shrink-0 z-20 hidden md:flex">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ──────────────────────────── */}
      {/* Backdrop */}
      <div
        onClick={() => setMobileSidebarOpen(false)}
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity duration-300 ${
          mobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-surface-container-lowest border-r border-surface-variant flex flex-col z-40 md:hidden transition-transform duration-300 ease-in-out ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-surface-container transition-colors"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[22px]">close</span>
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Main Content Area ───────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-surface-container-lowest border-b border-surface-variant flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
          {/* Mobile: hamburger + title */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="p-2 text-on-surface-variant hover:bg-surface-container rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            <h1 className="font-headline-sm text-primary truncate">
              {currentSection?.label || "Dashboard"}
            </h1>
          </div>

          {/* Desktop: section title */}
          <div className="hidden md:block">
            <h2 className="font-headline-sm text-on-surface">
              {currentSection?.label || "Dashboard"}
            </h2>
            {adminUser?.role === "viewer" && (
              <p className="font-label-caps text-[9px] uppercase tracking-widest text-amber-600 mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">visibility</span>
                View-only access
              </p>
            )}
          </div>

          {/* Right: user info */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-3 border-l border-surface-variant pl-4 md:pl-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px] md:text-[22px]">person</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-body-sm font-medium text-on-surface text-sm line-clamp-1 max-w-[140px]">
                  {adminUser?.displayName || user.email}
                </p>
                <span className={`inline-block font-label-caps text-[8px] px-1.5 py-0.5 border rounded uppercase tracking-wider ${roleStyle}`}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 bg-background">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Outer layout (provides RBAC context) ─────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RBACProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </RBACProvider>
  );
}
