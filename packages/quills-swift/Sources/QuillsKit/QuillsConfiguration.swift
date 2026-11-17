import Foundation

/// Where the widget lives: the instance's public URL and the workspace.
public struct QuillsConfiguration: Sendable, Equatable {
  /// The instance's public API URL, as in `init({ instanceUrl })` of the web SDK.
  public let instanceURL: URL
  /// The workspace ID, as in `init({ workspace })` of the web SDK.
  public let workspace: String
  /// A BCP-47 tag for the widget's language; nil follows the device.
  public var locale: String?

  public init(instanceURL: URL, workspace: String, locale: String? = nil) throws {
    guard instanceURL.scheme == "https" || instanceURL.scheme == "http", instanceURL.host != nil
    else { throw QuillsError.invalidConfiguration("instanceURL must be an http(s) URL") }
    guard workspace.range(of: "^[A-Za-z0-9_-]{1,100}$", options: .regularExpression) != nil
    else { throw QuillsError.invalidConfiguration("workspace must be a workspace ID") }
    self.instanceURL = instanceURL
    self.workspace = workspace
    self.locale = locale
  }

  /// `{instance}/api/quills-public/{workspace}`: the widget routes.
  var apiBase: URL {
    instanceURL.appendingPathComponent("api/quills-public").appendingPathComponent(workspace)
  }

  /// The web SDK bundle that the widget sheet loads.
  public var sdkScriptURL: URL { apiBase.appendingPathComponent("widget/sdk.js") }
}
