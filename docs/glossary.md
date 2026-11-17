# Glossary: Answer It! or BOOM!

**Project:** Answer It! or BOOM! — Real-time cadet onboarding icebreaker quiz game
**Date:** 2026-11-17
**Version:** 1.0
**Owner:** Project Owner / Engineering
**Status:** Active
**Source of truth:** [`foundation.md`](foundation.md)
**Related:** [Grounding](grounding.md) · [Data model](data-model.md) · [BRD](brd.md) · [PRD](prd.md)

---

> **Rule.** One term, one meaning. Use the **canonical** term in code identifiers, UI copy, API fields, and documents.

---

## 1. Domain Terms

| Term (canonical) | Definition | Do **not** use | Defined in | Code identifier |
|---|---|---|---|---|
| **Session** | Single facilitator-hosted game instance (`waiting` → `countdown` → `running` → `finished`) | Room, Lobby-instance | `foundation.md` §3 | `Session` (`sessions`) |
| **Fuse / Deadline** | Server-computed `timestamptz` (`started_at + base_time + correct_count * bonus_time`) when a player's bomb explodes | Client countdown | `sdd.md` §3 | `deadline` |
| **Streak** | Consecutive correct answers by a player in the current run; triggers one-time bonus at 3, 5, 10 | Combo | `foundation.md` §7.2 | `streak`, `best_streak` |
| **BOOM** | End-of-run explosion state when a player's `deadline` expires or admin ends game early | Game Over (use BOOM) | `dsd.md` §4 | `status = 'exploded'` |
| **Beat the bomb** | Completion state when a player exhausts all active questions without exploding | — | `prd.md` §4 | `status = 'completed'` |

## 2. Roles

One name per role across docs, code, database, and UI.

| Role (canonical) | Who this is | Code / DB value | Surface | Status |
|---|---|---|---|---|
| **Player (Cadet)** | Onboarding software developer cadet joining via name | `player` | `/`, `/lobby`, `/play`, `/result`, `/scoreboard` | ⬜ (only `/` shell built) |
| **Admin (Facilitator)** | Single host controlling the session, lobby, and questions | `admin` | `/admin`, `/admin/dashboard`, `/admin/questions` | ⬜ |

## 3. States and Statuses

Every enum or state machine value, with its meaning. Legal transitions live in [`data-model.md`](data-model.md) §4. Implementation status marks (`✅ 🟡 ⬜ ❓ ❌`) live in [`grounding.md`](grounding.md) §3.

| Entity | State | Meaning | Terminal? | UI label |
|---|---|---|:---:|---|
| `sessions` | `waiting` | Lobby open; cadets can join | No | Waiting for host |
| `sessions` | `countdown` | Host clicked Start; 3-2-1 synchronized countdown | No | Starting soon |
| `sessions` | `running` | Active race; late joins blocked | No | Live |
| `sessions` | `finished` | Game ended by host or all players finished; scores final | Yes | Finished |
| `players` | `waiting` | Joined lobby before game start | No | In lobby |
| `players` | `playing` | Active bomb run in progress | No | Playing |
| `players` | `exploded` | Fuse reached zero or ended early by host | Yes | BOOM! |
| `players` | `completed` | Answered all active questions before fuse expired | Yes | Beat the bomb! |

## 4. Acronyms and Abbreviations

| Acronym | Expansion | Notes |
|---|---|---|
| BRD / BPD / PRD / SAD / SDD / DSD | Business Requirements / Business Product / Product Requirements / Software Architecture / System Design / Design System Document | Suite documents — see [`index.md`](index.md) |
| ADR | Architecture and Decision Record | See [`adr/README.md`](adr/README.md) |
| RLS | Row Level Security | Postgres access policy enforced in Supabase |

## 5. Ambiguous or Banned Terms

| Word | Problem | Use instead |
|---|---|---|
| "live" / "production" | Implies deployed hosting with real cohorts | State exact environment (`local`, `Vercel preview`, `production`) |
| "secure" / "cheat-proof" | Overstates anti-cheat (googling answers is explicitly accepted) | Describe exact server-side controls (`correct_index` hidden, server `deadline`) |
| "done" | Ambiguous | Use canonical marks in [`grounding.md`](grounding.md) §3 |

## Self-Check

- [x] Every planned DB enum value appears in §3
- [x] Canonical roles match `foundation.md` and `security.md`
- [x] No banned synonyms appear in `src/config/game-config.ts` or starter UI
