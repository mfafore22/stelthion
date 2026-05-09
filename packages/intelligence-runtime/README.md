# Stelthion Intelligence Runtime

Shared contract package for Stelthion intelligence services.

It defines the platform layer used by ShopperMind, VenueMind, and future segment services. It does not implement domain logic, persistence, queues, LLM providers, or UI rendering.

## Owns

- Runtime scope, actor, run, stage, decision, and artifact contracts
- Runtime controller for recording run progress through a port
- Domain adapter shape
- Memory document tiers
- Memory controller and in-memory memory port
- Quality envelope, validation ports, and default quality policy
- Policy training events, policy packs, evaluation gates, and shadow promotion checks
- Policy promotion workflow helpers over `LearningPort`
- Agent definitions, typed tools, scope constraints, and registry-based routing
- Route security classes, rate-limit decision helpers, and agent governance checks
- Rate-limit store contract and in-memory reference store
- Metrics point, summary, ratio, and port contracts for release observability
- Release gate report, check, and finding contracts
- Cache key and tag conventions
- Cache controller and in-memory cache port
- Materialized insight freshness envelope
- Scope guard contract and default guard
- In-memory runtime port for tests and demos

## Does Not Own

- ShopperMind trend logic
- VenueMind venue logic
- Database schemas
- Redis or queue implementations
- User-facing copy rendering
- Frontend components

## Example

```ts
import {
  buildQualityEnvelope,
  buildCacheKey,
  type IntelligenceDomainAdapter,
} from '@stelthion/intelligence-runtime';

const quality = buildQualityEnvelope({
  confidence: 0.82,
  sourceStrength: 0.74,
  lastObservedAt: new Date(),
});

const key = buildCacheKey({
  domain: 'shoppermind',
  layer: 'overview',
  scope: { customerId: 'customer-a', marketId: 'helsinki-fi' },
});
```

## Runtime Flow

Use `RuntimeController` when a service needs to start a run or record progress. The controller enforces scope through `ScopeGuard`, writes stages, decisions, and artifacts through `RuntimePort`, and returns a `RuntimeContext` for domain adapters.

## Memory And Cache

Use `MemoryController` for durable queryable memory, including retrieval and UI-ready `ui_cache` documents. Use `CacheController` for transient read-through caching of API responses, retrieval context, and agent context. Cache invalidation must not delete memory documents.

Use `MaterializedInsight` for stable UI-ready and retrieval-ready results. It
keeps `materializedAt`, `expiresAt`, and `freshness` consistent across
ShopperMind, VenueMind, and future segments.

## Quality And Validation

Use `QualityEnvelope` before publishing, reviewing, hiding, caching, or sending
insights to chat. The envelope carries freshness, confidence, source strength,
source count, divergence, feedback, lifecycle, sensitivity, decision reasons,
handling mode, UI visibility, and chat caution.

Use `ValidationPort` for source trust, freshness, contradiction, source count,
and sensitive-claim checks. Domain services own validator implementations, but
the port and summary shape stay shared.

## Learning Loop

Use `PolicyTrainingEvent` for review outcomes, user feedback, offline
evaluation findings, and shadow evaluation results. Use `PolicyPack` for
versioned policy changes by market and maturity stage.

Use `DEFAULT_LEARNING_RETENTION_POLICY` or a stricter domain policy before
events are persisted. Actor identifiers should be pseudonymized by the
persistence adapter, and notes, labels, and metadata should be pruned by a
retention pass before the event retention window closes.

Policy packs should move from `draft` to `shadow` before they can become
`active`. `evaluatePolicyCandidate` calculates accuracy, weighted accuracy,
coverage, and regression rate. `activatePolicyPack` refuses activation unless
the candidate pack is in shadow mode and the evaluation gates pass.

Use `startPolicyShadow`, `recordShadowEvaluation`, and `activateShadowPolicy`
to run that sequence through `LearningPort`. The workflow records evaluations
before activation, rejects stale passing evaluations after 30 days by default,
stamps the activation evaluation reference into pack metadata, and retires
current active peer packs by default.

Use `keepActivePeers: true` only when a service can explicitly reason about
multiple active packs for one domain and market. Persisted ports should reject
direct `active` writes unless they reference a fresh stored passing evaluation.

## Agent Runtime

Use `AgentDefinition` and `RuntimeToolDefinition` to register agents by
capability, allowed tools, memory tiers, validation requirements, output
contract, and scope constraints. Domain services should add agents by config and
typed tools. They should not add hardcoded routing branches for each new
segment.

## Security Gates

Use `RouteSecurityClass`, `evaluateRateLimit`, and `rateLimitKey` to apply
consistent limits to public, internal, agent, and export routes. Use
`validateAgentGovernance` before release to block agents that lack scope
constraints, validation requirements, or registered tools.

Use `RateLimitStore` as the state boundary. Production services should back it
with a distributed store such as Redis. `InMemoryRateLimitStore` is for tests
and single-process demos only.

## Observability

Use `MetricsPort` plus the counter, gauge, and timing helpers for platform
shaped metrics. Services should expose snapshots for queue depth, run duration,
failed source fetches, publish ratio, review SLA, cache hit rate, API latency,
and LLM/tool error rate.

Use `metricRatio` when release dashboards need stable error-rate summaries from
counter metrics.

## Release Gates

Use `ReleaseGateReport` to return the same pass, warning, and blocker shape
from CI checks, deploy checks, smoke tests, and governance checks. A release
job should block when the report status is `blocked`.

## Adoption Rule

New services should implement `IntelligenceDomainAdapter` and use platform contracts. They should not copy runtime, memory, cache, validation, or release-check logic into the domain service.

## Domain Names

`IntelligenceDomain` is an open string so new segments can register without changing this package. Use lowercase names with no spaces. Prefer short product names such as `shoppermind` and `venuemind`. For variants, use dotted names such as `shoppermind.airport` or `venuemind.arena`.

## Scope Rule

`DefaultScopeGuard` is deny-by-default. When a runtime scope requests `marketId`, `propertyId`, or `venueId`, the actor must carry the matching scope list and value. Missing actor scope lists deny access on that dimension.

## Decision Events

`RuntimeDecision.decision` and `AdapterDecisionEvent.decision` use the same values: `publish`, `review`, `reject`, and `hold`. The runtime decision is the intended handling, while the adapter event records that the decision was applied.
