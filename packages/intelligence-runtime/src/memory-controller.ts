import type { MemoryDocument, MemoryPort, MemoryQuery } from './memory.js';
import type { RuntimeActor, RuntimeScope } from './runtime.js';
import { DefaultScopeGuard, type ScopeGuard } from './scope.js';
import { RuntimeScopeError } from './runtime-controller.js';

export class MemoryController {
  constructor(
    private port: MemoryPort,
    private scopeGuard: ScopeGuard = new DefaultScopeGuard(),
  ) {}

  async upsert(document: MemoryDocument, actor: RuntimeActor): Promise<void> {
    this.assertScope(document.scope, actor);
    await this.port.upsert(document);
  }

  async search(query: MemoryQuery, actor: RuntimeActor): Promise<MemoryDocument[]> {
    this.assertScope(query.scope, actor);
    return this.port.search(query);
  }

  async deleteExpired(now: Date): Promise<number> {
    return this.port.deleteExpired(now);
  }

  private assertScope(scope: RuntimeScope, actor: RuntimeActor): void {
    const decision = this.scopeGuard.assertAccessible(scope, actor);
    if (!decision.allowed) throw new RuntimeScopeError(decision.reasons);
  }
}
