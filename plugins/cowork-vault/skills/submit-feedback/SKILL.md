---
name: submit-feedback
description: Sends bug reports, feature requests, and general feedback about Cowork Vault directly to the maintainer. Creates a GitHub issue privately on the user's behalf — they don't need a GitHub account or to leave Cowork. Use when the user says "report a bug", "send feedback", "this is broken", "I have a suggestion", "tell the maintainer", or "report this issue".
---

# submit-feedback

The user wants to tell the maintainer something went wrong, something
could be better, or something specific isn't working. This skill captures
their report and files it as a GitHub issue on
`infinite-solutions-group/cowork-vault` via a Cloudflare Worker — the user never
sees or touches GitHub themselves.

## When to use

- "Report a bug in Cowork Vault"
- "Tell the maintainer that X isn't working"
- "I have a suggestion / feature request"
- "Send Mike feedback"
- "File an issue about this"
- "This crashed / didn't work / surprised me"

If the user is just venting or thinking out loud, ask whether they want
to actually file something before invoking this.

## Authority

L2 — sends an external request (HTTPS POST to a Cloudflare Worker).
The Worker creates a GitHub issue. Confirm with the user before sending;
show them the title + body you're about to submit.

## What this skill never does

- Doesn't include vault contents, file paths, skill bodies, or anything
  the user didn't explicitly type. The body is exactly what the user
  approved.
- Doesn't include personally identifying information unless the user
  put it there. If they typed their email, fine; we don't add it.
- Doesn't auto-send. Always shows the user the title + body and waits
  for explicit approval.
- Doesn't send if the user's report is hostile / clearly off-topic.
  Decline politely and offer to redirect.

## Steps

1. **Gather the report.** Ask the user for:
   - A one-line summary (the issue title — max 200 chars)
   - A detailed description (what they tried, what they expected, what
     actually happened; environment if relevant — Mac/Windows/Cowork
     version)
     If they only gave you a short request like "this is broken," ask
     follow-up questions to draw out specifics. A vague report is less
     useful than no report.

2. **Show them what's about to be sent.** Print the title + body
   verbatim. Ask: "Ready to send this to the maintainer?"

3. **On confirmation, POST to the feedback Worker.** The Worker URL is
   `https://cowork-vault-feedback.michael-ludden.workers.dev` (the
   live closed-beta endpoint). The vault's `CONFIG.md` `[feedback]
worker_url` overrides this if present.

   ```sh
   curl -sS -X POST \
     -H "Content-Type: application/json" \
     -H "x-cowork-vault-version: 0.2.3" \
     -d '{"title": "<the title>", "body": "<the body>"}' \
     <WORKER_URL>/v1/report
   ```

   If the request fails entirely (network down, Worker offline), save
   the report to `<vault>/outbox/drafts/feedback-YYYY-MM-DD-HHMM.md`
   and tell the user how to recover.

4. **Parse the response.** On success the Worker returns:

   ```json
   { "url": "https://github.com/infinite-solutions-group/cowork-vault/issues/N", "number": N }
   ```

   Tell the user: _"Filed as issue #N. You can follow up at <url> if you
   want, but the maintainer will see it either way. Thanks for the
   feedback."_

5. **On failure**, fall back gracefully:
   - HTTP 400 (validation): show the Worker's response. Most likely the
     title or body exceeded the length limits — trim and retry.
   - HTTP 502 / network failure: save the report to
     `<vault>/outbox/drafts/feedback-YYYY-MM-DD-HHMM.md` and tell the
     user: _"Couldn't reach the feedback server right now. Saved your
     report locally; try again later or email me at <email if known>."_

## Memory reads

- `<vault>/CONFIG.md` — for the `[feedback]` `worker_url` key.
- `<vault>/memory/preferences.md` — if the user has noted their
  preferred name / contact info, include it in the issue body so the
  maintainer can follow up.

## Memory writes

- `<vault>/archive/sent/feedback-YYYY-MM-DD-HHMM.md` (L2 — always
  written after a successful send; records what was sent and the
  resulting issue URL)
- `<vault>/outbox/drafts/feedback-YYYY-MM-DD-HHMM.md` (L1 — only on
  send failure; user can email manually)

## Reporting block

After a successful send:

```
Sent to the maintainer.
Issue: #<number> — <url>
Title: <title>
Length: <N> chars body

Want to send another, or are you done?
```

After a failure:

```
Couldn't send.
Reason: <HTTP status or network error>
Saved locally: <vault path>

To recover:
  - Try again now (network blip)
  - Email the contents to the maintainer manually
  - Open the saved file at <path> to copy-paste anywhere
```

## Setup note for the maintainer

The Worker URL is baked into this skill (live closed-beta endpoint at
`https://cowork-vault-feedback.michael-ludden.workers.dev`) and into
the bundled CONFIG.md template under `[feedback] worker_url`. To rotate
or point at a different Worker, update both. See
`services/feedback-worker/README.md` for redeploy instructions.
