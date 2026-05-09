# Changelog

## 0.13.0

- Hardened policy promotion with a default 30-day evaluation freshness guard.
- Added activation evaluation metadata and retired peer timestamps to promoted policy packs.
- Added `keepActivePeers` as the explicit opt-in for leaving active peer packs in place during activation.
- Migration: persisted learning ports should reject direct `active` policy-pack writes unless they reference a fresh stored passing evaluation.

## 0.12.0

- Added policy promotion workflow helpers for draft, shadow evaluation, recorded evaluation, active promotion, and active-peer retirement through `LearningPort`.
- Migration: services should use `startPolicyShadow`, `recordShadowEvaluation`, and `activateShadowPolicy` instead of hand-rolling policy promotion.

## 0.11.0

- Added `MetricRatio` and `metricRatio` helpers for release dashboards and deploy gates that need error-rate summaries.
- Migration: services should replace placeholder LLM/tool observability with measured error rates where invocation boundaries exist.

## 0.10.0

- Added `RateLimitStore` and `InMemoryRateLimitStore` so services can share rate-limit policy contracts while choosing distributed or local state adapters.
- Added `MacroContextPort` contract and `ImfMacroContextAdapter` so multiple services can read shared global macro indicators (IMF DataMapper baseline) without each implementing its own HTTP client. Trend formation stays service-specific; this only delivers raw indicator values.
- Migration: production services should use a distributed `RateLimitStore` such as Redis. In-memory stores are for tests and local fallback only. Services consuming `MacroContextPort` should cache fetch results - the adapter does not memoize across calls.

## 0.9.0

- Added shared release gate report, check, finding, pass, warning, and failure contracts.
- Migration: services should report release blockers through `ReleaseGateReport` so CI and deploy jobs can enforce the same result shape.

## 0.8.0

- Added shared metrics contracts, in-memory metrics port, and counter, gauge, and timing helpers.
- Migration: services should publish route latency, cache hit rate, queue, run, source-fetch, publish, review, and LLM/tool error metrics through platform-shaped snapshots.

## 0.7.0

- Added route security class and rate-limit decision helpers.
- Added agent governance validation helpers for scope, validation, and tool registration checks.
- Added scope assertion for persisted policy training events.
- Migration: services should enforce rate limits before expensive route handlers and fail release checks when registered agents miss required scopes or validation rules.
- Note: the ShopperMind 6.2 adapter starts with per-process rate-limit state. Use a shared Redis-backed state store before horizontal production scaling.

## 0.6.0

- Added learning retention policy helpers for persisted policy training events.
- Added `since` and `until` filters to `TrainingEventFilter`.
- Migration: persisted learning ports should pseudonymize actor identifiers and prune notes, labels, and metadata according to retention policy.

## 0.5.0

- Added platform learning loop contracts for policy training events, policy packs, offline evaluation datasets, evaluation gates, and shadow promotion checks.
- Added `LearningPort` and `InMemoryLearningPort` for tests and demo adapters.
- Added `AgentDefinition`, typed tool contracts, agent capabilities, scope constraints, validation requirements, and an in-memory agent registry.
- Added policy evaluation helpers that prevent activation unless a shadow policy pack passes configured gates.
- Migration: services that promote policy changes should emit `PolicyTrainingEvent` objects and run `evaluatePolicyCandidate` before activating a candidate policy pack.

## 0.4.0

- Expanded `QualityEnvelope` with recency, source count, divergence, feedback, lifecycle, UI visibility, chat caution, and shared decision fields.
- Added validation port contracts for source trust, freshness, contradiction, source count, and sensitive claims.
- Added validation summary helper and tests.
- Migration: user-visible insight contracts should expose quality, freshness, evidence, decision reasons, and handling mode.

## 0.3.0

- Added `MemoryController` for actor-scoped memory reads and writes.
- Added `InMemoryMemoryPort` for tests and demo adapters.
- Added `CacheController` for typed cache get, set, get-or-set, and tag invalidation.
- Added `InMemoryCachePort` for tests and local demos.
- Added `MaterializedInsight` for shared UI-ready and retrieval-ready freshness envelopes.
- Added Phase 2 ShopperMind and VenueMind memory projection and cache bridge notes.

## 0.2.0

- Added actor-aware `RuntimeContext`.
  - Migration: every existing runtime context must now pass `actor`.
- Added `RuntimeArtifact`.
- Added `RuntimePort` and `InMemoryRuntimePort`.
  - Migration: runtime persistence implementations must support listing runs and appending stages, decisions, and artifacts.
- Added `RuntimeController` for actor-scoped run start, stage recording, decision recording, artifact recording, and completion.
- Added `ScopeGuard` and `DefaultScopeGuard`.
  - Migration: actors must carry explicit scope lists for every requested scope dimension.
- Added `LocalizedText` for user-facing result text.
  - Migration: adapters should return i18n keys or explicit literals instead of rendered strings.
- Added adapter `onDecision` and `onFeedback` hooks.
  - Migration: feedback events use typed `accepted`, `rejected`, or `corrected` outcomes.
- Added `QualityPolicy` and `DEFAULT_QUALITY_POLICY`.
  - Migration: domains may pass policy overrides to `buildQualityEnvelope`.
- Added package tests for quality and cache helpers.
- Added package lint and test scripts.

## 0.1.0

- Added initial shared runtime, memory, cache, quality, and adapter contracts.
