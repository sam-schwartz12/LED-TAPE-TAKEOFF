"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PendingPage() {
  const { profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile?.approved) {
      router.push("/");
    }
  }, [loading, profile, router]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-outline-variant p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-secondary-container rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-3xl text-[#5D4201]">
          hourglass_top
        </span>
      </div>

      <h1 className="font-headline text-xl font-bold text-primary-container mb-3">
        Account Pending Approval
      </h1>

      <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
        Your access request has been submitted. Sam Schwartz at Enlightening
        Sales will review and approve your account. You will receive an email
        notification once your access has been granted.
      </p>

      <div className="bg-surface-container-low rounded-lg p-4 mb-6">
        <p className="text-xs text-on-surface-variant">
          Registered as{" "}
          <span className="font-semibold text-on-surface">
            {profile?.email}
          </span>
        </p>
        <p className="text-xs text-on-surface-variant mt-1">
          Role:{" "}
          <span className="font-semibold text-on-surface capitalize">
            {profile?.role?.replace("_", " ")}
          </span>
        </p>
      </div>

      <button
        onClick={signOut}
        className="text-sm text-on-surface-variant hover:text-error transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
