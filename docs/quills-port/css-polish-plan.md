# Feedback and support CSS polish plan

Status: accepted, 2026-11-16. The owner accepted the recommendations D1 to D6.
Scope: the customer portal (`/portal/{id}`: feedback, roadmap, updates, help, status, support,
tickets) and the teammate app (`/feedback/{id}`).
Baseline: `f4507ec5b` on `feat/ux`.

This plan follows [the portal UI parity pass](portal-ui-parity.md) and
[the teammate app design](teammate-app-design.md). That pass fixed the layout and the features.
This plan fixes the visual details: one vocabulary for pills, labels, radii, type, widths, empty
states, loading and motion.

## 1. Scope rule

- Change only Quills paths: `apps/web/src/quills/**`, `scripts/quills-web/**` and
  `docs/quills-port/**`.
- Do not edit `apps/web/src/index.css` or `apps/web/src/components/**`. They are Kaneo files.
  Thus this plan adds no new theme token.
- Rule C19 forbids a new CSS file, an inline `style` and a color literal. Use the existing
  semantic tokens, the existing utilities and the existing primitives.
- No API, schema or permission change. No data moves. This is a presentation-only plan.

## 2. How the styling works today

1. All Quills styling is Tailwind classes in TSX. 427 TSX files, no Quills CSS file.
2. `index.css` has only two Quills rules (`index.css:449-462`): a 90% root font size for the
   teammate app at `md` and up, and a 1.75 Lucide stroke. `team-shell.tsx:45` sets the
   `data-quills-shell` attribute.
3. Colors come from Kaneo tokens. Raw palette classes are rare (4 uses). Dark mode works through
   the tokens, so only 6 `dark:` variants exist.
4. Portal branding puts the workspace theme variables on the shell container
   (`portal-shell.tsx`). Portalled popups get the same variables through `PortalThemeContext`.
5. The primitives are the Kaneo coss components (Base UI), exported through `ui/upstream.ts`.

The base is sound. The problems are drift and overrides, not architecture.

## 3. Findings

Counts are from a scan of all Quills TSX files (tests and fixtures excluded).

### F1. Dead classes in the Markdown renderer

`markdown-content.tsx:33` uses `prose prose-sm dark:prose-invert`. The repository has no
`@tailwindcss/typography` plugin, so these classes do nothing. The hand-written rules cover only
lists, links, `pre`, `blockquote` and `h2`. Headings `h1` and `h3`, inline code, tables,
`hr`, images and `strong` get no styling. This affects post bodies, help articles and updates.

### F2. Four vote and reaction pills, eight Button overrides

The same pill has four implementations:

- `post-vote-button.tsx:29` (Button, `h-7 min-w-13 rounded-full`)
- `similar-posts.tsx:54` (a `span` copy with a border)
- `reaction-bar.tsx:8` and `comment-reactions.tsx:22` (Button, `h-7` and `h-6`)

13 files fight the Button primitive with `before:hidden`, `shadow-none`, `sm:h-7`,
`sm:text-xs` or `dark:bg-transparent`. Examples: `post-sort.tsx:44`, `board-select.tsx:40`,
`post-sidebar.tsx:35`, `comment-reactions.tsx:20`, `post-vote.tsx:58`,
`article-feedback.tsx:17`. The Button already has `variant="ghost"` and `size="xs"`.

The filter pill `rounded-full bg-muted px-3 py-1 text-xs font-medium` is copied in
`changelog-page.tsx:83` (twice), `roadmap-page.tsx:86` and `share-actions.tsx:52`.

### F3. Three section-label styles

- `board-navigation.tsx:19` and `post-sidebar.tsx:31`: `text-[11px]` uppercase, wide tracking
  (one copy of the other).
- `help-center-home.tsx:90`: `text-xs font-normal text-muted-foreground`.
- `sidebar-nav.tsx` (teammate): `text-xs font-medium text-muted-foreground`.

### F4. Off-scale type sizes

`text-[11px]` (9 uses), `text-[10px]`, `text-[8px]`, `text-[15px]` and `!text-[13px]`.

- `conversation-row.tsx:80`: 8 px initials in a 16 px avatar. Nobody can read them.
- The teammate app scales the root font to 90%. Rem sizes shrink, but px sizes do not. Thus
  `text-[11px]` (`request-row.tsx:128`) is now larger than `text-xs` (10.8 px).
- `changelog-entry.tsx:51` needs `!important` because `page-frame.tsx` styles every `time`,
  `h2` and `h3` inside the page through descendant rules.

### F5. Styling at a distance

Parents style children that they do not render, with descendant selectors such as
`[&_li]:...`. Top files: `conversation-messages.tsx` (21 rules), `markdown-content.tsx` (18),
`status-content.tsx` (16), `post-sidebar.tsx` (11), `portal-navigation.tsx` (8),
`portal-shell.tsx` (8). These rules are hard to read, and they cause the `!important` fight
in F4.

### F6. The customer and the teammate see two different conversation designs

- Teammate thread: `MessageBubble`, `DateSeparator`, `SystemEvent`, avatars, clock times.
- Portal thread (`conversation-messages.tsx:19`): a separate bubble made of 21 descendant
  rules, a full `toLocaleString()` time on every message, no date separators, no avatars.
  System messages show as bubbles. The customer bubble tint (`bg-primary/5`) is almost
  invisible.

### F7. Support lists look clickable but are not

- `support/parts/conversation-list.tsx:17`: each Card gets a hover border, but only the title
  is a link. The list shows no date, and the unread count is plain text.
- `tickets/parts/ticket-list.tsx:16-20`: the stage is plain text, and the visible link text
  repeats the ticket title.
- The feedback list already has the correct pattern: a stretched link over the whole row
  (`post-list.tsx`, `after:absolute after:inset-0`).

### F8. Token misuse

- `message-bubble.tsx:23`: the team bubble uses `bg-info-foreground`, a text token, as a
  surface. In dark mode the bubble text turns dark, so the bubble looks different per theme.
- `sidebar-item.tsx:35`: the attention count uses `text-orange-800` and the priority token.
  Priority is a task concept, not "needs attention".
- `core/avatar-tone.ts`: one avatar tone uses the destructive token. A red avatar reads as an
  error.

### F9. Mixed radii, elevation and widths

- The Card primitive is `rounded-2xl` with a faint shadow. Hand-made boxes use `rounded-xl`
  or `rounded-lg` (`my-feedback-page.tsx:80` and `:97`, `preference-toggle.tsx:12`,
  `feedback-editor.tsx:104`).
- 15 files remove the Card shadow with `shadow-none`. That is a design rule in practice, but
  the code does not say so.
- The teammate app has four reading widths: `max-w-205` (`message-list.tsx:75`),
  `max-w-200` (`team-post-page.tsx:142`), `max-w-195` (`team-member-page.tsx:54`) and
  `max-w-180` (`team-changelog-entry-page.tsx:90`).

### F10. Empty and loading states

- Three empty-state looks: the dashed box (`post-list.tsx:27`, `roadmap-column.tsx:116`),
  plain text, and `StateView`'s one generic line (`state-view.tsx:76`). Only the teammate
  `EmptySelection` has an icon.
- `StateView` shows its spinner at once (`state-view.tsx:52`). A fast response makes the
  spinner flash. Kaneo already has the `delayed-reveal` utility (`index.css:25`) and
  `Skeleton`, but Quills does not use them on lists.

### F11. Almost no motion

24 `transition-colors`, one `motion-reduce`, no entry or state motion. This is acceptable for
speed, but some state changes have no feedback: a vote, a new message, a sent reply.

### F12. Shell details

- `portal-shell.tsx:27` reads the `dark` class during render. A theme change does not update
  the workspace palette until the next render.
- `portal-shell.tsx:43`: the header is not sticky. On long pages the navigation scrolls away.
- `portal-navigation.tsx:22`: the mobile tab row scrolls sideways with no edge cue, and the
  current tab can be off screen.
- `page-frame.tsx:76`: every page title is `text-3xl md:text-4xl`, also on utility pages
  such as Preferences and Tickets.

### F13. Small touch targets and mixed focus styles

- `attachment-picker.tsx:85` (24 px) and `comment-reactions.tsx:84` (`p-1` icon button) have
  small targets. Kaneo's `touch-hitbox` utility (`index.css:68`) fixes this with no visual change.
- Custom pills and toggles (for example `roadmap-page.tsx:26`) have no `focus-visible` ring.
  They fall back to the browser outline, so focus looks different per control.

## 4. Design rules after this plan

| Element | Rule |
|---|---|
| Container | The `Card` primitive (`rounded-2xl`). No hand-made bordered boxes. |
| Row | `rounded-xl`, `hover:bg-muted/60`, one stretched link, `focus-visible` ring on the link. |
| Pill | `Button` `size="xs"` with `rounded-full`. Pressed state: `aria-pressed` with the primary tint. No size overrides. |
| Section label | `text-xs font-medium text-muted-foreground`, sentence case (as in Kaneo). |
| Type | Tailwind steps only. UI `text-sm`, meta `text-xs`, prose one size (decision D4). No px sizes. |
| Reading width | Teammate: `max-w-200` for threads and details, `max-w-180` for forms. Portal: `PageFrame` widths. |
| Empty state | `Empty` with `EmptyMedia` (icon), `EmptyTitle`, `EmptyDescription` and an optional action. |
| Loading | First list load: `Skeleton` rows at the row height. Other loads: spinner inside `delayed-reveal`. |
| Motion | Color transitions, and the primitive press scale. New transitions get `motion-reduce:transition-none`. |
| Focus | `focus-visible:ring-2 focus-visible:ring-ring` on every custom control. |
| Touch | `relative touch-hitbox` on every control under 32 px. |

## 5. Decisions for the owner

Each decision has a recommendation. The plan uses the recommendation until the owner says no.

- **D1. Team reply bubble.** (a) `bg-primary text-primary-foreground`: Kaneo's monochrome
  primary, the same in both themes, no new token. (b) Blue, as in the teammate design: a palette
  class such as `bg-blue-600 text-white` (passes AA, about 5:1) with a documented exception,
  because a blue token needs a Kaneo `index.css` edit. Recommend (a).
- **D2. Card elevation in the portal.** (a) Flat: keep `shadow-none` and state it as the portal
  rule. (b) Use the Kaneo default shadow and delete the 15 overrides. Recommend (b): it deletes
  code and matches Kaneo.
- **D3. Section labels.** Sentence case (Kaneo) or uppercase. Recommend sentence case.
- **D4. Prose size.** Replace `text-[15px]` with `text-base` (16 px, better for long help
  articles) or with `text-sm` (the UI size). Recommend `text-base` in the portal only.
- **D5. Prose rules.** (a) Put Kaneo's existing `kaneo-comment-editor-prose` class on the
  rendered Markdown. It already styles headings, lists and markers, with no Kaneo edit.
  (b) Complete the Quills rules in `markdown-content.tsx`. Recommend (a) if a visual check of
  all elements passes. Else (b).
- **D6. Page title size.** `text-3xl md:text-4xl` only for the hub pages (feedback home, help
  home, roadmap, updates). `text-2xl md:text-3xl` for the other pages. Recommend yes, through one
  boolean `PageFrame` prop.

## 6. Plan

All phases ship in one PR against `staging`. Each phase is one commit. Phases 1 and 3 give the
largest visible change.

### Phase 0: baseline

1. Start the API and the web app of this branch against the local demo database. Capture
   screenshots of `/quills/kit` and of the portal and teammate routes at 1440 px and 375 px, light
   and dark, through the Chrome DevTools protocol. On each page, record the `h1` and `main`
   counts, horizontal overflow and runtime errors.
   → verify: the baseline has one `h1` and one `main` on each page, no overflow and no errors.
   The checkout has no axe package, so this plan does not claim an axe result.

### Phase 1: correctness

1. F1: remove the dead `prose` classes. Apply decision D5. Add a Markdown sample with every
   element to the kit gallery.
   → verify: the kit sample shows styled `h1`-`h3`, code, a table, `hr` and an image in both
   themes. `markdown-content` tests pass.
2. F12: make `PortalShell` follow theme changes. Derive the mode from `theme` in
   `useUserPreferencesStore` (already in `upstream.ts`), and from `prefers-color-scheme` for
   `system`. Do not read the `dark` class during render.
   → verify: a test switches the store theme and expects the dark variables on the shell.
3. F8: fix the token misuse. Apply D1 to the team bubble. Use the warning tokens
   (`bg-warning/15 text-warning-foreground`) for the attention count. Remove the destructive tone
   from `avatarTone`.
   → verify: `avatar-tone` test; `rg "orange-|bg-info-foreground" apps/web/src/quills` finds nothing.
4. F4: replace the 8 px and 10 px avatar initials. A 16 px avatar shows the photo or a colored
   dot, and keeps the name as its accessible label.
   → verify: `conversation-row` test; `rg "text-\[(8|10)px\]"` finds nothing.

### Phase 2: one visual vocabulary (mostly deletion)

1. F2: rebuild the vote, reaction and filter pills on `Button size="xs"` with `rounded-full`.
   `similar-posts` reuses `PostVoteButton` in a read-only state. Filter pill groups use the
   exported `ToggleGroup`.
   → verify: `rg "before:hidden|sm:h-7|sm:text-xs" apps/web/src/quills` finds nothing. Pill
   tests pass. Pressed and unpressed states match in both themes.
2. F3: one section-label style (D3) in `board-navigation`, `post-sidebar` and
   `help-center-home`. Delete the duplicate label rule.
   → verify: `rg "tracking-wider" apps/web/src/quills` finds nothing.
3. F4 and F5: remove the `[&_time]`, `[&_h2]` and `[&_h3]` rules from `PageFrame`. Style
   each element where it is rendered. Remove `!text-[13px]` and the other px sizes.
   → verify: `rg "text-\[[0-9]+px\]|!text-" apps/web/src/quills` finds nothing.
4. F9: hand-made boxes become `Card`. Apply D2. Use two teammate reading widths.
   → verify: `rg "max-w-(205|195)" apps/web/src/quills` finds nothing. Screenshots match the
   baseline layout.
5. F10: export `EmptyMedia`, `EmptyTitle` and `EmptyContent` from `upstream.ts`. Give
   `StateView` an optional `emptyIcon`, `emptyTitle` and `emptyAction`. Replace the dashed boxes.
   → verify: `state-view` tests cover the new empty props. Each list page shows the same empty state.

### Phase 3: support surfaces

1. F6: render the portal thread with `MessageBubble`, `DateSeparator` and `SystemEvent`. Add
   a side prop to `MessageBubble`, so the customer's own messages sit on the right in the
   portal. Use `clockTime` for times. Delete the 21 descendant rules.
   → verify: the conversation page test still finds every message in an `ol`. Portal and
   teammate screenshots of the same seeded conversation look alike.
2. F7: support conversations become rows: subject, plain-text preview, relative time
   (`core/relative-time`), an unread badge (`RowBadge`), one stretched link.
   → verify: a test clicks the row body and reaches the conversation. The unread badge has text.
3. F7: tickets become rows: title, the stage as a `Badge`, the reference in muted mono text, one
   stretched link. The link text stops repeating the title.
   → verify: `ticket-list` test; axe finds no duplicate link name.
4. F5: `status-content` and `status-incident-page` render their sections as `Card` with explicit
   classes, not `[&>section]` rules.
   → verify: status tests pass; the status screenshots match the baseline layout.

### Phase 4: loading and motion

1. F10: wrap the `StateView` spinner in `delayed-reveal`. `ListPane` and `PostList` show three
   `Skeleton` rows at the row height on the first load.
   → verify: a test expects the `delayed-reveal` class. No layout shift when data arrives
   (compare the screenshot row positions).
2. F11: a new message or reply fades in with the native `starting:` variant
   (`starting:opacity-0 transition-opacity motion-reduce:transition-none`), only for items added
   after the first render.
   → verify: the thread does not animate on page load; a sent reply fades in once.

### Phase 5: accessibility and touch

1. F13: add `relative touch-hitbox` to every control under 32 px.
   → verify: at 375 px with a coarse pointer, each target is at least 44 px (browser measure).
2. F13: add the focus ring to every custom pill, toggle and row link.
   → verify: a keyboard pass on each baseline route shows the same ring on every control.
3. F12: the mobile portal tabs get an edge fade (Tailwind v4 `mask-x-*`), and the current tab
   scrolls into view on load.
   → verify: at 375 px the current tab is visible on the Support and Status pages.

### Phase 6: shell

1. F12: make the portal header sticky (`sticky top-0 z-20 bg-background/85 backdrop-blur` with a
   bottom border). The shell is the scroll container, so no JS is needed.
   → verify: on a long help article the navigation stays visible. Popups still open above it.
2. F12: apply D6 to `PageFrame`.
   → verify: page-frame test; the utility page screenshots show the smaller title.

### Phase 7: guard against drift (optional)

1. Add rule C24 to `scripts/quills-web/lib/rules`: no `text-[Npx]`, no raw palette color classes,
   no `prose` class, and no Button size overrides (`before:hidden`, `sm:h-*`).
   → verify: `check.test.mjs` has one passing and one failing case for each pattern;
   `node scripts/quills-web/cli.mjs check` passes.

## 7. Out of scope

- A change to the 90% teammate scale or a new theme token. Both need a Kaneo `index.css` edit.
- Applying the stored `customCss`. The framework README forbids it (security review needed).
- New features: uptime bars, emoji, attachments in the portal reply box.

## 8. Success criteria

1. Each finding F1 to F13 is fixed, or listed as skipped with its decision.
2. These searches in `apps/web/src/quills` TSX find nothing: `before:hidden`, `sm:h-7`,
   `text-\[[0-9]+px\]`, `!text-`, a bare `prose` class, `orange-`, `bg-info-foreground`,
   `max-w-(205|195)`. Rule C24 now enforces most of them.
3. Descendant rules (`[&_` and `[&>`) drop from 191 to under 40.
4. `pnpm --filter @kaneo/web test`, `pnpm typecheck`, `pnpm lint` and
   `node scripts/quills-web/cli.mjs check` pass.
5. The Phase 0 screenshot set, captured again, shows the intended changes only. Each page keeps
   one `h1` and one `main`, with no horizontal overflow and no runtime errors, at 1440 px and
   375 px, in light and dark.
6. `git diff --name-only staging` lists only Quills paths.

## 9. Risks

- Pill rebuilds change the pressed and hover states that tests query by role and name. Keep the
  accessible names. Update class-based assertions (12 Quills test files read classes).
- D5 (a) couples the portal to a Kaneo class name. A Kaneo rename breaks the portal prose
  without a type error. The kit sample in Phase 1 is the check.
- Sticky header and `backdrop-blur` cost paint time on long lists. Check scroll in the
  120-post demo board before the merge.
- Branding: a workspace palette can make `bg-primary` bubbles (D1 a) too strong. Check with the
  custom-palette fixture from the parity pass.

## 10. Implementation notes

All phases ship in one branch, `feat/quills-css-polish`, one commit for each phase. These points
differ from the draft above:

1. **Similar posts (Phase 2.1).** The vote count stays a static badge, because a button cannot sit
   inside the post link. It uses the same height, radius and border as the vote pill.
2. **Sort and board selects (Phase 2.1).** They use the standard `SelectTrigger size="sm"` with its
   border, not a borderless look that overrides the primitive.
3. **New message "To" field (Phase 2).** The field is a standard bordered combobox input. The
   results box keeps its border. The input no longer removes its own border with `!important`.
4. **MessageBubble kinds (Phase 3.1).** The kinds are now `self`, `other` and `note`. "Self" is
   the viewer's side: the team in the teammate app, the customer in the portal. The portal hides
   the customer's own avatar, because the label "You" gives no useful initials.
5. **Loading (Phase 4.1).** `StateView` takes `rows` for skeleton rows, with screen-reader text
   "Loading…". One test had relied on two `status` roles during a load; it now waits for the list.
6. **Hub titles (D6).** The feedback board page and the help locale page also count as hubs,
   because they are the same views as the feedback home and the help home.
7. **Sticky header (Phase 6).** The shell also gets scroll padding, so anchors and focus do not
   land under the header.
8. **Rule C24 (Phase 7).** C24 checks string literals and template parts in TSX files, with any
   variant, `!` mark or opacity. The draft's `sm:` height and size check is left out: it also
   matched plain elements. A palette class in a `.ts` data file, such as the branding swatches in
   `brand-colors.ts`, is out of its scope. No template changed, so the framework needs no
   migration.
9. **Empty states (Phase 2.5).** `StateView` takes an icon and a line. A title and an action are
   left out until a page needs them.
10. **Arrival fade (Phase 4.2).** Only messages after the newest message of the first render fade
    in. Older history from "Load older" does not.

Verification evidence is in the pull request description.
