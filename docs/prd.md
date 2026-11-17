# Product Requirements Document (PRD): Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [BRD](brd.md) · [BPD](bpd.md) · [SAD](sad.md) · [SDD](sdd.md) · [DSD](dsd.md) · [Flow](flow.md) · [Build](build.md) · [Test plan](test-plan.md) · [Glossary](glossary.md) · [Evidence](evidence.md)

---

> **Source-of-truth rule.** [`foundation.md`](foundation.md) is canonical.
>
> **As-built rule.** Feature status reflects verified code in this repository today (`flow.md`). Never mark unbuilt features `✅`.

**Status legend:** defined in [`grounding.md`](grounding.md) §3 (`✅ 🟡 ⬜ ❓ ❌`).

---

## 1. Product Purpose and Value Proposition

**Answer It! or BOOM!** is a real-time web icebreaker quiz game for onboarding cohorts of software developer cadets (`S-01`). Players join by name, start together on the host's signal, and race an independent `120s` bomb timer extended by `+30s` per correct answer.

---

## 2. Target Personas

### Primary — Cadet (`player`)
- **Who:** Software developer cadet in orientation (beginner to mixed skill).
- **Jobs:** Join quickly on phone or laptop, answer fast without typo anxiety, compare scores.
- **Surfaces:** `/`, `/lobby`, `/play`, `/result`, `/scoreboard`.

### Primary — Facilitator (`admin`)
- **Who:** Onboarding host / project owner.
- **Jobs:** Manage session lifecycle, moderate lobby names, manage questions, display `/scoreboard` on a projector.
- **Surfaces:** `/admin`, `/admin/dashboard`, `/admin/questions`, `/scoreboard`.

---

## 3. Core Features, Priorities, and Status

| # | Feature | Priority | Status | Evidence |
|---:|---|---|---|---|
| 1 | Next.js baseline, `GAME_CONFIG`, Cartoon Bomb CSS tokens, `Fredoka`/`Nunito` (no mono) | Must | ✅ | `src/config/game-config.ts`, `src/app/globals.css`, `layout.tsx`, `page.tsx` |
| 2 | Cadet name entry, profanity/duplicate check, & Realtime `/lobby` | Must | ⬜ | Planned (`BOOM-02`) |
| 3 | Synchronized 3-2-1 countdown & `/play` game screen with shrinking SVG bomb fuse | Must | ⬜ | Planned (`BOOM-03`) |
| 4 | Server-side answer validation (`correct_index` hidden), scoring, streaks, & `+30s` deadline | Must | ⬜ | Planned (`BOOM-03`) |
| 5 | One-play-only enforcement, `/result` BOOM screen, & `"You beat the bomb!"` finish | Must | ⬜ | Planned (`BOOM-04`) |
| 6 | Live projector `/scoreboard` with tie-breaker ranking | Must | ⬜ | Planned (`BOOM-05`) |
| 7 | Admin passcode auth, `/admin/dashboard` (start, end early, reset, lock lobby, kick) | Must | ⬜ | Planned (`BOOM-06`) |
| 8 | Question pool (`60+` seeded questions) & `/admin/questions` CRUD | Should | ⬜ | Planned (`BOOM-07`) |
| 9 | Sound effects toggle (on by default, mutable) & polish animations | Should | ⬜ | Planned (`BOOM-08`) |
| 10 | Player accounts, multi-room codes, AI questions, PvP chat, typed answers | — | ❌ | Excluded in `S-01` §6 |

Canonical feature status: [`flow.md`](flow.md) §4.

---

## 4. User Stories and Acceptance Criteria

### US-01 — Cadet Join & Lobby Presence ⬜
> As a **Cadet**, I want to enter my name and wait in the lobby so that everyone starts at the exact same moment.
- Given a `waiting` unlocked session and a trimmed name of `2–20` valid characters, when I submit on `/`, then my `players` row is created, identity is stored in cookie/`localStorage`, and I enter `/lobby`.
- Given a duplicate name (case-insensitive), profanity, locked lobby, or `running`/`finished` session, when I attempt to join, then join is rejected with a clear inline error.
**Traces:** `BR-01` · `BOOM-02` · tests `T-002`

### US-02 — Synchronized Countdown & Bomb Race ⬜
> As a **Cadet**, I want a synchronized start and fast multiple-choice questions that add `+30s` and points so that I stay alive as long as possible.
- Given the host triggers Start (`countdown` → `running`), when `started_at` arrives, then all lobby players transition to `/play` with a `120s` server deadline and see questions without `correct_index`.
- Given a valid answer submitted before `now <= deadline`, when correct, then server adds `+10` pts (plus one-time `+5`/`+10`/`+20` at streak `3`/`5`/`10`) and extends `deadline` by `+30s`.
- Given a wrong answer, duplicate submission for the same `question_id`, or `now > deadline`, then no points/time are awarded, duplicates are ignored, and expired runs mark `exploded`.
**Traces:** `BR-02` · `BOOM-03` · tests `T-001`, `T-004`

### US-03 — No-Repeat Questions & Pool Exhaustion ⬜
> As a **Cadet**, I want non-repeating shuffled questions and a celebratory finish if I answer every question.
- Given active questions remain unseen in `player_answers`, when requesting next question, then an unseen question returns without `correct_index`.
- Given zero unseen active questions remain, then player status becomes `completed` ("You beat the bomb!") and routes to `/result`.
**Traces:** `BR-02` · `BOOM-03` · tests `T-004`

### US-04 — One-Play-Only Enforcement & Reconnect ⬜
> As a **Facilitator**, I want each cadet to play only once per session while surviving accidental page refreshes.
- Given an active player refreshes `/play`, then server deadline restores accurately.
- Given a player with `status IN ('exploded', 'completed')` visits `/` or `/play`, then replay is blocked and they see `/result`.
**Traces:** `BR-03` · `BOOM-04` · tests `T-003`

### US-05 — Live Projector Scoreboard ⬜
> As a **Facilitator**, I want a projector-friendly `/scoreboard` updating live so the room can watch rankings shift.
- Given players finish or score updates, when viewing `/scoreboard`, then rows sort by `score DESC, correct_count DESC, survival_time DESC` in real time.
**Traces:** `BR-04` · `BOOM-05` · tests `T-005`

### US-06 — Facilitator Session Control ⬜
> As a **Facilitator**, I want `/admin/dashboard` to start, lock, kick players, end early, and reset sessions.
- Given valid `ADMIN_PASSCODE`, when authenticated on `/admin`, then host can start (`>0` players required), lock/unlock lobby, kick a lobby player, end all active runs early, or reset session.
- Given unauthenticated request to admin routes/actions, then server rejects access (`401`/`302`).
**Traces:** `BR-05` · `BOOM-06` · tests `T-006`

### US-07 — Question Pool Management ⬜
> As a **Facilitator**, I want `60+` easy seeded questions and simple CRUD at `/admin/questions`.
- Given admin credentials, host can add, edit, toggle `is_active`, and delete questions; `correct_index` remains hidden from player endpoints.
**Traces:** `BR-05` · `BOOM-07` · tests `T-006`

### US-08 — Audio & Visual Feedback Polish ⬜
> As a **Cadet**, I want clear timer urgency colors, `+30s` pop, explosion animation, and a mute toggle.
- Given `/play`, sound defaults on and can be muted; `prefers-reduced-motion` disables jarring motion; timer changes Snow → Spark Yellow (`≤30s`) → Boom Red (`≤10s`).
**Traces:** `BR-06` · `BOOM-08`

---

## 5. Key User Flows

Full status matrix and diagrams: [`flow.md`](flow.md).

---

## 6. Non-Goals for MVP (❌)

- Player accounts, passwords, or profiles
- Multiple concurrent sessions / room codes
- Player-vs-player chat or sabotage
- Free-text / typed answers or coding challenges
- AI-generated questions
- Player replays within the same session
- Spectator mode outside `/scoreboard`
- Native mobile app or offline mode

---

## 7. Business Model

`N/A — internal onboarding game` ([`bpd.md`](bpd.md)).

---

## 8. Dependencies and Assumptions

See [`evidence.md`](evidence.md) §4–§5 (`A-01..A-03`, Next.js, Supabase, Vercel).

---

## 9. Roadmap — Build Milestones

| Item | Intended scope | Blocking decisions |
|---|---|---|
| **Milestone 1: Phase 1 Scaffold** ✅ | Next.js, Tailwind v4 tokens, `Fredoka`/`Nunito`, `GAME_CONFIG`, starter `/` | — |
| **Milestone 2: DB Schema & 60+ Seed** ⬜ | `sessions`, `players`, `questions`, `player_answers`, RLS, indexes, `seed.sql` | Supabase project (`Q4`) |
| **Milestone 3: TDD Game Engine & Join** ⬜ | `game-rules.ts`, `validation.ts`, `game-service.ts`, Vitest tests | Streak confirm (`Q2`) |
| **Milestone 4: Player & Admin Routes** ⬜ | `/lobby`, `/play`, `/result`, `/scoreboard`, `/admin/*`, Realtime | Auth ADR (`Q1`) |
| **Milestone 5: Polish & Vercel Deploy** ⬜ | Motion/sound polish, mobile QA, Vercel env & test cohort run | Deployment target (`Q4`) |

---

## Self-Check

- [x] Only Phase 1 scaffold marked ✅; unbuilt milestones marked ⬜
- [x] Non-goals match `S-01` §6
- [x] User stories cover positive and negative/denial paths
