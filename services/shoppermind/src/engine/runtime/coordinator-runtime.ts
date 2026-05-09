type CoordinatorStage = 'ingest' | 'cluster' | 'score' | 'publish';
type RuntimeStageKind = 'collect' | 'enrich' | 'score' | 'publish';
type RuntimeStatus = 'running' | 'succeeded' | 'partial' | 'failed' | 'cancelled';

interface RuntimeStageProjection {
  name: RuntimeStageKind;
  status: RuntimeStatus;
  startedAt: string;
  finishedAt?: string;
}

export interface RuntimeRunProjection {
  id: string;
  domain: 'shoppermind';
  scope: { marketId?: string };
  status: RuntimeStatus;
  stages: RuntimeStageProjection[];
  decisions: [];
  artifactIds: [];
  actorId: 'shoppermind-worker';
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoordinatorRunRow {
  id: string;
  status: string;
  marketIds: string[];
  stages: string[];
  startedAt: Date;
  finishedAt?: Date | null;
  summary?: unknown;
}

const STAGE_MAP: Record<CoordinatorStage, RuntimeStageKind> = {
  ingest: 'collect',
  cluster: 'enrich',
  score: 'score',
  publish: 'publish',
};

export function coordinatorRunToRuntimeRun(row: CoordinatorRunRow): RuntimeRunProjection {
  const status = mapStatus(row.status);
  const stages = row.stages
    .filter(isCoordinatorStage)
    .map((stage): RuntimeStageProjection => ({
      name: STAGE_MAP[stage],
      status,
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString(),
    }));

  return {
    id: row.id,
    domain: 'shoppermind',
    scope: { marketId: row.marketIds.join(',') || undefined },
    status,
    stages,
    decisions: [],
    artifactIds: [],
    actorId: 'shoppermind-worker',
    correlationId: row.id,
    createdAt: row.startedAt.toISOString(),
    updatedAt: (row.finishedAt ?? row.startedAt).toISOString(),
  };
}

function isCoordinatorStage(stage: string): stage is CoordinatorStage {
  return stage === 'ingest' || stage === 'cluster' || stage === 'score' || stage === 'publish';
}

function mapStatus(status: string): RuntimeStatus {
  if (status === 'ok') return 'succeeded';
  if (status === 'partial') return 'partial';
  if (status === 'running') return 'running';
  if (status === 'cancelled') return 'cancelled';
  return 'failed';
}
