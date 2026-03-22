"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface TopNavProps {
  onMenuToggle?: () => void;
}

export default function TopNav({ onMenuToggle }: TopNavProps) {
  const { profile, signOut, isAdmin } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="bg-surface-bright border-b border-outline-variant flex justify-between items-center w-full px-6 h-16 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <Link href="/">
          <span className="font-headline text-xl font-black text-primary-container tracking-tight">
            LED Tape Estimator
          </span>
        </Link>

        <div className="hidden md:flex ml-8 gap-6 text-sm font-medium items-center">
          <Link
            href="/"
            className="text-on-surface-variant hover:text-primary-container transition-colors"
          >
            Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-on-surface-variant hover:text-primary-container transition-colors"
            >
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
          >
            <div className="w-8 h-8 bg-primary-container text-on-primary rounded-full flex items-center justify-center text-sm font-semibold">
              {profile?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="hidden sm:block text-sm text-on-surface">
              {profile?.fullName || profile?.email}
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-lg">
              expand_more
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-outline-variant rounded-lg shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-outline-variant">
                <p className="text-sm font-medium text-on-surface">
                  {profile?.fullName}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {profile?.email}
                </p>
                <p className="text-xs text-secondary capitalize mt-0.5">
                  {profile?.role?.replace("_", " ")}
                  {profile?.insiderAccess && " \u00b7 Insider"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  signOut();
                }}
                className="w-full text-left px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
