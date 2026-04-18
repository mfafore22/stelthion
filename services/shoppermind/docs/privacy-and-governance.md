# ShopperMind — Privacy & Governance

This document is the governance contract for ShopperMind v2. It records what
data the service collects, how it is partitioned by market, what may and may
not cross market boundaries, and what the service commits to for retention,
anonymisation, and training-data reuse.

It is intentionally narrower than a legal privacy policy: it is the operating
spec engineers apply when designing new endpoints, new ingest sources, and new
LLM-facing flows. Legal and Trust & Safety review layer on top of this; this
document is what the code is held to.

---

## 1. Data classes

The service handles four classes of data. Each has its own storage scope,
retention rule, and rules for what is allowed to leave the market it belongs
to.

### 1.1 Public signals
Content crawled from public sources (news, RSS, social APIs). Stored in
`RawSignal` and rolled up into `Phenomenon` rows.
- **Market scope:** a raw signal is attributed to one or more markets via the
  subscription rules in `Market.footTrafficSubs` / `culturalSubs`. A signal is
  never "global" internally — it is always attached to at least one market's
  subscription set.
- **Retention:** raw signals are retained for 180 days; phenomenon rollups
  are retained for 24 months.
- **Training reuse:** allowed without further anonymisation. Public signals
  are already public.

### 1.2 Derived analytics
`PhenomenonScore`, `SignalOfTheDay`, `PhenomenonLink`, `CoordinatorRun`,
`ReviewItem`. These are computed from public signals + policy.
- **Market scope:** every row carries a `marketId`. Cross-market joins are
  allowed for internal analytics (e.g. resonance detection) but the *shape*
  that leaves the service is always either single-market or an explicit
  cross-market response documented in the OpenAPI schema.
- **Retention:** 24 months.
- **Training reuse:** allowed. Derived analytics are attributable to the
  service's own computation, not to any user.

### 1.3 Reviewer actions
`ReviewItem.resolvedBy`, `ReviewItem.resolutionNote`, and the corresponding
audit trail. The reviewer is a named operator inside the Stelthion
organisation.
- **Market scope:** scoped to the reviewer's assigned markets.
  `resolvedBy` is an operator ID, never a display name or email, stored as
  an opaque string.
- **Retention:** 24 months of full detail; after that, `resolvedBy` is
  replaced with a market-hashed bucket ID and the note is discarded unless
  flagged for legal hold.
- **Training reuse:** the *decision* (APPROVED / REJECTED / EXPIRED) and the
  *reasons* array are usable in training; the free-text `resolutionNote` is
  not — it may contain customer names, operational details, or other
  sensitive prose, so it is excluded from every training export by default.

### 1.4 Customer interactions
`PhenomenonFeedback` rows produced by `recordInteraction` — thumbs, clicks,
dwell events, chat follow-ups, chat citation clicks. These come from
identified end users inside the mall app.
- **Market scope:** every row is market-scoped (`marketId` set, or nullable
  for unscoped general feedback). A Helsinki user's thumbs-down never feeds
  into Tampere's gate: the feedback-aware policy modifier filters by
  `{ marketId } OR { marketId: null }` but never by a different market's
  ID.
- **User identity:** `userId` is an opaque string supplied by the mall app's
  auth layer. The service never stores emails, phone numbers, or full
  names. If the mall app sends one accidentally, the service logs it as a
  contract violation and rejects the write.
- **Retention:** 90 days of per-user detail. After 90 days, rows are
  rewritten so `userId` is replaced with a market-hashed salt bucket ID.
  Aggregate counts survive; the ability to say "this specific user did X"
  does not.
- **Training reuse:** counts and distributions flow into training exports;
  `verdict` strings and interaction kinds are usable; notes are not. The
  salt used for post-90-day bucketing is rotated yearly so the aggregate
  still cannot be re-identified over long windows.

### 1.5 Customer chat queries
`/v1/insights/chat` bodies contain free-text questions typed by end users.
These can contain anything a customer chose to type.
- **Logging:** chat requests are **not persisted in structured storage**
  beyond the response lifetime. Access logs retain method + path + market
  ID + duration + status code + truncated answer size, for 14 days, for
  operational debugging. Request bodies are not written to any store.
- **Observability:** traces include `marketId`, `topK`, `windowDays`, and
  an opaque `requestId`. They do not include the `question` or the
  `answer`.
- **Training reuse:** chat queries are **not** admissible into training
  data. If Phase 5 wants to close that loop, it must introduce an explicit
  opt-in flow with its own consent record; the default is no.

---

## 2. Market isolation

The service treats `marketId` as a strong partition, not a filter. The
following invariants are enforced in code and verified in tests:

1. **No implicit cross-market reads.** Every DB query that touches a
   market-scoped table specifies a market (either directly or via the
   authenticated caller's market). The one documented exception is the
   resonance endpoint, which is explicitly cross-market by design and
   returns only aggregate phenomenon metadata, never per-market counts
   attributable to end users.
2. **No cross-market feedback contamination.** The feedback-aware policy
   modifier in `policy/policy-engine.ts` reads only rows where
   `marketId = currentMarket OR marketId IS NULL`. Other markets' feedback
   is never considered.
3. **No cross-market RAG.** The chat service retrieves only corpus
   documents for the requested `marketId`. A Helsinki customer cannot get
   an answer grounded on Tampere's phenomena.
4. **Admin endpoints are market-scoped on the mall app side.** The service
   bearer token alone grants "talk to the service"; admin authorization is
   enforced upstream in the mall app and the mall app forwards only
   market-scoped requests. The service still double-checks that the
   `marketId` in the URL is consistent with the body.

---

## 3. Anonymisation pipeline

Two anonymisation stages run on a BullMQ repeatable schedule:

- **90-day user bucket rollover** (`anonymise-feedback.ts`, runs daily at
  02:00 UTC) — rewrites `PhenomenonFeedback.userId` for rows older than 90
  days to `sha256(userId || salt)[:12]`. The salt is stored in
  `anonymisation_salts.current` and rotated on 1 January each year; rows
  already bucketed are not re-bucketed when the salt rotates.
- **24-month reviewer bucket rollover** (`anonymise-review.ts`, runs
  weekly) — rewrites `ReviewItem.resolvedBy` for rows older than 24 months
  to `sha256(resolvedBy || reviewer_salt)[:12]` and clears
  `resolutionNote`. Legal-hold rows (flagged by a separate process) are
  exempt.

The salts live in a secrets store, not in the DB. The service does not have
code to reverse the hash — there is no "undo anonymisation" path.

---

## 4. LLM-facing flows

Three endpoints and one background job call an LLM with data from the
service:

- `labelPhenomenon()` — sends phenomenon label + up to 5 representative
  public signal excerpts. All input is public. OK for any provider.
- `decideMerge()` — sends two phenomenon summaries. Same as above.
- `/v1/insights/chat` — sends the customer's question plus retrieved
  corpus excerpts. The question is customer-authored free text; corpus
  excerpts are derived from public signals. The provider sees both. The
  provider's data-retention setting must be configured to zero-day
  retention (see §5). The question is not stored by ShopperMind.
- `link-inferrer.ts` — sends two phenomenon summaries (public). OK for any
  provider.

**No customer identity, feedback note, reviewer note, or interaction
history is ever included in an LLM prompt.** Phase 5 may want to build a
personalisation feature; that is a new governance decision and requires
updating this document before shipping.

---

## 5. Provider obligations

For any LLM or embedding provider ShopperMind integrates with, the
operational requirements are:

1. **Zero-day training retention on the API tier.** The provider must not
   train on ShopperMind's requests. For OpenAI this means the API
   organisation flag "do not train on my data" is set; for Anthropic this
   is the default API behaviour and is verified at onboarding.
2. **Data residency** matches the market's country requirement. EU
   markets use providers with EU endpoints; no EU customer chat query
   crosses to a US endpoint without an explicit DPA addendum.
3. **Key rotation** on a 90-day cadence. Keys are stored in the service's
   secrets store.
4. **Incident notification SLA** — the provider must commit to notifying
   ShopperMind within 72 hours of any data incident affecting this
   tenant.

A provider that does not meet all four is not eligible. Switching providers
requires updating this document and the `LLMClient` implementation; no
data-plane change is required.

---

## 6. Training-data export governance

`GET /v1/insights/export` (gated by `requireBearer('internal')`) emits
NDJSON suitable for fine-tuning the policy and narrative models. The
export:

- Includes: `reviewItemId`, `marketId`, `phenomenonId`, `gateDecision`,
  `reviewerAction`, `reasons`, `metricsSnapshot`, `narrativeDraft`, and
  phenomenon metadata.
- Excludes: `resolvedBy`, `resolutionNote`, any `PhenomenonFeedback.note`,
  any chat queries.
- Is scoped by `marketId` when the caller passes one. A cross-market
  export is possible but requires an explicit caller-side flag; the audit
  log records every cross-market call.
- Is rate-limited to 10 calls per day per token. Bulk re-exports should
  use an offline job, not the HTTP endpoint.

Every call lands in `coordinator_runs` (kind = `training_export`) with the
caller token fingerprint and the query filter. That log is retained for 24
months.

---

## 7. User rights

The service supports the following user-rights requests via an internal
CLI operated by the Trust & Safety team:

- **Access** — produce all `PhenomenonFeedback` rows for a given
  `userId`. Completes in < 24h for requests within the 90-day detail
  window; older aggregate data is not reversible.
- **Deletion** — delete all `PhenomenonFeedback` rows for a given
  `userId`. Aggregate training data already exported is out of scope of
  this command; subsequent exports will not include the deleted rows.
- **Rectification** — out of scope; the service does not store
  user-authored content beyond interaction tuples and free-text notes
  that are already excluded from training.

Requests from end users reach the service via the mall app's Trust &
Safety pipeline. ShopperMind does not accept user-rights requests
directly.

---

## 8. Review and change control

- This document is reviewed at the start of every phase (currently Phase
  4). Any new endpoint, new data class, or new LLM provider updates this
  document *before* merge; the relevant PR includes the diff.
- The service's CI runs a governance check: any new top-level route under
  `src/http/routes/v1/` or new Prisma model in `prisma/schema.prisma`
  fails the build unless this document's SHA is updated in the same PR.
  (The check is advisory in Phase 4, enforcing in Phase 5.)
- Legal hold overrides the retention rules in §1. Rows flagged for legal
  hold are exempt from the anonymisation jobs until the hold is cleared.

---

## 9. Appendix — exported types

The types that define the externalised surface area:
- `InsightsExportQuery`, `TrainingRecord` — the shape of training
  exports; changes require re-approval under §8.
- `InsightsChatRequest`, `InsightsChatResponse`, `InsightsChatCitation` —
  chat surface; changes require re-approval under §8.
- `FeedbackCreate`, `InteractionRecord`, `InteractionSummary`,
  `InteractionKind` — user-interaction surface; changes require
  re-approval under §8.

The types live in `@stelthion/shoppermind-client-types` and are the
contract the mall app consumes. A breaking change to any of them bumps the
client-types package major and requires updating this document before the
service may deploy.
