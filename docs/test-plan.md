# Test Plan: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [PRD](prd.md) · [BRD](brd.md) · [Sprint](sprint.md) · [Build](build.md) · [Security](security.md) · [Grounding](grounding.md)

---

> **Evidence rule.** A test is "passing" only with a command, environment, revision/working-tree state, last-run date, and actual exit output.
>
> **No invented coverage numbers.** Targets stay `TBD`. Never weaken a test or write test theater to make it pass.

---

## 1. Test Levels

| Level | Purpose | Tool | Command | In CI |
|---|---|---|---|:---:|
| Static (lint, types, build) | Catch syntax, TS, and Next.js bundle issues | ESLint, TypeScript, Next.js | `npm run lint`, `npx tsc --noEmit`, `npm run build` | Planned |
| Unit & contract | Game rules (`game-rules.ts`), validation, service seams | Vitest (`3.2.4` ✅) | `npm test` (`vitest run`) | Planned |
| Security & auth negative | `correct_index` stripped, expired `deadline`, duplicate submit (`API-01..API-03` ✅; admin `401` `⬜`) | Vitest (`npm test`) | `npm test` | Planned |
| End-to-end & DOM craft | Live sync, anti-slop CSS/DOM checks (`dsd.md` §1.1) | Playwright / manual (`⬜`) | `N/A — Phase 4` | Planned |
| Doc integrity | Links, balanced fences, zero unfilled placeholders | `scripts/check-docs.mjs` | `node scripts/check-docs.mjs --mode=project` | Planned |

## 2. Environments and Data

Tests run strictly against local or disposable test Supabase projects—never live cohort data.

## 3. Traceability Matrix

| Requirement | Acceptance criterion | Test ID | Level | Status | Last run | Command |
|---|---|---|---|---|---|---|
| BR-02 / US-02 / BOOM-03 | `+10` pts, one-time streak bonuses, `+30s` fuse, `now > deadline` rejection | `T-001` | Unit + Service | ✅ Pass (`17` total) | `2026-11-17` | `npm test` |
| BR-01 / US-01 / BOOM-02 | Trim `2..20`, profanity, duplicate name, locked lobby rejection | `T-002` | Unit + Service | ✅ Pass | `2026-11-17` | `npm test` |
| BR-03 / US-04 / BOOM-04 | One-play-only enforcement & reconnect state restoration | `T-003` | Service + UI | 🟡 Partial (API `ALREADY_PLAYED`/expiry pass; `/play` UI `⬜`) | `2026-11-17` | `npm test` |
| BR-02 / US-03 / BOOM-03 | `correct_index` absent, no-repeat shuffle, pool exhaustion, duplicate answer ignore | `T-004` | Service | ✅ Pass | `2026-11-17` | `npm test` |
| BR-04 / US-05 / BOOM-05 | Realtime `/scoreboard` tie-breaker ranking | `T-005` | E2E / Manual | **Not written** (Phase 4) | — | — |
| BR-05 / US-06..07 / BOOM-06..07 | Admin `ADMIN_PASSCODE` guard, session start/end/reset, kick, question CRUD | `T-006` | Integration | **Not written** (Phase 3) | — | — |

## 4. Coverage

| Metric | Target | Baseline |
|---|---|---|
| Line / branch coverage | **TBD** | Not measured |

## 5. Quality Gates

**Per story:** Definition of Ready met (`sprint.md` §1), positive + negative/denial tests pass, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `node scripts/check-docs.mjs --mode=project` pass, and [`flow.md`](flow.md) updated.

## 6. Visual Review, Automated DOM Checks & Manual Checklist

Where UI exists, verify across mobile (`360px`) and projector (`1280px+`) viewports:
- **DOM anti-slop checks:** Zero `monospace` computed `font-family` anywhere in DOM, `tabular-nums` on timer/scores, zero `backdrop-filter: blur` on cards, `>= 48px` button height, WCAG AA contrast on `#FF7A1A` buttons (`#14161F` text).

| # | Scenario | Roles | Expected | Findings & Result | Date | Tester |
|---:|---|---|---|---|---|---|
| 1 | Synchronized cohort start & timer sync | `player`, `admin` | Countdown finishes together; timer extends `+30s` per right answer | Not run | — | — |
| 2 | Early admin end & reconnect mid-run | `player`, `admin` | Active players transition to `/result` immediately; refresh preserves server `deadline` | Not run | — | — |
| 3 | Replay attempt & unauthorized `/admin` access | `player`, Anonymous | Replay blocked to `/result`; admin routes/actions denied | Not run | — | — |
| 4 | UI craft & zero-mono check (`dsd.md` §1.1, §2.4, §7) | `player`, `admin` | Pass on `360px` phone & `1280px` projector | Not run | — | — |

---

## Self-Check

- [x] Traceability matrix honestly separates `BOOM-03` passing tests (`T-001`, `T-002`, `T-004`, partial `T-003`) from `BOOM-04`/`BOOM-05` `Not written` tests
- [x] Project doc check command included in §1
