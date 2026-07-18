---
name: bootstrap-vault
description: Set up and maintain a Cowork vault. Normalizes a folder of Markdown agent prompts (Custom GPT exports, course skill files, hand-written prompts) into a structured Cowork vault — governance docs, normalized skills, memory layout, scheduled tasks, inbox/outbox routing, and a starter pack so the user has something working in the first thirty minutes. Trigger on phrases like "set up my vault", "scaffold Cowork for me", "install these agents", "I have a folder of GPT prompts", "import my boss and worker agents", "install the starter pack", "upgrade my vault", "create a skill that…" / "make me a skill for…" (authors a new vault skill from a plain-English description), or any time the user references markdown files they want to wire into Cowork.
---

# bootstrap-vault

**Version: 0.8.0** — **The starter pack is complete — all seven skills are
authored:** `email-drafter`, `morning-briefing`, `preferences-updater`,
`downloads-filer`, `session-retrospective`, `conflict-scanner`, and
`project-skeleton` (all L1, the `starter` pack, installed at INIT). An optional
`realtor` pack installs five real-estate transaction skills —
`transaction-setup` (one-step new deal, L2), `transaction-autopilot` (the "catch
me up" runner, L2), `transaction-briefing` (Asana → daily deal brief, L1),
`transaction-emailer` (milestone client emails that always cc the agent, L1), and
`transaction-intake` (files documents → updates Asana → drafts follow-ups, L2,
grant-gated). **New in 0.8.0:** the pack is driven by a standing rulebook
(`/memory/playbook.md`) the user edits **by talking**, and an action ledger
(`/memory/actions.jsonl`) that makes every rule fire **once per trigger** — the
guarantee that makes unattended running safe. The
**AUTHOR** operation (the "skills builder") lets the user grow the vault beyond
these: describe a skill in plain English ("make me a skill that files receipts")
and bootstrap-vault drafts, gets approval for, and writes a runnable vault skill
that follows the DISPATCH contract — defaulting to L1 and escalating authority
only on explicit opt-in. The `preferences-updater` skill: it
captures corrections and standing rules from a session and **proposes** memory
updates to `/outbox/proposals/`, applying to `/memory/*` only after the user
approves — the piece that lets the vault remember across sessions. Also ships
`morning-briefing`: a one-page daily brief from the user's calendar + recent
inbound mail + vault memory, written to `/outbox/drafts/`, that teaches the user
to make it recurring with Cowork's native `/schedule`. `email-drafter` creates
the Gmail draft FIRST (no "should I put this in Gmail?" prompt) then surfaces the
full body for review. Live feedback Worker URL is baked in (see
`submit-feedback`). INIT handles pre-existing vaults gracefully (installs missing
starter skills instead of refusing). DISPATCH / USE / LIST / DOCTOR runtime
operations are live on top of the original setup operations. If the user asks
_"what version of Cowork Vault do I have"_ or _"what's new"_, answer from this
header.

Turns a folder of loose markdown into a structured Cowork vault: governance
docs, normalized skills, memory layout, scheduled tasks, inbox/outbox routing,
and a starter pack so the user has something working in the first thirty
minutes.

After setup, dispatches user requests to the right vault skill — the
day-to-day way to use what you imported.

> **Note on scope.** The "vault" described below is a filesystem convention
> layered on top of Cowork — a place to keep skill source files, memory
> documents, scheduled-task definitions, and operational scratchpad data
> alongside the user's normal home directory. It is _not_ a Cowork primitive.
> Cowork itself stores installed plugins in its own internal location; this
> vault is where the user keeps the editable source-of-truth Markdown they
> can re-import, version, or sync with git / Dropbox / iCloud.

## When to use

Trigger on any of:

- "Set up my vault" / "first-time setup" / "scaffold Cowork"
- "Import these agents/skills/GPTs" / "install my agent files"
- "I have a boss agent and some workers, install them"
- "Install the starter pack" / "give me the default skills"
- "Upgrade my vault" / "update the vault structure"
- **"Create/make/build a skill that…"** / "I want a skill to…" / "teach
  yourself a new skill" — AUTHOR a new vault skill from the description
- The user drops a folder of MD files and asks to wire them in
- **After setup**, any request that maps to a vault skill ("draft a reply",
  "research this company", "what's coming today") — bootstrap-vault acts
  as the **dispatcher** and runs the right vault skill.

## How to talk to the user

Everything below this line is internal vocabulary. **None of it belongs in what
the user reads.** They did not buy a vault architecture; they bought an assistant
that files documents and drafts email.

Never say, in user-facing output: `DISPATCH`, `INSTALL_PACK`, `L0`/`L1`/`L2`/`L3`,
"authority grant", "risk acknowledgment", "reporting block", "the contract",
"once-key", "idempotent", "manifest", "toolbelt", "dry-run mode".

Say the meaning instead:

| Internal                                 | To the user                                     |
| ---------------------------------------- | ----------------------------------------------- |
| "this skill is L2 and has no grant"      | "I need your OK before I can change your Asana" |
| "running in dry-run"                     | "here's what I'd do — nothing changed yet"      |
| "recorded the risk acknowledgment"       | "noted that you approved this"                  |
| "the once-key is already in the ledger"  | "already handled that one"                      |
| "per the reporting block"                | _(say nothing — just report)_                   |
| "DISPATCH selected transaction-briefing" | "Running your transaction briefing."            |

Two habits that matter more than vocabulary:

**Don't narrate internal checks.** Reading config, resolving grants, loading
tools, deciding what to do next — do it, don't describe it. "I have the skill
loaded. The grant is in place (CONFIG.md line 39), so this runs live" tells the
user four things they never asked about, before anything happened.

**Surface an internal only when it changes their outcome.** A missing grant, an
unfiled document, a rule that didn't fire — those are worth saying, in their
terms. Everything else is plumbing.

Skill names are the one exception: naming the skill you're running, in one short
line, is how a wrong choice becomes visible. Keep it to that.

## Vault-file resolution contract

**Every skill reads and writes vault paths like `<vault>/memory/transactions.md`
and stays unaware of where the vault physically lives.** This section is the only
place that knows. Skills inherit it through DISPATCH; they must never resolve a
vault path themselves.

To resolve `<vault>/<relative-path>`:

1. If `CONFIG.md [vault-location] local_path` is set **and** that path exists on
   this machine, use the filesystem. Fastest, works offline.
2. Otherwise use the Drive connector against `drive_folder_id`, walking the same
   relative path as folders in Drive.
3. Neither available → say so plainly and stop. **Never** silently fall back to a
   different vault, and never scaffold a fresh one — a user whose Drive connector
   is missing has a connection problem, not an empty vault, and creating one
   would hide their real files behind an empty duplicate.

**Why this exists.** Since 2026-07-07 Cowork runs sessions on Anthropic's
servers, so a session may have no access to the user's disk at all — but a task
that needs local files runs locally, which means it only runs while the machine
is awake with Claude Desktop open. A vault reachable through Drive runs
unattended; a vault only on local disk does not. Rule 1 keeps desktop sessions
fast; rule 2 is what makes a phone or a scheduled cloud run work.

`local_path` is **optional and absent by default.** It is set only when the user
has Google Drive for Desktop syncing the vault folder. Do not tell users they
need it — Drive alone is sufficient and requires no extra software.

## Operations

This skill exposes setup operations (INIT / IMPORT / INSTALL_PACK / UPGRADE /
MIGRATE_VAULT / AUTHOR) plus runtime operations (DISPATCH / USE / LIST /
DOCTOR). Pick the one that matches the user's intent. If unclear, ask. AUTHOR is
the "build me a skill by asking" operation — it turns a plain-English description
into a runnable vault skill.

### Operation 1: INIT — first-time vault setup

**Default to a vault in Google Drive.** That is what lets scheduled work run
while the user's machine is off, and lets them drive it from a phone. Create
`Cowork Vault` in their Drive via the Drive connector, record its id in
`[vault-location]`, and leave `local_path` empty.

Offer local-only **only** if the Drive connector is unavailable or the user asks
for it — and when they choose it, say what it costs in one sentence: scheduled
work will wait until their machine is awake with Claude Desktop open. Do not
present this as a neutral choice; it isn't.

If the user has Google Drive for Desktop, additionally record `local_path` so
desktop sessions read from disk. Do not prompt them to install it — Drive alone
is sufficient.

Inputs: optional vault path or Drive folder name. Default: `Cowork Vault` in
Drive, or `$HOME/cowork-vault` in local mode.

1. Verify the target path. If it exists and is **already a vault**
   (has a `CONFIG.md` at the root), do not refuse outright — that
   strands users with pre-existing vaults. Instead:
   - Read `CONFIG.md` to confirm it's a Cowork Vault vault
   - Skip the scaffolding step
   - Check which starter-pack skills are missing under
     `<vault>/skills/<name>/` and offer to install just those
   - Offer IMPORT if the user has agents to bring in
2. If the path exists but isn't a vault and is non-empty, refuse with a
   message that asks the user to pick an empty directory.
3. If the path doesn't exist or is empty, scaffold it: create the
   directory tree below, write the governance defaults from the
   Templates section, write a vault-root `README.md`.
4. Ask the user if they want to install the Starter Pack now. If yes,
   call INSTALL_PACK with the `starter` pack.
5. Ask if they have existing agent files to import. If yes, call IMPORT.
6. Print the Reporting Block (see below).

Directory tree to create:

```
<vault>/
  CONFIG.md
  README.md
  /constitution/
    governance.md
    authority-levels.md
    development-constitution.md
  /memory/
    preferences.md
    people.md
    projects.md
    decisions.md
  /skills/
  /scheduled/
  /inbox/
    /downloads/
    /email-pending/
    /handoff/
  /outbox/
    /drafts/
    /tasks/
    /proposals/
  /scratchpad/
  /archive/
    /transcripts/
    /sent/
```

### Operation 2: IMPORT — normalize and install user MD files as skills

Inputs: source (folder path, single file path, `.zip`, or URL). Optional: a
`manifest.json` mapping files to roles.

**Preferred path: invoke the deterministic transformer CLI.**

```sh
cowork-transformer <source> --vault <vault-path>
```

The CLI handles every recognized format end-to-end: plain Markdown, DOCX,
TXT, HTML, PDF, ZIP (including ZIP-of-ZIP for Notion exports), public
GitHub URLs, public Notion / Confluence URLs. It writes the normalized
SKILL.md + resources + warnings under `<vault>/skills/<name>/` and
appends to `<vault>/archive/changelog.md`. Output is a Reporting Block
in stdout.

After it runs, parse its output and surface the report to the user in
the friendly format described in the Reporting block section.

**If the CLI is not available** (running in an environment where shell
access is limited), do the normalization manually following these steps:

1. Recursively scan the source folder for supported files (`*.md`,
   `*.docx`, `*.txt`, `*.html`, `*.pdf`). Skip files matching README,
   LICENSE, CHANGELOG, NOTES, TODO, INDEX (case-insensitive).
2. For each file, run the Normalization Pass below.
3. If a manifest is provided, honor explicit role assignments. Otherwise
   infer role from content using the heuristics in Role Inference below.
4. Write each normalized skill to `<vault>/skills/<kebab-name>/SKILL.md`.
   If the source file references attachments or external knowledge files,
   copy them to `<vault>/skills/<kebab-name>/resources/`.
5. If a boss/orchestrator skill is detected or flagged in the manifest,
   also create `<vault>/skills/<kebab-name>/ROUTING.md` listing the worker
   skills it can invoke and the conditions for each.
6. Print the Reporting Block. Include a table: original filename, new
   path, inferred role, confidence, warnings.

#### Handling CLI warnings (repair messy inputs)

The CLI's Reporting Block lists per-skill warnings. When you see one of
these, repair the source file inline before re-running the import — do
not just pass the warning through to the user.

- **`Frontmatter could not be parsed`** — the file's YAML at the top is
  malformed (unclosed `---`, syntax error, indentation problem). Read
  the source file, repair the YAML (preserve any `name` / `description`
  values the user wrote, fix punctuation, ensure both `---` markers are
  present), save it, and re-run the CLI. Show the user a one-line note
  that you fixed the frontmatter automatically.
- **`stripped-custom-gpt-artifact`** — vendor branding / boilerplate
  was removed from the body. No action needed; informational.
- **`stripped-image`** / **`stripped-branding`** — decorative content
  was removed. No action needed; informational.
- **`low-confidence-description`** — the description generator wasn't
  confident. Read the cleaned body, write a better 1–3 sentence
  description, update the SKILL.md frontmatter inline, save.
- **`no-system-prompt-detected`** / **`multiple-system-prompt-candidates`**
  — the format detector couldn't decide which file is the system prompt
  in a folder. Ask the user, get an answer, then re-run with a manifest
  that specifies the system-prompt file explicitly.

The principle: the deterministic CLI does the bulk-work. When it
surfaces a warning, you (Claude) read the input, repair what's wrong,
and continue. Never silently lose the user's content; never make
changes without explaining them in the Reporting Block.

#### Manifest format

If the user supplies one, expect this shape:

```json
{
  "vault_path": "~/cowork-vault",
  "agents": [
    {
      "file": "lead-qualifier-boss.md",
      "role": "boss",
      "name": "lead-qualifier",
      "workers": ["lead-researcher", "email-drafter", "crm-logger"]
    },
    {
      "file": "lead-researcher.md",
      "role": "worker",
      "name": "lead-researcher"
    }
  ],
  "scratchpad_namespace": "leads"
}
```

If no manifest is provided, generate one from inference and ask the user to
confirm or correct before writing skills.

#### Role inference heuristics

Tag a file as `boss` if the body contains two or more of: the words
"delegate", "route", "coordinate", "orchestrate", "dispatch"; explicit
references to other agent names; instructions of the form "if X then ask Y";
a list of agents or roles.

Tag as `scheduled` if the body references times, cadences, or daily / weekly /
hourly verbs without user invocation ("every morning", "at 7am", "nightly").

Otherwise tag as `worker`. A worker describes a single, narrow capability
and does not reference other agents.

### Operation 3: INSTALL_PACK — install a skill pack

Packs are **self-describing**. Each lives at
`resources/packs/<name>/` with a `pack.json` manifest (schema:
`resources/packs/pack.schema.json`), its skills under `skills/<skill>/SKILL.md`,
and any seed files under `memory/`.

**Read the manifest and follow it.** Do not hardcode knowledge of which packs
exist or what they contain — adding a vertical must never require editing this
file.

**Steps:**

1. **Read `resources/packs/<name>/pack.json`.** No such directory → say which
   packs are available (Operation 3b) and stop.

2. **Copy each `skills[]` entry** from `skills/<name>/SKILL.md` into
   `<vault>/skills/`. **Skip name collisions** and log them — the user authored
   their own version, and overwriting it would destroy their work.

3. **Register each skill in `CONFIG.md [skills]`** using its `summary` and
   `authority`.

4. **Seed `memory[]` files** into `<vault>/memory/`:
   - `from` → copy that path verbatim from the pack.
   - `template: true` → write a **commented template** the user fills in. Never
     invent data.
   - `empty: true` → create the file empty (ledgers, append-only logs).
   - `ifAbsent` defaults true — **never overwrite**, the user may have tuned it.

5. **Run the risk gate for every skill above L1.** Show `riskGate.prompt`
   verbatim, get an explicit yes, then record `[authority-grants]` and
   `[risk-acknowledgments]` in `CONFIG.md` with a timestamp. On no, honor
   `onDecline` — `dry-run` means the skill installs and reports without acting,
   which is a legitimate mode, not a failure. `sameAs` reuses another skill's
   gate: **ask once, cover both.**

6. **Check `connectors[]`.** Point the user at Customize → Browse plugins for
   anything missing. For `required: false`, say specifically what degrades
   rather than implying the pack is broken.

6b. **Check `extensions[]`.** These are `.mcpb` bundles, and they install into
**Claude Desktop → Settings → Extensions — not into the vault.** A vault is
data a session reads; an extension is a process Claude launches. They are
separate layers, so installing a pack can never install an extension, and the
user has to do it themselves.

For each entry, look for its `provides[]` tool names on your toolbelt:

- **Present** → say so and move on. Do not make the user prove it.
- **Absent** → name the bundle, say what it enables in one line (`why`), and
  point at its `setupDoc`. If `alternativeTo` is set, say what still works
  without it, so an absent extension reads as a smaller product rather than a
  broken one.

Multiple entries are often alternatives, not a checklist — a user on Gmail
needs the Gmail bundle and should never be told to install the Outlook one.
Match to what they actually use; if you can't tell, ask which mail they use
rather than listing both.

7. **Run the pack's `firstRun` skill, if it declares one.** This is the step
   that turns "installed" into "useful", and skipping it leaves the user staring
   at an assistant that knows nothing about their work.

   Offer it in the pack's own words (`why`), then run it on a yes. Honor
   `skipIf` — offering an importer to someone whose registry is already full is
   noise.

   Do this **before** setting up schedules. Scheduling an assistant that knows
   about none of the user's work means its first runs find nothing, which reads
   as broken rather than as empty.

8. **Set up `schedules[]` with the user, don't just suggest them.** Run the
   skill once, then walk them through typing `/schedule` in that task and
   picking the cadence. `CONFIG.md [scheduled-tasks]` records intent and is
   **not an executor** — a schedule written only there never runs.

   **State the real condition, which is about file location, not the app.**
   Since 2026-07-07 Cowork runs scheduled tasks remotely — they fire on cadence
   with the machine asleep and the desktop app closed — **except** that a task
   needing local files or apps runs locally, and so needs the machine awake with
   Claude Desktop open.

   That makes vault location the deciding factor: a vault reachable through the
   Drive connector runs unattended; a vault only on local disk does not. Check
   `CONFIG.md [vault-location]` and tell the user which they have. If it is
   local-only, say plainly that scheduled work waits for their machine, and offer
   to move the vault to Drive.

   Record the outcome in `CONFIG.md [scheduled-tasks]` — including a declined
   one, as `<skill>: not scheduled`. That section executes nothing; it is a
   record, and its value is that `DOCTOR` and a later conversation can see what
   was decided rather than guessing. A user who says "not now" should be able to
   ask "what did we skip?" and get an answer.

9. **Present the pack by its `surface`, not its skill list.** The user should
   leave knowing a few phrases, not a list of skill names.

**Reporting block:**

```
Installed: <title>

What to say:
  "<say>"  →  <what it does, in the user's words>
  ...

Imported:  <what firstRun found, or omit this line>
Connected: <connectors present>    Missing: <connectors to add>
Extensions: <installed>            To install: <name — one line on what it adds>
Scheduled: <skill> <cadence>       (set up together, or "not yet")
Seeded:    <memory files>

Skipped (you already have your own): <names, or omit this line>
```

### Operation 3b: LIST_PACKS — what's available

Enumerate `resources/packs/*/pack.json` and report each pack's `title`,
`description`, and whether it's installed (its skills present in
`CONFIG.md [skills]`). Offer a non-default pack when the conversation matches its
`whenToOffer` — but **never install one unprompted.**

At INIT, install every pack with `default: true` (currently just `starter`).

### Operation 4: UPGRADE — refresh vault against new template version

1. Read `CONFIG.md` to find the current vault version.
2. Compare each governance doc and starter skill against the latest templates
   shipped with this plugin.
3. For files with structural changes, generate a unified diff and present to
   the user.
4. Apply only approved changes. Never silently overwrite anything in
   `/memory/` or `/skills/` that the user authored.
5. Update the `vault_version` field in `CONFIG.md` and append a CHANGELOG
   entry to the vault README.

### Operation 5: DISPATCH — act as a vault skill (the daily-use unlock)

After setup, most requests aren't setup-shaped — they're work-shaped: _"draft a
reply"_, _"check my email for documents"_, _"catch me up"_, _"what's on my plate
today"_. DISPATCH handles those by **loading a vault skill and acting as it**.

Triggers: anything that isn't an explicit INIT / IMPORT / INSTALL_PACK / UPGRADE
/ LIST / DOCTOR command.

> **The user will never name a skill, and must never have to.** They say what
> they want in their own words. Mapping that to the right skill is this
> operation's whole job — if they have to say "run transaction-fetch", DISPATCH
> has failed.

1. **Confirm the vault is reachable.** Read `<vault>/CONFIG.md`. If you cannot,
   say so plainly — "I can't see your vault, so I'm working without your saved
   context" — and **stop before answering from raw connectors.** A vault request
   answered from a bare mailbox looks like it worked and quietly isn't: no deal
   registry, no saved preferences, no memory of what was already done.

2. **Enumerate available skills.** Read `CONFIG.md [skills]` (maintained by
   IMPORT + INSTALL_PACK). If missing, scan `<vault>/skills/*/SKILL.md`.

3. **Match intent, in this order:**
   a. An installed pack's `surface[]` phrases — these are the sentences the pack
   expects and map straight to a skill.
   b. Each skill's `description` and `## When to use` triggers.
   c. The subject matter. A request about email documents, deals, deadlines, or
   client mail belongs to whichever skill owns that domain, even when the
   wording is nothing like the trigger phrases.

4. **Prefer the skill over doing it yourself.** This is the rule that matters
   most, because breaking it is invisible.

   If a skill covers the request, **run the skill** — do not accomplish the same
   thing directly with connector calls because it seems quicker. The skill
   carries the parts that don't show up in the answer: which query to use for
   this deal, which ledger records that it happened, which authority gate
   applies, what gets logged. Work done outside the skill looks identical and
   silently skips all of it.

   Concretely: if a skill exists for finding documents in email, never answer a
   documents-in-email request by searching the mailbox yourself.

5. **Prefer the orchestrator over its workers.** If both a coordinating skill and
   one it delegates to could match, pick the coordinator. Going straight to a
   worker skips the cross-cutting record — for the realtor pack, "catch me up"
   is `transaction-autopilot`, not `transaction-intake`, even though intake ends
   up doing much of the work.

6. **Say which skill you're running, in one short line**, before the work:
   "Running your transaction briefing." That is not chatter — it is what makes a
   wrong choice visible instead of silent. If nothing matches, say what you're
   about to do instead, and let the user redirect.

   If two or three match, name them briefly and ask. Don't guess between skills
   that would take different actions.

7. **Load the skill** — `<vault>/skills/<name>/SKILL.md` — and read its
   `## Authority`, `## Memory reads`, `## Memory writes`, and `## Steps`.

8. **Load memory context.** Read each `## Memory reads` path that exists.
   Tolerate missing files.

9. **Execute the steps** as written. Where the skill specifies an exact format —
   a filename shape, a JSON line, a field name — follow it exactly. Those shapes
   are usually a contract with another skill that reads them later; "improved"
   field names break the reader silently.

10. **Honor the skill's authority level on every write:**
    - **L0:** refuse any write outside `/outbox/drafts/`.
    - **L1:** `/memory/*` writes go via `/outbox/proposals/` for approval first;
      drafts to `/outbox/drafts/` need no approval.
    - **L2:** writes and external sends allowed; log each to
      `/archive/sent/YYYY-MM-DD-<task-id>.md`.
    - **L3:** only within the scope declared in `CONFIG.md [authority-grants]`.

    Missing grant → run the skill's stated fallback, normally a dry run. Tell the
    user in their terms — "I need your OK before I can update Asana" — not in
    ours.

11. **Report** as the skill's reporting section dictates.

12. **Append to `/memory/daily.md`** if `CONFIG.md [daily-log] enabled = true`.

### Operation 6: USE — explicitly invoke a named skill

Triggers: _"use the email-drafter skill"_, _"run morning-briefing"_.

Same as DISPATCH but skip the matching step — load the named skill
directly. If the named skill doesn't exist, list nearby matches and ask.

### Operation 7: LIST — enumerate vault skills

Triggers: _"what skills do I have"_, _"list my agents"_, _"show me the vault"_.

1. Read `<vault>/CONFIG.md` `[skills]`.
2. For each skill, show name + description (1 line) + authority level +
   last-used timestamp if available.
3. Group by role (boss / worker / scheduled) when the role is declared.

### Operation 8: DOCTOR — health-check the vault

Triggers: _"check my vault"_, _"is everything OK"_, _"vault doctor"_.

Also triggers on the question users actually ask: _"will this run without my
computer?"_, _"does this work when my laptop is closed?"_

**Lead with unattended-readiness** — it is the finding that changes what they can
expect, so it goes first, not in a checklist:

- Read `CONFIG.md [vault-location]`.
- `mode = drive` → scheduled work runs on Cowork's servers; say plainly that it
  keeps going with their machine off.
- **Is anything actually scheduled?** Read `CONFIG.md [scheduled-tasks]`. Nothing
  recorded, or every entry `not scheduled`, means the assistant only ever acts
  when asked — worth saying plainly, since the user may believe otherwise. Offer
  to set it up.
- `mode = local` (or no Drive folder id) → scheduled work only runs while the
  machine is awake with Claude Desktop open. Say so, say why (Cowork runs a task
  needing local files locally), and offer MIGRATE_VAULT.
- `local_path` set but missing on this machine → not an error. Note that this
  session is reading through Drive and carry on.

Then walk every SKILL.md and ROUTING.md:

- Verify every referenced skill file exists.
- Verify every `## Memory reads` path is a known vault location.
- Verify every connector mentioned has an installed Cowork plugin.
- Flag any skill below 0.6 description confidence (per `_warnings.md`).
- Report findings as a checklist.

### Operation 8b: MIGRATE_VAULT — move a local vault into Drive

Triggers: _"move my vault to Drive"_, _"make this run without my computer"_.

**Copy, never move.** The original stays exactly where it is.

1. Create the vault folder in Drive and copy the tree into it.
2. **Verify** every file arrived — compare the file list, and stop on any
   mismatch rather than reporting success.
3. Update `[vault-location]`: `mode = drive`, the new `drive_folder_id`, and
   `local_path` set to the old path only if Drive for Desktop syncs it.
4. Tell the user the original is untouched and where it is, so they can delete it
   themselves once they're satisfied. **Never delete it.**

### Operation 9: AUTHOR — build a new skill from a plain-English description

Triggers: _"create a skill that…"_, _"make me a skill for…"_, _"I want a skill
to…"_, _"build a skill that…"_, _"teach yourself a new skill"_, _"add a skill
for…"_.

This is how a non-technical user grows their vault: they describe what they want
in plain English and this operation writes a real, runnable skill for them. The
output is a SKILL.md that follows the **DISPATCH contract**, so an authored skill
runs exactly like the shipped starter skills.

#### 1. Clarify only what's missing

Read the user's description first, then ask only for the essentials you can't
infer — two or three short questions, not an interrogation:

- **Name** — derive a `<kebab-name>` from the description and confirm it.
- **Triggers** — the phrases the user will say to invoke it.
- **Reads** — which memory files / connectors / pasted input it needs.
- **Does** — the procedure, in the user's words.
- **Writes** — where output goes (default `/outbox/drafts/`).
- **Authority** — see step 3. Don't ask in jargon; infer it from what the skill
  does and confirm in plain language ("this will only draft, never send — OK?").

#### 2. Draft the SKILL.md (do not write it yet)

Generate the skill body with **exactly these DISPATCH-contract sections**, in
this order, matching the shipped starter skills:

- `## Authority` — the level and what it may / may not touch (see step 3).
- `## When to use` — the trigger phrases.
- `## Memory reads` — which `/memory/*` files it reads (or "none").
- `## Steps` — the numbered procedure.
- `## Memory writes` — what it writes and where.
- `## Reporting block` — the shape of what it reports back.

Frontmatter is `name` (matching the folder) plus a pushy `description` that
lists the trigger phrases. Optionally add `## Failure modes` and `## What this
skill never does` — the strong starters do.

#### 3. Authority — default to L1, escalate only on explicit opt-in

**Default every authored skill to L1** (read + propose: drafts to
`/outbox/drafts/`, memory changes proposed via `/outbox/proposals/`). Keep the
declared authority honest against what the skill actually does:

- Reads mail / calendar and drafts a reply → **L1** (drafting is not sending).
- **Sends** email, posts to Slack, or writes to an external system → **L2**.
  Do NOT author an L2 skill silently. Tell the user it needs send authority, get
  an explicit yes, and record the grant in `CONFIG.md [authority-grants]`.
- Acts autonomously within a standing scope → **L3**, only with an explicit
  `[authority-grants]` entry naming the scope.

When in doubt, author it L1 and say so. A skill that over-claims authority is a
regression.

#### 4. Show, approve, then write

Show the user the full drafted SKILL.md. A new skill is a new capability — get
their go-ahead before it lands. On approval, write it to
`<vault>/skills/<kebab-name>/SKILL.md`. If a skill of that name already exists,
do not overwrite — ask the user to pick a new name or confirm replacing theirs.

#### 5. Validate before declaring done

Re-read the file you wrote and confirm: frontmatter `name` matches the folder
and is kebab-case; `description` is a real sentence; and all six contract
sections above are present. If any are missing, fix the file — never hand the
user a skill DISPATCH can't parse.

#### 6. Register and hand off

Add the skill to `CONFIG.md [skills]` so DISPATCH can find it (same as
`INSTALL_PACK`). Then tell the user how to use it: they can invoke it by
its trigger phrases (DISPATCH) or _"use `<name>`"_ (USE), and if it's a
recurring task, they can make it automatic by typing `/schedule` in the Cowork
task and picking a cadence.

#### Reporting block (AUTHOR)

```
Authored skill: <kebab-name>
Path: <vault>/skills/<kebab-name>/SKILL.md
Authority: <L1 | L2 (granted) | L3 (granted)>
Triggers: <the phrases the user will say>

Try it: "<one example phrase>"
Make it recurring (if scheduled): type /schedule in this task and pick a cadence.
```

### Operation 10 — retired

The realtor pack no longer has its own operation. It is a manifest-driven pack
like any other: `INSTALL_PACK realtor` (Operation 3). Adding a vertical means
adding `resources/packs/<name>/pack.json` — never editing this file.

## Connector wiring (MCP)

Cowork already manages OAuth, tokens, and credential storage for installed
plugins. We never write tokens to the vault, never spin up a local OAuth
callback server, and never store API keys. To enable a connector for a
worker skill we just list it in the generated plugin's `.mcp.json` (if the
user wants to bundle their imported agents as a redistributable plugin) or
direct the user to install the matching connector from Cowork's marketplace
(Customize → Browse plugins).

For each imported worker, match its description against a short keyword
catalog and surface the top 1–3 connectors as suggestions:

- email / inbox / messages → Gmail, Outlook
- calendar / meeting / schedule → Google Calendar, Outlook Calendar
- files / docs / drive → Google Drive, OneDrive, Notion
- chat / channel / DM → Slack, Microsoft Teams
- issues / tickets / sprint → Linear, Jira, GitHub
- tasks / project board / checklist / transaction → Asana, ClickUp, Monday
- CRM / leads / deals / pipeline → Salesforce, HubSpot, Close
- billing / charges / invoices → Stripe
- knowledge base / docs / wiki → Notion, Guru

Surface the match, do _not_ enable anything automatically. The user
explicitly installs each connector inside Cowork. Tell them which marketplace
plugin to grab.

## Risky combination detection

Before suggesting a connector for a worker, evaluate the worker's full
capability set. Flag combinations such as: a worker that reads untrusted
content (email inbox, web fetch, downloads folder, RSS, Slack channels) AND
has authority to send external messages AND has access to credentialed
external services. Surface a plain-language warning that names the specific
attack surface ("A malicious email could instruct this worker to forward
your inbox to an attacker."), require an explicit acknowledgment, and offer
remediations (narrow scope, downgrade authority, cancel).

Log each acknowledgment to `CONFIG.md` under `[risk-acknowledgments]` with
timestamp and the specific combination flagged.

## Normalization Pass

Run on every imported MD file before writing as a skill.

1. **Extract or generate frontmatter.** If the file has no frontmatter, derive
   `name` from the filename (kebab-case) and generate a `description` by
   summarizing the first 500 characters of the body. The description must be
   1–3 sentences, start with a verb, name the trigger context, and include
   at least three phrasings the user might say to invoke it. Be pushy.
   Example: "Drafts client emails in the user's voice based on the contact's
   history. Use whenever the user says 'draft a reply to', 'write to',
   'follow up with', or pastes an inbound message they want to respond to."

2. **Add `when-to-use` triggers** to the body as a bulleted list. Generate
   from body content if missing.

3. **Record an `authority-level`** in the body's metadata block. Default L1.
   Boss skills L1. Read-only workers L0. Skills that send external messages
   L2. Anything destructive L3 plus a per-skill scope grant in `CONFIG.md`.

4. **Wrap body in the standard Skill Template** (see Templates section).

5. **Detect and rewrite cross-skill references.** If the imported text says
   "ask the researcher" or "have the drafter handle this", rewrite as
   `Invoke skill: lead-researcher` (or the appropriate kebab name). Use the
   manifest if available; otherwise best-match against other imports being
   processed in the same run.

6. **Strip Custom GPT export artifacts.** Remove "You are a custom GPT",
   "ChatGPT", "OpenAI", screenshot URLs, "knowledge file" references that no
   longer apply, and conversation-starter bullets unless they map cleanly to
   triggers.

7. **Flag low-confidence outputs.** If description generation, role inference,
   or cross-reference rewriting falls below 0.6 confidence, write a
   `_warnings.md` file alongside the skill listing what needs human review.

## Templates

### Skill template (wrap every imported skill)

```markdown
---
name: <kebab-name>
description: <pushy 1–3 sentence trigger description>
---

# <Skill Name>

## When to use

- <phrasing 1>
- <phrasing 2>

## Authority level

<L0 | L1 | L2 | L3>

## Purpose

<one paragraph>

## Inputs

<what the skill expects to receive or read>

## Steps

<numbered procedure>

## Outputs

<where outputs go: chat, /outbox/drafts, /memory, etc.>

## Sub-skills it can call

<if boss/orchestrator; otherwise omit>

## Memory writes

<what this skill is allowed to write to /memory; default: none>

## Failure modes

<what to do when stuck or uncertain>
```

> The Cowork SKILL.md frontmatter accepts only `name` and `description`.
> Authority level, version, and trigger lists live in the body where the
> model still reads them but Cowork's loader doesn't need to validate them.

### authority-levels.md (write verbatim on INIT)

```markdown
# Authority Levels

L0 SILENT — skill runs without checking in. Reads only. No external sends.
No memory writes.

L1 PROPOSE — skill drafts and waits for user approval before any external
action or memory write. Default for new skills.

L2 SEND — skill can send external messages (email, SMS, API calls that
mutate external state). Every send is logged to /archive/sent/ with
timestamp, recipient, and content.

L3 AUTONOMOUS — skill can take destructive actions (delete files, cancel
calendar events, archive emails) within named scopes only. Requires
explicit per-skill grant in CONFIG.md under [authority-grants].

Default rules:

- All imported skills start at L1.
- Promotion to L2 or L3 requires user confirmation and a logged
  justification in CONFIG.md.
- Demotion to a lower level requires no approval; the user can always
  restrict.
```

### development-constitution.md (write verbatim on INIT)

```markdown
# Development Constitution

## The agent may, without approval:

- Update files in /memory based on confirmed user statements
- Create new entries in /archive
- Propose changes to skills as PRs in /outbox/proposals/
- Read any file in the vault

## The agent must request approval before:

- Modifying any file in /constitution
- Editing or deleting any existing skill
- Creating new top-level directories
- Granting itself a higher authority level
- Calling external APIs that incur cost

## The agent may never:

- Delete files in /archive
- Modify the vault_version field in CONFIG.md directly
- Disable or bypass the conflict scanner
- Send external messages from skills below L2

## Change protocol

Every structural change is logged to /archive/changelog.md with: timestamp,
skill or file affected, summary of change, and reference to the user
approval (chat excerpt or /outbox/proposals/ entry).
```

### CONFIG.md (write on INIT)

```markdown
# Vault Configuration

vault_version: 1.0.0
created: <ISO date>
default_authority: L1

[vault-location]

# Where the vault lives. This decides whether scheduled work runs while

# the user's machine is off — see the Vault-file resolution contract.

# mode: drive | local

mode = drive
drive_folder_id = <id>

# local_path is optional: set only if the folder is also on disk (Google

# Drive for Desktop). Absent is normal and fully supported.

local_path =

[authority-grants]

# skill-name: L2 or L3 with scope

# Example:

# email-sender: L2 scope=outbox/drafts

[scheduled-tasks]

# skill-name: cron expression

# Example:

# morning-briefing: 0 7 \* \* \*

# conflict-scanner: 0 \* \* \* \*

[risk-acknowledgments]

# YYYY-MM-DDTHH:MM:SSZ skill-name: <combination flagged>

[feedback]

worker_url: https://cowork-vault-feedback.michael-ludden.workers.dev
```

### README.md (vault root, write on INIT)

A short walkthrough of the vault layout and the 30 / 90 / 365 minute
experience. Cover: where to put new skills, how to invoke them via Cowork,
how memory works, how to add scheduled tasks, what to do first.

## Reporting block

After every operation, return this format:

```
Operation: <INIT | IMPORT | INSTALL_PACK | UPGRADE | MIGRATE_VAULT>
Vault: <absolute path>
Status: <ok | partial | failed>

Created:
  - <path> (<role/type>)
Skipped:
  - <path> (<reason>)
Warnings:
  - <path>: <issue>

Next suggested action: <one sentence>
```

## Failure modes

- Source folder missing or contains zero MD files — report and ask for a
  different path.
- Existing vault detected during INIT — refuse, suggest UPGRADE.
- Normalization confidence below 0.6 on description or role — write the
  skill but flag in `_warnings.md`.
- Conflicting skill names on import — append `-2`, `-3`, etc. and warn.
- User asks to grant L3 without naming a scope — refuse, ask for the scope
  explicitly.
- Manifest references a file not in the source folder — warn and skip that
  entry.

## Memory writes

This skill is permitted to write to:

- `<vault>/memory/projects.md` (when registering a new project skeleton via
  INSTALL_PACK)
- `<vault>/archive/changelog.md` (after every operation)

It must propose, not silently write, any updates to
`<vault>/memory/preferences.md`, `<vault>/memory/people.md`, or
`<vault>/memory/decisions.md`.
