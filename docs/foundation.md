# Foundation Document: Answer It! or BOOM!

**Version:** 1.0
**Date:** 2026-11-17
**Status:** Active Living Foundation

> This document is the foundation reference for **Answer It! or BOOM!**'s purpose, product thinking, identity, workflow, and technical direction.
>
> **Terminology.** Source material is the product specification (`S-01` in [`evidence.md`](evidence.md) §2). Keep supplied requirements separate from observed code reality in [`flow.md`](flow.md).
>
> **Factual-source boundary:** product intent comes from `S-01` or accepted [ADRs](adr/README.md). Observed implementation status comes from code and live checks. Never invent answers where the source is silent—write `Open`, `TBD`, `Not stated`, or `❓` (`grounding.md` §3).

---

## 0. Lifecycle Stage, Source Basis, Active Modules

| Item | Value |
|---|---|
| Lifecycle stage | **Build** (Phase 1 baseline Next.js scaffold complete; gameplay, database, and Realtime routes planned `⬜`) |
| Source basis | Product specification (`S-01` in [`evidence.md`](evidence.md) §2) |
| Context | Internal onboarding tool: Software developer cadet onboarding icebreaker |

**Active modules.** All optional domain modules are inactive for MVP and pruned from `docs/`:

| Module | Active? | Why |
|---|:---:|---|
| Payments and ledger | N | No payments, ledger, or financial transactions |
| Mobile client | N | Web-only responsive Next.js app (no native mobile binary) |
| AI component | N | Curated static question pool; no runtime LLM/ML inference |

---

## FOR DEVS + TL;DR

> If you read nothing else, read this section. It separates verified/decided product scope from open decisions.

### What we are building

**Answer It! or BOOM!** is a fast, funny, real-time web icebreaker quiz game for software developer cadet onboarding. Every cadet races a ticking bomb: starting with a **120-second** base fuse, answering easy multiple-choice questions adds **+10 points** (plus milestone streak bonuses) and **+30 seconds** to the bomb timer until the fuse hits `0:00` (BOOM!) or the question pool is exhausted.

Architecture & surfaces: **Next.js (App Router, TypeScript)** client & Server Actions/API routes; **Tailwind CSS** + **Framer Motion** (planned for Phase 4); **Supabase** (Postgres + Realtime, planned for Phase 2); **Vercel** hosting. Observed implementation status lives in [`flow.md`](flow.md).

### Source-defined product decisions

| Area | Decision | Confidence / basis |
|---|---|---|
| Product category & surfaces | Real-time responsive web quiz game (Player mobile/desktop web + Projector `/scoreboard` + Admin panel) | `S-01` |
| System context | Internal onboarding tool: software developer cadet orientation | `S-01` |
| Primary actors / operators | **Player (Cadet)** and **Admin (Facilitator)** | `S-01` |
| Explicit non-goals | No player accounts/passwords, multi-room codes, PvP chat, typed answers, AI questions, replays, native mobile app, or offline play | `S-01` ([`prd.md`](prd.md) §6) |
| Implementation status | Phase 1 scaffold + Phase 2 Supabase schema/seed (`zamxjnsxmtsreknsqrwj`) built & verified; game/admin routes `⬜` | [`flow.md`](flow.md) |

### Architecture summary in one paragraph

Next.js App Router serves responsive player routes (`/`, `/lobby`, `/play`, `/result`, `/scoreboard`) and admin routes (`/admin`, `/admin/dashboard`, `/admin/questions`). All writes (`join`, `answer`, `start`, `end`, `reset`, `kick`, `questions`) execute server-side using `SUPABASE_SERVICE_ROLE_KEY`, enforcing server-authoritative `deadline` timestamps and withholding `questions.correct_index` from clients. Browsers subscribe to read-only Supabase Realtime channels for session state, lobby roster, and live leaderboard updates. Exact contracts, schemas, and controls live in [`sad.md`](sad.md), [`api.md`](api.md), [`data-model.md`](data-model.md), and [`security.md`](security.md).

### Core workflow at a glance

1. Cadet enters a unique name (`2–20` chars) and joins the waiting lobby (`waiting`).
2. Facilitator starts the session (`countdown` 3-2-1 → `running`) so all cadets start simultaneously with a `120s` fuse.
3. Cadet answers easy multiple-choice questions; server validates answers (`+10` pts, streak `+5/+10/+20` at `3/5/10`, `+30s` deadline) without exposing `correct_index`.
4. When server `deadline` expires (or facilitator ends early, or pool exhausts), the run ends (`exploded` / `completed`) and final rank appears on `/result` and `/scoreboard`.

### Scope and status truth table

| Capability | In source scope? | Implementation status |
|---|---:|---:|
| Cartoon-bomb theme, fonts (`Fredoka`/`Nunito`, no mono), `GAME_CONFIG` | Yes | ✅ (built & verified via build/lint) |
| Player join, lobby, synchronized start, and one-play enforcement | Yes | ⬜ |
| Server-authoritative timer, scoring, streak bonus, & no-repeat questions | Yes | ⬜ |
| Live projector `/scoreboard` via Supabase Realtime | Yes | ⬜ |
| Admin passcode login, session controls, & question CRUD | Yes | ⬜ |

### Team / maintainers

| Team / Owner | Member | Responsibility |
|---|---|---|
| Project Owner | Facilitator / Project Owner | Session facilitation, `ADMIN_PASSCODE`, question pool |
| Engineering | Developer / AI Agent | Implementation and verification |

---

## 1. Context & Source Basis

**Answer It! or BOOM!** originates from the product specification (`S-01`) for onboarding cohorts of software developer cadets:

> **Answer It! or BOOM! — A fast, funny, real-time icebreaker quiz game for software developer cadet onboarding.**

What is **not** established by `S-01` (kept as `Open`, `TBD`, or `Not stated`):

- Target Supabase project URL/region and Vercel deployment domain (`TBD`);
- Exact profanity blocklist source (`TBD` — simple curated starter list planned);
- Whether wrong answers deduct time in default sessions (`0s` penalty default configurable via `sessions.wrong_answer_penalty_seconds`);
- Automated E2E/load test baselines (`Not validated`).

---

## 2. The Problem Answer It! or BOOM! Addresses

First-day onboarding sessions can feel stiff for beginner cadets unfamiliar with software development terminology or intimidated by coding tests.

### 2.1 Operational failure points

| Problem identified in source | Operational consequence |
|---|---|
| Icebreakers feel awkward or unrelated to software dev | Cadets stay quiet instead of bonding with cohort peers |
| Free-text or hard trivia frustrates beginners | Spelling typos and difficult questions stall momentum |
| Client-side quiz timers or answer keys leak | Players desync or inspect answers in browser DevTools |
| Repeat plays skew onboarding scoreboards | Cadets retry multiple times to inflate scores |

### 2.2 Why an existing static quiz is insufficient

Standard static quiz tools do not provide a synchronized start with independent, dynamically extended per-player bomb fuses (`+30s` per right answer), server-enforced one-try-per-session locks, and a projector-ready live survival scoreboard tuned for onboarding.

---

## 3. The Product Response: Connected Icebreaker Surfaces

**Answer It! or BOOM!** links four lightweight surfaces around a single active session:

### 3.1 Player Lobby & Synchronized Start
Cadets join with only a name (no signup) and wait together until the facilitator triggers the synchronized 3-2-1 fuse countdown.

### 3.2 Server-Authoritative Bomb Race
Each cadet races an independent server-computed deadline (`started_at + base_time + correct_count * bonus_time`), receiving shuffled, non-repeating easy questions.

### 3.3 Live Projector Scoreboard
`/scoreboard` streams real-time rankings across the room sorted by score, correct count, and survival time.

### 3.4 Facilitator Control Panel
Single-admin session control (create, lock lobby, start, end early, reset, kick player, manage questions).

---

## 4. Why the Capabilities Belong Together

Independent timers let slower and faster readers stay engaged simultaneously while sharing one synchronized start and live leaderboard, keeping the room energetic without requiring accounts or heavy setup.

---

## 5. The Name: Answer It! or BOOM!

Established by `S-01` as **Answer It! or BOOM!** (cartoon bomb icebreaker theme).

---

## 6. Product Identity

| Identity element | Source-defined form |
|---|---|
| Product name | **Answer It! or BOOM!** |
| Product descriptor | Real-time icebreaker quiz game for software developer cadet onboarding |
| Category contrast | Playful survival-fuse race rather than graded assessment or static quiz |
| Primary audience | Beginner-friendly software developer cadets & session facilitator |
| Core outcome | Cadets laugh, talk, and absorb basic dev vocabulary under zero pressure |

---

## 7. Product Vision: The Unified Workflow

### 7.1 End-to-end operating flow

1. **Setup:** Facilitator logs into `/admin`, ensures `50–100+` easy questions are active, and opens a `waiting` session.
2. **Join:** Cadets enter names (`2–20` chars) at `/` and gather on `/lobby`.
3. **Countdown & Play:** Facilitator clicks Start (`countdown` → `running`); cadets answer shuffled questions on `/play`, earning `+10` pts, streak bonuses (`+5/+10/+20`), and `+30s` per right answer.
4. **BOOM & Scoreboard:** Expired timers or exhausted question pools redirect cadets to `/result`; `/scoreboard` highlights top survivors in real time.

### 7.2 Tunable Game Parameters

Stored in `src/config/game-config.ts` and persisted per session in `sessions`:
- Base time: `120s` (`2:00`)
- Correct bonus: `+30s` and `+10` points
- Streak milestones (one-time per run): `3 → +5`, `5 → +10`, `10 → +20`
- Wrong answer: `0` pts, `0s` penalty default (configurable)
- Question mix target: `~70%` easy software dev, `~20%` general/tech culture, `~10%` silly/fun

### 7.3 What success looks like

- Full cohort joins and starts simultaneously without desync.
- Timer extensions and expiration resolve authoritatively on the server.
- One-play-only enforcement holds per session (`exploded` / `completed` cannot replay).
- Projector `/scoreboard` updates live and stays legible across a room.

### 7.4 Role-oriented product surfaces

| Participant | Surface jobs |
|---|---|
| **Player (Cadet)** | Join (`/`), wait (`/lobby`), answer race (`/play`), view final BOOM/rank (`/result`), view leaderboard (`/scoreboard`) |
| **Admin (Facilitator)** | Login (`/admin`), control session/kick/lock (`/admin/dashboard`), manage questions (`/admin/questions`), display `/scoreboard` |

### 7.5 Business model

`N/A — internal onboarding game (non-commercial)`.

---

## 8. Target Users and Participants

### 8.1 Players (Cadets)
- Onboarding software developer cadets with mixed/beginner skill levels using phones or laptops.

### 8.2 Admin (Facilitator)
- Single session host managing cohorts and projector display.

---

## 9. Proposed Technology and Constraints

Canonical stack & trade-offs live in [`sad.md`](sad.md) §2; resolved lockfile pins live in [`evidence.md`](evidence.md) §5. Key constraints from `S-01`:
- Next.js App Router (TypeScript) + Tailwind CSS + Framer Motion (Phase 4) + `next/font/google` (`Fredoka`, `Nunito`, **zero monospace**).
- Supabase (Postgres + Realtime) with strict RLS and `SUPABASE_SERVICE_ROLE_KEY` restricted to server routes/actions.
- Vercel hosting; requires internet connection (no offline mode).

---

## 10. Key Technology Rationale (Optional)

**Supabase Postgres + Realtime** is selected for combined relational state (`sessions`, `players`, `questions`, `player_answers`), Row Level Security, and instant WebSocket broadcasts to `/lobby`, `/play`, and `/scoreboard` without operating a custom WebSocket server.

---

## 11. Competitive Positioning (Optional)

`N/A — internal onboarding tool; no external commercial comparison required`.

---

## 12. Goal Alignment (Optional)

- **Onboarding camaraderie:** Reduce first-day stress and spark conversation.
- **No-pressure dev literacy:** Expose cadets to ~70% foundational dev terms (HTML, CSS, GitHub, bugs, shortcuts) in play.

---

## 13. Non-Goals & Operating Boundaries

| Boundary | Reason / source |
|---|---|
| No player accounts, passwords, or profiles | Frictionless name-only join (`S-01` §6) |
| Single active session at a time (no room codes) | Single facilitator cohort MVP (`S-01` §6) |
| No PvP chat, sabotage, typed answers, or AI questions | Beginner-safe, typo-free MVP (`S-01` §6) |
| No guaranteed anti-cheat against external search | Accepted trade-off for a fun icebreaker (`S-01` §6) |
| No offline support or native mobile app | Web + Realtime requirement (`S-01` §6) |

---

## 14. Open Decisions and Living Questions

| # | Decision area | Current posture | Why it must be resolved |
|---:|---|---|---|
| Q1 | Admin auth mechanism | `ADMIN_PASSCODE` signed `httpOnly` cookie proposed ([`ADR-0002`](adr/ADR-0002-admin-passcode-auth.md)) | Needed before implementing `/admin` routes |
| Q2 | Streak bonus repeatability | One-time per milestone (`3`, `5`, `10`) per run proposed | Ensures consistent scoring implementation in Phase 3 |
| Q3 | Profanity filter scope | Lightweight client/server normalized word list `TBD` | Prevents inappropriate names on projector `/scoreboard` |
| Q4 | Deployment targets & Supabase project | Remote Supabase `zamxjnsxmtsreknsqrwj` provisioned, pushed & verified (`2026-11-17`); Vercel domain `TBD` | Vercel target needed before Phase 5 deploy |

### 14.1 Resolution tracker

| # | Status | ADR | Decided on |
|---:|---|---|---|
| Q1 | Proposed | [`ADR-0002`](adr/ADR-0002-admin-passcode-auth.md) | 2026-11-17 |
| Q2 | Open | — | — |
| Q3 | Open | — | — |
| Q4 | Open | — | — |
