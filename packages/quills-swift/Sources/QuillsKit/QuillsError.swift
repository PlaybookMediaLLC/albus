import Foundation

/// A failed widget call. No case carries a session or identity token.
public enum QuillsError: Error, Equatable, Sendable {
  /// The configuration is not usable.
  case invalidConfiguration(String)
  /// The API answered with an error status and, when it sent one, its message.
  case http(status: Int, message: String?)
  /// The host app's identity token was refused twice in a row (invalid, expired or blocked).
  case identityRejected(message: String?)
  /// The response was not the JSON the API documents.
  case invalidResponse
}
