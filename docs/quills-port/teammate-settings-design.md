# Quills teammate app: settings and workspace pages

Design and data spec. Status: draft for the owner. Date: 2026-11-14.

Sources:

- Branch `origin/feat/quills-feedback-value` at `27d26422`. All code was read with `git show`.
- `docs/quills-port/teammate-app-design.md` and `docs/quills-port/rfc-0004-teammate-app.md`.
- `apps/docs/openapi.json`: 1,046 operations. 609 of them are under `/quills/{workspaceId}`.
- 29 screenshots: group A (images 19 to 30) and group B (images 31 to 47).

Rules for every lane:

1. UserJot is a functional benchmark only. Do not copy its text, icons or images. Write all copy as new static i18n keys. Use lucide icons and Kaneo theme tokens.
2. Do not show data that no API gives. Leave the control out, and list the gap in section 5. Do not show a placeholder such as "0 contributions".
3. Tags: **[Kaneo]** means that Kaneo's `public` schema owns the data. **[Quills]** means that the `quills` schema owns it.
4. Every operation ID in this file exists in `apps/docs/openapi.json`, unless the text says "no operation ID".

---

## 0. Key decisions

1. **The settings frame already exists.** Kaneo has `SettingsPage`, `SettingsSection`, `SettingsCard`, `SettingsRow`, `SettingsNote`, `SettingsEmpty`, `RowActionsMenu`, `ConfirmDialog` and `StatusBadge` in `apps/web/src/components/settings/`. They match the benchmark frame. Do not write new section, card or row parts. Export them through `apps/web/src/quills/ui/upstream.ts`, because conformance rule C5 allows upstream imports only through that file.
2. **Reuse the Kaneo-owned pages.** Account, Team, Billing and API tokens already exist in Kaneo as `ProfilePage`, `MembersTable` with `InviteTeamMemberModal`, `BillingSettingsPage` and `ApiKeysSettings`. Embed them through `upstream.ts`. Do not rebuild them.
3. **One shell, three modes.** `TeamShell` shows the app sidebar, the settings sidebar, or no sidebar. The mode comes from the path. The changelog editor uses the "focus" mode, which has no sidebar.
4. **Many benchmark controls have no API.** These controls are: board color, board order, workspace weekly digest, sensitive data detection, identity masking, portal SSO, personal linked accounts, imports other than CSV, changelog slug, changelog authors, free-form AI chat for changelog drafts and plan usage counts. Section 5 lists the smallest API addition where one is reasonable.

---

## 1. Settings shell

### 1.1 Entry and exit

- The "Settings" item in `apps/web/src/quills/team/nav-views.ts` changes its path from `/boards` to `/settings`.
- `/feedback/{workspaceId}/settings` is a redirect-only route to `/feedback/{workspaceId}/settings/account`. Conformance rule C1 allows a redirect-only route.
- "Back" goes to `/feedback/{workspaceId}` (the overview).
- The old `/boards` page (`TeamBoardsPage`: board access, voting and task sync) moved to `/feedback/{workspaceId}/settings/boards`, so it shows the settings sidebar. `/boards` redirects there. The board row menu on the Feedback settings page links to `/settings/boards`.

### 1.2 Shell modes

Add the pure helper `apps/web/src/quills/team/shell-mode.ts`:

| Path after `/feedback/{id}` | Mode | Sidebar |
|---|---|---|
| `/settings` and below | `settings` | Settings sidebar |
| `/changelog/new`, `/changelog/{entryId}` | `focus` | None. The main panel fills the window. |
| Any other path | `app` | The current `TeamSidebar` |

`TeamShell` (`apps/web/src/quills/team/team-shell.tsx`) reads the path with `useLocation` from `@tanstack/react-router`. It then picks the sidebar for the desktop column and for the small-screen sheet. In `focus` mode it renders neither the column nor the menu button bar.

### 1.3 Settings sidebar

File: `apps/web/src/quills/team/settings-sidebar.tsx`. It has the same width (`w-75`, 300 px), surface (`bg-sidebar`) and item style as `TeamSidebar`. Reuse `SidebarItem` (`apps/web/src/quills/team/sidebar-item.tsx`). It already gives the white active pill, the light border and `aria-current`.

**Header row** (left to right):

1. The workspace logo (24 px, rounded) and the workspace name (truncated, text-sm, medium). This is static text, not the workspace switcher.
2. A ghost text button "Back" with an `ArrowLeft` icon. It is small and muted.
3. The existing `NotificationsButton` (bell).

**Search field** under the header:

- A full-width rounded input with a gray fill, a `Search` icon at the start and the placeholder "Search settings…".
- It filters the items client-side by the translated item label and the section label. Put this logic in the pure helper `apps/web/src/quills/team/filter-settings-nav.ts`.
- A section with no match is hidden. When nothing matches, show the muted line "No settings found".
- "/" focuses the field. Escape clears it. Enter opens the first match.

**Sections and items.** Put them in `apps/web/src/quills/team/settings-nav.ts`. Each section has an 11 px uppercase muted label. Each item has a lucide icon and a label.

| Section | Item | Path under `/settings` | Icon | Owner | Shown when |
|---|---|---|---|---|---|
| Personal | Account | `/account` | `CircleUserRound` | Kaneo | always |
| Workspace | Branding | `/branding` | `Palette` | Quills | always |
| | Languages | `/languages` | `Languages` | Quills | `modules.helpCenter` |
| | Domain | `/domain` | `Globe` | Quills | always |
| | Team | `/team` | `Users` | Kaneo | always |
| | Billing | `/billing` | `CreditCard` | Kaneo | `getConfig.billingEnabled` |
| Product | Feedback | `/feedback` | `MessageSquare` | Quills | `modules.feedback` |
| | Changelog | `/changelog` | `Megaphone` | Quills | `modules.changelog` |
| | Privacy | `/privacy` | `Shield` | Quills | always |
| | Login | `/login` | `Lock` | Quills and Kaneo | always |
| Conversations | General | `/conversations/general` | `MessagesSquare` | Quills | `modules.supportInbox` |
| | Operators | `/conversations/operators` | `Headset` | Quills and Kaneo | `modules.supportInbox` |
| | Topics | `/conversations/topics` | `Tag` | Quills | `modules.supportInbox` |
| | Email | `/conversations/email` | `Mail` | Quills | `modules.supportInbox` |
| | Widget | `/conversations/widget` | `AppWindow` | Quills | always |
| | AI | `/conversations/ai` | `Sparkles` | Quills | `modules.supportInbox` |
| | Moderation | `/conversations/moderation` | `ShieldCheck` | Quills | always |
| Connections | Integrations | `/integrations` | `Puzzle` | Quills | always |
| | API | `/api` | `KeyRound` | Kaneo and Quills | always |
| | Data & Import | `/data` | `DatabaseBackup` | Quills and Kaneo | always |

- `modules.*` comes from `listQuillsSettings` (`GET /settings`, response `modules`). `billingEnabled` comes from Kaneo `getConfig`.
- While `listQuillsSettings` loads or fails, show every item. The pages have their own error states.
- The benchmark shows a "Beta" tag on the Conversations label. Leave it out. Nothing in Kaneo marks this area as beta.

**Bottom:** a "Docs" item with a `BookOpen` icon. It opens `https://kaneo.app/docs` in a new tab. The web app already uses this URL.

**Small screens:** below `md`, the settings sidebar opens in the same `Sheet` as the app sidebar does now.

**Accessibility:** use a `nav` landmark labeled "Settings". Each section list has `aria-labelledby` on its label, as `TeamSidebar` does.

### 1.4 Page frame

Every settings page uses this frame:

```
<PageFrame titleKey="…" variant="app" landmark={false}>   // rule C14: PageFrame is the page root
  <SettingsPage title={t("…")}>                            // centered column, h1, sections 40 px apart
    <SettingsSection title=… action={<Button …>+ New board</Button>}>
      <SettingsCard>                                       // rounded-xl, border, bg-card, rows split by lines
        <SettingsRow title=… description=…>{control}</SettingsRow>
      </SettingsCard>
      <SettingsNote>…</SettingsNote>                       // muted helper line under the card
    </SettingsSection>
  </SettingsPage>
</PageFrame>
```

What each part looks like:

| Part | Look | Kaneo source |
|---|---|---|
| Column | centered, max width 768 px (`max-w-3xl`), 32 to 40 px top padding | `SettingsPage` |
| Page title | `h1`, text-xl, semibold. The benchmark title is larger. Keep Kaneo's size. | `SettingsPage` |
| Section heading | `h2`, text-sm, medium. An optional action button sits at the right on the same line. | `SettingsSectionHeader` |
| Section action | small secondary pill button with a `Plus` icon, for example "+ New board" | `Button` size `sm` |
| Card | rounded-xl, 1 px border, card background, rows split by 1 px lines | `SettingsCard` |
| Row | 14 px vertical padding. On the left: the title (text-sm, medium) with the description under it (text-xs, muted). On the right: the control. An optional leading icon tile. | `SettingsRow` |
| List row | a leading icon (tag, globe, color dot), a label, then trailing controls and a kebab menu | `SettingsRow` with `icon` |
| Kebab menu | ghost icon button, `Ellipsis`, menu aligned to the end. A destructive item is red, after a separator. | `RowActionsMenu` |
| Note | text-xs, muted, under the card | `SettingsNote` |
| Empty list | icon tile, title, description and an optional action, centered in the card | `SettingsEmpty` |
| Status | small pill with a dot: success, warning, destructive or neutral | `StatusBadge` |
| Danger zone | section titled "Danger zone". The card has `tone="danger"`. The row title is in the destructive color. A click opens a confirmation. | `SettingsCard tone="danger"`, `ConfirmDialog` |
| Dialog | title, description, fields with the label above the input, a gray footer band with "Cancel" (secondary) and the primary button (disabled until the form is valid) | `Dialog` (coss) |

Lane S adds these names to `upstream.ts` in one block: `SettingsPage`, `SettingsSection`, `SettingsCard`, `SettingsRow`, `SettingsNote`, `SettingsEmpty`, `RowActionsMenu`, `ConfirmDialog`, `StatusBadge`, `ToggleGroup`, `ToggleGroupItem`, `Accordion` parts and the missing `Dialog` parts (`DialogHeader`, `DialogDescription`, `DialogPanel`, `DialogFooter`, `DialogClose`). Confirm the names against `apps/web/src/components/ui/*.tsx` before you export them.

### 1.5 Controls and save rules

| Control type | Component | Save rule |
|---|---|---|
| Switch | `Switch` | Saves on change. The switch moves at once. On an error it moves back, and a toast shows the problem. |
| Select (one value) | `Select` | Saves on change, like a switch. |
| Segmented control | `ToggleGroup` | Saves on change, or sets a form value inside a popover. |
| Text input | `Input` in a `PortalForm` (rule C22) | A "Save" button under the card, right-aligned. It stays disabled until a value changes and shows a spinner while it saves. |
| Color choice | `Select` with a color dot in each item | Saves on change |
| File upload | a hidden file input behind a button or the logo | Uploads, then registers the key (see Branding) |
| Copy value | `CopyField` (new, see 1.7) | Copies to the clipboard and shows a "Copied" toast |
| Token or secret action | `ConfirmAction` (`apps/web/src/quills/ui/confirm-action.tsx`) | Rule C9 requires it |

- Several Quills settings writes return `receiptId`, and `createQuillsSettingsReceiptsUndo` exists. An "Undo" toast is possible, but it is not in v1.
- Lists update through the existing Quills WebSocket invalidation and the team cache. After a mutation, invalidate the query key that the page reads.

### 1.6 Permissions and plan locks

- Settings writes need `quills:manage_settings`. In the app this is `team.permissions.manageSettings`. Many settings reads need it too. For example, the operations ROUTES.md requires it for every operations route except `getQuillsPoweredBy`.
- A page whose read returns 403 shows `TeamStateView` with the "no access" problem.
- A page that reads but cannot write shows its controls disabled.
- Kaneo-owned pages use the Kaneo capabilities from `getMyWorkspaceCapabilities` (`manageWorkspace`, `inviteUsers`, `removeMembers`, `deleteWorkspace`). The embedded Kaneo components already check them.
- **Plan lock:** some Quills operations return 402 when the cloud plan is not active. Examples are `setQuillsPoweredBy`, `setQuillsPortalDomain` and `verifyQuillsPortalDomain`. `listQuillsCustomDomains` returns `entitled: false` in that case. Show a small `Lock` icon (warning color) left of the disabled control. A tooltip gives the reason.

### 1.7 New shared parts (lane S)

Make only these two. Each one is used by three or more pages.

1. `apps/web/src/quills/ui/setting-switch-row.tsx`. Props: `title`, `description`, `checked`, `disabled`, `locked` (a reason string), `onCheckedChange(next) => Promise<void>`. It renders a `SettingsRow` with a `Switch`. It moves the switch at once, moves it back on an error and shows a toast. It is used by Branding, Feedback, Changelog, Privacy, Login, API and Widget.
2. `apps/web/src/quills/ui/copy-field.tsx`. Props: `value`, `label`, `masked`. It renders a gray monospace pill with the value (truncated in the middle when long) and a copy icon button. It is used by Login, Domain, Share and the changelog editor.

Add both to `apps/web/src/quills/dev/kit-gallery.tsx` (rule C23).

---

## 2 and 3. Screens and data

Each screen lists what it shows, its controls, its actions, its empty and error states, and its data. "Gap" lists what the benchmark has and the API does not.

### Group A: workspace pages of the app

#### A1. Members list (image 19). Route `/feedback/{id}/members`. [Quills]

**Shows:** the page header and a full-width list. There is no card.

- **Header row:** the title "Members" at the left. A search field at the right: rounded, gray fill, about 300 px wide, a `Search` icon, the placeholder "Search members…" and a `/` key hint.
- **Rows** (about 64 px high). The 1 px divider starts at the text, not under the avatar.
  - Avatar: 36 px, `PersonAvatar` (photo or colored initials).
  - Name: text-base.
  - Second line: the email (muted, text-sm). Use `email`, else `contactEmail`. Leave the line out when both are null.
  - At the right: small pill badges. "Lead" when `isLead`. "Blocked" (destructive tone) when `blockedAt` is set.
  - A click opens the member detail.

**Actions:**

- Search, debounced with the existing `useDebouncedValue`.
- "/" focuses the search field.
- A "Load more" button when `nextOffset` is not null. Use a page size of 50.

**States:**

- Loading and failed: `TeamStateView`.
- Empty: "No members yet". The description says that people show here after they post, vote or comment.
- No search results: "No members match {query}".

**Data:** `listQuillsUsers` with `search`, `offset` and `limit`. The hook `use-list-users` exists.

**Gap:** the benchmark lists the workspace owner with an "OWNER" badge. `listQuillsUsers` lists customers only: "Teammates, test customers and service principals are never listed." Teammates are on Settings › Team. Do not add them here.

**Nav change:** the "Members" item in `apps/web/src/quills/team/nav.ts` now links to Kaneo's `/dashboard/workspace/{id}/members`. It changes to `/feedback/{id}/members`.

#### A2. Member detail (images 20 to 22). Route `/feedback/{id}/members/{principalId}`. [Quills]

**Layout:** the app sidebar, the main pane and a right panel. The right panel is about 360 px wide, has a left border and scrolls on its own.

- **Main pane top bar:** a back chevron button at the left (to the Members list). A kebab button at the right.
- **Main content:** a column of about 780 px. It holds:
  - the avatar (72 px);
  - the name as the `h1` (text-4xl, semibold);
  - underline tabs: "Requests {n}", "Comments {n}" and "Activity". The counts come from `getQuillsUser.postCount` and `commentCount`.

**Requests tab:** one row for each post that the member wrote.

- At the left: an outlined round vote pill with an `ArrowUp` icon and `voteCount`.
- The title (medium).
- A second line with the board name, a dot in the status color and the status name.
- At the right: a `MessageSquare` icon with `commentCount`.
- A click opens `/posts/{postId}`.
- Empty state: "No requests yet".

**Comments tab:** one row for each comment that the member wrote.

- At the left: a pill with a `Heart` icon and the reaction count.
- The comment text as one line of plain text. Strip the Markdown.
- A second muted line with the post title.
- At the right: the date ("MMM d").
- A click opens the post.
- Empty state: "No comments yet".

**Activity tab:** in the benchmark it shows an empty state: a clock icon, "No activity yet" and one line of help. No route lists the activity of one person. **Hide this tab until the route in 5.3 exists.** Do not show a fake empty state.

**Right panel:**

1. **Card 1:**
   - A `Calendar` row: "Joined {date}" from `joinedAt`.
   - A `Plug` row: "Identified by your app". Show it only when `externalId` is not null.
2. **"Activity" label and card:**
   - The benchmark has a big number "N contributions in 24 weeks", a weekly sparkline with a start label and "This week", and two cells: "Requests shipped" and "Votes received". No API gives these values.
   - v1 shows three stat cells with the numbers that `getQuillsUser` returns: Requests (`postCount`), Comments (`commentCount`) and Votes (`voteCount`).
   - The chart and the other two numbers need 5.4.
3. **"Traits" label with a `+` icon button:**
   - Rows of "label: value" from `getQuillsUser.attributes`. Take the label and the type from `listQuillsUserAttributes`.
   - `+` opens a dialog. It has an attribute select (only defined attributes) and a value input that follows the type (text, number, switch, date). It saves with `updateQuillsUser` `{ attributes: { [key]: value } }`.
   - The row kebab has "Remove", which sends `{ [key]: null }`.
   - When no attribute definitions exist, hide `+`.

**Kebab actions:**

- "Block" or "Unblock": `blockQuillsUser` or `unblockQuillsUser`. Both hooks exist.
- "Remove member": `deleteQuillsUser`, after a `ConfirmDialog`. The API returns 409 when the person still authors posts, comments or conversations. Show the message of the API.

**States:** loading, not found (404) and failed, through `TeamStateView`.

**Data:**

| Use | Operation | Hook |
|---|---|---|
| Profile and counts | `getQuillsUser` | `use-get-user` exists |
| Requests tab | `listQuillsPosts` | `use-list-posts` exists. It needs the new author filter (5.1). |
| Status name and color | `listQuillsStatuses` | exists |
| Board name | `listQuillsBoards` | exists |
| Comments tab | none | needs 5.2 |
| Traits | `listQuillsUserAttributes`, `updateQuillsUser` | new hooks |
| Block, Unblock | `blockQuillsUser`, `unblockQuillsUser` | exist |
| Remove | `deleteQuillsUser` | new hook |

The benchmark shows three voter avatars on each request row. `listQuillsPostVoters` can give them, but each row costs one request. Leave them out of v1.

#### A3. Changelog list (image 23). Route `/feedback/{id}/changelog` (the existing route). [Quills]

**Shows:**

- **Header:**
  - The title "Changelog".
  - At the right: a round icon button for the filter, and a black primary button "New entry" with a `PenLine` icon.
- **Full-width rows** of about 50 px, split by lines, with a gray background on hover. Each row has:
  - The status icon:
    - A dashed circle (`CircleDashed`, muted) for `draft`.
    - `Clock` (warning) for `scheduled`.
    - `CircleCheck` (success) for `published`.
  - The title.
  - The date at the right ("MMM d"). Use `displayDate`, else `publishedAt`, else `createdAt`.
  - A click opens the editor.

**Controls:**

- The filter menu with radio items: All, Draft, Scheduled and Published. It sets the `status` query of `listQuillsChangelog`.
- "Load more" when `hasMore` is true. The list uses a cursor.

**Keep the existing features:**

- The existing page shows the engagement list (`listQuillsChangelogEngagement`) and the "draft from shipped requests" sheet (`DraftSheet`).
- Put the two lists under two tabs: "Entries" (the default) and "Engagement". Use `StatusTabs` from `apps/web/src/quills/ui/inbox/status-tabs.tsx`.
- `DraftSheet` gets one more button: "Create draft entry". It calls `createQuillsChangelogEntry` with the draft title, the body, `linkedPostIds` and `publishState: { type: "draft" }`. Then it opens the editor.

**Empty:** "No changelog entries yet", with the "New entry" button.

**Data:** `listQuillsChangelog` (drafts included) and `createQuillsChangelogEntry` (new hooks). The existing hooks for engagement and drafts stay.

#### A4. Changelog editor (images 24 to 27). Routes `/feedback/{id}/changelog/new` and `/feedback/{id}/changelog/{entryId}`. [Quills]

**Mode:** `focus`. There is no app sidebar. The page is full width and white.

**Top bar:**

- At the left: a back chevron (to the list).
- At the right:
  - The status pill button: "Draft" with a gray dot, "Scheduled" with an amber dot or "Published" with a green dot. It opens the publish popover.
  - An AI menu button (`Sparkles`). See "AI" below.

**Content column** (centered, about 720 px, large top space):

- **Title:** a borderless auto-growing textarea. Text-4xl, bold, placeholder "Untitled". Maximum 200 characters (the API limit).
- **Body:** a Markdown editor.
  - Use a borderless `Textarea` with a "Write" and "Preview" switch. Show the preview with `MarkdownContent`.
  - The benchmark shows rich text: headings, bullet lists, italics and links. Markdown gives the same output.
  - Maximum 100,000 characters (the API limit).
- **Images in the body (optional):** `createQuillsUpload` with `purpose: "changelog_image"`.

**Autosave (bottom left):**

- The benchmark has a floating pill at the bottom left with a cloud icon. Keep only the cloud: it shows the save state.
- The editor saves 1 s after the last keystroke with `updateQuillsChangelogEntry` `{ title, content }`.
- The icon states: saved (`Cloud`, muted), saving (spinner) and failed (`CloudOff`, destructive). A click on the failed icon tries again.
- On `/changelog/new`, the first save calls `createQuillsChangelogEntry` with `publishState: { type: "draft" }`. Then it replaces the URL with `/changelog/{id}`. Save only when the title is not empty.

**Publish popover** (image 26). It is anchored under the status pill, about 380 px wide, with a card style:

1. **Header:** the status and its dot.
2. **"Publishing" group card:**
   - Row "Publish" (`Rocket` icon) with a segmented control "Now | Later" (`ToggleGroup`).
   - When "Later" is set: a row "Date" with an `<input type="datetime-local">`. It sets `publishAt`.
   - Row "Link" (`Link` icon) with a `CopyField` that holds the portal URL of the entry, `/portal/{workspaceId}/changelog/{entryId}` (the portal route of `changelog-entry`).
   - A full-width outline button "Copy link".
3. **"Details" group card:**
   - Row "Author" (`User` icon): `entry.author.name`. It is read-only.
   - Row "Tags" (`Tag` icon): a multi-select "Add tags" over `listQuillsChangelogCategories`. It sets `categoryIds`.
   - Row "Linked requests" (`Link2` icon): a search multi-select over `searchQuillsShippedPosts`. It sets `linkedPostIds`. This row is not in the benchmark. The API supports it, and the existing draft flow uses it.
   - Row "Notify subscribers": a switch. It sets `notify`.
4. **Footer:**
   - A black full-width primary button. It says "Publish" (now), "Schedule" (later) or "Update" (already published). It calls `updateQuillsChangelogEntry` with `publishState: { type: "published" }` or `{ type: "scheduled", publishAt }`.
   - For a published or scheduled entry: a secondary button "Unpublish". It sends `publishState: { type: "draft" }`.
   - A red link "Delete entry": `deleteQuillsChangelogEntry` after a `ConfirmDialog`. Then go back to the list.

**AI** (image 25):

- The benchmark has a right panel with the assistant name, four suggestion chips and an "Ask…" input with a microphone and a send button.
- The API supports only text rewrites: `createQuillsAdminAssistantTransform`, with `kind` set to `fix_grammar`, `rephrase`, `more_concise`, `expand`, `more_friendly`, `more_formal` or `translate`. The text can have at most 8,000 characters.
- The summary of `createQuillsAdminAssistantCopilot` says that it is "about a conversation or ticket".
- v1:
  - Show no side panel.
  - The `Sparkles` menu applies a transform to the selected text, or to the body when the body has 8,000 characters or fewer.
  - Show the menu only when `getQuillsAssistantSettings.aiConfigured` is true.
  - The result replaces the text after the user accepts it.

**Leave out:**

- **Editable slug:** a changelog entry has no slug field. The link uses the entry ID.
- **"Add authors":** the entry has one read-only `author`. No body field writes it.
- **The second icon in the bottom-left pill** (image 27). It opens a popover with a swatch, the value "Off", a chevron and a five-step slider. Its purpose is not clear from the image, and no API backs it.
- **The AI chips** "suggest titles", "add tags" and "find the requests" as free questions. No API backs them. "Linked requests" covers the last one without AI.

**States:** loading, not found and failed for `getQuillsChangelogEntry`. Conflicts and validation errors show in a toast and keep the local text.

**Data:**

| Use | Operation | Hook |
|---|---|---|
| Read the entry | `getQuillsChangelogEntry` | new |
| Create | `createQuillsChangelogEntry` | new |
| Save, publish, schedule | `updateQuillsChangelogEntry` | new |
| Delete | `deleteQuillsChangelogEntry` | new |
| Tags | `listQuillsChangelogCategories` | new (lane S, shared) |
| Linked requests | `searchQuillsShippedPosts` | `use-search-shipped-posts` exists |
| AI rewrite | `createQuillsAdminAssistantTransform` | new |
| AI on or off | `getQuillsAssistantSettings` | new (lane P) |

#### A5. Share (images 28 to 30). Route `/feedback/{id}/share`. [Quills and Kaneo]

**Frame:** the settings frame (1.4) with the `h1` "Share". The column is about 820 px.

**Section 1: "Collect feedback"** (a heading and a subtitle with the workspace name):

- A card with:
  - the title "{workspace} board is live" and a green dot;
  - one line of help;
  - the portal URL as a link;
  - two pill buttons: a black "Copy link" and an outline "Visit" (opens in a new tab).
- The benchmark has a faded icon pattern at the right of the card. Leave it out.

**Section 2: "Share on social"** (a small uppercase label and a subtitle):

- A two-column grid of four link rows: X, LinkedIn, Facebook and Reddit.
- Each row has an icon, the network name, one muted line and an `ArrowUpRight` icon at the right.
- Each row opens the share URL of the network in a new tab, with the portal URL and the workspace name.
- These are client-only links. No API is needed.
- Do not copy the benchmark's logos. Use a generic `Share2` icon, unless Kaneo already ships brand marks.

**Section 3: "Email signature"** (label and subtitle):

- A preview card:
  - three skeleton lines (`Skeleton`) and a divider;
  - the teammate avatar and "{user name} from {workspace}";
  - a question line and a link "Share your feedback →".
- Under the card: the outline button "Copy snippet". It copies HTML and plain text.

**Section 4: "Add to your app or website"** (label and subtitle):

- A preview card with skeleton lines and a footer row. The footer row has "© {workspace}" at the left and the links Feedback, Roadmap and Changelog at the right.
- Show only the links for enabled areas: `listQuillsSettings.modules` and the `enabled` flag of each item in `getQuillsPortalSettings.nav`.
- The button "Copy all links" copies one URL on each line.

**Section 5: "Ready-to-paste messages"** (label and subtitle):

- An accordion card with six rows. Each row has an icon, a title, a muted line and a chevron. The rows are:
  1. Team chat (`MessageCircle`)
  2. Email to users (`Mail`)
  3. Community post (`Users`)
  4. Support reply (`Headset`)
  5. Customer announcement (`MailPlus`)
  6. Note to your developer (`Code`)
- An open row shows a read-only message and a "Copy" button.
- Kaneo writes the six message templates as new i18n keys with the `{workspace}` and `{url}` values. Do not reuse the benchmark's wording.

**Section 6: "Widget embed"** (label and subtitle):

1. Step "1. Load the widget":
   - A code block with line numbers and a "Copy" button at the top right.
   - The code is `<script src="{apiUrl}/quills-public/{slug}/widget/sdk.js" defer></script>`, from `packages/widget/README.md`.
2. Step "2. Start it":
   - A code block with `Quackback("init")`. Add the options `position` and `theme` when you want them.
3. "Optional: identify your users":
   - A code block for `Quackback.identify({ ssoToken })`.
   - One line explains that the host app signs the token with the widget signing secret (Settings › Login).
   - `identifyQuillsWidgetVisitor` takes only a signed `ssoToken`.
4. Buttons:
   - A black "Copy all" button.
   - An outline "Create install code" button. It calls `mintQuillsWidgetInstallCode` inside a `ConfirmAction` (rule C9) and shows the code. The code expires after 15 minutes and works twice (from the API description).
   - A muted link "View docs →" to `https://kaneo.app/docs`.

**Data:**

| Value | Source |
|---|---|
| Portal URL | `listQuillsCustomDomains`: the `portal` domain with `active: true`. Else the absolute `portalHref(workspaceId)`. `listQuillsCustomDomains` needs `manage_settings`. On a 403, use the fallback. |
| Workspace name and slug | `listQuillsSettings` (`name`, `slug`) [Quills, mirrored from Kaneo] |
| Teammate name and avatar | the Kaneo session (`useAuth`) [Kaneo] |
| Enabled areas | `listQuillsSettings.modules`, `getQuillsPortalSettings.nav` |
| Install code | `mintQuillsWidgetInstallCode` |
| API base URL | the web app's configured API URL (`@kaneo/libs`) |

**Nav change:** the "Share" item in `nav.ts` copies the portal link now (`copy: true`). It changes to the route `/feedback/{id}/share`.

### Group B: the settings area

#### B1. Account (image 31). `/settings/account`. [Kaneo]

**Benchmark:**

- A "Profile" card: an avatar, first name and last name inputs stacked with a line between them, and an "Email" row with a green "Verified" badge. A "Save" button sits under the card.
- An "Appearance" card: a "Theme" row with a select (System).
- A "Settings" card: a "Sign-in method" row with the provider as text.
- A "Danger zone" card: "Delete account" in red with a description.

**Kaneo build:**

1. Render Kaneo's `ProfilePage`, exported through `upstream.ts`. It has the avatar, the name, the managed-profile note and the delete account section. It already handles OAuth-managed fields.
   - Kaneo has one `name` field, not two.
   - Kaneo autosaves the name (`AutosaveNote`) instead of using a Save button. Keep Kaneo's behavior.
2. Add an "Appearance" section with one row: "Theme", a select with System, Light and Dark. Use Kaneo's theme provider (`apps/web/src/components/providers/theme-provider`). This is a client preference with no API.
3. Add a "Sign-in methods" row. It shows the linked providers from the Kaneo hook `use-list-accounts` as text.
4. Show the "Verified" badge only when the session user has `emailVerified` true. `getCurrentUser` does not return this field.

**Data:**

- `getCurrentUser`, `uploadUserAvatar` and `deleteUserAvatar`.
- Name update: better-auth `authClient.updateUser`. It has no operation ID in openapi.json.
- Delete account: `authClient.deleteUser`. No operation ID.
- Linked providers: `authClient.listAccounts`. No operation ID.

#### B2. Branding (image 32). `/settings/branding`. [Quills]

**Section "Brand":**

- A card with one row: the logo (40 px) at the left and the brand name next to it.
  - A click on the logo opens a file picker for PNG, JPEG, WebP and SVG.
  - The upload has three steps:
    1. `createQuillsSettingsUpload` `{ purpose: "logo", filename, contentType, size }`.
    2. A `PUT` of the file to `uploadUrl` with the returned headers.
    3. `saveQuillsLogoKey` `{ key, contentType, size }`.
  - A small menu on the logo has "Remove logo" (`deleteQuillsLogo`).
  - Read the current logo URL from `getQuillsPublicPortalConfig.branding.logoUrl`. The hook `use-get-public-portal-config` exists. No teammate route returns the logo URL.
  - The name is an input for `headerDisplayName`. Its placeholder is the workspace name.
- A "Save" button under the card. It calls `updateQuillsBrandingSettings` `{ headerDisplayName }`.
- The workspace name itself is Kaneo data (`updateOrganization`). `listQuillsSettings` marks it read-only. Do not edit it here.
- One extra row that the benchmark does not have: "Header shows", a select with "Logo and name" and "Logo only". It sets `headerDisplayMode`. Leave out `custom_logo`, because it needs a header logo upload.

**Section "Appearance":**

- Row "Primary color": a select with a color dot and a name (eight named colors from a web constant).
  - It writes `theme.light.primary` and `theme.dark.primary` (and their `primaryForeground`).
  - Send the full `theme` object that you read from `getQuillsBrandingSettings`, with only these keys changed. The description says only that fields that are not sent keep their value. I did not check how the API merges nested `theme` keys.
- Row "Theme": a select with Dynamic, Light and Dark. It sets `theme.themeMode` to `user`, `light` or `dark`.

**Section "Public board":**

- Row "Hide 'Powered by'": a `SettingSwitchRow`.
  - `checked = !showPoweredBy` from `getQuillsPoweredBy`. A change calls `setQuillsPoweredBy`.
  - A 402 response sets the locked state, with the reason "Needs an active plan".

**Data:** `getQuillsBrandingSettings`, `updateQuillsBrandingSettings`, `createQuillsSettingsUpload`, `saveQuillsLogoKey`, `deleteQuillsLogo`, `getQuillsPublicPortalConfig`, `getQuillsPoweredBy` and `setQuillsPoweredBy`.

#### B3. Languages (image 33). `/settings/languages`. [Quills]

**Benchmark:**

- A section "Languages" with a "+ Add language" pill.
- One card. The first row is "Default language" with a description and a select (flag and name). Then one row for each language (flag and name) with a kebab.
- A note under the card says which areas the languages cover.

**Kaneo scope:** help-center languages only. The portal and the widget use the language that each visitor picks (`getQuillsMyLanguagePreference` and `setQuillsMyLanguagePreference`). No workspace setting exists for them. The note under the card says this.

**Build:**

- **Row "Default language":** the name of `locales.default`. It is read-only. No route changes the default (see 5.8).
- **One row for each `locales.additional` entry:**
  - The language name from the stdlib `Intl.DisplayNames`, and a small monospace chip with the locale code. Do not use flag images.
  - The kebab has "Edit homepage text" and "Remove".
  - "Edit homepage text" opens the add dialog with the stored `chrome` values. `enableQuillsHelpCenterLocale` replaces the text of an enabled locale.
  - "Remove" calls `disableQuillsHelpCenterLocale` with `?locale=`. The API keeps the translations for a later re-enable.
- **The "+ Add language" dialog:**
  - A language select. It lists the `enableQuillsHelpCenterLocale` enum (`en`, `de`, `fr`, `es`, `ar`, `ru`, `pt-br`, `zh-cn`, `zh-tw`, `nl`, `pl`, `th`, `uk`) without the enabled locales.
  - "Homepage title" (required, maximum 200 characters).
  - "Homepage description" (maximum 500 characters).
  - "Search placeholder" (maximum 200 characters).
- **Empty:** when there are no additional languages, show `SettingsEmpty` in the card under the default row.

**Data:** `getQuillsHelpCenterSettings`, `enableQuillsHelpCenterLocale` and `disableQuillsHelpCenterLocale`.

#### B4. Domain (images 34 and 35). `/settings/domain`. [Quills]

**Benchmark:**

- A section "Custom domain" with a "+ Add domain" pill.
- A card with one row: a globe icon and the host name in a monospace font.
- A note under the card.
- The "Add domain" dialog: a title, a description, the label "Domain", an input with a fixed prefix, and a footer with "Cancel" and "Save" (disabled until the input has text).

**Kaneo build:**

- **Default row:** a globe icon and the default portal host in monospace. This is the absolute `portalHref`.
- **When a portal domain exists** in `listQuillsCustomDomains` (`kind: "portal"`), the row shows:
  - the domain;
  - a `StatusBadge`: "Active" (success) when `active` is true; "Pending" (warning) when `checkResult` is null; "Record not found" (destructive) for `missing`; "No DNS answer" (destructive) for `unanswered`;
  - a "Check now" button (`verifyQuillsPortalDomain`). The API queues a DNS check, and the list shows the result after the worker runs. Refetch after a few seconds.
  - a kebab with "Remove domain" (`removeQuillsPortalDomain`, confirm).
- **While the domain is not active,** a second row shows the TXT record: `record.type`, `record.name` and `record.value`. Each value has a `CopyField`.
- **The "Add domain" dialog:**
  - An `InputGroup` with the fixed prefix "https://" and the placeholder "feedback.example.com". The benchmark forces a "feedback." subdomain. Kaneo takes any host name up to 253 characters.
  - "Save" calls `setQuillsPortalDomain`.
  - Hide "+ Add domain" while a portal domain exists. Use "Remove domain", then add a new one.
- **Plan lock:** when `entitled` is false, disable "+ Add domain" and "Check now" and show the lock. "Remove domain" stays enabled. The API always allows it.
- **Help center:** add a second section "Help center domain" with the same component. Show it only when `modules.helpCenter` is true. It uses `setQuillsHelpCenterDomain`, `verifyQuillsHelpCenterDomain` and `removeQuillsHelpCenterDomain`.

**Data:** `listQuillsCustomDomains`, `setQuillsPortalDomain`, `verifyQuillsPortalDomain` and `removeQuillsPortalDomain`, plus the three help-center operations.

#### B5. Feedback (images 36 to 40). `/settings/feedback`. [Quills]

**Section "Behavior":**

- **"Public roadmap":** a `SettingSwitchRow`.
  - It sets `enabled` on the portal nav item with `type: "roadmap"`.
  - Read the item from `getQuillsPortalSettings.nav`.
  - Write with `updateQuillsPortalSettings` `{ nav }`. Send the full nav list with only this item changed.
  - The API documents that nav items control the portal tabs. I did not check whether a disabled item also blocks the direct URL.
- **"Weekly digest emails":** leave it out. The only digest operations (`getQuillsMyWeeklyDigestPreference` and `setQuillsMyWeeklyDigestPreference`) are per customer. No workspace switch exists (see 5.7).

**Section "Boards"** (action "+ New board"):

- **Each row:** the board name, then at the right a visibility select and a kebab.
  - The benchmark has a drag handle and a color dot. Boards have no `position` and no `color` column, so leave both out (see 5.5 and 5.6).
  - The visibility select reads and writes `access.view`:

    | Label | Value |
    |---|---|
    | Public | `anonymous` |
    | Signed-in | `authenticated` |
    | Team only | `team` |
    | Segments | `segments`. Read-only here. Change it on the board settings page. |

  - `updateQuillsBoard` requires the full `access` object. Send the stored `access` with only `view` changed. Check with the board access tests that vote, comment and submit behave as expected.
- **The kebab:**
  - "Rename board": a dialog with one name input (maximum 100 characters). It calls `updateQuillsBoard` `{ name }`. The API moves the slug when the new slug is free.
  - "Voting and task sync": a link to the existing `/feedback/{id}/settings/boards` page.
  - "Delete board" (red): a `ConfirmDialog` that says, from the API description, that the posts of the board leave every list and that merged posts are unmerged. It calls `deleteQuillsBoard` (a soft delete).
- **"New board" dialog** (image 37): a title, a description and a "Name" input (placeholder, maximum 100 characters). The footer has "Cancel" and "Create". It calls `createQuillsBoard` `{ name }`. Leave out the benchmark's color select (no API).
- **Note:** replace the benchmark's plan usage line with one line that explains the visibility values. No plan limit API exists.
- **Empty:** "No boards yet", with "New board".

**Section "Tags"** (action "+ New tag"):

- **Each row:** a `Tag` icon in the tag's own `color` (the API returns it), the name and a kebab.
- **The kebab:**
  - "Rename tag": `updateQuillsTag` `{ name }`.
  - "Delete tag" (red): `deleteQuillsTag` after a confirmation.
- **"New tag" dialog** (image 39): a title, a description and a "Name" input (maximum 50 characters). It calls `createQuillsTag` `{ name }`.
- **Empty:** "No tags yet", with "New tag".
- **Note:** leave out the plan usage line.

**Data:**

| Use | Operation | Hook |
|---|---|---|
| Portal nav | `getQuillsPortalSettings`, `updateQuillsPortalSettings` | new (lane S, shared) |
| List boards | `listQuillsBoards` | `use-list-boards` exists |
| Create board | `createQuillsBoard` | new |
| Rename, visibility | `updateQuillsBoard` | `use-update-board` exists |
| Delete board | `deleteQuillsBoard` | new |
| List tags | `listQuillsTags` | `use-list-tags` exists |
| Tag writes | `createQuillsTag`, `updateQuillsTag`, `deleteQuillsTag` | new |

#### B6. Changelog settings (images 41 and 42). `/settings/changelog`. [Quills]

**Section "Behavior":**

- **"Public changelog":** a `SettingSwitchRow`. It sets the portal nav item with `type: "changelog"`. It works the same way as "Public roadmap" in B5.
- `getQuillsChangelogSettings` also has `audience` (`public` or `authenticated`), `autoSubscribe` and `emailsDisabled`. The benchmark has none of them. Add them later as rows if the owner wants them.

**Section "Tags"** (action "+ New tag"). The tags are changelog categories:

- **Each row:** a `Tag` icon in the category `color`, the name and a kebab.
- **The kebab:**
  - "Rename": `updateQuillsChangelogCategory`.
  - "Delete tag" (red): `deleteQuillsChangelogCategory`.
- **"New tag" dialog:** a "Name" input (maximum 50 characters). It calls `createQuillsChangelogCategory`.
- **Order:** `reorderQuillsChangelogCategories` exists, but the benchmark has no drag handle. Leave reordering out of v1.
- **Empty:** "No tags yet".

**Data:** `getQuillsPortalSettings` and `updateQuillsPortalSettings`; `listQuillsChangelogCategories`, `createQuillsChangelogCategory`, `updateQuillsChangelogCategory` and `deleteQuillsChangelogCategory`.

#### B7. Privacy & Access (image 43). `/settings/privacy`. [Quills]

**Section "Public board":**

- **"Guest submissions":** a `SettingSwitchRow`. It reads `features.allowAnonymous` from `getQuillsPortalSettings` and writes `updateQuillsPortalSettings` `{ allowAnonymous }`.
- **"Moderate submissions":** a **select**, not a switch, because the API has four values. It reads `moderationDefault.requireApproval` and writes `setQuillsModerationDefault` `{ requireApproval }`.

  | Label | Value |
  |---|---|
  | Off | `none` |
  | Guests only | `anonymous` |
  | Signed-in people | `authenticated` |
  | Everyone | `all` |

- **Leave out:**
  - "Moderate comments": no workspace field exists. Comment moderation is per board (`access.moderation.comments` in `updateQuillsBoard`).
  - "Detect sensitive information": no backend feature exists.
  - "Mask public identities": no backend feature exists.

**Section "Access"** (Kaneo has it, the benchmark does not):

- **"Portal visibility":** a select with Public and Private. It calls `updateQuillsPortalAccess` `{ visibility }`.
- **"Allowed email domains":** shown when the portal is Private. It is a text input for a comma-separated list (each domain at most 253 characters), with a "Save" button. It sets `allowedDomains`.
- **Note:** "Workspace members always have access." This comes from the API description.

**Data:** `getQuillsPortalSettings`, `updateQuillsPortalSettings`, `setQuillsModerationDefault` and `updateQuillsPortalAccess`.

#### B8. Login & SSO (image 44). `/settings/login`. [Quills and Kaneo]

**Section "Authentication":**

- **"Sign-in methods":** a read-only row. The benchmark has a locked select (Default, SSO, Disabled). In Kaneo, the portal uses the sign-in methods of the instance. Read them from `getConfig`: `hasGoogleSignIn`, `hasGithubSignIn`, `hasDiscordSignIn`, `hasCustomOAuth` with `customOAuthName`, and `disableLoginForm`. Show them as text. The description says that an instance administrator changes them. [Kaneo]
- **"Open sign-up":** a `SettingSwitchRow`. It writes `updateQuillsPortalSettings` `{ openSignup }`. The read value can be null. Show null as off.
- **"Automatic login from your app":** leave it out. `getQuillsPortalSettings` returns `access.widgetSignIn`, but no route writes it (see 5.9).
- **"Signed tokens":** a read-only info row, not a switch. `identifyQuillsWidgetVisitor` takes only a signed `ssoToken`.
- **Note:** a link to `https://kaneo.app/docs`.

**Section "Secrets":**

- **"Workspace ID":** a `CopyField` with the workspace ID. The description says that the widget and the API use it.
- **"Widget signing secret":** a masked `CopyField` (the first 12 characters, then "…") with a copy button. It reads `getQuillsWidgetSecret`. When the value is null, show a "Create secret" button instead.
- **"Rotate secret":** a red title with a description. From the API description: the old secret stops working at once. It calls `rotateQuillsWidgetSecret` inside `ConfirmAction` (rule C9). Then it shows the new secret once, with a copy button.
- The benchmark's revoke also invalidates API tokens. The Kaneo rotate does not. Say only what the API description says.
- Both secret operations need `manage_settings`.

**Data:** `getConfig` [Kaneo]; `getQuillsPortalSettings`, `updateQuillsPortalSettings`, `getQuillsWidgetSecret` and `rotateQuillsWidgetSecret` [Quills].

#### B9. Integrations (image 45). `/settings/integrations`. [Quills]

**Benchmark:**

- A card "Your accounts": a personal Slack link with "Connected" and a kebab.
- A card "Available integrations": rows with an icon, a name, one line of text and a "Connect" button.
- A card "Suggest integration".
- A plan usage note.

**Kaneo build:**

- **Leave out "Your accounts".** No route lists the external accounts of one teammate.
- **Section "Integrations":** one row for each provider of `listQuillsIntegrationCatalog` with `available: true`.
  - Left: a generic `Plug` icon, the `name` and the `description`.
  - Right: when `listQuillsIntegrations` has a connection with the same `integrationType`, a `StatusBadge` "Connected" (success) and a kebab with "Disconnect". Else a "Connect" button.
- **"Connect" by provider type:**
  - **OAuth:** `startQuills{Provider}OAuthConnect` returns `authorizeUrl`. Open it in the same tab, because the state is bound to the session and expires in 10 minutes. The return page `oauth-result` exists. The providers are Asana, ClickUp, Discord, GitHub, GitLab, HubSpot, Intercom, Jira, Linear, Monday, Notion, Salesforce, Slack, Teams, Trello and Zendesk.
  - **Key or webhook:** a dialog with one secret field. It calls `saveQuillsStripeKey`, `saveQuillsShortcutToken`, `saveQuillsAzureDevopsKey`, `saveQuillsFreshdeskKey`, `saveQuillsMakeWebhook`, `saveQuillsN8nWebhook`, `saveQuillsZapierWebhook`, `saveQuillsNtfy` or `saveQuillsSegmentConnection`. A 400 shows "The key was rejected". A 502 shows "The provider did not answer".
- **"Disconnect":** `deleteQuillsIntegration` after a `ConfirmDialog`. The dialog says, from the API description, that the connection, its credentials, its mappings and its links are deleted.
- **Leave out "Suggest integration" and the plan note.** No API backs them.
- Integration details (status sync, channels, destinations) are out of v1.

**Data:** `listQuillsIntegrationCatalog`, `listQuillsIntegrations`, the 16 `startQuills*OAuthConnect` operations, the 9 `saveQuills*` connection operations and `deleteQuillsIntegration`.

#### B10. Data & Import (image 46). `/settings/data`. [Quills and Kaneo]

**Section "Import":** navigation rows with a leading icon, a label and a `ChevronRight`.

- **Only "Import from CSV" has an API.** Leave out Canny, ProductRoad, Nolt and the help center. `createQuillsImport` imports CSV only.
- **"Import from CSV"** opens a `Sheet` with:
  - a board select (`listQuillsBoards`);
  - a `.csv` file input;
  - a help list of the columns from the API description: `title` and `content` are required; `status`, `tags`, `board`, `author_email`, `author_name`, `created_at` and `source_id` are optional;
  - a "Start import" button. It runs three steps:
    1. `createQuillsUpload` `{ purpose: "file" }`.
    2. A `PUT` of the file to `uploadUrl`.
    3. `createQuillsImport` `{ key, contentType, size, name, boardId }`.
- **Under the rows:** "Recent imports" from `listQuillsImportRuns` (limit 5).
  - Each row has the file name, a status badge and the totals (created, updated, skipped, errors).
  - Poll the run list every 10 s while a run is `pending` or `running`. The framework allows no poll interval below 10 s. `dry_run` is a final state.
  - Show the `errorReport` of a failed run.
  - The API checks every row first. One invalid row fails the run, and nothing is imported.

**Section "Export":**

- **"Export to CSV"** opens a dialog with a "Data" select: Posts, People, Companies or Conversations (`kind`). It calls `createQuillsExportWorkspace`.
- Poll the export run list every 10 s until no run is `pending` or `running`.
- "Download" calls `listQuillsExportRunsDownload` and opens `downloadUrl`.
- "Recent exports" comes from `listQuillsExportRuns`.
- The API runs only one export for each workspace at a time. Show its error on a conflict.

**Section "Danger zone":**

- **"Delete feedback and support data"** [Quills]:
  - A `ConfirmDialog` with a text input. The user must type the workspace slug (`listQuillsSettings.slug`). It calls `wipeQuillsWorkspaceData` `{ confirm: slug }`.
  - The dialog lists what the API deletes: feedback, support, the help center, the status page, customer data and the Quills configuration. It also says that the deletion cannot be undone.
- **"Delete workspace"** [Kaneo]: a link row to Kaneo's `/dashboard/settings/workspace/general`. Deleting the Kaneo workspace also deletes projects and tasks. Keep that action in Kaneo's own danger zone.

**Data:** `createQuillsUpload`, `createQuillsImport`, `listQuillsImportRuns`, `getQuillsImportRuns`, `createQuillsExportWorkspace`, `listQuillsExportRuns`, `getQuillsExportRuns`, `listQuillsExportRunsDownload` and `wipeQuillsWorkspaceData`. Kaneo: `deleteOrganization`, through its own page.

#### B11. API (image 47). `/settings/api`. [Kaneo and Quills]

**Benchmark:**

- A section "Tokens" with a monospace "N active" count and "+ New token".
- Token rows: a generated dot avatar, the name, a monospace caption ("CREATED {date}" or "LAST USED {date}"), a masked key pill, and either a "REVOKED" outline badge (the row is dimmed) or a kebab and a "REVOKE" button.
- A note under the card.
- A section "Connected apps" with an empty state.

**Kaneo build:**

- **Section "API keys"** [Kaneo]: render Kaneo's `ApiKeysSettings` through `upstream.ts`. It already lists, creates and deletes keys and shows expiry. The keys belong to the signed-in user, not to the workspace. Say this in the note.
- **Section "Developer access"** [Quills] (not in the benchmark). Four `SettingSwitchRow`s: "MCP server" (`mcpEnabled`), "MCP for portal users" (`mcpPortalAccessEnabled`), "OAuth client registration" (`oauthDynamicClientRegistrationEnabled`) and "Personal API keys" (`personalApiKeysEnabled`). These are the workspace switches for API access.
- **Leave out "Connected apps".** No teammate route lists the OAuth clients that signed in (table `quills.oauth_client`; see 5.10). `listQuillsAppRegistrations` lists sidebar apps, which are a different thing.

**Data:**

- API keys: better-auth `authClient.apiKey.list`, `create` and `delete`. They have no operation ID in openapi.json.
- Developer switches: `getQuillsDeveloperSettings` and `updateQuillsDeveloperSettings`.

#### B12. Sidebar items without a screenshot

The owner sent no screenshot of these pages. Build them with the frame in 1.4 and only the fields below. They have lower priority than the screens above.

| Item | Owner | Content | Operations |
|---|---|---|---|
| Team | Kaneo | Kaneo's `MembersTable` and `InviteTeamMemberModal` through `upstream.ts` | `getOrganizationFullOrganization`, `getWorkspaceMembers`, `inviteOrganizationMember`, `listOrganizationInvitations`, `cancelOrganizationInvitation`, `updateOrganizationMemberRole`, `removeOrganizationMember` |
| Billing | Kaneo | Kaneo's `BillingSettingsPage` through `upstream.ts`. Shown only when `getConfig.billingEnabled` is true. | The Kaneo route `GET /billing/{workspaceId}` (fetcher `getBilling`). It has no operation ID in openapi.json. |
| General | Quills | Office hours (on or off, time zone, weekly intervals, holidays); routing (on or off); email auto-reply (on or off); close abandoned chats (on or off, wait minutes); close spam (on or off); default SLA policy (select); support in the portal (on or off) | `getQuillsOfficeHours`, `setQuillsOfficeHours`, `getQuillsConversationRouting`, `setQuillsConversationRouting`, `getQuillsEmailAutoAck`, `setQuillsEmailAutoAck`, `getQuillsWorkflowAbandonedAutoClose`, `setQuillsWorkflowAbandonedAutoClose`, `getQuillsWorkflowCloseSpam`, `setQuillsWorkflowCloseSpam`, `getQuillsDefaultSlaPolicy`, `setQuillsDefaultSlaPolicy`, `listQuillsSlaPolicyOptions`, `updateQuillsPortalSettings` (`supportEnabled`) |
| Operators | Quills and Kaneo | A teammate list with roles; "My availability" (Online or Away, only for yourself); support teams bound to Kaneo teams | `listQuillsPrincipals`, `setQuillsAgentAvailability`, `listQuillsTeams`, `bindQuillsTeam`, `updateQuillsTeam`, `updateQuillsTeamBinding`, `deleteQuillsTeam`, `listOrganizationTeams` [Kaneo] |
| Topics | Quills | Conversation tags with open counts; create, rename, archive, restore and delete | `listQuillsConversationTags` (`counts=true`), `createQuillsConversationTag`, `updateQuillsConversationTag`, `archiveQuillsConversationTag`, `restoreQuillsConversationTag`, `deleteQuillsConversationTag` |
| Email | Quills | Inbound forwarding address and trust; sending addresses (with optional SMTP); sending domains and their checks; recent email log | `getQuillsEmailChannelConfig`, `getQuillsEmailChannelStatus`, `setQuillsInboundForwarding`, `clearQuillsInboundForwarding`, `setQuillsInboundTrust`, `createQuillsSendingAddress`, `setQuillsSendingAddressSmtp`, `deleteQuillsChannelAccount`, `listQuillsSendingDomains`, `restartQuillsSendingDomainChecks`, `deleteQuillsSendingDomain`, `listQuillsRecentEmailLog` |
| Widget | Quills | On or off; position (bottom right or bottom left); launcher label and greeting; tabs (6 switches); home header style and cards; hero image; visitor analytics switches | `getQuillsWidgetSettings`, `updateQuillsWidgetSettings`, `createQuillsSettingsUpload` (`widget_hero`), `saveQuillsWidgetHeroImageKey`, `deleteQuillsWidgetHeroImage` |
| AI | Quills | Assistant name; tone and length; extra instructions; knowledge source switches; copilot Q&A switch. Show "AI is not set up on this instance" when `aiConfigured` is false. Send `revision`. A 409 means that another person saved first, so reload. | `getQuillsAssistantSettings`, `updateQuillsAssistantSettings` |
| Moderation | Quills | A queue of posts and comments that wait for review, with Approve and Reject; spam filter (trusted senders, AI classifier); flagged messages | `getQuillsModerationStatus`, `listQuillsPendingModeration`, `approveQuillsPost`, `rejectQuillsPost`, `approveQuillsComment`, `rejectQuillsComment`, `getQuillsSpamFilterConfig`, `updateQuillsSpamFilterConfig`, `listQuillsFlaggedMessages` |

---

## 4. Implementation lanes

Four lanes. Lane S runs first. Lanes W, P and M start from the merged shell and run in parallel.

### Shared files (additive edits only; lane Z merges and regenerates them)

- `apps/web/src/quills/ui/upstream.ts`: each lane appends its own export block.
- The Quills i18n index (registration of new namespace files).
- `apps/web/src/quills/dev/kit-gallery.tsx`.
- `apps/docs/openapi.json`, `routeTree.gen.ts` and `scripts/quills-port/seams.json`.

### Hook rule

Each `apps/web/src/quills/hooks/team/use-<operation>.ts` and `apps/web/src/quills/api/<area>/<operation>.ts` file belongs to the one lane that first needs it. Lane S makes the hooks that two or more lanes need, before the fan-out:

- `listQuillsSettings`
- `getQuillsPortalSettings`
- `updateQuillsPortalSettings`
- `listQuillsChangelogCategories`
- `listQuillsCustomDomains`
- `getQuillsWidgetSettings`

The existing hooks are read-only for all lanes.

### Lane S: settings shell and shared parts (first), then Connections

| Owns | Files |
|---|---|
| Shell mode | `apps/web/src/quills/team/shell-mode.ts` and its test |
| Settings nav | `apps/web/src/quills/team/settings-nav.ts`, `filter-settings-nav.ts` and their tests |
| Settings sidebar | `apps/web/src/quills/team/settings-sidebar.tsx` and its test |
| Shell swap | edits to `apps/web/src/quills/team/team-shell.tsx` and its test |
| Nav targets | edits to `nav-views.ts` (Settings → `/settings`) and `nav.ts` (Members → `/members`, Share → `/share`) and their tests |
| Shared parts | `apps/web/src/quills/ui/setting-switch-row.tsx`, `copy-field.tsx` and their tests, and the gallery entries |
| Upstream block | settings primitives, `ToggleGroup`, `Accordion` and the `Dialog` parts |
| Routes | `routes/_layout/_authenticated/feedback/$workspaceId/settings/index.tsx` (redirect) |
| i18n | `apps/web/src/quills/i18n/en-US/settings.json` (nav labels, shared strings) |
| Shared hooks | the six hooks listed above |
| Phase 2 pages | `pages/settings-integrations/`, `pages/settings-api/`, `pages/settings-data/` and the routes `settings/integrations/`, `settings/api/` and `settings/data/` |
| Phase 2 i18n | `apps/web/src/quills/i18n/en-US/settings-connections.json` |

### Lane W: Personal and Workspace settings

| Owns | Files |
|---|---|
| Pages | `pages/settings-account/`, `settings-branding/`, `settings-languages/`, `settings-domain/`, `settings-team/`, `settings-billing/` |
| Routes | `settings/account/`, `settings/branding/`, `settings/languages/`, `settings/domain/`, `settings/team/`, `settings/billing/` |
| Upstream block | `ProfilePage`, `MembersTable`, `InviteTeamMemberModal`, `BillingSettingsPage`, the theme hook and `use-list-accounts` |
| i18n | `apps/web/src/quills/i18n/en-US/settings-workspace.json` |
| Hooks | branding, logo, powered-by, help-center locales and the domain write and verify hooks |

### Lane P: Product and Conversations settings

| Owns | Files |
|---|---|
| Pages, phase 1 | `pages/settings-feedback/`, `settings-changelog/`, `settings-privacy/`, `settings-login/` |
| Pages, phase 2 | `pages/settings-conversations-general/`, `-operators/`, `-topics/`, `-email/`, `-widget/`, `-ai/`, `-moderation/` |
| Routes | `settings/feedback/`, `settings/changelog/`, `settings/privacy/`, `settings/login/` and `settings/conversations/*/` |
| i18n | `settings-product.json` and `settings-conversations.json` |
| Hooks | board and tag writes, changelog category writes, moderation, widget secret, portal access, support, assistant settings (lane M reads `getQuillsAssistantSettings` from this lane) |
| API (only if the owner approves 5.5 to 5.9) | `apps/api/src/quills/feedback/boards.ts`, `apps/api/src/quills/settings/portal.ts`, the help-center settings route and one migration in `drizzle/quills` |

### Lane M: group A workspace pages

| Owns | Files |
|---|---|
| Pages | `pages/team-members/`, `team-member/`, `team-share/`, `team-changelog-entry/` and the existing `team-changelog/` (rework) |
| Routes | `feedback/$workspaceId/members/index.tsx`, `members/$principalId/index.tsx`, `share/index.tsx`, `changelog/new/index.tsx`, `changelog/$entryId/index.tsx` and the existing `changelog/index.tsx` |
| i18n | `team-members.json`, `team-share.json` and the existing `team-changelog.json` |
| Hooks | changelog entry CRUD, transform, user attributes, `deleteQuillsUser`, `mintQuillsWidgetInstallCode` |
| API | `apps/api/src/quills/feedback/posts.ts` (5.1) and the directory module for 5.2, with tests under a real database. 5.3 and 5.4 are optional. |

### Order

1. Lane S builds the shell, the shared parts and the shared hooks. Lane Z merges them.
2. Lanes W, P (phase 1) and M run in parallel.
3. Lane S (phase 2) and lane P (phase 2) run after that.

### Done

A lane is done when all of these are true:

1. Each page has loading, empty and error states.
2. The web tests and conformance (`apps/web/src/quills/conformance.test.ts`) pass. The rules include C14 (`PageFrame`, `TeamStateView`), C18 (200 lines per file), C22 (`PortalForm`) and C9 (`ConfirmAction`).
3. `pnpm typecheck` and lint pass.
4. Any new API route has contract and read-leak tests under a real database, and `pnpm openapi:check:fix` is clean.
5. The review team finds no blocking issue.

---

## 5. New API routes and fields

Every item follows `apps/api/AGENTS.md`. Use `defineQuillsRoute` and `withQuillsRequest`, check `workspace:read + quills:<action>`, record an outbox event for each write, add contract and read-leak tests, and regenerate openapi.json. Do not open a pool, and do not use the global database. Items 5.1 and 5.2 block group A. The others are optional and need the owner's approval.

| # | Screen and control | Route | Method | Operation ID | Action | Tables |
|---|---|---|---|---|---|---|
| 5.1 | A2 Requests tab | `GET /posts` with a new query `authorPrincipalId` | GET | `listQuillsPosts` (existing) | read | `quills.posts` (`principal_id`). Keep every current filter: merged, test-customer and hidden-board posts stay out. |
| 5.2 | A2 Comments tab | `GET /users/{principalId}/comments` (`cursor`, `limit` ≤ 100) | GET | `listQuillsUserComments` (new) | read | `quills.post_comments` (`principal_id`), `quills.posts` (title and board visibility), `quills.post_comment_reactions` (count). Leave out deleted comments, comments on posts that the caller cannot see, and test customers. |
| 5.3 | A2 Activity tab | `GET /users/{principalId}/activity` (`offset`, `limit`) | GET | `listQuillsUserActivity` (new) | read | `quills.post_activity` (`principal_id`), `quills.posts`. It needs a new index on `(workspace_id, principal_id, created_at)`. That is a Quills migration made with `db:generate:quills`. |
| 5.4 | A2 Activity card: weekly contributions (24 weeks), requests shipped, votes received | `GET /users/{principalId}/stats` | GET | `getQuillsUserStats` (new) | read | `quills.posts` and `quills.post_statuses` (`category = complete`) for shipped; `quills.posts.vote_count` summed for votes received; `quills.posts`, `quills.post_comments` and `quills.post_votes` grouped by week for contributions |
| 5.5 | B5 board color dot and the color in "New board" | Add `color` to the bodies and responses of `createQuillsBoard` and `updateQuillsBoard` | POST and PATCH | existing | create and update | `quills.boards` with a new column `color text`. Migration. |
| 5.6 | B5 board drag handle | `PUT /boards/order` (the same shape as `reorderQuillsRoadmaps`) | PUT | `reorderQuillsBoards` (new) | update | `quills.boards` with a new column `position integer`. Migration. `listQuillsBoards` sorts by it. |
| 5.7 | B5 "Weekly digest emails" (workspace) | Add `weeklyDigestEnabled` to `updateQuillsPortalSettings` and `getQuillsPortalSettings` | PUT | existing | update | `quills.settings.portal_config`. The digest job must also check it. |
| 5.8 | B3 default language select | Add `defaultLocale` to `updateQuillsHelpCenterSettings` | PATCH | existing | update | `quills.settings.help_center_config` |
| 5.9 | B8 "Automatic login from your app" | Add `widgetSignIn` to the body of `updateQuillsPortalAccess` | PUT | existing | update | `quills.settings.portal_config` (`access.widgetSignIn`, already read by `getQuillsPortalSettings`) |
| 5.10 | B11 "Connected apps" | `GET /oauth-clients` and `DELETE /oauth-clients/{clientId}` | GET, DELETE | `listQuillsOAuthClients`, `revokeQuillsOAuthClient` (new) | read, delete | `quills.oauth_client`. Never return secrets. |

**Not a route.** These need a backend feature, not only a route. Leave them out, and ask the owner first:

- sensitive data detection (B7);
- public identity masking (B7);
- portal SSO with an own sign-in page (B8);
- personal linked accounts (B9);
- imports from Canny, ProductRoad, Nolt or the help center (B10);
- free-form AI chat for changelog drafts (A4);
- changelog slugs and multiple authors (A4);
- plan usage limits (B5, B9).

---

## 6. Risks and notes

1. **List writes replace the list.** `updateQuillsPortalSettings` with `nav` and `updateQuillsBoard` with `access` need the full stored value. A partial value can drop items or actions. Read first, change one key, then write.
2. **Branding `theme` merge is not checked.** Send the full object.
3. **`listQuillsCustomDomains` needs `manage_settings`.** The Share page must fall back to `portalHref` on a 403.
4. **Mode-based shell.** The shell reads the path, and Lane S owns `team-shell.tsx`. Lane M needs `focus` mode for the editor before its editor route works.
5. **Members show customers only.** This differs from the benchmark, which also lists the owner. The API contract forbids teammates in that list.
6. **Open items from RFC 0004 still apply.** For example, some controls show without their permission. Settings pages must hide or disable writes when `team.permissions.manageSettings` is false.
