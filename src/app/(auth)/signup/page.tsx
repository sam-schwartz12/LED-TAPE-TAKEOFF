"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    company: "",
    showroomName: "",
    role: "distributor" as "sales_rep" | "distributor",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
          company: formData.company,
          showroom_name: formData.showroomName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Update profile with extra fields (trigger creates base profile)
    router.push("/pending");
    router.refresh();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-outline-variant p-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-2xl font-black text-primary-container tracking-tight">
          Request Access
        </h1>
        <p className="text-on-surface-variant text-sm mt-2">
          LED Tape Estimator by Enlightening Sales
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-outline-variant rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-container bg-surface-container-low"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-outline-variant rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-container bg-surface-container-low"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            I am a...
          </label>
          <select
            value={formData.role}
            onChange={(e) => updateField("role", e.target.value)}
            className="w-full px-3.5 py-2.5 border border-outline-variant rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-container bg-surface-container-low"
          >
            <option value="distributor">Distribution Partner / Showroom</option>
            <option value="sales_rep">Enlightening Sales Team Member</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-on-surface mb-1.5">
            Company / Showroom Name
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => {
              updateField("company", e.target.value);
              updateField("showroomName", e.target.value);
            }}
            required
            className="w-full px-3.5 py-2.5 border border-outline-variant rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-container bg-surface-container-low"
            placeholder="Your company or showroom name"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-outline-variant rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-container bg-surface-container-low"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Confirm
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-outline-variant rounded-lg text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-container bg-surface-container-low"
              placeholder="Re-enter password"
            />
          </div>
        </div>

        {error && (
          <div className="bg-[#FFDAD6] text-error text-sm px-3.5 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-primary-container text-on-primary font-semibold text-sm
            rounded-lg hover:bg-[#2a3a54] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Request Access"}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-secondary font-semibold hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
