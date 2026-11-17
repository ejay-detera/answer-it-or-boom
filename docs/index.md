# Documentation Index: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Lifecycle stage:** Build (Phase 1 baseline scaffold complete). Set in [`foundation.md`](foundation.md) §0
**Source of truth:** [`foundation.md`](foundation.md)

---

## 1. Start Here

[`foundation.md`](foundation.md) is the **canonical source of truth**. Any developer or AI agent confirming a product fact reads it first. If a document here conflicts with it, resolve the conflict in `foundation.md`, then propagate.

`docs/` is the **first place to look** for context, before reading code and before asking. AI agents follow [`grounding.md`](grounding.md) (cite evidence, never invent) and the **Task-Based Context Router** in [`AGENTS.md`](../AGENTS.md) §1 to load only task-relevant documents.

**Project mode rules.** Every applicable field holds verified evidence, an approved decision, or `TBD` / `Not stated` / `❓` (`grounding.md` §3). Inapplicable documents (`bpd.md`) carry `N/A — [REASON]`. Inactive domain modules (`payments-ledger`, `mobile-client`, `ai-component`) have been pruned.

---

## 2. Documentation Suite

Read via the Task-Based Context Router in [`AGENTS.md`](../AGENTS.md) §1.

### 2.1 Core

| # | Document | File | What it answers |
|---:|---|---|---|
| 1 | Foundation | [foundation.md](foundation.md) | Why this exists, identity, core game workflow, lifecycle stage, open decisions |
| 2 | BRD | [brd.md](brd.md) | Onboarding goals, roles, requirements with status, risks, metrics |
| 3 | BPD | [bpd.md](bpd.md) | `N/A — internal cadet onboarding game (non-commercial)` |
| 4 | PRD | [prd.md](prd.md) | Personas, features, user stories (`US-01..US-08`), non-goals, roadmap |
| 5 | SAD | [sad.md](sad.md) | Next.js + Supabase + Vercel architecture, dependency rationale, quality attributes |
| 6 | SDD | [sdd.md](sdd.md) | Subsystems, server clock sync, Realtime data flow, configuration, error handling |
| 7 | DSD | [dsd.md](dsd.md) | Cartoon-bomb theme tokens, `Fredoka`/`Nunito` (no mono), components, motion, a11y |
| 8 | Flow | [flow.md](flow.md) | Honest status map: what is built (`✅`) vs planned (`⬜`) |
| 9 | Build | [build.md](build.md) | Setup, commands, guardrails, known issues, Definition of Done |
| 10 | Sprint | [sprint.md](sprint.md) | Stories (`BOOM-01..BOOM-08`) with acceptance criteria and traces |

### 2.2 Engineering reference

| Document | File | What it answers |
|---|---|---|
| Data model | [data-model.md](data-model.md) | `sessions`, `players`, `questions`, `player_answers` schema, states, invariants, indexes |
| API | [api.md](api.md) | Server Actions / Route Handlers, error catalog, Realtime channels |
| Security | [security.md](security.md) | Assets, RLS boundaries, threat model, `Allow`/`Deny` permission matrix, review status |
| Test plan | [test-plan.md](test-plan.md) | Test levels, `vitest` seams, traceability, quality gates |
| Ops | [ops.md](ops.md) | Local/Vercel/Supabase environments, deploy, rollback, monitoring, incident runbooks |

### 2.3 Grounding and decisions

| Document | File | What it answers |
|---|---|---|
| Grounding protocol | [grounding.md](grounding.md) | Evidence hierarchy, **status vocabulary (canonical)**, prohibitions, stop-and-ask rules |
| Evidence registers | [evidence.md](evidence.md) | Sources (`S-01`), claims ledger, assumptions, resolved lockfile versions |
| Glossary | [glossary.md](glossary.md) | Canonical terms, roles (`player`, `admin`), and states |
| ADRs | [adr/README.md](adr/README.md) | Decisions made (`ADR-0001..0003`), options rejected, why |

### 2.4 Repository documents

| Document | File | Purpose |
|---|---|---|
| Agent rules | [../AGENTS.md](../AGENTS.md) | Operating rules and task router for AI agents and developers |

---

## 3. Who Owns Which Fact

Write each fact once, in its owner. Everywhere else, link. Duplicates drift.

| Fact | Owner | Other docs |
|---|---|---|
| Product identity, scope, lifecycle, open decisions | [`foundation.md`](foundation.md) | Link only |
| Evidence rules, status marks (`✅ 🟡 ⬜ ❓ ❌`), conflicts | [`grounding.md`](grounding.md) | Never redefine |
| Sources, claims ledger, assumptions, resolved dependency pins | [`evidence.md`](evidence.md) | Other docs cite IDs |
| Canonical terms, roles, state/enum definitions | [`glossary.md`](glossary.md) | BRD/PRD/Data model reference |
| Business outcomes & risks | [`brd.md`](brd.md) | — |
| Roadmap & user stories | [`prd.md`](prd.md) | Flow shows status; Sprint cites US IDs |
| Selected architecture and dependency rationale | [`sad.md`](sad.md) §2 | [`evidence.md`](evidence.md) §5 owns resolved versions |
| Feature implementation and verification status | [`flow.md`](flow.md) | Everyone else links |
| Schema | `supabase/migrations/` (when created), derived in [`data-model.md`](data-model.md) | SDD links |
| Endpoints / Server Actions | Code (`src/app/`), indexed in [`api.md`](api.md) | SDD links |
| Threats, security controls, access policy, review status | [`security.md`](security.md) | SDD/Data model/API link |
| Code economy and implementation patterns | [`AGENTS.md`](../AGENTS.md) (§4, §6) & [`build.md`](build.md) §9 | DSD §4.1 defers |
| Design rules, surface modes, anti-slop craft | [`dsd.md`](dsd.md) | `src/app/globals.css` & `layout.tsx` own implemented tokens |
| Validation strategy, test results, traceability | [`test-plan.md`](test-plan.md) | `build.md` holds commands; `ops.md` holds ops exercises |

---

## 4. Conventions

- **Status marks, evidence labels:** defined only in [`grounding.md`](grounding.md) §3 (`✅ 🟡 ⬜ ❓ ❌` and inline `N/A — [REASON]`).
- **IDs:** `BR-NN` business requirement, `US-NN` product story, `BOOM-NN` sprint story, `T-NNN` test, `API-NN` operation, `TH-NN` threat, `SEC-NN` security control, `RB-NN` runbook, `ADR-NNNN`, `S-/C-/A-/R-NN` evidence rows.
- **Section references:** `file.md §N`.

---

## 5. Platform Summary — As Built

```text
Answer It! or BOOM! — Cadet onboarding quiz race (Phase 1 baseline scaffold)

  CLIENT:    Next.js 16 App Router (TypeScript + Tailwind CSS v4), responsive web
             (/) starter entry shell built ✅ · (/lobby, /play, /result, /scoreboard, /admin/*) ⬜
  BACKEND:   Next.js Server Actions / Route Handlers (⬜ planned)
  DATA:      Supabase Postgres + Realtime (⬜ schema/migrations not yet created)
  EXTERNAL:  Vercel hosting ............ ⬜ Not deployed
```

**Implemented (✅):** Next.js scaffold, `GAME_CONFIG` (`src/config/game-config.ts`), Cartoon Bomb CSS tokens & `Fredoka`/`Nunito` typography (`src/app/globals.css`, `layout.tsx`), starter `/` shell (`src/app/page.tsx`). **Planned (⬜):** Supabase schema/RLS/seed, game engine, Realtime lobby/scoreboard, gameplay routes, admin panel, Vitest suite.

---

## 6. Change Log

| Date | Change | Documents |
|---|---|---|
| 2026-11-17 | Initialized Answer It! or BOOM! documentation suite from `foundation-md` and product brief (`S-01`). | All |

---

## 7. Health Check

- [x] `foundation.md` is named as source of truth in every suite document
- [x] Lifecycle stage (`Build`) and inactive modules set in `foundation.md` §0
- [x] Every feature claim carries a status mark from `grounding.md`
- [x] No fact is written in two places (§3)
- [x] Inactive modules pruned with all incoming links removed
