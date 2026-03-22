"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useCallback } from "react";
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

function ExportContent() {
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

  const exportCSV = useCallback(
    (tier: PricingTier) => {
      if (!project) return;

      const lines: string[] = [];
      lines.push(`Project: ${project.name}`);
      lines.push(`Client: ${project.clientName || ""}`);
      lines.push(`Date: ${project.date}`);
      lines.push(`Quote #: ${project.quoteNumber || ""}`);
      lines.push(`Pricing Tier: ${tier.toUpperCase()}`);
      lines.push("");

      // Room-by-room breakdown
      for (const bom of roomBOMs) {
        lines.push(`--- ${bom.roomName} ---`);

        for (const sb of bom.sectionBOMs) {
          lines.push(`  Section: ${sb.taskDescription}`);
          if (sb.validation.bomBlocked) {
            lines.push(`  STATUS: BLOCKED - ${sb.validation.blockReasons.join("; ")}`);
            continue;
          }
          lines.push("  Part Number,Description,Qty,Unit Price,Extended");
          for (const item of sb.items) {
            lines.push(
              `  ${item.partNumber},${item.description},${item.quantity},${formatPrice(item.unitPrice[tier])},${formatPrice(item.extendedPrice[tier])}`
            );
          }
          lines.push(`  Section Total: ${formatPrice(sb.sectionTotal[tier])}`);
        }
        lines.push(`Room Total: ${formatPrice(bom.roomTotal[tier])}`);
        lines.push("");
      }

      // Aggregated
      lines.push("=== AGGREGATED PARTS LIST ===");
      lines.push("Part Number,Description,Qty,Unit Price,Extended");
      for (const item of aggregatedItems) {
        lines.push(
          `${item.partNumber},${item.description},${item.totalQuantity},${formatPrice(item.unitPrice[tier])},${formatPrice(item.extendedPrice[tier])}`
        );
      }
      lines.push("");
      lines.push(`PROJECT TOTAL (${tier.toUpperCase()}): ${formatPrice(projectTotals[tier])}`);

      if (project.customMarkupPercent) {
        const marked = projectTotals[tier] * (1 + project.customMarkupPercent / 100);
        lines.push(
          `WITH ${project.customMarkupPercent}% MARKUP: ${formatPrice(marked)}`
        );
      }

      const blob = new Blob([lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, "_")}_BOM_${tier}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [project, roomBOMs, aggregatedItems, projectTotals]
  );

  if (state.loading || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tier = project.pricingDisplay;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push(`/projects/${project.id}/bom`)}
          className="text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline text-2xl font-bold text-primary-container">
          Export
        </h1>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-outline-variant p-6 mb-6">
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
          Export Summary
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-on-surface-variant">Project:</span>{" "}
            <span className="font-medium">{project.name}</span>
          </div>
          <div>
            <span className="text-on-surface-variant">Client:</span>{" "}
            <span className="font-medium">{project.clientName || "—"}</span>
          </div>
          <div>
            <span className="text-on-surface-variant">Rooms:</span>{" "}
            <span className="font-medium">{rooms.length}</span>
          </div>
          <div>
            <span className="text-on-surface-variant">Parts:</span>{" "}
            <span className="font-medium">{aggregatedItems.length}</span>
          </div>
          <div>
            <span className="text-on-surface-variant">Total ({tier.toUpperCase()}):</span>{" "}
            <span className="font-bold text-primary-container">
              {formatPrice(projectTotals[tier])}
            </span>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl border border-outline-variant p-6">
        <h2 className="font-headline text-lg font-bold text-on-surface mb-4">
          Download
        </h2>
        <div className="space-y-3">
          <button
            onClick={() => exportCSV("pdn")}
            className="w-full flex items-center justify-between px-4 py-3 border border-outline-variant
              rounded-lg hover:bg-surface-container-low transition-colors text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-success">description</span>
              <div className="text-left">
                <p className="font-medium text-on-surface">PDN Pricing (Dealer)</p>
                <p className="text-xs text-on-surface-variant">
                  Total: {formatPrice(projectTotals.pdn)}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">download</span>
          </button>

          <button
            onClick={() => exportCSV("umap")}
            className="w-full flex items-center justify-between px-4 py-3 border border-outline-variant
              rounded-lg hover:bg-surface-container-low transition-colors text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">description</span>
              <div className="text-left">
                <p className="font-medium text-on-surface">UMAP Pricing (Retail)</p>
                <p className="text-xs text-on-surface-variant">
                  Total: {formatPrice(projectTotals.umap)}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">download</span>
          </button>

          <button
            onClick={() => exportCSV("insider")}
            className="w-full flex items-center justify-between px-4 py-3 border border-outline-variant
              rounded-lg hover:bg-surface-container-low transition-colors text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container">description</span>
              <div className="text-left">
                <p className="font-medium text-on-surface">Insider Pricing</p>
                <p className="text-xs text-on-surface-variant">
                  Total: {formatPrice(projectTotals.insider)}
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant">download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExportPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <ProjectProvider projectId={projectId}>
      <ExportContent />
    </ProjectProvider>
  );
}
