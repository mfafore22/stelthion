# Stability

The package is pre-1.0. Breaking changes ride minor bumps, for example `0.1.x` to `0.2.0`. Consumers should pin exact `0.x.y` versions and update deliberately. At `1.0.0`, breaking changes ride major versions.

## Current Contract Target

`0.12.0` is the current Phase 4/5 follow-up contract target for services that need persisted learning loops, policy promotion workflow helpers, retention rules, route security helpers, distributed rate-limit store contracts, agent governance checks, metrics contracts, metric ratio helpers, and release gate reports. Do not adopt `0.1.0`; it was a foundation sketch and lacked runtime ports, artifacts, actor-aware scope, localized result text, adapter feedback hooks, configurable quality policy, learning events, policy packs, policy promotion workflow helpers, agent/tool registry contracts, learning retention helpers, route security contracts, rate-limit store contracts, metrics contracts, metric ratio helpers, and release gate contracts.

## Change Rules

- Additive type changes may land in patch versions.
- Breaking type changes require a minor bump before `1.0.0`.
- Every breaking change updates `CHANGELOG.md`.
- Domain services should update one version at a time.
- Scope enforcement must remain deny-by-default unless a future minor version explicitly changes that contract.
