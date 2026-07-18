---
name: project-skeleton
description: Scaffolds a new project folder under /projects/ with the standard subfolders (briefs, research, drafts, correspondence, contracts) and registers the project in /memory/projects.md so other skills (downloads-filer, morning-briefing) know it exists. Creating the empty folders is immediate; the memory registration is proposed for approval. Use when the user says "start a new project", "set up a project for", "create a project called", or "scaffold a client folder".
---

# project-skeleton

Gives a new project a home the moment it starts, so files, notes, and drafts
have somewhere to go and the rest of the vault knows the project exists. Folders
are created right away; the one thing that touches memory — registering the
project — is proposed for the user's approval.

## Authority

L1 — creating empty folders under `/projects/<name>/` is a non-destructive vault
write and happens immediately. The one memory write (registering the project in
`/memory/projects.md`) follows the L1 contract: it is **proposed** via
`/outbox/proposals/` and applied only after the user approves. No external calls.

## When to use

- "start a new project" / "set up a project for <X>"
- "create a project called <name>"
- "scaffold a client folder for <client>"
- "new engagement: <name>"

## Memory reads

- `/memory/projects.md` — to check the project doesn't already exist and to match the registry's existing format when proposing the new entry.
- `/memory/people.md` — if the project is tied to a client/person, to link the right stakeholder in the registration.

## Steps

1. **Get the project name** (and a one-line description if the user gave one;
   ask briefly if not). Derive a `<kebab-name>` for the folder and confirm it.

2. **Check for collisions.** If `/projects/<kebab-name>/` already exists or the
   project is already in `/memory/projects.md`, stop and tell the user — offer
   to open the existing one instead of duplicating.

3. **Scaffold the tree.** Create:

   ```
   /projects/<kebab-name>/
     briefs/
     research/
     drafts/
     correspondence/
     contracts/
   ```

   Add a short `/projects/<kebab-name>/README.md` with the project name,
   the one-line description, and the created date.

4. **Propose the registry entry.** Write a proposal to
   `<vault>/outbox/proposals/<task-id>-projects.md` showing the exact block to
   add to `/memory/projects.md`, matching the file's existing structure:

   ```markdown
   ## <Project Name>

   - Status: active
   - Started: <YYYY-MM-DD>
   - About: <one-line description>
   - Folder: /projects/<kebab-name>/
   - Next step: <if known, else "define first task">
   ```

5. **Ask to register.** Show the proposed entry and ask: **"Add this to your
   project registry?"** On approval, append it to `/memory/projects.md`. On
   decline, leave the folders in place and the proposal in `/outbox/proposals/`.

6. **Report** (see Reporting block).

## Memory writes

- `/projects/<kebab-name>/…` (folders + a README — immediate; non-destructive, nothing overwritten)
- `<vault>/outbox/proposals/<task-id>-projects.md` (always — the registration proposal)
- `<vault>/memory/projects.md` — **only on explicit approval** (append the proposed block)
- `<vault>/memory/daily.md` (L1 — append a one-line "Scaffolded project <name>" entry when `CONFIG.md [daily-log] enabled = true`)

## Failure modes

- **Project already exists:** don't duplicate or overwrite — point the user at
  the existing folder / registry entry.
- **Name is vague** ("the new thing"): ask for a real name before creating
  folders; a badly named project folder is worse than none.
- **User declines registration:** keep the scaffolded folders (they're
  harmless) and leave the proposal for later; don't force the memory write.

## What this skill never does

- Overwrite an existing project folder or registry entry.
- Write to `/memory/projects.md` without an approved proposal.
- Delete anything, or apply L2 / L3 authority.

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
Project scaffolded: <Project Name>
Folder: /projects/<kebab-name>/  (briefs, research, drafts, correspondence, contracts)
Registry: <registered in /memory/projects.md | proposal pending your approval>

Next: drop files in /inbox/downloads/ and downloads-filer will route them here,
or say "start a brief for <name>".
```
