import Foundation
import QuillsKit

#if canImport(FoundationNetworking)
  import FoundationNetworking
#endif

/// Answers requests from a table keyed by "METHOD /path" and records each request.
final class MockTransport: QuillsTransport, @unchecked Sendable {
  struct Reply {
    var status = 200
    var json: Any
  }

  private let lock = NSLock()
  private var routes: [String: (URLRequest) -> Reply] = [:]
  private(set) var requests: [URLRequest] = []

  func on(_ key: String, _ reply: @escaping (URLRequest) -> Reply) {
    lock.lock()
    routes[key] = reply
    lock.unlock()
  }

  func on(_ key: String, status: Int = 200, json: Any) {
    on(key) { _ in Reply(status: status, json: json) }
  }

  func calls(_ key: String) -> [URLRequest] {
    lock.lock()
    defer { lock.unlock() }
    return requests.filter { Self.key(of: $0) == key }
  }

  static func key(of request: URLRequest) -> String {
    let path = request.url!.path.replacingOccurrences(of: "/api/quills-public/acme", with: "")
    return "\(request.httpMethod!) \(path)"
  }

  func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
    lock.lock()
    requests.append(request)
    let route = routes[Self.key(of: request)]
    lock.unlock()
    let reply = route?(request) ?? Reply(status: 404, json: ["message": "Not found"])
    let data = try JSONSerialization.data(withJSONObject: reply.json, options: [.fragmentsAllowed])
    let response = HTTPURLResponse(
      url: request.url!, statusCode: reply.status, httpVersion: nil, headerFields: nil)!
    return (data, response)
  }
}

func body(_ request: URLRequest) -> [String: Any] {
  guard let data = request.httpBody else { return [:] }
  return (try? JSONSerialization.jsonObject(with: data) as? [String: Any]) ?? [:]
}

let post: [String: Any] = [
  "id": "post_1", "title": "Dark mode", "content": "Please add dark mode",
  "board": ["id": "board_1", "name": "Ideas", "slug": "ideas"],
  "status": ["id": "status_1", "name": "Open", "color": "#888888"],
  "stage": "in_progress",
  "author": ["name": "Ada", "avatarUrl": NSNull(), "isTeamMember": false],
  "voteCount": 3, "commentCount": 1, "pending": false, "isAuthor": true, "voted": false,
  "following": true, "tags": [] as [Any], "createdAt": "2026-11-17T10:00:00.123Z",
]
let ada: [String: Any] = [
  "id": "user_1", "name": "Ada", "email": "ada@example.test", "avatarUrl": NSNull(),
]
