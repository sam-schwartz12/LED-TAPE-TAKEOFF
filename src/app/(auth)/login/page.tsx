"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-outline-variant p-8">
      <div className="text-center mb-8">
        <h1 className="font-headline text-2xl font-black text-primary-container tracking-tight">
          Enlightening Sales
        </h1>
        <p className="text-on-surface-variant text-sm mt-2">
          LED Tape Estimator
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-on-surface mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-outline-variant rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container
              bg-surface-container-low"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-on-surface mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 border border-outline-variant rounded-lg text-sm
              focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-primary-container
              bg-surface-container-low"
            placeholder="Enter your password"
          />
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
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        Need an account?{" "}
        <Link
          href="/signup"
          className="text-secondary font-semibold hover:underline"
        >
          Request Access
        </Link>
      </p>
    </div>
  );
}
