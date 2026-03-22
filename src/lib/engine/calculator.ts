import type {
  Section,
  ProductSpec,
  SectionValidation,
  RoomValidation,
  BOMLineItem,
  SectionBOM,
  RoomBOM,
  AggregatedBOMItem,
  PricingDB,
  PricingTier,
  LookupTables,
  TapeFamily,
  ChannelFinish,
  AWGGauge,
  AWGResistanceTable,
  Room,
} from "@/lib/types";

// ─── AWG Resistance Lookup ──────────────────────────────────────────────────

const AWG_RESISTANCE: AWGResistanceTable = {
  "10": 1.018,
  "12": 1.619,
  "14": 2.575,
  "16": 4.094,
  "18": 6.385,
};

export function getAWGResistance(gauge: AWGGauge): number {
  return AWG_RESISTANCE[String(gauge)] ?? 6.385;
}

// ─── Modulo Cut-Mark Rounding ───────────────────────────────────────────────

export function roundToCutMark(
  lengthInches: number,
  cutIntervalInches: number
): number {
  if (cutIntervalInches <= 0) return lengthInches;
  return Math.ceil(lengthInches / cutIntervalInches) * cutIntervalInches;
}

// ─── Spec Lookup ────────────────────────────────────────────────────────────

export function findSpec(
  specs: ProductSpec[],
  family: TapeFamily,
  lumenOutput: string
): ProductSpec | null {
  const lumens = parseLumens(lumenOutput);
  if (lumens === null) return null;
  return specs.find((s) => s.family === family && s.lumensPerFt === lumens) ?? null;
}

export function parseLumens(lumenOutput: string): number | null {
  const match = lumenOutput.match(/^(\d+)\s*lm\/ft$/);
  return match ? parseInt(match[1], 10) : null;
}

// ─── Section Validation ─────────────────────────────────────────────────────

export function calculateSectionValidation(
  section: Section,
  spec: ProductSpec
): SectionValidation {
  const rawInches = section.runLengthInches ?? 0;
  const roundedInches = roundToCutMark(rawInches, spec.cutIntervalInches);
  const roundedFeet = roundedInches / 12;
  const entries = section.entryPoints || 1;

  const totalWattage = roundedFeet * spec.wattsPerFt;
  const footagePerRun = roundedFeet / entries;
  const wattagePerEntry = totalWattage / entries;

  // 80% safety buffer on 96W = 76.8W max per entry
  const loadCheck: "PASS" | "FAIL" = wattagePerEntry <= 76.8 ? "PASS" : "FAIL";
  const maxRunCheck: "PASS" | "FAIL" =
    footagePerRun <= spec.maxRun96W ? "PASS" : "FAIL";

  // Voltage drop using section-specific AWG gauge
  const resistance = getAWGResistance(section.awgGauge);
  const effectiveLength = footagePerRun + section.distanceToPower;
  const currentDraw = wattagePerEntry / 24;
  const voltageDropPercent =
    ((2 * effectiveLength * currentDraw * resistance) / 1000 / 24) * 100;
  const voltageDropCheck: "PASS" | "WARN" | "FAIL" =
    voltageDropPercent > 3 ? "FAIL" : voltageDropPercent > 2 ? "WARN" : "PASS";

  const blockReasons: string[] = [];
  if (loadCheck === "FAIL")
    blockReasons.push(
      `Wattage per entry (${wattagePerEntry.toFixed(1)}W) exceeds 76.8W (80% of 96W)`
    );
  if (maxRunCheck === "FAIL")
    blockReasons.push(
      `Run length (${footagePerRun.toFixed(1)}ft) exceeds max ${spec.maxRun96W}ft`
    );
  if (voltageDropCheck === "FAIL")
    blockReasons.push(
      `Voltage drop (${voltageDropPercent.toFixed(1)}%) exceeds 3% limit`
    );

  return {
    sectionId: section.id,
    runLengthFeet: rawInches / 12,
    roundedLengthInches: roundedInches,
    roundedLengthFeet: roundedFeet,
    totalWattage,
    wattagePerEntry,
    loadCheck,
    footagePerRun,
    maxRunCheck,
    voltageDropPercent,
    voltageDropCheck,
    powerSuppliesRequired: entries,
    connectorsNeeded: entries,
    bomBlocked: blockReasons.length > 0,
    blockReasons,
  };
}

// ─── Room Validation (aggregate sections) ───────────────────────────────────

export function calculateRoomValidation(
  room: Room,
  specs: ProductSpec[]
): RoomValidation {
  const sectionValidations: SectionValidation[] = [];

  for (const section of room.sections) {
    if (!section.tapeFamily || !section.lumenOutput) continue;
    const spec = findSpec(specs, section.tapeFamily, section.lumenOutput);
    if (!spec) continue;
    sectionValidations.push(calculateSectionValidation(section, spec));
  }

  return {
    roomId: room.id,
    totalWattage: sectionValidations.reduce((sum, sv) => sum + sv.totalWattage, 0),
    sectionValidations,
    hasBlockedSections: sectionValidations.some((sv) => sv.bomBlocked),
  };
}

// ─── Part Number Builders ───────────────────────────────────────────────────

export function buildTapePartNumber(
  family: TapeFamily,
  lumenOutput: string,
  cct: string,
  spoolFt: number
): string {
  const lumens = parseLumens(lumenOutput);
  if (lumens === null) return "";
  const lumenCode = lumens / 100;

  switch (family) {
    case "Duet": {
      const lengthCode = String(spoolFt).padStart(2, "0");
      const cctMatch = cct.match(/\(([AB])\)/);
      const cctLetter = cctMatch ? cctMatch[1] : "A";
      return `T24-DU${lumenCode}-${lengthCode}-${cctLetter}`;
    }
    case "Gemini": {
      const cctCode = cct.replace("K", "").substring(0, 2);
      return `T24-GE${lumenCode}-${spoolFt}-${cctCode}WT`;
    }
    case "Pro+": {
      const cctCode = cct.replace("K", "").substring(0, 2);
      return `LED-TB24${cctCode}-${spoolFt}`;
    }
    case "Pro2+": {
      const cctCode = cct.replace("K", "").substring(0, 2);
      return `LED-TC24${cctCode}-${spoolFt}`;
    }
  }
}

export function buildPowerSupplyPartNumber(
  family: TapeFamily,
  powerType: "Hardwired" | "Plug-In",
  lookups: LookupTables
): string {
  const ps = lookups.powerSupplies.find((p) => p.family === family);
  if (!ps) return "";
  return powerType === "Hardwired" ? ps.default96wHW : ps.plugIn;
}

export function buildConnectorPartNumber(
  family: TapeFamily,
  lookups: LookupTables
): string {
  const ps = lookups.powerSupplies.find((p) => p.family === family);
  return ps?.powerConnector ?? "";
}

export function buildChannelPartNumber(
  channelType: string,
  finish: ChannelFinish,
  lookups: LookupTables
): string {
  const ch = lookups.channels.find((c) => c.type === channelType);
  if (!ch) return "";
  switch (finish) {
    case "AL":
      return ch.partAL;
    case "BK":
      return ch.partBK;
    case "WT":
      return ch.partWT;
  }
}

export function buildEndCapPartNumber(
  channelType: string,
  lookups: LookupTables
): string {
  const ch = lookups.channels.find((c) => c.type === channelType);
  return ch?.endCap ?? "";
}

export function buildDiffuserPartNumber(
  channelType: string,
  diffuserType: string
): string {
  const shallowTypes = [
    "Shallow Aluminum",
    "Trimmed Recessed Slim",
    "Angled Recessed",
  ];
  const deepTypes = ["Deep Aluminum", "Standard Aluminum", "45° Angled"];

  if (shallowTypes.includes(channelType)) {
    return `LED-T-CH5-COV-${diffuserType}`;
  }
  if (deepTypes.includes(channelType)) {
    return `LED-T-CH-COV-${diffuserType}`;
  }
  return "";
}

export function buildClipPartNumber(family: TapeFamily): string {
  switch (family) {
    case "Gemini":
      return "T24-BS-CL1";
    case "Duet":
      return "T24-DU-CL";
    default:
      return "LED-T-CL2-PT";
  }
}

// ─── Pricing Lookup ─────────────────────────────────────────────────────────

export function lookupPrice(
  partNumber: string,
  pricing: PricingDB,
  tier: PricingTier
): number | null {
  const entry = pricing[partNumber];
  if (!entry) return null;
  switch (tier) {
    case "pdn":
      return entry.pdn;
    case "umap":
      return entry.umap;
    case "insider":
      if (entry.insiderFlag && entry.insiderPrice != null)
        return entry.insiderPrice;
      if (entry.limitedFlag && entry.limitedPrice != null)
        return entry.limitedPrice;
      return entry.pdn;
  }
}

function lookupDescription(partNumber: string, pricing: PricingDB): string {
  return pricing[partNumber]?.description ?? "";
}

function buildPriceRecord(
  partNumber: string,
  pricing: PricingDB
): Record<PricingTier, number | null> {
  return {
    pdn: lookupPrice(partNumber, pricing, "pdn"),
    umap: lookupPrice(partNumber, pricing, "umap"),
    insider: lookupPrice(partNumber, pricing, "insider"),
  };
}

function makeBOMItem(
  itemType: string,
  partNumber: string,
  quantity: number,
  pricing: PricingDB
): BOMLineItem {
  const unitPrice = buildPriceRecord(partNumber, pricing);
  const extendedPrice: Record<PricingTier, number | null> = {
    pdn: unitPrice.pdn != null ? unitPrice.pdn * quantity : null,
    umap: unitPrice.umap != null ? unitPrice.umap * quantity : null,
    insider: unitPrice.insider != null ? unitPrice.insider * quantity : null,
  };

  return {
    itemType,
    partNumber,
    description: lookupDescription(partNumber, pricing),
    quantity,
    unitPrice,
    extendedPrice,
  };
}

// ─── Section BOM Generator ──────────────────────────────────────────────────

export function generateSectionBOM(
  section: Section,
  specs: ProductSpec[],
  lookups: LookupTables,
  pricing: PricingDB
): SectionBOM | null {
  if (
    !section.tapeFamily ||
    !section.lumenOutput ||
    !section.cct ||
    !section.runLengthInches
  ) {
    return null;
  }

  const spec = findSpec(specs, section.tapeFamily, section.lumenOutput);
  if (!spec) return null;

  const validation = calculateSectionValidation(section, spec);
  if (validation.bomBlocked) {
    return {
      sectionId: section.id,
      taskDescription: section.taskDescription,
      validation,
      items: [],
      sectionTotal: { pdn: 0, umap: 0, insider: 0 },
    };
  }

  const items: BOMLineItem[] = [];
  const footage = validation.roundedLengthFeet;
  const entries = section.entryPoints;
  const footagePerRun = footage / entries;
  const defaultSpool = lookups.defaultSpoolFt[section.tapeFamily] ?? 5;

  // 1. LED Tape
  const tapePN = buildTapePartNumber(
    section.tapeFamily,
    section.lumenOutput,
    section.cct,
    defaultSpool
  );
  const tapeQty = Math.ceil(footagePerRun / defaultSpool) * entries;
  if (tapePN) {
    items.push(makeBOMItem("LED Tape", tapePN, tapeQty, pricing));
  }

  // 2. Power Supply
  const psPN = buildPowerSupplyPartNumber(
    section.tapeFamily,
    section.powerType,
    lookups
  );
  if (psPN) {
    items.push(
      makeBOMItem("Power Supply", psPN, validation.powerSuppliesRequired, pricing)
    );
  }

  // 3. Power-to-Tape Connector
  const connPN = buildConnectorPartNumber(section.tapeFamily, lookups);
  if (connPN) {
    items.push(
      makeBOMItem("Power-to-Tape Connector", connPN, validation.connectorsNeeded, pricing)
    );
  }

  // 4. Extrusion / Channel
  if (
    section.channelType &&
    section.channelType !== "No Extrusion (Direct Mount)" &&
    section.channelFinish
  ) {
    const chPN = buildChannelPartNumber(
      section.channelType,
      section.channelFinish,
      lookups
    );
    const ch = lookups.channels.find((c) => c.type === section.channelType);
    const stickLen = ch?.lengthFt ?? 5;
    const chQty = Math.ceil(footage / stickLen);
    if (chPN) {
      items.push(makeBOMItem("Extrusion / Channel", chPN, chQty, pricing));
    }

    // 5. End Caps
    const ecPN = buildEndCapPartNumber(section.channelType, lookups);
    if (ecPN) {
      items.push(makeBOMItem("End Caps", ecPN, entries * 2, pricing));
    }

    // 6. Diffuser
    if (section.diffuserType) {
      const diffPN = buildDiffuserPartNumber(
        section.channelType,
        section.diffuserType
      );
      if (diffPN) {
        items.push(makeBOMItem("Diffuser", diffPN, chQty, pricing));
      }
    }

    // 7. Mounting Clips
    const clipPN = buildClipPartNumber(section.tapeFamily);
    if (clipPN) {
      items.push(
        makeBOMItem("Mounting Clips", clipPN, Math.ceil(footage / 2), pricing)
      );
    }
  }

  // Calculate section totals
  const sectionTotal: Record<PricingTier, number> = {
    pdn: 0,
    umap: 0,
    insider: 0,
  };
  for (const item of items) {
    for (const tier of ["pdn", "umap", "insider"] as PricingTier[]) {
      sectionTotal[tier] += item.extendedPrice[tier] ?? 0;
    }
  }

  return {
    sectionId: section.id,
    taskDescription: section.taskDescription,
    validation,
    items,
    sectionTotal,
  };
}

// ─── Room BOM (aggregate sections) ──────────────────────────────────────────

export function generateRoomBOM(
  room: Room,
  specs: ProductSpec[],
  lookups: LookupTables,
  pricing: PricingDB
): RoomBOM {
  const sectionBOMs: SectionBOM[] = [];

  for (const section of room.sections) {
    const bom = generateSectionBOM(section, specs, lookups, pricing);
    if (bom) sectionBOMs.push(bom);
  }

  const roomTotal: Record<PricingTier, number> = {
    pdn: 0,
    umap: 0,
    insider: 0,
  };
  for (const sb of sectionBOMs) {
    for (const tier of ["pdn", "umap", "insider"] as PricingTier[]) {
      roomTotal[tier] += sb.sectionTotal[tier];
    }
  }

  return {
    roomId: room.id,
    roomName: room.roomName,
    sectionBOMs,
    roomTotal,
  };
}

// ─── Project BOM Aggregator ─────────────────────────────────────────────────

export function aggregateBOM(roomBOMs: RoomBOM[]): AggregatedBOMItem[] {
  const map = new Map<string, AggregatedBOMItem>();

  for (const roomBom of roomBOMs) {
    for (const sectionBom of roomBom.sectionBOMs) {
      for (const item of sectionBom.items) {
        if (!item.partNumber) continue;

        const existing = map.get(item.partNumber);
        if (existing) {
          existing.totalQuantity += item.quantity;
          for (const tier of ["pdn", "umap", "insider"] as PricingTier[]) {
            existing.extendedPrice[tier] += item.extendedPrice[tier] ?? 0;
          }
          if (!existing.sourceRooms.includes(roomBom.roomName)) {
            existing.sourceRooms.push(roomBom.roomName);
          }
          if (!existing.sourceSections.includes(sectionBom.taskDescription)) {
            existing.sourceSections.push(sectionBom.taskDescription);
          }
        } else {
          map.set(item.partNumber, {
            partNumber: item.partNumber,
            description: item.description,
            totalQuantity: item.quantity,
            unitPrice: { ...item.unitPrice },
            extendedPrice: {
              pdn: item.extendedPrice.pdn ?? 0,
              umap: item.extendedPrice.umap ?? 0,
              insider: item.extendedPrice.insider ?? 0,
            },
            sourceRooms: [roomBom.roomName],
            sourceSections: [sectionBom.taskDescription],
          });
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.partNumber.localeCompare(b.partNumber)
  );
}

// ─── Project Totals ─────────────────────────────────────────────────────────

export function calculateProjectTotal(
  aggregated: AggregatedBOMItem[],
  tier: PricingTier
): number {
  return aggregated.reduce(
    (sum, item) => sum + (item.extendedPrice[tier] ?? 0),
    0
  );
}
