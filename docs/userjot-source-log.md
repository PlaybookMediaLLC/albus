# UserJot source log

Read on 2026-11-16 for the gap audit in [userjot-gap-plan.md](./userjot-gap-plan.md). UserJot is a functional benchmark only: this log paraphrases what each page states and copies no text, code or images.

Help articles were read as Markdown (`<article URL>.md`). The REST API reference, the product pages, the pricing page and the updates feed were rendered in Chromium. "Updated" is the date that the page shows.

## Coverage

| Source | Pages | Read |
|---|---|---|
| Help center index `feedback.userjot.com/help/llms.txt` | 1 index, 63 articles | All 63 article bodies in full |
| `userjot.com/llms.txt` | 1 | In full |
| `userjot.com/llms-full.txt` | 44 glossary pages, 19 platform guides | Glossary scanned for UserJot claims; one platform guide in full, the rest scanned (they repeat one template) |
| Developer docs `userjot.com/docs`, REST reference `userjot.com/docs/api`, OpenAPI `api.userjot.com/v1/openapi.json` | 3 | In full (browser for the reference; 62 paths in the spec) |
| Product pages | 13 | In full (browser) |
| Pricing | 1 | In full (browser) |
| Updates feed `feedback.userjot.com/updates` | 8 entries | In full (browser) |
| Comparison pages | 40 | Not read in full: their `llms.txt` summaries were read; they restate product-page claims against competitors |

## Help: [widget-overview](https://feedback.userjot.com/help/articles/widget-overview)

Updated 2026-11-12. Read 2026-11-16.

- Surfaces: Home; Feedback (browse, search, vote, submit); Roadmap (planned, in progress); Updates with launcher unread indicator; Messages (when Conversations on); Notifications (activity on followed posts).
- Widget feedback follows moderation; receipt confirms save. Widget accepts guest submissions on every plan regardless of the board's Guest submissions setting; no identify needed to submit.
- Custom launcher with live unread badge; events open/close/unread; inline page embeds. API stable: methods never renamed.

## Help: [widget-installation](https://feedback.userjot.com/help/articles/widget-installation)

Updated 2026-11-03. Read 2026-11-16.

- Queue-proxy snippet; init/identify/open in any order. Single-tag install with data-project for strict CSP (own init wins). init options: widget.position left/right, widget.theme auto/light/dark, widget.launcher, locale. widget:false. Console warning when calls pend and init never ran.

## Help: [identify-users](https://feedback.userjot.com/help/articles/identify-users)

Updated 2026-11-03. Read 2026-11-16.

- Unsigned identify {user:{id (required, stable), email, firstName, lastName, avatar, traits}}; same input skipped while session live; logout(). Traits: string/number/boolean/null, shown in dashboard. companies:[{id required, name, domain, traits}].
- identify returns a promise {viewer, identityTrust 'signed'|'unsigned', warnings}.
- Identified users skip visitor-details prompt in Messages; replies reach account email. Anonymous visitors: browser-scoped guest conversations, optional contact capture.
- Require signed tokens: unsigned identify → 403, promise rejects IDENTIFY_FAILED, nothing applied.

## Help: [signed-identity](https://feedback.userjot.com/help/articles/signed-identity)

Updated 2026-11-03. Read 2026-11-16.

- HS256 with project secret (Settings → Login → Secrets: Project ID, Project secret). Claims required: sub, iss=project ID, aud='userjot', iat, exp (≤1h after iat). Optional: email, firstName, lastName, avatar, traits, companies — all verified.
- Admins/owners always need signed identity; privileged profile fields ignored with PRIVILEGED_PROFILE_IGNORED warning.
- identify({token, user, companies}): extra unverified detail; token wins. result.identityTrust 'signed'.
- Invalid token rejects IDENTIFY_FAILED, no fallback to unsigned.
- Anonymous guest conversation handed off to member account on signed identify. Conversation started signed is protected: "Verify to view this conversation" without a signed session.
- Identity carries over to links to public pages (board, roadmap, changelog) when Automatic login is on. 60 s clock skew; future iat rejected.

## Help: [controlling-the-widget](https://feedback.userjot.com/help/articles/controlling-the-widget)

Updated 2026-11-03. Read 2026-11-16.

- open() resumes where left off; open({to: home|feedback|roadmap|updates|messages|notifications|help}); feedback compose:true; feedback submissionId; updates updateId; messages compose:{text} prefill; help article slug / collection slug / query.
- close(), toggle(). messages target without Conversations → error event CONVERSATIONS_DISABLED and opens Home; help target without live help center → HELP_DISABLED, Home.
- Events: ready (fires immediately if loaded), open, close, identify (incl logout), unread {count}, presence {availability online|neutral}, statechange, error.
- getState(): status, widget.open, unreadCount, presence, session.status anonymous|identifying|identified, session.viewer.
- Custom launcher: launcher:false; launcher:{selector}. Presence dot refresh on load, focus, every few minutes; live when open. Unread includes conversation replies + changelog + feedback notifications; opening with conversation unread lands on Messages.
- Whispers: toasts for changelog posts and feedback notifications (not conversation replies), clickable; widget.offset {bottom, side}; whispers:false.
- widget.notifications.updates: whisper | full (opens the update in the reader) | none; one automatic opening per visit; seen when mounted on visible focused page; seen history in host-origin storage.
- Language: workspace language, then browser; 15 languages incl Italian, Persian, pt-PT; init locale; uj.setLocale() without reload.

## Help: [embedding-pages-inline](https://feedback.userjot.com/help/articles/embedding-pages-inline)

Updated 2026-11-03. Read 2026-11-16.

- createEmbed({container, path, theme, basePath}) renders board/roadmap/changelog inline (not Messages); controller navigate(), destroy(); basePath keeps browser URL in sync, deep links; multiple embeds; identity flows into embeds (needs Automatic login); widget:false.

## Help: [widget-sdk-reference](https://feedback.userjot.com/help/articles/widget-sdk-reference)

Updated 2026-11-03. Read 2026-11-16.

- window.uj; calls queued. uj.version. init(projectId, opts) returns promise of state (no reject on network; rejects INVALID_PROJECT_ID / INVALID_OPTIONS). Options: widget true/false/object, launcher bool|{selector}, whispers, notifications.updates, position, offset {bottom, side}, theme; locale; pageContext 'origin'|'path'|'none' (how much page URL is shared with the team in conversations); onReady, onError.
- uj.ready(). identify({token, user{id,email,firstName,lastName,avatar,traits}, companies}) → {viewer{id,firstName,lastName,avatar{url,blurhash}}, identityTrust, warnings[{code,message,field}]}; warnings RESERVED_TRAIT_KEY_IGNORED, UNSIGNED_COMPANY_IGNORED, PRIVILEGED_PROFILE_IGNORED; same input no-op; last call wins; only method rejecting at runtime (IDENTIFY_FAILED).
- logout() promise. open(target) resolves when visible; INVALID_NAVIGATION for bad combos; help article/collection by slug, old slug follows moves. close() sync, toggle(). createEmbed. setLocale(locale) promise; setTheme(theme) sync, invalid → INVALID_OPTIONS error event.
- getState(): status idle|initializing|ready|error|destroyed, projectId, locale, unreadCount, presence, lastError, widget{enabled,open,position,theme}, session{status,identityTrust,viewer}.
- Events: ready, statechange, open, close (payload state), identify {viewer, identityTrust}, unread {count}, presence, error, destroy. Listeners survive destroy().
- destroy({clearConversationData}) clears anonymous conversation grants, drafts, remembered contact details (shared devices). init again after destroy.
- Errors {code,message,recoverable,cause}: INVALID_PROJECT_ID, INVALID_OPTIONS, INVALID_NAVIGATION, INVALID_IDENTIFY, IDENTIFY_FAILED, BOOTSTRAP_FAILED, NOT_READY, WIDGET_DISABLED, CONVERSATIONS_DISABLED, HELP_DISABLED, LAUNCHER_NOT_FOUND, SIDEBAR_LOAD_FAILED, EMBED_CONTAINER_NOT_FOUND, DESTROYED, UNKNOWN.

## Help: [getting-started](https://feedback.userjot.com/help/articles/getting-started)

Updated 2026-11-12. Read 2026-11-16.

- one workspace per product; share board; triage; Planned/In Progress auto on roadmap; publish updates for completed work; Conversations beta with Juno first replies.

## Help: [invite-your-team](https://feedback.userjot.com/help/articles/invite-your-team)

Updated 2026-11-16. Read 2026-11-16.

- Settings → Team → Invite member; Invitations list, revoke; one invite email per address per day; invitees join as admins; member title; plan seat limit prompt.

## Help: [member-roles](https://feedback.userjot.com/help/articles/member-roles)

Updated 2026-11-03. Read 2026-11-16.

- Owner (only one who can remove privileged members, cannot be removed), Admin (feedback, boards, tags, changelog, integrations, team, billing), Member (end user: submit, vote, comment, follow).

## Help: [share-your-board](https://feedback.userjot.com/help/articles/share-your-board)

Updated 2026-11-03. Read 2026-11-16.

- Share page with board URL, Copy link/Visit; Feedback, Roadmap, Changelog links (/ , /roadmap, /updates), Copy all links; ?openFeedback opens the form; uj.redirect({openFeedback:true}) from the SDK.

## Help: [custom-domain](https://feedback.userjot.com/help/articles/custom-domain)

Updated 2026-11-03. Read 2026-11-16.

- Starter+; root domain → feedback.<domain>; DNS records table with status checks; Visit.

## Help: [customize-branding](https://feedback.userjot.com/help/articles/customize-branding)

Updated 2026-11-12. Read 2026-11-16.

- Brand (logo PNG/JPG/SVG, name), Appearance (primary color, theme), Public board (language, Hide "Powered by" on Professional); immediate save except Brand.

## Help: [languages](https://feedback.userjot.com/help/articles/languages)

Updated 2026-11-03. Read 2026-11-16.

- default + extra languages shared by board, roadmap, changelog, widget, help center; per-visitor language from browser; signed-in users switch from account menu; widget follows uj.init/setLocale locale; widget languages (15); help center language modes: Translated by AI, AI reviewed by you, Written by your team; Go live per language; removing a language unpublishes its articles.

## Help: [mask-public-identities](https://feedback.userjot.com/help/articles/mask-public-identities)

Updated 2026-11-12. Read 2026-11-16.

- Professional; hides regular users' names/avatars on public pages and notifications; admins see name/avatar/email/traits/companies/joined/last active; no IP/location/device on posts, votes, comments.

## Help: [automatic-login](https://feedback.userjot.com/help/articles/automatic-login)

Updated 2026-11-03. Read 2026-11-16.

- Settings → Login → Automatic login (paid); Require signed tokens (appears once auto login on); SDK appends identity to links pointing at the project's UserJot/custom domain so public pages start signed in; embeds too; not for admin/owner accounts; with required tokens a bad token fails identify and the user arrives signed out.

## Help: [single-sign-on](https://feedback.userjot.com/help/articles/single-sign-on)

Updated 2026-11-03. Read 2026-11-16.

- Board login modes Default | SSO | Disabled (Professional). SSO redirect URL (https only); redirect with one-time `state` (15 min); app redirects to /auth/sso?jwt&state. JWT HS256: sub, iss, aud=userjot, exp required; email, iat, firstName, lastName, avatar, traits (scalars), companies optional. No email → member without email. Failure → board with sso_error invalid_state|invalid_token|auth_failed|session_error. Rotating the secret breaks old tokens.

## Help: [delete-your-workspace](https://feedback.userjot.com/help/articles/delete-your-workspace)

Updated 2026-11-12. Read 2026-11-16.

- delete workspace from Settings; delete account from dashboard settings.

## Help: [import-data](https://feedback.userjot.com/help/articles/import-data)

Updated 2026-11-03. Read 2026-11-16.

- CSV, Canny, Nolt, ProductRoad; vote totals preserved; individual vote dates when the source has them; imported votes are not "new" for Trending.

## Help: [import-from-canny](https://feedback.userjot.com/help/articles/import-from-canny)

Updated 2026-11-03. Read 2026-11-16.

- Data & Import → Canny API token → board mapping, status mapping (default fallback) → Import Submissions; imports posts, votes, non-empty comments, changelog entries, post/comment images; creates/matches members by external ID or email; no credentials or admin roles; async.

## Help: [import-from-productroad](https://feedback.userjot.com/help/articles/import-from-productroad)

Updated 2026-11-03. Read 2026-11-16.

- API token; board mapping with a default board; async.

## Help: [import-from-nolt](https://feedback.userjot.com/help/articles/import-from-nolt)

Updated 2026-11-03. Read 2026-11-16.

- board URL + API token; target board; status mapping; async.

## Help: [import-from-csv](https://feedback.userjot.com/help/articles/import-from-csv)

Updated 2026-11-03. Read 2026-11-16.

- up to 10,000 rows; mapping steps for submission fields, author fields, details, status mapping, board mapping; titles, body, votes, authors, board names, statuses, timestamps.

## Help: [create-a-board](https://feedback.userjot.com/help/articles/create-a-board)

Updated 2026-11-03. Read 2026-11-16.

- Settings → Feedback → New board (name, color); reorder, rename, delete (blocked while it has submissions); new boards public; Private on supporting plans; plan board limits 2/5/unlimited.

## Help: [triage-requests](https://feedback.userjot.com/help/articles/triage-requests)

Updated 2026-11-12. Read 2026-11-16.

- statuses Pending → Reviewing → Planned → In Progress → Completed, Closed (reopen → Reviewing); action bar with next decision (accept/merge/close, queue advances); only publicly visible requests can be merged (button explains why not); Completed prompts a changelog draft; stale Planned/In Progress prompt; low-traction review reminder; status pill for direct change; status vs moderation vs visibility (On board, Hidden, In review); hidden/pending stay off board and roadmap; one vote per person; dashboard Trending badge on Reviewing items with recent votes.

## Help: [auto-tag-feedback](https://feedback.userjot.com/help/articles/auto-tag-feedback)

Updated 2026-11-03. Read 2026-11-16.

- AI picks up to 3 existing tags from title/body (may return none); Auto-tag sparkle on a request and in the list's Tags context menu; rerun replaces the whole tag set.

## Help: [merge-duplicates](https://feedback.userjot.com/help/articles/merge-duplicates)

Updated 2026-11-03. Read 2026-11-16.

- merge flow shows similarity suggestions first, then text search; comments move, distinct reactions copied (no duplicates); duplicate kept as merged/linked; subscriptions not moved; both sides show the link; unmerge restores comments and removes copied reactions; carried votes keep dates; double voter counts once.

## Help: [guest-feedback](https://feedback.userjot.com/help/articles/guest-feedback)

Updated 2026-11-05. Read 2026-11-16.

- Privacy → Guest submissions, on by default every plan; guests submit, vote, comment; guest session can return to own submissions even private/pending; private boards still hide others' posts; receipt does not grant access; moderation applies ("Checking your feedback", "Pending Review", widget receipt); off → sign in via board login settings.

## Help: [private-boards](https://feedback.userjot.com/help/articles/private-boards)

Updated 2026-11-03. Read 2026-11-16.

- board visibility pill Public/Private; private: admins see all, authors see own, guests see own via guest session; Starter+.

## Help: [moderate-content](https://feedback.userjot.com/help/articles/moderate-content)

Updated 2026-11-03. Read 2026-11-16.

- Privacy → Moderate submissions, Moderate comments, Detect sensitive information (text + JPEG/PNG/WebP images; credentials, financial, personal); admins bypass approval; automatic spam/abuse checks flag into review; Needs review panel with reasons: Keep/Delete (spam), Publish/Keep hidden (public board) or Approve (private board); edit before deciding; comment Review dropdown (Approve / Don't publish) also on public page for admins; "Check could not finish" + Retry check; authors see Checking your feedback / Pending Review.

## Help: [hide-a-request-from-the-board](https://feedback.userjot.com/help/articles/hide-a-request-from-the-board)

Updated 2026-11-03. Read 2026-11-16.

- per-request On board / Hidden from board pill (admins only); hidden visible to admins and author; link sharing grants nothing; Keep hidden in review.

## Help: [how-trending-works](https://feedback.userjot.com/help/articles/how-trending-works)

Updated 2026-11-03. Read 2026-11-16.

- sorts Top, Trending (recent interest), Newest; imported/merged votes keep their dates.

## Help: [plan-work](https://feedback.userjot.com/help/articles/plan-work)

Updated 2026-11-03. Read 2026-11-16.

- Public roadmap toggle (Feedback → Behavior); columns Planned, In Progress, Done (Completed); Pending/Reviewing/Closed hidden; dashboard roadmap shows every status as columns with drag to change status.

## Help: [publish-updates](https://feedback.userjot.com/help/articles/publish-updates)

Updated 2026-11-12. Read 2026-11-16.

- Changelog New Entry (title, slug, content, publish date, cover image, authors, tags); Draft Changelog from a Completed request (empty draft); linked requests shown as "Built from your feedback" filtered per viewer (private, pending, merged left out) — linking only via API; drafts, scheduled (future date), immediate; delete entry.

## Help: [notify-subscribers](https://feedback.userjot.com/help/articles/notify-subscribers)

Updated 2026-11-03. Read 2026-11-16.

- Follow/Unfollow on the public request page; author auto-subscribed; voters, commenters, repliers auto-followed (not via public API); status-change notifications; thread reply notifications; review-gated announcements; access re-checked at send; reply-by-email turns the reply into a comment (only from the recipient address; auto/empty replies ignored); weekly digest emails toggle; recipient email preferences; turning off all emails stops optional emails.

## Help: [notification-preferences](https://feedback.userjot.com/help/articles/notification-preferences)

Updated 2026-11-03. Read 2026-11-16.

- per-member panel from the activity bell: Browser notifications + test; In-app types (new feedback [admins], comments on followed, reactions on followed, replies to your comments, reactions on your comments); Push and Email for conversations (new, customer replies, assigned to you). Does not affect subscriber emails.

## Help: [manage-your-plan](https://feedback.userjot.com/help/articles/manage-your-plan)

Updated 2026-11-12. Read 2026-11-16.

- Billing page: plan, trial, upgrade, monthly→yearly, invoices, payment methods, cancel/resume; plan limits (boards, tags, members, integrations, private boards, moderation, branding, SSO); student/nonprofit discounts.

## Help: [conversations-overview](https://feedback.userjot.com/help/articles/conversations-overview)

Updated 2026-11-06. Read 2026-11-16.

- widget Messages page; shared inbox Queue/Open/All; topics from first message; Juno AI operator (never invents, never files feedback without customer confirmation); email forwarding; Juno searches public boards, files/votes/follows after confirmation; identified users added as voters/followers; details panel lists linked requests and member activity; operators; owners/admins only.

## Help: [turn-on-conversations](https://feedback.userjot.com/help/articles/turn-on-conversations)

Updated 2026-11-03. Read 2026-11-16.

- Settings → Conversations → General → Turn on; groups Operators, Email, Widget (greeting, visitor details, reply-time expectations), Juno AI, Moderation (blocked senders, IP rules); turning off keeps history.

## Help: [the-conversations-inbox](https://feedback.userjot.com/help/articles/the-conversations-inbox)

Updated 2026-11-06. Read 2026-11-16.

- Queue (waiting on team, oldest first, online visitors on top, due reminders), Open, All; Mine, Unread, Snoozed, Resolved, Spam, Archived; topic filter in URL, Save as view; one assignee; first public reply assigns; assigned → alerts go to assignee; search open/resolved/archived (≥3 chars, ≤200 chars, ≤8 terms); details: visitor details, environment, start page, linked requests, member activity; Unverified badge for self-declared contacts.

## Help: [reply-to-conversations](https://feedback.userjot.com/help/articles/reply-to-conversations)

Updated 2026-11-03. Read 2026-11-16.

- Reply vs Internal note; reply also emailed when the customer has an email; slash commands (note/reply, assign, resolve, reopen, archive, spam, snooze, remind); Resolve is a label, customer reply reopens; Archive, Mark as spam lock composer; Snooze (shared) vs Remind me (personal, surfaces in Queue).

## Help: [conversation-topics](https://feedback.userjot.com/help/articles/conversation-topics)

Updated 2026-11-06. Read 2026-11-16.

- up to 20 topics with descriptions; starter list of six; AI picks topic from first message (retry on next two messages); re-sort untopic'd open conversations on list change; manual choice sticks; thread line "X set the topic"; topics never shown to customers, not in API/MCP.

## Help: [email-forwarding](https://feedback.userjot.com/help/articles/email-forwarding)

Updated 2026-11-03. Read 2026-11-16.

- generated forwarding address (one per workspace in beta), provider guides; verification mails arrive as conversations; replies from the forwarding address thread back; widget-started replies emailed from messages@ when the customer has an email; filters auto-replies/OOO/bounces/marketing into Spam; receipts delivered without waking Juno; Rename, Pause receiving; separate from Email to Feedback.

## Help: [operators-and-availability](https://feedback.userjot.com/help/articles/operators-and-availability)

Updated 2026-11-03. Read 2026-11-16.

- operators = owners/admins; availability via app activity and/or weekly schedule per timezone (Basic/Advanced), Appear offline now; customers see up to 4 operator avatars on the new-conversation screen (no names), one workspace presence: green Online dot or neutral "Team support"; never "Offline"; masked identities show workspace logo.

## Help: [away-replies](https://feedback.userjot.com/help/articles/away-replies)

Updated 2026-11-03. Read 2026-11-16.

- one fixed localized acknowledgment per waiting stretch when every configured operator is offline and Juno is not handling; any unconfigured operator disables it; skipped for automated email threads.

## Help: [customize-chat-in-the-widget](https://feedback.userjot.com/help/articles/customize-chat-in-the-widget)

Updated 2026-11-03. Read 2026-11-16.

- Allow new conversations switch (existing threads still readable and replyable); visitor details for anonymous: Don't ask / Ask optionally (email after first message) / Require before sending; fields Email, Name (unverified); greeting ≤240 chars, default "What can we help you with?"; reply time Automatic (≥5 first human replies in 30 days) / few minutes / few hours / within a day / custom 5 min–7 days / don't show.

## Help: [conversation-notifications](https://feedback.userjot.com/help/articles/conversation-notifications)

Updated 2026-11-03. Read 2026-11-16.

- browser push per device + test; New conversations, Customer replies, Assigned to you for push and email; assignee-only after assignment; quiet while Juno handles; push skipped if viewing/read; email delayed a couple of minutes; reply-by-email from team notification emails.

## Help: [block-senders](https://feedback.userjot.com/help/articles/block-senders)

Updated 2026-11-03. Read 2026-11-16.

- Block sender from the thread (visitor session, member account, email); blocked: widget send fails with generic error, history readable; email dropped silently; Moderation → Blocked senders (View conversation, Unblock, who blocked) and Blocked IP addresses (30-day expiry).

## Help: [meet-juno](https://feedback.userjot.com/help/articles/meet-juno)

Updated 2026-11-03. Read 2026-11-16.

- Active toggle; tone/length/formality/emoji; replies in customer language; silent on spam/empty/automated; hands off (asks for human, not covered, not confident, sensitive topics) with a customer note; steps back after a human replies; Hand to Juno; auto-resolve after 30 min chat / 72 h email silence; never changes data or invents; "Handled by Juno" 30-day meter.

## Help: [teach-juno-your-product](https://feedback.userjot.com/help/articles/teach-juno-your-product)

Updated 2026-11-12. Read 2026-11-16.

- sources: upload file (md, txt, html, json, yaml ≤10 MB) or crawl website path; ≤5 sources; publish as one package (Updating… / Knowledge is live); Replace file, Recrawl, Pause, Remove; help center integration; help center suggests updates from conversations.

## Help: [juno-and-feedback-requests](https://feedback.userjot.com/help/articles/juno-and-feedback-requests)

Updated 2026-11-03. Read 2026-11-16.

- in widget chat Juno searches public boards, shows a card (existing or drafted), files/votes/follows only after confirmation; moderation applies (Posted · Pending review); anonymous may create only with guest posting, cannot vote/follow; limits 3 new requests per conversation, 25/workspace/day, 10 votes+follows per conversation; details panel Linked requests labeled Filed/Shown/Voted/Following.

## Help: [swift-sdk-overview](https://feedback.userjot.com/help/articles/swift-sdk-overview)

Updated 2026-11-03. Read 2026-11-16.

- native iOS 15+/macOS 12+ SDK (beta): setup(projectId), identify, showFeedback (all or one board), showRoadmap, showUpdates, SwiftUI .userJotFeedback modifier, custom URLs.

## Help: [swift-sdk-installation](https://feedback.userjot.com/help/articles/swift-sdk-installation)

Updated 2026-11-03. Read 2026-11-16.

- SPM package; setup loads board address in background; show calls wait; URL methods async return nil when unavailable; macOS network entitlement; 0.3 migration notes.

## Help: [swift-sdk-authentication](https://feedback.userjot.com/help/articles/swift-sdk-authentication)

Updated 2026-11-03. Read 2026-11-16.

- identify(userId, email, name...); logout; signed: HMAC-SHA256 of the user ID with the project secret passed as `signature`; Require signed tokens.

## Help: [swift-sdk-common-flows](https://feedback.userjot.com/help/articles/swift-sdk-common-flows)

Updated 2026-11-03. Read 2026-11-16.

- showFeedback(board:), showRoadmap, showUpdates; presentation styles sheet/mediumSheet; URL methods for own WebView.

## Help: [rest-api](https://feedback.userjot.com/help/articles/rest-api)

Updated 2026-11-03. Read 2026-11-16.

- REST over boards, requests, comments, votes, changelog, members, companies, conversations, help articles; base https://api.userjot.com/v1, Bearer token from Settings → API Tokens (workspace-scoped); OpenAPI at /v1/openapi.json; MCP maps every tool to a route.

## Help: [mcp-overview](https://feedback.userjot.com/help/articles/mcp-overview)

Updated 2026-11-06. Read 2026-11-16.

- remote MCP https://api.userjot.com/v1/mcp; OAuth sign-in (owners/admins pick workspace, Allow) for claude.ai, ChatGPT, Claude Code; token header for Cursor/Codex/Windsurf; Connected apps list with who connected; revoke.

## Help: [mcp-common-setup](https://feedback.userjot.com/help/articles/mcp-common-setup), [mcp-claude-code](https://feedback.userjot.com/help/articles/mcp-claude-code), [mcp-cursor](https://feedback.userjot.com/help/articles/mcp-cursor), [mcp-codex](https://feedback.userjot.com/help/articles/mcp-codex), [mcp-chatgpt](https://feedback.userjot.com/help/articles/mcp-chatgpt), [mcp-windsurf](https://feedback.userjot.com/help/articles/mcp-windsurf)

Updated 2026-11-03..06. Read 2026-11-16.

- per-client configuration of the same endpoint (OAuth or Bearer header); no product behavior beyond the overview.

## <https://userjot.com/docs/api>

Read 2026-11-16 (browser, Scalar).

- + https://api.userjot.com/v1/openapi.json (1.0.0, 62 paths)
- Bearer API token or OAuth access token. Optional Idempotency-Key on POST conversation replies/notes, requests, changelogs, assets/import, help articles/collections.
- Boards CRUD; Requests list (cursor, search, sort, author_id/author_external_id, board_ids, statuses, tag_ids, include_merged, merged_into_id), CRUD, similar; request tags; merge/unmerge, status, move board; request attachments; comments CRUD + pin/unpin; comment attachments; comment votes; request votes (add/remove by voter_id or voter_external_id); request subscriptions; changelogs CRUD + tags, authors, linked requests; assets upload/import; members get/update/sync/lookup/list (external_id, email, company), erase personal data; conversations list (statuses, inbox_state, assignee, participant id/external id/email, updated_since), create, timeline, replies, notes, status, assignee; companies sync/lookup/list/update + members; help collections CRUD; help articles CRUD, publish/unpublish; help search.

## <https://userjot.com/docs>

Read 2026-11-16 (browser).

- renders the help-center index (same 63 articles).

## <https://userjot.com/in-app-feedback-widget>

Read 2026-11-16 (browser).

- One text box; AI writes the title and picks the board; up to three similar requests under the draft with a direct vote button; thanks screen ("you'll hear back when it moves").
- Tabs Home, Feedback, Roadmap, Updates; Notifications for identified users; Messages with Conversations; Roadmap/Updates follow the board toggles; full screen on phones; 13 UI languages with RTL for Arabic and Persian.
- Capture: browser tab capture, fallback renderer that omits the widget and masks password, email, phone fields and data-userjot-capture-mask; editor Move, Pen, Arrow, Box, Text, Redact, color picker, undo; up to 4 images (capture, paste, upload). Chat messages take regular file attachments.
- Unidentified visitors can submit; voting, commenting and Notifications need identify. Identify unsigned by default; signed HS256 ≤1h; required signing on Starter+.
- Status-change emails to poster, voters, commenters, subscribers (minus the teammate who changed it). Notifications page lists replies, comments, votes on their posts; launcher unread count.
- Launcher: green dot when team online; update title slides out of the button; red dot until seen; full announcements open the newest post on next visit; either corner, offset, light/dark/auto; own button; deep links; inline pages.
- Shadow DOM; anonymous usage counts to collect.jotlens.com; script tag only, no npm package.

## <https://userjot.com/pricing>

Read 2026-11-16 (browser).

- Free: unlimited posts/users, 3 admin roles, 2 boards, guest posting, public roadmap/changelog, REST API and MCP. Starter $29: moderation, automatic login, 5 boards, one integration, unlimited team members, private boards, 10 tags. Professional $59: unlimited boards, advanced search, SSO, board login controls, unlimited integrations/admins, public identity masking, remove branding, 50 tags. 14-day trial. Live chat and Juno free in beta.

## <https://feedback.userjot.com/updates>

Read 2026-11-16 (browser; 8 entries 2024-11-21..2026-09-10).

- 2026-09-10: live visitor map (Conversations); Juno builds an editable product description from the website; comment moderation, sensitive info checks (text + images), better spam detection; API/MCP: changelog cover images, similar requests, author filter, sort by recent status change; full-widget update announcements; workspace ownership transfer, erase a member's personal data, 30-day grace before account/workspace deletion; partial-word search; CSV exports mark merged requests.
- 2026-08-26 new widget: browse, search, filter, vote, read comments, join discussions, follow requests; capture, annotate and attach screenshots; own images; similar requests while typing; roadmap items and changelog posts readable inside the widget.
- 2026-05-07: REST API and remote MCP; notification preferences; YouTube embeds in updates.
- 2026-04-13: ban users from posting; private internal notes on requests; Kanban board; merge activity in the feedback activity; reply drafts saved to local storage; no automatic heart on own replies; links in update bodies fixed.
- 2025-10-25: changelog editor autosave; AI changelog help.
- 2025-09-24: Roadmap and Changelog visibility toggles independently (public pages and widget).
- 2025-08-06: automatic spam detection; guest submissions; ?openFeedback deep link; reply email notifications; Discord and Slack channel notifications for submissions, comments, status updates.
- 2024-11-21: v0.1 boards, roadmap, updates, subdomain, guest posts, status tracking.

## <https://userjot.com/>

Read 2026-11-16 (browser).

- live chat + boards + roadmap + changelog; Juno searches the board and adds votes after confirmation; chat and forwarded email in one inbox; live translation of customer messages; voice dictation of replies; /remind; Juno private handoff note; customers and team send files in chat; requests list with votes, status, people, weekly "picking up votes" flag; Juno drafts changelog from completed requests, posts list closed requests with votes, scheduling; MCP agents; search across boards; auto-tagging; automatic login; imports; branding on board, widget, emails; custom domain; similar requests while typing; email to feedback; guest posting; scheduled agents; identity masking; private posts; Slack message → request; stale request flags; weekly top-ideas digest; one script tag.

## <https://userjot.com/feature-request-software>

Read 2026-11-16 (browser).

- one vote per person across board, widget, roadmap cards; guest posting default; email/password or Google sign-in; admins post or vote on a customer's behalf; Juno chat votes; Slack and Email to Feedback integrations; up to three similar requests while typing (clicking opens the post, does not vote); merge moves comments and votes, double voter once, old link redirects, merging sends no email, private-board requests cannot merge; six fixed statuses; drag on six-column dashboard roadmap; three-column public roadmap with voting on cards; status-change email to author, voters, commenters, subscribers except the changer, no note, cannot skip; voter list with dates; internal comments; private tags; search all boards; Top and Trending (vote weight halves every 14 days, customer votes only, excludes team and the author); company on profile; weekly digest of top five posts; spam scoring every plan; CSV export of all posts any plan; Professional up to 100 boards. Not offered: revenue-weighted votes, downvotes, vote limits, custom statuses, RICE, Jira/Linear/GitHub sync.

## <https://userjot.com/feedback-board>

Read 2026-11-16 (browser).

- public boards indexed with a sitemap; private boards show customers only their own requests and stay out of search engines; single requests can be private; subdomain with /roadmap and /updates; custom domain moves all three; logo, name, accent color, light/dark following the system; Professional removes badge; email or Google sign-in; automatic login (Starter); SSO with hidden login button (Professional).

## <https://userjot.com/feedback-board>

Read 2026-11-16.

- (rest): 12 board languages incl RTL Arabic; follows browser or fixed; full-text search with typo tolerance, quoted phrases, minus words; weekly top-five digest; per-board sitemap and robots; private boards excluded.

## <https://userjot.com/product-roadmap>

Read 2026-11-16 (browser).

- widget Roadmap page ordered In progress → Planned → recently shipped; signed-in customers vote from the list; shipped requests they voted for marked "for you"; dashboard roadmap columns with votes; status change emails poster/voters/commenters/subscribers (each can opt out) and posts to Slack/Discord; roadmap next to changelog posts; API/agent status changes; embeddable roadmap page; roadmap toggle hides it from board and widget; roadmap page with link preview and sitemap; vote buttons on roadmap cards; cards open the request.

## <https://userjot.com/product-changelog>

Read 2026-11-16 (browser).

- Juno drafting pane (lists requests Completed/Closed since last post, reads threads; sets title/date/tags/authors; links requests; highlighted edits; cannot publish); rich editor (headings, lists, quotes, dividers, code, cover image, inline images, GIFs, YouTube); drafts, scheduled posts; authors; tags 5/10/50; public /updates with per-entry URLs, full-text search, sitemap, cover image as preview card; shipped count (12 weeks) and roadmap next to posts; widget Updates page; launcher unread until seen; launcher stretches with the new title or full open on next visit; linked requests under the post (editor, Juno or API); publishing sends no email (status Completed does); no subscribe form, no audience targeting.

## <https://userjot.com/user-feedback-software>

Read 2026-11-16 (browser).

- board, widget, chat, email into one list; screenshot markup with arrows, boxes, text, redaction; Slack message → request; Email to Feedback; Discord notifications; teammates post/vote on a customer's behalf; REST/MCP on every plan; suggested tags on request (no tagging on arrival); internal comments; private tags; one vote per request; Top and trending; identify passes company; status emails; weekly digest; CSV export any plan; no surveys/NPS/CSAT, analytics, sentiment; no Jira/Linear/GitHub/Zapier/webhooks.

## <https://userjot.com/live-chat-software>

Read 2026-11-16 (browser).

- widget chat (signed in or not) + forwarded email in one inbox; states needs team / Juno handling / waiting on customer; assign, notes, snooze, remind, search; replies reach the customer by email and their reply threads back; read-in-your-language translation and translate-before-send; dictation; files both ways; flat price, no seats.

## <https://userjot.com/juno>

Read 2026-11-16 (browser).

- crawl 500 pages default, up to 2,000; files ≤10 MB; five sources; editable product description; handoff on person/confidence/coverage/accounts-billing-security-privacy; "checking" message on longer questions; push then email after two minutes; private summary; no working-hours switch; feature votes/subscribe/draft after a yes; custom tone; replies in the language of the last message; email answers as email; silent on spam/duplicates/empty/automated; auto-resolve 30 min chat / 72 h email.

## <https://userjot.com/headless>

Read 2026-11-16 (browser).

- six routine prompts; bearer token; updated_since and waiting-on-team filters; Idempotency-Key on replies, notes, requests, changelog posts; API changelog posts stay drafts unless asked to publish; votes/requests by external_id count as the customer's; customer lookup with synced attributes.

## <https://userjot.com/mcp>

Read 2026-11-16 (browser).

- 80 tools from the public API: conversation read/reply/note/assign/resolve, find or post request on the right board, add a customer's vote, reply and pin comments, change status, customer/company lookup and sync; OAuth sign-in or per-agent token.

## <https://userjot.com/slack>

Read 2026-11-16 (browser).

- /userjot and global shortcut open a modal (Board, Title, Description) drafted from the message; message action capture; one root message per request with replies for later events; root message updated in place; Open request button; channel per workspace (public auto-join, private by invite); per-event toggles (new requests, comments, replies, status, board changes); exclude admin actions; test button.

## <https://feedback.userjot.com/help/llms.txt:>

Read 2026-11-16.

- index of the 63 articles above (read in full).

## <https://userjot.com/llms.txt:>

Read 2026-11-16.

- summary facts (statuses, identity options, integrations Slack/Discord/Email to Feedback, REST+MCP, no webhooks/Jira/Linear/GitHub/Zapier, imports, CSV export, Conversations beta) and the page index: 13 product pages (read), pricing (read), help, REST reference and OpenAPI (read), 40 comparison pages and 19 use-case pages and 44 glossary pages.

## <https://userjot.com/llms-full.txt:>

Read 2026-11-16.

- 44 glossary definitions (generic product-management terms; scanned for UserJot product claims, none beyond the summary) and 19 no-code platform guides (Adalo … WordPress): each links the board (/), roadmap (/roadmap) and updates (/updates) URLs and points to branding (name, logo, favicon, primary color). Read one in full (Adalo) and scanned the rest for widget, embed, SSO or identify claims: none.
