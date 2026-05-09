import type { RuntimeDecision, RuntimeRun, RuntimeStage, RuntimeStatus } from './runtime.js';

export interface RuntimeRunFilter {
  status?: RuntimeStatus;
  domain?: string;
  customerId?: string;
  limit?: number;
}

export interface RuntimePort {
  create(run: RuntimeRun): Promise<RuntimeRun>;
  get(id: string): Promise<RuntimeRun | null>;
  list(filter?: RuntimeRunFilter): Promise<RuntimeRun[]>;
  updateStatus(id: string, status: RuntimeStatus): Promise<RuntimeRun | null>;
  appendStage(id: string, stage: RuntimeStage): Promise<RuntimeRun | null>;
  appendDecision(id: string, decision: RuntimeDecision): Promise<RuntimeRun | null>;
  appendArtifact(id: string, artifactId: string): Promise<RuntimeRun | null>;
}

export class InMemoryRuntimePort implements RuntimePort {
  private runs = new Map<string, RuntimeRun>();

  async create(run: RuntimeRun): Promise<RuntimeRun> {
    this.runs.set(run.id, cloneRun(run));
    return cloneRun(run);
  }

  async get(id: string): Promise<RuntimeRun | null> {
    const run = this.runs.get(id);
    return run ? cloneRun(run) : null;
  }

  async list(filter: RuntimeRunFilter = {}): Promise<RuntimeRun[]> {
    const runs = Array.from(this.runs.values()).filter((run) => matches(run, filter));
    return runs.slice(0, filter.limit ?? runs.length).map(cloneRun);
  }

  async updateStatus(id: string, status: RuntimeStatus): Promise<RuntimeRun | null> {
    const run = this.runs.get(id);
    if (!run) return null;
    const updated = { ...run, status, updatedAt: new Date().toISOString() };
    this.runs.set(id, updated);
    return cloneRun(updated);
  }

  async appendStage(id: string, stage: RuntimeStage): Promise<RuntimeRun | null> {
    const run = this.runs.get(id);
    if (!run) return null;
    const updated = { ...run, stages: [...run.stages, stage], updatedAt: new Date().toISOString() };
    this.runs.set(id, updated);
    return cloneRun(updated);
  }

  async appendDecision(id: string, decision: RuntimeDecision): Promise<RuntimeRun | null> {
    const run = this.runs.get(id);
    if (!run) return null;
    const updated = { ...run, decisions: [...run.decisions, decision], updatedAt: new Date().toISOString() };
    this.runs.set(id, updated);
    return cloneRun(updated);
  }

  async appendArtifact(id: string, artifactId: string): Promise<RuntimeRun | null> {
    const run = this.runs.get(id);
    if (!run) return null;
    const artifactIds = Array.from(new Set([...run.artifactIds, artifactId]));
    const updated = { ...run, artifactIds, updatedAt: new Date().toISOString() };
    this.runs.set(id, updated);
    return cloneRun(updated);
  }
}

function cloneRun(run: RuntimeRun): RuntimeRun {
  return JSON.parse(JSON.stringify(run)) as RuntimeRun;
}

function matches(run: RuntimeRun, filter: RuntimeRunFilter): boolean {
  if (filter.status && run.status !== filter.status) return false;
  if (filter.domain && run.domain !== filter.domain) return false;
  if (filter.customerId && run.scope.customerId !== filter.customerId) return false;
  return true;
}
