# Requests UI parity plan

Status: Phases A and B built, 2026-11-16 (not committed). Phase C is not started. Benchmark: the owner's Requests screenshots (UserJot-style inbox).
This plan extends section 3 of [the teammate app design](teammate-app-design.md). It is a
functional benchmark only. Copy no third-party code, text, icons or images.

## 1. Scope rule

All changes stay in Quills paths (see RFC 0005):

- `apps/web/src/quills/**`, including `apps/web/src/quills/i18n/en-US`
- `apps/api/src/quills/**`
- `apps/api/src/database/quills/**`, and one Quills migration (`0029`) for an index
- `docs/quills-port/**`, and the generated `apps/docs/openapi.json`

No step changes Kaneo files, the `public` schema, or the Kaneo event bus.

## 2. Data and permission boundary

- All data is in the `quills` schema and is scoped to one workspace.
- Every new or changed route uses `defineQuillsRoute` with an `action` (`update` or `delete`).
  A hidden UI control is not an authorization check.
- Every new mutation records its change through the route `event`, so the Quills outbox and
  the WebSocket invalidation refresh other clients.
- A post that is hidden from its board must not show on the portal, the widget, the roadmap,
  the changelog or the public search. The API enforces this, not the UI.

## 3. What already matches

These parts exist and need no work:

1. The list page: title, filter button, search with the "/" key, Triage pill, New request button.
2. Rows: status icon, title, stale badge, votes, comments, board chip, date, author.
3. The two-pane detail: list pane, J/K and arrow keys, back to the board, previous and next.
4. The header: merge menu, and the kebab menu with Visit, Share, Copy link and Delete.
5. The board chip menu (board change) and the tag menu (checked tags).
6. The voter avatar stack, the vote count, and proxy votes for customers.
7. The comment box with the Public and Private note modes. Threaded replies with a line.
8. The floating action bar: status picker, Close, and the next status as the primary button.
9. The AI chip, the merge palette, and the New request modal.

## 4. Gaps

| ID | Screenshot | Today | Change | Layer |
|---|---|---|---|---|
| G1 | Filter menu with Boards, Status, Tags and Sort submenus, "Select all", "Save as view…", "Clear" | Flat radio groups: one status group, one board, sort | Nested submenus with multi-select | Web. The API already takes `boardIds`, `statusIds` and `tagIds` lists. |
| G2 | Sort: Newest, Oldest, Top, Trending, Stale | Newest, Votes, RICE | Add Oldest, rename Votes to Top, add Trending and Stale | Web, and API for `trending` and `stale` |
| G3 | "Save as view…" | No saved request views | Save dialog, and the views in the sidebar under Requests | Web. `/post-views` exists. Extend its sort enum. |
| G4 | Votes and comments in small pills, author photo | Plain counts, initials only | Pill style; add `authorAvatarUrl` to the post list and the post | Web and API |
| G5 | List pane header with the Triage pill; status icon at the right of each card | No Triage pill; icon at the left | Pass the Triage pill; move the icon | Web |
| G6 | Author name, then "date · source" on a second line; votes in the chip row | One line with the votes at the right | Two-line author block; move the votes to the chip row | Web |
| G7 | Visibility menu: "Shown on board", "Hidden from board" | A static label | A menu and a new visibility route | Web and API |
| G8 | Tag chips with "×"; "Create tag" at the end of the tag menu | No remove on the chip; no create | Remove from the chip; create and assign | Web. `useCreateTag` exists. |
| G9 | Board dot in the board color, soft chip fill | Gray dot | A board color | Web (see decision D1) |
| G10 | Avatar stack opens "Voters" with "Voted May 12"; "⋮" opens "Search members…" with "Create "name"" | The vote pill opens one popover for both | Split: voters popover, add-voter menu, create a customer | Web. Voter `createdAt`, proxy vote and `POST /users` exist. |
| G11 | Composer: attach, emoji, mic | Mode menu and send only | Emoji menu now; attach and mic later | Web (attach needs API, see D6) |
| G12 | Comment "…" menu: Edit, Pin, Delete | No comment actions in the team view | Wire the three actions; show the pinned comment first with a label | Web. `PATCH` and `DELETE /comments/{id}` and `PUT`/`DELETE /posts/{id}/pinned-comment/{id}` exist. |
| G13 | "↑ 1" vote pill on each comment | Reactions show, read-only | A comment upvote | Web (see D4) |
| G14 | Comment author photo | `avatarUrl: null` | Add `authorAvatarUrl` to the comment response | API and web |

## 5. Decisions for the owner

Each decision has a recommendation. The plan uses the recommendation until the owner says no.

- **D1. Board color.** (a) Pick a stable color from a fixed palette by the board ID. No API change.
  (b) Store a color in `boards.settings` (jsonb, no migration) with a picker in Boards settings.
  Recommend (a). Add (b) when a team asks to choose colors.
- **D2. "Hidden from board".** (a) Map it to the unused `archived` moderation state, with a new
  `PUT /posts/{postId}/visibility` route. No migration. (b) Add a `hidden_from_board` column with
  a Quills migration. Recommend (a), if the check in step B4 shows that every public query
  already reads only `published` posts. Else use (b).
- **D3. Sort meaning.** Trending: the most votes in the last 7 days, then the total votes.
  Stale: the oldest `updatedAt` first. Keep RICE as a Quills extra in the Sort menu.
  Recommend these definitions.
- **D4. Comment upvote.** (a) Show the existing 👍 reaction as the "↑" pill. No schema change.
  (b) A new comment vote table and a migration. Recommend (a).
- **D5. Vote pill click.** (a) The pill adds or removes the teammate's own vote
  (`POST /posts/{postId}/vote`). The avatar stack opens the voters. The "⋮" adds a vote for a
  customer. (b) Keep one popover. Recommend (a), as the screenshots show.
- **D6. Composer extras.** Emoji: reuse the 7-emoji set of `comment-reactions.tsx`, with no new
  dependency. Attach: comments have no attachments in the API; it needs a link table and a
  migration. Mic: browser speech input works in some browsers only. Recommend emoji now, and
  attach and mic out of scope until asked.
- **D7. Source line ("demo content").** Posts have no source field. Recommend the date only.
  Add a source when we define its values (portal, widget, on behalf, import).

## 6. Plan

Each phase is one PR against `staging`, with single-concern commits.

### Phase A: web only, the API is ready

1. Rebuild `RequestFilters` as nested submenus: Boards, Status, Tags (multi-select with
   "Select all"), Sort, "Save as view…" and "Clear". Store lists in the address
   (`board`, `statusId`, `tags` as comma lists).
   → verify: `post-search.test.ts` covers multi-value parse and `filterPatch`;
   `request-filters.test.tsx` covers each submenu, "Select all" and "Clear".
2. Add Oldest to the Sort menu and rename Votes to Top.
   → verify: the list request sends `sort=oldest` and `sort=votes`.
3. List pane: pass the Triage pill; move the status icon to the right of each card.
   Show votes and comments as small pills in both row types.
   → verify: `post-list-pane.test.tsx` and `request-row.test.tsx` updated and green.
4. Chip row: tag chips get a "×" button; the tag menu ends with "Create tag" (create, then
   assign). → verify: `post-chips.test.tsx` covers remove, create and the failure toast.
5. Votes: the avatar stack opens a "Voters" popover with the vote date; the pill toggles the
   teammate's vote (D5); the "⋮" opens the member search with "Create "name"".
   Move the votes from the author line to the right of the chip row (G6).
   → verify: `post-votes.test.tsx` and `post-voters.test.tsx` cover toggle, proxy vote,
   create and remove.
6. Comments: the "…" menu with Edit, Pin and Delete. Show Pin only on a public, root-level
   teammate comment. Show Delete for another person's comment only with the delete permission.
   Show the pinned comment first with a "Pinned" label. Add the 👍 upvote pill (D4).
   → verify: `post-thread.test.tsx` covers each action, the permission rules and the 409 case.
7. Composer: an emoji menu that inserts at the cursor (D6).
   → verify: `comment-box.test.tsx` covers the insert.
8. Saved views: hooks for `/post-views`, a "Save as view" dialog, the views in the sidebar
   under Requests, and delete. → verify: hook tests; `nav-views.test.ts` lists saved views.

### Phase B: small API additions, no migration

1. Add `authorAvatarUrl` to the post list, the post and the comment responses. Show the photos
   in rows, the author block and comments.
   → verify: API fixture tests check the field; `pnpm openapi:check:fix` is clean.
2. Add the `trending` and `stale` sorts with keyset cursors, as `rice` does (D3). Extend the
   saved view sort enum. Add them to the Sort menu.
   → verify: API tests for the order, the cursor pages and the tie rules.
3. Board color (D1): one helper that maps a board ID to a palette color. Use it in the row
   chip, the detail chip and the board menu.
   → verify: one test for a stable color per ID.
4. Visibility (D2): first, list every public read of posts (portal list, post page, widget,
   roadmap, changelog, search, similar posts). Confirm each one reads only `published`. Then add
   `PUT /posts/{postId}/visibility` with `{ visible: boolean }`: published to archived and back.
   A pending post uses the existing approve route. Make the chip a menu.
   → verify: integration tests: a hidden post is absent from each public read, present in the
   team inbox, and the change records an event. A user without `update` gets 403.

### Phase C: on request

- Comment attachments (link table, Quills migration, upload in the composer).
- Speech input in the composer, shown only where the browser supports it.
- A source line under the author (D7).
- Board colors that a team can choose (D1 b).

## 7. Success criteria

1. Each gap G1 to G14 is closed or is listed as skipped with its decision.
2. `pnpm --filter @kaneo/web test` and `pnpm --filter @kaneo/api test` pass for the changed
   files. `pnpm typecheck` and `pnpm lint` pass.
3. `pnpm openapi:check:fix` leaves no diff after Phase B.
4. A browser check on the local demo shows each screenshot state: list, filter submenus, chip
   menus, voters, add voter, comment menu and the action bar, in light and dark themes.
5. A second browser session sees each change (status, tags, visibility, pin, vote) without a
   reload.
6. `git diff --name-only staging` lists only the paths in section 1.

## 8. Build notes

What changed from the plan while it was built:

1. Saved views are in the filter menu ("Views" submenu), as the conversation views are. They
   are not in the sidebar. Deleting a saved view has no UI yet; the API has the route.
2. D4: the comment vote pill counts the 👍 reaction. The API names 👍 as the widget's comment
   vote (`FEEDBACK_REACTION_EMOJIS`). The portal's heart like stays separate.
3. D5: the request response has a new `viewerPrincipalId`, so the pill can remove the
   teammate's own vote and the comment menu can find the teammate's own comments.
4. D1: board dots use theme-token classes (`bg-info`, `bg-chart-*`, `bg-success`), because the
   Quills web rules do not allow color literals or inline styles.
5. The tags and the saved views load only when a teammate opens the filter menu.
6. Replies keep their indent, but have no vertical thread line yet.
7. "Create tag" needs the settings permission, as the tag API does. Undo after a comment
   delete needs the delete permission, as the restore API does.
8. Trending counts each person once and leaves out test customers, as `voteCount` does. The
   index `post_votes_workspace_post_created_idx` serves it. Startup builds it CONCURRENTLY
   (`CONCURRENT_INDEX_SPECS`); migration `0029` has no DDL.
9. With no board filter, the Boards submenu shows every board checked, as Status does. The
   last checked board or status cannot be unchecked.
