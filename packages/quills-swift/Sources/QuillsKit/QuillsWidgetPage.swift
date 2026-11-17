import Foundation

/// The page that the iOS widget sheet loads in its web view: the web SDK (`widget/sdk.js`),
/// rendered inline and always open, with a bridge to the app. The page posts each SDK event to the
/// `quills` script message handler as a JSON string `{"type": …, "payload": …}`, and the app calls
/// `window.quillsNative.identify(token)`, `.open(options)` and `.logout()`. Load it with the
/// instance URL as the base URL, so the page and the widget share an origin.
public enum QuillsWidgetPage {
  /// The `WKScriptMessageHandler` name.
  public static let messageHandler = "quills"

  /// The SDK events forwarded to the app.
  public static let events = [
    "ready", "open", "close", "identify", "unread", "post:created", "vote", "comment:created",
    "announcement", "error",
  ]

  public static func html(configuration: QuillsConfiguration, theme: String? = nil) -> String {
    var initOptions: [String: Any] = ["container": "#quills", "announcements": "none"]
    initOptions["locale"] = configuration.locale
    initOptions["theme"] = theme
    return """
      <!doctype html>
      <html><head><meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
      <style>html,body,#quills{margin:0;padding:0;height:100%;background:transparent}</style>
      </head><body><div id="quills"></div>
      <script src="\(attribute(configuration.sdkScriptURL.absoluteString))"></script>
      <script>
      (function () {
        var native = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.\(messageHandler);
        function send(type, payload) {
          if (native) native.postMessage(JSON.stringify({ type: type, payload: payload === undefined ? null : payload }));
        }
        if (typeof window.Quills !== "function") return send("error", { code: "sdk_unavailable", message: "The widget script did not load" });
        \(json(events)).forEach(function (name) {
          window.Quills("on", name, function (payload) { send(name, payload); });
        });
        window.quillsNative = {
          identify: function (token) { window.Quills("identify", token ? { ssoToken: token } : undefined); },
          open: function (options) { window.Quills("open", options); },
          logout: function () { window.Quills("logout"); }
        };
        window.Quills("init", \(json(initOptions)));
      })();
      </script></body></html>
      """
  }

  /// A JavaScript call that opens `destination` in a loaded page.
  public static func openScript(_ destination: QuillsDestination) -> String {
    "window.quillsNative && window.quillsNative.open(\(json(destination.openOptions)));"
  }

  /// A JavaScript call that identifies the visitor with a signed identity token, or makes them
  /// anonymous with nil.
  public static func identifyScript(token: String?) -> String {
    "window.quillsNative && window.quillsNative.identify(\(token.map { json($0) } ?? "null"));"
  }

  /// One message from the page's bridge, decoded.
  public struct Message: Equatable, Sendable {
    public let type: String
    /// The event's JSON payload, as the web SDK sends it.
    public let payload: Data?

    /// Decodes the JSON string the page posted; nil for anything else.
    public init?(body: Any) {
      guard let text = body as? String, let data = text.data(using: .utf8),
        let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
        let type = object["type"] as? String
      else { return nil }
      self.type = type
      if let payload = object["payload"], !(payload is NSNull) {
        self.payload = try? JSONSerialization.data(withJSONObject: payload, options: [.fragmentsAllowed])
      } else {
        self.payload = nil
      }
    }

    /// The `unread` event's count.
    public var unreadCount: Int? {
      guard type == "unread", let payload,
        let object = try? JSONSerialization.jsonObject(with: payload) as? [String: Any]
      else { return nil }
      return object["count"] as? Int
    }
  }
}

/// JSON safe to put inside a `<script>`: `<`, `>`, `&` and the line separators are escaped.
func json(_ value: Any) -> String {
  let data = (try? JSONSerialization.data(withJSONObject: value, options: [.fragmentsAllowed, .sortedKeys])) ?? Data("null".utf8)
  return String(decoding: data, as: UTF8.self)
    .replacingOccurrences(of: "<", with: "\\u003c")
    .replacingOccurrences(of: ">", with: "\\u003e")
    .replacingOccurrences(of: "&", with: "\\u0026")
    .replacingOccurrences(of: "\u{2028}", with: "\\u2028")
    .replacingOccurrences(of: "\u{2029}", with: "\\u2029")
}

private func attribute(_ value: String) -> String {
  value.replacingOccurrences(of: "&", with: "&amp;").replacingOccurrences(of: "\"", with: "&quot;")
    .replacingOccurrences(of: "<", with: "&lt;").replacingOccurrences(of: ">", with: "&gt;")
}
