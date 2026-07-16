---
name: downloads-filer
description: Sorts loose files sitting in the vault's /inbox/downloads/ into the right project folder under /projects/, using the project registry in /memory/projects.md to decide where each belongs. Moves within the vault only, logs every move so it's reversible, and never deletes. Leaves anything it can't confidently place where it is and flags it. Use when the user says "file my downloads", "sort my inbox", "clean up downloads", or on a schedule.
---

# downloads-filer

Keeps `/inbox/downloads/` from becoming a junk drawer. Reads each loose file,
figures out which project it belongs to, and moves it into that project's
folder — reversibly, and never guessing when it isn't sure.

## Authority

L1 — file movement is confined to inside the vault (`/inbox/downloads/` →
`/projects/<name>/…`), every move is logged to `/archive/changelog.md` so it can
be undone, and **nothing is ever deleted**. No external calls, no sends. Filing
a file the user asked to be filed needs no per-file confirmation; but a file the
skill can't confidently place is **left where it is and flagged**, never moved
on a guess.

## When to use

- "file my downloads" / "sort my inbox" / "clean up downloads"
- "put these where they belong"
- A scheduled run (Cowork `/schedule`, e.g. nightly) — same behavior; unplaceable
  files are flagged for the next time the user is present, not moved on a guess.

## Memory reads

- `/memory/projects.md` — the project registry. This is the source of truth for
  what projects exist and what each is about; use the project names and their
  descriptions/keywords to match files to a destination.
- `/memory/people.md` — to resolve a file named after a person to the project
  that person belongs to (e.g. a contract from a known client).

If `/memory/projects.md` is missing or empty, do not invent projects — flag
everything as unplaceable and tell the user to create a project first
(`project-skeleton` does this).

## Steps

1. **List the queue.** Enumerate files directly in `<vault>/inbox/downloads/`.
   Skip nothing based on type — classify by name + content.

2. **Classify each file.** For each, decide the destination project by matching
   its filename and (where readable) its contents against the projects in
   `/memory/projects.md`. Assign a confidence:
   - **High** — clear match to exactly one project (client name, project
     keyword, matching invoice number).
   - **Low / ambiguous** — matches none, or matches two or more equally.

3. **Choose a subfolder.** Within the matched `/projects/<name>/`, pick the
   conventional subfolder by kind: contracts → `contracts/`, correspondence →
   `correspondence/`, research/reference → `research/`, drafts/working files →
   `drafts/`, briefs/specs → `briefs/`. Create the subfolder if missing.

4. **Move the high-confidence files.** For each high-confidence file, move it
   from `/inbox/downloads/` to `/projects/<name>/<subfolder>/`, and append a
   line to `<vault>/archive/changelog.md`:
   `moved <file> → /projects/<name>/<subfolder>/ (downloads-filer, <date>)`.
   Never overwrite an existing file at the destination — if the name collides,
   suffix the moved file with ` (2)` and note it.

5. **Leave the rest.** Low-confidence / ambiguous files stay in
   `/inbox/downloads/`. Do not move them.

6. **Report.** Show what was filed and what was left (see Reporting block).

## Memory writes

- `<vault>/archive/changelog.md` (append — one line per move, so filing is auditable and reversible)
- `<vault>/memory/daily.md` (L1 — append a one-line "Filed N downloads, M left for review" entry when `CONFIG.md [daily-log] enabled = true`)

This skill does **not** write to `/memory/projects.md` or any other memory file
— it reads the registry, it doesn't change it.

## Failure modes

- **No project registry:** flag every file as unplaceable and suggest running
  `project-skeleton` to create a project. Don't invent folders.
- **A file matches two projects equally:** leave it and list both candidates in
  the report so the user can decide.
- **Destination name collision:** never overwrite; suffix and note it.
- **A file looks sensitive** (credentials, keys, a `.env`): do not open its
  contents beyond what's needed to classify; flag it for the user to handle and
  leave it in place.

## What this skill never does

- Delete any file, ever.
- Move a file it isn't confident about.
- Touch files outside `/inbox/downloads/` and `/projects/`.
- Send anything externally or apply L2 / L3 authority.

## Reporting block

```
Downloads review — <date>
In queue: <N>   Filed: <N>   Left for review: <N>

Filed:
- <file> → /projects/<name>/<subfolder>/
- ...

Left in /inbox/downloads/ (needs your call):
- <file> — <reason: no match | matches <A> or <B> | sensitive>
- ...

All moves logged to /archive/changelog.md (reversible).
```
