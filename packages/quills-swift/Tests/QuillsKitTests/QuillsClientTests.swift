import Foundation
import XCTest

@testable import QuillsKit

#if canImport(FoundationNetworking)
  import FoundationNetworking
#endif

final class QuillsClientTests: XCTestCase {
  let configuration = try! QuillsConfiguration(
    instanceURL: URL(string: "https://projects.example.test")!, workspace: "acme")

  func testAnonymousVisitorReadsRequestsWithItsOwnSession() async throws {
    let mock = MockTransport()
    mock.on("POST /widget/anonymous-session", json: ["sessionToken": "anon", "principalId": "p"])
    mock.on("GET /widget/posts", json: ["items": [post], "nextCursor": NSNull(), "hasMore": false])
    let client = QuillsClient(configuration: configuration, transport: mock)

    let page = try await client.posts(stage: .inProgress, search: "dark", limit: 5)

    XCTAssertEqual(page.items.first?.title, "Dark mode")
    XCTAssertEqual(page.items.first?.stage, .inProgress)
    XCTAssertEqual(page.items.first?.voteCount, 3)
    let request = try XCTUnwrap(mock.calls("GET /widget/posts").first)
    XCTAssertEqual(request.value(forHTTPHeaderField: "authorization"), "Bearer anon")
    let query = URLComponents(url: request.url!, resolvingAgainstBaseURL: false)!.queryItems!
    XCTAssertEqual(
      Set(query.map { "\($0.name)=\($0.value!)" }),
      ["limit=5", "stage=in_progress", "search=dark"])
    let user = await client.user
    XCTAssertNil(user)
  }

  func testIdentifyMovesTheAnonymousActivityToThePerson() async throws {
    let mock = MockTransport()
    mock.on("POST /widget/anonymous-session", json: ["sessionToken": "anon", "principalId": "p"])
    mock.on("POST /widget/identify", json: ["sessionToken": "known", "principalId": "p2", "user": ada])
    mock.on("GET /widget/unread", json: ["unreadCount": 2])
    let signedIn = Locked<String?>(nil)
    let client = QuillsClient(
      configuration: configuration, identityToken: { signedIn.value }, transport: mock)

    _ = try await client.unreadCount()
    signedIn.value = "signed.identity.token"
    let user = try await client.refreshIdentity()

    XCTAssertEqual(user?.email, "ada@example.test")
    let identify = try XCTUnwrap(mock.calls("POST /widget/identify").first)
    XCTAssertEqual(body(identify)["ssoToken"] as? String, "signed.identity.token")
    XCTAssertEqual(body(identify)["previousToken"] as? String, "anon")
    XCTAssertEqual(identify.value(forHTTPHeaderField: "authorization"), "Bearer anon")
    let unread = try await client.unreadCount()
    XCTAssertEqual(unread, 2)
    XCTAssertEqual(
      mock.calls("GET /widget/unread").last?.value(forHTTPHeaderField: "authorization"),
      "Bearer known")
  }

  func testAnExpiredIdentityTokenIsFetchedOnceMore() async throws {
    let mock = MockTransport()
    let minted = Locked(0)
    mock.on("POST /widget/identify") { request in
      body(request)["ssoToken"] as? String == "fresh-2"
        ? .init(json: ["sessionToken": "known", "principalId": "p", "user": ada])
        : .init(status: 403, json: ["message": "Invalid or expired ssoToken"])
    }
    let client = QuillsClient(
      configuration: configuration,
      identityToken: {
        minted.value += 1
        return "fresh-\(minted.value)"
      }, transport: mock)

    let user = try await client.connect()

    XCTAssertEqual(user?.id, "user_1")
    XCTAssertEqual(minted.value, 2)
  }

  func testATokenRefusedTwiceIsAnIdentityError() async {
    let mock = MockTransport()
    mock.on("POST /widget/identify", status: 403, json: ["message": "This account is blocked"])
    let client = QuillsClient(
      configuration: configuration, identityToken: { "token" }, transport: mock)

    do {
      _ = try await client.connect()
      XCTFail("expected an identity error")
    } catch {
      XCTAssertEqual(error as? QuillsError, .identityRejected(message: "This account is blocked"))
    }
    XCTAssertEqual(mock.calls("POST /widget/anonymous-session").count, 0)
  }

  func testAnEndedSessionStartsANewOneAndRetriesOnce() async throws {
    let mock = MockTransport()
    let sessions = Locked(0)
    mock.on("POST /widget/anonymous-session") { _ in
      sessions.value += 1
      return .init(json: ["sessionToken": "anon-\(sessions.value)", "principalId": "p"])
    }
    mock.on("PUT /widget/posts/post_1/vote") { request in
      request.value(forHTTPHeaderField: "authorization") == "Bearer anon-1"
        ? .init(status: 401, json: ["message": "Session ended"])
        : .init(json: ["postId": "post_1", "voted": true, "voteCount": 4, "changed": true])
    }
    let client = QuillsClient(configuration: configuration, transport: mock)

    let vote = try await client.vote(postId: "post_1")

    XCTAssertEqual(vote, VoteResult(postId: "post_1", voted: true, voteCount: 4, changed: true))
    XCTAssertEqual(sessions.value, 2)
    XCTAssertEqual(body(mock.calls("PUT /widget/posts/post_1/vote")[1])["voted"] as? Bool, true)
  }

  func testConcurrentCallsShareOneSession() async throws {
    let mock = MockTransport()
    mock.on("POST /widget/anonymous-session", json: ["sessionToken": "anon", "principalId": "p"])
    mock.on("GET /widget/unread", json: ["unreadCount": 0])
    let client = QuillsClient(configuration: configuration, transport: mock)

    async let a = client.unreadCount()
    async let b = client.unreadCount()
    async let c = client.unreadCount()
    _ = try await (a, b, c)

    XCTAssertEqual(mock.calls("POST /widget/anonymous-session").count, 1)
  }

  func testSubmitsARequestAndACommentWithIdempotencyKeys() async throws {
    let mock = MockTransport()
    mock.on("POST /widget/anonymous-session", json: ["sessionToken": "anon", "principalId": "p"])
    mock.on("POST /widget/posts") { _ in .init(json: post.merging(["replayed": false]) { $1 }) }
    mock.on("POST /widget/posts/post 1/comments") { _ in
      .init(json: [
        "id": "comment_1", "parentId": NSNull(), "content": "Me too",
        "author": ["name": "Ada", "avatarUrl": NSNull(), "isTeamMember": false],
        "isAuthor": true, "pending": false, "deleted": false,
        "createdAt": "2026-11-17T10:00:00Z", "postId": "post 1", "replayed": false,
        "attachments": [] as [Any], "canEdit": true, "canDelete": true, "updatedAt": NSNull(),
        "reactions": [] as [Any],
      ])
    }
    let client = QuillsClient(configuration: configuration, transport: mock)

    let created = try await client.submitPost(
      content: "Please add dark mode", boardId: "board_1", idempotencyKey: "key-1")
    let comment = try await client.addComment(postId: "post 1", content: "Me too")

    XCTAssertEqual(created.id, "post_1")
    let sent = body(try XCTUnwrap(mock.calls("POST /widget/posts").first))
    XCTAssertEqual(sent["content"] as? String, "Please add dark mode")
    XCTAssertEqual(sent["boardId"] as? String, "board_1")
    XCTAssertEqual(sent["idempotencyKey"] as? String, "key-1")
    XCTAssertNil(sent["title"])
    XCTAssertEqual(comment.content, "Me too")
    let commentCall = try XCTUnwrap(mock.calls("POST /widget/posts/post 1/comments").first)
    // An ID is one path segment, percent-encoded.
    XCTAssertTrue(commentCall.url!.absoluteString.hasSuffix("/widget/posts/post%201/comments"))
    XCTAssertFalse((body(commentCall)["idempotencyKey"] as? String ?? "").isEmpty)
  }

  func testRoadmapReadsEachStage() async throws {
    let mock = MockTransport()
    mock.on("POST /widget/anonymous-session", json: ["sessionToken": "anon", "principalId": "p"])
    mock.on("GET /widget/posts") { request in
      let stage = URLComponents(url: request.url!, resolvingAgainstBaseURL: false)!
        .queryItems!.first { $0.name == "stage" }!.value!
      return .init(json: [
        "items": [post.merging(["id": stage, "stage": stage]) { $1 }],
        "nextCursor": NSNull(), "hasMore": false,
      ])
    }
    let client = QuillsClient(configuration: configuration, transport: mock)

    let roadmap = try await client.roadmap(limit: 3)

    XCTAssertEqual(roadmap.planned.map(\.id), ["planned"])
    XCTAssertEqual(roadmap.inProgress.map(\.id), ["in_progress"])
    XCTAssertEqual(roadmap.shipped.map(\.stage), [.shipped])
  }

  func testChangelogInTheConfiguredLanguage() async throws {
    let mock = MockTransport()
    mock.on("POST /widget/anonymous-session", json: ["sessionToken": "anon", "principalId": "p"])
    let entry: [String: Any] = [
      "id": "changelog_1", "title": "Exports", "content": "CSV export", "locale": "fr",
      "publishedAt": "2026-11-16T09:00:00Z", "author": ["name": "Team", "avatarUrl": NSNull()],
      "categories": [] as [Any], "linkedPosts": [] as [Any], "requesterCount": 0,
      "reactions": [] as [Any], "unread": true,
    ]
    mock.on("GET /widget/changelog", json: ["entries": [entry], "nextOffset": NSNull()])
    mock.on(
      "GET /widget/changelog/unread",
      json: ["count": 1, "announce": ["id": "changelog_1", "title": "Exports"], "autoOpen": false])
    mock.on("PUT /widget/changelog/read", json: ["lastReadAt": "2026-11-17T10:00:00Z"])
    var french = configuration
    french.locale = "fr"
    let client = QuillsClient(configuration: french, transport: mock)

    let page = try await client.changelog()
    let unread = try await client.changelogUnread()
    try await client.markChangelogRead()

    XCTAssertEqual(page.entries.first?.title, "Exports")
    XCTAssertEqual(unread.announce?.id, "changelog_1")
    XCTAssertTrue(
      mock.calls("GET /widget/changelog").first!.url!.query!.contains("locale=fr"))
    XCTAssertEqual(mock.calls("PUT /widget/changelog/read").count, 1)
  }

  func testErrorsCarryTheAPIMessageButNeverATokenAndNothingGoesInTheURL() async throws {
    let mock = MockTransport()
    mock.on("POST /widget/identify", json: ["sessionToken": "secret-session", "principalId": "p", "user": ada])
    mock.on("GET /widget/posts/missing", status: 404, json: ["message": "Post not found"])
    let client = QuillsClient(
      configuration: configuration, identityToken: { "secret-identity" }, transport: mock)

    do {
      _ = try await client.post(id: "missing")
      XCTFail("expected a 404")
    } catch {
      XCTAssertEqual(error as? QuillsError, .http(status: 404, message: "Post not found"))
      let text = "\(error) \(String(reflecting: error))"
      XCTAssertFalse(text.contains("secret-session") || text.contains("secret-identity"))
    }
    for request in mock.requests {
      XCTAssertFalse(request.url!.absoluteString.contains("secret"))
    }
  }

  func testConfigurationRejectsWhatIsNotAnInstanceOrAWorkspace() {
    XCTAssertThrowsError(
      try QuillsConfiguration(instanceURL: URL(string: "ftp://x.test")!, workspace: "acme"))
    XCTAssertThrowsError(
      try QuillsConfiguration(instanceURL: URL(string: "https://x.test")!, workspace: "a/b"))
    XCTAssertEqual(
      configuration.sdkScriptURL.absoluteString,
      "https://projects.example.test/api/quills-public/acme/widget/sdk.js")
  }
}

/// A value shared with a @Sendable closure in tests.
final class Locked<Value>: @unchecked Sendable {
  private let lock = NSLock()
  private var stored: Value
  init(_ value: Value) { stored = value }
  var value: Value {
    get { lock.lock(); defer { lock.unlock() }; return stored }
    set { lock.lock(); stored = newValue; lock.unlock() }
  }
}
