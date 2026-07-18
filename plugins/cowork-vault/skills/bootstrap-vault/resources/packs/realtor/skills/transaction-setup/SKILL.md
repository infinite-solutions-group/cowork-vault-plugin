---
name: transaction-setup
description: Sets up a new real-estate deal in one step — creates its document folder, registers it in /memory/transactions.md with dates, parties, doc map and mail query, and links it to an Asana project. Use when the user says "new deal at [address]", "set up a transaction", "I just opened escrow on [address]", or "add a listing".
---

# transaction-setup

The whole setup for a deal, from one sentence. The user says **"New deal at 123
Main St"** and answers a few questions; everything the other skills need exists
when this finishes.

## Authority

**L2** — creates a Drive folder and writes the registry. It does not complete
tasks or change dates, so if the vault has granted `transaction-autopilot`, that
grant covers this too. Ask once and record it.

## When to use

- "new deal at <address>" / "set up a transaction" / "add a listing"
- "I just opened escrow on <address>"

## What to ask for

Ask in **one message, as a short list**, and accept partial answers — anything
missing becomes a `TODO` in the registry rather than a blocker:

1. Property address
2. Client name and email
3. Asana project (name or link — search Asana by address if they don't know)
4. Acceptance date and closing date
5. Key contingency dates, if set yet
6. Escrow, lender, and buyer's-agent contacts, if known

Do **not** ask for a Drive folder id, a project gid, or a doc map. Those are
derived.

## Memory reads

- `/memory/transactions.md` — to check the address isn't already registered, and
  to match the format of existing blocks.
- `/memory/preferences.md` — the agent's own email for `agent_cc`, and any
  standing naming conventions for folders.

## Memory writes

- `/memory/transactions.md` (append — one new deal block; never overwrites an
  existing block without asking)

## Steps

1. **Find or create the document folder.** Look for a Drive folder named for the
   address; create one if absent. Record its id.

2. **Find the Asana project.** Search by address, then by client name. If several
   match, ask — never guess which deal the agent means. Record the project id.

3. **Build the doc map** from the project's actual task names. Match each
   document type to the closest task and **show the user the mapping for
   confirmation** — task names vary between templates, and a wrong map fails
   silently later.

4. **Compose the mail query** from the address and client surname, e.g.
   `(longstaff OR dryer) newer_than:14d`. Prefer distinctive tokens: a street
   name and a surname beat "the Smith deal".

5. **Write the registry block** to `/memory/transactions.md`.

6. **Confirm in plain language** — what was created, what it will now do on its
   own, and what is still `TODO`.

## Registry block to write

```markdown
## <Address>

- client: <Name> <email>
- agent_cc: <the agent's own email> # always cc'd on client mail
- status: active
- asana_project_id: <gid>
- docs_mode: auto # auto | drive | local
- drive_folder_id: <id>
- docs_path: projects/<slug>/documents/ # used when docs_mode is local
- mail_query: (<token> OR <token>) newer_than:14d
- accepted: <YYYY-MM-DD>
- close: <YYYY-MM-DD>
- deadlines:
  - inspection_contingency: <date>
  - appraisal_contingency: <date>
  - loan_contingency: <date>
  - final_walkthrough: <date>
- parties:
  - escrow: <name> · <email>
  - lender: <name> · <email>
  - buyers_agent: <name> · <email>
- doc_map:
  - termite_report -> "<exact Asana task name>" -> repair-request-review
  - appraisal -> "<exact Asana task name>" -> appraisal-update
  - signed_disclosures -> "<exact Asana task name>" -> disclosure-reminder
  - request_for_repairs -> "<exact Asana task name>" -> repair-request-review
  - closing_statement -> "<exact Asana task name>" -> closing-note
```

## On `docs_mode`

Default to `auto` and don't raise it unless asked. If the user wants documents on
their own Mac, set `local` with a `docs_path` and mention that pointing Google
Drive for Desktop at that folder keeps automatic filing working — documents that
arrive by email land in Drive and appear locally.

## Failure modes

- **No Asana project found:** offer to proceed without one. Documents still file;
  task automation is skipped until a project is linked. Say that explicitly.
- **Several Asana projects match:** ask. Never guess.
- **No Drive connector:** create the local folder, set `docs_mode: local`, and
  explain that emailed documents won't file automatically until Drive is
  connected.
- **Address already in the registry:** stop and ask whether to update the
  existing deal. Never write a duplicate block.
- **Task names don't match any known document type:** leave that line as a
  `TODO` and tell the user which types are unmapped, rather than mapping to a
  task that looks close.

## What this skill never does

- Create or modify Asana tasks — it only links to a project.
- Invent dates or contacts. Unknown is `TODO`.
- Overwrite an existing registry block without asking.

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
New deal — <address>

Created:  document folder "<name>"
Linked:   Asana project "<name>" (<N> tasks)
Watching: email matching <mail-query>
Mapped:   <N> document types → tasks   (<N> unmapped)

From now on, without being asked:
- documents that arrive by email file themselves and check off the matching task
- you'll get a draft reminder 2 days before each contingency
- anything ambiguous waits for you

Still needed: <TODO items, or "nothing">

Say "catch me up" any time to run it now.
```
