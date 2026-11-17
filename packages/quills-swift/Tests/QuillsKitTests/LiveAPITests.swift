import Foundation
import XCTest

@testable import QuillsKit

/// Runs against a real instance when QUILLS_LIVE_INSTANCE and QUILLS_LIVE_WORKSPACE are set.
/// QUILLS_LIVE_IDENTITY_TOKEN is an identity token that a backend signed (the SDK never holds the
/// widget secret). QUILLS_LIVE_PAGE_OUT, when set, receives the widget sheet's page for a browser
/// check.
final class LiveAPITests: XCTestCase {
  private var environment: [String: String] { ProcessInfo.processInfo.environment }

  private func liveConfiguration() throws -> QuillsConfiguration {
    guard let instance = environment["QUILLS_LIVE_INSTANCE"],
      let workspace = environment["QUILLS_LIVE_WORKSPACE"]
    else { throw XCTSkip("Set QUILLS_LIVE_INSTANCE and QUILLS_LIVE_WORKSPACE") }
    return try QuillsConfiguration(instanceURL: URL(string: instance)!, workspace: workspace)
  }

  func testAnIdentifiedVisitorSubmitsVotesCommentsAndReads() async throws {
    let configuration = try liveConfiguration()
    guard let token = environment["QUILLS_LIVE_IDENTITY_TOKEN"]
    else { throw XCTSkip("Set QUILLS_LIVE_IDENTITY_TOKEN") }
    let signedIn = Locked<String?>(nil)
    let client = QuillsClient(configuration: configuration, identityToken: { signedIn.value })

    // Anonymous first, then the person signs in: the anonymous session merges into theirs.
    let browsing = try await client.posts(limit: 5)
    XCTAssertNotNil(browsing.hasMore)
    let anonymous = await client.user
    XCTAssertNil(anonymous)
    signedIn.value = token
    let user = try await client.refreshIdentity()
    XCTAssertNotNil(user?.email)

    let boards = try await client.boards()
    let board = try XCTUnwrap(boards.first { $0.canSubmit })
    let created = try await client.submitPost(
      content: "From the Swift SDK \(UUID().uuidString)", boardId: board.id,
      idempotencyKey: "swift-\(UUID().uuidString)")
    XCTAssertTrue(created.isAuthor)
    let read = try await client.post(id: created.id)
    XCTAssertEqual(read.id, created.id)

    let target = try await client.posts(limit: 10).items.first { !$0.isAuthor && !$0.pending }
    if let target {
      let voted = try await client.vote(postId: target.id, voted: !target.voted)
      XCTAssertEqual(voted.voted, !target.voted)
      _ = try await client.vote(postId: target.id, voted: target.voted)
    }

    let comment = try await client.addComment(postId: created.id, content: "A comment from Swift")
    let comments = try await client.comments(postId: created.id)
    XCTAssertTrue(comments.items.contains { $0.id == comment.id })

    let roadmap = try await client.roadmap(limit: 5)
    XCTAssertTrue(roadmap.planned.allSatisfy { $0.stage == .planned })
    let changelog = try await client.changelog(limit: 5)
    if let entry = changelog.entries.first {
      let full = try await client.changelogEntry(id: entry.id)
      XCTAssertEqual(full.id, entry.id)
    }
    _ = try await client.changelogUnread()
    try await client.markChangelogRead()
    let unread = try await client.changelogUnread()
    XCTAssertEqual(unread.count, 0)
    _ = try await client.unreadCount()
  }

  func testWritesTheWidgetPageForABrowserCheck() throws {
    let configuration = try liveConfiguration()
    guard let out = environment["QUILLS_LIVE_PAGE_OUT"]
    else { throw XCTSkip("Set QUILLS_LIVE_PAGE_OUT") }
    try QuillsWidgetPage.html(configuration: configuration).write(
      toFile: out, atomically: true, encoding: .utf8)
  }
}
