"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
  type Dispatch,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Project,
  Room,
  Section,
  PricingTier,
  AWGGauge,
} from "@/lib/types";

// ─── State ──────────────────────────────────────────────────────────────────

interface ProjectState {
  project: Project | null;
  rooms: Room[];
  loading: boolean;
  saving: boolean;
  lastSaved: string | null;
}

const initialState: ProjectState = {
  project: null,
  rooms: [],
  loading: true,
  saving: false,
  lastSaved: null,
};

// ─── Actions ────────────────────────────────────────────────────────────────

type Action =
  | { type: "LOAD_PROJECT"; payload: { project: Project; rooms: Room[] } }
  | { type: "SET_PROJECT"; payload: Partial<Project> }
  | { type: "ADD_ROOM" }
  | { type: "REMOVE_ROOM"; roomId: string }
  | { type: "UPDATE_ROOM"; roomId: string; payload: Partial<Room> }
  | { type: "ADD_SECTION"; roomId: string }
  | { type: "REMOVE_SECTION"; roomId: string; sectionId: string }
  | { type: "UPDATE_SECTION"; sectionId: string; payload: Partial<Section> }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_LAST_SAVED"; payload: string }
  | { type: "RESET" };

function makeDefaultSection(roomId: string, sortOrder: number): Section {
  return {
    id: crypto.randomUUID(),
    roomId,
    taskDescription: `Section ${sortOrder + 1}`,
    tapeFamily: null,
    lumenOutput: null,
    cct: null,
    runLengthInches: null,
    awgGauge: 18 as AWGGauge,
    entryPoints: 1,
    distanceToPower: 0,
    powerType: "Hardwired",
    channelType: null,
    channelFinish: null,
    diffuserType: null,
    connectorColor: "WT",
    sortOrder,
  };
}

function makeDefaultRoom(sortOrder: number): Room {
  const roomId = crypto.randomUUID();
  return {
    id: roomId,
    projectId: "",
    roomName: `Room ${sortOrder + 1}`,
    areaDescription: null,
    sortOrder,
    sections: [makeDefaultSection(roomId, 0)],
  };
}

function reducer(state: ProjectState, action: Action): ProjectState {
  switch (action.type) {
    case "LOAD_PROJECT":
      return {
        ...state,
        project: action.payload.project,
        rooms: action.payload.rooms,
        loading: false,
      };

    case "SET_PROJECT":
      if (!state.project) return state;
      return {
        ...state,
        project: { ...state.project, ...action.payload },
      };

    case "ADD_ROOM":
      return {
        ...state,
        rooms: [...state.rooms, makeDefaultRoom(state.rooms.length)],
      };

    case "REMOVE_ROOM":
      return {
        ...state,
        rooms: state.rooms.filter((r) => r.id !== action.roomId),
      };

    case "UPDATE_ROOM":
      return {
        ...state,
        rooms: state.rooms.map((r) =>
          r.id === action.roomId ? { ...r, ...action.payload } : r
        ),
      };

    case "ADD_SECTION": {
      return {
        ...state,
        rooms: state.rooms.map((r) => {
          if (r.id !== action.roomId) return r;
          const newSection = makeDefaultSection(r.id, r.sections.length);
          return { ...r, sections: [...r.sections, newSection] };
        }),
      };
    }

    case "REMOVE_SECTION":
      return {
        ...state,
        rooms: state.rooms.map((r) => {
          if (r.id !== action.roomId) return r;
          return {
            ...r,
            sections: r.sections.filter((s) => s.id !== action.sectionId),
          };
        }),
      };

    case "UPDATE_SECTION":
      return {
        ...state,
        rooms: state.rooms.map((r) => ({
          ...r,
          sections: r.sections.map((s) =>
            s.id === action.sectionId ? { ...s, ...action.payload } : s
          ),
        })),
      };

    case "SET_SAVING":
      return { ...state, saving: action.payload };

    case "SET_LAST_SAVED":
      return { ...state, lastSaved: action.payload, saving: false };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface ProjectContextValue {
  state: ProjectState;
  dispatch: Dispatch<Action>;
  saveProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────────────

interface ProjectProviderProps {
  projectId: string;
  children: ReactNode;
}

export function ProjectProvider({ projectId, children }: ProjectProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const supabase = createClient();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load project data
  useEffect(() => {
    const load = async () => {
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (!project) return;

      const { data: rooms } = await supabase
        .from("rooms")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      const roomIds = rooms?.map((r) => r.id) ?? [];
      const { data: sections } = roomIds.length
        ? await supabase
            .from("sections")
            .select("*")
            .in("room_id", roomIds)
            .order("sort_order")
        : { data: [] };

      const mappedRooms: Room[] = (rooms ?? []).map((r) => ({
        id: r.id,
        projectId: r.project_id,
        roomName: r.room_name,
        areaDescription: r.area_description,
        sortOrder: r.sort_order,
        sections: (sections ?? [])
          .filter((s) => s.room_id === r.id)
          .map((s) => ({
            id: s.id,
            roomId: s.room_id,
            taskDescription: s.task_description,
            tapeFamily: s.tape_family,
            lumenOutput: s.lumen_output,
            cct: s.cct,
            runLengthInches: s.run_length_inches,
            awgGauge: s.awg_gauge as AWGGauge,
            entryPoints: s.entry_points,
            distanceToPower: s.distance_to_power,
            powerType: s.power_type,
            channelType: s.channel_type,
            channelFinish: s.channel_finish,
            diffuserType: s.diffuser_type,
            connectorColor: s.connector_color,
            sortOrder: s.sort_order,
          })),
      }));

      dispatch({
        type: "LOAD_PROJECT",
        payload: {
          project: {
            id: project.id,
            userId: project.user_id,
            name: project.name,
            clientName: project.client_name,
            clientAddress: project.client_address,
            showroomName: project.showroom_name,
            salesAssociate: project.sales_associate,
            quoteNumber: project.quote_number,
            date: project.date,
            pricingDisplay: project.pricing_display as PricingTier,
            customMarkupPercent: project.custom_markup_percent,
            status: project.status,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
          },
          rooms: mappedRooms,
        },
      });
    };

    load();
  }, [projectId, supabase]);

  // Auto-save with debounce
  const saveProject = useCallback(async () => {
    if (!state.project) return;
    dispatch({ type: "SET_SAVING", payload: true });

    const { project, rooms } = state;

    // Save project metadata
    await supabase
      .from("projects")
      .update({
        name: project.name,
        client_name: project.clientName,
        client_address: project.clientAddress,
        showroom_name: project.showroomName,
        sales_associate: project.salesAssociate,
        quote_number: project.quoteNumber,
        date: project.date,
        pricing_display: project.pricingDisplay,
        custom_markup_percent: project.customMarkupPercent,
        status: project.status,
      })
      .eq("id", project.id);

    // Sync rooms: delete removed, upsert current
    const existingRoomIds = rooms.map((r) => r.id);
    await supabase
      .from("rooms")
      .delete()
      .eq("project_id", project.id)
      .not("id", "in", `(${existingRoomIds.join(",")})`);

    for (const room of rooms) {
      await supabase.from("rooms").upsert({
        id: room.id,
        project_id: project.id,
        room_name: room.roomName,
        area_description: room.areaDescription,
        sort_order: room.sortOrder,
      });

      // Sync sections
      const existingSectionIds = room.sections.map((s) => s.id);
      if (existingSectionIds.length > 0) {
        await supabase
          .from("sections")
          .delete()
          .eq("room_id", room.id)
          .not("id", "in", `(${existingSectionIds.join(",")})`);
      } else {
        await supabase.from("sections").delete().eq("room_id", room.id);
      }

      for (const section of room.sections) {
        await supabase.from("sections").upsert({
          id: section.id,
          room_id: room.id,
          task_description: section.taskDescription,
          tape_family: section.tapeFamily,
          lumen_output: section.lumenOutput,
          cct: section.cct,
          run_length_inches: section.runLengthInches,
          awg_gauge: section.awgGauge,
          entry_points: section.entryPoints,
          distance_to_power: section.distanceToPower,
          power_type: section.powerType,
          channel_type: section.channelType,
          channel_finish: section.channelFinish,
          diffuser_type: section.diffuserType,
          connector_color: section.connectorColor,
          sort_order: section.sortOrder,
        });
      }
    }

    dispatch({ type: "SET_LAST_SAVED", payload: new Date().toISOString() });
  }, [state, supabase]);

  // Debounced auto-save on state changes
  useEffect(() => {
    if (state.loading || !state.project) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProject();
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.project, state.rooms, state.loading, saveProject]);

  return (
    <ProjectContext.Provider value={{ state, dispatch, saveProject }}>
      {children}
    </ProjectContext.Provider>
  );
}
