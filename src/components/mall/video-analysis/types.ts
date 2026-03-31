export type AnalysisMode = 'ZONE_COUNT' | 'AB_TRACKING' | 'JOURNEY_MAP' | 'STORE_BEHAVIOR' | 'FLOW_QUERY';

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
  sampleSize: number;
  originZoneId: string | null;
  destinationZoneId: string | null;
  selectedZoneIds: string | null;
  status: string;
  progress: number;
  errorMessage: string | null;
  edgeDeviceId: string | null;
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

export interface StoreBehavior {
  zoneId: string;
  hour: number;
  walkBy: number;
  stop: number;
  enter: number;
}

export interface AnalysisInsight {
  id: string;
  jobId: string;
  source: 'edge' | 'server';
  summary: string;
  recommendations: string | null;
  alertLevel: 'info' | 'warning' | 'critical';
  createdAt: string;
}

// Unified selection state — drives mode detection
export interface AnalysisSelection {
  cameraIds: string[];
  zoneIds: string[];
}

// Inferred from selection. When activeMode is provided, it takes priority
// for zone-based modes (resolves JOURNEY_MAP vs FLOW_QUERY ambiguity).
export function inferMode(sel: AnalysisSelection, activeMode?: AnalysisMode | null): AnalysisMode | null {
  const { cameraIds, zoneIds } = sel;

  // If user explicitly selected FLOW_QUERY mode, zone clicks drive flow query
  if (activeMode === 'FLOW_QUERY') {
    if (zoneIds.length >= 1) return 'FLOW_QUERY';
    return null;
  }

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
  sampleSize: number;
}
