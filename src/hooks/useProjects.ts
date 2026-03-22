"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) {
      setProjects(
        data.map((p) => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          clientName: p.client_name,
          clientAddress: p.client_address,
          showroomName: p.showroom_name,
          salesAssociate: p.sales_associate,
          quoteNumber: p.quote_number,
          date: p.date,
          pricingDisplay: p.pricing_display,
          customMarkupPercent: p.custom_markup_percent,
          status: p.status,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = useCallback(
    async (name?: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: name || "Untitled Project",
        })
        .select()
        .single();

      if (error || !data) return null;

      // Create a default room with a default section
      const { data: room } = await supabase
        .from("rooms")
        .insert({
          project_id: data.id,
          room_name: "Room 1",
          sort_order: 0,
        })
        .select()
        .single();

      if (room) {
        await supabase.from("sections").insert({
          room_id: room.id,
          task_description: "Section 1",
          sort_order: 0,
        });
      }

      await fetchProjects();
      return data.id as string;
    },
    [supabase, fetchProjects]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await supabase.from("projects").delete().eq("id", projectId);
      await fetchProjects();
    },
    [supabase, fetchProjects]
  );

  return { projects, loading, createProject, deleteProject, refetch: fetchProjects };
}
