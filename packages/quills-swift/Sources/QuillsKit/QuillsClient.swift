import Foundation

#if canImport(FoundationNetworking)
  import FoundationNetworking
#endif

/// The widget API for native apps: requests, votes, comments, the roadmap and the changelog.
///
/// Identity works as in the web SDK: your backend signs the user's identity token (HS256, with the
/// workspace's widget secret, which never ships in the app) and `identityToken` returns it. A nil
/// token, or no provider, means an anonymous visitor. The session token lives in memory only: it
/// is never written to disk, logged or put in a URL.
public actor QuillsClient {
  /// Returns a freshly signed identity token for the signed-in user, or nil when nobody is.
  /// Tokens expire within an hour, so fetch one from your backend each time.
  public typealias IdentityProvider = @Sendable () async throws -> String?

  public let configuration: QuillsConfiguration
  private let transport: QuillsTransport
  private let identityToken: IdentityProvider?
  private var session: Session?
  /// The last anonymous session: identify moves its votes and conversations to the person.
  private var anonymousToken: String?
  private var establishing: Task<Session, Error>?
  /// The identified person, or nil for an anonymous visitor.
  public private(set) var user: QuillsUser?

  private struct Session {
    let token: String
    let identified: Bool
  }

  public init(
    configuration: QuillsConfiguration,
    identityToken: IdentityProvider? = nil,
    transport: QuillsTransport = URLSessionTransport()
  ) {
    self.configuration = configuration
    self.identityToken = identityToken
    self.transport = transport
  }

  // MARK: Identity

  /// Starts a session now, identified when the provider returns a token. Calls start one lazily
  /// otherwise. Returns the identified person, or nil for an anonymous visitor.
  @discardableResult
  public func connect() async throws -> QuillsUser? {
    _ = try await currentSession()
    return user
  }

  /// Call when your app's signed-in user changes (sign-in, sign-out or switch): the next session
  /// asks the provider again.
  @discardableResult
  public func refreshIdentity() async throws -> QuillsUser? {
    establishing?.cancel()
    establishing = nil
    if session?.identified == true { anonymousToken = nil }
    session = nil
    user = nil
    return try await connect()
  }

  /// Forgets the session and the person. The next call starts a new anonymous session, or asks
  /// the provider again.
  public func signOut() {
    establishing?.cancel()
    establishing = nil
    session = nil
    anonymousToken = nil
    user = nil
  }

  // MARK: Requests

  /// The boards this visitor can see.
  public func boards() async throws -> [Board] {
    try await call("GET", "/widget/boards", as: BoardsResponse.self).items
  }

  /// One page of requests, newest or by votes as the board sorts them.
  public func posts(
    boardId: String? = nil,
    stage: PostStage? = nil,
    search: String? = nil,
    cursor: String? = nil,
    limit: Int = 20
  ) async throws -> PostPage {
    var query = [URLQueryItem(name: "limit", value: String(limit))]
    if let boardId { query.append(.init(name: "boardId", value: boardId)) }
    if let stage { query.append(.init(name: "stage", value: stage.rawValue)) }
    if let search { query.append(.init(name: "search", value: search)) }
    if let cursor { query.append(.init(name: "cursor", value: cursor)) }
    return try await call("GET", "/widget/posts", query: query, as: PostPage.self)
  }

  public func post(id: String) async throws -> Post {
    try await call("GET", "/widget/posts/\(path(id))", as: Post.self)
  }

  /// Submits a request. A retry with the same `idempotencyKey` returns the first post.
  public func submitPost(
    content: String,
    title: String? = nil,
    boardId: String? = nil,
    idempotencyKey: String = UUID().uuidString
  ) async throws -> Post {
    var body: [String: String] = ["content": content, "idempotencyKey": idempotencyKey]
    body["title"] = title
    body["boardId"] = boardId
    return try await call("POST", "/widget/posts", body: body, as: Post.self)
  }

  /// Votes for a request, or takes the vote back.
  public func vote(postId: String, voted: Bool = true) async throws -> VoteResult {
    try await call(
      "PUT", "/widget/posts/\(path(postId))/vote", body: ["voted": voted], as: VoteResult.self)
  }

  public func comments(postId: String, offset: Int = 0, limit: Int = 50) async throws
    -> CommentPage
  {
    try await call(
      "GET", "/widget/posts/\(path(postId))/comments",
      query: [.init(name: "offset", value: String(offset)), .init(name: "limit", value: String(limit))],
      as: CommentPage.self)
  }

  /// Comments on a request; `parentId` replies to a comment.
  public func addComment(
    postId: String,
    content: String,
    parentId: String? = nil,
    idempotencyKey: String = UUID().uuidString
  ) async throws -> Comment {
    var body: [String: String] = ["content": content, "idempotencyKey": idempotencyKey]
    body["parentId"] = parentId
    return try await call(
      "POST", "/widget/posts/\(path(postId))/comments", body: body, as: Comment.self)
  }

  /// Planned, in-progress and shipped requests, up to `limit` of each.
  public func roadmap(limit: Int = 20) async throws -> Roadmap {
    async let planned = posts(stage: .planned, limit: limit)
    async let inProgress = posts(stage: .inProgress, limit: limit)
    async let shipped = posts(stage: .shipped, limit: limit)
    return try await Roadmap(
      planned: planned.items, inProgress: inProgress.items, shipped: shipped.items)
  }

  // MARK: Changelog

  public func changelog(offset: Int = 0, limit: Int = 20) async throws -> ChangelogPage {
    var query = [
      URLQueryItem(name: "offset", value: String(offset)),
      URLQueryItem(name: "limit", value: String(limit)),
    ]
    if let locale = configuration.locale { query.append(.init(name: "locale", value: locale)) }
    return try await call("GET", "/widget/changelog", query: query, as: ChangelogPage.self)
  }

  public func changelogEntry(id: String) async throws -> ChangelogEntry {
    let query = configuration.locale.map { [URLQueryItem(name: "locale", value: $0)] } ?? []
    return try await call(
      "GET", "/widget/changelog/\(path(id))", query: query, as: ChangelogEntry.self)
  }

  public func changelogUnread() async throws -> ChangelogUnread {
    try await call("GET", "/widget/changelog/unread", as: ChangelogUnread.self)
  }

  /// Marks every published update read for this visitor.
  public func markChangelogRead() async throws {
    _ = try await call("PUT", "/widget/changelog/read", as: Empty.self)
  }

  /// Unread replies in the visitor's conversations.
  public func unreadCount() async throws -> Int {
    try await call("GET", "/widget/unread", as: UnreadResponse.self).unreadCount
  }

  // MARK: Session handling

  /// A call with the session; a 401 (the session ended) starts a new one and retries once.
  private func call<T: Decodable>(
    _ method: String,
    _ route: String,
    query: [URLQueryItem] = [],
    body: (any Encodable)? = nil,
    as type: T.Type
  ) async throws -> T {
    let first = try await currentSession()
    do {
      return try await send(method, route, query: query, body: body, bearer: first.token, as: type)
    } catch QuillsError.http(status: 401, _) {
      if session?.token == first.token { session = nil }
      let next = try await currentSession()
      return try await send(method, route, query: query, body: body, bearer: next.token, as: type)
    }
  }

  /// The session, or one started for concurrent callers together.
  private func currentSession() async throws -> Session {
    if let session { return session }
    if let establishing { return try await establishing.value }
    let task = Task { try await self.establish() }
    establishing = task
    defer { establishing = nil }
    let started = try await task.value
    session = started
    return started
  }

  private func establish() async throws -> Session {
    if let identityToken, let token = try await identityToken() {
      do {
        return try await identify(token)
      } catch QuillsError.http(status: 403, _) {
        // A token that expired between signing and use: ask the backend once more.
        guard let fresh = try await identityToken() else { return try await anonymous() }
        do {
          return try await identify(fresh)
        } catch QuillsError.http(status: 403, let message) {
          throw QuillsError.identityRejected(message: message)
        }
      }
    }
    return try await anonymous()
  }

  private func identify(_ ssoToken: String) async throws -> Session {
    var body = ["ssoToken": ssoToken]
    body["previousToken"] = anonymousToken
    let response = try await send(
      "POST", "/widget/identify", body: body, bearer: anonymousToken, as: SessionResponse.self)
    anonymousToken = nil
    user = response.user
    return Session(token: response.sessionToken, identified: true)
  }

  private func anonymous() async throws -> Session {
    let response = try await send(
      "POST", "/widget/anonymous-session", bearer: nil, as: SessionResponse.self)
    anonymousToken = response.sessionToken
    user = nil
    return Session(token: response.sessionToken, identified: false)
  }

  private func send<T: Decodable>(
    _ method: String,
    _ route: String,
    query: [URLQueryItem] = [],
    body: (any Encodable)? = nil,
    bearer: String?,
    as type: T.Type
  ) async throws -> T {
    // The route's IDs are already percent-encoded (path(_:)).
    guard var components = URLComponents(string: configuration.apiBase.absoluteString + route)
    else { throw QuillsError.invalidConfiguration("The route is not a valid URL") }
    if !query.isEmpty { components.queryItems = query }
    guard let url = components.url else { throw QuillsError.invalidResponse }
    var request = URLRequest(url: url)
    request.httpMethod = method
    request.setValue("application/json", forHTTPHeaderField: "accept")
    if let bearer { request.setValue("Bearer \(bearer)", forHTTPHeaderField: "authorization") }
    if let body {
      request.setValue("application/json", forHTTPHeaderField: "content-type")
      request.httpBody = try JSONEncoder().encode(body)
    }
    let (data, response) = try await transport.send(request)
    guard (200..<300).contains(response.statusCode) else {
      let message = (try? JSONDecoder().decode(APIErrorBody.self, from: data))?.message
      throw QuillsError.http(status: response.statusCode, message: message)
    }
    if T.self == Empty.self { return Empty() as! T }
    do {
      return try JSONDecoder.quills.decode(T.self, from: data)
    } catch {
      throw QuillsError.invalidResponse
    }
  }

  private func path(_ id: String) -> String {
    id.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed.subtracting(["/"])) ?? id
  }
}

private struct Empty: Decodable {}

private struct APIErrorBody: Decodable {
  let message: String?
}
