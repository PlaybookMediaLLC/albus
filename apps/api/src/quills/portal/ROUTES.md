# P3a route set: audiences other than teammates (identity, config and access)

Non-teammate routes are under `/quills-public/{workspace}`. `{workspace}` is a workspace ID
or slug that the caller names; an ID match wins over a slug match. Teammate routes stay under
`/quills/{workspaceId}`. A workspace that never initialized Quills (no teammate has used it)
returns 404 on every non-teammate route, and an anonymous caller never seeds it. Every route
uses `defineQuillsRoute`; the `Audience` column is the declaration's `audience` field. The source rows are in `docs/quills-port/ledger/phase-P3.md`.
Merge rule and action mapping: `docs/quills-port/detailed-plan.md`, sections 2 and 3. For a
non-teammate route the action is recorded for the ledger only; the audience resolver authorizes.

The framework has no PATCH method, so a partial update uses PUT.

## Boundary map

```
Tables and owning schema:      quills: settings, customer_identity, principal, kv_store,
                               rate_bucket, visitor_devices, page_views, user_segments,
                               segments, audit_log, events, job_queue. public: workspace (read, in the entry point),
                               workspace_member (read only, platform-reads.ts, access branch).
Actor and workspace source:    teammate: authenticated context (unchanged).
                               portal: the Kaneo session (cookie or session Bearer, never an
                               API key); workspace from the path, resolved by
                               withQuillsAudience. widget: the widget session Bearer token,
                               looked up by its SHA-256 hash in the path's workspace; it
                               ends when the widget is turned off or its secret rotates.
                               public: no identity.
Permissions:                   teammate: workspace:read + quills:<action>. Others: none of
                               Kaneo's; the audience resolver and the handler's ownership
                               rule authorize. A teammate on a portal route is a customer.
Persisted relationships:       customer_identity.kaneo_user_id (portal link, decision D1),
                               principal.user_id -> customer_identity.id, kv_store widget
                               session row -> principal.
Transaction:                   one scoped transaction per request through withQuillsAudience;
                               a rate limit runs first in its own committed transaction.
External effects:              none; each mutation records one outbox event.
Completion checks:             authenticated endpoint, tenant/object access, mutation,
                               read, schema/ownership constraint (migration 0010).
```

## Public (no identity)

| operationId | Route | Audience | Action | Tables | Event | Tests |
|---|---|---|---|---|---|---|
| `getQuillsPublicPortalConfig` | `GET /portal/config` (`nav`: the portal tabs that are on and the safe custom links; see `feedback/ROUTES.md`) | public | read | `settings` | - | contract, audience, read-leak, tabs |
| `getQuillsCustomerAvatar` | `GET /user/avatar/{customerId}` (JSON `{ url }`, not a redirect) | public | read | `customer_identity` | - | contract, audience, two-workspace |
| `getQuillsWidgetConfig` | `GET /widget/config.json` | public | read | `settings` | - | contract, audience, read-leak |
| `getQuillsWidgetCapabilities` | `GET /widget/capabilities` | public | read | none | - | contract, audience |
| `getQuillsWidgetLocale` | `GET /widget/locale` (`?locale=`, `Accept-Language`) | public | read | none | - | contract, audience |
| `redeemQuillsWidgetInstallCode` | `POST /widget/install-context` (20 per 15 min per client) | public | update | `kv_store`, `settings`, `rate_bucket` | `settings.widget_install_code_redeemed` | contract, audience, rollback |

Merged: `fetchPublicPortalConfig`; `routes/api/user/avatar.$userId.ts#GET` and
`portal.ts#fetchUserAvatar`; `config[.]json.ts#GET`; `widget-capabilities.ts`;
`widget.tsx#getWidgetLocale`; `install-context.ts#POST`.

## Widget (widget session Bearer)

| operationId | Route | Audience | Action | Tables | Event | Tests |
|---|---|---|---|---|---|---|
| `identifyQuillsWidgetVisitor` | `POST /widget/identify` (HS256 `ssoToken` signed with the widget secret, with `exp`; 60 per 15 min per client). A profile linked to a Kaneo account resolves only by its `sub` with its email, and keeps its name, email and avatar; any other match of it is 409 | widget, no session needed | create | `customer_identity`, `principal`, `kv_store`, `rate_bucket` | `user.identified` | contract, audience, rollback, `portal/widget-link.test.ts` |
| `getQuillsWidgetSession` | `GET /widget/session` | widget | read | `kv_store`, `principal`, `customer_identity` | - | contract, audience |
| `linkQuillsWidgetDevice` | `POST /widget/device` (body field `device`, not `deviceId`: a caller-chosen value) | widget | update | `visitor_devices`, `page_views` | none (analytics link) | contract, audience, rollback |
| `sendQuillsWidgetPortalLink` | `POST /widget/portal-link` ("Open in portal"; identified visitor only, portal on; 10 per 15 min per client) | widget | create | reads `customer_identity`, `principal`, `settings`; writes the pending request to `kv_store`; Kaneo writes `public.verification` | none (a pending request and Kaneo's sign-in link) | contract, audience, rollback, `portal/widget-link.test.ts` |

Merged: `identify.ts#POST`; `session.ts#GET` and `widget-auth.ts`; `device.ts#POST`.

## Portal (Kaneo account, no membership)

| operationId | Route | Audience | Action | Tables | Event | Tests |
|---|---|---|---|---|---|---|
| `evaluateQuillsMyPortalAccess` | `GET /portal/access` | portal, sign-in optional | read | `settings`, `user_segments`; reads `public.workspace_member` | - | contract, audience, read-leak |
| `recordQuillsPortalAccessDenied` | `POST /portal/access-denied` (records only a denial that the server evaluates) | portal | update | `audit_log`, `events`, `job_queue`, `rate_bucket` | `portal.access_denied` | contract, audience, rollback |
| `getQuillsPortalWidgetLink` | `GET /portal/widget-link` (whether a widget profile waits for the caller's answer) | portal | read | `kv_store`, `customer_identity`, `principal` | - | contract, audience, `widget-link.test.ts` |
| `declineQuillsPortalWidgetLink` | `DELETE /portal/widget-link` ("This wasn't me": the pending request ends; 30 per 10 min per account and per client) | portal | update | `kv_store` | none (a pending request only) | contract, audience, rollback, `widget-link.test.ts` |
| `linkQuillsPortalWidgetProfile` | `POST /portal/widget-link` (the person confirmed the link in the portal; 30 per 10 min per account and per client) | portal | update | `customer_identity`, `principal` and every table of `directory/lead-merge.ts#repoint` | `user.lead_merged` | contract, audience, rollback, `widget-link.test.ts` |
| `getQuillsCustomerProfile` | `GET /user/profile` | portal | read | `customer_identity`, `principal` | - | contract, audience |
| `updateQuillsCustomerProfile` | `PUT /user/profile` (creates the link when missing; 30 per 10 min per client) | portal | update | `customer_identity`, `principal` | `customer.profile_updated` | contract, audience, rollback |
| `unlinkQuillsCustomerProfile` | `DELETE /user/profile` (removes the link, keeps the profile and the Kaneo account; 30 per 10 min per client) | portal | delete | `customer_identity` | `customer.profile_unlinked` | contract, audience, rollback |

Merged: `portal-access.ts#evaluateMyPortalAccessFn`; `portal-access.ts#recordPortalAccessDeniedFn`;
`routes/api/user/profile.ts#GET`, `user.ts#getProfileFn` and `portal.ts#getPrincipalIdForUser`
(the profile returns the caller's own principal ID; another person's ID is never looked up);
`profile.ts#PATCH` and `user.ts#updateProfileNameFn`; `profile.ts#DELETE`.

## Teammate

| operationId | Route | Audience | Action | Tables | Event | Tests |
|---|---|---|---|---|---|---|
| `updateQuillsPortalAccess` | `PUT /settings/portal/access` (path under `/quills/{workspaceId}`) | teammate | manage_settings | `settings`, `segments` | `settings.portal_access_updated` | contract, rollback |

Merged: `portal-access.ts#updatePortalAccessFn`.

## Public profiles (RFC 0001, lane M1)

`public-profile.ts`. A profile is a leak path, so it shows only public fields and only activity
that the caller can see.

```
Tables and owning schema:      quills: principal, settings, boards, board_projects, posts,
                               post_comments, post_statuses (public profile); principal,
                               customer_identity, companies, segments, user_segments,
                               visitor_devices (team context). public: none.
Actor and workspace source:    public profile: the portal resolver (Kaneo session, sign-in
                               optional); workspace from the path. Team context: the teammate
                               helper (authenticated context).
Permissions:                   public profile: none of Kaneo's; the portal flag and the
                               private-portal gate (viewer.ts). Team context: workspace:read +
                               quills:read.
Persisted relationships:       posts.principal_id, post_comments.principal_id, posts.board_id
                               and the board view tiers and project links (viewer.ts).
Transaction:                   one scoped read transaction per request.
External effects:              none.
Completion checks:             authenticated endpoint, tenant/object access, read/search.
```

| operationId | Route | Audience | Action | Tables | Event | Tests |
|---|---|---|---|---|---|---|
| `getQuillsPublicUserProfile` | `GET /portal/profiles/{principalId}` | portal, sign-in optional | read | `principal`, `boards`, `board_projects`, `posts`, `post_comments`, `post_statuses` | - | contract, `public-profile.test.ts` |
| `getQuillsProfileTeamContext` | `GET /profiles/{principalId}/team-context` (path under `/quills/{workspaceId}`) | teammate | read | `principal`, `customer_identity`, `companies`, `segments`, `user_segments`, `visitor_devices` | - | contract, `public-profile.test.ts` |

Merged: `public-profile.ts#getPublicUserProfileFn`; `public-profile.ts#getProfileTeamContextFn`.

Rules of the public profile:

- A profile resolves only for a principal of type `user` with a portal role and a live account (a
  customer identity or a Kaneo account), that is not blocked and not a test customer. Anything
  else is 404 `Profile not found`, the same answer as an unknown ID or an ID of another workspace.
  A deleted Kaneo account keeps its principal as "Deleted user" without an account, so it has no
  profile.
- Activity uses the customer view of `feedback/viewer.ts`: visible boards, live posts, public
  comments, no held content of other people and no test data. A profile with no activity that
  the caller can see is 404, so the route does not confirm that an account exists.
- The response holds the display name, an http(s) avatar URL, `isTeamMember`, the join date, two
  counts and two lists of at most 100 items. It never holds an email, a company, segments or a
  last-seen time; the team context has those.

| Item | Source | Here | Reason |
|---|---|---|---|
| Portal off, private portal denied | `null` (404) | 404 while the portal is off; 403 `Portal access required` on a private portal, as every portal route | one gate for every portal route (`viewer.ts`) |
| Upvotes | list and `voteCount` | not returned | P3b keeps voter names private; a list of upvoted posts names the voter |
| Blocked person | resolves | 404 | a blocked person is out of the portal |
| Deleted account | no profile (the inner join to the account) | 404 | the same rule: the principal has no live account |
| Avatar | uploaded image, account image or principal avatar | the principal's http(s) avatar, as the portal post list | one avatar rule for the portal |
| Team context `lastSeenAt` | latest session or device | latest visitor device | sessions are Kaneo's |
| Team context email of a teammate | account email | the Quills contact email, or null | a teammate's account email is Kaneo's; `getQuillsPrincipal` has the roster |
| Links to profiles | author names link to `/u/{principalId}` | portal lists name no author principal IDs (P3b) | a client reaches a profile by an ID it already has, for example its own from `GET /user/profile`; exposing author IDs needs an owner decision |

## Not built in this slice

| Source | Reason |
|---|---|
| `routes/api/auth/portal-signin.ts#POST` | Portal sign-in is Kaneo's existing `/api/auth/*` (magic link, email OTP, password, social). No Quills route. |
| `routes/api/widget/sdk[.]js.ts#GET` | Built: `widget/host.ts` serves `GET /quills-public/{workspace}/widget/sdk.js` from the built `packages/widget` browser bundle. |
| `routes/api/widget-sso.ts#GET` | Quackback Cloud dogfood: a token signed with an environment secret for the vendor's own dashboard. |
| Portal invites (`portal-invites.ts`, `portal-invite.$inviteId.tsx`) | Built in P3c; see `CUSTOMER-ROUTES.md`. |
| `portal-permissions.ts#getMyPortalPermissionsFn` | A portal caller is always a customer, so the list is always empty. |
| Identify: `previousToken` merge | Built (`CUSTOMER-ROUTES.md`). The attribute and `segments` claims, changelog auto-subscribe and voted post IDs are built in P3c. |
| Anonymous widget sessions (Better Auth anonymous sign-in in the source) | Built in P3b: `createQuillsWidgetAnonymousSession` (`POST /widget/anonymous-session`, `widget/feedback/session.ts`). |
| P3b rows: public boards, posts, roadmaps, changelog, RSS, sitemap, customer posts, comments, votes, reactions, widget feedback, help-center and support widget routes, uploads | Built after P3a: `portal/feedback/ROUTES.md`, `content/public/ROUTES.md`, `support/customer/ROUTES.md` and `files/ROUTES.md`. The portal web pages and their end-to-end checks: `docs/quills-port/portal-e2e-report.md`. |

## Widget-to-portal link (issue #129, option C)

The source's handoff (`routes/auth.widget-handoff.tsx`, `routes/widget.tsx#getPortalSessionToken`)
minted a portal session from the widget session. It is replaced, not ported: Kaneo has one
session model, and the host app's token never signs anyone into a Kaneo account.

1. "Open in portal": `sendQuillsWidgetPortalLink` asks Kaneo's auth (`framework/sign-in-link.ts`)
   to mail its magic link to the widget profile's email, outside the Quills transaction, then records
   a pending request in `kv_store` (key `widget:portal-link:<sha256 of the email>`, the widget
   principal, 15 minutes; a new press replaces it). The link works once, expires after 5 minutes,
   opens `/portal/{workspace}/my-feedback` and marks the account's email verified; a used or expired
   link opens Kaneo's sign-in page with the error. The widget offers the action
   (`canPortalHandoff`) only while the portal is on and Kaneo can mail the link: mail delivery on,
   login form on, no captcha. The response's `delivery` comes from the instance's registration
   settings: `sent` (Kaneo mails any address) or `if_account` (registration is closed, so only an
   address with an account gets the mail). The widget words its message to match. The API never
   checks the address, so the answer reveals no account.
2. The portal asks first. For a signed-in viewer it reads `getQuillsPortalWidgetLink`; while a
   request is pending it shows "Link your activity from the support widget?" with "Link my
   activity" and "This wasn't me" (both refuse a framed click). "This wasn't me" calls
   `declineQuillsPortalWidgetLink`, which ends the request. "Link my activity" calls
   `linkQuillsPortalWidgetProfile`, which merges only the widget profile of a live pending request
   for the account's email, when that email is verified and the
   widget profile is still the address's (`external_id` set, verified, not linked, not blocked, not a
   test customer) in the path's workspace. A host app's claim about an email never joins history
   without that request. A workspace member is never linked: the people directory hides a member's
   customer profile. It takes identify's advisory locks (sub, then email), creates the portal profile
   when missing and locks it, refuses a portal profile that an earlier link gave another sub, runs
   `repoint` (votes, comments, conversations, tickets, survey answers, subscriptions, unsubscribe
   links, mentions and the rest; a duplicate vote, rating or subscription is dropped and its count
   lowered; an opt-out on either profile wins), deletes the widget profile, moves its `external_id`,
   email and attributes to the portal profile, consumes the request and records `user.lead_merged`,
   in one transaction. A second call changes nothing.
3. The widget session of the removed profile stops resolving (401); the widget identifies again
   with the host's token, and the `sub` with that email resolves to the portal profile. Teammates
   cannot change a linked profile's email, verification or external ID (`updateQuillsUser`, 409).

```
Tables and owning schema:      quills: customer_identity, principal, the repoint tables,
                               notification_preferences, user_segments, kv_store (the pending
                               request), audit_log, events, job_queue, rate_bucket.
                               public: user (read through the session), verification (Kaneo's
                               auth writes it for the sign-in link).
Actor and workspace source:    portal: the Kaneo session; widget: the widget session Bearer;
                               workspace from the path through withQuillsAudience.
Persisted relationships:       customer_identity.kaneo_user_id (the portal profile, created by
                               the vouched insert of migration 0011), customer_identity.external_id.
Transaction:                   the merge is one scoped transaction; the sign-in link is Kaneo's
                               call in the route's `call` step, with no transaction open.
External effects:              Kaneo's sign-in mail; no Quills effect before commit.
```

The source's private-portal `widget` grant is not built: a linked account passes the private
portal only through the existing grants (team, domain, segment, invite).

## Changes outside this folder

- `directory/customer.ts` and `directory/segment-rules.ts`: a profile linked to a Kaneo account
  is a customer unless that account has a teammate principal in the workspace. Before D1 every
  linked profile belonged to a member, so the old rule hid every portal customer from teammates
  (people, blocking, segments) and made the portal segment grant impossible.
- `jobs/retention.ts`: deletes expired `kv_store` rows (widget sessions, install codes) and
  expired `rate_bucket` windows, 1,000 per statement and workspace.

## AI help and translations (RFC 0003, lane L4)

Boundary map:

- Tables: `boards`, `board_projects`, `posts`, `post_comments` (read), `content_translations`
  (the cache, RFC 0003 D10), `ai_usage_log` (one row for each provider call), `rate_bucket`.
- Actor: the portal caller from `framework/audience.ts`. A teammate on these routes is a customer.
- Authorization: `viewer.ts` (portal on, private-portal gate, board view tier). A hidden, held,
  deleted, private or foreign post or comment is 404 with the same message as a missing one.
- Transactions: `prepare` reads in one transaction. The provider call runs with no transaction.
  The handler checks the caller and the visibility again, then writes the cache row and the usage
  row in a second transaction. A failure after the provider call writes nothing.
- Events: none. A suggestion and a cached translation change no domain data.
- External effect: the AI provider (`assistant/provider.ts`). It is off without `QUILLS_AI_*` (409).
  The per-account rate limit bounds the calls, and `QUILLS_AI_MONTHLY_TOKEN_LIMIT` (issue #23,
  `assistant/budget.ts`) answers 409 when the call's reserved ceiling would pass the workspace's tokens
  for the UTC month. `prepare` writes only that reservation; the handler swaps it for the real usage.

| operationId | Route | Audience | Action | Tables | Event | Tests |
|---|---|---|---|---|---|---|
| `improveQuillsPortalPostDraft` | `POST /portal/post-draft/improve` (title ≤ 200, details ≤ 4000, optional `boardId`; 10 per 10 min per account and per client) | portal | create | `boards`, `ai_usage_log`, `rate_bucket` | none | contract, `feedback/ai.test.ts` |
| `improveQuillsWidgetPostDraft` | `POST /widget/post-draft/improve` (the same body and limits) | widget | create | `boards`, `ai_usage_log`, `rate_bucket` | none | contract, `feedback/ai.test.ts` |
| `translateQuillsPortalContent` | `POST /portal/translations` (`postId` or `commentId`, `locale` as a BCP 47 tag; 60 per 10 min per client, and per account with a session) | portal, sign-in optional | read | `posts`, `post_comments`, `content_translations`, `ai_usage_log`, `rate_bucket` | none | contract, `translations.test.ts` |

Rules:

1. The composer routes (issue #106) return a title and a board only: the customer's text is never
   rewritten, so a saved post holds the customer's words and the title they confirmed. The model
   gets the text as data and must not add facts. The title is cut to 200 characters. The suggested
   board is a board that takes the caller's posts; another value becomes the given board or null.
   Creating the post checks the board again.
2. The translation key is the post or comment, the language and the SHA-256 of the source title
   and text. The language is the primary subtag of the locale (`de-AT` is `de`); Chinese keeps its
   script as `zh-cn` or `zh-tw`. An edit changes the hash, so an old translation is never served.
   A cached translation needs no AI, so it is served when AI is off. An empty answer for a text is
   a 502 and is not cached. Two requests that miss at the same time store one row: the insert does
   nothing on a conflict with the unique key.
   Protected terms (issue #76): the help center's `autoTranslate.protectedTerms` list is the
   workspace's one list. Each term that occurs in the text is swapped for a placeholder before the
   provider call (`assistant/protected-terms.ts`), so the provider never sees it; a translation
   that lost, repeated or invented a placeholder is a 502 and is not cached. The terms in the text
   are part of the hash, so changing the list never serves a translation made under the old one.
   A miss also reserves against the monthly AI limit (409); a cached translation is served past the limit.
3. `rateLimit.per: "caller"` (`framework/define-route.ts`) counts these routes per client IP, like
   every rate-limited route, and also per signed-in Kaneo account after the session read. One
   account cannot spend the limit from many addresses, and many accounts cannot spend it from one.
