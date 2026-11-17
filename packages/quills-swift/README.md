# Quills for iOS

A Swift package for the Quills widget in native apps (gap G-30, issue #52):

- **QuillsKit** (iOS 15, macOS 12, Linux): a client for the widget API. Requests, votes, comments, the roadmap, the changelog and unread counts, with identity and session refresh.
- **QuillsWidget** (iOS 15): the widget as a sheet. It loads the web widget in a `WKWebView`, renders it inline, and bridges identity, deep links and events to your app.

## Installation

Add the package with Swift Package Manager. In Xcode, use File → Add Package Dependencies with this repository's URL, or in `Package.swift`:

```swift
.package(url: "https://github.com/<owner>/<repo>.git", branch: "main"),
```

```swift
.product(name: "QuillsKit", package: "Quills"),
.product(name: "QuillsWidget", package: "Quills"),
```

The package lives in `packages/quills-swift` of this repository. With a local checkout, use `.package(path: "…/packages/quills-swift")`.

## Identity

Identity works as in the web SDK. Your backend signs the user's identity token (HS256, with the workspace's widget secret, as for `identify({ ssoToken })`), with `sub`, `email`, an optional `name` and an `exp` within one hour. The secret never ships in the app.

Give the client a closure that fetches a fresh token from your backend. Return `nil` when nobody is signed in: the visitor is anonymous.

```swift
import QuillsKit

let configuration = try QuillsConfiguration(
  instanceURL: URL(string: "https://projects.example.com")!,
  workspace: "your_workspace_id")

let quills = QuillsClient(configuration: configuration) {
  try await backend.quillsIdentityToken()  // nil when signed out
}
```

- The session token stays in memory. It is never written to disk, logged or put in a URL.
- When a token is refused as expired, the client asks your closure once more. A second refusal throws `QuillsError.identityRejected`.
- When the API ends a session (401), the client starts a new one and retries the call once.
- When your app's user changes, call `refreshIdentity()`. An anonymous visitor's votes and conversations move to the person when they sign in.
- `signOut()` forgets the session.

## Common flows

```swift
// Browse and search requests
let page = try await quills.posts(search: "dark mode")

// Submit a request; retrying with the same key returns the first post
let post = try await quills.submitPost(content: "Please add dark mode", boardId: board.id)

// Vote, or take the vote back
try await quills.vote(postId: post.id)
try await quills.vote(postId: post.id, voted: false)

// Comments
let comments = try await quills.comments(postId: post.id)
try await quills.addComment(postId: post.id, content: "Me too")

// Roadmap and changelog
let roadmap = try await quills.roadmap()
let updates = try await quills.changelog()
try await quills.markChangelogRead()

// Badges
let replies = try await quills.unreadCount()
let newUpdates = try await quills.changelogUnread().count
```

## The widget sheet

```swift
import QuillsWidget

let widget = QuillsWidgetViewController(configuration: configuration) {
  try await backend.quillsIdentityToken()
}
widget.onUnreadChange = { count in badge.text = count > 0 ? "\(count)" : nil }
widget.open(.changelog())
present(widget, animated: true)
```

- The sheet uses a non-persistent web data store, so nothing of the session stays on the device.
- Links out of the widget open in Safari.
- **Open in portal** signs in in a child web view. The portal sign-in finishes only in the window that the widget opened.
- `onEvent` receives every widget event (`post:created`, `vote`, `comment:created`, `identify`, …) with its JSON payload.

## Deep links

`QuillsDestination` names a view, as the web SDK's `open(…)`. It can also read one from a link in a push notification or a universal link:

```swift
if let destination = QuillsDestination(url: url) {
  widget.open(destination)
}
```

The link's query names the view: `quills_post=<post id>`, `quills_entry=<changelog entry id>`, `quills_article=<article id or slug>`, or `quills_view=` with one of `home`, `new-post`, `changelog`, `help`, `messages`, `chat`, `tickets` or `notifications`.

## Checks

```bash
swift test
```

These tests run on Linux and macOS, with a mock transport. Set these variables to run the client against a real instance as well:

- `QUILLS_LIVE_INSTANCE`, `QUILLS_LIVE_WORKSPACE`
- `QUILLS_LIVE_IDENTITY_TOKEN`: a token your backend signed
- `QUILLS_LIVE_PAGE_OUT`: a path that receives the sheet's page

`scripts/check-widget-page.cjs` then loads that page in Chromium, as the sheet does, with a stand-in for the app's message handler. It checks identify, `open` and the events.

`QuillsWidget` itself needs UIKit and WebKit. Build it in Xcode or with `xcodebuild` on macOS.
