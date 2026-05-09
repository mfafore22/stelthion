# Stelthion Intelligence Runtime - Phase 0 to 5

Status: backend/platform starting point with ShopperMind and VenueMind adopters.

## Goal

Create shared intelligence capabilities that benefit ShopperMind, VenueMind, and future segment services. Domain services keep their own business logic, while the platform owns runtime, memory, quality, cache, contracts, and release checks.

## Phase 0 - Stabilize and map

- Treat `@stelthion/intelligence-runtime` as the shared contract package.
- Keep ShopperMind and VenueMind adoption incremental.
- Keep API, worker, and UI changes in separate later branches.
- Add missing service smoke checks before release hardening.
- Keep the runtime workflow limited to build, lint, and test for the package.
- Move generated API contracts into a later focused backend branch.

## Phase 1 - Runtime control plane

Shared concepts now live in `packages/intelligence-runtime/src/runtime.ts`:

- `RuntimeRun`
- `RuntimeStage`
- `RuntimeDecision`
- `RuntimeContext`
- `RuntimeScope`

The shared package also exposes `RuntimeController`, `RuntimePort`, and
`InMemoryRuntimePort`. Services should use the controller as the single path
for starting scoped runs, recording stage transitions, writing decisions,
linking artifacts, and completing runs.

ShopperMind can map coordinator runs and review decisions to these contracts. VenueMind can use the same contracts when it grows from demo logic into service runtime.

## Phase 2 - Memory and cache

Shared memory and cache contracts now define:

- fresh signal memory
- background context memory
- verified evidence memory
- retrieval memory
- UI cache, välimuistikerros

`MemoryTier = ui_cache` is durable, queryable memory for user-ready outputs
that must survive process restarts and remain auditable. `CacheLayer` is the
transient read-through layer used to serve repeated API, retrieval, and agent
context requests quickly. A cached entry may point to a `ui_cache` document,
but invalidating cache must not delete durable memory.

The next backend step is adding adapters that build `MemoryDocument` objects from ShopperMind phenomena and VenueMind venue signals.

Phase 2 now provides `MemoryController`, `InMemoryMemoryPort`,
`CacheController`, and `InMemoryCachePort`. ShopperMind also has Redis-backed
materialized caches for market overview, phenomenon detail, and market-scoped
retrieval corpus. Pipeline completion invalidates the market cache and
rematerializes overview and retrieval snapshots.

ShopperMind chat now reads prebuilt retrieval documents by market and window.
The mall BFF overview route now reads a stable materialized market overview
snapshot instead of composing market, phenomenon, and signal reads on demand.
Both overview and retrieval snapshots expose `materializedAt`, `expiresAt`, and
`freshness` so stale and fresh content stay explicit.

The shared platform now also owns `MaterializedInsight`, a generic envelope for
UI-ready and retrieval-ready materialization. ShopperMind and VenueMind both use
that envelope. VenueMind exposes a first-class domain adapter and materialized
overview snapshot for venue operations.

## Phase 3 - Adaptive quality and validation

`QualityEnvelope` now combines confidence, source strength, source count,
recency, contradiction risk, divergence risk, feedback, lifecycle risk, and
sensitivity. It returns platform decision, UI visibility, chat caution,
reasons, and handling mode.

The platform also defines validation ports for source trust, freshness,
contradictory evidence, source count, and sensitive claims. Services can plug
their own validators into the same `ValidationPort` contract and aggregate
warnings or blockers before an insight is shown, cached, or sent to chat.

ShopperMind now applies the envelope in the publish gate and exposes
`qualityView` on materialized overview, phenomenon detail, and chat citations.
VenueMind exposes `qualityView` on the materialized venue overview. Product
copy remains i18n-owned by each service.

## Phase 4 - Learning loop

The platform now defines `PolicyTrainingEvent`, `PolicyPack`,
`EvaluationDataset`, `PolicyPrediction`, and `PolicyEvaluationResult`.
Review outcomes, user feedback, offline evaluations, and shadow evaluations can
share one learning event shape instead of becoming service-specific export rows.

Policy packs are versioned by domain, market, and maturity stage. A candidate
policy must run in `shadow` status and pass evaluation gates before
`activatePolicyPack` can return an active policy. The default gates cover
coverage, accuracy, and regression rate so production behavior does not change
silently.

Phase 7.1 adds `startPolicyShadow`, `recordShadowEvaluation`, and
`activateShadowPolicy` so services promote policy packs through one managed
`LearningPort` workflow instead of hand-rolled status changes.

ShopperMind now maps review exports and feedback rows into platform policy
training events. The old NDJSON review export remains available, and new
internal exports expose review and feedback policy events. VenueMind can emit
the same event shape when operator reviews and venue feedback arrive.

## Phase 5 - Generalized agent runtime

The platform now defines typed tool contracts, agent capabilities, allowed tool
sets, memory tiers, validation requirements, output contracts, and runtime scope
constraints through `RuntimeToolDefinition` and `AgentDefinition`.

`InMemoryAgentRegistry` provides a reference registry for tests, demos, and
service adapters. ShopperMind and VenueMind each define their own small agent
and tool config files while the shared runtime owns the routing and validation
shape. The Concierge router now selects agents through this registry model
instead of hardcoded product routing branches.

New segment products should add a domain adapter, typed tools, and agent
definitions. They should not fork routing, tool permission, validation, or
memory rules.

## Phase 6.1a - Persistent learning port

ShopperMind now has a Prisma-backed `LearningPort` implementation with service
tables for persisted policy training events, policy packs, and policy evaluation
results. The in-memory port remains the package reference implementation for
tests and demos.

Policy training events persist through the ShopperMind service composition
root. Feedback writes append `user_feedback` events, and approved or rejected
review items append `review_outcome` events. Internal policy-event export routes
now read from the persisted learning port instead of recomputing event rows on
demand.

Learning events carry retention metadata. Actor identifiers are stored as
SHA-256 pseudonyms, obvious sensitive JSON keys are removed before persistence,
and the retention pass clears actor hashes, notes, labels, and metadata before
event deletion.

## Phase 6.1b - Contract tests
<!-- gate:phase-6.1b -->

ShopperMind now has focused contract tests for the new Phase 4 and Phase 5
surfaces. The tests pin learning NDJSON record shape, persisted policy training
event shape, user feedback policy-event shape, and shared agent registry routing
output shape.

These tests stay narrow on purpose. Older quality, freshness, evidence, and
materialized-cache contracts are stable enough to land in a follow-up release
gate pass without coupling them to the learning persistence migration.

## Phase 6.2 - Security gates and rate limits
<!-- gate:phase-6.2 -->

The shared runtime now exposes route security classes, rate-limit decision
helpers, and agent governance validation. Services can classify routes as
`public`, `internal`, `agent`, or `export` without copying the policy logic.

ShopperMind now applies an in-process rate-limit guard before route handlers.
Export and agent routes receive stricter limits than public and internal
routes. Rate-limit principals are keyed by hashed bearer token when present,
falling back to request IP for unauthenticated liveness traffic.
This is a Phase 6.2 baseline: use a Redis-backed limiter before running
multiple production replicas.

ShopperMind also exposes an internal governance check that validates registered
agent definitions have scope constraints, validation requirements, and
registered tools. Persisted policy training events are rejected at the port
boundary when no customer, market, property, or venue scope is present.

## Phase 6.3 - Observability baseline
<!-- gate:phase-6.3 -->

The shared runtime now exposes `MetricsPort`, `MetricPoint`, `MetricSummary`,
and helper constructors for counters, gauges, and timings. The platform owns
the metric shape while each service owns how local telemetry is gathered.

ShopperMind now records API request count, API latency, API error count, and
Redis-backed cache hit rate through the shared metric shape. It also exposes an internal
metrics snapshot for queue depth, run duration, failed source fetches, publish
ratio, review SLA, cache hit rate, API latency, and LLM/tool error readiness.

`GET /internal/metrics` is internal-bearer protected and is intended for
release-gate and dashboard callers. Phase 6.6 completes this by replacing the
LLM/tool placeholder with measured LLM, embedding, and tool error-rate
summaries.

## Phase 6.4 - Release gates
<!-- gate:phase-6.4 -->

The shared runtime now exposes `ReleaseGateReport`, `ReleaseGateCheck`, and
release finding contracts. Services can report build, lint, migration, seed,
smoke, governance, contract, and rollback checks through one pass, warning, or
blocker shape.

ShopperMind now has `npm run release:gate --workspace=@stelthion/shoppermind`.
It runs the shared runtime lint and tests, ShopperMind lint and build,
ShopperMind Prisma schema validation, seed bootstrap checks, Phase 6 contract
checks, static migration rollback checks, governance freshness checks, and
optional internal endpoint smoke checks.

Live smoke checks call `/internal/health`, `/internal/governance`, and
`/internal/metrics` when `SHOPPERMIND_SMOKE_BASE_URL` and
`SHOPPERMIND_INTERNAL_TOKEN` are set. Local runs warn when smoke is not
configured. Deploy jobs should set `SHOPPERMIND_REQUIRE_SMOKE=true` so missing
or failing live smoke blocks the release.

## Phase 6.5 - Production rate limiting
<!-- gate:phase-6.5 -->

The shared runtime now exposes `RateLimitStore` as the platform boundary for
rate-limit state. Policy decisions still use shared `RateLimitPolicy`,
`RateLimitDecision`, and `evaluateRateLimit` semantics, but production services
can store counters in a distributed backend.

ShopperMind now uses a Redis-backed fixed-window `RateLimitStore` outside test
mode. The Redis update is atomic through a Lua script so replicas share one
counter window per route class and principal. `RATE_LIMIT_STORE=memory` remains
available for tests and local fallback, but it is rejected when
`NODE_ENV=production`.

## Phase 6.6 - Observability completion
<!-- gate:phase-6.6 -->

The shared runtime now exposes `metricRatio` so release dashboards and deploy
checks can derive stable error-rate summaries from counter metrics.

ShopperMind now wraps the LLM and embedding clients at the engine boundary. The
internal metrics snapshot reports LLM call count, LLM errors, embedding call
count, embedding errors, tool calls, tool errors, latency metrics,
Redis-backed cache hit rate, and derived error rates instead of returning
`not_instrumented`.

## Phase 7.1 - Policy promotion workflow

The shared runtime now owns the safe policy promotion sequence. Services can
move a draft pack into shadow, record a shadow evaluation, and activate only
after a passing evaluation exists. Activation retires active peer packs for the
same domain and market by default.

This keeps learning from review and feedback explicit: policy packs can be
tested and promoted, but production behavior cannot change silently through a
direct status write. Activation now carries the evaluation reference, rejects
stale evaluations by default, records `retiredAt` on retired peers, and uses
`keepActivePeers: true` as the explicit opt-in for the dangerous multi-active
state.

## Phase 7.2 - Daily signal materialization

ShopperMind now has a recurring internal cron path for Signal of the Day
freshness. `/internal/cron/signal-of-the-day` selects the top market-scoped
phenomenon score for each active market, upserts a dated Signal of the Day
record, writes localized narrative payloads, and refreshes the same
materialized overview and retrieval caches used by the UI and chat.

This replaces one-shot date repair with an operational step. The SOTD date is
fresh only when the cron has run, while the materialized record still carries
the score date used to produce it.

## Phase 7.3 - VenueMind service parity shell

VenueMind now has the first production-service shell around the shared
platform adapter. It exposes internal health, governance, metrics, cache
invalidation, versioned venue list, and materialized venue overview routes
without copying ShopperMind runtime internals.

The VenueMind workspace now has build, lint, test, smoke, and release-gate
scripts. Its release gate reports through `ReleaseGateReport` and blocks on
build, lint, test, or agent-governance failures.

## Boundary Rules

- Platform code must not know ShopperMind or VenueMind internals.
- Domain adapters translate local entities into shared contracts.
- UI copy remains service-specific and i18n-driven.
- Customer, property, market, and venue scopes must be carried through every runtime and memory call.
- Quality decisions should use `QualityEnvelope` before content is displayed, cached, or sent to an agent.

## Next Implementation Steps

1. Add severity-weighted regression gates for policy evaluation.
2. Add service table backed cache and rate-limit adapters for customers that cannot run Redis.
3. Add VenueMind HTTP/API routes around the existing adapter and overview snapshot.
4. Move the mall detail BFF route to the market-scoped detail snapshot.
5. Add OpenAPI contract tests for quality, evidence, and freshness fields.
6. Add service smoke tests that verify quality blockers prevent publication.
7. Add persisted agent registry storage for production.
8. Add broader contract tests for quality, freshness, evidence, and materialized caches.
9. Add deploy-time smoke gate wiring with `SHOPPERMIND_REQUIRE_SMOKE=true`.
10. Add root and VenueMind release gates using the same `ReleaseGateReport`
    shape.
11. Schedule `/internal/cron/signal-of-the-day` in the production cron runner
    after daily scoring completes.
12. Add internal ShopperMind policy endpoints for draft-to-shadow, shadow
    evaluation, and activation through `activateShadowPolicy`.
13. Replace VenueMind demo data with durable venue memory and source adapters.
