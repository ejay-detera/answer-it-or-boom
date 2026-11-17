# Operations Runbook: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [SAD](sad.md) · [Build](build.md) · [Security](security.md) · [Test plan](test-plan.md) · [Grounding](grounding.md)

---

> **Reality rule.** Local app + remote Supabase (`zamxjnsxmtsreknsqrwj`) verified (`2026-11-17`). Hosted Vercel deployment does not exist yet (`⬜` — user deploying).

---

## 1. Environments

| Environment | Exists? | Purpose | Location (no secrets) | Data | Deploy method | Owner |
|---|:---:|---|---|---|---|---|
| Local | ✅ | Development | `http://localhost:3000` | Seeded locally (Phase 2) | `npm run dev` | Developer |
| Vercel Preview / Prod | ⬜ Does not exist | Cohort onboarding sessions | `TBD` | Supabase project (`TBD`) | Vercel Git deploy | Project Owner |

## 2. Deployment

- Pre-deploy gate: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `node scripts/check-docs.mjs --mode=project`, and Phase 3 test suite passing.
- Apply `supabase/migrations/` and `supabase/seed.sql` before serving cohort traffic.

## 3. Rollback

Vercel instant deployment rollback (`Unproven` until deployed). Forward-fix migrations in `supabase/migrations/`.

## 4. Monitoring and Alerting

**Current state:** Console output only locally (`⬜` no hosted alerting configured yet).

## 5. Backup and Recovery

Question pool is reproducible from `supabase/seed.sql`; session player scores are ephemeral per cohort (`N/A — no long-term backup RPO/RTO needed for icebreaker scores; seed.sql restores questions`).

## 6. Configuration and Secrets Operations

Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSCODE`) live in local `.env.local` (gitignored) and Vercel encrypted environment variables (`⬜`). Rotate `ADMIN_PASSCODE` between cohorts if shared.

## 7. Incident Response (During Live Onboarding Session)

1. If a disruptive player name joins `/lobby`, Facilitator clicks **Kick Player** on `/admin/dashboard`.
2. If session state gets stuck, Facilitator clicks **End Game Early** or **Reset Session**.
3. If `ADMIN_PASSCODE` leaks, rotate env var in Vercel and redeploy.

## 8. Production-Readiness Checklist

| Capability | Status | Evidence |
|---|:---:|---|
| Supabase schema, RLS, and `60+` question seed applied | ✅ | `zamxjnsxmtsreknsqrwj` pushed & REST-verified (`60` questions, `2026-11-17`) |
| Full gameplay & admin flows verified (`test-plan.md`) | ✅ | `26/26` Vitest + Playwright E2E (`BOOM-04`, `BOOM-05`, `BOOM-06`, `2026-11-17`) |
| Practice dry-run with sample cohort completed (`S-01` §11) | ⬜ | Pending Vercel deploy by Project Owner |

---

## Self-Check

- [x] Non-existent deployments marked `⬜ Does not exist`
- [x] Zero invented SLOs or secrets
