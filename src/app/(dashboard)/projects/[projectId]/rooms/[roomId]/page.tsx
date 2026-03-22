"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { ProjectProvider, useProjectContext } from "@/hooks/useProject";
import SectionConfigurator from "@/components/room/SectionConfigurator";
import { generateRoomBOM } from "@/lib/engine/calculator";
import { formatPrice } from "@/lib/utils/format";
import type { LookupTables, ProductSpec, PricingDB } from "@/lib/types";

import lookupTablesData from "@/lib/data/lookup-tables.json";
import productSpecsData from "@/lib/data/product-specs.json";
import pricingDbData from "@/lib/data/pricing-db.json";

const lookups = lookupTablesData as LookupTables;
const specs = productSpecsData as ProductSpec[];
const pricing = pricingDbData as unknown as PricingDB;

function RoomConfigContent() {
  const { state, dispatch } = useProjectContext();
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const room = state.rooms.find((r) => r.id === roomId);
  const project = state.project;

  // Compute room BOM
  const roomBOM = useMemo(() => {
    if (!room) return null;
    return generateRoomBOM(room, specs, lookups, pricing);
  }, [room]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room || !project) {
    return (
      <div className="text-center py-20">
        <p className="text-on-surface-variant">Room not found.</p>
      </div>
    );
  }

  const pricingTier = project.pricingDisplay;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/projects/${project.id}`)}
          className="text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
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
            className="font-headline text-2xl font-bold text-primary-container bg-transparent
              focus:outline-none border-b-2 border-transparent focus:border-secondary w-full"
          />
          <input
            type="text"
            value={room.areaDescription || ""}
            onChange={(e) =>
              dispatch({
                type: "UPDATE_ROOM",
                roomId: room.id,
                payload: { areaDescription: e.target.value || null },
              })
            }
            placeholder="Area description (optional)"
            className="text-sm text-on-surface-variant bg-transparent focus:outline-none mt-1 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          {state.saving && (
            <span className="text-xs text-on-surface-variant flex items-center gap-1">
              <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              Saving
            </span>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4 mb-6">
        {room.sections.map((section, index) => (
          <SectionConfigurator
            key={section.id}
            section={section}
            index={index}
            lookups={lookups}
            specs={specs}
            onUpdate={(payload) =>
              dispatch({
                type: "UPDATE_SECTION",
                sectionId: section.id,
                payload,
              })
            }
            onRemove={() =>
              dispatch({
                type: "REMOVE_SECTION",
                roomId: room.id,
                sectionId: section.id,
              })
            }
            canRemove={room.sections.length > 1}
          />
        ))}
      </div>

      {/* Add Section */}
      <button
        onClick={() => dispatch({ type: "ADD_SECTION", roomId: room.id })}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed
          border-outline-variant text-on-surface-variant rounded-xl hover:border-secondary
          hover:text-secondary transition-colors text-sm font-medium mb-8"
      >
        <span className="material-symbols-outlined">add</span>
        Add Section
      </button>

      {/* Room BOM Summary */}
      {roomBOM && roomBOM.sectionBOMs.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant p-6">
          <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
            Room Bill of Materials
          </h2>

          {roomBOM.sectionBOMs.map((sb) => (
            <div key={sb.sectionId} className="mb-4">
              <h3 className="text-sm font-semibold text-on-surface-variant mb-2">
                {sb.taskDescription}
                {sb.validation.bomBlocked && (
                  <span className="ml-2 text-xs text-error">(Blocked)</span>
                )}
              </h3>
              {sb.items.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-outline-variant text-on-surface-variant text-left">
                        <th className="py-2 pr-3">Part #</th>
                        <th className="py-2 pr-3">Description</th>
                        <th className="py-2 pr-3 text-right">Qty</th>
                        <th className="py-2 text-right">
                          {pricingTier.toUpperCase()}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sb.items.map((item, i) => (
                        <tr key={i} className="border-b border-surface-container">
                          <td className="py-1.5 pr-3 font-mono text-on-surface">
                            {item.partNumber}
                          </td>
                          <td className="py-1.5 pr-3 text-on-surface-variant">
                            {item.description}
                          </td>
                          <td className="py-1.5 pr-3 text-right">{item.quantity}</td>
                          <td className="py-1.5 text-right font-medium">
                            {formatPrice(item.extendedPrice[pricingTier])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold">
                        <td colSpan={3} className="py-2 text-right text-on-surface-variant">
                          Section Total:
                        </td>
                        <td className="py-2 text-right">
                          {formatPrice(sb.sectionTotal[pricingTier])}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ))}

          {/* Room Total */}
          <div className="mt-4 pt-4 border-t-2 border-primary-container flex justify-between items-center">
            <span className="font-headline text-base font-bold text-on-surface">
              Room Total
            </span>
            <span className="font-headline text-lg font-bold text-primary-container">
              {formatPrice(roomBOM.roomTotal[pricingTier])}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => router.push(`/projects/${project.id}`)}
          className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface
            transition-colors"
        >
          Back to Project
        </button>
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

export default function RoomConfiguratorPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectProvider projectId={projectId}>
      <RoomConfigContent />
    </ProjectProvider>
  );
}
