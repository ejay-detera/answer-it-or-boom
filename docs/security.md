# Security Document: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [SAD](sad.md) · [Data model](data-model.md) · [API](api.md) · [Ops](ops.md) · [Test plan](test-plan.md) · [Grounding](grounding.md)

---

> **Posture rule.** This document lists planned and implemented controls with verification status. Never claim the system "is secure".
>
> **No secret values** here, in `NEXT_PUBLIC_*`, in logs, or in chat.

---

## 1. Scope

| Item | Value |
|---|---|
| Lifecycle stage | Build (Phase 1 baseline scaffold only) |
| Risk tier & depth | Low-to-Medium (internal ephemeral quiz data, no PII beyond display names, no payments; server answer secrecy & admin isolation remain strict) |
| In scope | Next.js web app, Server Actions/API routes, Supabase Postgres RLS, Vercel env secrets |
| Out of scope | Player Google/external search anti-cheat (explicitly accepted in `S-01` §6) |

## 2. Assets and Data Classification

| Asset | Classification | Stored in | Owner | Retention |
|---|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSCODE` | **Secret** | Vercel env / local `.env.local` | Project Owner | Rotated per cohort/need |
| `questions.correct_index` | **Restricted** | Supabase `questions` table (server-only) | Project Owner | Persistent |
| `players.name`, scores | **Internal / Low** | Supabase `players` table | Project Owner | Cleared on session reset |

## 3. Trust Boundaries

| Boundary | Crossing mechanism | Verified at the crossing |
|---|---|---|
| Browser → Next.js Server | HTTPS POST / Server Action | Name validation (`2..20`, profanity), `now <= deadline`, `ADMIN_PASSCODE` cookie |
| Next.js Server → Supabase | `SUPABASE_SERVICE_ROLE_KEY` | Server-only client; never bundled in client code |
| Browser → Supabase Realtime | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Postgres RLS: `sessions`/`players` read-only; `questions`/`player_answers` denied |

## 4. Threat Model and Control Register

| Threat ID | Threat | Asset | Boundary | L / I | Control ID & requirement | Enforcement location | Owner | Status | Verified |
|---|---|---|---|---|---|---|---|---|---|
| TH-01 | Tampering: Player inspects browser network/DB to read answer key | `questions.correct_index` | Browser → DB / API | H / M | `SEC-01`: RLS denies `anon` on `questions`; API strips `correct_index` | Supabase RLS + `/api/play/*` | Engineering | ✅ | `T-004` (`2026-11-17`) |
| TH-02 | Tampering: Player spoofs local clock to extend bomb timer | `players.deadline` | Browser → API | M / M | `SEC-02`: Server computes `deadline` and rejects `now > deadline` | `/api/play/answer` | Engineering | ✅ | `T-001` (`2026-11-17`) |
| TH-03 | Elevation: Unauthorized user calls admin start/reset/kick/question CRUD | Session & question pool | Browser → `/api/admin/*` | M / H | `SEC-03`: Signed `httpOnly` cookie from `ADMIN_PASSCODE` checked on every admin route/action | `AdminGate` + `requireAdmin()` in `/api/admin/*` | Engineering | ✅ | `T-006` (`2026-11-17`) |
| TH-04 | Abuse: Replay / duplicate submission for same question | Score & fuse time | Browser → `/api/play/answer` | M / M | `SEC-04`: `UNIQUE (player_id, question_id)` + terminal status lock | Postgres constraint + API | Engineering | ✅ | `T-003`, `T-004` (`2026-11-17`) |
| TH-05 | Info disclosure: Secret leaked in `NEXT_PUBLIC_*` or repo | Service role key / passcode | Build / Repo | L / H | `SEC-05`: Only `NEXT_PUBLIC_SUPABASE_URL` & `ANON_KEY` public; `.env.local` gitignored | `.env.example`, `.gitignore` | Engineering | ✅ | `.gitignore` checked |

## 5. Authentication and Authorization

| Topic | Decision | Status |
|---|---|---|
| Player identification | Unique `httpOnly` `boom_player_id` cookie per join (no passwords) | ✅ |
| Admin auth | Single `ADMIN_PASSCODE` verified server-side → HMAC-SHA256 signed `httpOnly`, `SameSite=Lax` cookie (`ADR-0002`) | ✅ |

**Permission matrix.**

| Action / resource | `player` | `admin` | Anonymous | Scope | Enforced at | Verified by |
|---|:---:|:---:|:---:|---|---|---|
| Join waiting unlocked session | — | Allow | Allow | Unique trimmed name `2..20` | `/api/session/join` | `T-002` (✅) |
| Read `sessions` / `players` (Realtime) | Allow | Allow | Allow | Public lobby/leaderboard columns | Supabase RLS | `T-005` (✅) |
| Read `questions.correct_index` | **Deny** | Allow (`/admin`) | **Deny** | Server `service_role` only for `/api/play/*` | Supabase RLS | `T-004` (✅) |
| Submit answer | Conditional | — | **Deny** | Own `player_id`, `playing`, `now <= deadline` | `/api/play/answer` | `T-001`, `T-004` (✅) |
| Start / Lock / End / Reset / Kick / Questions | **Deny** | Allow | **Deny** | Signed `boom_admin_token` cookie | `AdminGate` + `/api/admin/*` | `T-006` (✅) |

## 6. Secrets

- `.env.local` is gitignored (`✅`). `.env.example` holds variable names only (`✅`).
- Never place `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_PASSCODE` in `NEXT_PUBLIC_*`.

## 7. Data Protection, Input Validation, Supply Chain

- Lockfile `package-lock.json` committed (`✅`), `npm audit` reported `0` vulnerabilities during Phase 1 install (`✅` `2026-11-17`).
- Player names trimmed, length-bounded (`2–20`), profanity-filtered (`✅` in `src/lib/validation.ts`), and rendered through React JSX escaping (no `dangerouslySetInnerHTML`).

## 8. Optional Modules

All optional modules inactive (`foundation.md` §0).

## 9. Review Status and Re-Verify Triggers

| Review | Status | Env / Rev | Date | Reviewer | Notes |
|---|---|---|---|---|---|
| Dependency install audit | 🟡 Dev-only findings (`0` prod vulns) | `local` | `2026-11-17` | `npm audit --omit=dev` | `@supabase/supabase-js` (`0` prod vulns); `vitest@3.2.4` dev tooling flags `3` transitive dev findings (`1` mod, `2` crit) |
| Threat model & RLS review | ✅ Verified (DB RLS + play API) | `zamxjnsxmtsreknsqrwj` | `2026-11-17` | Engineering | `anon` denied (`401`/`42501`) on `questions`, `player_answers`, and writes; `correct_index` absence verified (`T-004` + Playwright E2E) |
| Authorization & negative tests | ✅ Pass (`T-001..T-006`) | `local` | `2026-11-17` | Vitest + Playwright | `24/24` Vitest + Playwright unauth `/api/admin/*` (`401`), `/admin/*` redirect, replay block, & expired deadline |

## 10. Open Security Decisions

- None (`ADR-0002` accepted `2026-11-17`).

---

## Self-Check

- [x] Permission matrix uses `Allow`/`Deny`/`Conditional` (never `✅`)
- [x] Zero secret values in repository docs or `.env.example`
- [x] Threat controls reflect verified Vitest + Playwright + RLS runs (`2026-11-17`)
