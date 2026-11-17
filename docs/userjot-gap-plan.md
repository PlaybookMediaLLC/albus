# UserJot gap plan

This document lists the gaps between UserJot and Kaneo/Quills. UserJot is a functional benchmark only. Do not copy its code, text, trademarks or images.
The parity matrix in [userjot-parity.md](./userjot-parity.md) stays the capability inventory.

## Method (2026-11-16)

1. Every UserJot help article (63), `llms.txt`, `llms-full.txt`, the developer docs and REST reference (read in a browser, plus its OpenAPI file), the 13 product pages, the pricing page and the updates feed were read in full. The [source log](./userjot-source-log.md) records each URL, the read date and the behaviors that it states.
2. Each behavior was compared with the code. The code is the truth; docs and issues are not.
3. The widget was tested end to end from a real host app ([widget E2E report](./quills-port/widget-e2e-report.md)). Its defects are the gaps of type "broken".
4. The open GitHub issues (115) were checked for planned work; the Issue column names the issue that covers the gap.

Fields: **type** is missing, partial or broken. **Priority**: P0 breaks a core flow or loses data; P1 a documented capability that customers or host apps expect; P2 everything else. **Size**: S is under a day, M one to three days, L more.

The order is: broken first, then P0, P1 and P2.

## Summary

- 10 broken: 2 P0, 5 P1, 3 P2 (rows B-01 to B-10).
- 30 missing or partial: 11 P1, 19 P2.
- 3 gaps need Kaneo-owned code (G-17, G-24, and B-10 in the shared dev script) and need your approval.

What already matches the benchmark, checked in code and in the E2E run: signed identify with segments and attributes, anonymous sessions, feedback create/vote/unvote/comment/follow, screenshot capture and upload, help search and article feedback, changelog read and reactions, conversations with team replies and the unread badge, surveys, cross-user privacy, refused bad tokens and blocked people, deep links to posts, articles and entries, launcher placement, `metadata`, `on`/`off`, `destroy`, the teammate post, conversation and person pages, merge and unmerge, Trending, weekly digests, pinned comments, sitemaps and RSS, conversation topics, translation, reply-by-email for conversations, office hours, member wipe, Slack threads, REST and remote MCP.

## Phase 4 status (2026-11-17)

All gaps were approved for one pull request. Each row names the proof: unit or integration tests in the repository, and the browser run in [the widget E2E report](quills-port/widget-e2e-report.md) where a browser can show it. "Fake AI" means an integration test against a local OpenAI-compatible stub (`apps/api/src/quills/assistant/provider-edge.fixture.ts`); the demo has no AI provider, so no browser run covers the AI paths.

| ID | Status | Evidence |
|---|---|---|
| B-01 | done | `packages/widget/__tests__/adapter-host.test.tsx`; E2E identity-identify-merge |
| B-02 | done | adapter-host tests; E2E deep links |
| B-03 | done | `browser-queue.test.ts`; E2E script tag |
| B-04 | done | SDK README signed identity section |
| B-05 | done | `apps/api/src/quills/files/customer.test.ts`, web post-attachments test; E2E teammate-post-attachment |
| B-06 | done | web page-context test; E2E |
| B-07 | done | `adapter-map.test.ts`; E2E |
| B-08 | done | `__tests__/i18n.test.ts` (13 catalogs complete); E2E sdk-locale. Translations are machine-written and need native review |
| B-09 | done | with G-06 |
| B-10 | done | `scripts/dev-demo/index.mjs` builds the widget |
| G-01 | done | contract fixtures, `widget-records.test.ts`; E2E changelog-subscribe |
| G-02 | done | `widget/activity.ts` + contract, `notification.test.ts`; E2E activity-feed |
| G-03 | done | adapter-load and parity tests; E2E roadmap-read |
| G-04 | done | sdk-control and adapter-host tests; E2E changelog-announcement |
| G-05 | done | `files/customer.test.ts`; E2E conversation-attach-file |
| G-06 | done | adapter-host test; E2E conversation-contact-email. The "require email before sending" mode is not built: it needs a messenger setting |
| G-07 | done | `widget.test.ts`, web settings test; E2E messenger-team-home |
| G-08 | done | `sdk-control.test.ts`; E2E sdk-control-surface |
| G-09 | done | adapter-host tests; E2E sdk-deep-links |
| G-10 | done | adapter-host test; E2E feedback-similar |
| G-11 | done | `widget-records.test.ts` (fake AI, and AI off) |
| G-12 | done | page-capture and annotation tests; E2E screenshot |
| G-13 | done | `sdk.test.ts`; E2E sdk-page-url |
| G-14 | done | `widget-records.test.ts`, sdk-control; E2E identity |
| G-15 | done | `audience.test.ts`. Host apps that sign tokens longer than 1 hour now get 403: needs a release note |
| G-18 | done (widget) | `init({ container })` renders the widget inline in a host element: `sdk-control.test.ts`; E2E sdk-inline-embed. Portal pages are not framed; they wait for #130 |
| G-19 | done | E2E sdk-locale (Arabic, `dir=rtl`) |
| G-21 | done | migration `0037_post_hidden.sql`, `widget-records.test.ts`, web test; E2E teammate-hide-request |
| G-22 | done | text: `content-checks.test.ts`, E2E moderation-auto-hold. Images: `assistant/engine/post-images.ts`, `widget-records.test.ts` (fake AI). Needs a model that reads images |
| G-23 | done | `content-checks.test.ts`, `widget-records.test.ts`; E2E moderation-auto-hold |
| G-25 | done (generic) | Exports from other tools import as they are (header aliases, status words, plain dates): `csv.test.ts`, `transfer.test.ts`. Checked with Canny-shaped sample files only; Nolt and ProductRoad do not publish their headers. Votes are not imported |
| G-26 | done | `post-search.test.ts`, `widget-records.test.ts`; E2E api-search-typos |
| G-27 | done | `signed.test.ts`. No browser run: inbound mail needs a signed webhook and domain |
| G-28 | done | contract fixtures, `widget-records.test.ts`; E2E conversation-ip-block |
| G-29 | done | `widget-records.test.ts`, contract |
| G-31 | done | `assistant/engine/customer-agent.ts`, quiet-close sweep (migration `0038`), feedback-card route: `widget-records.test.ts` (fake AI), contract, widget `feedback-card.test.tsx`, web settings and portal tests |
| G-32 | done | `widget-records.test.ts`; E2E conversation-away-reply |
| G-17 | done | Decision #129, as chosen: Kaneo accounts stay the one login system, and the host token signs in only to a portal-only account that token sign-in created for that workspace's customer (an existing email gets the Kaneo sign-in page). `widget/portal-sign-in.ts`, `portal/token-sign-in.ts`, `utils/quills-portal-session.ts` (Kaneo), migration `0039`. Tests: `widget-records.test.ts`, contract, `quills-portal-session.test.ts`, `portal-sign-in.test.ts`, widget adapter-host; E2E portal-widget-sign-in (widget history shows on the portal). The widget's **Open in portal** on Home signs in directly when widget sign-in is on; otherwise it mails the Kaneo sign-in link from staging's flow. |
| G-24 | done | Login modes account (the Kaneo sign-in page), sso (the host app's login page returns a widget-secret token) and disabled, set in Settings → Privacy → Customer sign-in. Same account rule as G-17. Tests: `widget-records.test.ts` (SSO token once, disabled = signed out), web sign-in link and settings tests; E2E portal-sso-sign-in through the host app's `/sso` page |
| G-30 | not done | A native iOS SDK (Swift, WKWebView/UIKit) cannot be compiled or run in this Linux environment, so it would ship untested. Needs a macOS run |

## Gaps

| ID | Type | Priority | Size | UserJot behavior | Current Kaneo/Quills state | Data and permission boundary | Issue |
|---|---|---|---|---|---|---|---|
| B-01 | broken | P0 | S | Activity a visitor starts anonymously (conversations, votes) follows them when they identify. [source](https://feedback.userjot.com/help/articles/signed-identity) | The API merges when identify sends `previousToken` (`apps/api/src/quills/widget/identify.ts`, `anonymous-merge.ts`), but the widget never sends it: `identify()` in `packages/widget/src/adapter/useWidgetSession.ts` resets the anonymous session first and `api.ts` posts only `ssoToken`. E2E row 4: `mergedPrincipalId` null, the vote and conversation stayed with the anonymous principal. | Widget adapter only. Uses the existing widget-audience identify route; `quills.principal`, `post_votes`, `conversations` change through `mergeAnonymousSession` in the same transaction. No schema change. | #41 |
| B-05 | broken | P0 | M | Teammates see the images a customer attached to a request. [source](https://userjot.com/in-app-feedback-widget) (Screenshots included); REST `GET /requests/{id}/attachments` | Widget uploads land in `quills.files` with `post_id` set, but the teammate post route (`apps/api/src/quills/feedback/posts.ts`) returns no attachments and the team post page shows none. E2E row 45. | Teammate read (`quills:read`) of `quills.files` for a post in the caller's workspace, with signed URLs from the existing files route; Quills web client `apps/web/src/quills/pages/team-post`. No customer-facing change. | #43 |
| B-02 | broken | P1 | S | Deep links open a pre-filled composer (`compose`) and help search (`query`). [source](https://feedback.userjot.com/help/articles/controlling-the-widget) | `navigationFor()` in `packages/widget/src/adapter/WidgetHost.tsx` keeps only the tab, so `open({view:'new-post', title, body, board})` and `open({view:'help', query})` lose their fields although the SDK README documents them. E2E rows 8 and 19. | Widget iframe only; no API or data change. | #42 |
| B-03 | broken | P1 | S | Every SDK method works from the script-tag install. [source](https://feedback.userjot.com/help/articles/widget-sdk-reference) | `window.Quills` from `sdk.js` is a command dispatcher (`packages/widget/src/browser-queue.ts`); `core/sdk.ts` has no `isOpen`, `getUser` or `isIdentified` command, so they return `undefined`. E2E row 42. | SDK only. | #41 |
| B-04 | broken | P1 | S | SDK docs match what the server accepts. [source](https://feedback.userjot.com/help/articles/identify-users) | `packages/widget/README.md` shows unverified `identify({ id, email, name })` in Vanilla JS, React and the identify shapes, but Kaneo accepts signed tokens only (README line 284; widget error "The API identifies visitors only with a signed ssoToken"). E2E row 7. | Documentation only. | #41 |
| B-06 | broken | P1 | S | Teammates see the context the host app attached (traits/metadata). [source](https://feedback.userjot.com/help/articles/mask-public-identities) (admins see traits); SDK README | Posts and messages store all `metadata` keys (`posts.widget_metadata`, `conversation_messages.metadata`), but `apps/web/src/quills/pages/team-post/parts/post-page-context.tsx` and the message list show only `pageUrl` and `browser`. E2E row 44. | Quills web client only; the data is already in the teammate responses. | #41 |
| B-08 | broken | P1 | L | The widget UI follows the chosen locale (13 to 15 languages). [source](https://feedback.userjot.com/help/articles/languages) | `init({ locale })` reaches the iframe, but the copy in `packages/widget/src/ui` is English only (README: presentation copy is currently English). E2E row 36. | Widget UI strings and catalogs inside `packages/widget` (the widget does not import app catalogs). | #40 |
| B-07 | broken | P2 | S | Request previews read as plain text. [source](https://userjot.com/feedback-board) | The widget Feedback list shows raw Markdown (`**…**`, `### …`) in previews (`packages/widget/src/ui/FeedbackView.tsx` renders `content` as text). E2E row 15. | Widget UI only. | #42 |
| B-09 | broken | P2 | S | Documented SDK events fire. [source](https://feedback.userjot.com/help/articles/controlling-the-widget) | `email-submitted` is in the event table and protocol (`packages/widget/src/core/protocol.ts`) but nothing emits it, because the widget has no contact-email step (see G-06). | SDK and widget; fixed with G-06 or removed from the docs. | #41 |
| B-10 | broken | P2 | S | n/a (local tooling). — | `pnpm dev:demo` builds the API and web dependencies but not `packages/widget`, so `sdk.js` and the iframe page answer 503 on a fresh checkout until `pnpm --dir packages/widget build` runs (`scripts/dev-demo/index.mjs`). | Repository dev script outside the Quills folders: needs your approval. | — |
| G-15 | partial | P1 | S | Identify tokens are short-lived: `exp` at most 1 hour after `iat`, no future `iat` beyond 60 s skew. [source](https://feedback.userjot.com/help/articles/signed-identity) | `verifyIdentityToken` in `apps/api/src/quills/framework/audience.ts` requires `exp` and checks `nbf`, but accepts any lifetime and a future `iat`. A leaked token can identify as that customer until its far `exp`. | Identify route only. Compatibility: host apps that sign long-lived tokens start getting 403; needs a release note. | #35 |
| G-08 | partial | P1 | M | SDK control surface: `toggle()`, `getState()`, `presence`/`statechange`/`error` events, promise results from `init`/`identify`/`open`, `theme` option and `setTheme()`, runtime `setLocale()`, `offset`, launcher `selector`, `destroy({ clearConversationData })`. [source](https://feedback.userjot.com/help/articles/widget-sdk-reference) | `packages/widget/src/index.ts` and `core/sdk.ts` offer init, identify, logout, open, close, show/hideLauncher, metadata, tracking, on, off, destroy and three state reads. Theme comes only from server settings; none of the listed methods, options or events exist. | SDK only, except `clearConversationData` (widget local state). | #41 |
| G-14 | partial | P1 | M | Identify carries companies and any scalar traits; the result reports dropped fields. [source](https://feedback.userjot.com/help/articles/identify-users) | `identify-claims.ts` keeps only claims that match a user attribute definition and has no `companies` claim; the SDK `identify` returns nothing (the `identify` event has no warnings). Claim names are `name`/`avatarURL` where UserJot uses `firstName`/`lastName`/`avatar`. | Widget identify route; `quills.customer_identity.metadata`, `quills.companies`, `principal.company_id`; signed claims only, bounded counts as today. | #35, #69 |
| G-04 | missing | P1 | M | New updates count as unread on the launcher, which shows the title (or opens the update) until it is seen. [source](https://feedback.userjot.com/help/articles/controlling-the-widget) | The launcher unread count is conversation replies only (`GET /widget/unread` in `apps/api/src/quills/support/customer/conversations.ts`). `/widget/changelog/unread` exists but the SDK never shows it; there are no whisper or full-announcement modes. | SDK launcher and widget adapter; existing changelog read/unread routes (widget audience, own principal). | #108 |
| G-02 | missing | P1 | M | Identified visitors get a Notifications page: replies, comments and votes on their posts and activity on followed posts. [source](https://feedback.userjot.com/help/articles/widget-overview) | `packages/widget/src/ui/ActivityView.tsx` exists, but the adapter leaves `activities` out because no widget route serves them (README table: followed-request activity, RFC 0005). | New widget-audience read route over the caller's own activity (own principal only, visibility filters as in the portal); widget adapter. | #42 |
| G-03 | partial | P1 | M | The widget Roadmap page lists In progress, Planned and recently shipped requests, with voting and a "for you" mark on shipped requests the visitor voted for. [source](https://userjot.com/product-roadmap) | The Feedback tab's "Roadmap" sort groups the 50 loaded posts by status in the browser (`packages/widget/src/ui/RoadmapView.tsx`). The workspace roadmaps have portal routes (`listQuillsPortalRoadmaps`) but no widget route. | Widget-audience roadmap read (same visibility as portal), widget adapter and UI. | #42, #109 |
| G-05 | missing | P1 | M | Customers attach files to conversation messages. [source](https://userjot.com/live-chat-software) | Widget conversations accept text only; the README lists message attachments as "no Kaneo route yet". Uploads exist for posts (`/widget/uploads`, `/widget/files`). | Widget message route with `attachmentIds`, `quills.files.message_id`, the shared storage lifecycle; identified visitors only, like post uploads. | #50 |
| G-06 | missing | P1 | M | Anonymous visitors can give a contact email (don't ask / ask after the first message / require), and the host gets `email-submitted`. [source](https://feedback.userjot.com/help/articles/customize-chat-in-the-widget) | The API has `/widget/contact-email` routes (`apps/api/src/quills/widget/contact-email.ts`), but the widget never calls them. E2E row 24. | Widget UI and adapter on existing routes; messenger settings for the mode. | #50 |
| G-11 | partial | P1 | M | Customers type one sentence; AI writes the title and picks the board. [source](https://userjot.com/in-app-feedback-widget) | `createPost` takes the first line as the title and the first accepting board (`apps/api/src/quills/portal/feedback/posts.ts`). | Post creation; optional AI provider, must keep working with AI off. | #106 |
| G-21 | missing | P1 | L | A single request on a public board can be hidden (visible to its author and the team). [source](https://feedback.userjot.com/help/articles/hide-a-request-from-the-board) | Visibility is per board (access tiers) and per moderation state (`apps/api/src/database/quills/types.ts`: published, pending, spam, archived, closed, deleted); there is no per-request hide. | Quills schema change on `quills.posts` and every read path (portal, widget, roadmap, changelog links, search, digests, notifications). | #111 |
| G-17 | missing | P1 | L | Automatic login: the widget identity carries into the public board, roadmap, changelog and embeds. [source](https://feedback.userjot.com/help/articles/automatic-login) | Identify returns `canPortalHandoff: false`; the handoff is undecided (#129). Portal sign-in is a Kaneo account session. | Kaneo-owned authentication and sessions: needs your approval. | #129, #35 |
| G-09 | missing | P2 | S | Deep links for a prefilled message, a help collection and the Notifications page. [source](https://feedback.userjot.com/help/articles/controlling-the-widget) | `OpenOptions` in `packages/widget/src/types.ts` has no message compose, collection or notifications target. | SDK and widget iframe. | #42 |
| G-10 | partial | P2 | S | Similar requests while typing cover the whole board and offer a vote. [source](https://userjot.com/in-app-feedback-widget) | Suggestions match only the 50 loaded posts in the browser and open the post; `GET /widget/posts/similar` exists but is unused. (UserJot's pages disagree on whether the suggestion votes directly.) | Widget adapter on an existing route. | #33 |
| G-12 | partial | P2 | S | Capture masks email and phone fields; the editor has pen, text and a colour picker. [source](https://userjot.com/in-app-feedback-widget) | `packages/widget/src/core/capture.ts` masks password fields, `data-private`, card fields and frames; the editor has boxes, arrows, blur, redact and undo. | SDK capture and widget editor. | #43 |
| G-13 | partial | P2 | S | The host chooses how much of the page URL is shared (origin, path or none). [source](https://feedback.userjot.com/help/articles/widget-sdk-reference) | The SDK always sends origin and path (`core/sdk.ts` `sendContext`). | SDK only; privacy-reducing option. | #41 |
| G-07 | partial | P2 | M | The widget shows team presence (online dot), up to four operator avatars, the reply-time line and the greeting. [source](https://feedback.userjot.com/help/articles/operators-and-availability) | `/widget/presence` and `/widget/team-avatars` exist (`apps/api/src/quills/widget/support/presence.ts`); the adapter shows the default contact text and the SDK has no presence event. | Widget adapter on existing routes; SDK event. | #103 |
| G-19 | missing | P2 | M | Right-to-left layout for Arabic and Persian. [source](https://userjot.com/in-app-feedback-widget) | No RTL support in the widget UI. | Widget UI; follows B-08. | #117 |
| G-18 | missing | P2 | L | Inline embeds of the board, roadmap and changelog (`createEmbed`, URL sync). [source](https://feedback.userjot.com/help/articles/embedding-pages-inline) | No embed API in the SDK; portal pages are being built (#130). | SDK plus portal pages and identity handoff (G-17). | #42, #130 |
| G-26 | partial | P2 | M | Search tolerates typos and supports quoted phrases, minus words and partial words. [source](https://userjot.com/feedback-board) | Full-text search on `search_vector` without typo tolerance. | Quills search queries and indexes. | #115 |
| G-27 | partial | P2 | M | Replying to a feedback notification email posts a comment. [source](https://feedback.userjot.com/help/articles/notify-subscribers) | Reply-by-email exists for conversations only. | Inbound mail handler and mail jobs (deduplication, sender check). | #39 |
| G-28 | missing | P2 | M | IP block rules that expire after 30 days. [source](https://feedback.userjot.com/help/articles/block-senders) | Sender blocking exists (`apps/api/src/quills/directory/blocking.ts`); no IP rules. | Quills schema and widget/public request checks. | #50 |
| G-29 | partial | P2 | M | Headless API conventions: an `Idempotency-Key` header, `updated_since` and waiting-on-team filters, votes and subscriptions by external ID. [source](https://userjot.com/headless) | Quills writes take `idempotencyKey` in the body; no `updated_since` filter on teammate lists. | Teammate routes and OpenAPI. | #44, #107 |
| G-23 | partial | P2 | M | Automatic spam and abuse scoring moves content into review. [source](https://feedback.userjot.com/help/articles/moderate-content) | A `spam` moderation state exists; no automatic scoring. | Moderation pipeline; optional AI provider. | #116 |
| G-22 | missing | P2 | L | Sensitive-information detection on text and images holds content out of public view. [source](https://feedback.userjot.com/help/articles/moderate-content) | None. | Moderation pipeline, AI provider, images in storage. | #32 |
| G-24 | missing | P2 | L | Board login modes: default, SSO with a signed JWT redirect, or disabled. [source](https://feedback.userjot.com/help/articles/single-sign-on) | Portal access has visibility, allowed domains and segments (`apps/api/src/quills/portal/access-settings.ts`); no SSO mode. | Kaneo-owned authentication: needs your approval. | #112, #93 |
| G-25 | missing | P2 | L | Direct imports from Canny, Nolt and ProductRoad with votes, comments, changelog entries and images. [source](https://feedback.userjot.com/help/articles/import-data) | CSV post import only (`apps/api/src/quills/transfer/runs/import-posts.ts`). | Import runs, external API tokens, storage. | #49, #91 |
| G-31 | partial | P2 | L | AI operator details: auto-resolve after silence, private handoff note, crawl limits, product description, confirmed feedback cards with limits. [source](https://feedback.userjot.com/help/articles/meet-juno) | An assistant exists (`apps/api/src/quills/assistant`); not verified here because AI is off in the demo. | AI provider, conversations, feedback writes on the customer's behalf. | #51, #113 |
| G-32 | partial | P2 | M | Away replies when every operator is offline. [source](https://feedback.userjot.com/help/articles/away-replies) | Office hours exist (`quills.office_hours_schedules`); an away reply was not found. | Conversation jobs and messenger settings. | #103 |
| G-30 | missing | P2 | L | Native Swift/iOS SDK. [source](https://feedback.userjot.com/help/articles/swift-sdk-overview) | None (`apps/mobile` is the teammate app). | New package. | #52 |
| G-01 | missing | P2 | S | Visitors subscribe to updates from the widget. [source](Brief) feature list (UserJot itself has no subscribe form: https://userjot.com/product-changelog) | Identify auto-subscribes (`autoSubscribeChangelog`); the subscription routes accept portal sign-ins only (`apps/api/src/quills/portal/subscriptions.ts`). E2E row 18. | Widget-audience version of the existing subscription routes. | — |

## Recommended order

1. B-01, B-05: P0 data and visibility defects.
2. B-02, B-03, B-04, B-06, G-15: small P1 fixes.
3. G-08, G-14: SDK and identify parity.
4. G-04, G-02, G-03: widget launcher, Notifications and Roadmap pages.
5. G-05, G-06 (with B-09): conversation attachments and contact email.
6. B-07, G-09, G-10, G-12, G-13: small P2 widget fixes.
7. G-11, G-07: AI title and board; presence and reply time.

## Recommended to skip for now

| Gap | Reason |
|---|---|
| G-17, G-24, G-18 | Need Kaneo-owned authentication and sessions; G-17 waits on decision #129, and G-18 depends on G-17 and the portal pages (#130). |
| B-10 | Lives in the shared dev script outside the Quills folders. It is a one-line build filter if you approve it. |
| B-08, G-19 | Full widget localization and RTL are large. Recommend a README fix now that says the widget copy is English only, and localization as its own task. |
| G-21 | A new visibility rule touches every read path and needs a schema migration; plan it with #111. |
| G-22, G-23, G-31 | AI features that cannot be verified here (AI is off in the demo) and have their own issues. |
| G-25, G-30 | Large and need third-party accounts (Canny, Nolt, ProductRoad) or a new platform (Swift). |
| G-01 | UserJot has no subscribe form; identify already subscribes visitors. |
| G-26, G-27, G-28, G-29, G-32 | Portal, inbox and REST improvements outside the widget; tracked by their issues. |

## Earlier audit (2026-11-10)

The audit below read the help article titles and summaries only. It stays for its issue mapping.

This document lists the UserJot features that the milestones and the GitHub issues do not plan.
UserJot is a functional benchmark only. Do not copy its code, text, trademarks or images.
The parity matrix in [userjot-parity.md](./userjot-parity.md) stays the primary inventory.

### Method

1. The audit date is 2026-11-10.
2. The source is the UserJot sitemap: 292 pages on `userjot.com`, plus `llms.txt` and `llms-full.txt`.
3. The 16 product pages and the pricing page were read for features.
4. The help center index at `feedback.userjot.com/help/llms.txt` was read: 62 article titles and summaries.
5. The 125 blog pages, 45 glossary pages, 44 calculator pages, 40 comparison pages and 20 platform guides were scanned. They are content pages and add no product features.
6. The baseline is the 8 milestones (M0 to M7) and the open issues #6 to #95.
7. Each gap was checked against the issue bodies by keyword.

Limits:

- The help articles were checked by title and summary. The article bodies were not read.
- The REST API reference at `/docs/api` loads in the browser only. It was not read.

### Result

- 5 gaps need a new issue.
- 9 features are partly planned. They need no new issue now.
- 5 items are not product features.

Issues #26 to #55 already cover most of UserJot.
Issues #73, #76, #87, #88, #90 and #95 from the Featurebase audit cover 6 more UserJot features.

### Gaps

| ID | Priority | Milestone | Gap | UserJot source | Related issues |
| --- | --- | --- | --- | --- | --- |
| M1-57 | P2 | M1 | Operator availability, online status, reply time and away replies | `/live-chat-software`, Help: Operators and availability, Away replies | #50, #72 |
| M1-58 | P2 | M1 | Team push and email alerts for conversations and requests | `/`, Help: Conversation notifications, Notification preferences | #39, #50 |
| M1-59 | P2 | M1 | Inbox details: slash commands, reminders, customer profile panel, contact form and email authentication status | `/live-chat-software`, Help: Reply to conversations | #50, #54 |
| M1-60 | P1 | M1 | AI title and board selection when a customer submits feedback | `/in-app-feedback-widget`, `/slack` | #28, #33, #34, #42 |
| M4-04 | P2 | M4 | Conversation tools in REST and MCP, with documented agent routines | `/headless`, `/mcp`, `/grok-bot`, `/openai-dots` | #10, #44, #45, #50 |

### Issue specifications

The issue title format is `[<ID>][<Priority>] <title>`.

#### M1-57 — Operator availability, online status, reply time and away replies

- Let each team member set a weekly schedule in their own time zone.
- Show an online mark in the widget only when a team member is online or in their hours.
- Show the usual reply time. Calculate it from past replies, or let the founder set it.
- Send one away note when a conversation waits for the team out of hours.
- Do not show a team member's name or schedule to the customer unless the founder permits it.

#### M1-58 — Team push and email alerts for conversations and requests

- Send a push alert and an email alert for a new conversation, a customer reply and an assignment.
- Let each team member select the events and the channels in their notification preferences.
- Deliver push alerts through the web app and through `apps/mobile`.
- A single instance must work without a third-party push service. Push is optional.
- Do not put private message text in a push alert unless the team member permits it.

#### M1-59 — Inbox details: slash commands, reminders, customer profile panel, contact form and email authentication status

- Add slash commands in the reply editor for common actions, for example assign, snooze and resolve.
- Let a team member set a reminder on a conversation.
- Show a customer panel next to the thread: activity, language, device and location.
- Let the founder ask a visitor for a name or an email before a chat starts, as optional or required. Signed-in customers skip this form.
- Show the SPF, DKIM and DMARC result for each forwarded email.
- Collect device and location data only when the founder turns it on.

#### M1-60 — AI title and board selection when a customer submits feedback

- Let the customer write the feedback in their own words.
- Let the AI draft a title and select a board from the real boards of the product.
- Show the draft to the customer or the founder before it is saved. Do not add content that the customer did not write.
- Show similar requests from #33 at the same time, with a vote button.
- Keep a manual form that works when the AI provider is not available.
- Apply the AI provider policy and the cost limits from #23.

#### M4-04 — Conversation tools in REST and MCP, with documented agent routines

- Expose the inbox from #50 in REST and MCP: list conversations, read a timeline, reply, add a private note, assign and resolve.
- Add a filter for conversations that wait for the team, and a filter for changes since a time.
- Accept an idempotency key on replies and notes.
- Let an authorized agent vote or file a request as an identified customer by external ID. Record the agent token in the audit history.
- Give each agent its own token. A token reaches one workspace only.
- Publish example routines for scheduled agents: draft replies as private notes, file requests from conversations, and draft a changelog entry.
- A private note never reaches the customer. An agent reply needs the permission that #10 requires for sensitive actions.

### Features that are partly planned

| UserJot feature | Related issue | Missing part |
| --- | --- | --- |
| Launcher signals: title of a new update, unread mark, automatic open of a new update | #41, #42, #81 | The automatic open option is not stated. |
| Roadmap "for you" mark on shipped requests that the customer voted for | #37, #42 | The mark is not stated. |
| Changelog media: GIF search, video links, count of shipped requests | #38 | Media-safe rendering is in scope. GIF search and the shipped count are not stated. |
| Board sign-in controls: select the sign-in methods and hide the sign-in button | #18, #87 | Social sign-in is in scope. The control to hide sign-in is not stated. |
| AI agent settings: tone presets, reply length, automatic resolve of quiet threads | #51 | Tone and policies are in scope. The automatic resolve timers are not stated. |
| Search with typo tolerance, quoted phrases and excluded words | #31 | Search is in scope. These operators are not stated. |
| Board languages with right-to-left layout | #40 | Languages are in scope. Right-to-left layout is not stated. |
| AI mapping of CSV columns | #49 | Column mapping is in scope. The AI method is not stated. |
| One workspace for each client, with hand-over of ownership | #12 | Workspaces exist in Kaneo. Ownership transfer is not stated in the feedback issues. |

### Issues for partly planned features

Each row of "Features that are partly planned" gets one issue for its missing part.
The related issue keeps its scope.

| ID | Priority | Milestone | Missing part | Related issues |
| --- | --- | --- | --- | --- |
| M1-67 | P2 | M1 | Launcher announcement and automatic open of a new update | #41, #42, #81 |
| M1-68 | P2 | M1 | Roadmap "for you" mark on shipped requests | #37, #42 |
| M1-69 | P3 | M1 | Changelog media: GIF search, video links and a shipped count | #38 |
| M1-70 | P2 | M1 | Board sign-in controls | #18, #87 |
| M1-71 | P3 | M1 | AI agent style presets and automatic resolve of quiet threads | #51 |
| M1-72 | P2 | M1 | Search with typo tolerance, quoted phrases and excluded words | #31 |
| M1-73 | P2 | M1 | Right-to-left layout for the portal and the widget | #40 |
| M1-74 | P3 | M1 | AI mapping of CSV columns in imports | #49 |
| M6-06 | P3 | M6 | Workspace ownership transfer for agencies | #12 |

#### M1-67 — Launcher announcement and automatic open of a new update

- Show the title of a new changelog entry on the widget launcher one time for each customer.
- Keep an unread mark on the launcher until the customer opens the entry.
- Let the founder turn on automatic open of the newest entry on the customer's next visit.
- Show only entries that the customer has access to.

#### M1-68 — Roadmap "for you" mark on shipped requests

- In the widget roadmap, mark a shipped request that the signed-in customer voted for.
- Order the widget roadmap as in progress, planned, then shipped.
- Do not show the votes of one customer to a different customer.

#### M1-69 — Changelog media: GIF search, video links and a shipped count

- Let the founder paste a video link that the entry shows as an embedded player.
- Let the founder search for a GIF in the editor. This search is optional and off by default, because it uses a third-party service.
- Show the count of requests completed in the last 12 weeks on the public updates page.

#### M1-70 — Board sign-in controls

- Let the founder select the sign-in methods that the portal offers.
- Let the founder hide the sign-in button, so that customers enter only from the product through automatic login or single sign-on.
- The API must reject a sign-in method that is off.

#### M1-71 — AI agent style presets and automatic resolve of quiet threads

- Add presets for tone, reply length, formality and emoji use.
- Resolve a conversation automatically when the customer is quiet after an AI answer. Use one timer for chat and one for email.
- Never resolve automatically after a team member reply.

#### M1-72 — Search with typo tolerance, quoted phrases and excluded words

- Make search accept small spelling errors.
- Support a quoted phrase for an exact match and a minus sign to exclude a word.
- Use PostgreSQL only. Do not add a search service.
- Apply the visibility rules to each result.

#### M1-73 — Right-to-left layout for the portal and the widget

- Show the portal, the widget and the emails in a right-to-left layout for right-to-left languages.
- Use CSS logical properties. Test with Arabic.

#### M1-74 — AI mapping of CSV columns in imports

- Let the AI suggest a mapping from CSV columns to fields in the import preview of #49.
- The founder confirms or changes each mapping before the import starts.
- Send only the column names and a small sample to the AI provider. Keep the manual mapping when no provider is available.

#### M6-06 — Workspace ownership transfer for agencies

- Let a workspace owner transfer ownership to a different member, with a confirmation from the new owner.
- Revoke the API tokens of the old owner on transfer, or show them for review.
- Record the transfer in the admin audit log.
- First check the current Kaneo owner functions. Add only the missing part.

### Items that are not product features

- Pricing plans and plan limits.
- The 44 SaaS calculators under `/tools`.
- The glossary and the blog.
- The 20 guides for website builders. They describe links and embeds that #41 and #42 cover.
- The "Powered by" badge page.

### Created issues

Each new issue is in the native GitHub milestone of the table above.

| ID | Issue |
| --- | --- |
| M1-57 | #103 |
| M1-58 | #104 |
| M1-59 | #105 |
| M1-60 | #106 |
| M4-04 | #107 |

Issues for partly planned features:

| ID | Issue |
| --- | --- |
| M1-67 | #108 |
| M1-68 | #109 |
| M1-69 | #110 |
| M1-70 | #112 |
| M1-71 | #113 |
| M1-72 | #115 |
| M1-73 | #117 |
| M1-74 | #119 |
| M6-06 | #121 |
