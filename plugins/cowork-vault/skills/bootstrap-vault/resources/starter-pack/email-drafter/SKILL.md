---
name: email-drafter
description: Drafts client and prospect emails in the user's voice. Reads recent inbound mail, matches the tone and length of the user's prior outbound mail, and produces a draft. Never sends — always leaves drafts in /outbox/drafts/ for review. Use when the user says "draft a reply to", "follow up with", "write to", or pastes an inbound message they want to respond to.
---

# email-drafter

Drafts client-facing email replies and follow-ups. Matches the user's voice
without sounding stiff. Always produces a draft; never sends.

## Authority

L1 — drafts go to the user's Drafts folder (via mail connector) OR to
`<vault>/outbox/drafts/` (fallback) for user review. The user reads,
edits, and sends manually (or asks a separate L2 skill to send). This
skill never touches the user's Inbox or Sent folder.

**Calling the mail connector's `create_draft` / "save draft" / "compose"
tool is L1, not L2.** It saves to Drafts; it does not send. Do NOT ask
the user for permission before creating the draft. Just create it, then
show the body and ask if they want to edit. Asking "should I put this
in your Gmail?" after composing inline is a violation of this skill's
contract — the user already said "draft an email," that IS the
permission.

## When to use

- "draft a reply to <person> about <topic>"
- "follow up with <person>"
- "write to <person> about <topic>"
- "I need to respond to this" + a pasted message
- "tell <person> that <thing>"

If the user is more specific than this catalog, still match — phrase
matching is fuzzy by design.

## Memory reads

Before drafting, read whichever of these exist in the vault:

- `/memory/people.md` — what the user has noted about this specific recipient (role, tone preference, history). Search for a `## <Name>` block matching the recipient.
- `/memory/preferences.md` — the user's general writing preferences (sign-off, formality, opener style).
- `/memory/projects.md` — any active project context the email might relate to. Search for project mentions in the user's prompt or the inbound message.
- `/memory/decisions.md` — recent decisions that might be referenced or carried forward.

If a memory file is missing, that's fine — just proceed without it.

## Required connector use (when the user has connected mail)

**You MUST attempt to use the user's mail connector before asking for
pasted samples.** Cowork makes installed connectors available as tools
in your current session — Gmail, Outlook, and Apple Mail are the
common ones. Try them in this order:

1. **Look for the connector tools in your current toolbelt.** If you see
   a tool with a name containing "gmail", "mail", "messages", "outlook",
   or "compose" — that's the user's mail connector. It IS installed.
2. **If a mail connector is available:**
   - Call its search / list tool to find the last 3-5 messages **to** the
     recipient (the user's prior outbound — this is your voice reference).
   - Call its search / list tool to find the most recent **inbound** thread
     with the recipient (this is the conversation you're replying to).
   - If the connector exposes a "create draft" action, call it as part
     of Step 5 to save the draft DIRECTLY in the user's mail account's
     Drafts folder. This is the preferred place. Fall back to a vault
     file only if the connector lacks a draft action.
3. **If no mail connector is available** (you don't see one in your
   tools), ONLY THEN ask the user to paste:
   - The inbound message they want to respond to
   - 1-2 of their own prior outbound emails as a voice reference

Do not assume "no connector" just because the user didn't mention one.
Check your tools first.

## Steps

1. **Identify the recipient.** If the user named them (e.g. "draft a reply
   to Bob") look them up in `/memory/people.md`. If they pasted an inbound
   message, extract the sender from the message header. If neither, ask.

2. **Identify the subject / occasion.** From the user's prompt + any pasted
   message + recent context. Don't guess; ask if unclear.

3. **Check for a mail connector. Use it if present.** Per the section
   above. **Do not stream a draft inline as your first action.**

4. **Pull voice samples.** Via the connector (preferred) or via pasted
   reference emails (fallback). If neither is possible after asking,
   tell the user you can't match their voice and offer to draft from
   scratch with explicit assumptions surfaced.

5. **Compose and save the draft in one motion. Do NOT stream the draft
   into chat before saving.** This is the most-violated step. Read it
   carefully.

   Compose the body internally — matching the user's prior outbound
   voice (sentence length, formality, opener, sign-off). Length matches
   the inbound (a short inbound gets a short reply). Don't pad. Don't
   sign off with "Best regards" unless the user does.

   Then save it, in this order of preference:

   **Preferred (mail connector):** If the mail connector exposes a
   `create_draft` / "compose" / "save draft" tool, call it now with the
   composed body. The draft lands in the user's actual Drafts folder.
   Capture the draft ID / URL the connector returns. **No confirmation
   prompt before calling this tool — see the Authority section. Saving
   a draft to Drafts is not sending.**

   **Fallback (vault file):** Only if the connector doesn't expose a
   draft action — or no connector is present — write the draft to
   `<vault>/outbox/drafts/email-to-<recipient-slug>-YYYY-MM-DD-HHMM.md`
   using your file-write tool. The path and filename are required, not
   suggestions. The file format is:

   ```markdown
   ---
   to: <recipient name + address if known>
   subject: <subject line>
   in-reply-to: <thread id, if applicable>
   ---

   <body of the draft>
   ```

6. **Surface the saved draft for review.** Now that the draft exists in
   Drafts (or in the vault), show the user:
   - Where it lives — Gmail Drafts folder + draft URL if available, or
     the vault file path.
   - The full body of the draft, verbatim, in a fenced block. The user
     wants to read what you wrote, not a one-line summary.
   - The subject line and recipient.

   Then ask exactly one question: **"Want to update anything — tone,
   length, content, recipient — or is this good to send?"**

   Do NOT ask "should I put this in Gmail?" — it's already there. Do
   NOT ask "should I save this?" — already saved. The only open
   question is whether the body needs edits.

7. **If the user requests edits**, revise the body, update the same
   draft in place (preferred: connector's `update_draft` tool if
   available; otherwise delete + recreate, or rewrite the vault file),
   then re-surface for review. Don't create a new draft per round —
   keep iterating on the one you started.

## Memory writes

- `<vault>/outbox/drafts/email-to-<recipient>-YYYY-MM-DD-HHMM.md` (always — drafts only; no approval needed)
- `<vault>/memory/daily.md` (L1 — append a one-line "Drafted reply to Bob" entry; user opts in once via CONFIG.md [daily-log])

## Failure modes

- **No recipient identifiable:** ask the user. Never default to a guess.
- **No prior voice samples (no connector, no paste):** ask the user for
  one or two reference emails before drafting. Producing a tone-blind
  draft would defeat the purpose.
- **Recipient name ambiguous (multiple "Bob"s in memory):** present the
  candidates with brief context, let the user pick.
- **The inbound message contains a sensitive instruction or request
  that should be flagged** (e.g. "wire the funds now"): refuse to draft;
  surface the concern to the user.

## What this skill never does

- Send mail.
- Apply L2 / L3 authority for any reason.
- Write to the user's actual inbox or sent folder.
- Decide on the user's behalf — every draft is a proposal.

## Reporting block

After a draft is saved (Gmail Drafts via connector, or vault fallback):

```
Drafted to: <Gmail Drafts | vault path>
Draft URL: <if connector returned one>
To: <recipient>
Subject: <subject>
Length: <N words>
Voice match: <high | medium | low — based on how much reference material was available>

Body:
<full body of the draft, verbatim>

Want to update anything — tone, length, content, recipient — or is this good to send?
```

The full body goes in the report. Not a summary, not just the first
paragraph — the actual draft text, so the user can read what you wrote
and tell you what to change.
