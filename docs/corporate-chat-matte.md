# Corporate Chat — Architectural Matte (Linear-inspired refinement)

Status: **built on the `redesign` branch, awaiting owner approval. Not on `main`.**

## What changed
- **Matte finish.** Chat now sits in the same workstation root as every other page (`FinishScope`), so it gets
  the approved matte tokens and the champagne light. Navigation is a quiet translucent tone, the matter list a
  slightly lighter inbox surface, the conversation sits on the canvas where the light reaches it.
  A / B / C for comparison: `/admin/communication?finish=pure|arch|atmos` (B is the default).
- **Three sections by default.** Hexa Room rail · chat navigation · list · conversation. The record panel is
  closed by default and opens with **Details** (or `D`); `Esc` closes it.
- **Workspace modes** (remembered per browser; `1` `2` `3` or the three icons beside the list title):
  Inbox (the list fills the workspace; opening an item switches to Conversation), Conversation (default),
  Focus (navigation, list and Hexa Room hidden; the conversation centred).
- **Navigation.** Inbox · Assigned to me · Mentions · Drafts; Matters (All open · Awaiting client · Awaiting
  approval, plus saved views); Internal channels and External channels as separate collapsible groups;
  Direct messages. Group conversations are not supported by the current data model.
- **List.** Continuous rows without avatar stacks or priority marks; titles wrap to two lines; each row shows
  status, title, entity or fund, due date when set, and time. The Owner, Status, Label, Linked, External,
  Group and Sort controls are consolidated into one **Filter** popover; active filters show as removable tags.
  Saved views, search and keyboard navigation are unchanged.
- **Conversation header.** Title (wraps), reference and entity beneath, then only Status and Owner, plus Due
  when set and Priority when High or Urgent. Everything else (priority, due, reference, labels, linked record,
  people, files, related matters) is in Details; the Matter section there opens the same editors.
- **Activity stream.** Unchanged in substance: messages, replies, attachments, status, assignment and approval
  events are one chronological stream; system events stay smaller and quieter than messages.
- **Composer.** One line that grows with the text (up to ~8 lines). Attach, mention, reference and command
  stay visible as quiet icons; Send is neutral and fills only when there is something to send.
- **Communication vs matters.** Channels and direct messages carry no status, owner or deadline; matters keep
  their structured properties, approvals (four-eyes) and linked records. Sending a message never approves or
  executes anything; Approve / Reject remain explicit buttons with the existing permission checks.
- **Shortcuts added:** `D` details, `O` open the linked record, `1` `2` `3` layout. Existing shortcuts unchanged
  (Ctrl K, C, J/K, Enter, E, S, A, P, R, /, G I, G M, Esc, ?). The `?` sheet lists them.
- **Mobile.** Sequential: list → conversation (back arrow) → Details as a drawer.

## Accessibility
Same matte tokens as the approved workstation (all text levels ≥ 4.5:1 in both themes; see
`docs/architectural-matte.md`). Layout switch is a radiogroup with labels including its key; Details is a
toggle button with `aria-pressed`; hover-only nothing — all controls are visible or reachable by keyboard.
Motion: the record panel slides in (transform/opacity, reduced-motion respected).

## Files
`src/components/chat/CorporateChat.tsx` (modes, keys, matte root, Details closed by default),
`context.tsx` (ChatMode), `ModeSwitch.tsx` (new), `ListPane.tsx` (Filter popover, rows),
`Detail.tsx` (header), `Rail.tsx` (Matter section, open-record hook), `Composer.tsx`, `Sidebar.tsx`,
`Dialogs.tsx` (shortcut sheet), `src/components/shell/FinishScope.tsx` (className prop), `src/app/globals.css`.

## Not yet supported
Resizable panels (widths are fixed per mode), group direct messages, drafts beyond the existing Drafts view.
