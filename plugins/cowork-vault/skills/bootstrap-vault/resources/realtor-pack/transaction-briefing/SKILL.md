---
name: transaction-briefing
description: Produces a one-page briefing for a real-estate transaction from its Asana project — what's overdue, what's due today, what's coming in the next few days, and the contingency/closing deadlines that matter. Reads the deal registry in /memory/transactions.md, pulls tasks from Asana, and writes the brief to /outbox/drafts/ without changing anything. Use when the user says "transaction briefing", "brief me on <address>", "what's due on my listing", "deal status", "where are we on <client>", or runs it on a schedule.
---

# transaction-briefing

A single-page status brief for one listing/escrow: what slipped, what's due
today, what's coming, and the deadlines that can't move (inspection, appraisal,
loan contingencies, close). Reads the deal's Asana project and the vault's deal
registry; writes one file; changes nothing.

## Authority

L1 — read-only against Asana (list/read tasks and due dates) plus a single
written output: a briefing document in `<vault>/outbox/drafts/`. This skill
**never** completes, edits, comments on, or creates Asana tasks, **never** sends
email, and **never** changes a due date. Reading the project to summarize it is
L1 (no external state changes). The user asked for a briefing — that IS the
permission; producing it needs no further confirmation.

## When to use

- "transaction briefing" / "brief me on <address or client>"
- "what's due on my listing" / "deal status" / "where are we on <client>"
- "what's coming up this week on <address>"
- A scheduled run (Cowork `/schedule`, e.g. daily 7:00 AM) — same behavior, no
  user present. Brief every active transaction in the registry.

If the user names one transaction, brief just that one. If they don't, brief
each active deal in `/memory/transactions.md`.

## Memory reads

Load whichever of these exist before writing the brief:

- `/memory/transactions.md` — the deal registry. Source of truth for each active
  transaction: property address, client name, the **agent-cc** address, the
  **Asana project id**, key anchor dates (acceptance, close), and the milestone
  map. Match the user's request to a `## <Address>` block.
- `/memory/preferences.md` — briefing length/tone and how the user likes to be
  addressed. Match it.
- `/memory/people.md` — context for the client and the transaction parties
  (escrow, lender, buyer's agent) mentioned in the brief.

If `/memory/transactions.md` is missing or has no matching deal, don't invent
one — tell the user to register the transaction first (address + Asana project
id) and stop.

## Required connector use (Asana)

**Check your current toolbelt before asking the user for anything.** Cowork
exposes installed connectors as tools in your session.

1. **Asana.** Look for a tool whose name contains "asana". If present, use the
   registry's Asana **project id** to list the project's tasks with their
   `name`, `due_on`, `completed`, and section. Do not modify anything.
2. **If no Asana tool is present**, don't block: build the brief from the
   registry's known dates and note in the brief that live task data was
   unavailable ("No Asana connected — showing registry milestones only").

Never assume "no connector" without checking your tools first.

## Steps

1. **Load memory context.** Read the `## Memory reads` files that exist and
   resolve which transaction(s) to brief.

2. **Pull the project's tasks.** Via the Asana connector, for each transaction's
   project id. Keep incomplete tasks; note their `due_on` and section.

3. **Bucket by urgency** against today's date:
   - **Overdue** — incomplete, `due_on` before today.
   - **Due today** — `due_on` is today.
   - **Next 5 days** — `due_on` within the coming five days.
   - **Contingency & closing deadlines** — the anchor dates from the registry
     and any task named like a contingency/closing milestone, called out
     separately because they can't slip.

4. **Cross-reference the registry.** Pull the property snapshot (address, client,
   list/sale price, acceptance/close dates) so the brief opens with the deal at a
   glance.

5. **Compose the one-page brief.** Single screen. Use this shape (omit a section
   if empty):

   ```markdown
   ---
   type: transaction-briefing
   transaction: <address>
   date: <YYYY-MM-DD>
   generated: <YYYY-MM-DD HH:MM>
   ---

   # <Address> — <Weekday, Month D> (<N> days to close)

   Client: <name> · <list→sale price> · Accepted <date> · Close <date>

   ## Overdue — clear today

   - <task> — due <date>

   ## Due today

   - <task>

   ## Next 5 days

   - <date> — <task>

   ## Deadlines that can't move

   - <date> — <inspection / appraisal / loan contingency / final walk / CLOSE>
   ```

6. **Write the brief.** Save to
   `<vault>/outbox/drafts/transaction-brief-<address-slug>-<YYYY-MM-DD>.md`.
   One brief per transaction per day; overwrite today's if it exists.

7. **Surface it.** Show the file path and the full brief body verbatim in a
   fenced block. Then point the user at scheduling.

## Scheduling (make it recurring)

After the first brief, tell the user verbatim how to automate it:

> To get this every morning automatically, type **`/schedule`** in this Cowork
> task and pick **daily** (e.g. 7:00 AM). Cowork re-runs this prompt on that
> cadence — it just needs your machine awake and Claude Desktop open.

Do not try to create the schedule yourself — only the user can confirm
`/schedule` in Cowork.

## Memory writes

- `<vault>/outbox/drafts/transaction-brief-<slug>-<YYYY-MM-DD>.md` (always — a
  draft; no approval needed)
- `<vault>/memory/daily.md` (L1 — append a one-line "Briefed <address>" entry
  when `CONFIG.md [daily-log] enabled = true`)

No writes to `/memory/transactions.md`, `people.md`, or `preferences.md` — this
skill only reads those.

## Failure modes

- **No registry / no matching deal:** tell the user to register the transaction
  (address + Asana project id) first; don't guess a project.
- **No Asana connector:** brief from registry dates and say live task data was
  unavailable.
- **Empty project (no incomplete tasks):** say so plainly; a two-line brief is
  correct.
- **A task's date looks stale or wrong** (e.g. long past but incomplete): show it
  under Overdue; don't silently drop it.

## What this skill never does

- Complete, edit, comment on, create, or reschedule any Asana task.
- Send, draft, or forward email.
- Apply L2 / L3 authority for any reason.
- Write to any `/memory/*` file other than appending `daily.md`.

## Reporting block

```
Transaction brief: <vault>/outbox/drafts/transaction-brief-<slug>-<YYYY-MM-DD>.md
Deal: <address> · Close <date> (<N> days)
Asana: <connected: yes/no>   Overdue: <N>   Due today: <N>   Next 5d: <N>

<full brief body, verbatim>

To get this every morning automatically: type /schedule in this task and pick daily.
```

The full brief goes in the report — not a summary.
