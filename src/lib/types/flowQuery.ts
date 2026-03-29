/**
 * Flow Query Types
 * Request/response types for zone-to-zone visitor flow analysis.
 */

/** Direction of the flow query */
export type FlowDirection = 'outbound' | 'inbound' | 'between';

/** A single edge in the flow breakdown */
export interface FlowEdge {
  /** Source zone id */
  from: string;
  /** Source zone display name (Finnish) */
  fromName: string;
  /** Destination zone id */
  to: string;
  /** Destination zone display name (Finnish) */
  toName: string;
  /** Estimated visitors on this edge */
  visitors: number;
  /** Share of total origin traffic (0–1) */
  share: number;
}

/** Request body for /api/flow-query/[mallId] */
export interface FlowQueryRequest {
  /** Origin zone id */
  origin: string;
  /** Query direction */
  direction: FlowDirection;
  /** Optional destination zone id (required for 'between') */
  destination?: string;
  /** Hour of day (10–21) */
  hour: number;
  /** Day of week (0=Sun … 6=Sat) */
  dayOfWeek: number;
}

/** Response from /api/flow-query/[mallId] */
export interface FlowQueryResponse {
  /** Origin zone id */
  origin: string;
  originName: string;
  /** Direction queried */
  direction: FlowDirection;
  /** Optional destination (for 'between' queries) */
  destination?: string;
  destinationName?: string;
  /** Total visitors involved in this flow */
  totalVisitors: number;
  /** Breakdown edges sorted by visitors desc */
  edges: FlowEdge[];
  /** Narrative summary (EN) */
  narrativeEn: string;
  /** Narrative summary (FI) */
  narrativeFi: string;
  /** Hour used */
  hour: number;
  /** Day of week used */
  dayOfWeek: number;
}
