---
name: morning-briefing
description: Produces a one-page morning briefing from the user's calendar, recent inbound mail, and vault memory — today's schedule, what needs attention, meeting prep, and top priorities. Writes it to /outbox/drafts/ and never sends or changes anything. Use when the user says "morning briefing", "what's on my plate", "brief me", "what's my day look like", "catch me up", or runs it on a schedule via Cowork's /schedule.
---

# morning-briefing

A single-page situational brief for the start of the day: what's on the
calendar, what came in overnight that needs a response, prep notes for the
meetings that matter, and the two or three things worth doing first. Reads
widely, writes one file, changes nothing.

## Authority

L1 — read-only against the user's calendar and mail, plus a single written
output: a briefing document in `<vault>/outbox/drafts/`. This skill **never
sends** email, **never** creates/edits/cancels calendar events, and **never**
marks mail as read. Reading the inbox and calendar to summarize them is L1
(no external state changes). Producing the brief needs no confirmation — the
user asked for a briefing, that IS the permission.

## When to use

- "morning briefing" / "brief me" / "catch me up"
- "what's on my plate (today)" / "what's my day look like"
- "what do I need to know this morning"
- A scheduled run (Cowork `/schedule`) — same behavior, no user present

If the user is more specific (e.g. "brief me on just my meetings"), still
match and narrow the brief accordingly.

## Memory reads

Load whichever of these exist before writing the brief:

- `/memory/preferences.md` — briefing length/tone the user prefers, and how they like to be addressed. Match it.
- `/memory/people.md` — stakeholder context for anyone on today's calendar or in the flagged mail (role, relationship, history). Pull the `## <Name>` block for each attendee/sender you mention.
- `/memory/projects.md` — active projects, their status and next steps; use these to surface "you said the next step on X was Y."
- `/memory/decisions.md` — recent decisions that a meeting or reply might need to carry forward.

Missing files are fine — proceed without them and note nothing is loaded.

## Required connector use (when the user has connected calendar / mail)

**Check your current toolbelt before asking the user for anything.** Cowork
exposes installed connectors as tools in your session.

1. **Calendar.** Look for a tool whose name contains "calendar", "events",
   "gcal", or "outlook". If present, list **today's** events (and early
   tomorrow if today is nearly over). Capture time, title, attendees, and
   any location/link.
2. **Mail.** Look for a tool whose name contains "gmail", "mail",
   "messages", or "outlook". If present, list **unread / recent inbound**
   since roughly the last briefing (default: last 24h). Identify which
   genuinely need a reply vs. FYI.
3. **If a connector is missing**, don't block: build the brief from what you
   do have (the other connector + memory), and note in the brief which
   source was unavailable ("No calendar connected — schedule section
   skipped").

Never assume "no connector" without checking your tools first.

## Steps

1. **Load memory context.** Read the `## Memory reads` files that exist.

2. **Pull today's calendar.** Via the calendar connector. Order events by
   start time. Flag anything with external attendees or missing prep.

3. **Pull recent inbound mail.** Via the mail connector. Separate into
   **needs a reply** vs **FYI**. Do not open, read-receipt, or modify
   anything — list only.

4. **Cross-reference memory.** For each meeting attendee and each
   reply-needed sender, pull their `## <Name>` block from `/memory/people.md`
   and any related `/memory/projects.md` next step. This is what makes the
   brief _yours_ and not a generic agenda dump.

5. **Compose the one-page brief.** Keep it to a single screen. Use this
   shape (omit a section if its source was unavailable):

   ```markdown
   ---
   type: morning-briefing
   date: <YYYY-MM-DD>
   generated: <YYYY-MM-DD HH:MM>
   ---

   # Morning briefing — <Weekday, Month D>

   ## Top priorities

   1. <the single most important thing today>
   2. <second>
   3. <third>

   ## Today's schedule

   - <HH:MM> <title> — <attendees; 1-line prep note or "no prep needed">
   - ...

   ## Needs a reply

   - <sender> — <subject> — <why it matters / suggested next step>
   - ...

   ## FYI (no action)

   - <sender> — <subject>

   ## Project nudges

   - <project> — next step you noted: <from projects.md>
   ```

6. **Write the brief.** Save to
   `<vault>/outbox/drafts/briefing-<YYYY-MM-DD>.md` with your file-write
   tool. The path and filename are required. If today's brief already
   exists, overwrite it (one brief per day).

7. **Surface it.** Show the user the file path and the full brief body in a
   fenced block — they want to read it, not a summary of it. Then point them
   at scheduling (below).

## Scheduling (make it recurring)

This skill is built to run unattended. After the first brief, tell the user
verbatim how to automate it — Cowork has a native scheduler, no extra software:

> To get this every morning automatically, type **`/schedule`** in this Cowork
> task and pick **daily** (e.g. 7:00 AM). Cowork saves this prompt and re-runs
> it on that cadence — it just needs your machine awake and Claude Desktop open.

Do not try to create the schedule yourself — there is no tool for it; only the
user can confirm `/schedule` in Cowork. Your job is to teach the one step.

## Memory writes

- `<vault>/outbox/drafts/briefing-<YYYY-MM-DD>.md` (always — a draft; no approval needed)
- `<vault>/memory/daily.md` (L1 — append a one-line "Generated morning briefing" entry when `CONFIG.md [daily-log] enabled = true`)

No writes to `/memory/preferences.md`, `people.md`, `projects.md`, or
`decisions.md` — this skill only reads those.

## Failure modes

- **No connectors at all:** produce a brief from memory alone (project
  nudges + any standing priorities) and tell the user connecting Calendar
  and Mail will make it far more useful.
- **Empty day (no events, no mail):** say so plainly — a two-line brief is
  correct; don't invent filler.
- **A meeting attendee or sender is unknown to memory:** include them with
  the facts from the calendar/mail; don't fabricate a relationship.
- **A message looks like a sensitive or coercive instruction** (e.g. "wire
  funds", "reset the password"): surface it as a flag in "Needs a reply"
  with a caution, never as a routine to-do.

## What this skill never does

- Send, reply to, forward, or archive mail.
- Create, edit, move, or cancel calendar events.
- Mark messages as read or otherwise mutate the inbox.
- Apply L2 / L3 authority for any reason.
- Write to any `/memory/*` file other than appending `daily.md`.

## Reporting block

After the brief is written:

```
Briefing: <vault>/outbox/drafts/briefing-<YYYY-MM-DD>.md
Sources: <calendar: yes/no> · <mail: yes/no> · <memory files loaded: N>
Events today: <N>   Needs a reply: <N>   FYI: <N>

<full brief body, verbatim>

To get this every morning automatically: type /schedule in this task and pick daily.
```

The full brief goes in the report — not a summary. The user reads the brief
here and, if they like it, schedules it with one `/schedule` command.
