"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Stats {
  totalUsers: number;
  pendingApprovals: number;
  activeProjects: number;
  insiderUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    pendingApprovals: 0,
    activeProjects: 0,
    insiderUsers: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, projects] = await Promise.all([
        supabase.from("profiles").select("approved, insider_access"),
        supabase.from("projects").select("id"),
      ]);

      const users = profiles.data ?? [];
      setStats({
        totalUsers: users.length,
        pendingApprovals: users.filter((u) => !u.approved).length,
        activeProjects: projects.data?.length ?? 0,
        insiderUsers: users.filter((u) => u.insider_access).length,
      });
    };
    fetchStats();
  }, [supabase]);

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: "group",
      color: "text-primary-container",
    },
    {
      label: "Pending Approval",
      value: stats.pendingApprovals,
      icon: "pending",
      color: stats.pendingApprovals > 0 ? "text-secondary" : "text-on-surface-variant",
      badge: stats.pendingApprovals > 0,
    },
    {
      label: "Active Projects",
      value: stats.activeProjects,
      icon: "folder_open",
      color: "text-success",
    },
    {
      label: "Insider Access",
      value: stats.insiderUsers,
      icon: "verified",
      color: "text-secondary",
    },
  ];

  return (
    <div>
      <h1 className="font-headline text-2xl font-bold text-primary-container mb-6">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-outline-variant p-5 relative"
          >
            <div className="flex items-center justify-between">
              <span className={`material-symbols-outlined text-2xl ${card.color}`}>
                {card.icon}
              </span>
              {card.badge && (
                <span className="w-3 h-3 bg-secondary rounded-full animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-bold text-on-surface mt-3">{card.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {stats.pendingApprovals > 0 && (
        <div className="bg-secondary-container rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-[#5D4201]">
                notifications_active
              </span>
              <div>
                <p className="font-semibold text-[#5D4201]">
                  {stats.pendingApprovals} user{stats.pendingApprovals !== 1 ? "s" : ""} awaiting
                  approval
                </p>
                <p className="text-xs text-[#5D4201]/70">
                  Review and approve access requests
                </p>
              </div>
            </div>
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-[#5D4201] text-white rounded-lg text-sm font-medium
                hover:bg-[#4A3501] transition-colors"
            >
              Review
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
