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
| Status | ✅ Done |
| Authorization / Blockers | Tier 2 · Remote Supabase `zamxjnsxmtsreknsqrwj` linked & pushed |
| Impacted docs | `data-model.md`, `security.md`, `flow.md`, `evidence.md`, `foundation.md` |
| Completion evidence | Remote REST checks (`node --env-file=.env`, `2026-11-17`): `anon` read `sessions`/`players` `200` (`1`/`0` rows); `anon` read `questions`/`player_answers` & `anon` writes `401` (`42501`); `service_role` read `1` session & `60` questions (`42` `software`, `12` `general`, `6` `fun`); `lint`, `tsc`, `build`, `check-docs.mjs` exit `0` |
| Traces | `BR-01`, `BR-05` · `US-01`, `US-07` |

### BOOM-03 — TDD Game Engine, Validation & Play APIs
| Field | Value |
|---|---|
| Priority | P1 |
| Status | ✅ Done |
| Authorization / Blockers | Tier 2 · `Q2` decided (`one-time per milestone` via `best_streak`); tie-breaker `survival_time DESC` |
| Impacted docs | `api.md`, `test-plan.md`, `flow.md`, `evidence.md`, `foundation.md`, `security.md` |
| Completion evidence | `npm test` (`17/17` across `validation.test.ts`, `game-rules.test.ts`, `game-service.test.ts`), `npm run lint`, `npx tsc --noEmit`, `npm run build`, `node scripts/check-docs.mjs --mode=project` (`2026-11-17`, exit `0`) |
| Traces | `BR-02`, `BR-03` · `US-02`, `US-03`, `US-04` · tests `T-001..T-004` |

### BOOM-04 — Player UI (`/`, `/lobby`, `/play`, `/result`, `/scoreboard`)
| Field | Value |
|---|---|
| Priority | P1 |
| Status | ✅ Done |
| Authorization / Blockers | Tier 2 · `playwright` (`1.65.1`) E2E + DOM craft check passed (`2026-11-17`) |
| Impacted docs | `dsd.md`, `api.md`, `flow.md`, `test-plan.md`, `build.md`, `foundation.md`, `evidence.md` |
| Completion evidence | Playwright Chromium headless E2E (`verify-boom-04.mjs` against `next start -p 3005` + `zamxjnsxmtsreknsqrwj`, `2026-11-17`): `/` invalid `"A"` alert, `"TestCadet"` join → `/lobby` → `/scoreboard` Realtime (`1280x800`, `tabular-nums`) → SQL `countdown` → `/play` (`correct_index` absent, answer submit, `page.reload()` state restore) → SQL `finished` Realtime → `/result` (`BOOM!`, `#1 / 1`) & one-play lock redirect; `0` monospace fonts, `0` backdrop-blur, all controls `>= 48px`, `0` horizontal overflow, `0` page errors; `npm test` (`19/19`), `lint`, `tsc`, `build`, `check-docs.mjs` exit `0` |
| Traces | `BR-01..04` · `US-01..05` · tests `T-003`, `T-005` |

### BOOM-05 — Facilitator Auth & Admin Panel (`/admin`, `/admin/dashboard`, `/admin/questions`)
| Field | Value |
|---|---|
| Priority | P1 |
| Status | ✅ Done |
| Authorization / Blockers | Tier 3 (Approved) · `ADR-0002` accepted (`2026-11-17`) |
| Impacted docs | `adr/ADR-0002-admin-passcode-auth.md`, `security.md`, `api.md`, `flow.md`, `test-plan.md`, `foundation.md`, `evidence.md`, `dsd.md` |
| Completion evidence | `npm test` (`24/24` incl. `admin-auth.test.ts` + `admin-service.test.ts`); Playwright E2E (`verify-boom-05.mjs` against `next start -p 3005` + `zamxjnsxmtsreknsqrwj`, `2026-11-17`): `401` on unauth `/api/admin/*`, redirect on unauth `/admin/*`, wrong-passcode alert, login → kick → lock → start → end early → reset → question CRUD → sign out, `0` mono/blur/`<48px`/overflow/pageErrors; `lint`, `tsc`, `build`, `check-docs.mjs` exit `0` |
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
| 2026-11-17 | `BOOM-02` migration (`20261117000001_init_schema.sql`), `seed.sql` (60 questions), & `supabase/config.toml` authored (`🟡`) | Phase 2 DB prep | `BOOM-02` |
| 2026-11-17 | `BOOM-02` pushed to remote `zamxjnsxmtsreknsqrwj` and verified (`60` seeded questions, `anon` RLS/write denials `42501`) → `✅ Done` | Phase 2 verification | `BOOM-02` |
| 2026-11-17 | `BOOM-03` TDD game engine, validation, `API-01..API-03`, & Vitest suite (`17/17` passing) → `✅ Done` | Phase 3 engine & APIs | `BOOM-03` |
| 2026-11-17 | `BOOM-04` player UI (`/`, `/lobby`, `/play`, `/result`, `/scoreboard`), `BombTimer`, `useSessionRealtime`, & `GET /api/session/me` built (`19/19` Vitest + `build` pass; live browser E2E `T-005` pending) → `🟡 Partial` | Phase 4 player UI | `BOOM-04` |
| 2026-11-17 | `BOOM-04` verified via Playwright headless E2E (`360x780` & `1280x800`, Realtime, reload reconnect, one-play lock, DOM anti-slop checks) → `✅ Done` | Phase 4 player E2E | `BOOM-04` |
| 2026-11-17 | `BOOM-05` facilitator auth (`ADR-0002`), `/admin` routes, `/api/admin/*`, Realtime handshake fix, & Playwright E2E (`24/24` Vitest + `T-006`) → `✅ Done` | Phase 4 admin panel | `BOOM-05` |
