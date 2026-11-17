# ADR-0003: Server-Only Mutations (`service_role`) + Read-Only RLS Realtime

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-11-17 |
| Deciders | Project Owner |
| Answers | `S-01` §8.5–8.7 |
| Supersedes | — |
| Affects | `data-model.md` §6, `security.md` §3–5, `sad.md` §3 |

## Context

Players join without Supabase Auth accounts (`anon` browser client), yet the app needs live lobby/scoreboard updates while strictly protecting `questions.correct_index` and preventing arbitrary direct DB writes.

## Decision

Enable RLS on all tables. Allow `anon` `SELECT`-only access on `sessions` and `players` for Supabase Realtime channels; deny all `anon` writes on every table and deny all `anon` reads on `questions` and `player_answers`. Route all mutations through Next.js server routes/actions using `SUPABASE_SERVICE_ROLE_KEY`.

## Consequences

- **Positive:** Zero browser exposure of `correct_index` and single authoritative validation path for joins, answers, and scoring.
- **Trade-off:** `players` table fields visible via Realtime must contain zero secrets or private fields.

## Rejected options

- **Direct browser Supabase writes with permissive `anon` RLS** — rejected because unauthenticated clients could forge scores, deadlines, or question inserts.

## Verification and Revisit Trigger

Verified via Phase 2 RLS policy checks and Phase 3 negative tests (`T-004`).
