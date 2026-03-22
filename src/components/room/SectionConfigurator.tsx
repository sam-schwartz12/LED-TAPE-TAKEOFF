"use client";

import { useState, useMemo } from "react";
import type { Section, TapeFamily, AWGGauge, LookupTables, ProductSpec } from "@/lib/types";
import { findSpec, calculateSectionValidation } from "@/lib/engine/calculator";
import { formatPercentage } from "@/lib/utils/format";

interface SectionConfiguratorProps {
  section: Section;
  index: number;
  lookups: LookupTables;
  specs: ProductSpec[];
  onUpdate: (payload: Partial<Section>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const TAPE_FAMILIES: TapeFamily[] = ["Duet", "Gemini", "Pro+", "Pro2+"];
const AWG_OPTIONS: AWGGauge[] = [10, 12, 14, 16, 18];

export default function SectionConfigurator({
  section,
  index,
  lookups,
  specs,
  onUpdate,
  onRemove,
  canRemove,
}: SectionConfiguratorProps) {
  const [expanded, setExpanded] = useState(true);

  // Dynamic options based on selected family
  const lumenOptions = section.tapeFamily
    ? lookups.lumenOptions[section.tapeFamily] ?? []
    : [];
  const cctOptions = section.tapeFamily
    ? lookups.cctOptions[section.tapeFamily] ?? []
    : [];

  // Validation
  const validation = useMemo(() => {
    if (!section.tapeFamily || !section.lumenOutput || !section.runLengthInches)
      return null;
    const spec = findSpec(specs, section.tapeFamily, section.lumenOutput);
    if (!spec) return null;
    return calculateSectionValidation(section, spec);
  }, [section, specs]);

  const spec = useMemo(() => {
    if (!section.tapeFamily || !section.lumenOutput) return null;
    return findSpec(specs, section.tapeFamily, section.lumenOutput);
  }, [section.tapeFamily, section.lumenOutput, specs]);

  const statusColor = validation
    ? validation.bomBlocked
      ? "border-error bg-[#FFF5F5]"
      : validation.voltageDropCheck === "WARN"
        ? "border-warning bg-[#FFF8E1]"
        : "border-success bg-[#F0F7E8]"
    : "border-outline-variant bg-white";

  return (
    <div className={`rounded-xl border-2 ${statusColor} transition-colors`}>
      {/* Section Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant">
            {expanded ? "expand_more" : "chevron_right"}
          </span>
          <input
            type="text"
            value={section.taskDescription}
            onChange={(e) => onUpdate({ taskDescription: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent font-medium text-sm text-on-surface focus:outline-none
              border-b border-transparent focus:border-outline-variant"
          />
          {section.tapeFamily && (
            <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
              {section.tapeFamily}
              {section.lumenOutput ? ` \u00b7 ${section.lumenOutput}` : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {validation && (
            <div className="flex gap-1">
              <StatusBadge label="Load" status={validation.loadCheck} />
              <StatusBadge label="Run" status={validation.maxRunCheck} />
              <StatusBadge label="VDrop" status={validation.voltageDropCheck} />
            </div>
          )}
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-outline hover:text-error transition-colors ml-2"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Section Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Row 1: Tape Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Tape Family
              </label>
              <select
                value={section.tapeFamily || ""}
                onChange={(e) => {
                  const family = e.target.value as TapeFamily;
                  onUpdate({
                    tapeFamily: family || null,
                    lumenOutput: null,
                    cct: null,
                  });
                }}
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <option value="">Select family</option>
                {TAPE_FAMILIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Lumen Output
              </label>
              <select
                value={section.lumenOutput || ""}
                onChange={(e) => onUpdate({ lumenOutput: e.target.value || null, cct: null })}
                disabled={!section.tapeFamily}
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-50"
              >
                <option value="">Select output</option>
                {lumenOptions.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Color Temperature
              </label>
              <select
                value={section.cct || ""}
                onChange={(e) => onUpdate({ cct: e.target.value || null })}
                disabled={!section.tapeFamily}
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-50"
              >
                <option value="">Select CCT</option>
                {cctOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Measurements */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Run Length (inches)
              </label>
              <input
                type="number"
                min="0"
                value={section.runLengthInches ?? ""}
                onChange={(e) =>
                  onUpdate({
                    runLengthInches: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="0"
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
              {validation && (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Rounded: {validation.roundedLengthInches}" ({validation.roundedLengthFeet.toFixed(1)}ft)
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                AWG Gauge
              </label>
              <select
                value={section.awgGauge}
                onChange={(e) => onUpdate({ awgGauge: Number(e.target.value) as AWGGauge })}
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                {AWG_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g} AWG</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Entry Points
              </label>
              <input
                type="number"
                min="1"
                value={section.entryPoints}
                onChange={(e) => onUpdate({ entryPoints: Math.max(1, Number(e.target.value)) })}
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Dist. to Power (ft)
              </label>
              <input
                type="number"
                min="0"
                value={section.distanceToPower}
                onChange={(e) => onUpdate({ distanceToPower: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
          </div>

          {/* Row 3: Power & Channel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Power Type
              </label>
              <select
                value={section.powerType}
                onChange={(e) =>
                  onUpdate({ powerType: e.target.value as "Hardwired" | "Plug-In" })
                }
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <option value="Hardwired">Hardwired</option>
                <option value="Plug-In">Plug-In</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Channel / Extrusion
              </label>
              <select
                value={section.channelType || ""}
                onChange={(e) => onUpdate({ channelType: e.target.value || null })}
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container"
              >
                <option value="">Select channel</option>
                {lookups.channels.map((ch) => (
                  <option key={ch.type} value={ch.type}>{ch.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Finish
              </label>
              <select
                value={section.channelFinish || ""}
                onChange={(e) =>
                  onUpdate({ channelFinish: (e.target.value || null) as Section["channelFinish"] })
                }
                disabled={!section.channelType || section.channelType === "No Extrusion (Direct Mount)"}
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-50"
              >
                <option value="">Select</option>
                <option value="AL">Aluminum</option>
                <option value="BK">Black</option>
                <option value="WT">White</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                Diffuser
              </label>
              <select
                value={section.diffuserType || ""}
                onChange={(e) =>
                  onUpdate({ diffuserType: (e.target.value || null) as Section["diffuserType"] })
                }
                disabled={!section.channelType || section.channelType === "No Extrusion (Direct Mount)"}
                className="w-full px-2.5 py-2 border border-outline-variant rounded-lg text-sm
                  bg-white focus:outline-none focus:ring-2 focus:ring-primary-container disabled:opacity-50"
              >
                <option value="">None</option>
                <option value="FR">Frosted</option>
                <option value="SF">Semi-Frosted</option>
                <option value="BK">Black</option>
              </select>
            </div>
          </div>

          {/* Validation Details */}
          {validation && (
            <div className="bg-surface-container-low rounded-lg p-3 space-y-1.5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-on-surface-variant">Total Wattage:</span>{" "}
                  <span className="font-medium">{validation.totalWattage.toFixed(1)}W</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">W/Entry:</span>{" "}
                  <span className="font-medium">{validation.wattagePerEntry.toFixed(1)}W</span>
                  <span className="text-outline"> / 76.8W</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">V-Drop:</span>{" "}
                  <span className="font-medium">{formatPercentage(validation.voltageDropPercent)}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant">Max Run:</span>{" "}
                  <span className="font-medium">{validation.footagePerRun.toFixed(1)}ft</span>
                  {spec && <span className="text-outline"> / {spec.maxRun96W}ft</span>}
                </div>
              </div>
              {validation.blockReasons.length > 0 && (
                <div className="mt-2">
                  {validation.blockReasons.map((reason, i) => (
                    <p key={i} className="text-xs text-error flex items-start gap-1">
                      <span className="material-symbols-outlined text-sm mt-0.5">error</span>
                      {reason}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: "PASS" | "FAIL" | "WARN";
}) {
  const colors = {
    PASS: "bg-[#EEF2E8] text-success",
    WARN: "bg-[#FFF8E1] text-[#8B6914]",
    FAIL: "bg-[#FFDAD6] text-error",
  };

  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${colors[status]}`}>
      {label}
    </span>
  );
}
