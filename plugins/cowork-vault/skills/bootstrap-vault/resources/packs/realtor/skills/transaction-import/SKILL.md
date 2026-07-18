---
name: transaction-import
description: Finds existing transaction projects already in Asana and registers them all at once, reading the deal details straight out of each project's own Transaction Info task rather than asking. Use when the user says "import my deals", "find my existing transactions", "set up my current listings", or is onboarding with deals already in flight.
---

# transaction-import

The onboarding skill. An agent adopting this already has live deals in Asana —
often several — and setting them up one interview at a time is the wrong first
impression.

Almost everything needed is already sitting in each project. The transaction
template's **Transaction Info** task carries the address, the dates, the
contingencies, and every party, entered when the deal was opened. Read it rather
than asking for it.

## Authority

**L2** — reads Asana and writes the deal registry plus document folders. Shares
the realtor pack's grant; if `transaction-autopilot` or `transaction-setup` is
already granted, that covers this. Without a grant, still do the whole scan and
**show what it would register**, writing nothing.

## When to use

- "import my deals" / "find my existing transactions" / "set up my current listings"
- Right after installing the pack, when the registry is empty and Asana is not
- When a deal exists in Asana that the assistant does not know about

## Memory reads

- `/memory/transactions.md` — what's already registered, so a re-run adds only
  what's new.

## Steps

1. **List the Asana projects.** Look for a tool whose name contains "asana". No
   Asana tool → say so and stop; there is nothing to import from.

2. **Identify which are transactions.** A project qualifies if it contains a task
   named **Transaction Info**, or clearly matches the transaction template
   (tasks like "Open Escrow", "Rec'd Termite Report", "Full Contingency Due").

   Skip everything else silently. An agent's workspace has projects that are not
   deals, and listing them as "not imported" is noise.

3. **Skip what's already registered.** Match on the Asana project id, not the
   address — addresses get typed differently ("2443 Longstaff Ct" vs "2443
   Longstaff Court") and the id is exact. Say how many were already known.

4. **Read each project's Transaction Info task.** Parse its notes. The fields are
   `Label: value` lines, and the labels vary between agents, so match on meaning
   rather than exact string:

   | Registry field         | Typical labels                            |
   | ---------------------- | ----------------------------------------- |
   | address                | Address                                   |
   | client + email + phone | Seller 1 / S1 email / S1 phone            |
   | list_price, sale_price | List Price, Sale Price                    |
   | accepted               | Acceptance Date                           |
   | close                  | Closing Date                              |
   | inspection_contingency | Insp CR                                   |
   | appraisal_contingency  | App CR                                    |
   | loan_full_contingency  | Loan CR                                   |
   | escrow                 | Escrow Officer + Phone/Email beneath it   |
   | lender                 | Lender / Officer + Phone/Email beneath it |
   | buyers_agent           | Buyer's Agent + Email/Phone               |
   | buyers_tc              | Buyer's Transaction Coordinator           |

   Contacts are usually a name line followed by its own phone and email lines —
   read the block, not just the labelled line.

   **A blank or missing field is `TODO`.** Never infer a closing date from an
   acceptance date, never guess a contingency from a pattern. These dates drive
   real client emails, and a plausible invention is worse than an obvious gap.

5. **Fall back to the project name** when Transaction Info is missing or empty.
   If the project is named for an address, use that and mark everything else
   `TODO`. Say which deals came in thin, so the user knows what to fill.

6. **Build a doc-map per deal from that project's own task names** — never copy
   another deal's map. Templates drift, and a map pointing at a task that does
   not exist fails silently months later when a document arrives and matches
   nothing.

7. **Compose a `mail_query`** from the street name and the client's surname, e.g.
   `(longstaff OR dryer OR "Longstaff Ct")`. Prefer distinctive words: a street
   name and a surname beat a house number, which matches invoices and receipts.

8. **Show everything before writing.** One line per deal — address, client,
   closing date, how many document types mapped, and how many fields are `TODO`.
   Then ask. This is the moment to catch a project that is not really a deal, or
   a stale one from last year.

9. **On approval, write:** append each block to `/memory/transactions.md`, create
   each deal's documents folder, and log to `<vault>/archive/changelog.md`.

10. **Report**, and point at what to do next.

## Deciding which deals are active

Closed deals should not be registered as active — they would generate deadline
reminders for dates long past.

Treat a deal as **closed** when its closing date is in the past _and_ most tasks
are complete. Register it with `status: closed`, or skip it and say so. When
genuinely unsure, ask rather than guessing: an agent knows instantly, and getting
it wrong means either noise or a missing deal.

## Memory writes

- `/memory/transactions.md` (append — one block per imported deal; **never**
  modifies an existing block)
- `<vault>/projects/<slug>/documents/` (created per deal)
- `<vault>/archive/changelog.md` (append)

## Failure modes

- **No Asana tool:** say so and stop.
- **No transaction-shaped projects:** say the workspace has none, and suggest
  "new deal at \<address\>" for setting one up by hand.
- **Transaction Info exists but is empty:** import the address from the project
  name, everything else `TODO`, and flag it. A registered deal with gaps is more
  useful than no deal.
- **Two projects for the same address:** import neither. Ask which is current —
  duplicates are usually a re-created project, and picking wrong means updating
  a checklist nobody looks at.
- **A project matches the template but has no address anywhere:** skip and list
  it. Without an address there is no folder name and no mail query.
- **Registry already has the project id:** skip silently. Re-running this should
  be safe and quiet.

## What this skill never does

- Modify or complete any Asana task. It only reads.
- Overwrite an existing registry block.
- Invent a date, price, or contact. Unknown is `TODO`.
- Register a deal whose address it could not determine.

## Voice

Do the internal checks silently; report only what they mean for the user. They
did not ask which tools you loaded or what you are about to do next.

Mention internals only when they change what the user gets — a deal that could
not be imported, a field that needs filling. Then say it in their terms.

## Reporting block

```
Imported deals — <date>

Found <N> transaction projects in Asana · already registered: <N> · importing: <N>

  <address>
     client:    <name> <email>
     closing:   <date>          contingencies: <N> dated
     documents: <N> types mapped to tasks
     to fill:   <N> fields (<which>)

  ...

Skipped:
  <project> — <why: not a transaction | closed <date> | no address | duplicate>

Each deal now has a documents folder and is being watched for email.
Say "catch me up" to process anything already waiting.
```

If run without a grant, title it **Imported deals (preview — nothing written)**
and keep the rest identical.
