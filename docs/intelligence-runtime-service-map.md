# Intelligence Runtime Service Map

Status: Phase 0 mapping artifact.

## Shared Platform Owns

- Runtime run, stage, decision, and artifact tracking
- Memory tiers for fresh signals, background context, evidence, retrieval, and UI cache
- Quality envelope and validation decisions
- Learning events, policy packs, offline evaluation gates, and shadow promotion
- Agent definitions, typed tools, scopes, and registry routing
- Cache keys, tags, and invalidation conventions
- API contract and client generation conventions
- Observability, smoke checks, and release gates

## Domain Services Own

- Source collection for their segment
- Signal enrichment and entity extraction
- Domain scoring semantics
- Result shaping for users
- Domain tools and agent wording
- i18n copy and domain-specific UI labels

## ShopperMind Mapping

Current maturity: production candidate.

Platform adoption target:
- Map `CoordinatorRun` to `RuntimeRun`
- Map publish gate outputs to `RuntimeDecision`
- Convert phenomenon corpus rows to `MemoryDocument`
- Use `QualityEnvelope` before publishing, caching, or agent use
- Emit `PolicyTrainingEvent` objects for review and feedback outcomes
- Register ShopperMind agents through shared `AgentDefinition` and typed tools
- Expose `qualityView` with evidence, decision reasons, and handling mode on
  user-visible materialized results

Domain-owned logic:
- Retail and mall trend source collection
- Phenomenon clustering, market scoring, retail action shaping
- ShopperMind-specific i18n and UI content

Current bridge:
- `services/shoppermind/src/engine/runtime/coordinator-runtime.ts`
  maps existing coordinator rows to shared runtime runs without changing
  the ShopperMind database schema.
- `services/shoppermind/src/engine/memory/` materializes market overview,
  phenomenon detail, and retrieval corpus caches with explicit fresh and stale
  metadata.
- `services/shoppermind/src/engine/learning/` maps review and feedback rows to
  shared policy training events.
- `services/shoppermind/src/engine/agents/` registers ShopperMind agent and
  tool definitions without forking the platform runtime.
- `services/shoppermind/src/engine/observability/` exposes platform-shaped API,
  cache, queue, run, source-fetch, publish, review, and LLM/tool metrics.
- `services/shoppermind/src/engine/signals/` materializes daily Signal of the
  Day records from market-scoped phenomenon scores and refreshes shared memory
  caches for UI and chat consumers.
- `services/shoppermind/scripts/release-gate.ts` reports build, lint, Prisma,
  seed, contract, migration, governance, and smoke checks through the shared
  `ReleaseGateReport` shape.
- `services/shoppermind/src/http/security/` applies shared rate-limit policy
  through a Redis-backed `RateLimitStore` outside test mode.

## VenueMind Mapping

Current maturity: ready-to-serve pilot foundation.

Platform adoption target:
- Adopt `@stelthion/intelligence-runtime@0.13.0`, not earlier foundation sketches
- Use `RuntimeContext` for venue brief generation
- Convert event and zone signals to `MemoryDocument`
- Use `QualityEnvelope` before operational recommendations are shown
- Register VenueMind agents through shared `AgentDefinition` and typed tools
- Expose `qualityView` with evidence, decision reasons, and handling mode on
  served venue insights
- Add service smoke checks before moving beyond demo data

Current bridge:
- `services/venuemind/src/adapter.ts` implements the shared
  `IntelligenceDomainAdapter`.
- `services/venuemind/src/materialized.ts` exposes a UI-ready materialized
  overview using the shared `MaterializedInsight` envelope.
- `services/venuemind/src/agents.ts` registers VenueMind agent and tool
  definitions through the shared registry contracts.
- `services/venuemind/src/http/` exposes internal health, metrics,
  governance, cache invalidation, and versioned venue overview routes.
- `services/venuemind/scripts/release-gate.ts` reports build, lint, test, and
  governance checks through the shared `ReleaseGateReport` shape.

Domain-owned logic:
- Venue event, visitor, zone, queue, and transport signals
- Venue-specific operational scoring
- VenueMind-specific i18n and UI content

## Future Segment Mapping

New segments must start with a domain adapter, not a copied runtime.

Required first files:
- domain adapter
- memory document builder
- quality mapping
- learning event mapper
- typed tool and agent definitions
- smoke check
- contract surface

No future segment should implement its own runtime, cache, validation gate, or release policy unless the shared platform cannot support the requirement.

Domain names are open strings. Use lowercase names with no spaces. Use dotted names for segment variants, for example `shoppermind.airport`.
