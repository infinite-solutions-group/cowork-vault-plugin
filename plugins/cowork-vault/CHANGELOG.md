# Changelog

All notable changes to the Cowork Vault plugin. Format roughly follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.7.0] — 2026-07-12

### Added

- **`INSTALL_REALTOR_PACK` — an optional real-estate transaction vertical.**
  A new bootstrap-vault operation (Operation 10) that installs three skills for
  an agent running listings/escrows off an Asana project. Shipped separately from
  the generic starter pack (installed only on request), under
  `resources/realtor-pack/`:
  - **`transaction-briefing`** (L1) — one-page deal briefing from the listing's
    Asana project: overdue / due-today / next-5-days / contingency + closing
    deadlines. Read-only; writes the brief to `/outbox/drafts/`; teaches
    `/schedule` for a daily run.
  - **`transaction-emailer`** (L1) — drafts milestone client emails (inspection
    confirmation, disclosure reminder, appraisal update, repair review, closing
    note) in the agent's voice, **always cc'ing the agent** for visibility. Never
    sends. Carries an inline milestone-template catalog.
  - **`transaction-intake`** (**L2**) — files documents from a Drive folder,
    marks the matching Asana task received with a comment, adjusts downstream
    dates, and hands a follow-up to `transaction-emailer`. Writes to Asana, so it
    is grant-gated: requires `CONFIG.md [authority-grants]` + a
    `[risk-acknowledgments]` entry (untrusted-input + external-mutation), runs
    dry-run without the grant, never deletes, never sends, and treats document
    contents as data (not instructions).
- Seeds a `/memory/transactions.md` deal registry (address, client, **agent_cc**,
  Asana project id, Drive folder id, anchor dates, doc-type→task→milestone map)
  that all three skills read.
- Added **Asana** (tasks / project board / checklist / transaction) to the
  connector suggestion catalog and DOCTOR keyword map.
- `plugin-validator` now covers the realtor-pack skills (frontmatter + DISPATCH
  contract sections), allowing L2 where the skill legitimately writes externally.

## [0.6.0] — 2026-07-01

### Added

The starter pack is now **complete** — the four remaining designed skills are
authored, so `INSTALL_STARTER_PACK` ships all seven. All L1, all following the
DISPATCH contract, all covered by `plugin-validator` tests.

- **`downloads-filer`** — sorts loose files in `/inbox/downloads/` into the
  right `/projects/<name>/` subfolder using the `/memory/projects.md` registry.
  Moves within the vault only, logs every move to `/archive/changelog.md`
  (reversible), never deletes, and leaves anything it can't confidently place
  in place and flagged. Schedule-friendly.
- **`session-retrospective`** — scores the session against a fixed 0–100 rubric
  (goal fit, correctness, preference fit, efficiency, memory hygiene) and
  proposes concrete, dimension-linked improvements to `/outbox/proposals/`.
  Routes memory items to `preferences-updater` and skill ideas to AUTHOR.
- **`conflict-scanner`** — diffs recent standing-rule instructions against
  `/memory/preferences.md` and `/memory/decisions.md`, flagging reversals,
  scoped exceptions, and stale rules to `/inbox/handoff/conflicts.md`. Flags
  only; resolution stays the user's call (applied via `preferences-updater`).
- **`project-skeleton`** — scaffolds `/projects/<name>/` (briefs, research,
  drafts, correspondence, contracts) immediately and proposes the
  `/memory/projects.md` registry entry for approval (honoring the L1 memory
  write contract).

## [0.5.0] — 2026-07-01

### Added

- **AUTHOR operation — the "skills builder."** A user can now grow their vault
  by asking: _"make me a skill that files receipts."_ `bootstrap-vault` reads
  the request, asks only for the essentials it can't infer, drafts a SKILL.md
  that follows the **DISPATCH contract** (`## Authority` / `When to use` /
  `Memory reads` / `Steps` / `Memory writes` / `Reporting block`), shows it for
  approval, writes it to `<vault>/skills/<name>/SKILL.md`, validates it, and
  registers it in `CONFIG.md [skills]`. Authored skills **default to L1** and
  escalate to L2/L3 only on explicit opt-in recorded in `[authority-grants]` —
  so "build me a skill" can't silently create something that sends mail. This
  makes the product self-extending for non-technical users: no code, no plugin
  rebuild, just a conversation.
- Wired AUTHOR into the operations overview, the "When to use" triggers, and the
  skill's frontmatter description so Cowork routes "create a skill that…"
  requests to it.
- `plugin-validator` now tests the AUTHOR operation against the same
  `REQUIRED_SECTIONS` the shipped skills are validated by — keeping the
  generator's spec in sync with the runtime contract.

## [0.4.0] — 2026-07-01

### Added

- **`preferences-updater` starter skill** — the memory writer that closes the
  automatic-capture gap (ARCHITECTURE.md §12 / D-11). It scans a session for
  durable preferences, corrections, and new facts, classifies each into the
  right memory file (`preferences` / `people` / `projects` / `decisions`),
  dedupes against what's already stored, and writes a before/after **proposal**
  to `/outbox/proposals/`. It applies changes to `/memory/*` **only after the
  user explicitly approves** — never a silent edit, honoring the L1 write
  contract (`bootstrap-vault` SKILL.md: L1 `/memory/*` writes route through
  `/outbox/proposals/<task-id>-<file>.md`). Conservative by design: captures
  only things stated as standing truth, never inferred or one-off details.
- Promoted `preferences-updater` from "planned" to "shipped" in
  `bootstrap-vault`; `INSTALL_STARTER_PACK` now installs it alongside
  `email-drafter` and `morning-briefing`.

## [0.3.0] — 2026-07-01

### Added

- **`morning-briefing` starter skill.** A one-page daily brief assembled
  from the user's calendar, recent inbound mail, and vault memory
  (`people.md` for stakeholder context, `projects.md` for next steps,
  `preferences.md` for tone/length), written to
  `/outbox/drafts/briefing-<date>.md`. Strictly L1 and read-only against
  calendar and mail — it never sends, replies, or mutates the inbox or
  calendar. It is authored to run unattended and closes with the one step
  to automate it: **type `/schedule` in the Cowork task and pick a daily
  cadence.** This is how a scheduled skill becomes recurring — Cowork's
  native scheduler runs it, no external tooling required (see
  `ARCHITECTURE.md` §13 / D-12).
- Promoted `morning-briefing` from "planned" to "shipped" in
  `bootstrap-vault`; `INSTALL_STARTER_PACK` now installs it alongside
  `email-drafter`.
- Starter-pack skills are now covered by `@cowork-vault/plugin-validator`
  tests: each must have valid frontmatter, the DISPATCH contract sections
  (`## Authority`, `## When to use`, `## Steps`, `## Memory reads`,
  `## Memory writes`, `## Reporting block`), and declare L1 authority.

## [0.2.4] — 2026-05-12

### Fixed

- **`email-drafter` no longer composes the draft in chat and then asks
  permission to put it in Gmail.** Reported behavior in v0.2.3: Claude
  streamed the draft body inline first, then asked "should I create this
  as a Gmail draft?" That treats `create_draft` as L2 when it is L1
  (saving to Drafts is not sending). Fix:
  - Authority section now explicitly states `create_draft` is L1 and
    forbids the "should I put this in Gmail?" follow-up question.
  - Steps 5 + 6 merged into a single "compose and save in one motion"
    step. The model composes internally, calls `create_draft` directly,
    THEN surfaces the saved draft for review.
  - Review step now shows the FULL body verbatim (was: first 2-3
    sentences) and asks one question: "Want to update anything?" — not
    "should I save this?" or "should I put this in Gmail?"
  - Added Step 7: edits update the same draft in place via
    `update_draft`, rather than creating a new draft per revision.

## [0.2.3] — 2026-05-11

### Added

- **Live feedback Worker URL baked in.** `submit-feedback` skill now
  points at the deployed Cloudflare Worker at
  `https://cowork-vault-feedback.michael-ludden.workers.dev` and the
  bundled `CONFIG.md` template includes the URL under `[feedback]
worker_url`. Users no longer need to configure anything to send
  feedback — they just say "report a bug" and Claude POSTs the issue.

## [0.2.2] — 2026-05-11

### Fixed

- **INIT no longer refuses on pre-existing vaults.** Old behavior was
  "refuse outright; user is stranded." New: if the path contains a
  valid `CONFIG.md`, skip scaffolding and instead check which starter
  skills are missing — offer to install just those. Users who already
  have a vault but never got the starter pack can now run INIT and
  pick up new starters as they ship.
- **`email-drafter` skill no longer streams the draft inline.** The
  previous version's "save the draft" instruction was advisory; Claude
  treated it as optional. Now imperative: the draft MUST be saved to
  the user's mail connector's Drafts folder (preferred) or to
  `<vault>/outbox/drafts/` (fallback) BEFORE any preview is shown.
- **`email-drafter` skill now actively looks for the user's mail
  connector** before falling back to "paste reference emails." Previous
  wording ("if connectors are available") was too soft — Claude
  assumed not-available without checking its toolbelt.

## [0.2.1] — 2026-05-11

### Fixed

(superseded by 0.2.2)

## [0.2.0] — 2026-05-11

### Added

- **DISPATCH / USE / LIST / DOCTOR runtime operations** in
  `bootstrap-vault`. The plugin is no longer setup-only — once your
  vault is populated, bootstrap-vault dispatches everyday requests
  ("draft a reply", "research this company") to the matching vault
  skill. See SKILL.md Operations 5-8.
- **`email-drafter` starter skill** — first concrete dispatch target.
  Drafts client emails in the user's voice. Reads memory/people.md,
  preferences.md, projects.md, decisions.md. Writes drafts to
  /outbox/drafts/. L1 authority — never sends, only proposes.
- **`submit-feedback` skill** — beta-period feedback channel. Files
  GitHub issues on the user's behalf via a Cloudflare Worker proxy.
  Users don't need a GitHub account or to leave Cowork. L2 authority
  (sends an external request); always shows the payload + asks for
  approval before sending.
- **Memory contract for vault skills**: each SKILL.md declares
  `## Authority`, `## Memory reads`, and `## Memory writes`. DISPATCH
  enforces authority on writes (L0 refuses; L1 routes /memory/\* writes
  through /outbox/proposals/ for user approval; L2 logs to
  /archive/sent/; L3 honors CONFIG.md scope grants).
- **CLI-first IMPORT path** — bootstrap-vault now prefers shelling out
  to `cowork-transformer` (the deterministic CLI) over LLM-driven
  step-by-step normalization. Inline LLM repair handles malformed
  inputs the CLI flags.

### Changed

- INSTALL_STARTER_PACK now lists only the skills whose templates
  actually ship (`email-drafter` for v0.2.0). The remaining five
  starter skills (preferences-updater, morning-briefing, downloads-filer,
  session-retrospective, conflict-scanner, project-skeleton) are
  documented as "planned" but not yet authored — INSTALL_STARTER_PACK
  reports which ones are coming in future releases.

### License

- Plugin license is Apache 2.0 (was MIT-leaning per PRD §13 D-6).
  Adds an explicit patent grant over MIT.

## [0.1.0] — initial release

- INIT — first-time vault scaffold
- IMPORT — normalize a folder of markdown agent prompts into vault skills
- INSTALL_STARTER_PACK — placeholder (no starter skills authored yet)
- UPGRADE — diff governance + starter templates against latest, apply
  approved changes only
