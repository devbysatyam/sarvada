"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [user, loading, router, pathname]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  // Don't wrap the login page in the dashboard layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { label: "Notice Board", icon: "dashboard", href: "/admin", fill: true },
    { label: "News & Events", icon: "event", href: "/admin/news" },
    { label: "Gallery", icon: "collections", href: "/admin/gallery" },
    { label: "Admissions", icon: "school", href: "/admin/admissions" },
    { label: "Compliance", icon: "gavel", href: "/admin/compliance" },
    { label: "Staff", icon: "group", href: "/admin/staff" },
    { label: "Results", icon: "assignment", href: "/admin/results" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-container-lowest border-r border-surface-variant flex flex-col h-full flex-shrink-0 z-20 hidden md:flex">
        <div className="p-6 border-b border-surface-variant">
          <Link href="/" className="font-display-sm text-primary block">Sarvada Admin</Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
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
                className={`material-symbols-outlined ${item.fill && pathname === item.href ? "symbol-fill" : ""}`} 
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-surface-variant">
          <button 
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded text-error hover:bg-error-container transition-colors font-body-sm"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-surface-container-lowest border-b border-surface-variant flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center md:hidden">
            <button className="text-on-surface-variant p-2">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-headline-sm text-primary ml-4">Sarvada Admin</h1>
          </div>
          <div className="hidden md:block">
            <h2 className="font-headline-sm text-on-surface">
              {navItems.find(n => n.href === pathname)?.label || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 border-l border-surface-variant pl-6">
              <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
                <img alt="Principal Profile" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqSiE3ccnM-JSqu9GmQEzM7JYJS-lPqHKSNK2lK4DqRSboaf2ye7ZyKVniH3s1K80WaHfKGw3kH0VF2ecIsJreLD2z-cteJ9LWtpa1acoVT4pCJQ7mCeJTxfO9vWdDWzDKDOuQNxe5YQoXqCDyEQMMuH04wGhx_DOLOhMEzhGLsLKnACKgp6I04sVzqmEdY4Yc5-feQSUm0kJAd3JTzQLZycETNQSGLqw7_HcKkeTx4xbSCAH7wJnsZi49NEJNh5LBeITkmTDMv0vK"/>
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-body-sm font-medium text-on-surface line-clamp-1">{user.email}</p>
                <p className="font-body-sm text-on-surface-variant">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-background">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
