import Foundation

// The widget API's response shapes (apps/docs/openapi.json, the /widget routes). Fields the API
// may add later are ignored; unknown stages read as nil.

public struct QuillsUser: Codable, Sendable, Equatable {
  public let id: String
  public let name: String
  public let email: String?
  public let avatarUrl: String?
}

public enum PostStage: String, Codable, Sendable, CaseIterable {
  case open
  case planned
  case inProgress = "in_progress"
  case shipped
}

public struct BoardRef: Codable, Sendable, Equatable {
  public let id: String
  public let name: String
  public let slug: String
}

public struct Board: Codable, Sendable, Equatable {
  public let id: String
  public let name: String
  public let slug: String
  public let description: String?
  public let postCount: Int?
  public let canSubmit: Bool
  public let canVote: Bool
  public let canComment: Bool
}

public struct PostStatus: Codable, Sendable, Equatable {
  public let id: String
  public let name: String
  public let color: String
}

public struct Author: Codable, Sendable, Equatable {
  public let name: String?
  public let avatarUrl: String?
  public let isTeamMember: Bool
}

public struct Tag: Codable, Sendable, Equatable {
  public let id: String
  public let name: String
  public let color: String
}

public struct Post: Codable, Sendable, Equatable, Identifiable {
  public let id: String
  public let title: String
  public let content: String
  public let board: BoardRef
  public let status: PostStatus
  private let stageValue: String?
  public let author: Author
  /// Nil on a board that hides vote counts.
  public let voteCount: Int?
  public let commentCount: Int
  /// Held for review: only its author sees it.
  public let pending: Bool
  public let isAuthor: Bool
  public let voted: Bool
  public let following: Bool
  public let tags: [Tag]
  public let createdAt: Date

  public var stage: PostStage? { stageValue.flatMap(PostStage.init(rawValue:)) }

  enum CodingKeys: String, CodingKey {
    case id, title, content, board, status, author, voteCount, commentCount, pending, isAuthor
    case voted, following, tags, createdAt
    case stageValue = "stage"
  }
}

public struct PostPage: Codable, Sendable, Equatable {
  public let items: [Post]
  public let nextCursor: String?
  public let hasMore: Bool
}

public struct VoteResult: Codable, Sendable, Equatable {
  public let postId: String
  public let voted: Bool
  public let voteCount: Int?
  /// False when the vote was already in that state.
  public let changed: Bool
}

public struct Comment: Codable, Sendable, Equatable, Identifiable {
  public let id: String
  public let parentId: String?
  public let content: String
  public let author: Author
  public let isAuthor: Bool
  public let pending: Bool
  public let deleted: Bool
  public let createdAt: Date
}

public struct CommentPage: Codable, Sendable, Equatable {
  public let items: [Comment]
  public let nextOffset: Int?
}

public struct ChangelogAuthor: Codable, Sendable, Equatable {
  public let name: String
  public let avatarUrl: String?
}

public struct ChangelogEntry: Codable, Sendable, Equatable, Identifiable {
  public let id: String
  public let title: String
  /// Markdown.
  public let content: String
  public let locale: String?
  public let publishedAt: Date
  public let author: ChangelogAuthor
  public let categories: [Tag]
  public let unread: Bool
}

public struct ChangelogPage: Codable, Sendable, Equatable {
  public let entries: [ChangelogEntry]
  public let nextOffset: Int?
}

public struct ChangelogUnread: Codable, Sendable, Equatable {
  public struct Announcement: Codable, Sendable, Equatable {
    public let id: String
    public let title: String
  }
  public let count: Int
  /// The newest entry that this visitor has not been shown yet.
  public let announce: Announcement?
  public let autoOpen: Bool
}

/// The roadmap: planned, in-progress and shipped requests, each stage read on its own.
public struct Roadmap: Sendable, Equatable {
  public let planned: [Post]
  public let inProgress: [Post]
  public let shipped: [Post]
}

struct SessionResponse: Decodable {
  let sessionToken: String
  let user: QuillsUser?
}

struct UnreadResponse: Decodable {
  let unreadCount: Int
}

struct BoardsResponse: Decodable {
  let items: [Board]
}

extension JSONDecoder {
  /// ISO 8601 dates, with or without fractional seconds.
  static let quills: JSONDecoder = {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .custom { decoder in
      let text = try decoder.singleValueContainer().decode(String.self)
      let formatter = ISO8601DateFormatter()
      formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      if let date = formatter.date(from: text) { return date }
      formatter.formatOptions = [.withInternetDateTime]
      if let date = formatter.date(from: text) { return date }
      throw DecodingError.dataCorrupted(
        .init(codingPath: decoder.codingPath, debugDescription: "Not an ISO 8601 date"))
    }
    return decoder
  }()
}
