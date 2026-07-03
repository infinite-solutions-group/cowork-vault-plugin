---
name: session-retrospective
description: Scores how well the current session went against a fixed rubric (0–100) and proposes concrete improvements — better skills, memory the vault is missing, workflow tweaks — as a proposal in /outbox/proposals/. Read-only against the session; changes nothing on its own. Use when the user says "how did that go", "retro this session", "score this session", "what could be better", or on a schedule at the end of the day.
---

# session-retrospective

A short, honest debrief. Grades the session against the same rubric every time
so the score means something over time, then proposes specific fixes — never
vague ("communicate better"), always actionable ("add a `people.md` entry for
Dana so drafts stop getting her title wrong").

## Authority

L1 — reads the session and the vault, writes a single retrospective **proposal**
to `/outbox/proposals/`. It proposes improvements; it does not apply them. Any
improvement that touches `/memory/*` is handed to `preferences-updater` (which
runs its own propose-before-apply flow), not written here.

## When to use

- "how did that go" / "retro this session" / "debrief"
- "score this session" / "rate this session"
- "what could be better" / "what should I fix"
- A scheduled end-of-day run (Cowork `/schedule`).

## Memory reads

- `/memory/preferences.md` — to judge whether the session honored the user's stated preferences (and to spot preferences that are missing and cost the session time).
- `/memory/projects.md` — to judge whether work moved the right projects forward.
- `/memory/decisions.md` — to catch places where the session contradicted a prior decision.

Missing files are fine — score what you can and note the gap.

## The rubric (fixed — score each 0–20, sum to 0–100)

1. **Goal fit** — did the work address what the user actually asked for?
2. **Correctness** — was the output right, or did it need rework?
3. **Preference fit** — did it honor `/memory/preferences.md` (tone, format, "always/never" rules)?
4. **Efficiency** — was it direct, or were there wasted round-trips and re-asks?
5. **Memory hygiene** — were durable facts/corrections captured (or flagged for `preferences-updater`)?

Keep scoring consistent run-to-run; the same session should get the same score.

## Steps

1. **Reconstruct the session** — what the user asked for, what was produced,
   where there was friction or rework.

2. **Score each rubric dimension 0–20**, with a one-line justification each.
   Sum to a 0–100 total. Be honest — a flattering retro is useless.

3. **Derive concrete improvements**, each tied to a dimension it would raise:
   - A missing memory the vault should hold → route to `preferences-updater`.
   - A recurring task done manually → suggest authoring a skill (AUTHOR) and/or
     `/schedule`-ing it.
   - A skill that misbehaved → a specific edit to that skill.

4. **Write the proposal** to
   `<vault>/outbox/proposals/retro-<YYYY-MM-DD-HHMM>.md` with the scores,
   justifications, and the improvement list.

5. **Surface it** (see Reporting block). Offer to hand memory-related items to
   `preferences-updater` and skill ideas to AUTHOR.

## Memory writes

- `<vault>/outbox/proposals/retro-<YYYY-MM-DD-HHMM>.md` (always — a proposal; no approval needed to write it)
- `<vault>/memory/daily.md` (L1 — append a one-line "Session retro: <score>/100" entry when `CONFIG.md [daily-log] enabled = true`)

No direct writes to `/memory/preferences.md` or other memory files — those go
through `preferences-updater`.

## Failure modes

- **Session too short to judge** (a single trivial exchange): say so and skip
  the full rubric rather than manufacturing a score.
- **Improvement would need L2/L3** (e.g. "auto-send the digest"): propose it but
  flag the authority requirement; never quietly assume the grant.
- **Score is low:** report it plainly with the specific causes. The point is to
  improve, not to reassure.

## What this skill never does

- Apply any improvement itself, or edit `/memory/*` directly.
- Inflate the score to be nice.
- Apply L2 / L3 authority.

## Reporting block

```
Session retro — <date>
Score: <total>/100
  Goal fit        <n>/20 — <one line>
  Correctness     <n>/20 — <one line>
  Preference fit  <n>/20 — <one line>
  Efficiency      <n>/20 — <one line>
  Memory hygiene  <n>/20 — <one line>

Top improvements:
1. <improvement> → raises <dimension> [route: preferences-updater | AUTHOR | edit <skill>]
2. ...

Proposal saved: <vault>/outbox/proposals/retro-<date-time>.md
Want me to hand the memory items to preferences-updater?
```
