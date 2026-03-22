// ─── Core Enums ─────────────────────────────────────────────────────────────

export type TapeFamily = "Duet" | "Gemini" | "Pro+" | "Pro2+";
export type PricingTier = "pdn" | "umap" | "insider";
export type PowerType = "Hardwired" | "Plug-In";
export type ChannelFinish = "AL" | "BK" | "WT";
export type ConnectorColor = "WT" | "BK";
export type UserRole = "admin" | "sales_rep" | "distributor";
export type ProjectStatus = "draft" | "finalized" | "archived";
export type AWGGauge = 10 | 12 | 14 | 16 | 18;

// ─── User / Auth ────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  approved: boolean;
  insiderAccess: boolean;
  showroomName: string | null;
  company: string | null;
  phone: string | null;
  createdAt: string;
}

// ─── Project ────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  userId: string;
  name: string;
  clientName: string | null;
  clientAddress: string | null;
  showroomName: string | null;
  salesAssociate: string | null;
  quoteNumber: string | null;
  date: string;
  pricingDisplay: PricingTier;
  customMarkupPercent: number | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Room ───────────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  projectId: string;
  roomName: string;
  areaDescription: string | null;
  sortOrder: number;
  sections: Section[];
}

// ─── Section (Atomic Configurator Unit) ─────────────────────────────────────

export interface Section {
  id: string;
  roomId: string;
  taskDescription: string;
  tapeFamily: TapeFamily | null;
  lumenOutput: string | null;
  cct: string | null;
  runLengthInches: number | null;
  awgGauge: AWGGauge;
  entryPoints: number;
  distanceToPower: number;
  powerType: PowerType;
  channelType: string | null;
  channelFinish: ChannelFinish | null;
  diffuserType: string | null;
  connectorColor: ConnectorColor;
  sortOrder: number;
}

// ─── Validation ─────────────────────────────────────────────────────────────

export interface SectionValidation {
  sectionId: string;
  runLengthFeet: number;
  roundedLengthInches: number;
  roundedLengthFeet: number;
  totalWattage: number;
  wattagePerEntry: number;
  loadCheck: "PASS" | "FAIL";
  footagePerRun: number;
  maxRunCheck: "PASS" | "FAIL";
  voltageDropPercent: number;
  voltageDropCheck: "PASS" | "WARN" | "FAIL";
  powerSuppliesRequired: number;
  connectorsNeeded: number;
  bomBlocked: boolean;
  blockReasons: string[];
}

export interface RoomValidation {
  roomId: string;
  totalWattage: number;
  sectionValidations: SectionValidation[];
  hasBlockedSections: boolean;
}

// ─── BOM ────────────────────────────────────────────────────────────────────

export interface BOMLineItem {
  itemType: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: Record<PricingTier, number | null>;
  extendedPrice: Record<PricingTier, number | null>;
}

export interface SectionBOM {
  sectionId: string;
  taskDescription: string;
  validation: SectionValidation;
  items: BOMLineItem[];
  sectionTotal: Record<PricingTier, number>;
}

export interface RoomBOM {
  roomId: string;
  roomName: string;
  sectionBOMs: SectionBOM[];
  roomTotal: Record<PricingTier, number>;
}

export interface AggregatedBOMItem {
  partNumber: string;
  description: string;
  totalQuantity: number;
  unitPrice: Record<PricingTier, number | null>;
  extendedPrice: Record<PricingTier, number>;
  sourceRooms: string[];
  sourceSections: string[];
}

export interface ProjectBOMResult {
  roomBOMs: RoomBOM[];
  aggregatedItems: AggregatedBOMItem[];
  projectTotal: Record<PricingTier, number>;
}

// ─── Data Types (from JSON files) ───────────────────────────────────────────

export interface PricingEntry {
  description: string;
  pdn: number | null;
  umap: number | null;
  insiderFlag: boolean;
  insiderPrice: number | null;
  limitedFlag: boolean;
  limitedPrice: number | null;
}

export type PricingDB = Record<string, PricingEntry>;

export interface ProductSpec {
  family: TapeFamily;
  model: string;
  lumensPerFt: number;
  wattsPerFt: number;
  maxRun60W: number;
  maxRun96W: number;
  cutIntervalInches: number;
  cctOptions: string;
  cri: number;
  voltage: number;
}

export interface ChannelEntry {
  type: string;
  partAL: string;
  partBK: string;
  partWT: string;
  endCap: string;
  lengthFt: number;
}

export interface PowerSupplyEntry {
  family: TapeFamily;
  default96wHW: string;
  default60wHW: string;
  plugIn: string;
  powerConnector: string;
  wiringBox: string;
}

export interface LookupTables {
  channels: ChannelEntry[];
  powerSupplies: PowerSupplyEntry[];
  lumenOptions: Record<string, string[]>;
  cctOptions: Record<string, string[]>;
  defaultSpoolFt: Record<string, number>;
}

export type AWGResistanceTable = Record<string, number>;
