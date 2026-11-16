# Teammate app polish plan

Status: accepted, 2026-11-16. The owner accepted the recommendations D1 (b), D2 (a) and D3 (a),
with every phase in one PR and one commit for each phase. Section 9 records how the build differs
from this draft.
Scope: the teammate app (`/feedback/{id}`): the shell, Requests (list and detail), Conversations
and Tickets (list, thread, side panel), Roadmap, Changelog, Triage, Insights, Members and the
settings shell. The settings forms themselves are out of scope.
Baseline: `cb911af4` (`staging` after PR #184 and PR #185).

This plan follows [the portal polish plan](userjot-polish-plan.md). The layout target is unchanged:
[the teammate app design](teammate-app-design.md), with the UserJot dashboard as the owner's layout
benchmark. The UserJot admin needs an account, so this plan measures the Kaneo app against that
design and against its own patterns, not against UserJot pages. The scope rule of the earlier plans
applies: change Quills paths only, add no theme token, and follow rules C19 and C24. A change that
needs a Kaneo file is a decision (section 4).

## 1. Method

1. Run the seeded demo stack and sign in as the demo teammate.
2. Take screenshots of 20 routes at 1440 px, in light and dark, and of the request list, a request
   and a conversation on an iPhone 13 (390 × 664).
3. On each route, record the `h1` and `main` counts, horizontal overflow and runtime errors.
4. Measure text sizes, contrast and alignment with `getComputedStyle` in the same browser.

All 20 routes have one `h1` and one `main`, with no horizontal page overflow and no runtime errors.

## 2. Where we stand

The structure matches the design: the icon rail with a sidebar for each section, the two- and
three-pane inboxes, the floating action bar, the chips, the merge palette and keyboard navigation.
PR #185 made the conversation side panel into collapsible sections. The gap is finish: the type is
small, rows are noisy and unaligned, the three side panels use three styles, and a few details are
broken.

| Measure (1440 px, light) | Value |
|---|---|
| Root font size (`index.css:455`, 90% at `md` and up) | 14.4 px |
| Text in the request list at 10.8 px (`text-xs`) | 408 elements |
| Text in the request list at 12.6 px (`text-sm`) | 53 elements |
| Left edge of the vote pill, first 16 request rows | 1131 px to 1219 px (88 px drift) |
| Roadmap column names that pass 4.5:1 contrast | 1 of 6 (Closed) |

## 3. Findings

### T1. The type is small

The teammate shell runs at 90% scale (`bd1c4df7`). Request titles, bubbles and panel values are
12.6 px. Dates, counts, authors, group labels, badges and the lines under each bubble are 10.8 px.
That is below the 11 to 12 px floor most products use for text people read. See decision D1.

### T2. The board chip is cut off mid-word

`ui/inbox/request-row.tsx:135` puts `truncate` on an `inline-flex` span. The board name is a flex
item, so it is clipped with no ellipsis: "ENTERPRISE REQUE".

### T3. The row metadata does not line up

Votes, comments, board, date and author sit in one flex row. The start of the group moves with the
width of the board name, so the vote pills drift by 88 px down the list. A list you scan by numbers
needs fixed columns.

### T4. Zero counts add noise

Every new request shows a "0" comment pill. The vote count is the main signal; a zero comment
count is not.

### T5. Roadmap column names fail contrast

`pages/team-roadmap/parts/roadmap-column.tsx:79` colors the status name with the workspace status
color. On white: Under Review 1.9:1, Complete 2.3:1, In Progress 2.8:1, Open 3.7:1, Planned 4.0:1.
Only Closed (4.8:1) passes. The portal already keeps the color in the icon and the name in the
text color.

### T6. The roadmap board has no edge and always shows its drag handles

The fourth column is cut at the right edge with no cue that the board scrolls. The column drag
handles show at all times, beside the add and AI buttons.

### T7. The assignee in conversation and ticket rows is a bare dot

`ui/inbox/conversation-row.tsx:80` renders the assignee as a small avatar with
`initials={false}`. With no photo it is a pale dot that reads as a status light, not a person. The
row's subject and preview also run together on one line, set apart only by color.

### T8. Ticket badges and the ticket header

The ticket stage badges ("Escalated", "Investigating", "New") are tiny outlined labels with no
color meaning. In the ticket header the title is cut at about 150 px while the header has room.

### T9. The changelog list looks like no other list

The changelog uses full-width bordered rows, larger titles and no metadata. Requests, conversations
and tickets use rounded rows with a status icon and right-aligned metadata.

### T10. Insights shows raw dates and a narrow page

Insights shows ISO dates ("2026-10-12") and a plain table for the weekly trend. It sits in a
centered column, unlike the other full-width pages.

### T11. The settings title gets a focus box

`ui/page-frame.tsx:65` makes an embedded Kaneo `h1` focusable and focuses it on load, but does
not hide the outline. The settings pages show a rectangle around "Account".

### T12. Three side panels, three styles

The conversation panel (PR #185) has collapsible sections, label and value rows, and quiet "+"
actions. The request panel ("Demand", "RICE score", "Tasks") uses another layout, and its
importance line wraps mid-phrase ("0 nice to have · 1 important · 2 blocker"). The ticket panel
uses bordered selects and plain lines ("No watchers yet.", "No links yet.").

### T13. On a phone the action bar covers the composer

On the request detail at 390 px, the floating action bar covers the comment box's send button.
The header actions wrap to a second row, and "New request" wraps to its own line under the
search.

### T14. Empty states are inconsistent

Main panes use `StateView` with an icon. Panels and the member page use bare lines, or nothing at
all: the member page's "Traits" heading has no content under it.

## 4. Decisions for the owner

Each decision has a recommendation. The plan uses it until the owner says otherwise.

- **D1. Type scale.** (a) Keep 90%, and move the meta text people read (dates, authors, counts)
  from `text-xs` to `text-sm` in Quills components; hierarchy then comes from color and weight.
  (b) Set the shell to 95% (`index.css:455`): `text-sm` becomes 13.3 px and `text-xs` 11.4 px,
  close to the density of Linear-style apps. (c) Remove the scale (100%). (b) and (c) are a
  one-line Kaneo edit and reverse part of the owner's choice in `bd1c4df7`. Recommend (b): it
  fixes every text size at once and keeps most of the density.
- **D2. Zero comment counts.** (a) Hide the comment pill at 0 and keep the column slot empty.
  (b) Show it. Recommend (a). The vote pill stays at 0, because votes are the main signal.
- **D3. Insights trend.** (a) Keep the table, with localized dates. (b) Add a small bar chart
  of posts and votes for each week above the table. Recommend (a) now and (b) as a follow-up; the
  table stays as the accessible version either way.

## 5. Plan

One PR against `staging`, one commit for each phase. Phase 1 gives the most fixes for the least
code.

### Phase 0: baseline

1. Capture the method in section 1 and keep the section 2 values.
   → verify: the same 20 routes, with one `h1` and one `main`, no overflow and no errors.

### Phase 1: correctness and accessibility (T2, T5, T7, T11, T13)

1. T2: the board name gets its own `truncate` span inside the chip.
   → verify: a long board name ends with "…" in the request list.
2. T5: roadmap column names use the text color. The status color stays in the icon.
   → verify: every column name passes 4.5:1 in light and dark.
3. T7: the assignee mini avatar shows initials (or the photo) at a size that fits them, with the
   assignee's name as its tooltip. The subject and the preview get a separator.
   → verify: `conversation-row` test; no row shows a bare dot.
4. T11: `PageFrame` adds `outline-none` to an `h1` it makes focusable.
   → verify: no focus box on the settings title after load; keyboard focus still moves to it.
5. T13: the request detail reserves room for the action bar under `sm`, and the header actions
   become one icon row.
   → verify: at 390 px the comment box's send button is fully visible and clickable.

### Phase 2: type scale (T1, D1)

1. Apply D1. Then check the three-pane layouts at 1280 px and the sidebar at its narrowest.
   → verify: no meta text below 11 px in the request list; no new overflow or truncated header at
   1280 px.

### Phase 3: lists (T3, T4, T8, T9)

1. T3: the request row's metadata becomes fixed-width slots (votes, comments, board, date,
   author), aligned to the right.
   → verify: the vote pills of the first 16 rows share one left edge.
2. T4: apply D2.
   → verify: `request-row` test; a request with no comments shows no "0".
3. T8: ticket stage badges use the `Badge` variants by stage (new, in progress, waiting, done).
   The ticket header title takes the free width.
   → verify: `ticket-list` test; the header title is not cut at 1440 px.
4. T9: the changelog list uses the shared row: a state icon (draft, scheduled, published), the
   title, then the author and the date in the right-hand columns.
   → verify: `team-changelog` tests; the list matches the request rows in both themes.

### Phase 4: side panels and empty states (T12, T14)

1. T12: the request and ticket panels use the section pattern of the conversation panel:
   collapsible sections, label and value rows, quiet "+" actions in place of bordered selects
   where a value is empty. Importance becomes three small counts.
   → verify: the three panels look alike in both themes; existing panel tests pass with their
   accessible names.
2. T14: panel sections use one muted empty line with an action where there is one ("Add a
   watcher"). The member page shows "No traits yet".
   → verify: the empty-state screenshots match across panels.

### Phase 5: pages (T6, T10)

1. T6: the roadmap board gets an edge fade on the side that scrolls (Tailwind `mask-x-*`). Drag
   handles show on hover and focus.
   → verify: at 1440 px the cut column fades; the handles still work with the keyboard.
2. T10: Insights uses localized short dates and the full-width page layout. Apply D3.
   → verify: `weekly-trend` test expects a localized date.

## 6. Success criteria

1. Each finding T1 to T14 is fixed, or listed as skipped with its decision.
2. Every roadmap column name passes 4.5:1. No board chip is cut without an ellipsis. The vote
   pills of one list share a left edge.
3. No text people read is below 11 px, if D1 (b) or (c) is accepted.
4. `vp test run` (apps/web), the app type check, `vp check`, `node scripts/quills-web/cli.mjs
   check` and `pnpm i18n:check` pass.
5. The Phase 0 screenshots, taken again, show the intended changes only, with one `h1` and one
   `main` on each route and no overflow, at 1440 px and 390 px, in light and dark.
6. `git diff --name-only staging` lists only Quills paths, plus `index.css` if D1 (b) or (c) is
   accepted, in its own commit.

## 7. Out of scope

- Features from Phase C of [the requests parity plan](requests-ui-parity.md): comment
  attachments, speech input, a source line and team-chosen board colors.
- The settings forms, the Overview page layout, and Kaneo's own pages.
- Notification subscriptions per view (no API).

## 8. Risks

- D1 (b) or (c) makes every teammate page about 5% or 11% larger. The three-pane request and
  conversation views are the tightest; check them at 1280 px before the merge.
- Fixed metadata columns (T3) need widths that fit long board names and large counts. Keep the
  board column truncating, and use `tabular-nums` for counts.
- The panel rework (T12) touches components that #185 just changed. Build on its section
  component; do not fork it.

## 9. Implementation notes

All phases ship in one PR, one commit for each phase. The scale change (D1) is its own commit,
because it is the only Kaneo file. These points differ from the draft above.

1. **Header wrapping (Phase 1, T13).** The detail header still wraps. On a phone the back label
   truncates and the gaps are tighter, so a request header fits one row; the action bar shows
   icons with screen-reader labels. The draft's "reserve room for the action bar" was not needed:
   the bar is sticky, so content scrolls clear of it at the end.
2. **Separator (Phase 1, T7).** The subject and preview separator is a CSS `::before` dot, so it
   is not text that rule C3 asks to translate. The assignee avatar is 20 px with initials.
3. **Columns (Phase 3, T3).** The counts are right-aligned in their slots, as numbers in a column
   should be. Their left edges differ only by digit width (7 px across the first 16 rows; it was
   88 px). The right edges line up.
4. **Ticket tones (Phase 3, T8).** Tickets have three status categories, not four stages: open
   is info, pending is a warning and closed is a success.
5. **Changelog author (Phase 3, T9).** The entry list API already returned the author, so the
   row shows it with no API change.
6. **Panels (Phase 4, T12).** `PropertySelect` moves from the conversation page to `ui/inbox`,
   and the ticket panel uses it. `TicketSelect`, a bordered copy, is removed. Two copy keys that
   only the old layout used are removed (`team-post.duplicates`, `team-post.importanceCounts`).
7. **Title room (Phase 4).** The 95% scale left a ticket title only a few letters wide at 1440 px.
   A header title now keeps at least 12rem; with less room, the actions move to a second row.
8. **Insights (Phase 5, T10).** The content keeps its 4xl width but starts at the left. A new
   `calendarDate` helper formats date-only values in UTC.

Verification evidence is in the pull request description.
