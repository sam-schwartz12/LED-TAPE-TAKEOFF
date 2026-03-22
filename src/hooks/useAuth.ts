"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const supabase = createClient();

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });
  const profileCache = useRef<Map<string, UserProfile>>(new Map());

  const fetchProfile = useCallback(async (userId: string) => {
    const cached = profileCache.current.get(userId);
    if (cached) return cached;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      const profile: UserProfile = {
        id: data.id,
        email: data.email,
        fullName: data.full_name || "",
        role: data.role,
        approved: data.approved,
        insiderAccess: data.insider_access,
        showroomName: data.showroom_name,
        company: data.company,
        phone: data.phone,
        createdAt: data.created_at,
      };
      profileCache.current.set(userId, profile);
      return profile;
    }
    return null;
  }, []);

  useEffect(() => {
    // getUser for the initial check (faster than waiting for listener)
    supabase.auth.getUser().then(async ({ data: { user } }: { data: { user: User | null } }) => {
      if (user) {
        const profile = await fetchProfile(user.id);
        setState({ user, profile, loading: false });
      } else {
        setState({ user: null, profile: null, loading: false });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        // Clear cache on sign-in so we get fresh profile
        profileCache.current.delete(session.user.id);
        const profile = await fetchProfile(session.user.id);
        setState({ user: session.user, profile, loading: false });
      } else {
        profileCache.current.clear();
        setState({ user: null, profile: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    ...state,
    signOut,
    isAdmin: state.profile?.role === "admin",
    isApproved: state.profile?.approved ?? false,
    hasInsiderAccess: state.profile?.insiderAccess ?? false,
  };
}
