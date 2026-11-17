#if canImport(UIKit) && canImport(WebKit)
  import QuillsKit
  import SafariServices
  import UIKit
  import WebKit

  /// The widget as a sheet: the web widget in a web view, identified as your signed-in user.
  ///
  /// ```swift
  /// let widget = QuillsWidgetViewController(
  ///   configuration: configuration,
  ///   identityToken: { try await backend.quillsIdentityToken() })
  /// widget.open(.changelog())
  /// present(widget, animated: true)
  /// ```
  @MainActor
  public final class QuillsWidgetViewController: UIViewController {
    public let configuration: QuillsConfiguration
    private let identityToken: QuillsClient.IdentityProvider?
    private let theme: String?
    private var webView: WKWebView!
    private var ready = false
    private var pending: QuillsDestination?
    private let handler = ScriptMessageProxy()

    /// The unread count changed (replies and new updates).
    public var onUnreadChange: ((Int) -> Void)?
    /// Every widget event, as the web SDK's `on(name, payload)`.
    public var onEvent: ((QuillsWidgetPage.Message) -> Void)?

    public init(
      configuration: QuillsConfiguration,
      identityToken: QuillsClient.IdentityProvider? = nil,
      theme: String? = nil
    ) {
      self.configuration = configuration
      self.identityToken = identityToken
      self.theme = theme
      super.init(nibName: nil, bundle: nil)
      modalPresentationStyle = .pageSheet
      if let sheet = sheetPresentationController {
        sheet.detents = [.large()]
        sheet.prefersGrabberVisible = true
      }
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }

    public override func loadView() {
      let contents = WKUserContentController()
      handler.target = self
      contents.add(handler, name: QuillsWidgetPage.messageHandler)
      let settings = WKWebViewConfiguration()
      settings.userContentController = contents
      // Nothing of the session stays on the device after the sheet is gone.
      settings.websiteDataStore = .nonPersistent()
      webView = WKWebView(frame: .zero, configuration: settings)
      webView.navigationDelegate = self
      webView.uiDelegate = self
      webView.isOpaque = false
      webView.backgroundColor = .systemBackground
      view = webView
    }

    public override func viewDidLoad() {
      super.viewDidLoad()
      webView.loadHTMLString(
        QuillsWidgetPage.html(configuration: configuration, theme: theme),
        baseURL: configuration.instanceURL)
    }

    /// Opens a view now, or once the widget is ready.
    public func open(_ destination: QuillsDestination) {
      guard ready else {
        pending = destination
        return
      }
      webView.evaluateJavaScript(QuillsWidgetPage.openScript(destination), completionHandler: nil)
    }

    /// Call when your app's signed-in user changes while the sheet is open.
    public func refreshIdentity() {
      guard ready else { return }
      identify()
    }

    private func identify() {
      guard let identityToken else { return }
      Task { [weak self] in
        let token = try? await identityToken()
        guard let self else { return }
        self.webView.evaluateJavaScript(
          QuillsWidgetPage.identifyScript(token: token), completionHandler: nil)
      }
    }

    fileprivate func receive(_ body: Any) {
      guard let message = QuillsWidgetPage.Message(body: body) else { return }
      switch message.type {
      case "ready":
        ready = true
        identify()
        if let pending {
          self.pending = nil
          open(pending)
        }
      case "close":
        dismiss(animated: true)
      case "unread":
        if let count = message.unreadCount { onUnreadChange?(count) }
      default:
        break
      }
      onEvent?(message)
    }
  }

  extension QuillsWidgetViewController: WKNavigationDelegate, WKUIDelegate {
    // Links out of the widget (an article's link, the portal) open in Safari, not in the sheet.
    public func webView(
      _ webView: WKWebView,
      createWebViewWith configuration: WKWebViewConfiguration,
      for navigationAction: WKNavigationAction,
      windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
      guard let url = navigationAction.request.url, url.scheme == "https" || url.scheme == "http"
      else { return nil }
      // The portal sign-in start answers only the widget frame that opened it, so it needs a
      // child web view that keeps the opener; Safari would not.
      if url.host == self.configuration.instanceURL.host,
        url.path.hasSuffix("/auth/quills/portal-sign-in")
      {
        let child = WKWebView(frame: .zero, configuration: configuration)
        let sheet = UIViewController()
        sheet.view = child
        present(sheet, animated: true)
        return child
      }
      present(SFSafariViewController(url: url), animated: true)
      return nil
    }

    public func webView(
      _ webView: WKWebView,
      decidePolicyFor navigationAction: WKNavigationAction
    ) async -> WKNavigationActionPolicy {
      // The page itself and the widget frame stay; a top-level link elsewhere goes to Safari.
      if navigationAction.targetFrame?.isMainFrame == true,
        navigationAction.navigationType == .linkActivated,
        let url = navigationAction.request.url
      {
        present(SFSafariViewController(url: url), animated: true)
        return .cancel
      }
      return .allow
    }
  }

  /// WKUserContentController keeps its handlers strongly: the proxy breaks the cycle.
  private final class ScriptMessageProxy: NSObject, WKScriptMessageHandler {
    weak var target: QuillsWidgetViewController?

    func userContentController(
      _ userContentController: WKUserContentController,
      didReceive message: WKScriptMessage
    ) {
      let body = message.body
      MainActor.assumeIsolated { target?.receive(body) }
    }
  }
#endif
