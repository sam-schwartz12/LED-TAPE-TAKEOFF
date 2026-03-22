"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { ProjectProvider, useProjectContext } from "@/hooks/useProject";
import {
  generateRoomBOM,
  aggregateBOM,
  calculateProjectTotal,
} from "@/lib/engine/calculator";
import { formatPrice } from "@/lib/utils/format";
import type { LookupTables, ProductSpec, PricingDB, PricingTier } from "@/lib/types";

import lookupTablesData from "@/lib/data/lookup-tables.json";
import productSpecsData from "@/lib/data/product-specs.json";
import pricingDbData from "@/lib/data/pricing-db.json";

const lookups = lookupTablesData as LookupTables;
const specs = productSpecsData as ProductSpec[];
const pricing = pricingDbData as unknown as PricingDB;

function BOMContent() {
  const { state } = useProjectContext();
  const router = useRouter();
  const { project, rooms } = state;

  const { roomBOMs, aggregatedItems, projectTotals } = useMemo(() => {
    const boms = rooms.map((room) => generateRoomBOM(room, specs, lookups, pricing));
    const agg = aggregateBOM(boms);
    return {
      roomBOMs: boms,
      aggregatedItems: agg,
      projectTotals: {
        pdn: calculateProjectTotal(agg, "pdn"),
        umap: calculateProjectTotal(agg, "umap"),
        insider: calculateProjectTotal(agg, "insider"),
      },
    };
  }, [rooms]);

  if (state.loading || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tier = project.pricingDisplay;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/projects/${project.id}`)}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="font-headline text-2xl font-bold text-primary-container">
              Project Bill of Materials
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {project.name}
              {project.clientName ? ` \u2014 ${project.clientName}` : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/projects/${project.id}/export`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-container text-on-primary
            font-semibold text-sm rounded-lg hover:bg-[#2a3a54] transition-colors"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Export
        </button>
      </div>

      {/* Room Summaries */}
      <div className="space-y-4 mb-8">
        {roomBOMs.map((bom) => (
          <div
            key={bom.roomId}
            className="bg-white rounded-xl border border-outline-variant p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-headline text-base font-bold text-on-surface">
                {bom.roomName}
              </h2>
              <span className="font-semibold text-sm text-primary-container">
                {formatPrice(bom.roomTotal[tier])}
              </span>
            </div>

            <div className="text-xs text-on-surface-variant">
              {bom.sectionBOMs.length} section{bom.sectionBOMs.length !== 1 ? "s" : ""}
              {" \u00b7 "}
              {bom.sectionBOMs.reduce((sum, sb) => sum + sb.items.length, 0)} line items
              {bom.sectionBOMs.some((sb) => sb.validation.bomBlocked) && (
                <span className="ml-2 text-error font-medium">Has blocked sections</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Aggregated Parts List */}
      {aggregatedItems.length > 0 && (
        <div className="bg-white rounded-xl border border-outline-variant p-6 mb-6">
          <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
            Aggregated Parts List
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-outline-variant text-on-surface-variant text-left">
                  <th className="py-2 pr-4">Part Number</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4 text-right">Qty</th>
                  <th className="py-2 pr-4 text-right">Unit ({tier.toUpperCase()})</th>
                  <th className="py-2 text-right">Extended</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedItems.map((item) => (
                  <tr
                    key={item.partNumber}
                    className="border-b border-surface-container hover:bg-surface-container-low"
                  >
                    <td className="py-2 pr-4 font-mono text-xs">{item.partNumber}</td>
                    <td className="py-2 pr-4 text-on-surface-variant text-xs">
                      {item.description}
                    </td>
                    <td className="py-2 pr-4 text-right">{item.totalQuantity}</td>
                    <td className="py-2 pr-4 text-right">
                      {formatPrice(item.unitPrice[tier])}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatPrice(item.extendedPrice[tier])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Total */}
      <div className="bg-primary-container rounded-xl p-6 text-on-primary">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline text-lg font-bold">Project Total</h2>
            <p className="text-sm opacity-80 mt-1">
              {aggregatedItems.length} unique parts across {rooms.length} rooms
            </p>
          </div>
          <div className="text-right">
            <p className="font-headline text-2xl font-bold">
              {formatPrice(projectTotals[tier])}
            </p>
            <p className="text-xs opacity-70 mt-1">{tier.toUpperCase()} Pricing</p>
          </div>
        </div>

        {project.customMarkupPercent != null && project.customMarkupPercent > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between">
            <span className="text-sm">
              With {project.customMarkupPercent}% Markup
            </span>
            <span className="font-headline text-xl font-bold">
              {formatPrice(
                projectTotals[tier] * (1 + project.customMarkupPercent / 100)
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectBOMPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectProvider projectId={projectId}>
      <BOMContent />
    </ProjectProvider>
  );
}
