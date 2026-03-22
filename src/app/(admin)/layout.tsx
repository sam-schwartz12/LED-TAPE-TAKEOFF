"use client";

import TopNav from "@/components/layout/TopNav";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const adminNav = [
    { href: "/admin", label: "Overview", icon: "dashboard" },
    { href: "/admin/users", label: "User Accounts", icon: "group" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <div className="flex flex-1">
        <aside className="hidden lg:block w-56 bg-white border-r border-outline-variant sticky top-16 h-[calc(100vh-4rem)]">
          <div className="p-4">
            <h2 className="font-headline text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              Admin
            </h2>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? "bg-primary-container text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                  >
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
