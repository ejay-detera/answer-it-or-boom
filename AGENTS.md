# Answer It! or BOOM! — Agent Rules

## 1. Source of Truth and Reference Order

**`docs/foundation.md` is the canonical source of truth for this project.** Confirm any product fact there first. If another document or this file conflicts with it, resolve the conflict in `docs/foundation.md`, then propagate.

**`docs/grounding.md` is the anti-hallucination protocol.** Every agent must follow its evidence hierarchy, canonical status marks (`✅ 🟡 ⬜ ❓ ❌`), claim rules, and stop-and-ask triggers. Never invent facts, numbers, dates, partners, or capabilities.

**`docs/` is the first place to look for context** — before reading code and before asking. Use this **Task-Based Context Router** instead of reading all docs linearly:

| Task type | Load these documents |
|---|---|
| **Every task (baseline)** | `docs/foundation.md` (§0 + TL;DR), `docs/grounding.md` (§3, §4), `docs/evidence.md` (§4–§5 if using dependencies/claims) |
| **UI / Design / Frontend** | + `docs/dsd.md`, `docs/flow.md`, `docs/glossary.md` |
| **API / Service / Integration** | + `docs/api.md`, `docs/sdd.md`, `docs/data-model.md`, `docs/security.md` (§5) |
| **Database / Schema / Migration** | + `docs/data-model.md`, `docs/build.md` (§4, §9), `docs/security.md` (§5–§7) |
| **Security / Auth / Secrets** | + `docs/security.md`, `docs/ops.md` (§6–§7), `docs/api.md` |
| **Sprint / Planning / QA** | + `docs/prd.md`, `docs/sprint.md`, `docs/test-plan.md`, `docs/flow.md` |
| **Decisions / Architecture** | + `docs/sad.md`, `docs/adr/README.md` |

`docs/index.md` maps the whole suite and defines single-owner fact boundaries.

---

## 2. Mandatory Universal Agent Skills

Every agent operating on this codebase must adhere to these five universal execution skills:

1. **`caveman`:** Terse, technical, answer-first chat. Preserve every file path, symbol, line number, command, error, and code snippet verbatim.
2. **`ponytail`:** Solve tasks with the smallest complete working diff. Reuse `src/config/`, `src/lib/`, and `src/components/` before adding code. Never cut security, validation, error handling, accessibility, or non-trivial tests. Always end completions with 1-2 lines on what was skipped/untested and known risks.
3. **`impeccable`:** Mandatory for every UI screen, component, styling, layout, or design token task. Follow tokens and anti-slop rules in `docs/dsd.md` §1.1 (no arbitrary hex colors, filler/pill badges, redundant labels, random italics, **any monospace font**, `FIG//`, gradients, glassmorphism, or emoji icons). Enforce `tabular-nums`, concentric radii (`inner = outer - padding`), `>= 48px` touch targets, WCAG AA contrast (`#14161F` text on `#FF7A1A` orange buttons), loading states, and useful-feedback motion.
4. **`grill-me`:** Stop and interview the user when requirements, edge cases, acceptance criteria, or `TBD` decisions are ambiguous (`docs/grounding.md` §6).
5. **`tdd`:** Enforce Red-Green-Refactor at agreed public seams (`docs/test-plan.md`). Documentation-only changes use `node scripts/check-docs.mjs --mode=project`. Never mark a feature or story ✅ without actual passing test execution.

**Skill portability fallback:** All five behaviors remain active via the plain rules in this file and `docs/grounding.md` even when external skill files are unavailable.

---

## 3. Active Domain Modules

Inactive modules (`payments-ledger`, `mobile-client`, `ai-component`) are deactivated (`docs/foundation.md` §0) and pruned from `docs/`.

---

## 4. Code & Component Architecture (Engineering Economy)

**Split by cohesion and responsibility, not a blind line quota.** Treat large screens, components, or services (~150+ lines) as a review trigger when separating state ownership, testable game logic, or repeated UI improves clarity.

Rules:
- **Reuse order:** Existing project code → Web/Next.js standard API → installed dependency → smallest justified new implementation (`docs/evidence.md` §5).
- **Next.js App Router boundaries:** Keep route pages (`src/app/**/page.tsx`) thin; move interactive state into `src/components/` and pure/server game logic into `src/lib/` + `src/config/game-config.ts`.
- **Type & error discipline:** Shared contracts live in `src/types/game.ts`. No `any` or unchecked casts. Never swallow exceptions or expose `questions.correct_index` to client components/bundles.
- **Failure & performance discipline:** Never trust client clocks—server computes and validates `deadline`. Avoid `React` render loops for the 60fps countdown; use server clock offset + `requestAnimationFrame` / ref updates.
- **Shortcuts:** Record justified shortcuts with owner, limit, and upgrade trigger (`shortcut:` comment or `docs/build.md` §8).

---

## 5. Design System & Frontend

`src/app/globals.css` and `src/app/layout.tsx` are the token authority. Full specification: `docs/dsd.md`.

- Brand colors: Midnight Charcoal `#14161F` bg, Deep Slate `#1F2330` surface, Fuse Orange `#FF7A1A` primary accent, Spark Yellow `#FFC933` secondary, Boom Red `#FF3B4E` danger, Defuse Green `#2EE59D` success, Snow `#F5F7FA` primary text. Use CSS theme tokens (`bg-surface`, `text-accent-orange`, etc.) — never hardcode arbitrary hex values in components.
- Typography: `Nunito` (`400, 600, 700`) for body/questions/UI; `Fredoka` (`500, 600, 700`) for headings, timer, score, and buttons. **Never use any monospace font anywhere in the app** (`docs/dsd.md` §2.4). Use `.tabular-nums` on timers and scores.
- Appearance: Dark cartoon-bomb mode (`#14161F`) is the only supported appearance mode. Light mode is `N/A` (`docs/dsd.md` §3.2).
- Status presentation: Every status pairs a label with an icon or shape, never color alone (`docs/glossary.md` §3).

---

## 6. Data Layer & Backend

- All mutations (`join`, `answer`, `start`, `end`, `reset`, `kick`, `questions`) execute in Next.js Server Actions / Route Handlers using `SUPABASE_SERVICE_ROLE_KEY`.
- `anon` browser clients subscribe to Supabase Realtime (`sessions`, `players`) under read-only RLS policies. `questions` and `player_answers` are never directly readable by `anon`.
- Server validates `now <= player.deadline` before accepting an answer.

---

## 7. Environments & Secrets

- **Never put secrets in `NEXT_PUBLIC_*` variables**, repository files, logs, or chat.
- `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSCODE` are server-only.
- Hosted Vercel preview/staging deployments are non-production until explicitly marked live in `docs/ops.md`.
- **Irreversible commands** (`supabase db reset`, `git push --force`, dropping tables): ask before running.

---

## 8. Git & Development Workflow (Tiered Plan-First Gate)

- Inspect freely in read-only mode (`git status`, `git log`, `git diff`).
- **Tiered authorization by blast radius:**
  - **Tier 1 (Execute directly):** Read-only inspection, single-file doc/copy edits explicitly requested by the user, and running existing non-destructive checks/tests.
  - **Tier 2 (Plan once per story/task, confirm, then execute):** Multi-file feature/refactor implementation, schema or API contract edits, new dependencies, or architectural changes.
  - **Tier 3 (Hard stop — explicit permission every time):** `git commit`, `git amend`, `git push`, destructive/irreversible commands, env/secret changes, and auth/security-boundary changes.
- Stop and ask (`docs/grounding.md` §6) on blocking ambiguity.

---

## 9. Validation & Quality Gates

Run applicable checks before every completion report:
```bash
npm run lint
npx tsc --noEmit
npm run build
node scripts/check-docs.mjs --mode=project
```

Quality criteria:
- Record exact command, environment, revision/working-tree state, date, exit status, and any `Not run` / `Blocked` checks (`docs/grounding.md` §8).
- Every acceptance criterion in `docs/sprint.md` (including error/denial paths) must pass for a story to be Done.
- Tests use `vitest` (once installed in Phase 3; currently `N/A — Phase 1 scaffold only`). Changing runners requires an ADR (`docs/adr/`).

---

## 10. Keeping Documentation True

- Any change to feature status updates `docs/flow.md` in the same change.
- Any change to a product fact updates `docs/foundation.md` in the same change.
- Any new architectural decision or resolved question from `foundation.md` §14 is recorded in `docs/adr/`.
- Any new claim, number, or dependency is recorded in `docs/evidence.md`.
- Never document an unbuilt capability as working.
