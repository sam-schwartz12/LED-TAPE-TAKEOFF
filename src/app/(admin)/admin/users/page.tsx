"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils/format";
import type { UserProfile } from "@/lib/types";

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(
        data.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name || "",
          role: u.role,
          approved: u.approved,
          insiderAccess: u.insider_access,
          showroomName: u.showroom_name,
          company: u.company,
          phone: u.phone,
          createdAt: u.created_at,
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleApproved = async (userId: string, currentValue: boolean) => {
    await supabase
      .from("profiles")
      .update({ approved: !currentValue })
      .eq("id", userId);
    await fetchUsers();
  };

  const toggleInsider = async (userId: string, currentValue: boolean) => {
    await supabase
      .from("profiles")
      .update({ insider_access: !currentValue })
      .eq("id", userId);
    await fetchUsers();
  };

  const updateRole = async (userId: string, role: string) => {
    await supabase.from("profiles").update({ role }).eq("id", userId);
    await fetchUsers();
  };

  const filteredUsers = users.filter((u) => {
    if (filter === "pending") return !u.approved;
    if (filter === "approved") return u.approved;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-2xl font-bold text-primary-container">
          User Accounts
        </h1>
        <div className="flex gap-2">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize
                ${filter === f
                  ? "bg-primary-container text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
            >
              {f}
              {f === "pending" && users.filter((u) => !u.approved).length > 0 && (
                <span className="ml-1 bg-secondary text-on-secondary px-1.5 py-0.5 rounded-full text-[10px]">
                  {users.filter((u) => !u.approved).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium text-center">Approved</th>
                  <th className="px-4 py-3 font-medium text-center">Insider</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-surface-container hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-container text-on-primary rounded-full flex items-center justify-center text-xs font-semibold">
                          {user.fullName.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-on-surface">
                          {user.fullName || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-outline-variant rounded bg-white
                          focus:outline-none focus:ring-1 focus:ring-primary-container"
                      >
                        <option value="sales_rep">Sales Rep</option>
                        <option value="distributor">Distributor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">
                      {user.company || user.showroomName || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleApproved(user.id, user.approved)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${user.approved ? "bg-success" : "bg-outline-variant"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${user.approved ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleInsider(user.id, user.insiderAccess)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${user.insiderAccess ? "bg-secondary" : "bg-outline-variant"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${user.insiderAccess ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-outline">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-on-surface-variant">
              No users match this filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
