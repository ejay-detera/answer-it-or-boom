# ADR-0002: Admin Passcode Signed `httpOnly` Cookie Authentication

| Field | Value |
|---|---|
| Status | Proposed (awaiting user confirmation) |
| Date | 2026-11-17 |
| Deciders | Project Owner |
| Answers | `foundation.md` §14 Q1 |
| Supersedes | — |
| Affects | `security.md` §5, `api.md` §2, `sad.md` §2 |

## Context

Only one facilitator (`admin`) hosts each onboarding session (`S-01` §2, §4.2). `S-01` §7 permits either Supabase Auth or a server-side `ADMIN_PASSCODE` check.

## Decision

Verify `ADMIN_PASSCODE` (server-only env var) via constant-time comparison in `/api/admin/login` and issue an HMAC-signed `httpOnly`, `SameSite=Lax` session cookie checked by Next.js middleware and admin handlers.

## Consequences

- **Positive:** Zero Supabase Auth user-seeding or email-reset friction for single-host sessions.
- **Trade-off:** Shared secret must be rotated in Vercel env if compromised.

## Rejected options

- **Full Supabase Auth email/password accounts** — deferred as unnecessary setup overhead for one facilitator unless multi-facilitator roles are added later.

## Verification and Revisit Trigger

Verified via `T-006` (unauthenticated admin route/API calls denied). Revisit if multiple facilitators with audit attribution are needed.
