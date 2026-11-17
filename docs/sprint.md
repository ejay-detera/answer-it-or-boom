# Sprint Backlog: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [BRD](brd.md) · [PRD](prd.md) · [Flow](flow.md) · [Test plan](test-plan.md) · [Glossary](glossary.md)

---

**Status legend:** `⬜ To Do` · `🔄 In Progress` · `🟡 Partial` · `⛔ Blocked` · `✅ Done` ([`grounding.md`](grounding.md) §3).

---

## §1. How to Use This Document

- **Definition of Ready:** Blocking `foundation.md` §14 / security / contract decisions resolved; positive + negative acceptance criteria defined; test seam named; authorization tier (`Tier 1/2/3`) set.
- **Completion Evidence:** A story is `✅ Done` only when all criteria pass, `flow.md` + affected docs update, and exact command/env/rev/date/exit status are recorded.

---

## §2. Sprint Stories

### BOOM-01 — Phase 1 Next.js Scaffold, Tokens, Fonts & Docs
| Field | Value |
|---|---|
| Priority | P1 |
| Status | ✅ Done |
| Authorization | Tier 2 (Approved "basics first") |
| Impacted docs | `docs/*`, `AGENTS.md` |
| Completion evidence | Verified via `npm run lint`, `npx tsc --noEmit`, `npm run build`, `node scripts/check-docs.mjs --mode=project` (`2026-11-17`) |
| Traces | `BR-06` · `US-08` |

### BOOM-02 — Supabase Schema, RLS, Indexes & 60+ Question Seed
| Field | Value |
|---|---|
| Priority | P1 |
| Status | ⬜ To Do |
| Authorization / Blockers | Tier 2 · Blocker: Supabase project credentials (`Q4`) for live apply (migration SQL can be authored offline) |
| Impacted docs | `data-model.md`, `security.md`, `flow.md` |
| Traces | `BR-01`, `BR-05` · `US-01`, `US-07` |

### BOOM-03 — TDD Game Engine, Validation & Play APIs
| Field | Value |
|---|---|
| Priority | P1 |
| Status | ⬜ To Do |
| Authorization / Blockers | Tier 2 · Blocker: Confirm streak milestone repeatability (`Q2`) |
| Impacted docs | `api.md`, `test-plan.md`, `flow.md` |
| Traces | `BR-02`, `BR-03` · `US-02`, `US-03`, `US-04` · tests `T-001..T-004` |

### BOOM-04 — Player UI (`/`, `/lobby`, `/play`, `/result`, `/scoreboard`)
| Field | Value |
|---|---|
| Priority | P1 |
| Status | ⬜ To Do |
| Impacted docs | `dsd.md`, `flow.md`, `test-plan.md` |
| Traces | `BR-01..04` · `US-01..05` · tests `T-005` |

### BOOM-05 — Facilitator Auth & Admin Panel (`/admin`, `/admin/dashboard`, `/admin/questions`)
| Field | Value |
|---|---|
| Priority | P1 |
| Status | ⬜ To Do |
| Authorization / Blockers | Tier 3 (Auth boundary) · Blocker: Confirm `ADR-0002` (`Q1`) |
| Impacted docs | `security.md`, `api.md`, `flow.md` |
| Traces | `BR-05` · `US-06`, `US-07` · tests `T-006` |

### BOOM-06 — Sound Toggle, Motion Polish, QA & Vercel Deploy
| Field | Value |
|---|---|
| Priority | P2 |
| Status | ⬜ To Do |
| Impacted docs | `ops.md`, `flow.md`, `test-plan.md` |
| Traces | `BR-06` · `US-08` |

---

## §3. Change Log

| Date | Change | Reason | Stories affected |
|---|---|---|---|
| 2026-11-17 | Initial sprint backlog created (`BOOM-01` done for Phase 1 scaffold) | Project bootstrap | All |
