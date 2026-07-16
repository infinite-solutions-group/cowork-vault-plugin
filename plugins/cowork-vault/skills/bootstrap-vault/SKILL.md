---
name: bootstrap-vault
description: Set up and maintain a Cowork vault. Normalizes a folder of Markdown agent prompts (Custom GPT exports, course skill files, hand-written prompts) into a structured Cowork vault — governance docs, normalized skills, memory layout, scheduled tasks, inbox/outbox routing, and a starter pack so the user has something working in the first thirty minutes. Trigger on phrases like "set up my vault", "scaffold Cowork for me", "install these agents", "I have a folder of GPT prompts", "import my boss and worker agents", "install the starter pack", "upgrade my vault", "create a skill that…" / "make me a skill for…" (authors a new vault skill from a plain-English description), or any time the user references markdown files they want to wire into Cowork.
---

# bootstrap-vault

**Version: 0.7.0** — **The starter pack is complete — all seven skills are
authored:** `email-drafter`, `morning-briefing`, `preferences-updater`,
`downloads-filer`, `session-retrospective`, `conflict-scanner`, and
`project-skeleton` (all L1, all installed by `INSTALL_STARTER_PACK`). **New in
0.7.0: an optional `INSTALL_REALTOR_PACK`** installs three real-estate
transaction skills — `transaction-briefing` (Asana → daily deal brief, L1),
`transaction-emailer` (milestone client emails that always cc the agent, L1), and
`transaction-intake` (files Drive documents → updates Asana → drafts follow-ups,
L2, grant-gated). The
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

## Operations

This skill exposes setup operations (INIT / IMPORT / INSTALL_STARTER_PACK /
INSTALL_REALTOR_PACK / UPGRADE / AUTHOR) plus runtime operations (DISPATCH / USE /
LIST / DOCTOR). Pick
the one that matches the user's intent. If unclear, ask. AUTHOR is the
"build me a skill by asking" operation — it turns a plain-English description
into a runnable vault skill.

### Operation 1: INIT — first-time vault setup

Inputs: optional vault path. Default `$HOME/cowork-vault`.

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
   call INSTALL_STARTER_PACK.
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

### Operation 3: INSTALL_STARTER_PACK

Copies a set of baseline skills into `<vault>/skills/`. Each starter skill
ships as a complete SKILL.md template under this plugin's
`resources/starter-pack/<name>/`. The skill copies them in unmodified.

Do not overwrite existing skills with the same names; if a name collision
occurs, log it and skip that skill (the user has authored their own version).

After copying, update `<vault>/CONFIG.md` `[skills]` section so DISPATCH can
find them.

**Currently shipped:**

1. **email-drafter** (`resources/starter-pack/email-drafter/SKILL.md`) —
   drafts client emails in the user's voice. Reads inbound, matches tone,
   produces a draft in `/outbox/drafts/`. Never sends. L1.
2. **morning-briefing** (`resources/starter-pack/morning-briefing/SKILL.md`) —
   one-page daily brief from calendar + recent mail + memory, written to
   `/outbox/drafts/`. Read-only; never sends. L1. Teaches the user to make it
   recurring via Cowork's `/schedule`.
3. **preferences-updater** (`resources/starter-pack/preferences-updater/SKILL.md`) —
   captures corrections and standing rules from the session and proposes memory
   updates via `/outbox/proposals/`; applies to `/memory/*` only on approval. L1.

4. **downloads-filer** (`resources/starter-pack/downloads-filer/SKILL.md`) —
   sorts loose files in `/inbox/downloads/` into the right `/projects/<name>/`
   subfolder using the registry in `/memory/projects.md`. Moves within the vault
   only, logs every move (reversible), never deletes; flags anything it can't
   confidently place. L1.
5. **session-retrospective** (`resources/starter-pack/session-retrospective/SKILL.md`) —
   scores the session against a fixed 0–100 rubric and proposes concrete
   improvements to `/outbox/proposals/`. Read-only; routes memory items to
   `preferences-updater`. L1.
6. **conflict-scanner** (`resources/starter-pack/conflict-scanner/SKILL.md`) —
   diffs recent instructions against `/memory/preferences.md` and
   `/memory/decisions.md` and flags contradictions to
   `/inbox/handoff/conflicts.md`. Flags only; never reconciles. L1.
7. **project-skeleton** (`resources/starter-pack/project-skeleton/SKILL.md`) —
   scaffolds `/projects/<name>/` (briefs, research, drafts, correspondence,
   contracts) and proposes a `/memory/projects.md` registry entry for approval.
   L1.

The starter pack is complete — all seven skills are authored.

When the user runs INSTALL_STARTER_PACK, install every skill that has an
authored template file (currently all seven), skipping any whose name already
exists in the vault (the user authored their own).

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

After setup, most user requests aren't setup-shaped — they're work-shaped:
_"draft a reply"_, _"research this company"_, _"what's on my plate today"_.
DISPATCH is how bootstrap-vault handles those by **loading a vault skill
and acting as it**.

Triggers: anything that isn't an explicit INIT / IMPORT / INSTALL_STARTER_PACK
/ UPGRADE / LIST / DOCTOR command.

1. **Enumerate available skills.** Read `<vault>/CONFIG.md` `[skills]`
   section (maintained by IMPORT + INSTALL_STARTER_PACK). If the section
   is missing, scan `<vault>/skills/*/SKILL.md`.

2. **Match intent.** Compare the user's request against each skill's
   `description` and `## When to use` triggers. If exactly one matches,
   pick it. If multiple, show the top 2-3 with brief descriptions and
   let the user choose. If none, ask the user what they want to do.

3. **Load the skill.** Read `<vault>/skills/<chosen-name>/SKILL.md`.

4. **Parse the skill's contract.** Look for these sections in the body:
   - `## Authority` — `L0` / `L1` / `L2` / `L3` (default L1 if absent)
   - `## Memory reads` — bulleted list of vault file paths to load
   - `## Memory writes` — bulleted list of vault paths the skill writes,
     optionally with `(L<n>)` qualifiers per path
   - `## Steps` — the procedure to follow

5. **Load memory context.** For each `## Memory reads` entry, read the
   file if it exists. Tolerate missing files. Pull the content into your
   working context so it's available while executing.

6. **Execute the steps.** Follow the skill's `## Steps` section. Use the
   loaded memory as reference. Match the user's prior voice / preferences
   when the skill calls for it.

7. **Honor authority on writes.** For each write attempt:
   - **L0:** refuse any write that isn't `/outbox/drafts/`. Log and stop.
   - **L1:** writes to `/memory/*` route through
     `/outbox/proposals/<task-id>-<file>.md` first; ask the user to
     approve before the actual write. Drafts to `/outbox/drafts/` are
     fine without approval (they're not "applied" until the user sends).
   - **L2:** writes / external sends are allowed; log to
     `/archive/sent/YYYY-MM-DD-<task-id>.md` for the record.
   - **L3:** only within the scope declared in `CONFIG.md`
     `[authority-grants]`. Refuse out-of-scope.

8. **Surface a Reporting Block** as the skill's `## Reporting block`
   section dictates, or the default shape if none.

9. **Append to `/memory/daily.md`** (if `CONFIG.md [daily-log] enabled = true`):
   one line under today's `## YYYY-MM-DD` heading summarizing what just
   happened ("- Drafted reply to Bob via email-drafter").

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

Walk every SKILL.md and ROUTING.md:

- Verify every referenced skill file exists.
- Verify every `## Memory reads` path is a known vault location.
- Verify every connector mentioned has an installed Cowork plugin.
- Flag any skill below 0.6 description confidence (per `_warnings.md`).
- Report findings as a checklist.

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
`INSTALL_STARTER_PACK`). Then tell the user how to use it: they can invoke it by
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

### Operation 10: INSTALL_REALTOR_PACK — the real-estate transaction skills

An optional vertical pack for a real-estate agent running listings/escrows off an
Asana project. Ships alongside the generic starter pack but is installed only on
request (it is not part of INSTALL_STARTER_PACK). Each skill ships as a complete
SKILL.md under this plugin's `resources/realtor-pack/<name>/`; copy them in
unmodified, skipping any name collision (the user authored their own).

**Ships three skills:**

1. **transaction-briefing** (`resources/realtor-pack/transaction-briefing/`) —
   one-page briefing for a deal from its Asana project: overdue / due-today /
   next-5-days / contingency + closing deadlines. Read-only; writes the brief to
   `/outbox/drafts/`. **L1.**
2. **transaction-emailer** (`resources/realtor-pack/transaction-emailer/`) —
   drafts milestone client emails (inspection confirmation, disclosure reminder,
   appraisal update, repair review, closing note) in the agent's voice, **always
   cc'ing the agent** for visibility. Never sends. **L1.**
3. **transaction-intake** (`resources/realtor-pack/transaction-intake/`) — files
   documents from a Drive folder, marks the matching Asana task received with a
   comment, adjusts downstream dates, and hands a follow-up to
   transaction-emailer. Writes to Asana, so **L2** — it requires a
   `CONFIG.md [authority-grants]` entry and a `[risk-acknowledgments]` entry
   (untrusted-input + external-mutation). Do not install it silently at L2: tell
   the user it changes Asana on their behalf, get an explicit yes, and record the
   grant + acknowledgment. Absent the grant it runs dry-run (report only).

**On install:**

1. Copy the three skill templates into `<vault>/skills/`, skipping name
   collisions, and register them in `CONFIG.md [skills]`.
2. Seed `<vault>/memory/transactions.md` if absent — the deal registry the pack
   reads. Per transaction record: property address, client name + email, the
   **agent_cc** address (the agent's own email, for the mandatory cc), the
   **Asana project id**, the **Drive folder id**, anchor dates (acceptance,
   close), and a **doc-type → Asana-task → follow-up-milestone** map. Write a
   commented template block the user fills in; do not invent a deal.
3. For `transaction-intake`, run its Risk gate before its first Asana write (see
   that skill) and record the grant + acknowledgment in `CONFIG.md`.
4. Point the user at Asana as the connector to install if it isn't already
   present (Customize → Browse plugins), and suggest `/schedule` for the briefing
   (daily) and intake (hourly/daily) sweeps.

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
Operation: <INIT | IMPORT | INSTALL_STARTER_PACK | UPGRADE>
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
  INSTALL_STARTER_PACK)
- `<vault>/archive/changelog.md` (after every operation)

It must propose, not silently write, any updates to
`<vault>/memory/preferences.md`, `<vault>/memory/people.md`, or
`<vault>/memory/decisions.md`.
