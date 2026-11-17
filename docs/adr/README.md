# Architecture and Decision Records: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](../foundation.md)
**Related:** [Foundation §14](../foundation.md) · [Grounding](../grounding.md) · [Evidence](../evidence.md)

---

## 1. Index

| ADR | Title | Status | Date | Answers | Supersedes | Affects |
|---|---|---|---|---|---|---|
| [ADR-0001](ADR-0001-server-authoritative-timer.md) | Server-authoritative bomb deadlines & clock-offset sync | Accepted | 2026-11-17 | `S-01` §8.2 | — | `sad.md`, `sdd.md`, `api.md`, `security.md` |
| [ADR-0002](ADR-0002-admin-passcode-auth.md) | Admin passcode signed `httpOnly` cookie authentication | Proposed | 2026-11-17 | `foundation.md` §14 Q1 | — | `security.md`, `api.md`, `sad.md` |
| [ADR-0003](ADR-0003-service-role-mutations-rls-realtime.md) | Server-only mutations (`service_role`) + read-only RLS Realtime | Accepted | 2026-11-17 | `S-01` §8.5–8.7 | — | `data-model.md`, `security.md`, `sad.md` |

## Self-Check

- [x] Every ADR appears in §1
- [x] Rejected options recorded in each ADR
