---
name: preferences-updater
description: Captures durable preferences, corrections, and new facts from the current session and proposes memory updates — never edits memory silently. Reads what the user corrected or stated as a standing rule, classifies it into the right memory file, and writes a proposal to /outbox/proposals/ for the user to approve before anything lands in /memory/. Use when the user says "remember that", "note that", "going forward", "update your memory", "what did you learn", or wraps up a session ("that's all", "save what you learned").
---

# preferences-updater

Closes the memory loop. When the user corrects you or states a standing rule
("call me Mike, not Michael"; "always CC my assistant"; "we decided to go with
Vitest"), this skill turns that into a durable memory — but only ever as a
**proposal the user approves**, never a silent edit. Memory is the user's; this
skill drafts changes to it and asks.

## Authority

L1 — this skill **proposes** memory changes; it does not apply them on its own.
Per the vault's write contract, any write to `/memory/*` routes through
`/outbox/proposals/<task-id>-<file>.md` first, and the user approves before the
real write happens. Writing the proposal needs no permission (a proposal is
inert). **Applying** a proposal to `/memory/preferences.md` (or `people.md`,
`projects.md`, `decisions.md`) happens **only after the user explicitly says
yes** — then this skill makes the edit it already showed them, verbatim.

Never edit a `/memory/*` file without a shown-and-approved proposal. Never
delete existing memory as part of an update unless the user approved that exact
removal.

## When to use

- "remember that …" / "note that …" / "for future reference …"
- "going forward …" / "from now on …" / "always / never …"
- "actually, I prefer …" / "no — do it this way instead" (a correction)
- "update your memory" / "what did you learn today"
- Session wrap-up: "that's all", "save what you learned", "wrap up"
- A scheduled run (Cowork `/schedule`) — e.g. a daily "review corrections and
  propose memory updates" task. Same behavior, no user present: it still writes
  proposals to `/outbox/proposals/` and does **not** self-apply.

## Memory reads

Read every memory file that exists before proposing anything — you need them to
place each candidate correctly and to avoid proposing something already there:

- `/memory/preferences.md` — standing preferences (tone, sign-off, working style, "always/never" rules, what to call the user).
- `/memory/people.md` — facts about specific people, kept as `## <Name>` blocks.
- `/memory/projects.md` — active projects, their status and next steps.
- `/memory/decisions.md` — decisions the user has made and wants carried forward.

Missing files are fine — propose creating the relevant one if a candidate needs it.

## What counts as a candidate memory

Be conservative — memory is durable and user-owned. Capture only things stated
as **standing** truth, not one-off task details.

**Capture:**

- Explicit instructions to remember ("remember that…", "going forward…").
- Corrections that change a default ("I prefer X"; "don't do Y anymore").
- New durable facts about a person, project, or decision stated as ongoing.

**Do not capture:**

- One-off, task-specific details ("send this one to Bob by 5pm").
- Ephemeral context that won't matter next session.
- Anything the user framed as a maybe, a vent, or thinking-out-loud.
- Inferred preferences the user never actually stated. If you're guessing, don't.

## Steps

1. **Scan the session for candidates.** Collect explicit "remember"
   statements, corrections, and durable new facts (see the section above).
   If there are none, say so and stop — do not manufacture memories.

2. **Classify each candidate** into exactly one target file:
   preferences / people / projects / decisions. A fact about a named person →
   `people.md` under their `## <Name>` block. A standing how-I-work rule →
   `preferences.md`. A project status/next-step → `projects.md`. A choice made
   → `decisions.md`.

3. **Dedupe against existing memory.** Read the target file. If the memory is
   already captured, drop it. If it **contradicts** existing memory (the user
   changed their mind), propose an **edit** (show old → new), not a duplicate.

4. **Write the proposal.** For each affected memory file, write a proposal to
   `<vault>/outbox/proposals/<task-id>-<file>.md` (e.g.
   `pref-2026-07-01-preferences.md`). The proposal shows the exact change as a
   before/after so the user can approve without ambiguity:

   ```markdown
   ---
   type: memory-update-proposal
   target: /memory/preferences.md
   created: <YYYY-MM-DD HH:MM>
   ---

   ## Proposed change

   **Add** under "Working style":

   - Always CC <assistant> on client-facing email.

   **Because:** in this session you said "from now on loop in my assistant on
   anything that goes to a client."
   ```

   For an edit that replaces existing text, show both sides:

   ```markdown
   **Change** in "How to address me":

   - was: `Prefers "Michael"`
   - now: `Prefers "Mike"`
   ```

5. **Surface the proposal and ask.** Show the user each proposed change
   (grouped by target file) and ask, per change or as a batch: **"Apply these
   to your memory?"** Let them approve all, some, or none.

6. **Apply only what's approved.** For each approved change, make exactly the
   edit shown to the target `/memory/*` file — append under the right heading,
   or replace the exact text for an edit. Match the file's existing structure
   (if it uses `## <topic>` / `## <Name>` blocks, extend the right block; if
   bullets, add a bullet). Leave declined proposals in `/outbox/proposals/` so
   the user can revisit them later; do not delete them.

7. **Confirm what changed.** Tell the user which files were updated and which
   proposals were left pending.

## Memory writes

- `<vault>/outbox/proposals/<task-id>-<file>.md` (always — a proposal; inert, no approval needed)
- `<vault>/memory/preferences.md` — **only on explicit approval** (likewise `people.md`, `projects.md`, `decisions.md`)
- `<vault>/memory/daily.md` (L1 — append a one-line "Proposed N memory updates, M applied" entry when `CONFIG.md [daily-log] enabled = true`)

## Failure modes

- **No real candidates in the session:** say "nothing new worth remembering"
  and stop. A memory writer that invents preferences is worse than none.
- **Candidate is ambiguous** (which person? which project?): ask before
  writing the proposal; don't guess a target.
- **Candidate contradicts strongly-held existing memory:** flag the conflict
  explicitly in the proposal ("this reverses what's on file"), so the user is
  making the change deliberately, not by accident.
- **User approves some but not all:** apply exactly the approved subset; never
  apply a declined change "for consistency."

## What this skill never does

- Edit any `/memory/*` file without a shown-and-approved proposal.
- Delete or overwrite existing memory unless the user approved that exact change.
- Capture inferred or one-off details as durable memory.
- Apply L2 / L3 authority for any reason.

## Reporting block

After proposing (and applying any approved changes):

```
Session memory review
Candidates found: <N>   Proposed: <N>   Applied: <N>   Declined/pending: <N>

Proposed changes:
- <target file> — <one-line summary of the change> — [applied | pending]
- ...

Proposals saved to: <vault>/outbox/proposals/
Applied to: <list of /memory/* files updated, or "none — awaiting your approval">

Apply the pending ones?
```

If nothing was worth capturing, the whole report is one line: "Reviewed the
session — nothing new worth remembering."
