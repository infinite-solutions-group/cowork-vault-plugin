---
name: conflict-scanner
description: Compares what the user asked for recently against the standing rules in /memory/preferences.md and /memory/decisions.md, and flags contradictions — a request that reverses a stated preference or a past decision — to /inbox/handoff/conflicts.md. It surfaces conflicts for the user to resolve; it never edits memory or picks a side. Use when the user says "check for conflicts", "does this contradict anything", "scan my decisions", or on a schedule.
---

# conflict-scanner

Catches the quiet contradictions — when today's instruction cuts against a rule
the user set last month and everyone's forgotten. It flags the tension and lets
the user decide; it never silently "resolves" by overwriting memory.

## Authority

L1 — read-only against memory and the recent session; its only write is a
findings file at `/inbox/handoff/conflicts.md`. It **flags**; it does not
reconcile. Changing a preference or decision to resolve a conflict is the user's
call, carried out by `preferences-updater` after they choose — never by this
skill.

## When to use

- "check for conflicts" / "does this contradict anything"
- "scan my decisions" / "is this consistent with what I said before"
- Right after the user gives an instruction that feels like a reversal.
- A scheduled run (Cowork `/schedule`, e.g. hourly or daily).

## Memory reads

- `/memory/preferences.md` — the standing preferences a new instruction might contradict.
- `/memory/decisions.md` — past decisions a new instruction might reverse.
- `/memory/projects.md` — for project-scoped rules ("on the Acme project, always…") so a conflict is judged in the right scope.

If a file is missing, scan against what exists and note the gap.

## Steps

1. **Collect recent instructions** — the standing-rule-shaped things the user
   has said this session or since the last scan ("always…", "from now on…",
   "do X", "never Y"). Ignore one-off task details; conflicts are between
   _rules_, not between individual tasks.

2. **Diff against memory.** For each recent instruction, check whether it
   contradicts a line in `/memory/preferences.md` or `/memory/decisions.md`.
   A contradiction is a direct reversal ("use Vitest" vs stored "use Jest") or
   an incompatible overlap in the same scope.

3. **Classify each conflict:**
   - **Reversal** — the new instruction is the opposite of a stored rule.
   - **Narrowing/exception** — the new instruction is a scoped exception, not a
     full reversal (flag, but mark it as likely intentional).
   - **Stale** — the stored rule references something no longer true.

4. **Write findings** to `<vault>/inbox/handoff/conflicts.md`, replacing the
   prior scan's contents (one current conflicts list, not an ever-growing log).
   For each conflict show: the recent instruction, the stored rule it hits, the
   file + the exact stored line, and the classification.

5. **Surface it** and, for each, offer the resolution paths: keep the old rule,
   update it (via `preferences-updater`), or record it as a scoped exception.
   Do not choose for the user.

## Memory writes

- `<vault>/inbox/handoff/conflicts.md` (overwrite — the current conflict list; a findings file, not memory)
- `<vault>/memory/daily.md` (L1 — append a one-line "Conflict scan: N flagged" entry when `CONFIG.md [daily-log] enabled = true`)

Never edits `/memory/preferences.md`, `/memory/decisions.md`, or any other
memory file — resolving a conflict is the user's decision, applied by
`preferences-updater`.

## Failure modes

- **No stored rules to check against:** report "nothing to compare — memory is
  empty" rather than reporting zero conflicts as a clean bill of health.
- **Apparent conflict is actually a scoped exception:** flag it but label it
  likely-intentional, so the user isn't nagged about deliberate exceptions.
- **Ambiguous whether two rules truly conflict:** flag it as "possible" with the
  reasoning, and let the user judge; don't suppress it and don't overstate it.

## What this skill never does

- Edit, delete, or reconcile any `/memory/*` rule.
- Decide which side of a conflict wins.
- Apply L2 / L3 authority.

## Voice

Do the internal checks silently; report only what they mean for the user. They
did not ask about `CONFIG.md` line numbers, grant lookups, which tools you
loaded, or what you are about to do next — those are plumbing.

- Don't: "I have the skill loaded. The grant is in place (CONFIG.md line 39 plus
  the risk-acknowledgment on line 60), so this runs live, not dry-run. Let me
  load the tools and check the folder state."
- Do: go and do it, then report what changed.

Mention internals only when they change what the user gets — running in dry-run
because a grant is missing, or a document left unfiled because it matched no
deal. Then say it in their terms: "I need your OK before I can update Asana",
not "no `[authority-grants]` entry".

## Reporting block

```
Conflict scan — <date>
Rules checked: <N>   Conflicts flagged: <N>

- [<reversal | exception | stale>] "<recent instruction>"
    vs /memory/<file>: "<stored line>"
    → keep old · update (preferences-updater) · record as scoped exception
- ...

Written to /inbox/handoff/conflicts.md. None of these are resolved yet — your call.
```

If nothing conflicts, the report is one line: "Scanned <N> rules — no conflicts
with recent instructions."
