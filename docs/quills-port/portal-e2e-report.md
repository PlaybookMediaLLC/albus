# Portal end-to-end report

This report proves the customer self-service pages from a real mail link, for the correct customer
only. It lists every page under `apps/web/src/routes/portal/$workspaceId/`, the routes it calls,
the checks that ran, the result, and the defects with their fixes.

- Date: 2026-11-17. Code: branch `claude/festive-bardeen-yc9p98`, from `origin/staging` (`72ec91a2`).
- Stack: `pnpm dev:demo` with a Mailpit inbox. This branch first added its own (SMTP 54481, inbox
  54482); staging then gained the same inbox (SMTP 51390, inbox 51391), and the merge keeps
  staging's. Each mail was read from the Mailpit API and its link opened in Chromium (Playwright
  scripts).
- Actors:
  - Customer A: `portal-customer@example.test` (seeded).
  - Customer B: `customer-b@example.test`. B signed up in the demo, verified the address with a
    magic link from the inbox, and joined the private portal with an invite.
  - A signed-out visitor.
  - A teammate: `portal-demo@example.test` (workspace owner).

## How each page was checked

| Check | Method |
|---|---|
| Normal | Real seeded or created data, as the actor the page is for. |
| Loading | Every page API call held 2.5 s (the layout's config and access calls were not held). The page was read after 1.2 s. |
| Error | Every page `GET` answered 500. The page was read after its retries. Then the API came back and "Try again" was pressed. |
| Empty | A caller with no records of its own (B before any activity, or a new list). |
| Reverse action | Vote and remove the vote, follow and unfollow, subscribe and unsubscribe, turn a preference on and off, and each of them again. A customer cannot close a ticket; the teammate closed and reopened one and the customer page followed. |
| Mail arrival | The mail's link, opened from the inbox, as the recipient, as the other customer and signed out. |
| Access | B against A's conversation, tickets and feedback list; A against B's invite; signed out; a private portal (a non-member, a member by invite, a teammate); a portal that is off. |
| Widths | 1280, 390 and 320 px: no horizontal scroll (`scrollWidth`), plus a screenshot. |
| Keyboard | 30 Tab stops at 1280 and 320 px. Each focused element is on screen and its pixels change when it has focus (a visible focus ring). |

The scripts and screenshots are session artifacts, not part of the repository.

Inbound mail needs a Resend-signed webhook, which the demo cannot produce. The email conversation
was therefore the seeded one: the teammate set its customer's contact address to A's address
(`captureQuillsVisitorContactEmail`) or started a new email conversation with that customer
(`startQuillsAgentConversation`). The reply and CSAT mails then go through the real send path.

## Page inventory

All routes are under `/api/quills-public/{workspace}`. "Portal gate" means: the portal is on
(else 404), the private-portal gate admits the caller (else 403), and the board, post or comment
is visible to the caller (`portal/feedback/viewer.ts`). "Sign-in" means the route answers 401
without a Kaneo session. Writes run `ensureCustomer`, so a portal account gets its customer
profile on its first write. No page is linked from the widget: the widget calls the widget routes.

| Page (route file) | Web audience | API routes | Server checks | How a customer arrives |
|---|---|---|---|---|
| Home (`index`) | portal | `listQuillsPortalBoards`, `listQuillsPortalPosts`, `listQuillsPortalStatuses`, `getQuillsPortalUserStats`, `findQuillsPortalSimilarPosts`, `listQuillsPortalVotedPosts`, `createQuillsPortalPost`, `setQuillsPortalVote`, `getQuillsPortalActiveSurvey`, `submitQuillsPortalSurveyResponse` | Portal gate; reads need no sign-in; writes need sign-in and the board's submit or vote tier | Feedback tab, links |
| Board (`boards/$boardId`) | portal | The home routes without the survey | Portal gate and the board view tier | Board rail, sitemap |
| Post (`posts/$postId`) | portal | `getQuillsPortalPost`, `listQuillsPortalPostComments`, `createQuillsPortalComment`, `editQuillsPortalOwnPost`, `deleteQuillsPortalOwnPost`, `editQuillsPortalOwnComment`, `deleteQuillsPortalOwnComment`, `setQuillsPortalVote`, `setQuillsPortalFollow`, `setQuillsPortalCommentReaction`, `translateQuillsPortalContent`, `findQuillsPortalSimilarPosts`, the portal upload and file routes | Portal gate; edit and delete only the caller's own post or comment | Comment mail, status-change mail, weekly digest, lists |
| Roadmap (`roadmap`) | portal | `listQuillsPortalRoadmaps`, `listQuillsPortalRoadmapPosts`, `listQuillsPortalStatuses`, `listQuillsPortalBoards`, `listQuillsPortalVotedPosts`, `setQuillsPortalVote` | Portal gate; 404 while the roadmap tab is off | Roadmap tab |
| Changelog (`changelog/index`) | portal | `listQuillsPortalChangelog`, `listQuillsPortalVotedPosts`, `setQuillsPortalChangelogReaction` | Portal gate, changelog audience; 404 while the tab is off | Updates tab, RSS |
| Changelog entry (`changelog/$entryId`) | portal | `getQuillsPortalChangelogEntry`, `setQuillsPortalChangelogReaction` | As the changelog | Shipped mail, RSS |
| My feedback (`my-feedback`) | signed-in | `listQuillsPortalMyFeedback`, `getQuillsMyWeeklyDigestPreference`, `setQuillsMyWeeklyDigestPreference` | Sign-in, portal gate; only the caller's own posts, votes and follows | Account menu, weekly digest |
| Support (`support/index`) | signed-in | `listQuillsMyConversations`, `startQuillsMyConversation` | Sign-in, portal gate, support on; only the caller's conversations | Support tab |
| Tickets (`support/tickets`) | signed-in | `getQuillsMyTickets`, `createQuillsMyTicket` | As support | Link on the support page |
| Conversation (`conversations/$conversationId`) | signed-in | `getQuillsMyConversation`, `listQuillsMyConversationMessages`, `sendQuillsMyConversationMessage`, `markQuillsMyConversationRead` | As support; 404 for another customer's conversation | Support list; the reply mail of a portal conversation or ticket (O1); the reply mail of an email conversation when its customer has a portal account (D2) |
| CSAT (`csat`) | public | `validateQuillsCsatEmailToken`, `recordQuillsCsatViaToken` | The token is the credential: hashed, single use, expires | CSAT request mail (email conversations) |
| Preferences (`preferences`) | signed-in | `getQuillsMyLanguagePreference`, `setQuillsMyLanguagePreference`, `getQuillsMyChangelogSubscription`, `subscribeQuillsMyChangelog`, `unsubscribeQuillsMyChangelog`, `getQuillsMyStatusSubscription`, `subscribeQuillsStatus`, `unsubscribeQuillsStatus` | Sign-in; changelog: portal gate; status subscribe: the status-page gate; reads and unsubscribes work on the caller's own rows | Account menu |
| Profile (`profile`) | signed-in | `getQuillsCustomerProfile`, `updateQuillsCustomerProfile`, `getQuillsPublicUserProfile` | Sign-in, portal on; own profile; the public profile has public fields only | Account menu |
| Unsubscribe (`unsubscribe`) | public | `previewQuillsUnsubscribeToken`, `processQuillsUnsubscribeToken`; the mail header uses `createQuillsUnsubscribe` | The token is the credential; the preview never spends it; works while the portal is off | Comment, status-change, shipped, digest and status-page mail |
| Invite (`invite/$inviteId`) | signed-in | `acceptQuillsPortalInvite` | Sign-in, portal on, a token of the invite, the invited and verified address; never grants membership | Invite mail |
| Help center (`hc/index`, `hc/$locale/index`) | portal (was public, D5) | `getQuillsPublicHelpCenter`, `searchQuillsPublicHelpCenter` | Portal on, help-center module on, private-portal gate, segment gates | Help tab |
| Help category (`hc/$locale/collections/$idSlug`) | portal (D5) | `getQuillsPublicHelpCenterCategory` | As the help center | Help center, sitemap |
| Help article (`hc/$locale/articles/$idSlug`) | portal (D5) | `getQuillsPublicHelpCenterArticle`, `recordQuillsPublicArticleFeedback` | As the help center | Help center, sitemap, embeds |
| Help redirect (`hc/$`) | portal (was public, D5) | `resolveQuillsPublicHelpCenterRedirect` | As the help center; a teammate's redirect rule | Old help-center links |
| Status (`status/index`) | portal (D5) | `getQuillsPublicStatusPage`, `listQuillsPublicStatusHistory`, `getQuillsPublicStatusUptime` | Status module, page switch, private-portal gate, page audience, component segments | Status tab |
| Status incident (`status/incidents/$incidentId`, and `status/$incidentId` redirects to it) | portal (D5) | `getQuillsPublicStatusIncident` | As the status page; an incident shows only through a visible component | Status-page mail |
| Portal layout (`$workspaceId`) | — | `getQuillsPublicPortalConfig`, `evaluateQuillsMyPortalAccess` | Portal on; the access decision for the private portal | Every page |

## Results

The full matrix (widths, keyboard, loading, error and retry) ran on all 23 routes before the fixes
and again after them. Widths and keyboard passed both times: no horizontal scroll at 1280, 390 or
320 px, and every Tab stop was on screen with a visible focus change. In the second run the pixel
check flagged the "Add reaction" and "Reply" buttons of a comment once; screenshots with keyboard
focus show a clear ring on both, so it was a false positive. After the fixes, every page shows its
frame and "Loading…" while the API is slow, and every page with data shows "Something went wrong"
with a working "Try again". The table lists the other checks.

| Page | Checks | Result | Defects |
|---|---|---|---|
| Home | normal, loading, error and retry, private portal as signed out, A, B and teammate | Pass after fixes | D9 |
| Board | normal, loading, error and retry, composer post as A, unknown board | Pass after fixes | D1, D9 |
| Post | normal, loading, error and retry, vote and follow reverse actions as B, comment and status-change mail links as A, B and signed out, unknown post | Pass after fixes | D1, D9 |
| Roadmap | normal, loading, error and retry | Pass after fixes | D9 |
| Changelog | normal, loading, error and retry | Pass | — |
| Changelog entry | normal, loading, error and retry, shipped mail link as A, B and signed out | Pass after fixes | D1 |
| My feedback | normal, loading, error and retry, empty, weekly digest off and on, filters, B sees only B's activity, signed out gets sign-in | Pass after fixes | D9 |
| Support | normal, loading, error and retry, empty, start a conversation, B and signed out, reply mail after a teammate reply | Pass after fixes | O1 |
| Tickets | normal, loading, error and retry, empty, create, B sees none of A's, teammate closes and reopens, reply mail after a teammate reply | Pass after fixes | O1 |
| Conversation | normal, loading, error and retry, teammate reply shown, B gets 404, signed out gets sign-in, support reply mail link, portal reply mail link as A and B, no mail while the customer has the page open | Pass after fixes | D2, D9, O1 |
| CSAT | CSAT mail link signed out, the token leaves the address bar, rate, reuse, error and retry, portal off, malformed token | Pass after fixes | D6, O7 |
| Preferences | normal, loading, error and retry, changelog and status on, off and on, language set, kept after reload, invalid, cleared | Pass after fixes | D4 |
| Profile | normal, loading, error and retry, name too short, save, reload, revert, B reads A's public profile without email | Pass after fixes | D4 |
| Unsubscribe | links from the comment, status-change, shipped and status-page mail, signed out; preview, confirm, reuse, follow again; one-click `POST` without cookies and its repeat; the one-click URL opened in a browser; portal off | Pass after fixes | D3, D6, O2 |
| Invite | invite mail link as the invitee (B), as another account (A), signed out through code sign-in and back, accept, open again | Pass after fixes | D7 |
| Help center | normal, loading, error and retry, private portal as signed out, A, B (invited) and teammate | Pass after fixes | D5 |
| Help locale | normal, loading, error and retry | Pass after fixes | D5 |
| Help category | normal, loading, error and retry | Pass after fixes | D5 |
| Help article | normal, loading, error and retry, private portal | Pass after fixes | D5 |
| Help redirect | normal (no rule: not found), loading, error and retry, private portal | Pass after fixes | D5 |
| Status | normal, loading, error and retry, private portal, public portal signed out, portal off | Pass after fixes | D5, O5 |
| Status incident | status-page mail link as B, A (denied) and signed out, loading, error and retry, words for the states, portal off, malformed ID | Pass after fixes | D5, D8, D9, O5, O7 |
| Status legacy redirect | redirect to the incident page | Pass | D9 |

## Mail flows

| Mail | Trigger in the demo | Who got it | Link opens | Result |
|---|---|---|---|---|
| Invite | teammate sends a portal invite | the invited address | `invite/$inviteId#token=…` | Pass. The token survives sign-in by code. |
| Comment | teammate comments on A's post | A (author) and B (voter and follower, after B verified the address) | the post | Pass. Not sent to B while B's address was unverified, as designed. |
| Status change | teammate moves the post to Planned | A and B | the post | Pass after O3: the author reads "Your feedback is now …", a follower "Feedback you follow is now …". |
| Shipped | teammate publishes a changelog entry linked to the post | A and B | the changelog entry | Pass |
| Status page | teammate creates a notifying incident and posts an update | B (subscribed and admitted) | the incident | Pass. A was subscribed but denied by the private portal and got no mail. |
| Support reply | teammate replies on an email conversation | the conversation's address | before D2: a portal page that showed "not found"; after: no portal link, the customer replies by mail | Pass after D2 |
| Portal reply (O1) | teammate replies on a portal conversation or a portal ticket | the customer's verified Kaneo account address, about 2 minutes later | the conversation page | Pass. No mail while the customer has the page open, and one mail for a burst of replies (the newest). |
| CSAT request | teammate closes an email conversation | the conversation's address | `csat?token=…&rating=n` | Pass, also while the portal is off (D6) |
| Unsubscribe | the link in every mail above, and the `List-Unsubscribe` header | — | the unsubscribe page; the header's URL takes a one-click `POST` | Pass. The header has no `List-Unsubscribe-Post` in the demo because the link is http; that is by design (`list-unsubscribe.ts`). |

## Defects

| ID | Page | Steps | Expected | Actual | Fix | Test (fails before the fix) | Status |
|---|---|---|---|---|---|---|---|
| D1 | Every page with a record ID, and the layout | Open a mail link to a deleted post (`/posts/<missing id>`) | The not-found state after one request | 12 failed requests and 7.3 s before "This item could not be found"; 4 s for a board or changelog entry | `quills/api/retry-portal-problem.ts` in the Quills block of `apps/web/src/query-client/index.ts` (shared code, approved by the owner): only a `failed` problem is retried | `apps/web/src/query-client/index.test.ts` "asks once for a Quills answer that a retry cannot change, and retries a failed request" | Fixed |
| D2 | Conversation | Teammate replies on an email conversation; the customer opens "View conversation" signed in with that address | A page that opens, or no link | "This item could not be found": an inbound mail's sender is never linked to a portal account | `jobs/handlers/support-mail.ts#customerConversationLink`: the reply mail links to the portal only for a customer profile linked to a Kaneo account while the portal is on; the mail templates take an optional link | `support/conversation-assistant.test.ts` "links the reply mail to the portal page only for a customer who can open it there" (real PostgreSQL) | Fixed |
| D3 | Unsubscribe | Open any unsubscribe link | The page says what the link stops | Only "Unsubscribe from notifications" and a button | One line per action, from static keys; never the post title, because the page needs no sign-in | `unsubscribe-page.test.tsx` "says what … stops before the customer confirms" (6 actions) | Fixed |
| D4 | Preferences, profile and every Quills form | Save an invalid language tag, or a one-letter name | A translated field error | zod's English: "Invalid string: must match pattern /^$\|^[A-Za-z]{2,3}…/", "Too small: expected string to have >=2 characters" | `PortalForm` passes a zod error map (`core/validation-message.ts`) to the resolver; new `core.validation.*` keys | `test/contracts.tsx` (form contract, 17 forms failed before), `core/validation-message.test.ts` | Fixed for client checks. Server field messages are still English (O6). |
| D5 | Help center, help redirect, status, status incident | Private portal; open the help center, the status page or a status-page mail link signed out | The sign-in path; "no access" for a signed-in non-member | "This item could not be found" | The seven pages declare `audience: "portal"`, as their API routes do, and send no request before access; the incident page shows a failed access check with a retry, not a denial; the incident route prefetch waits for access; the help pages return to the path's own locale after sign-in | The page contract checks for `portal` pages, plus "asks a signed-out visitor to sign in on a private portal and loads nothing" in the status, incident, help-center and redirect tests, and "offers a retry when the access check fails" in the incident test | Fixed. Three tests that expected public pages on a private portal were replaced: the API never served them. |
| D6 | Unsubscribe, CSAT | Portal off (the default); open an unsubscribe or CSAT link from a mail | The page works: the API routes do not need the portal | A blank page | The portal layout renders these two pages without the portal frame when the portal config is 404; the pages read the viewer from the session | `portal/layout.test.tsx` "opens the mail-linked … page while the portal is off" | Fixed |
| D7 | Invite | Signed in as A, open B's invite link and accept | Tell A to use the invited address | "This item could not be found" | The page names the 403: another or unverified address | `invite-page.test.tsx` "says why the API refused the invite (403)" | Fixed |
| D8 | Status incident | Open a status-page mail link | Words for the states | "Status: investigating", "Impact: major", "API: partial_outage" | Static keys for the incident status, impact and component status | `status-incident-page.test.tsx` "names the status, impact and component states in words" | Fixed |
| D9 | Home, board, post, roadmap, my feedback, conversation, status incident | Slow API (2.5 s) | The page frame and its loading state | A blank white page until the data arrived (the app's pending screen is empty on portal paths) | The routes start their prefetch and no longer wait for it | `portal/prefetch.test.ts` "shows the page while its data is still on the way" | Fixed |
| O1 | Support, tickets, conversation | A customer starts a conversation or a ticket on the portal; a teammate replies | A mail that brings the customer back to the reply | No mail at all ("a messenger message queues no mail job") | `jobs/handlers/support-mail.ts#portalReplyMail`: the reply is mailed to the customer's verified Kaneo account address with a link to the conversation page. The job waits 2 minutes (`directDelay`, and a delay in `enqueueQuillsJob`). At send time the reply must still be unread and the newest, the portal and support must be on, the private-portal gate must admit the customer, and the customer must not have muted mail or be blocked or a test customer | `support/conversation-assistant.test.ts` "mails a portal customer an unread, newest teammate reply after a wait, and never otherwise" (real PostgreSQL) | Fixed |
| O3 | Status-change mail | Change the status of A's post that B follows | Only the author reads "your feedback" | "Your feedback is now Planned!" to every subscriber | The fan-out passes `yours` (the author); a follower gets "Feedback you follow is now …" as the subject and heading | `packages/email/src/quills/__tests__/status-change.test.tsx` | Fixed |
| O6 | Every Quills form | The API rejects a field (`VALIDATION_ERROR`) | A translated message at the field | The API's English zod text | Each API issue now carries zod's `code`, and for size issues `origin` and `minimum` or `maximum` (`apps/api/src/errors/validation-issues.ts`, shared code approved by the owner; documented in the `ApiError` schema and `api-reference/errors.mdx`). `toPortalProblem` keeps those fields and drops the English text, and `PortalForm` translates them with `core/validation-message.ts`: "Use at most 200 characters.", "Check the format of this value.", or "Check this value." for any other code. Text that the client writes itself (such as "name taken") still shows | `errors/validation-issues.test.ts`, `error-shape.test.ts` (integration), `api/errors.test.ts`, and the form contract cases "names the reason of an API field issue from its code" and "shows a portal string for an API field issue" | Fixed |
| O2 | Unsubscribe | Open the `List-Unsubscribe` URL of a real status-change mail in a browser, as some mail apps do instead of sending the `POST` | The unsubscribe page, which asks first | The JSON preview | A public GET may declare `browserPage` (`framework/define-route.ts`): a browser navigation gets a 303 to that web page, with `no-store` and `no-referrer`, before the handler runs. The preview route uses it. Mail providers still `POST` the same URL for one-click, and a scanner's GET still changes nothing | `portal/customer.test.ts` "previews an unsubscribe link without spending it, then spends it once" (303 to the page; still subscribed), `framework/contract.self.test.ts` "takes a browser page only on a public GET" | Fixed |
| O5 | Status, status incident | Portal off; open the status page or a status-page mail link | The page: the status API needs only the status page's own switch, and applies the private-portal gate itself | "This item could not be found" | The layout also renders the status pages without the portal frame when the portal config is 404; with no portal runtime the pages call the API at once (`useOptionalPortalRuntime`). The help pages still need the portal, as their API does | `portal/layout.test.tsx` (status case), "opens while the portal is off" in the status test, "opens from a status mail while the portal is off" in the incident test | Fixed |
| O7 | Any page with a path ID or link token | Open `/status/incidents/x` or `/csat?token=x` | "Not found", or "This link is no longer valid" for a token link | "Check the highlighted fields." | `toPortalProblem`: a validation answer whose issues are all on path parameters, or on the token of a token link, maps to `notFound` or `gone`, as a 404 does. An issue on a typed value stays a field error | `api/errors.test.ts` "shows a malformed link as not found, or as gone for a token link, not as a form error" | Fixed |

## Open findings

O1, O2, O3, O5, O6 and O7 were fixed in follow-ups; see the defects table.

| ID | Finding | Why it is not changed |
|---|---|---|
| O4 | Verifying B's address with a magic link removed B's password sign-in (no account row was left). | Intended. B signed up with a password and never verified the address. When someone then proves the address with a magic link, Better Auth (`revokeUnprovenAccountAccess`, used by `magic-link` and `email-otp`) deletes the unproven sign-in methods and sessions before it marks the address verified. Without that, whoever registered a victim's address with a password first would keep access. Kaneo's own `requireLocalEmailVerified` linking rule in `apps/api/src/auth.ts` guards the same case for OAuth. The customer sets a password again with "Forgot password". |

## Review

The `feature-flow` review team could not run: the skill is not installed in this environment (not
in `.claude/skills`, `.agents/skills` or the user skills). The `ponytail-review` skill reviewed the
diff in the same session instead, with no sub-agents. It found three issues, all fixed with a test
that failed first:

1. The incident page showed "no access" when the access check itself failed. It now shows the
   error with "Try again".
2. The help-center redirect page still treated a private portal as public (the D5 gap on one more
   page). It now asks a signed-out visitor to sign in.
3. `pnpm dev:demo` skipped starting Mailpit when a stopped container of that name existed, yet
   printed the inbox URL. It replaced a stopped container. (That code was later dropped for
   staging's demo inbox.)

A suggestion to merge the repeated "workspace after access" lines into one helper was left out:
it would touch pages outside this change.

## Checks run

Run on the branch with the D2–D9 and review fixes, in a Linux cloud container with Node 24.22.1 (the repository's
`engines`; the macOS mise Node 22 path does not exist there).

| Command | Result |
|---|---|
| `node --test scripts/dev-demo/lib.test.mjs` | 6 passed |
| `pnpm exec vp test run --config vitest.config.ts` in `apps/web` (three workers) | 1,568 files, 6,557 tests passed |
| `tsc --noEmit -p tsconfig.app.json --singleThreaded` in `apps/web` | passed. `pnpm typecheck` runs the same check multi-threaded and was killed for memory in this container. |
| `tsc --noEmit -p tsconfig.json --singleThreaded` in `apps/api` and `packages/email`, and `tsc -p tsconfig.previews.json` in `packages/email` | passed |
| `vp test run --config src/quills/test/vitest.config.ts` in `apps/api` (`test:quills`, `QUILLS_TEST_DATABASE_URL` = a disposable `quills_e2e_test` database) | 135 files, 1,953 tests passed, none skipped |
| `vp test run --config vitest.config.ts` in `apps/api` and `scripts/mcp-tool-input-bounds.test.ts` (`pnpm test`) | 256 files passed, 88 skipped (the database tests, which ran in `test:quills` above); bounds test passed |
| `vp test run --config vitest.integration.config.ts` in `apps/api` (`test:integration`, a disposable `kaneo_e2e_test` database) | 199 files, 2,205 tests passed; 3 skipped by an existing `it.skipIf(type === "gitlab")` in `integration-sync-providers.test.ts` |
| `pnpm --filter @kaneo/email test` | 49 files, 418 tests passed; the Mailpit delivery file, run against the demo inbox with `QUACKBACK_EMAIL_MAILPIT_TESTS=1`, 6 passed |
| `pnpm exec vp check` on every changed file (`pnpm lint` scope) | formatted, no lint errors |
| `node scripts/quills-web/cli.mjs check` | passed; no new rule exceptions |
| `pnpm i18n:check` | all locales in sync |
| `pnpm openapi:check` | `apps/docs/openapi.json` is up to date. No route or schema changed in this round, so `openapi:check:fix` had nothing to write; the issue codes later did (see below). |

### Follow-up checks (O1, O3, O6)

| Command | Result |
|---|---|
| The O1 test against the code before the fix | failed: no mail was planned for a portal reply (`expected false to be true`) |
| The O3 test before the fix | failed: no author or follower copy (`statusChangeHeadline is not a function`) |
| The O6 tests before the fix | 31 failed: the API's English issue text passed through, and the form showed nothing for an issue without text |
| `vp test run --config src/quills/test/vitest.config.ts` in `apps/api` (`test:quills`, disposable database) | 135 files, 1,954 tests passed. The first run failed one test that expected no mail to a portal requester on a tracker's reply-all; that expectation was updated, because the reply lands in their ticket. |
| `pnpm exec vp test run --config vitest.config.ts` in `apps/web` (three workers) | 1,568 files, 6,586 tests passed |
| `pnpm --filter @kaneo/email test` | 50 files, 420 tests passed; the Mailpit delivery file skipped (opt-in) |
| `tsc --noEmit --singleThreaded` in `apps/api`, `apps/web` and `packages/email`, and the email previews | passed |
| `pnpm exec vp check` on every changed file, `node scripts/quills-web/cli.mjs check`, `pnpm i18n:check` | passed |
| Browser, demo stack | O6: the profile form showed "Check this value." for a server field error. O3: A got "Your feedback is now In Progress!", B "Feedback you follow is now In Progress". O1: no mail after 60 s; after 150 s, one mail for a burst of two replies (the newer text), one for a ticket reply, none for the conversation that A had open; the link opened the conversation for A, and B saw no data. |
| Kaneo integration suite | run after the issue codes below, which change the shared error shape |

### Follow-up checks (D1, server issue codes)

| Command | Result |
|---|---|
| The D1 test against the code before the fix | failed: a Quills `notFound` was asked for three times (`expected 3 to be 1`) |
| The issue-code tests before the fix | `validation-issues.test.ts` failed (no `code`, `origin` or bounds in the issues); the web form and `toPortalProblem` cases failed |
| `vp test run src/errors` in `apps/api` | 43 tests passed |
| `vp test run --config vitest.integration.config.ts` in `apps/api` (`test:integration`, disposable `kaneo_e2e_test` database) | 199 files, 2,205 tests passed; 3 skipped (the same `gitlab` skips) |
| `pnpm exec vp test run --config vitest.config.ts` in `apps/web` (three workers) | 1,569 files, 6,623 tests passed. The first full run failed `task-subtasks.test.tsx`: the query client imported the helper from `quills/api/errors.ts`, which loads the UI barrel and its i18n setup. The helper moved to `quills/api/retry-portal-problem.ts` with its own test, and the rerun passed. |
| `tsc --noEmit --singleThreaded` in `apps/api` and `apps/web` | passed |
| `pnpm openapi:check:fix` | wrote the four optional issue fields to `apps/docs/openapi.json`; `openapi:check` then passed |
| `pnpm exec vp check` on every changed file, `node scripts/quills-web/cli.mjs check`, `pnpm i18n:check` | passed |
| Browser, demo stack | The profile form sent a 150-character name to the real API (lengthened in flight, since the form allows only valid names). The API answered `too_big`, `origin: "string"`, `maximum: 100`; the field was marked invalid and read "Use at most 100 characters." |

### Follow-up checks (O2, O5, O7)

| Command | Result |
|---|---|
| The new tests against the code before the fixes | O2: `expected [ 200, null, null ] to deeply equal [ 303, …(2) ]`, and the guard test failed. O5: three failed (the layout rendered nothing for `status`; the pages threw "usePortalRuntime must be used inside PortalRuntimeProvider"). O7: `expected { kind: 'invalid', …(1) } to deeply equal { kind: 'notFound' }` |
| `vp test run --config src/quills/test/vitest.config.ts` in `apps/api` (`test:quills`, disposable database) | 135 files, 1,955 tests passed |
| `pnpm exec vp test run --config vitest.config.ts` in `apps/web` (three workers) | 1,569 files, 6,627 tests passed |
| `tsc --noEmit --singleThreaded` in `apps/api` and `apps/web` | passed |
| `pnpm openapi:check:fix` | wrote the 303 answer of `GET /quills-public/{workspace}/unsubscribe`; the shared 303 headers of the signed redirect routes now read "The web page", "The redirect is never cached" and "This URL is not sent to the web app" |
| `pnpm exec vp check` on every changed file, `node scripts/quills-web/cli.mjs check` | passed |
| Kaneo integration suite | not run again: no Kaneo route, schema or migration changed |
| Browser, demo stack, real mail | O2: the `List-Unsubscribe` URL of a real status-change mail, opened in a browser, landed on `/portal/…/unsubscribe` (token out of the address bar) with "You will stop getting mail about this post." and an Unsubscribe button; A still followed the post; a non-browser GET still got the JSON preview. The demo's http links carry no `List-Unsubscribe-Post` header, as designed (one-click needs HTTPS). O7: `/status/incidents/x` showed "This item could not be found."; `/csat?token=x` showed "This link is no longer valid. Open the latest email and try again." O5: with the portal off, the status page showed the components, active incidents and uptime, and the incident page its updates; the help center still showed "not found", as its API does. |

