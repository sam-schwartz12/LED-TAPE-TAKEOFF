"use client";

import { useParams, useRouter } from "next/navigation";
import { ProjectProvider, useProjectContext } from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import type { PricingTier } from "@/lib/types";

function ProjectSetupContent() {
  const { state, dispatch } = useProjectContext();
  const { hasInsiderAccess } = useAuth();
  const router = useRouter();
  const { project, rooms, saving, lastSaved } = state;

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pricingTiers: { value: PricingTier; label: string; disabled?: boolean }[] = [
    { value: "umap", label: "UMAP (Retail)" },
    { value: "pdn", label: "PDN (Dealer)" },
    { value: "insider", label: "Insider", disabled: !hasInsiderAccess },
  ];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary-container">
            Project Setup
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {saving && (
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                Saving...
              </span>
            )}
            {!saving && lastSaved && (
              <span className="text-xs text-success flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Project Metadata */}
      <div className="bg-white rounded-xl border border-outline-variant p-6 mb-6">
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
          Project Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => dispatch({ type: "SET_PROJECT", payload: { name: e.target.value } })}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface-container-low
                focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Client Name
            </label>
            <input
              type="text"
              value={project.clientName || ""}
              onChange={(e) => dispatch({ type: "SET_PROJECT", payload: { clientName: e.target.value } })}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface-container-low
                focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Client Address
            </label>
            <input
              type="text"
              value={project.clientAddress || ""}
              onChange={(e) => dispatch({ type: "SET_PROJECT", payload: { clientAddress: e.target.value } })}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface-container-low
                focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Showroom Name
            </label>
            <input
              type="text"
              value={project.showroomName || ""}
              onChange={(e) => dispatch({ type: "SET_PROJECT", payload: { showroomName: e.target.value } })}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface-container-low
                focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Sales Associate
            </label>
            <input
              type="text"
              value={project.salesAssociate || ""}
              onChange={(e) => dispatch({ type: "SET_PROJECT", payload: { salesAssociate: e.target.value } })}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface-container-low
                focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Quote Number
            </label>
            <input
              type="text"
              value={project.quoteNumber || ""}
              onChange={(e) => dispatch({ type: "SET_PROJECT", payload: { quoteNumber: e.target.value } })}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface-container-low
                focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Date
            </label>
            <input
              type="date"
              value={project.date}
              onChange={(e) => dispatch({ type: "SET_PROJECT", payload: { date: e.target.value } })}
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface-container-low
                focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">
              Custom Markup %
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={project.customMarkupPercent ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_PROJECT",
                  payload: {
                    customMarkupPercent: e.target.value ? Number(e.target.value) : null,
                  },
                })
              }
              placeholder="Optional"
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface-container-low
                focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          </div>
        </div>
      </div>

      {/* Pricing Tier */}
      <div className="bg-white rounded-xl border border-outline-variant p-6 mb-6">
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
          Pricing Tier
        </h2>
        <div className="flex gap-3">
          {pricingTiers.map((tier) => (
            <button
              key={tier.value}
              onClick={() =>
                !tier.disabled &&
                dispatch({ type: "SET_PROJECT", payload: { pricingDisplay: tier.value } })
              }
              disabled={tier.disabled}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  project.pricingDisplay === tier.value
                    ? "bg-primary-container text-on-primary"
                    : tier.disabled
                      ? "bg-surface-container text-outline cursor-not-allowed"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }
              `}
            >
              {tier.label}
            </button>
          ))}
        </div>
        {!hasInsiderAccess && (
          <p className="text-xs text-outline mt-2">
            Insider pricing requires admin approval.
          </p>
        )}
      </div>

      {/* Rooms */}
      <div className="bg-white rounded-xl border border-outline-variant p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Rooms ({rooms.length})
          </h2>
          <button
            onClick={() => dispatch({ type: "ADD_ROOM" })}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-secondary
              hover:bg-secondary-container rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Room
          </button>
        </div>

        <div className="space-y-3">
          {rooms.map((room, index) => (
            <div
              key={room.id}
              className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg group"
            >
              <span className="material-symbols-outlined text-outline">
                meeting_room
              </span>
              <input
                type="text"
                value={room.roomName}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_ROOM",
                    roomId: room.id,
                    payload: { roomName: e.target.value },
                  })
                }
                className="flex-1 bg-transparent text-sm font-medium text-on-surface
                  focus:outline-none border-b border-transparent focus:border-outline-variant"
              />
              <span className="text-xs text-on-surface-variant">
                {room.sections.length} section{room.sections.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => router.push(`/projects/${project.id}/rooms/${room.id}`)}
                className="px-3 py-1 text-xs font-medium text-primary-container
                  hover:bg-surface-container rounded transition-colors"
              >
                Configure
              </button>
              {rooms.length > 1 && (
                <button
                  onClick={() => dispatch({ type: "REMOVE_ROOM", roomId: room.id })}
                  className="text-outline hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.push(`/projects/${project.id}/bom`)}
          className="px-5 py-2.5 bg-primary-container text-on-primary font-semibold text-sm
            rounded-lg hover:bg-[#2a3a54] transition-colors"
        >
          View Project BOM
        </button>
      </div>
    </div>
  );
}

export default function ProjectSetupPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectProvider projectId={projectId}>
      <ProjectSetupContent />
    </ProjectProvider>
  );
}
