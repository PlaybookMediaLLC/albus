import Foundation

/// Where the widget sheet opens, as the web SDK's `open(...)` options.
public enum QuillsDestination: Equatable, Sendable {
  case home
  /// The new-request form, optionally filled in.
  case newPost(title: String? = nil, body: String? = nil, board: String? = nil)
  case post(id: String)
  case changelog(entryId: String? = nil)
  case help(query: String? = nil, category: String? = nil)
  case article(id: String)
  /// The messenger, or a new message filled in with `body`.
  case messages(body: String? = nil)
  case chat
  case tickets
  /// The identified visitor's activity.
  case notifications

  /// The `open(...)` options of the web SDK.
  public var openOptions: [String: String] {
    switch self {
    case .home: return ["view": "home"]
    case let .newPost(title, body, board):
      return compact(["view": "new-post", "title": title, "body": body, "board": board])
    case let .post(id): return ["postId": id]
    case let .changelog(entryId): return compact(["view": "changelog", "entryId": entryId])
    case let .help(query, category):
      return compact(["view": "help", "query": query, "category": category])
    case let .article(id): return ["articleId": id]
    case let .messages(body): return compact(["view": "messages", "body": body])
    case .chat: return ["view": "chat"]
    case .tickets: return ["view": "tickets"]
    case .notifications: return ["view": "notifications"]
    }
  }

  /// Reads a destination from a deep link's query, for example from a push notification or a
  /// universal link: `quills_post=post_…`, `quills_entry=changelog_…`, `quills_article=…` or
  /// `quills_view=home|new-post|changelog|help|messages|chat|tickets|notifications`. Nil when the
  /// link names none.
  public init?(url: URL) {
    guard let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems
    else { return nil }
    func value(_ name: String) -> String? {
      items.first { $0.name == name }?.value.flatMap { $0.isEmpty ? nil : $0 }
    }
    if let id = value("quills_post") {
      self = .post(id: id)
    } else if let id = value("quills_article") {
      self = .article(id: id)
    } else if let id = value("quills_entry") {
      self = .changelog(entryId: id)
    } else {
      switch value("quills_view") {
      case "home": self = .home
      case "new-post": self = .newPost(title: value("quills_title"), body: value("quills_body"))
      case "changelog": self = .changelog()
      case "help": self = .help(query: value("quills_query"))
      case "messages": self = .messages(body: value("quills_body"))
      case "chat": self = .chat
      case "tickets": self = .tickets
      case "notifications": self = .notifications
      default: return nil
      }
    }
  }
}

private func compact(_ values: [String: String?]) -> [String: String] {
  values.compactMapValues { $0 }
}
