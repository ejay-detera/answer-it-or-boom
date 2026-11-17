# ADR-0001: Server-Authoritative Bomb Deadlines & Clock-Offset Sync

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-11-17 |
| Deciders | Project Owner |
| Answers | `S-01` §8.2 (Timer Sync) |
| Supersedes | — |
| Affects | `sad.md` §4.2, `sdd.md` §3, `api.md` §3, `security.md` §4 |

## Context

Cadets play concurrently on phones and laptops whose local system clocks can drift or be manipulated.

## Decision

Compute `started_at` and per-player `deadline = started_at + base_time + (correct_count * bonus_time)` exclusively on the server (`timestamptz`). Return `serverNow` with session/question payloads so clients compute a display clock offset, and reject any answer where `serverNow > player.deadline`.

## Consequences

- **Positive:** Eliminates timer cheating and handles mid-game browser refreshes cleanly.
- **Trade-off:** Requires every answer submission to round-trip to the Next.js server before advancing `deadline`.

## Rejected options

- **Client-side `setInterval` countdown as truth** — rejected because device clocks drift, tabs throttle in background, and clients could forge extensions.

## Verification and Revisit Trigger

Verified via Phase 3 unit/integration test `T-001` (`now > deadline` returns `409 TIME_EXPIRED`).
