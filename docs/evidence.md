# Evidence Registers: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [Grounding protocol](grounding.md) · [ADR index](adr/README.md) · [Glossary](glossary.md)

---

> **Purpose.** The ground truth an agent cites instead of guessing. If a fact, number, name, version, or assumption is not in this file (or in code, or in `foundation.md`), it is **not established**.
>
> **Rules.** Append; do not silently edit history. Retire a claim by moving it to §7. Dates use `YYYY-MM-DD`. The vocabulary is defined in [`grounding.md`](grounding.md) §3.

---

## 1. How to Use

| You need to… | Do this |
|---|---|
| Cite a number | Find or add a row in §3 with a source from §2. No row → write `Not validated` |
| Name an organization | Check §6. Default status is **Prospective target** |
| Rely on a guess | Add it to §4 first so it can be challenged |
| Use a library API | Check §5 for the resolved lockfile version and docs URL |
| Re-introduce a removed claim | Check §7 first — it was removed for a reason |

---

## 2. Source Register

| ID | Source | Type | Date | Owner | Location / URL | Supports |
|---|---|---|---|---|---|---|
| S-01 | `project_description.md` (Answer It! or BOOM! spec) | Brief | 2026-11-17 | Project Owner | Conversation brief | Product scope, rules, schema, routes, cartoon-bomb theme |
| S-02 | `package-lock.json` | Lockfile | 2026-11-17 | Engineering | `package-lock.json` | Exact installed Next.js, React, Tailwind, TypeScript versions |

---

## 3. Claims Ledger

Scope this ledger to **empirical, business, comparative, regulatory, and performance claims**. Game config defaults (`120s`, `+30s`, `+10 pts`) are policy choices from `S-01`, not empirical measurements.

| ID | Claim | Type | Used in (dependents) | Source | Status | Verified (rev / env / date) | Re-verify by |
|---|---|---|---|---|---|---|---|
| C-01 | `#14161F` Midnight Charcoal background + `#F5F7FA` Snow text / `#14161F` text on `#FF7A1A` Fuse Orange meet WCAG AA contrast (≥ 4.5:1) | Contrast math | `dsd.md` §2, `src/app/globals.css` | Calculated hex luminance vs `S-01` palette | **Not validated** by browser audit (math-checked) | `local · 2026-11-17` | Before Phase 4 sign-off |

---

## 4. Assumptions Register

| ID | Assumption | Why assumed | Risk if wrong | Validate by | Owner | Affected dependents | Status |
|---|---|---|---|---|---|---|---|
| A-01 | Single active session at a time (no room codes in MVP) | Stated in `S-01` §6 | Concurrent cohorts would collide | Before multi-cohort pilot | Project Owner | `foundation.md`, `data-model.md`, `api.md` | Open |
| A-02 | `ADMIN_PASSCODE` signed `httpOnly` cookie is preferred over Supabase Auth user accounts | Single facilitator account in `S-01` §4.2, §7 | Requires passcode rotation between events | Before Phase 3 admin build | Project Owner | `security.md`, `ADR-0002` | Open |
| A-03 | Streak bonuses (`+5`, `+10`, `+20` at `3`, `5`, `10`) trigger at most once per milestone per run | Stated in `S-01` §3 ("one-time bonus at each milestone") | Scoring rules change if repeatable | Before Phase 3 engine TDD | Project Owner | `src/config/game-config.ts`, `test-plan.md` | Open |

---

## 5. Verified Technical References

Resolved versions come from **`package-lock.json`** (not memory). Planned Phase 2–4 packages without installation yet are marked `Not installed`.

| Package / Service | Resolved version | Lockfile / provenance | Official docs (versioned) | Verified (rev / date) | Version-specific notes |
|---|---|---|---|---|---|
| `next` | `16.4.6` | `package-lock.json` (`S-02`) | `https://nextjs.org/docs` | `local · 2026-11-17` | App Router, Server Actions, `next/font/google` |
| `react` / `react-dom` | `19.3.0` | `package-lock.json` (`S-02`) | `https://react.dev` | `local · 2026-11-17` | React 19 |
| `tailwindcss` / `@tailwindcss/turbopack` | `4.3.3` | `package-lock.json` (`S-02`) | `https://tailwindcss.com/docs` | `local · 2026-11-17` | Tailwind v4 `@theme inline` CSS token config |
| `typescript` | `5.9.3` | `package-lock.json` (`S-02`) | `https://www.typescriptlang.org/docs/` | `local · 2026-11-17` | Strict mode enabled |
| `eslint` / `eslint-config-next` | `9.39.5` / `16.4.6` | `package-lock.json` (`S-02`) | `https://eslint.org/docs/latest/` | `local · 2026-11-17` | Core web vitals + TS lint |
| `@supabase/supabase-js` | Not installed (Phase 2) | — | `https://supabase.com/docs/reference/javascript` | `—` | Planned for Postgres + Realtime |
| `framer-motion` | Not installed (Phase 4) | — | `https://motion.dev/docs` | `—` | Planned for BOOM / `+30s` / card motion |
| `vitest` | Not installed (Phase 3) | — | `https://vitest.dev/` | `—` | Planned unit/contract test runner |

---

## 6. Entity Register

| Entity | Category | Relationship status | Evidence | Date | Notes |
|---|---|---|---|---|---|
| Supabase | Vendor / BaaS | Connected (`zamxjnsxmtsreknsqrwj`) | `S-01`, remote REST check | 2026-11-17 | Schema pushed (`20261117000001_init_schema.sql`), `1` session + `60` questions seeded, `anon` RLS verified |
| Vercel | Hosting vendor | Target infrastructure (`S-01` §7) | `S-01` | 2026-11-17 | Not yet deployed |

---

## 7. Retired Claims

| ID | Claim | Removed | Reason | Was used in |
|---|---|---|---|---|
| — | None yet | — | — | — |

---

## Self-Check

- [x] §5 installed versions match `package-lock.json`
- [x] Uninstalled Phase 2–4 packages marked `Not installed`
- [x] Assumptions blocking Phase 3 (`A-02`, `A-03`) recorded in §4
