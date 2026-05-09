import type {
  IntelligenceDomain,
  RuntimeActor,
  RuntimeArtifact,
  RuntimeContext,
  RuntimeDecision,
  RuntimeRun,
  RuntimeScope,
  RuntimeStage,
  RuntimeStatus,
} from './runtime.js';
import type { RuntimePort } from './runtime-port.js';
import { DefaultScopeGuard, type ScopeGuard } from './scope.js';

export interface StartRuntimeRunInput {
  runId: string;
  domain: IntelligenceDomain;
  scope: RuntimeScope;
  actor: RuntimeActor;
  correlationId: string;
  startedAt?: string;
  idempotencyKey?: string;
}

export interface RuntimeRunHandle {
  run: RuntimeRun;
  context: RuntimeContext;
}

export class RuntimeScopeError extends Error {
  constructor(public reasons: string[]) {
    super(`Runtime scope denied: ${reasons.join(',')}`);
    this.name = 'RuntimeScopeError';
  }
}

export class RuntimeController {
  constructor(
    private port: RuntimePort,
    private scopeGuard: ScopeGuard = new DefaultScopeGuard(),
  ) {}

  async startRun(input: StartRuntimeRunInput): Promise<RuntimeRunHandle> {
    const decision = this.scopeGuard.assertAccessible(input.scope, input.actor);
    if (!decision.allowed) throw new RuntimeScopeError(decision.reasons);

    const existing = await this.port.get(input.runId);
    if (existing) return { run: existing, context: contextFromRun(existing, input.actor) };

    const now = input.startedAt ?? new Date().toISOString();
    const run: RuntimeRun = {
      id: input.runId,
      domain: input.domain,
      scope: input.scope,
      status: 'running',
      stages: [],
      decisions: [],
      artifactIds: [],
      actorId: input.actor.id,
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.port.create(run);
    return { run: created, context: contextFromRun(created, input.actor) };
  }

  async recordStage(runId: string, stage: RuntimeStage): Promise<RuntimeRun> {
    return requireRun(await this.port.appendStage(runId, stage), runId);
  }

  async recordDecision(runId: string, decision: RuntimeDecision): Promise<RuntimeRun> {
    return requireRun(await this.port.appendDecision(runId, decision), runId);
  }

  async recordArtifact(runId: string, artifact: RuntimeArtifact): Promise<RuntimeRun> {
    return requireRun(await this.port.appendArtifact(runId, artifact.id), runId);
  }

  async completeRun(runId: string, status: RuntimeStatus): Promise<RuntimeRun> {
    return requireRun(await this.port.updateStatus(runId, status), runId);
  }
}

function contextFromRun(run: RuntimeRun, actor: RuntimeActor): RuntimeContext {
  return {
    runId: run.id,
    domain: run.domain,
    scope: run.scope,
    actor,
    correlationId: run.correlationId ?? run.id,
    startedAt: run.createdAt,
  };
}

function requireRun(run: RuntimeRun | null, runId: string): RuntimeRun {
  if (!run) throw new Error(`Runtime run not found: ${runId}`);
  return run;
}
