# Design System Document (DSD): Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [BRD](brd.md) · [PRD](prd.md) · [SAD](sad.md) · [SDD](sdd.md) · [Flow](flow.md) · [Build](build.md) · [Glossary](glossary.md)

---

> **Source-of-truth rule.** [`foundation.md`](foundation.md) is canonical.
>
> **Token authority.** `src/app/globals.css` and `src/app/layout.tsx` are the implementation authority.
>
> **Appearance scope.** Supports **Dark Cartoon Bomb** mode (`#14161F`) only. Light mode is `N/A — dark projector/mobile game theme`.

---

## 1. Design Philosophy & Surface Brief

**Surface brief:**

| Surface | Mode | Audience & task | Primary action | Visual authority & devices | Success condition |
|---|---|---|---|---|---|
| Player Game (`/`, `/lobby`, `/play`, `/result`) | `Experience` | Onboarding cadets racing the fuse | Join / Pick answer fast | `globals.css` · Mobile-first (`>= 360px`) & laptop | Zero typo stress, instant visual/audio feedback, clear fuse urgency |
| Projector (`/scoreboard`) | `Read` | Whole cohort watching live rankings | Watch survival standings | `globals.css` · Large display (`>= 1280px`) | High contrast & `Fredoka` numerals legible across a room |
| Facilitator (`/admin/**`) | `Operate` | Single host running session | Start / Lock / End / Reset | `globals.css` · Laptop/tablet | Zero accidental clicks; immediate lobby control |

1. **Legibility before decoration.** High-contrast `#F5F7FA` Snow text on `#14161F` / `#1F2330` dark surfaces.
2. **Fuse Orange (`#FF7A1A`) means primary action; Spark Yellow (`#FFC933`) and Boom Red (`#FF3B4E`) signal fuse urgency.**
3. **One primary action per screen.** Start Game / End Game Early / Answer selection are unambiguous.
4. **State is visible.** Every surface covers loading, empty, error, locked-lobby, countdown, active, BOOM, beat-the-bomb, and disconnected states.
5. **Truthful content only.** Live counts and scores reflect real session data (`S-01`).

### 1.1 Craft Floor & Anti-Slop Rules

Follows **`impeccable`** craft rules + explicit project rules from `S-01`:
- **Zero monospace fonts anywhere** (`S-01` §9.3): Never load or fall back to `monospace`, `Geist_Mono`, `Courier`, `Fira Code`, etc. Use `tabular-nums` on `Fredoka` / `Nunito` instead.
- **No AI-slop clutter:** No filler/pill badges, no redundant eyebrows/kickers, no random mid-headline italics, no `FIG//` markers, no gradients, no glassmorphism/backdrop-blur cards, and **no emoji as UI icons** (use authored SVGs for the bomb, fuse spark, sound toggle, and status icons).
- **Documented exception (`S-01` §9.4):** Subtle accent glow is permitted *only* on the active bomb spark/fuse urgency indicator and answer-feedback flash—never ambient purple/AI halos on static cards.
- **Concentric radii:** `24px` (`rounded-3xl`) outer cards → `16px` (`rounded-2xl`) inner inputs/buttons (`24px - 8px`+ padding).

---

## 2. Design Tokens (`src/app/globals.css`)

### 2.1 Brand & Surface Colors

| Role | Token (`globals.css`) | Hex | Usage |
|---|---|---|---|
| Background primary | `--color-bg-primary` | `#14161F` | Page canvas (Midnight Charcoal) |
| Surface / cards | `--color-surface` | `#1F2330` | Question/lobby/login cards (Deep Slate) |
| Surface elevated | `--color-surface-elevated` | `#2A2F40` | Inputs, answer options, hover (Slate Light) |
| Primary accent | `--color-accent-orange` | `#FF7A1A` | Primary CTA, fuse spark (Fuse Orange — pair with `#14161F` text for ≥4.5:1 contrast) |
| Secondary accent | `--color-accent-yellow` | `#FFC933` | Timer `≤ 30s`, streaks (Spark Yellow) |
| Danger / timer low | `--color-danger-red` | `#FF3B4E` | Timer `≤ 10s`, wrong flash, BOOM, destructive CTA (Boom Red) |
| Success / correct | `--color-success-green` | `#2EE59D` | Correct flash, `+30s` feedback (Defuse Green) |
| Info / links | `--color-info-blue` | `#4DB8FF` | Scoreboard/secondary links (Ice Blue) |
| Text primary | `--color-text-primary` | `#F5F7FA` | Headings, questions, normal timer (Snow) |
| Text muted | `--color-text-muted` | `#9AA3B5` | Secondary captions (Smoke) |
| Border | `--color-border-ash` | `#363C50` | Card/input 1px borders (Ash) |

### 2.4 Typography (`src/app/layout.tsx`)

| Role | Face | Weights | Fallback |
|---|---|---|---|
| Headings, timer, score, buttons | **Fredoka** (`--font-display`) | `500, 600, 700` | `ui-rounded, system-ui, sans-serif` |
| Body, questions, answers, UI text | **Nunito** (`--font-sans`) | `400, 600, 700` | `system-ui, sans-serif` |

- Timer scale: `4rem → 6rem` (`Fredoka 700`, `.tabular-nums`).
- Balanced headline wrapping (`text-wrap: balance` in `globals.css`).

---

## 3. Appearance Modes

Dark Cartoon Bomb mode (`#14161F`) is the sole supported appearance (`✅` configured in `src/app/globals.css`). Light mode is `N/A`.

---

## 4. Components

- **Structure (`AGENTS.md` §4):** Route shells in `src/app/**/page.tsx`; reusable UI in `src/components/`.
- **Buttons:** Primary `#FF7A1A` fill with `#14161F` text (7.4:1 contrast); Destructive `#FF3B4E` fill with `#14161F` text; minimum tap height `48px` (`min-h-12`).
- **Inputs:** Validation message below field (`aria-describedby`); never color-only errors.
- **Status representation:** Pair label + authored SVG icon/shape (`Waiting`, `Playing`, `BOOM!`, `Beat the bomb!`).

---

## 5. Navigation

| Shell | Pattern | Routes |
|---|---|---|
| Player | Linear session flow | `/` → `/lobby` → `/play` → `/result` ↔ `/scoreboard` |
| Admin | Guarded dashboard | `/admin` → `/admin/dashboard` ↔ `/admin/questions` |

---

## 6. Motion & Feedback

`Framer Motion` (`14.14.0` ✅) + CSS transitions:
- Bomb fuse shrinks proportionally to remaining time; `+30s` floating indicator on correct answer; subtle shake on wrong answer; BOOM/victory reveal on `/result`.
- `prefers-reduced-motion` rule active in `src/app/globals.css` and `useReducedMotion()` (`✅`).

---

## 7. Accessibility & Rendered Review

Target: **[WCAG 2.2](https://www.w3.org/TR/2024/REC-WCAG22-20241212/) Level AA** + `>= 48px` mobile tap targets (`S-01` §9.4).
**Verified:** `prefers-reduced-motion`, focus ring (`:focus-visible` Spark Yellow), zero monospace fonts (`layout.tsx`, `globals.css`), `SoundToggle` (`min-h-12`), Framer Motion (`useReducedMotion()`), and Playwright DOM + WCAG AA contrast checks (`2026-11-17`: `minContrast` normal `5.1:1–6.17:1`, large `h1` `4.46:1 >= 3.0:1`, `0` mono, `0` blur, `>= 48px` controls, `tabular-nums`, `0` overflow).
**Not yet verified:** Full screen-reader assistive-tech walkthrough and post-deploy Vercel production smoke check (`BOOM-06` deploy).

---

## Self-Check

- [x] Zero monospace fonts in `layout.tsx` and `globals.css`
- [x] Dark text `#14161F` paired with `#FF7A1A` primary CTA for WCAG AA contrast
- [x] All 11 `S-01` palette hexes traced to `src/app/globals.css`
