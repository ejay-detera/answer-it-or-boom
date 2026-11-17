# Answer It! or BOOM! — App Flow and Feature Scope

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [BRD](brd.md) · [PRD](prd.md) · [SAD](sad.md) · [SDD](sdd.md) · [DSD](dsd.md) · [Build](build.md) · [Test plan](test-plan.md)

---

> **Purpose.** Honest status map of what is built (`✅`), partial (`🟡`), or planned (`⬜`). Marks match [`grounding.md`](grounding.md) §3.

**Operating boundary:** Phase 1 scaffold + Phase 2 remote Supabase schema & 60-question seed verified (`zamxjnsxmtsreknsqrwj`). Not deployed to Vercel; game/admin APIs not built yet.

---

## 1. Surfaces — What Lives Where

```mermaid
flowchart TB
  subgraph app ["Answer It! or BOOM!"]
    P["Player Routes"]
    A["Admin Routes"]
  end
  P --> R1["🟡 / Join Entry Shell"]
  P --> R2["⬜ /lobby Realtime Wait"]
  P --> R3["⬜ /play Bomb & Questions"]
  P --> R4["⬜ /result BOOM Screen"]
  P --> R5["⬜ /scoreboard Live Projector"]
  A --> A1["⬜ /admin Login"]
  A --> A2["⬜ /admin/dashboard Controls"]
  A --> A3["⬜ /admin/questions CRUD"]
```

## 2. Feature Scope Matrix

| Capability | Priority | Status | Where | Verified by |
|---|---|---|---|---|
| Next.js App Router + Tailwind v4 + `Fredoka`/`Nunito` (no mono) + `GAME_CONFIG` | Must | ✅ | `src/app/layout.tsx`, `globals.css`, `src/config/game-config.ts` | `npm run lint`, `tsc --noEmit`, `npm run build` |
| Starter `/` join card shell | Must | 🟡 (UI shell only; submit disabled) | `src/app/page.tsx` | `npm run build` |
| Supabase schema, indexes, RLS & 60+ question seed | Must | ✅ | `supabase/migrations/20261117000001_init_schema.sql`, `supabase/seed.sql` | Remote REST RLS & seed check (`2026-11-17`: `60` questions, `1` session, `anon` denied `42501` on `questions`/`player_answers` & writes) |
| Player join, duplicate/profanity guard & Realtime `/lobby` | Must | ⬜ planned | `⬜` | — |
| Synchronized 3-2-1 countdown & server-deadline `/play` race | Must | ⬜ planned | `⬜` | — |
| One-play-only lock, `/result`, & `/scoreboard` | Must | ⬜ planned | `⬜` | — |
| Admin passcode auth, session controls, & question CRUD | Must | ⬜ planned | `⬜` | — |
| Sound toggle & Framer Motion polish | Should | ⬜ planned | `⬜` | — |

## 3. Verification Commands

```bash
npm run lint
npx tsc --noEmit
npm run build
node scripts/check-docs.mjs --mode=project
```

*Update this file in the same change that alters feature status.*
