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
| BR-03 / US-04 / BOOM-04 | One-play-only enforcement & reconnect state restoration | `T-003` | Service + E2E | ✅ Pass (unit + Playwright reload & replay-lock) | `2026-11-17` | `npm test`, Playwright E2E |
| BR-02 / US-03 / BOOM-03 | `correct_index` absent, no-repeat shuffle, pool exhaustion, duplicate answer ignore | `T-004` | Service + E2E | ✅ Pass | `2026-11-17` | `npm test`, Playwright E2E |
| BR-04 / US-05 / BOOM-04 | Realtime `/scoreboard` tie-breaker ranking | `T-005` | Playwright E2E | ✅ Pass (`1280x800` live update + `tabular-nums`) | `2026-11-17` | Playwright E2E |
| BR-05 / US-06..07 / BOOM-05 | Admin `ADMIN_PASSCODE` guard, session start/end/reset, kick, question CRUD | `T-006` | Unit + Service + E2E | ✅ Pass (`24/24` Vitest + Playwright E2E) | `2026-11-17` | `npm test`, Playwright E2E |

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
| 1 | Synchronized cohort start & timer sync | `player`, `admin` | Countdown finishes together; timer extends `+30s` per right answer | ✅ Pass via Admin Start + Playwright (`2026-11-17`) | `2026-11-17` | Playwright |
| 2 | Early admin end & reconnect mid-run | `player`, `admin` | Active players transition to `/result` immediately; refresh preserves server `deadline` | ✅ Pass via Admin End Early & `page.reload()` (`2026-11-17`) | `2026-11-17` | Playwright |
| 3 | Replay attempt & unauthorized `/admin` access | `player`, Anonymous | Replay blocked to `/result`; admin routes/actions denied | ✅ Pass (`/` & `/play` → `/result`; unauth `/admin/*` → `/admin`, `/api/admin/*` `401`) | `2026-11-17` | Playwright |
| 4 | UI craft & zero-mono check (`dsd.md` §1.1, §2.4, §7) | `player`, `admin` | Pass on `360px` phone & `1280px` projector | ✅ Pass (`0` mono, `0` blur, `>= 48px`, `tabular-nums`, `0` overflow across all player & admin routes) | `2026-11-17` | Playwright |

---

## Self-Check

- [x] Traceability matrix reflects `BOOM-03` (`T-001..T-004`), `BOOM-04` (`T-003`, `T-005`), and `BOOM-05` (`T-006`) passing checks
- [x] Project doc check command included in §1
