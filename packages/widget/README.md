# @quills/widget

The official SDK for embedding the Quills feedback widget of [Kaneo](https://github.com/PlaybookMediaLLC/kaneo) in your app. Ships with TypeScript types and a React adapter. Runtime boundary validation uses Zod (the browser bundle uses Zod Mini); this is not a zero-runtime-dependency package. React remains an optional peer dependency and is loaded only by the `/react` and `/ui` entries.

> Renamed from `@quackback/widget`. The old names still work and are deprecated: the `Quackback` export, `useQuackbackInit`, `useQuackback`, `useQuackbackEvent`, and `window.Quackback` in script-tag snippets. The SDK is based on the MIT-licensed Quackback widget; see `LICENSE`.

## Install

```bash
npm install @quills/widget
# or:  pnpm add @quills/widget
# or:  bun add @quills/widget
```

## Vanilla JS

```js
import { Quills } from '@quills/widget'

Quills.init({ instanceUrl: 'https://kaneo.yourcompany.com', workspace: 'acme' })

// When you know who the user is: a token your server signed (see "Signed identity" below).
Quills.identify({ ssoToken: await fetchQuillsToken() })

// Deep-link to a specific view:
Quills.open({ view: 'new-post', title: 'Bug:', board: 'bugs' })
```

## React

```tsx
import { useQuillsInit, useQuills, useQuillsEvent } from '@quills/widget/react'

function App() {
  const { user } = useAuth()

  useQuillsInit({
    instanceUrl: 'https://kaneo.yourcompany.com',
    workspace: 'acme',
    // quillsToken: an HS256 JWT that your server signed for this user (see "Signed identity").
    identity: user ? { ssoToken: user.quillsToken } : undefined,
  })

  useQuillsEvent('post:created', (post) => {
    analytics.track('feedback_submitted', { postId: post.id })
  })

  return <Layout />
}

function FeedbackButton() {
  const qb = useQuills()
  return <button onClick={() => qb.open({ view: 'new-post' })}>Feedback</button>
}
```

No provider needed — Quills is a singleton and the hooks wrap its lifecycle. The root entry and React adapter share one SDK within ESM and within CommonJS. Use one `useQuillsInit` owner per page.

Changing `identity` to `undefined` switches to anonymous mode. Delayed startup uses the latest options and does not send identity until initialization. Changing `instanceUrl`, `workspace`, `shouldInitialize`, or `initializeDelay` restarts that lifecycle; other options apply at the next initialization. Unmounting cancels pending startup and destroys the owned instance, including during React Strict Mode cleanup.

## Other frameworks

Vue, Svelte, Angular, Solid: import `Quills` from the main entry and call it directly. Framework adapters ship on request.

## Prefer a script tag?

Drop this in your `<head>` and skip the install step entirely:

```html
<script src="https://kaneo.yourcompany.com/api/quills-public/acme/widget/sdk.js" defer></script>
```

The script reads the instance URL and the workspace (ID or slug) from its own URL, so `Quills("init")` needs neither. Snippets pasted before the rename call `window.Quackback`; they keep working. The unversioned URL caches for 5 minutes. A URL with `?v=` and the bundle's current content hash caches for one year.

## API

### Methods

| Method                                        | Description                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| `Quills.init(options)`                     | Create launcher + iframe. `options.instanceUrl` and `options.workspace` required. |
| `Quills.identify(identity?)`               | Attribute activity to a user. Omit for anonymous. Returns a promise of `{ success, user, error? }`. |
| `Quills.logout()`                          | Clear identity and close the panel; keep the launcher available.                        |
| `Quills.open(options?)`                    | Open the panel; optional deep-link payload (see below).                        |
| `Quills.close()`                           | Close the panel.                                                               |
| `Quills.toggle()`                          | Open the panel when closed, close it when open.                                |
| `Quills.setTheme(theme)`                   | `'auto'`, `'light'` or `'dark'`, over the workspace setting.                   |
| `Quills.setLocale(locale)`                 | Change the language without a reload.                                          |
| `Quills.showLauncher()` / `hideLauncher()` | Toggle the floating button.                                                    |
| `Quills.metadata(patch)`                   | Attach session context to submitted feedback and support messages. Pass `null` to remove a key. The SDK adds `pageUrl` and the widget adds `browser`. |
| `Quills.tracking(enabled)`                 | Allow or stop host-page visitor analytics. `false` also removes the device id. |
| `Quills.on(event, handler)`                | Subscribe to a widget event. Returns an unsubscribe function.                  |
| `Quills.off(event, handler?)`              | Remove a specific handler, or all listeners for the event.                     |
| `Quills.destroy()`                         | Cancel owned work and remove widget DOM; preserve subscriptions and consent choice. The widget keeps no conversation data in the browser, so nothing else needs clearing on a shared device. |
| `Quills.isOpen()`                          | Whether the panel is currently visible.                                        |
| `Quills.getUser()`                         | The current identified user, or `null`.                                        |
| `Quills.isIdentified()`                    | `true` when a user is identified (non-anonymous).                              |
| `Quills.getState()`                        | `{ initialized, open, placement, theme, locale, unreadCount, user, identified }`. |

With the script tag, call any method by name: `Quills('open', { view: 'changelog' })`. The state reads return their value too, `Quills('isOpen')`, `Quills('getUser')` and `Quills('isIdentified')`, and `window.Quills.isOpen()` works as well. A call made before `sdk.js` loads is queued and returns nothing.

### `init` options

```ts
Quills.init({
  instanceUrl: 'https://kaneo.yourcompany.com', // required
  workspace: 'acme', // required: the Kaneo workspace ID or slug
  placement: 'right' | 'left', // default 'right'
  defaultBoard: 'bugs', // filter widget to one board
  launcher: true, // false = hide default button; { selector: '#help' } = open from your own element
  container: undefined, // '#feedback' = render inline in that element, always open, no launcher (give it a height)
  theme: 'auto', // 'auto' | 'light' | 'dark'; default: the workspace setting
  announcements: 'whisper', // a new unread update: 'whisper' (its title beside the launcher), 'full' (opens it once per visit) or 'none'
  offset: { bottom: 20, side: 20 }, // default launcher distance from the edges, in pixels
  pageUrl: 'path', // page address sent with feedback and messages: 'path' (origin and path), 'origin' or 'none'; never the query or fragment
  locale:
    'en' |
    'fr' |
    'de' |
    'es' |
    'ar' |
    'ru' |
    'pt-BR' |
    'zh-CN' |
    'zh-TW' |
    'nl' |
    'pl' |
    'th' |
    'uk', // override auto-detect
  identity: { ssoToken }, // bundle identify into init; Kaneo accepts signed tokens only
  tracking: true, // false = no pageview beacons or new device id until tracking(true)
})
```

### Languages

The panel's own copy, the launcher's accessible names and the update bubble come in English, French, German, Spanish, Arabic, Russian, Brazilian Portuguese, Simplified and Traditional Chinese, Dutch, Polish, Thai and Ukrainian. `init({ locale })` or `setLocale()` picks one; without it the widget follows the visitor's browser language. Another tag falls back by its language (`fr-CA` → French, `pt` → Brazilian Portuguese) and then to English. Arabic lays the panel out right to left. Dates and short ages use the same language. Workspace content (posts, articles, updates, greetings) shows as written. The catalogs are in `src/ui/i18n/messages`, keyed by the English text; `__tests__/i18n.test.ts` fails when a language misses a message or changes its placeholders.

Theme colors and tab visibility come from Kaneo feedback settings (Settings → Conversations → Widget).

### Visitor analytics and consent

When the instance has visitor analytics on, the widget reports host-page views and may keep a device id in the host page's `localStorage`. If your site asks visitors for analytics consent, start with `tracking: false` and switch it on once they accept:

```ts
Quills.init({ instanceUrl, tracking: false })
onAnalyticsConsent((granted) => Quills.tracking(granted))
```

DNT (`doNotTrack === "1"`) and Global Privacy Control block device-ID access, creation, storage, and sending as well as pageview tracking. Browser signals are checked again when sending analytics. A host withdrawal survives destroy/re-init unless the host explicitly opts in again.

The launcher and panel work either way; only pageview tracking waits for consent. Withdrawing with `tracking(false)` stops future pageviews and removes the stored device id; visits the instance already recorded stay in its analytics.

### `identify` shapes

```ts
Quills.identify() // anonymous
Quills.identify({ ssoToken: 'eyJ...' }) // a token your server signed
```

Kaneo identifies visitors with signed tokens only. An unverified identity such as `{ id, email, name }` is refused: the `identify` event reports `success: false` with an error, and the visitor stays anonymous.

When a visitor who used the widget anonymously identifies, their anonymous conversations, votes and other activity move to that person. A refused token keeps the anonymous session.

Before iframe readiness, only the latest identity is queued. Once ready, identify requests are serialized behind `quackback:identify-result`; while a newer identity waits, an old result cannot restore the previous user or emit an obsolete identify event. `getUser()` stays `null` until the latest request is confirmed. If the iframe never acknowledges a request, identity remains unconfirmed; the SDK does not guess which late response belongs to a later request.

#### Signed identity

Sign the token on your server with the workspace widget secret from Settings → Login in Kaneo. Never send the secret to the browser. The token is an HS256 JWT with these claims:

| Claim | |
| --- | --- |
| `sub` | Required. The user's stable ID in your app. |
| `email` | Required. |
| `exp` | Required. Unix seconds, at most one hour after `iat` (or after now without `iat`). |
| `iat` | Optional. Unix seconds; a time more than 60 seconds ahead is refused. |
| `name` (or `firstName` and `lastName`), `avatarURL` (or `avatar`) | Optional profile fields. |
| `segments` | Optional. Up to 50 manual segment slugs. |
| `companies` | Optional. `[{ id, name, domain }]`: the first becomes the person's company, created or updated by its `id`. |
| `traits`, other keys | Optional custom attributes, top level or in a `traits` object, that match a user attribute definition in Kaneo. A teammate creates the definitions; a token never does. |

The `identify` result and event carry `warnings` for claims that were received but not applied, such as an attribute without a definition, an unknown segment or a second company.

```js
import { createHmac } from 'node:crypto'

const part = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')

export function quillsToken(user, secret) {
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: user.id, email: user.email, name: user.name, iat: now, exp: now + 600 })}`
  return `${unsigned}.${createHmac('sha256', secret).update(unsigned).digest('base64url')}`
}
```

`examples/widget-host` in the Kaneo repository is a runnable host app that signs the token in a server function.

### `open` deep-links

```ts
Quills.open() // home
Quills.open({ view: 'new-post', title: 'Bug:', body: '...', board: 'bugs' }) // pre-filled form
Quills.open({ view: 'changelog' }) // changelog feed
Quills.open({ view: 'help', query: 'pricing' }) // help search
Quills.open({ view: 'help', category: 'Billing' }) // help category, by name
Quills.open({ view: 'messages' }) // messenger conversations
Quills.open({ view: 'messages', body: 'My export failed' }) // new message, pre-filled
Quills.open({ view: 'notifications' }) // the identified visitor's activity
Quills.open({ view: 'tickets' }) // the visitor's tickets, or messages when unavailable
Quills.open({ postId: 'post_01h...' }) // specific post
Quills.open({ articleId: 'article_01h...' }) // help article TypeID or slug
```

`postId` and `articleId` win over `view` if both are set. `board` on `open` only applies to `view: 'new-post'`. Home / Popular Ideas filtering uses `init({ defaultBoard })` or the iframe `?board=` param.

Every `open` field is live. A disabled surface or an unseen board fails closed — the panel still opens, but the widget does not invent access. The widget shows only the tabs that the workspace turned on, and a request for another tab opens the first tab that is on. A workspace has the widget on until a teammate turns it off. While the workspace has the widget off, or the workspace does not exist, the SDK shows no launcher, and `open()` shows that the widget is unavailable.

### Events

```ts
const unsubscribe = Quills.on('vote', (payload) => {
  console.log('Voted on', payload.postId)
})
unsubscribe()
```

| Event             | Payload                                    |
| ----------------- | ------------------------------------------ |
| `ready`           | `{}`                                       |
| `open`            | `{ view?, postId?, articleId?, entryId? }` |
| `close`           | `{}`                                       |
| `post:created`    | `{ id, title, board, statusId }`           |
| `vote`            | `{ postId, voted, voteCount? }` — no count when the board hides counts |
| `comment:created` | `{ postId, commentId, parentId }`          |
| `identify`        | `{ success, user, anonymous, error?, warnings? }` |
| `email-submitted` | `{ email }`: an anonymous visitor confirmed a contact address for replies |
| `unread`          | `{ count }` — a finite nonnegative integer  |
| `statechange`     | the `getState()` snapshot, after any change |
| `presence`        | `{ online, withinOfficeHours }`: the team's messenger availability, read when the panel opens |
| `announcement`    | `{ entryId, title }`: a new update the visitor has not read (for a custom launcher) |
| `error`           | `{ code, message }`: `NOT_READY`, `IDENTIFY_FAILED`, `INVALID_OPTIONS`, `LAUNCHER_NOT_FOUND`, `CONTAINER_NOT_FOUND`, `WIDGET_DISABLED` |

## Lifecycle and iframe boundaries

Invalid init options throw before replacing a working instance. A re-init or destroy aborts the config request and cancels or invalidates its reveal timers and idle preload callbacks. Failed or malformed server configuration falls back to empty configuration, leaving analytics off. Baked configuration tied to another instance is not reused.

Messages must come from both the configured origin and the current iframe window. Unknown message types, unknown event names, and malformed payloads are ignored. External navigation remains limited to HTTP(S), with `noopener,noreferrer`. The iframe protocol names and deep-link fields are unchanged.

Subscriptions belong to the caller and survive `destroy()` and re-init. Use the returned unsubscribe function or `off()` to remove them; `useQuillsEvent` unsubscribes when its component unmounts.

The closed panel is inert. Opening moves focus into the iframe; closing restores the opener when it is still present. The launcher greeting is keyboard accessible, and host-side motion honors `prefers-reduced-motion`. Keyboard behavior inside the cross-origin iframe, including its close controls, is owned by the iframe application.

The default launcher is a white 40 px circle, 20 px from the edge; server theme colors still override it. The open panel hides the launcher and requests the existing `showClose=1` iframe option. A host-side close button remains available until the iframe sends `quackback:ready`. On desktop, the panel is 384 × 760 px, limited by the viewport, with 16 px edge spacing. At 760 px viewport width or below it fills the screen. Expansion, placement, greeting, label, and unread-count behavior remain supported. A new changelog entry is announced once per visitor: the launcher shows its title in the greeting bubble (a click opens the entry), or, when the workspace turned on automatic open, the panel opens to the entry on the next visit. The unread badge counts the entry until the visitor opens it. An identified visitor's roadmap marks each shipped request that they voted for ("For you").

## Optional React widget UI

The `@quills/widget/ui` entry provides the widget's Home, Messages, Help, Feedback, and Updates screens. Its CSS values follow the [UserJot widget reference](https://userjot.com/in-app-feedback-widget), with Quills branding and official Phosphor icons. The header defaults to Quills and can use a host’s `brandName`; the footer always reads “Powered by Quills.” The SDK protocol keeps its `quackback:*` message names, so cached copies of older SDKs keep working. Import the stylesheet explicitly:

```tsx
import { WidgetView } from '@quills/widget/ui'
import '@quills/widget/ui/styles.css'

<WidgetView
  key={`${instanceId}:${visitorSessionId}`}
  onClose={closePanel}
  articles={articles}
  feedback={feedback}
  updates={updates}
  conversations={conversations}
  onSendMessage={sendMessage}
  onSubmitFeedback={submitFeedback}
  onReplyMessage={replyToConversation}
  onVoteFeedback={setVote}
  onFollowFeedback={setFollow}
/>
```

Give its parent a width and height; the view fills that space. `theme` accepts `light`, `dark`, or `auto` (the default), and `initialTab` selects the initial screen. Changing `initialTab` after mount does not reset navigation. Key the view by instance and visitor session, and replace private data immediately when either changes. This remount discards the old visitor's private drafts, pending UI completions, and navigation. The host adapter must also abort or ignore responses from the old session.

Drafts, search/category/status filters, sorting, and list scroll positions survive navigation within a mounted session. Keep the view mounted inside an inert hidden panel to preserve them on close/reopen. They are held only in memory: a reload or session remount clears them. No private draft is stored in localStorage.

Help search requires all query terms and ranks title matches above category and body matches. Results show highlighted excerpts. The message composer suggests up to three related articles from meaningful words in the draft; visitors can read one and go Back without losing their writing. Optional `HelpArticle.blocks` supports headings, paragraphs, lists, and code as escaped text; a nonempty block array replaces `body` for rendering and search. An empty block array falls back to `body`. Same-category articles appear below an article. Raw HTML is never interpreted. Search has a clear button that keeps keyboard focus in the field. Long preview titles are shortened visually; opening an item shows its full text. The UI adapts to touch input, short viewports, device safe areas, and reduced motion.

Data and asynchronous actions belong to the embedding application. Resolve a callback only after a successful save, and update the supplied data to show the result. Callback return values are ignored, so an action can return its saved record. A rejected callback preserves the draft and offers retry. Without a callback, its action is disabled. Existing one-argument send/feedback callback implementations still work; they now receive a second `SubmissionOptions` argument. The UI always supplies it.

| Contract | Behavior |
| --- | --- |
| `onSendMessage(body, { idempotencyKey })`, `onSubmitFeedback(body, { idempotencyKey })`, `onReplyMessage(conversationId, body, { idempotencyKey })` | Trimmed body; one pending submission per draft. A retry of unchanged content reuses its key, including after a lost response. Editing the content creates a new key. The server must persist idempotency receipts; the UI alone cannot guarantee exactly-once writes. |
| `onDraftFeedback(body)` | Optional; omit it when the instance has no AI provider. Resolves with a `FeedbackDraft`: a suggested title, an optional board and similar requests. The feedback composer shows it with a vote button for each similar request. Nothing is saved: "Post with this title" calls `onSubmitFeedback(body, { idempotencyKey, title, boardId })` with the visitor's unchanged text. A rejected draft shows a note and keeps the plain Post button. |
| `loadState`, `connection`, `onRetryLoad()` | Loading/error placeholders avoid false empty states. Cached content remains readable. Offline/reconnecting disables mutations but keeps drafts editable. Reconnection never automatically submits a draft. The host owns connectivity and recovery. |
| `onFindSimilar(text, signal)` | Optional. Resolves with `{ id, title, votes?, voted? }` requests like the draft from the whole board; without it the composer matches the loaded `feedback`. |
| `onVoteFeedback(postId, voted)`, `onFollowFeedback(postId, following)` | Desired booleans, including reversal. The host returns updated `votes`, `voted`, and `following` through props. Status filters accept `open`, `planned`, `in_progress`, and `shipped`; omitted status means open. |
| `onReadConversation(conversationId, throughMessageId)`, `onReadUpdate(entryId)` | Opening an unread item requests acknowledgment; failed acknowledgments retain the unread state and can be retried. The host must return authoritative unread counts and advance conversation watermarks monotonically. New messages arriving while a thread is open remain unread until acknowledged. |
| `Conversation.messages` | Optional `sentAt` ISO timestamps and `fromVisitor` enable date grouping and visitor bubbles. Sent labels describe persisted visitor messages, not delivery or read receipts. Invalid timestamps are omitted. |
| `teamAvailability` | Optional host-verified text. Omit it when unknown; the view does not invent live presence or a response-time promise. |

Home resumes an unread or recent conversation and highlights a supplied unread update. Navigation and the Storybook launcher show unread indicators. Feedback can be sorted by supplied order, votes, or title, or viewed as a grouped Roadmap. Optional update reactions use `UpdateEntry.reactions` and `onReactToUpdate(entryId, emoji)`; `onShareUpdate(entry)` owns sharing. Those controls disable while pending/offline and show errors on rejection. Update the supplied counts after success. This view does not authenticate visitors, upload to a server, or fetch content. The view's copy follows the `locale` prop (see Languages below); suggestion stop words are English. `dir` lays the panel out right to left; without it the direction follows `locale`. The host page sets it from the SDK `locale` (else the browser language), so Arabic, Hebrew, Persian and Urdu read right to left. The stylesheet uses logical properties only, and the back, chevron, arrow and external icons mirror; a left-to-right language renders as before. The SDK `locale` also picks a teammate's changelog version in that language.

Full help and update readers call `onExpandedChange(true)`; Back and unmount request `false`. The host must apply the size or forward the existing `quackback:expand` protocol. The SDK desktop expansion is 480 × 860 px, viewport constrained. Readers and requests hide bottom navigation; new conversations retain the Quills footer. An article's optional HTTP(S) `url` opens with `noopener noreferrer`.

`FeedbackPost.comments` supplies the discussion. `onCommentFeedback(postId, body, {idempotencyKey, parentId?})` posts a root comment or reply; `onVoteComment(postId, commentId, voted)` sets the desired vote state. Failed comment/reply drafts survive navigation; the adapter must update comments and counts through props. `voters`, author metadata, and verified flags are optional authorized server data. `UpdateEntry.blocks`, `authorRole`, `relatedPostIds`, and `requesterCount` support the full update reader.

Set `attachmentsEnabled` only when send/feedback/reply callbacks process `SubmissionOptions.attachments: readonly File[]`. `attachmentsEnabled="feedback"` turns attachments and the screenshot action on for the feedback composer only. The picker accepts up to four PNG/JPEG/WebP images, each at most 5 MiB, with MIME/signature checks. Attachment-only submissions have an empty body. Files remain in memory through navigation/failure and clear after success or session remount; editing/removing a file rotates the idempotency key. Preview object URLs are revoked when their view unmounts. Published `Attachment` records use `{id, name, url}`; host-supplied URLs must be authorized for the current visitor. Client checks do not replace server image validation.

Feedback's camera uses user-invoked `getDisplayMedia`, without audio; streams stop after capture, cancellation, or failure. The browser's chooser and secure context/Permissions Policy requirements still apply. Unsupported browsers retain image selection. `onCaptureScreenshot(signal)` can supply an approved host capture implementation. The review dialog draws boxes, arrows, pen lines and text in a chosen color, blurs (pixelates) or redacts areas, supports keyboard position controls and Undo, and exports a flattened PNG (up to 2048 px on its longest side). Cancel preserves the original. No screenshot is silently captured or sent. Real uploads, authorization, image sanitization, and retention are specified in [RFC 0004](rfcs/0004-images-and-capture.md).

The Kaneo API serves the iframe page at `/api/quills-public/{workspace}/widget`. The page bundle (`dist/host.js`, `dist/host.css`) mounts this view with the adapter in `src/adapter/`, which connects it to the workspace's Quills routes and to the existing iframe protocol. See [Kaneo host page](#kaneo-host-page). The SDK's commands, events, deep links, and protocol remain unchanged. React stays optional for the root, version, and browser entries; the UI and its locally served Inter font are excluded from the browser SDK bundle. Inter's [SIL Open Font License](src/ui/fonts/OFL.txt) is included with the font. The selected official SVG paths from `@phosphor-icons/core` 2.1.1 are vendored with the [Phosphor MIT license](src/icons/LICENSE), shared by the React UI and vanilla launcher. No icon runtime dependency is required.

### Activity, media, and contextual help

The optional `/ui` entry now supports image paste and drag/drop within enabled composers, using the same four-image / 5 MiB PNG/JPEG/WebP validation and retry payload as the picker. Text paste remains native. Attachments open inside an accessible image viewer with previous/next, zoom, Escape, and focus return. No document-wide clipboard/drop listeners or runtime dependencies were added.

Conversations keep an opening unread divider, start at the first unread team message (otherwise the bottom), and follow arrivals only within 80 px of the bottom. Jump to latest resumes following. Enter adds a newline; Command/Control+Enter sends outside IME composition. Opening a thread retains the existing acknowledgment callback through the newest displayed message; the divider does not imply a new server read receipt.

Supply `activities: RequestActivity[]` and `onReadActivity(id)` to enable a private activity feed from the header. Items are newest first and open their `postId`; Mark as read is explicit. `HelpArticle.helpful` and `onArticleFeedback(articleId, boolean)` enable Yes/No feedback. These callbacks resolve only after authoritative props update; rejection leaves state unchanged with a retryable error.

Still need help opens an article-specific conversation draft and passes optional `SubmissionOptions.articleId` to `onSendMessage`. Ordinary message drafts stay separate. The host adapter must verify and persist that context; existing callbacks remain source-compatible but must adopt this option to retain article context on the server. Key the view by visitor as before.

Storybook's Activity, Article Feedback, Conversation Reading, and Image Viewer stories exercise these additions. Follow a request before using Simulate request progress/reply; switch Demo visitor to check isolation. Everything stays in memory. [RFC 0005](rfcs/0005-activity-and-article-feedback.md) specifies the real activity/helpfulness/context backend; RFCs 0002 and 0004 cover conversation and media requirements. No real API, inbox delivery, durable upload, or notification service is implemented here.

## Kaneo host page

The API serves four static files from `packages/widget/dist` (`apps/api/src/quills/widget/host.ts`):

| Path under `/api/quills-public/{workspace}/widget` | File |
| --- | --- |
| (the path itself) | The iframe page, with a strict Content-Security-Policy |
| `/host.js`, `/host.css` | The React view and the adapter, with Inter inlined |
| `/sdk.js` | The browser SDK (`dist/browser.js`) |

Build the widget (`pnpm --dir packages/widget build`) before you start the API. Both Docker images build it. If the files are missing, these paths answer 503.

The page is same-origin with the widget routes, so it needs no CORS. Its policy allows `frame-ancestors http: https:` because the widget configuration has no allowed-origin list. A page that frames the widget gets only an anonymous session: identify needs an `ssoToken` that the host app's backend signs with the widget secret.

Session rules:

1. An identified visitor gets a session from the signed token when the SDK sends `identify`.
2. An anonymous visitor gets a session only when the panel first opens. Each anonymous session creates a person, and the API allows 10 per hour per client.
3. The session token stays in memory. It is never stored or put in a URL.
4. A 401 removes private data and starts a new session for the same identity. If the host's token no longer verifies, the widget continues anonymously and sends `quackback:auth-change` with `user: null`.
5. An unverified identity (`{ id, email }`) is refused: Kaneo identifies visitors only with a signed token.

When a teammate turns on the away reply (Settings → Conversations → General), a message sent while no teammate is online, or outside office hours, gets that answer as a system message; the adapter reads it right after the send.

When a teammate turns on the customer agent (Settings → Conversations → AI → Answer customers) on an instance with an AI provider, the assistant answers new messenger conversations from the help center and documents. Its messages are labelled Assistant. It hands the conversation to the team when it cannot help, and it can offer one feedback request per conversation as a card: **Submit request** posts it as the visitor (`post:created` fires) and marks the card submitted. A conversation the agent answered last that stays quiet for a day closes on its own.

With messages on, Home's message card shows up to four teammate avatars (`GET /widget/team-avatars`, empty while Home's team avatars are off), a green dot and "We’re online now." while a teammate has the inbox open (`GET /widget/presence`), and the reply time a teammate chose in Settings → Widget ("Usually replies in a few hours."). Home's greeting and subtitle come from the same settings. The host hears the availability as a `presence` event.

An identified visitor can turn email about new updates on or off from the Updates tab ("Get updates by email", `GET`/`PUT`/`DELETE /widget/changelog/subscription`). Identify still subscribes a new person; turning it off sticks. An anonymous visitor is not offered it, because there is no address to send to.

Feedback is one text box. With AI configured on the Kaneo server (`QUILLS_AI_*`), a post sent without a title gets a short title from the model right after it is posted, and may move to a better board with the same access rules; without AI, the first line is the title.

While a visitor types new feedback, "Similar requests" lists up to three requests from the whole board (`GET /widget/posts/similar`, a pause in typing after three characters), then matches from the loaded posts. Each one takes a vote, so the visitor can back an existing request instead of posting a duplicate.

The Feedback tab's Roadmap sort lists In progress, Planned and Shipped requests, each stage read on its own (up to 20 by votes) so it is not limited to the newest posts. Open requests take a vote from the list, and a shipped request the visitor voted for is marked "For you".

An anonymous visitor with a conversation sees "Get replies by email" in Messages: a code goes to the address, and the address is set once the code is right (`/widget/contact-email`, `/widget/contact-email/confirm`). It is optional; an identified visitor's address comes from the host's token.

An identified visitor gets an Activity page (the header button): replies and status changes on requests they follow, from `GET /widget/activity`, with Mark as read (`PUT /widget/activity/{id}/read`). The launcher badge counts unread activity with unread replies and updates. The feed lists only requests the visitor can still see.

### Open in portal

When identify answers `canPortalHandoff: true`, the home tab offers **Open in portal** (`WidgetView` `onOpenPortal`). The API asks Kaneo to mail its sign-in link to the identified visitor's email and records the request for 15 minutes. It answers `delivery`: `sent`, or `if_account` when the instance's registration is closed and only an address with an account gets the mail; the widget's message says which. When the person signs in to the portal with that verified address, the portal asks them to confirm, and only then does the widget history join their portal profile. From then on, identify with the same `sub` and email returns the portal profile: its name, email and avatar come from the Kaneo account (also in `quackback:auth-change`), and later name or avatar claims in the token are ignored. A token with that `sub` but another email is refused. The session of the old profile ends, so the widget identifies again after its next 401.

When a teammate also turns on widget sign-in (Settings → Privacy → Customer sign-in), identify answers `portalSignIn: true` and **Open in portal** opens the portal in a new tab, signed in with a portal-only Kaneo account that this sign-in created for them in the workspace, so their votes and conversations are there. An email that already has a Kaneo account gets the Kaneo sign-in page instead. The tab opens at the account sign-in start (`/api/auth/quills/portal-sign-in`), which marks that browser with a cookie and sends a state back to the widget frame; the frame asks for the one-time link with that state and hands the link to the tab. The link works only in that browser, so it cannot be forwarded to sign someone else in.

The adapter polls the unread count at the interval from `/widget/capabilities`. When the count changes, it reads only new messages (`?after=`). Before the panel first opens, it polls only for an identified visitor, for the launcher badge.

### Screenshots of the host page

A visitor that the host app identified can attach images to messages and replies too (up to 10, the same PNG/JPEG/WebP checks); the camera stays in the feedback composer. Teammates open them from the conversation, and only that visitor can read them back.

A visitor that the host app identified can attach images and a screenshot to a new feedback post (RFC 0003 feature 6):

1. The visitor presses **Capture screenshot** in the open panel. The iframe asks the SDK with `quackback:capture`, and the SDK answers with `quackback:capture-result` (a PNG, or `null`). The SDK never captures for a closed panel or without that request.
2. The SDK renders the visible part of the host page with [html-to-image](https://github.com/bubkoo/html-to-image) (MIT). It never renders the launcher, the panel or the backdrop.
3. These fields are left out of the image and covered with an opaque box: `input[type=password]`, email and phone fields (`type="email"`, `type="tel"`, or an `autocomplete` with `email` or `tel`), any element with `data-private`, card fields (`autocomplete="cc-…"`, and names or IDs with `card`, `cvc` or `cvv`) and frames. Add `data-private` to any other element that must not appear, for example a field that shows a password as text.
4. The visitor reviews the image, can draw boxes, arrows, pen lines and text in a chosen color, and blur or redact areas, and then attaches it. Nothing is sent before the visitor posts.
5. The adapter uploads each image through `POST /widget/uploads`, the presigned PUT and `POST /widget/files`, and sends the file IDs with the post. A retry sends the same files.
6. Each new post sends `metadata`: the keys from `Quills.metadata`, `pageUrl` (by default the page origin and path, without the query and the fragment; `init({ pageUrl: 'origin' | 'none' })` shares less) and `browser` (for example `Chrome 131 on macOS`). Teammates read it on the post; customers do not. Each support message sends the same `metadata`. Teammates see the page and the browser on the post and on the message; the visitor never reads them back.

Limits: the copy shows a sticky element or an inner scroll area at its unscrolled position, and an image from another origin without CORS shows as blank. A host page with a Content-Security-Policy must allow `img-src data:` for the capture. An anonymous visitor gets no picker and no camera, because the upload routes need an identified visitor. The browser SDK grows by about 17 KB (6 KB gzip) for the capture; the ESM and CommonJS entries load html-to-image only when a capture starts.

These view features have no Kaneo route yet. The adapter leaves the related prop out, so the view hides or disables the control:

| Feature | In the view |
| --- | --- |
| Article context on a new conversation | The message sends without the article reference |
| Host-page pageview analytics | Off: the SDK ignores `visitorAnalytics` from Kaneo |

## Development checks

### Storybook

From the repository root:

```sh
pnpm --dir packages/widget storybook
```

Open http://localhost:6006. **Widget / Design** previews all five screens, dark mode,
mobile, empty data, long content, no search results, and successful/failed/pending submissions. **Expanded Update**, **Expanded Help**, **Request Discussion**, **Roadmap**, **New Conversation**, and **Feedback Composer** cover the supplied detail references. **Connected**, **Conversation**, **Draft Continuity**, **Feedback Actions**, **Loading**, **Load Failure**, and **Offline** exercise the new flows. The pending story intentionally keeps its callback unresolved so the sending state can be inspected. The local mock in `stories/mock-backend.ts` simulates latency, visitor isolation, persisted-in-memory idempotency receipts, unread watermarks, and mutation failures. The preview controls can switch visitors, disconnect/reconnect, inject a team reply, fail before saving, or save then lose the response. Retrying that last case demonstrates deduplication. Nothing is sent to a server; all mock data resets on story remount.

Navigation, search, composers, close, and reopen work without a backend. **Widget / Launcher** exposes placement, colors, label,
greeting, unread count, and open state through Controls. **Widget / SDK** runs the
actual React hooks and singleton with a local iframe fixture. It includes left
placement, no launcher, delayed initialization, disabled initialization, and mobile
stories. The playground supports anonymous/Ada/Grace identity changes, opening a
demo article, and iframe-driven close, expansion, and unread updates.

The SDK story's iframe is a protocol fixture, separate from the visual Design stories. Analytics is off,
all demo identities use `example.com`, and no running backend is needed. Each story
cleans up its launcher or SDK on unmount. Changing SDK Controls remounts the
playground; the identity radio buttons exercise live identity changes.

```sh
pnpm --dir packages/widget storybook:build
```

This writes `packages/widget/storybook-static/`, which is ignored by Git and
excluded from the published package. Serve that folder with a static server that
supports directory index files. The Storybook development configuration supplies
the equivalent `/fixtures/api/quills-public/demo/widget` redirect. The default launcher, SDK, and submission stories
include interaction assertions visible in Storybook's Interactions panel.

Storybook and its React/Vite framework are development dependencies. The package
typecheck includes Storybook configuration and stories. Storybook and demo data
are excluded from the published package and production builds.

The [backend RFC index](rfcs/README.md) specifies the remaining iframe application, authenticated API, durable writes, realtime delivery, and content integrations. These are proposed work, not implemented server endpoints.

### Package checks

From the repository root:

```sh
pnpm --dir packages/widget test
pnpm --dir packages/widget typecheck
pnpm --dir packages/widget build
pnpm exec vp check packages/widget
```

Tests use the repository's Vite+ runner. The package tests include a fresh build and isolated ESM/CommonJS import, declaration-consumer, and browser-IIFE probes. DOM tests disable remote iframe loading; cross-origin browser checks require a real browser and a cooperating iframe server.

## Docs

Source: https://github.com/PlaybookMediaLLC/kaneo/tree/main/packages/widget

## License

[MIT](LICENSE). This package and the `sdk.js` script built from it are MIT, so you can ship them in closed-source apps.
