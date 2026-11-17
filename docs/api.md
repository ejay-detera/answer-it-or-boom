# API Reference: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active (`API-01..API-03` built & contract-tested `✅`; admin `API-04..API-07` & Realtime `⬜`)
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [SDD](sdd.md) · [SAD](sad.md) · [Data model](data-model.md) · [Security](security.md) · [Test plan](test-plan.md) · [Grounding](grounding.md)

---

> **As-built rule.** Route Handlers (`src/app/api/**`), `src/lib/game-service.ts`, and `src/types/game.ts` are the contract authority for `API-01..API-03` (`✅`). Operations `API-04..API-07` remain **planned (`⬜`)**.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Protocol & transport | Next.js App Router Route Handlers (`/api/**`) or Server Actions + Supabase Realtime read channels |
| Auth & authorization | Players: `player_id` cookie/token scoped to their own row. Admin: `ADMIN_PASSCODE` signed `httpOnly` cookie verified server-side ([`security.md`](security.md) §5) |
| Input / output validation | Trim & validate all inputs server-side; strip `questions.correct_index` from all client responses |
| Retry safety & idempotency | Answer submission enforces `UNIQUE (player_id, question_id)`; duplicate submit returns safe idempotent response |
| Concurrency & timer | Server checks `now <= player.deadline`; atomic score/streak/deadline update |
| Error envelope | `{ "error": { "code": "...", "message": "..." } }` — never leak SQL, stack traces, or `correct_index` |

## 2. Operation Inventory

| ID | Method / Op | Path | Exposure | Auth & Scope | Purpose | Status | Idempotent | Tests |
|---|---|---|---|---|---|---|:---:|---|
| API-01 | `POST` | `/api/session/join` | Public | Open when `waiting` & `!lobby_locked` | Join cadet to active session | ✅ | No | `T-002` |
| API-02 | `GET` | `/api/play/question` | Player | Valid `boom_player_id` cookie in `playing` state | Fetch next unseen question (no `correct_index`) + `serverNow` | ✅ | Yes | `T-004` |
| API-03 | `POST` | `/api/play/answer` | Player | Valid `boom_player_id` cookie + `now <= deadline` | Validate answer, update score/streak/deadline | ✅ | Yes (`player_id, question_id`) | `T-001`, `T-004` |
| API-04 | `POST` | `/api/admin/login` | Public | `ADMIN_PASSCODE` check | Set signed `httpOnly` admin cookie | ⬜ | Yes | `T-006` |
| API-05 | `POST` | `/api/admin/session` | Admin | Admin cookie | Create / Start / Lock / End Early / Reset session | ⬜ | No | `T-006` |
| API-06 | `DELETE` | `/api/admin/players/[id]` | Admin | Admin cookie | Kick player from lobby | ⬜ | Yes | `T-006` |
| API-07 | `POST`/`PATCH`/`DELETE` | `/api/admin/questions` | Admin | Admin cookie | Question pool CRUD | ⬜ | No | `T-006` |

## 3. Reference Operation (`API-03 — Submit Answer`)

**Request** — `POST /api/play/answer`

```json
{
  "questionId": "00000000-0000-0000-0000-000000000001",
  "selectedIndex": 2
}
```

**Server sequence**

1. Read `player_id` from cookie; load player and session via `service_role`. Reject if `player.status !== 'playing'` or `session.status !== 'running'`.
2. Check server clock: if `now > player.deadline`, mark player `exploded` (`finished_at = now`) and return `409 TIME_EXPIRED`.
3. Look up `questions.correct_index` server-side; insert `(player_id, question_id, selected_index, is_correct)` (on `23505` duplicate key, return existing state idempotently).
4. Compute `newScore`, `newStreak`, `bestStreak`, and `newDeadline` via `src/lib/game-rules.ts`; persist and return `{ correct, newScore, newStreak, streakBonusAwarded, newDeadline, serverNow, status }`.

**Negative test gate:** Verify unauthenticated player, finished player (`exploded`/`completed`), expired deadline, invalid option index, duplicate `questionId` submit, and `correct_index` absence in payload.

## 4. Error Catalog

| Code | HTTP | Meaning | Client action |
|---|---:|---|---|
| `INVALID_NAME` | `400` | Name length outside `2..20` or blocked profanity | Show inline validation below input |
| `DUPLICATE_NAME` | `409` | Name already taken in current session | Prompt cadet for another name |
| `LOBBY_LOCKED` | `403` | Lobby locked or session already running | Show friendly "session started" message |
| `TIME_EXPIRED` | `409` | Server deadline passed (`BOOM`) | Transition to `/result` |
| `ALREADY_PLAYED` | `403` | Player status is `exploded` or `completed` | Redirect to `/result` |
| `UNAUTHORIZED` | `401` | Missing or invalid admin session cookie | Redirect to `/admin` |

## 5. Realtime Subscriptions (Supabase Channels)

| Channel / Table | Subscribers | Events | Payload scope | Status |
|---|---|---|---|---|
| `sessions` | `/lobby`, `/play`, `/scoreboard`, `/admin/dashboard` | `UPDATE` | `status`, `lobby_locked`, `started_at` | ⬜ |
| `players` | `/lobby`, `/scoreboard`, `/admin/dashboard` | `INSERT`, `UPDATE`, `DELETE` | Public leaderboard/lobby fields only | ⬜ |

## 6. External APIs Consumed

Supabase (`@supabase/supabase-js`, Phase 2).

## 7. Change Policy

Keep `src/types/game.ts` aligned with route payloads and `supabase/migrations/`.

---

## Self-Check

- [x] `API-01..API-03` built & contract-tested; `API-04..API-07` honestly marked `⬜`
- [x] `correct_index` explicitly excluded from client responses (`PublicQuestion`)
- [x] Negative test cases verified at service seam for auth, replay, duplicate submit, and expiry
