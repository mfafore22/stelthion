# Production architecture: decisions required

Date: 2026-05-09
Status: **Awaiting developer/architect input.** Once these answers are returned, the next deliverable is `docs/production-architecture-2026.md`: the authoritative target-state document referenced by the production readiness review (`docs/production-readiness-2026-05-09.md`).

This file is the input questionnaire. Each section asks a discrete decision, explains why the answer matters, and lists viable options with trade-offs. Skip nothing: defaults that aren't chosen explicitly become hidden assumptions that bite later.

The questions are grouped so you can answer in roughly one sitting (~60–90 min). Please reply inline (e.g. fill the `Answer:` line) or in a separate doc that references the section numbers.

---

## A. Deployment & topology

### A.1 Hosting platform
**Why it matters:** every later decision (Postgres pooling, Redis backend, observability stack, edge ingestion latency, secret management) depends on this. The current code has a `vercel.json` with one cron, a root `Dockerfile`, and a `services/shoppermind/docker-compose.yaml`, so all three options are viable starting points.

Options:
- **A.1.a: Vercel + managed services** (Postgres on Supabase/Neon, Redis on Upstash, ShopperMind on a Vercel-friendly host or Fly.io). Cheapest to start, smallest ops surface, but serverless model forces certain choices (per-request DB pooling via PgBouncer, no in-memory rate limit, cold-start budgets).
- **A.1.b: Single VM / single-region Docker Compose** (Hetzner, OVH, DO, your own metal). Predictable cost, full control, you carry the ops. Good fit if data residency in EU is a hard requirement.
- **A.1.c: Kubernetes (managed: GKE/EKS/AKS, or DIY)**. Each service (Next.js, ShopperMind HTTP, ShopperMind workers, VenueMind) as its own deployment with HPA. Heavy ops, only earns its keep at growth scale.

Answer:

Follow-up if A.1.a or A.1.c: which provider specifically? Region(s)?

Follow-up if A.1.b: which provider, and are you OK with the bus factor of a single VM?

### A.2 Region & data residency
**Why:** Finnish/EU customer data, Resend for email, possibly Supabase/Upstash. Need to know whether GDPR-lawful basis demands EU-only processing.

- A.2.a: EU-only (Frankfurt, Stockholm, Helsinki).
- A.2.b: EU-primary, US fallback for LLM inference acceptable.
- A.2.c: No constraint.

Answer:

### A.3 Service decomposition for v1
**Why:** the repo already has `services/shoppermind` and `services/venuemind` as separate Fastify processes plus the Next.js app. We need to know which run as separate deployable units in v1 vs collapse into one.

- A.3.a: Three deployables: Next.js (web), ShopperMind (HTTP + worker), VenueMind (HTTP). Worker queues via Redis/BullMQ.
- A.3.b: Two deployables: Next.js, plus one combined "intelligence" service (ShopperMind + VenueMind sharing a Fastify app).
- A.3.c: Single deployable with everything embedded in Next.js (no Fastify in v1).

Answer:

### A.4 Edge units (cameras + GPU compute): topology
**Why:** the current `EdgeDevice` model assumes devices register over public internet via bearer key. We need to know operational reality.

- A.4.a: Edge units talk only to the central API over public internet (current design).
- A.4.b: Edge units inside customer LAN, behind a site-to-site VPN/Tailscale tunnel.
- A.4.c: Hybrid: customer-owned LAN, but devices push through a customer-side gateway (one outbound TLS connection per site).

Answer:

Follow-up: expected device fleet size at end of year 1? End of year 2? Average reading frequency per device?

### A.5 Edge control plane: authority & lifecycle
**Why:** the readiness review found `/api/edge/register` is gated by `requireAdmin()` only, and `/api/admin/edge/devices` rides on the broken active-customer helper. The data plane is tenant-neutral, but the control plane needs explicit decisions.

- A.5.a: Who can register a new edge device? Platform admin only, or customer admin within their own scope?
  Answer:
- A.5.b: Who can rotate an edge device API key? What is the rotation cadence (manual on demand, scheduled every N days, both)?
  Answer:
- A.5.c: Who can revoke a device, and what is the SLA between revoke and the device being rejected by the API?
  Answer:
- A.5.d: Who can view device metadata (last heartbeat, GPU info, version)? Customer admin within scope only, or any platform admin?
  Answer:
- A.5.e: Audit: are register, rotate, revoke, status-change events written to the audit log? Required reviewers / cadence?
  Answer:

### A.6 Edge authentication & throughput
**Why:** the current handshake bcrypt-compares the API key on every request (~50 ms at cost-10), which becomes a cliff once the fleet grows. The readiness review §6 already flagged this; we need a decision.

- A.6.a: Move to HMAC-SHA256 with a per-device shared secret, keep bcrypt only for first registration?
- A.6.b: Keep bcrypt and add an in-memory positive-auth cache (TTL ~30 s)?
- A.6.c: Switch to mTLS with per-device certificates issued at registration?

Answer:

Follow-up:
- A.6.d: Cache TTL if A.6.b: 30 s, 60 s, longer? Cache eviction on revoke (requires Redis pub/sub or short TTL acceptance)?
  Answer:
- A.6.e: Per-device rate limits on ingestion routes (footfall, behavior, journeys, alerts, heartbeat, verification-snapshots): policy values?
  Answer:

### A.7 Edge local buffering & replay
**Why:** if the central API is unreachable, what does the device do? The current routes accept arrays of readings; nothing in the repo documents the device-side behavior.

- A.7.a: Maximum local buffer size (hours of readings, MB on disk)?
- A.7.b: Replay strategy when API recovers: oldest-first, newest-first, batched?
- A.7.c: Idempotency: the `FootfallReading` upsert uses a 6-tuple unique key, so replay is safe; do other ingestion routes need similar protection (behavior, journeys, alerts)?
- A.7.d: Acceptable readings loss at the buffer ceiling: drop oldest, fail closed, alert operator?

Answers:

---

## B. Tenancy & isolation

### B.1 Tenancy model for v1
Options (already framed in §0 of the readiness review):
- B.1.a: Pooled (single DB, row-level `customerId` scoping). Matches current schema.
- B.1.b: Pooled now, silo migration path designed in. Same DB v1, but with model decisions (UUID PKs, no integer sequences, schema-per-customer feature flag) that make a future silo cheap.
- B.1.c: Silo from day one (DB-per-customer or schema-per-customer).

Answer:

### B.2 Platform vs tenant authority
The readiness review identified `customerId === 'ideapark'` as a critical bug. The fix is `User.platformRole` (NONE / SUPPORT / SUPER_ADMIN). Decisions still open:

- B.2.a: Include `SUPPORT` (read-only cross-tenant) in v1, or only `NONE`/`SUPER_ADMIN`?
- B.2.b: Should platform admins always operate inside an explicit selected-customer context, or have a "global view" mode for support tooling?
- B.2.c: Promotion to platform role: only via migration script + DBA action, or via a UI for `SUPER_ADMIN` to elevate another user?

Answers:

### B.3 Platform admin security requirements
**Why:** platform admins have a much larger blast radius than tenant admins (cross-tenant access, key rotation, billing). The standard tenant-admin auth posture is not enough.

- B.3.a: Mandatory 2FA for any user with `platformRole != NONE`? Enforced server-side (cannot be disabled, even by the user, even via the `/api/two-factor/disable` flow)?
  Answer:
- B.3.b: Mandatory hardware-backed MFA (TOTP authenticator app or WebAuthn) for `SUPER_ADMIN`, not email OTP only?
  Answer:
- B.3.c: Just-in-time elevation: should `SUPER_ADMIN` actions require a second-factor re-prompt at the moment of use (e.g. when switching customer context, or when calling cross-tenant write endpoints)? Or is session-level 2FA enough?
  Answer:
- B.3.d: Approval workflow for granting platform role: single approver, two approvers (`SUPER_ADMIN` + a designated officer), or DBA-only with a paper trail?
  Answer:
- B.3.e: Break-glass process: what happens if all platform admins lose their 2FA devices simultaneously? Recovery codes printed at provisioning, sealed envelope with the founder, cloud KMS escape hatch?
  Answer:
- B.3.f: Audit review cadence for platform-admin actions: weekly automated digest, monthly human review, on-demand only?
  Answer:
- B.3.g: Time-bounded elevation: should platform-admin sessions auto-downgrade to read-only after N minutes of idle, requiring re-authentication for write actions? (Recommended for SOC2 alignment.)
  Answer:
- B.3.h: Network restriction: are platform-admin endpoints (`/api/admin/*` cross-tenant operations, customer-context switch, plan change, edge register) IP-allowlisted, or open to any authenticated source?
  Answer:
- B.3.i: Logging: every platform-admin action records `platformRole`, source IP, user agent, target customer, and target resource. Confirm and add as a hard requirement in F.5?
  Answer:

### B.4 Tenant RBAC composition
**Why:** the schema currently has `Role { ADMIN, MANAGER, USER }` on `User`, plus the new `platformRole` from §B.2, plus plan features stored as JSON in `Plan.features` (e.g. `spaceAllocation`, `venueMind`). How these compose into an authorization decision must be specified, otherwise each route reinvents it (and gets it wrong, as the readiness review showed for `customerId === 'ideapark'`).

- B.4.a: Authorization order: which signal is checked first? Suggested precedence: deny if `platformRole` requires it AND scope mismatches → deny if tenant `Role` insufficient → deny if plan feature off. Confirm or override.
  Answer:
- B.4.b: Tenant role semantics: define what each of `ADMIN` / `MANAGER` / `USER` actually means at the route level. Today the code only checks `ADMIN` in most places; `MANAGER` and `USER` are essentially the same. Are `MANAGER` and `USER` distinct in v1, or collapse to two roles (`ADMIN`, `MEMBER`)?
  Answer:
- B.4.c: Plan-feature gating: where is the check enforced (route-level helper, a single middleware that reads `Plan.features`, or per-feature module)? `src/lib/plan-gate-server.ts` exists; is it the single source of truth?
  Answer:
- B.4.d: Plan-feature shape: stay with arbitrary JSON (`Plan.features`), or migrate to a typed enum/table so feature names cannot drift between code and DB?
  Answer:
- B.4.e: Cross-cutting cases: a tenant `USER` whose plan does not include `spaceAllocation` vs a platform admin acting in that customer context. Does platform role override plan gating, or only authority gating? (Recommendation: platform role overrides authority but never grants feature access the customer didn't pay for.)
  Answer:
- B.4.f: UI vs API: are plan-feature locks enforced in the UI only (badges, hidden nav) or also at the API (403 with `feature_not_on_plan`)? Both are required for security; confirm.
  Answer:
- B.4.g: New roles in v1: do you need `BILLING_ADMIN` (manage plan/payment but not users/data), `READ_ONLY_AUDITOR` (compliance review), or stay with the three current roles?
  Answer:
- B.4.h: Authorization tests: every route must have a matrix test (role × plan × scope) before launch. Confirm as a definition-of-done item for the platform-admin branch?
  Answer:

### B.5 Tenant onboarding
- B.5.a: Self-service signup (with payment) or admin-provisioned only?
  Answer:
- B.5.b: How is the first customer admin user created? Welcome email with one-time setup link (recommended over current plaintext-password email)?
  Answer:
- B.5.c: How are malls provisioned per customer: admin UI, CSV import, or migration scripts?
  Answer:

### B.6 Billing & payments
**Why:** if B.5.a allows self-service signup, payment, invoicing, and tax handling become hard requirements. If admin-provisioned only, this can be lighter (manual invoice + bank transfer). The repo currently has no payment integration.

Conditional on B.5.a:

- B.6.a: Payment provider: Stripe / Adyen / Paddle (merchant of record, handles VAT) / manual invoicing? Paddle is attractive for SaaS in EU because they handle VAT MOSS, but their fee is higher.
  Answer:
- B.6.b: Card vs invoice: card-only at signup, invoice for enterprise (NET 30/60), or both?
  Answer:
- B.6.c: VAT handling: customer-supplied VAT number with reverse-charge for EU B2B? Provider-handled (Paddle/Stripe Tax)? Manual?
  Answer:
- B.6.d: Plan / subscription source of truth: `Plan` and `Customer.planId` in our DB, or the payment provider's customer/subscription record? If both, which wins on conflict, and how often do we reconcile?
  Answer:
- B.6.e: Webhook handling: signed webhook from the provider (Stripe-Signature, etc.), idempotency keys, retry policy, dead-letter for failed webhook processing?
  Answer:
- B.6.f: Plan changes mid-cycle: prorate upgrades, downgrade at renewal only, immediate downgrade with refund? (Drives the `customerId/[id]/plan` admin route's behavior.)
  Answer:
- B.6.g: Failed payment grace period: how many days before downgrade or feature lock? What is the customer-facing communication during grace?
  Answer:
- B.6.h: Billing admin role: see B.4.g; if added, who in the customer's org has it?
  Answer:
- B.6.i: Receipts and invoices storage: provider-hosted (Stripe Customer Portal) or our own UI? Retention requirement is typically 7 years for tax records.
  Answer:
- B.6.j: PCI scope: confirm we never touch card data (provider-hosted checkout / iframe), so PCI SAQ-A applies, not SAQ-D.
  Answer:

---

## C. Scale & capacity v1

### C.1 Customer & mall count targets
- C.1.a: Pilot: 1–3 customers, ≤10 malls, ≤50 users. 6–12 months.
- C.1.b: Growth: 10–50 customers, ≤100 malls, ≤1k users. 12–24 months.
- C.1.c: Enterprise: 100+ customers, multi-region, edge at scale.

Answer chosen tier and approximate numbers:

### C.2 Concurrent traffic budget
Need rough estimates per tier. If you don't know, say "no estimate": we'll size for the chosen tier's typical case.

- Concurrent dashboard users (peak): _____
- API req/s (peak, dashboard + edge ingestion combined): _____
- Concierge LLM calls/min (peak): _____
- Edge readings/min (sum across fleet): _____

### C.3 Data volumes
- Footfall readings retention (raw): _____ months / years
- Conversation history retention: _____
- Verification snapshots / training pairs retention: _____
- Aggregated KPI history retention: _____

These directly drive Postgres sizing and the daily-prune jobs the readiness review recommended.

### C.4 LLM cost ceiling
Monthly cap per tenant for the concierge & ShopperMind agents? Hard cap or soft (alert + degrade)?

Answer:

### C.5 LLM provider configuration model
**Why this comes first:** today, LLM provider is selected **per service**, not centrally:
- `packages/intelligence-runtime` has zero provider code; it defines `LLMClient` / `EmbeddingClient` interfaces only.
- ShopperMind reads `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `LOCAL_LLM_URL` in `services/shoppermind/src/config/env.ts` and has its own client at `services/shoppermind/src/engine/llm/client.ts` (with the explicit comment "the service must not import the mall app's concierge llm-client (service boundary)").
- The Next.js app calls Ollama directly from route files (`src/app/api/analysis/insights/[jobId]/route.ts`, `src/app/api/report/narrative/route.ts`) using `OLLAMA_URL` / `OLLAMA_MODEL` env vars.

So the first question is whether to keep this or centralize.

- C.5.a: Keep per-service configuration. Each service picks its own provider, env var, and model. Simpler service boundaries, no shared blast radius, but duplicated cost-tracking, retry, and retention logic.
- C.5.b: Introduce a shared provider router in `intelligence-runtime`. Each service still calls `LLMClient`, but the implementation is selected once at runtime startup and reads a unified config. Adds a real provider implementation to the runtime package (currently provider-agnostic).
- C.5.c: Hybrid: shared router for batch / non-streaming work (ShopperMind agents, report narrative), per-service for streaming concierge (which has its own latency characteristics and websocket lifecycle).

Answer:

The remaining sub-questions assume the model chosen above; if C.5.a, the answers may differ per service.

### C.6 LLM provider choice (per the model in C.5)
- C.6.a: Primary provider: OpenAI / Anthropic / Mistral / Gemini / Cohere / self-hosted (vLLM, Ollama)?
  - For concierge (Next.js app):
  - For ShopperMind:
  - For VenueMind:
- C.6.b: Fallback / secondary provider for outage tolerance, or accept feature degradation?
  Answer:
- C.6.c: Specific model SKUs at launch (concierge, campaign-idea generator, report narrative, ShopperMind classification, embeddings)?
  Answer:
- C.6.d: Is local Ollama allowed in production? If yes, on what host (same VM, sidecar, dedicated GPU box)? If no, replacement plan for the routes that currently default to it?
  Answer:

### C.7 LLM data residency & retention
**Why:** customer data crosses into the LLM call. GDPR and customer contracts may require EU-resident processing and zero-retention modes.

- C.7.a: EU processing required for some/all customers? (OpenAI EU residency, Anthropic Bedrock EU, Mistral Paris all viable.)
  Answer:
- C.7.b: Retention policy on the provider side: zero-retention / 30-day default / opt-out from training? Confirm per chosen provider.
  Answer:
- C.7.c: Are concierge prompts and answers logged in our own DB (`ConciergeMessage`)? For how long? Are they classified as Confidential per J.2?
  Answer:
- C.7.d: Training opt-out: confirm chosen provider does not use our prompts to train their models. Document the contractual basis.
  Answer:

### C.8 LLM PII redaction & content safety
**Why:** concierge questions can contain user PII, store names, sales figures. The current code does not redact before sending to the provider.

- C.8.a: PII redaction layer in v1 or v2? If v1, where (in `prepareChatSession`, in a wrapper around the provider client, or at the edge)?
  Answer:
- C.8.b: Allowed inputs: free-form user prompt, structured tool calls only, or both?
  Answer:
- C.8.c: Output safety: do we run provider-native moderation, post-process for prompt injection, or trust the provider's defaults?
  Answer:
- C.8.d: Audit: are LLM calls (prompt hash, model, token count, customer, user, latency) recorded for review even if the prompt body is redacted?
  Answer:

### C.9 LLM fallback & failure behavior
**Why:** the concierge is a streaming SSE response. When the LLM provider is down, slow, or rate-limits us, the user-facing behavior matters.

- C.9.a: Graceful degradation: queue, retry with backoff, surface a clear error, fall back to non-AI canned response?
  Answer:
- C.9.b: Per-tenant rate limits and per-user rate limits on LLM calls (separate from the global API rate limit)?
  Answer:
- C.9.c: Streaming under Vercel function timeouts (relevant if A.1.a chosen): max stream duration before forced disconnect, client-side reconnect strategy?
  Answer:

---

## D. Data layer

### D.1 Postgres
- D.1.a: Managed (Supabase / Neon / RDS / Cloud SQL): pick one.
- D.1.b: Self-managed on a VM.
- D.1.c: Specific Postgres version target (we currently use Prisma 7 + `@prisma/adapter-pg` v7).

Answers:

### D.2 Connection pooling
- PgBouncer? Built-in pool? Per-instance `connection_limit`?
- Expected number of concurrent serverless instances if A.1.a Vercel?

Answer:

### D.3 Backups & PITR
- D.3.a: RPO target (acceptable data loss): 5 min / 1 h / 24 h / other?
- D.3.b: RTO target (time to restore): 15 min / 1 h / 4 h / other?
- D.3.c: Backup test cadence: monthly restore drill, quarterly, ad-hoc?

Answers:

### D.4 Field-level encryption key rotation
The codebase has `src/lib/crypto/field-encrypt.ts` (AES-256-GCM). Key is currently single, no version tag.

- D.4.a: Add `v1:` prefix and a versioned key map now? Yes/no.
- D.4.b: KMS choice if A.1 has one (AWS KMS / GCP KMS / Doppler / 1Password / env-only)?

Answers:

### D.5 Redis
- D.5.a: Managed (Upstash / Redis Cloud / ElastiCache / MemoryStore): pick one.
- D.5.b: Self-managed.
- D.5.c: Used for: ShopperMind rate limit (already), Next.js rate limit (planned), BullMQ job queue (already), session cache (decision needed).

Answers:

### D.6 Blob & object storage
**Why:** the repo currently serves floorplans from `public/assets/malls/.../*.png` (1 MB each, baked into the build), and stores verification-snapshot binary references in Postgres. There is no decision recorded for where uploaded video, generated PDF reports, exports, or new floorplans should live.

Inventory of expected blob types:
1. Mall floorplans (PNG/SVG, ~1 MB, low write rate, high read rate, public per tenant).
2. Verification snapshots (image frames, ~100 KB each, high write rate, retention per D.3).
3. Generated reports (PDF/XLSX from `jspdf`/`xlsx`, ~1 MB each, generated on demand).
4. Uploaded video / footage references (the actual video stays on the edge unit; the platform stores only metadata pointers).
5. Customer logo/branding assets.
6. Counter upload CSVs (the `CounterUpload` model references file content).
7. Generated training pairs / LLM artifacts.

Decisions:
- D.6.a: Provider: S3 / Cloudflare R2 / Supabase Storage / GCS / Azure Blob / self-hosted MinIO?
  Answer:
- D.6.b: Region: same as Postgres, EU-only?
  Answer:
- D.6.c: Per-tenant isolation: bucket-per-tenant, prefix-per-tenant, or shared with row-level pointers? (Recommendation: prefix-per-tenant with signed URLs, bucket-per-tenant only at enterprise tier.)
  Answer:
- D.6.d: Signed URL policy: TTL for read URLs, max upload size, allowed MIME types per blob class?
  Answer:
- D.6.e: Public assets vs private: which blob types are publicly readable (e.g. mall logos for branding) vs always require a signed URL (verification snapshots, reports)?
  Answer:
- D.6.f: Retention per blob class (ties to D.3 PITR for metadata in Postgres, plus its own object lifecycle rules):
  - Floorplans: indefinite / version history?
  - Verification snapshots: same as Postgres rows, or shorter?
  - Generated reports: 90 days, 1 year, indefinite?
  - Counter uploads: indefinite (audit trail)?
  Answers:
- D.6.g: Malware scanning on customer uploads (counter CSVs, future arbitrary uploads): provider-native (S3 + Lambda + ClamAV), third-party (e.g. Cloudmersive), or none for v1?
  Answer:
- D.6.h: Backup policy: cross-region replication, versioning, point-in-time restore for the bucket?
  Answer:
- D.6.i: Encryption at rest: provider default (SSE-S3 / AES-256), customer-managed key (KMS), or per-object client-side encryption for sensitive classes (verification snapshots)?
  Answer:
- D.6.j: Migration plan: which existing `public/assets/...` floorplans move to object storage in v1 and which stay baked into the build?
  Answer:

---

## E. Reliability & SLOs

### E.1 Uptime target
- E.1.a: 99.0% (43 min downtime/month): pilot grade.
- E.1.b: 99.5% (3.6 h/month).
- E.1.c: 99.9% (43 min/month): needs HA Postgres + multi-instance app.
- E.1.d: 99.95%+: multi-region.

Answer:

### E.2 Latency targets (p95)
- Dashboard page load (TTI): _____ ms
- Read API (e.g. `/api/mall/[mallId]`): _____ ms
- Concierge first-token: _____ ms
- Edge ingestion ack: _____ ms

### E.3 Error budget policy
If we miss the SLO, what happens?
- E.3.a: Stop feature work until budget is restored.
- E.3.b: No formal policy; alert + manual review.

Answer:

### E.4 On-call
- E.4.a: Who is on call? Single owner? Rotation?
- E.4.b: Pager destination (PagerDuty / OpsGenie / phone / Slack)?
- E.4.c: Acceptable response time at 03:00?

Answers:

---

## F. Observability

### F.1 Logging
- F.1.a: Structured logger (pino) across all services, including Next.js?
- F.1.b: Log destination: stdout-only (platform captures), Datadog, Loki, BetterStack, Axiom, other?
- F.1.c: Log retention?

Answers:

### F.2 Metrics
- F.2.a: Prometheus, Datadog, native (Vercel/Supabase dashboards), other?
- F.2.b: Required dashboards on day one (suggestion: API latency p50/p95/p99 by route, error rate, DB connections, Redis latency, queue depth, LLM tokens/min, edge devices online).

Answers:

### F.3 Tracing
- F.3.a: OpenTelemetry tracing now, or defer to growth tier?
- F.3.b: Trace destination if yes?

Answer:

### F.4 Error tracking
- F.4.a: Sentry / Rollbar / native / none?
- F.4.b: Frontend error tracking same provider, or separate?

Answers:

### F.5 Audit log
The repo has `src/lib/audit/` gated by `AUDIT_FILE_LOGGING=true`. Decisions:
- F.5.a: File-based or DB-backed for v1?
- F.5.b: Required events for prod: login (success/fail), 2FA enable/disable, password change, platform role change, customer-context switch, plan change, user create/delete, edge device register/revoke. Approve list?

Answers:

---

## G. Security posture

### G.1 Auth & session
- G.1.a: Stay on NextAuth `5.0.0-beta` or pin to a stable release before launch?
- G.1.b: JWT session lifetime: 8 h (current), shorter, longer? Refresh strategy?
- G.1.c: `tokenVersion` on `User` to support force-logout-everywhere on password change/role change? Yes/no.
- G.1.d: Session cookie: `SameSite=Lax` (current default) or `Strict`?

Answers:

### G.2 2FA / OTP
- G.2.a: Email OTP only (current), or add TOTP authenticator app option?
- G.2.b: Lockout policy: how many bad OTP attempts before lock, and for how long? (Current is 2 / 10 min: review flagged as too aggressive.)
- G.2.c: Require current password + OTP to disable 2FA? (Recommended yes.)
- G.2.d: Welcome email: replace plaintext-password with one-time signed setup link? Yes/no.

Answers:

### G.3 CSRF
- G.3.a: Implement on all cookie-authed POST/PATCH/DELETE? (Recommended yes.)
- G.3.b: Mechanism: NextAuth CSRF token, double-submit cookie, or `SameSite=Strict` + Origin check only?

Answers:

### G.4 Content Security Policy
- G.4.a: CSP report-only first or enforcing from day one?
- G.4.b: Allowed hosts list (Mapbox tile servers, Resend tracking, LLM provider, Supabase storage, etc.): to be enumerated as part of the work.

Answers:

### G.5 Secrets management
- G.5.a: Where do production secrets live? Vercel env / GitHub Actions secrets / 1Password / Doppler / cloud KMS?
- G.5.b: Rotation cadence (`AUTH_SECRET`, DB credentials, third-party API keys)?
- G.5.c: Add CI guards (the new `scripts/ci/check-forbidden-literals.sh` covers leaked literals; do you also want `gitleaks` or `trufflehog` for secret pattern detection)?

Answers:

### G.6 Threat model scope
- G.6.a: Run a STRIDE pass on the target architecture as part of v1, or defer?
- G.6.b: Pen test before first paying customer goes live? Internal or external firm?

Answers:

### G.7 Email deliverability & sender domain
**Why:** OTP delivery is the second factor. If email lands in spam, login is broken. Welcome emails currently contain plaintext credentials (flagged in the readiness review). The repo defaults to `noreply@stelthion.com` and `accounts@stelthion.com` via `OTP_FROM_EMAIL` and `WELCOME_FROM_EMAIL` (`src/lib/email/sendOTP.ts`), with Resend as the provider.

DNS & sender authentication:
- G.7.a: Sender domain at launch: `stelthion.com` (root), `mail.stelthion.com` (subdomain), or per-environment subdomains (`mail.staging.stelthion.com`, `mail.prod.stelthion.com`) to keep deliverability scores separate?
  Answer:
- G.7.b: SPF: include Resend's SPF record; document the maximum 10 DNS lookup limit; confirm no other senders compete on the same domain.
  Answer:
- G.7.c: DKIM: Resend-managed selector or self-hosted keys? Rotation cadence?
  Answer:
- G.7.d: DMARC: start at `p=none` for monitoring, then move to `p=quarantine`, then `p=reject`? Define rollout schedule and monitor address.
  Answer:
- G.7.e: BIMI: enable for brand display in supported clients in v1, or defer?
  Answer:

Per-environment isolation:
- G.7.f: Different sender domain or `From` for staging vs production, so test OTPs cannot reach real users?
  Answer:
- G.7.g: Production `From` addresses confirmed: `noreply@…` for OTP, `accounts@…` for welcome, others?
  Answer:

Bounce, complaint, and suppression handling:
- G.7.h: Resend webhook for bounces / complaints wired into our app? Suppression list lives where (Resend native, our DB, or both)?
  Answer:
- G.7.i: User account effect on hard bounce: lock 2FA, force email change, log only?
  Answer:
- G.7.j: Spam-complaint response: suppress immediately, alert support?
  Answer:

OTP-specific monitoring:
- G.7.k: Deliverability KPIs: target send-to-deliver latency p95 (e.g. < 30 s), bounce rate ceiling, complaint rate ceiling. Alerting thresholds?
  Answer:
- G.7.l: Alternate channel if email is unreliable for a tenant: SMS OTP via Twilio, TOTP authenticator app (ties to G.2.a)? Decision now or after first deliverability incident?
  Answer:

Email content & sensitivity:
- G.7.m: Audit each email type for sensitive content. Current state: welcome email contains plaintext password (flagged in readiness review §2). Replace with one-time signed setup link in v1 (ties to G.2.d)? Confirm.
  Answer:
- G.7.n: OTP email contains the 6-digit code in subject line ("Your Stelthion verification code: 123456"). Inbox previews leak the code on a shoulder-surfing screen. Move code to body only?
  Answer:
- G.7.o: Future transactional emails (alerts, reports, billing): all classified per J.2 before being sent? Encryption-at-rest in Resend / our suppression list considered?
  Answer:

Vendor lock & continuity:
- G.7.p: Single provider (Resend) acceptable, or maintain a second sender (SES, Postmark) ready for failover? Cost vs continuity trade-off.
  Answer:

### G.8 Demo & local-bypass policy
**Why:** the repo currently has `SKIP_OTP_IN_DEV=true` documented in `.env.local` (with no code that reads it yet), `DEMO_MODE=true` in `.env`, and `/api/demo/shoppermind` and `/api/demo/space-optimizer` exposing data without auth. A formal policy is needed so future bypasses do not silently reach production.

- G.8.a: Single named env flag for *all* local bypasses (proposal: `ALLOW_LOCAL_DEMO_BYPASSES`)? Or one flag per feature (`SKIP_OTP_IN_DEV`, `DEMO_DATA_OPEN`, etc.)?
  Answer:
- G.8.b: Hard runtime guards: every bypass must `throw` if `NODE_ENV === 'production'` regardless of flag value, and additionally require localhost origin / private IP. Confirm wording becomes a coding standard?
  Answer:
- G.8.c: Boot-time validation: a single function called from app startup that scans `process.env`, fails fast if any bypass flag is set in production. Implement in v1?
  Answer:
- G.8.d: CI guard: extend `scripts/ci/check-forbidden-literals.sh` (or a sibling script) to fail the build if `SKIP_OTP_IN_DEV=true`, `DEMO_MODE=true`, or any other bypass flag appears in tracked files committed to `main`?
  Answer:
- G.8.e: Demo data boundaries: are `/api/demo/*` routes in the production build at all, or stripped at compile time? If they ship, do they read from a separate demo database or from the real DB filtered to a "demo" customer?
  Answer:
- G.8.f: Bypass never affects authority: confirm rule that no bypass flag ever escalates platform role, mall scope, or customer scope (only affects e.g. OTP delivery or seed data). Audit the codebase against this rule before launch?
  Answer:
- G.8.g: Documentation: where does the canonical list of bypass flags live (single source of truth) so a new dev cannot add one without updating the list?
  Answer:

---

## H. Release engineering

### H.1 Environments
- H.1.a: How many: dev / staging / prod, or just dev / prod?
- H.1.b: Staging hits real Postgres copy or fixture data?
- H.1.c: Per-PR preview environments (Vercel does this natively)?

Answers:

### H.2 Branch & merge model
- H.2.a: Trunk-based with feature branches (current), or release branches?
- H.2.b: Required checks before merge to `main` (currently: `npm test`, `release:gate` for ShopperMind/VenueMind, `secret-scan` once merged)? Add typecheck, lint, e2e?
- H.2.c: Code review: 1 approval, 2, or self-merge allowed for solo dev?

Answers:

### H.3 Database migrations under load
- H.3.a: Migration strategy: `prisma migrate deploy` on every deploy, manual sign-off, or feature-flag-gated schema changes?
- H.3.b: Long-running migrations (>5 s on prod data): how do you handle them?
- H.3.c: Rollback story for a bad migration?

Answers:

### H.4 Deploy strategy
- H.4.a: Blue/green, canary, or full cutover?
- H.4.b: Feature flags: introduce now (LaunchDarkly / GrowthBook / GitHub-native / homegrown), or defer?

Answers:

### H.5 Rollback policy (full coverage)
**Why:** H.3 covered DB migration rollback only. A real rollback policy needs separate decisions for each layer that can fail independently.

App-tier rollback:
- H.5.a: Roll back the Next.js app: redeploy previous build (Vercel native), revert + redeploy from `main`, or hot-swap to a known-good tag? Time budget?
  Answer:
- H.5.b: Roll back ShopperMind / VenueMind services: independent of the Next.js app, or always together? Compatibility matrix recorded?
  Answer:

Schema rollback:
- H.5.c: Already covered in H.3; cross-reference here.
- H.5.d: Decoupling rule: do all schema changes ship in a separate release ahead of code that uses them, so an app rollback never lands on an incompatible schema? (Recommended.)
  Answer:

Feature-flag rollback:
- H.5.e: Kill switch in the flag system to disable a feature in production without a deploy. Required for: concierge LLM, ShopperMind agents, VenueMind, edge ingestion, public mall APIs, demo routes. Confirm list?
  Answer:
- H.5.f: Flag rollback latency target: 60 s, 5 min, longer? (Drives whether the flag system can be polled or must push.)
  Answer:

Worker rollback:
- H.5.g: Roll back ShopperMind workers: drain the queue, redeploy, replay? Or stop accepting new jobs and let in-flight finish?
  Answer:
- H.5.h: Queue compatibility: when worker code changes a job payload shape, are old in-flight jobs auto-converted, drained before deploy, or fenced?
  Answer:

Queue drain & emergency disable:
- H.5.i: Queue drain policy on rollback: maximum drain time before forced abandon, dead-letter queue retention?
  Answer:
- H.5.j: Emergency disable switches (one toggle each), required at launch:
  - Concierge LLM (degrade to non-AI canned responses)
  - ShopperMind agent execution (queue jobs but stop processing)
  - VenueMind agent execution
  - Edge ingestion (return 503, edge units must buffer locally per A.7)
  - Public demo routes
  - New customer onboarding
  Confirm list and the operator UI / CLI / DB toggle that drives each:
  Answer:

Communication:
- H.5.k: Status page (separate domain or in-app banner) updated on rollback events? Customer notification cadence?
  Answer:

### H.6 API contracts & versioning
**Why:** the repo has three distinct API surfaces with different consumers and different change-cost profiles, but no versioning policy is documented for any of them.

1. Public-facing dashboard API at `/api/*` (Next.js routes, called by our own UI).
2. Edge ingestion / control plane at `/api/edge/*` (called by long-lived edge devices in the field, where deploying a new client is operationally expensive).
3. Internal service-to-service: ShopperMind v1 routes (`services/shoppermind/src/http/routes/v1/`) and the upcoming VenueMind equivalent, plus internal-token endpoints like `/api/internal/footfall-export`.

Each surface needs an explicit policy.

Dashboard API (UI consumer):
- H.6.a: Versioning needed at all? If the UI ships in lockstep, a breaking change is just a coordinated deploy. Confirm "no versioning, ship with the UI", or justify otherwise.
  Answer:

Edge ingestion API (long-lived client, slow upgrade cadence):
- H.6.b: URL versioning (`/api/v1/edge/footfall`), header versioning (`X-Edge-API-Version: 1`), or no versioning with strict additive-only changes? URL versioning is the safest given edge client upgrade lag.
  Answer:
- H.6.c: Compatibility window: how long must version N keep working after N+1 ships? (Suggestion: minimum 6 months, aligned with the longest edge update interval.)
  Answer:
- H.6.d: Deprecation signaling: response header (`Sunset:` per RFC 8594), structured warning in body, both?
  Answer:
- H.6.e: Schema discipline: are payloads typed by zod schemas committed to a shared package, with semver changelog? Today the edge routes hand-roll validation. Promote to `packages/edge-api-types`?
  Answer:
- H.6.f: Field-level back-compat rule: never remove or rename a field within a major version; new fields are optional and ignored by old clients. Confirm and add to coding standards.
  Answer:

Internal service-to-service (ShopperMind, VenueMind, internal tokens):
- H.6.g: ShopperMind already uses `/v1/` URL prefix. Confirm `/v1` is permanent until a deliberate `/v2`, and document the criteria for cutting `/v2` (additive-only fails).
  Answer:
- H.6.h: Type sharing: `packages/shoppermind-client-types` exists. Does VenueMind get its own `packages/venuemind-client-types`, or should the two share a single `intelligence-client-types` package?
  Answer:
- H.6.i: Deploy ordering: when a service-to-service contract changes, what is the required deploy order (server first with backwards-compatible additive change, then client, then breaking removal in a later release)? Document and tie into H.5.d.
  Answer:
- H.6.j: Internal token rotation (currently `SHOPPERMIND_INTERNAL_TOKEN`, `INTERNAL_SERVICE_TOKEN`): rotation cadence, dual-acceptance window during rotation?
  Answer:

OpenAPI / contract testing:
- H.6.k: Generate OpenAPI specs for each versioned surface (Fastify-Swagger is already wired in ShopperMind)? Publish them in CI as build artifacts so consumers can pin to a known schema?
  Answer:
- H.6.l: Contract tests in CI: schema diff between branches must be explicit (additive vs breaking) and breaking changes require a major-version bump label on the PR?
  Answer:
- H.6.m: External documentation: do edge integrators or third-party customers ever consume our API? If yes, where does the public docs site live, and who owns the changelog?
  Answer:

---

## I. Disaster recovery

### I.1 Single-region failure
- I.1.a: RTO target if region goes down completely?
- I.1.b: Multi-region active-active, active-passive, or single-region (accept downtime)?

Answers:

### I.2 Data loss scenarios
- I.2.a: DB corruption: restore from PITR (D.3): RPO acceptable?
- I.2.b: Accidental table drop / mass delete: protected by …?
- I.2.c: Compromised admin account: account recovery process?

Answers:

### I.3 Edge fleet degradation
- I.3.a: Central API down: do edge units buffer locally and replay? For how long?
- I.3.b: Single edge device fails: auto-detect and alert via existing heartbeat, or manual check?

Answers:

---

## J. Compliance & legal

### J.1 GDPR
- J.1.a: Data Processing Agreement template ready?
- J.1.b: User-facing erasure (right to be forgotten): implemented in v1 or post-launch?
- J.1.c: Sub-processor list (Resend, Supabase, Vercel, LLM provider, Mapbox …): who maintains and publishes it?

Answers:

### J.2 Data classification
For each data class, classify as Public / Internal / Confidential / Restricted, and capture handling rules (encryption at rest, access scope, retention, transmission constraints).

Tenant & user data:
- J.2.a: User PII (email, name, role, customerId, last login)
- J.2.b: Customer billing & contact data (company name, billing address, plan, payment IDs)
- J.2.c: User passwords (hashed) and 2FA secrets

Operational analytics:
- J.2.d: Footfall readings (raw, per-zone, per-hour)
- J.2.e: Aggregated KPI history
- J.2.f: Mall tenant-impact data, sales / revenue figures
- J.2.g: Counter uploads (raw CSV)
- J.2.h: Floorplans (current + snapshots)

Edge & video:
- J.2.i: Edge device API keys (hashed in DB, plaintext on the device)
- J.2.j: Camera metadata (location, label, stream URL if recorded)
- J.2.k: Verification snapshots (image frames)
- J.2.l: Raw video references (the platform never holds the video; only references and derived journey data)
- J.2.m: Journey paths and anonymous tag IDs

AI / LLM artifacts:
- J.2.n: LLM prompts (concierge, ShopperMind agents, report narrative)
- J.2.o: LLM answers (`ConciergeMessage`, generated narratives)
- J.2.p: LLM training pairs (`LlmTrainingPair`)
- J.2.q: Embeddings and cached agent context

Audit & system:
- J.2.r: Audit logs (auth events, platform-admin actions, edge lifecycle)
- J.2.s: Application logs (request logs, error traces)
- J.2.t: Generated exports / reports (PDF, XLSX)

Recommended baseline (subject to your override):
- Restricted: J.2.c, J.2.i, J.2.r (auth secrets and immutable audit trail)
- Confidential: J.2.a, J.2.b, J.2.f, J.2.g, J.2.k, J.2.l, J.2.n, J.2.o, J.2.p
- Internal: J.2.d, J.2.e, J.2.h, J.2.j, J.2.m, J.2.q, J.2.s, J.2.t
- Public: none by default; only customer-published assets (e.g. mall logos) become public via signed publication.

For each class, record:
- Classification (Public / Internal / Confidential / Restricted)
- Encryption: provider default (SSE), KMS-managed, or per-row field encryption (`src/lib/crypto/field-encrypt.ts`)
- Access scope: tenant-only, platform-admin readable, restricted to named system roles
- Retention (cross-reference C.3 and D.6.f)
- Transmission: TLS only, additional VPN, or signed-URL-only

Answers:

### J.3 Customer audit & SOC2
- J.3.a: Anyone going to ask for SOC2/ISO27001 readiness in v1? If so, timeline?

Answer:

---

## K. Cost ceiling

### K.1 Monthly run-rate target for v1
- K.1.a: Hard cap (€/month) at the chosen scale tier (C.1)?
- K.1.b: Largest single line item you're willing to accept (LLM, Postgres, Mapbox tiles, edge bandwidth)?

Answers:

### K.2 Per-customer unit economics
- K.2.a: Target gross margin per customer at the chosen plan price?
- K.2.b: LLM token budget per customer per month (hard or soft)?

Answers:

---

## L. Roadmap & milestones

### L.1 Definition of "production-ready"
What single criterion would let you say "we are production-ready and can sign customer #2"? Pick one:
- L.1.a: All §7 launch blockers from the readiness review shipped + tenant isolation tests green.
- L.1.b: Above + SLO/observability/runbook stack live.
- L.1.c: Above + external pen test passed.
- L.1.d: Other: __________

Answer:

### L.2 Milestone ownership
- L.2.a: Single tech owner for the platform-admin branch?
- L.2.b: Who owns observability rollout?
- L.2.c: Who signs off on the threat model?

Answers:

### L.3 Timeline
For each major branch in §7 of the readiness review, target ship date:
- `security/platform-admin-tenant-isolation`: _____
- Public-mall-API scope fixes (same branch or separate): _____
- OTP/2FA hardening: _____
- CSRF + CSP: _____
- Rate-limiting consolidation: _____
- Bundle/perf: _____
- Logging consolidation: _____

---

## M. Open architectural questions (no ready answer)

These are bigger and may need a design doc each. Flag which you want addressed in the architecture doc vs deferred:

- M.1: Concierge multi-agent runtime: stays on the websocket model in `src/services/concierge/`, or migrate to a queue-backed model that survives Vercel function timeouts?
- M.2: ShopperMind worker scaling: BullMQ on Redis works for one process, but workers won't autoscale on Vercel. Move to Fly Machines / a long-running container?
- M.3: Real-time concierge SSE on Vercel has hard request-duration limits. Stay on Vercel for the web app and host the streaming endpoints elsewhere, or move the whole web app off Vercel?
- M.4: Three.js mall viewer: keep client-side rendering, or pre-render scenes server-side and ship as glTF + lighter viewer?
- M.5: Mapbox dependency: keep, replace with MapLibre + self-hosted tiles, or remove if catchment isn't a v1 feature?

Tick which to address now:

---

## How to return this

Reply with your answers inline (or in a separate doc citing section IDs). Once received, the next deliverable is `docs/production-architecture-2026.md`, structured as:

1. Executive summary
2. Target topology (diagrams)
3. Tenancy model
4. Capacity & cost model
5. Data architecture (Postgres, Redis, encryption, retention)
6. Reliability & SLOs
7. Observability
8. Security posture & threat model
9. Release engineering
10. Disaster recovery
11. Compliance
12. Migration plan from current state
13. Milestones & ownership

Each section will be answered with concrete decisions traceable back to the section IDs in this document.
