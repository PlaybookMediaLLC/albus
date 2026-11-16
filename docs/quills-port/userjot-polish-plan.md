# Feedback portal polish plan: the UserJot reference

Status: accepted, 2026-11-16. The owner accepted the recommendations D1 to D4, with every phase in
one PR and one commit for each phase. Section 9 records how the build differs from this draft.
Scope: the customer feedback portal (`/portal/{id}`): feedback board, post page, composer,
roadmap and updates. The teammate app is out of scope (section 7).
Baseline: `a8d4edc5` (`staging` after the CSS polish pass in PR #181).

This plan follows [the CSS polish plan](css-polish-plan.md). That pass gave the portal one visual
vocabulary. This plan closes the remaining gap to a polished public board, using
`feedback.userjot.com` as the reference. Its scope rule still applies: change Quills paths only, add no
theme token, and follow rules C19 and C24. A change that needs a Kaneo file is a decision (section 4).

## 1. Method

1. Run the seeded demo stack (`pnpm dev:demo`) and open `feedback.userjot.com` in the same browser.
2. Take screenshots of the board, post, roadmap, updates and an open composer. Use 1440 px and an
   iPhone 13 (390 × 664), in light and dark, as a visitor and as the demo customer.
3. Measure the same elements on both sites with `getComputedStyle`. The reference board and the
   demo both have a "Linear integration" post, so the rows compare one to one.

## 2. Where we stand

The structure already matches. Both portals have the same parts: a boards and status rail, an
inline composer, a sorted list with a vote pill, roadmap columns and an updates timeline. The gap is
finish, not features. The largest gaps are on mobile.

| Element (1440 px, board) | UserJot | Kaneo portal |
|---|---|---|
| Page title | 40 px, weight 500, −1 px | 36 px, weight 600, −0.9 px |
| Row title | 15 px, 500, normal tracking | 14 px, 500, −0.35 px tracking |
| Vote pill | 64 × 32, count 13 px in a muted color | 60 × 28, count 14 px in the foreground color |
| Row pitch | 64 px | 61 px |
| Composer card radius | 16 px | 14 px |
| Avatars | Photo or colored initials | Gray single letter |
| Mobile: top of first post | 232 px | 523 px (visitor); more than one screen for a customer with a survey |
| Mobile: submit action | Fixed pill at the bottom | None |

## 3. Findings

### U1. On mobile, filters come before the posts

`board-navigation.tsx` renders the boards and the statuses as two horizontal rows above the
composer. `page-frame.tsx` stacks the rail above the content. At 390 px the first post starts at
523 px, and the last status ("Complete") is cut at the edge with no fade. The reference shows a
title with a board menu ("Feedback ⌄") and one filter row (status and sort) above the list.

### U2. On mobile, no visible way to post

`portal/layout.tsx:98` hides "Submit feedback" below `sm` and shows nothing in its place. The
reference shows a fixed pill at the bottom center.

### U3. Visitors get the dark theme by default

The Kaneo store defaults to `theme: "dark"` (`store/user-preferences.ts:71`). `useDarkTheme` reads
it, so a first-time visitor with a light device sees a dark portal. The reference follows the
device setting. The fix needs a Kaneo file (decision D1).

### U4. Hierarchy comes from size and weight, not color

See the table in section 2. The title weight 600, the tight row-title tracking and the
foreground-colored vote counts make the list look dense and loud. The reference uses a lighter
title, muted counts and a little more space for each row.

- `page-frame.tsx:80`: `font-semibold` on every page title.
- `post-list.tsx`: `tracking-tight` on the row title, `py-2.5` on the row.
- `post-vote-button.tsx`: `size="sm"` (28 px on desktop). `confirm-action.tsx`: the pill text is
  the foreground color when the pill is not pressed.

### U5. Every avatar is a gray letter

`PersonAvatar` has a `colored` prop that uses `avatarTone` (token tones, safe in both themes). No
portal call site passes it: `post-list.tsx`, `post-sidebar.tsx`, `post-comment.tsx` and
`changelog-entry.tsx`. Lists of gray circles look unfinished.

### U6. The open composer looks unfinished

- `composer-details.tsx`: the hint line is always visible. It repeats what the placeholder says,
  and it starts 11 px left of the title, because the unstyled inputs have padding and the hint
  does not.
- The details field opens tall and empty. The reference grows the field with its text.
- The submit button is a strong primary circle while the title is empty. The reference keeps it
  muted until there is text.
- `post-composer.tsx:50`: the card is `rounded-xl`. The design rule from the previous plan says
  a container is `rounded-2xl`, and the reference uses 16 px.

### U7. Status icons in similar and related posts have no color and no name

`similar-posts.tsx:74` puts a bare `StatusIcon` at the far end of the row with no `color`. In
light mode it is a black dot, and the stage has no text. The API returns only `stage` for these
posts, but the feedback page already loads the statuses (`feedbackStages`). The post page's
related requests (`pages/post/parts/related-requests.tsx`) reuse `SimilarPosts`, so they have the
same problem. That page must also load the statuses (one cached query, no API change).

### U8. The survey card pushes the board down

`survey-card.tsx` renders the full NPS form (scale, comment field and buttons) between the
composer and the posts: about 300 px on desktop and more than one screen on mobile. At 390 px the
0 to 10 scale wraps to two rows.

### U9. A team reply sticks out of the column

`post-comment.tsx:71` gives the team reply `-mx-3`. The card's right edge is 12 px past the
column (1224 px against 1212 px). The left bleed lines up the avatar; the right bleed has no
purpose.

### U10. The updates header has three text pills

`changelog-page.tsx` shows "Share", "RSS feed" and "Get email updates" as text pills. The
reference shows one labeled action and an RSS icon.

### U11. Voting has no feedback motion

The count and the arrow change at once. A small motion confirms the vote. This is the open
item F11 from the previous plan.

### U12. No social proof on the post page

The reference shows voter avatars and "and 143 others" next to the vote pill. The portal API has
no public voter list. This is a product and privacy decision (D3), not a style change.

The header, the roadmap columns and the updates timeline are already close to the reference.
This plan leaves them as they are. The font stays Geist (the Kaneo brand). Inter is not a goal.

## 4. Decisions for the owner

Each decision has a recommendation. The plan uses it until the owner says otherwise.

- **D1. Visitor theme.** (a) Keep the dark default. (b) The portal follows the device setting
  while the viewer has no stored choice. (b) needs a Kaneo edit in the theme provider or the
  store, and the previous plan's scope rule forbids that. Recommend (b), in a separate small Kaneo PR.
- **D2. Row title size.** (a) Keep `text-sm`, and fix the tracking, weight and spacing only.
  (b) `text-base` row titles on the board and roadmap at `md` and up. A 15 px step needs a new
  theme token (a Kaneo `index.css` edit), so it is not offered. Recommend (a), then compare the
  screenshots again before (b).
- **D3. Voter avatars on a post.** This needs a new public API field and a per-workspace privacy
  setting, and anonymous voters must stay hidden. Recommend: not in this plan. Handle it as a
  separate feature with its own API and permission review.
- **D4. Mobile board picker.** (a) A menu of links: each board keeps its URL, and the back button
  works. (b) A `Select` that navigates. Recommend (a) for boards. The status filter is page state,
  so it uses a `Select`.

## 5. Plan

All phases ship in one PR against `staging`, one commit for each phase. Phase 1 gives the
largest visible change.

### Phase 0: baseline

1. Capture the method in section 1 for this branch. Record the section 2 values and the mobile
   first-post position for a visitor and for the demo customer.
   → verify: one `h1` and one `main` on each page, no horizontal overflow and no runtime errors.

### Phase 1: mobile (U1, U2, U8)

1. U1: below `md`, `BoardNavigation` renders one row: a board menu (D4), a status `Select` and the
   existing sort control. The `md` rail does not change. Remove the two scrolling rows.
   → verify: at 390 px the visitor's first post starts at 300 px or less. Each board link keeps
   its `href`. `board-navigation` tests cover both layouts.
2. U2: below `sm`, the layout shows "Submit feedback" as a fixed pill at the bottom center, above
   the safe area. Pages get bottom padding, so the pill never covers the last row or the
   "caught up" line. The link stays `?openFeedback=1`.
   → verify: the pill is visible at 390 px on the board, post, roadmap and updates pages, and
   hidden at `sm` and up. The last row stays reachable.
3. U8: the survey shows one compact row: the question and a 0 to 10 scale in one line
   (`ToggleGroup`, equal cells). The comment field and the Send button appear after a score is
   chosen. "Not now" becomes a quiet icon button with a label.
   → verify: at 390 px the scale fits one row. The customer's first post starts within one screen.
   `survey-card` and `survey-prompt` tests pass.

### Phase 2: hierarchy (U4, U5)

1. U4: page titles use `font-medium`. Row titles drop `tracking-tight`. Rows use `py-3`. The vote
   pill uses `size="default"` (32 px on desktop). An unpressed pill has muted text, with the
   foreground color on hover. The pressed state (primary tint) does not change. Apply D2.
   → verify: compare the Phase 0 table: title weight 500, pill height 32 px, row pitch 64 px.
   Vote tests still find the pill by its accessible name and `aria-pressed`.
2. U5: portal avatars pass `colored`. Avatars under 20 px keep `initials={false}`.
   → verify: `person-avatar` test. Screenshots of the board, post and updates in both themes show
   colored initials.

### Phase 3: composer and status labels (U6, U7)

1. U6: the hint becomes the details placeholder. Keep `aria-describedby` only if the hint text
   stays. The details field grows with its text (`field-sizing-content`, with a small minimum
   height). The submit button stays focusable, and looks muted until the title has text. The card
   becomes `rounded-2xl`.
   → verify: `post-composer` and `composer-details` tests. An empty submit still shows the
   "title required" message. The open composer screenshot has no misaligned line.
2. U7: `SimilarPosts` takes a stage map (label and color) from the page. It shows the status
   inline after the title, as `PostList` does. `related-requests` does the same. The heading uses
   the section label style (`font-medium`).
   → verify: `similar-posts` test expects the status name. No `StatusIcon` without a color in
   these lists.

### Phase 4: details (U9, U10)

1. U9: the team reply uses `-ms-3` instead of `-mx-3`.
   → verify: on the post page, the team reply's right edge lines up with the comment box.
2. U10: "Get email updates" stays a text action. Share and RSS become icon buttons with an
   `aria-label` and a tooltip.
   → verify: `changelog-page` test finds both by name. The header fits one row at 390 px.

### Phase 5: motion (U11, optional)

1. U11: when a vote is pressed, the arrow moves up 2 px and the count fades to its new value
   within 150 ms. Add `motion-reduce:transition-none`. Nothing moves on page load.
   → verify: a vote shows the motion once. With reduced motion, nothing moves.

## 6. Success criteria

1. Each finding U1 to U11 is fixed, or listed as skipped with its decision. U12 waits for D3.
2. At 390 px, the first post starts at 300 px or less for a visitor, and within one screen for a
   customer with a pending survey. "Submit feedback" is reachable on every portal page.
3. No gray initial avatars and no uncolored status icons in portal lists.
4. `pnpm --filter @kaneo/web test`, `pnpm typecheck`, `pnpm lint` and
   `node scripts/quills-web/cli.mjs check` pass.
5. The Phase 0 screenshots, taken again, show the intended changes only. Each page keeps one `h1`
   and one `main`, with no horizontal overflow, at 1440 px and 390 px, in light and dark.
6. `git diff --name-only staging` lists only Quills paths. D1, if accepted, ships separately.

## 7. Out of scope

- The teammate app (`/feedback/{id}`). The reference's admin app needs an account, so this plan
  has nothing to compare it with. It can be a later pass.
- Voter avatars (D3), new theme tokens, a font change and the stored `customCss`.
- The header and the roadmap and updates layouts, which already match the reference.

## 8. Risks

- The mobile filter row changes how tests query the board and status controls. Keep the
  accessible names. Update queries by role.
- A fixed bottom pill can cover an open mobile keyboard or the composer. Hide it while a text
  field in the page has focus, if the screenshots show overlap.
- Colored avatars and muted vote counts must work with custom workspace palettes. Check with the
  custom-palette fixture from the parity pass.
- `field-sizing-content` is not in every browser. Where it is missing, the field keeps its fixed
  minimum height. That is an acceptable fallback.

## 9. Implementation notes

All phases ship in one PR, one commit for each phase, and D1 in its own commit. These points differ
from the draft above.

1. **Mobile first post (Phase 1).** At 390 × 664 the first post moves from 513 px to 349 px for a
   visitor, not to 300 px. The rest of the gap is the inline composer. The reference hides it on
   phones; Kaneo keeps it, because typing a title is also how a customer finds similar posts. For a
   customer with a pending survey it moves from 923 px to 497 px, within one screen.
2. **Floating submit (Phase 1).** The pill shows on the feedback, board, post, roadmap and updates
   pages while the feedback tab is on. Help, status and support pages do not get it, because their
   reply boxes sit at the bottom.
3. **Survey (Phase 1).** The scale keeps its native radio inputs in a grid of equal cells instead of
   a `ToggleGroup`: the same semantics, and the existing tests still apply. "Not now" is a close
   icon button with that name.
4. **Hierarchy (Phase 2).** The row pitch is 65 px. Only an enabled pill shows its count in the
   muted color: a disabled pill (a visitor's) keeps the foreground color, so the count stays
   readable at the disabled opacity.
5. **Composer (Phase 3).** The details field already grew with its text (`field-sizing-content`
   in the Kaneo `Textarea`), so only the hint line went. `PortalForm` takes a `submitVariant`.
6. **Status labels (Phase 3).** `SimilarPosts` shows a status only when it gets the stages. The
   feedback pages pass the stages they already load, so the composer's similar posts cost no
   extra request. The post page loads the statuses for its related requests. The linked requests
   of an update get no stages, so they no longer show the bare icon.
7. **Updates header (Phase 4).** The icon buttons use a native `title` tooltip. The Kaneo
   `Tooltip` renders outside the portal shell, without the workspace theme.
8. **D1.** The preferences store defaults to `system` on a `/portal/` path. This is the only Kaneo
   file in the change (`apps/web/src/store/user-preferences.ts`), in its own commit.
9. **Type check.** TypeScript 7 needs about 13 GB for `apps/web`. With the demo stack running in a
   16 GB container, `tsc --noEmit -p tsconfig.app.json --checkers 1` is the run that fits.

Verification evidence is in the pull request description.
