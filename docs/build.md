# Build Guide: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [SAD](sad.md) · [SDD](sdd.md) · [Flow](flow.md) · [Test plan](test-plan.md) · [Ops](ops.md) · [Security](security.md) · [Evidence](evidence.md)

---

## 1. Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | `v22.14.0` (observed `local`) | Next.js runtime & doc check script |
| npm | `11.5.1` (observed `local`) | Dependency & script runner |
| Supabase project | Planned (Phase 2) | Postgres + Realtime |

## 2. Initial Setup

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_PASSCODE
```

## 3. Environment Variables

Names only. **Never commit `.env.local` or paste secret values.**

| Variable | Exposure | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Read-only Realtime subscriptions under RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Authoritative writes & reading `questions.correct_index` |
| `ADMIN_PASSCODE` | **Server only** | Facilitator login secret |

## 4. Local Development

```bash
npm run dev
```

## 5. Seed and Admin Access

- Question seeding (`supabase/seed.sql`) and admin passcode verification live server-side in `.env.local` (planned Phase 2–3). **Never store passcodes in docs.**

## 6. Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
node scripts/check-docs.mjs --mode=project
```

### Definition of Done

- [ ] Every acceptance criterion in [`sprint.md`](sprint.md) is met
- [ ] UI changes comply with [`dsd.md`](dsd.md) §1.1 anti-slop rules (zero monospace, `tabular-nums`, contrast, `>= 48px` tap targets)
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `node scripts/check-docs.mjs --mode=project` pass
- [ ] [`flow.md`](flow.md) and [`evidence.md`](evidence.md) §5 updated in the same change

## 7. Known Issues and Drift

| # | Issue or doc drift | Impact | Status |
|---|---|---|---|
| 1 | Phase 1 only: `/` join button intentionally disabled until Supabase schema & server actions land | Players cannot join yet | ✅ Resolved `2026-11-17` (`JoinForm` wired in `BOOM-04`) |

## 8. Code Patterns and Economy

- Reuse order: existing `src/lib/`, `src/config/game-config.ts`, `src/components/` → Web/Next.js stdlib → installed packages → smallest justified new code.
- Cohesion over blind line count: split screen shells (`src/app/**/page.tsx`) from interactive client components (`src/components/`) and pure/server logic (`src/lib/`).
- Shared types live in `src/types/game.ts`.

## 9. Build and Deployment

```bash
npm run build
npm run start
```

## 10. Git Rules

Inspect freely read-only (`git status`, `git log`, `git diff`). Never commit, amend, or push without explicit permission.

---

## Self-Check

- [x] Prerequisites match observed local versions
- [x] Zero secret values or passwords in docs
- [x] Phase 1 disabled join state recorded honestly in §7
