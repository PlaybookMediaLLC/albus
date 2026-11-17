import Foundation

#if canImport(FoundationNetworking)
  import FoundationNetworking
#endif

/// Sends one HTTP request. Swap it in tests, or to add your own networking.
public protocol QuillsTransport: Sendable {
  func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse)
}

/// URLSession, with its default HTTP cache for GET requests.
public struct URLSessionTransport: QuillsTransport, @unchecked Sendable {
  private let session: URLSession

  public init(session: URLSession = .shared) {
    self.session = session
  }

  public func send(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
    try await withCheckedThrowingContinuation { continuation in
      session.dataTask(with: request) { data, response, error in
        if let error {
          continuation.resume(throwing: error)
        } else if let response = response as? HTTPURLResponse {
          continuation.resume(returning: (data ?? Data(), response))
        } else {
          continuation.resume(throwing: QuillsError.invalidResponse)
        }
      }.resume()
    }
  }
}
