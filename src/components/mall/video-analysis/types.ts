export type AnalysisMode = 'ZONE_COUNT' | 'AB_TRACKING' | 'JOURNEY_MAP';

export interface Camera {
  id: string;
  label: string;
  floor: string;
  x: number;
  y: number;
  zoneDbId: string | null;
}

export interface Zone {
  id: string;
  zoneId: string;
  name: string;
  nameFi: string;
  floor: string;
  svgPoints: string;
  labelX: number;
  labelY: number;
  capacity: number;
  areaSqm: number;
  category: string;
}

export interface AnalysisJob {
  id: string;
  mallId: string;
  mode: AnalysisMode;
  cameraId: string | null;
  secondaryCameraId: string | null;
  camera: { label: string; floor: string } | null;
  secondaryCamera: { label: string; floor: string } | null;
  footageDate: string;
  startTime: string;
  endTime: string;
  journeyCount: number;
  originZoneId: string | null;
  destinationZoneId: string | null;
  selectedZoneIds: string | null;
  status: string;
  createdAt: string;
}

export interface AnalysisResult {
  zoneId: string;
  hour: number;
  count: number;
  density: number;
}

export interface JobWithResults {
  id: string;
  mode: AnalysisMode;
  camera: { label: string; floor: string } | null;
  secondaryCamera: { label: string; floor: string } | null;
  footageDate: string;
  startTime: string;
  endTime: string;
  journeyCount: number;
  results: AnalysisResult[];
}

export interface JourneyPath {
  id: string;
  zoneSequence: string;
  timestamps: string;
}

export interface JourneySession {
  id: string;
  taggedCount: number;
  recognizedCount: number;
  paths: JourneyPath[];
}

export interface JourneyResponse {
  sessions: JourneySession[];
  originZoneId: string | null;
  destinationZoneId: string | null;
}

// Unified selection state — drives mode detection
export interface AnalysisSelection {
  cameraIds: string[];
  zoneIds: string[];
}

// Inferred from selection
export function inferMode(sel: AnalysisSelection): AnalysisMode | null {
  const { cameraIds, zoneIds } = sel;
  if (zoneIds.length >= 2) return 'JOURNEY_MAP';
  if (cameraIds.length === 2) return 'AB_TRACKING';
  if (cameraIds.length === 1) return 'ZONE_COUNT';
  return null;
}

// Form state for submission
export interface AnalysisFormState {
  mode: AnalysisMode;
  cameraId: string;
  secondaryCameraId: string;
  selectedZoneIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  journeyCount: number;
}
