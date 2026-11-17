import Foundation
import XCTest

@testable import QuillsKit

final class QuillsWidgetPageTests: XCTestCase {
  let configuration = try! QuillsConfiguration(
    instanceURL: URL(string: "https://projects.example.test")!, workspace: "acme", locale: "fr")

  func testThePageLoadsTheSDKInlineAndForwardsEvents() {
    let html = QuillsWidgetPage.html(configuration: configuration, theme: "dark")
    XCTAssertTrue(
      html.contains(
        #"<script src="https://projects.example.test/api/quills-public/acme/widget/sdk.js">"#))
    XCTAssertTrue(
      html.contains(
        ##"window.Quills("init", {"announcements":"none","container":"#quills","locale":"fr","theme":"dark"})"##
      ))
    XCTAssertTrue(html.contains("window.webkit.messageHandlers.quills"))
    XCTAssertTrue(html.contains(#""unread""#))
  }

  func testScriptsEscapeWhatCouldCloseTheScript() {
    let script = QuillsWidgetPage.openScript(.newPost(title: "</script><b>", body: nil, board: nil))
    // JSON in a script: no "</" can close it.
    XCTAssertFalse(script.contains("</"))
    XCTAssertTrue(script.contains("\\u003c"))
    XCTAssertEqual(
      QuillsWidgetPage.identifyScript(token: nil),
      "window.quillsNative && window.quillsNative.identify(null);")
    XCTAssertEqual(
      QuillsWidgetPage.identifyScript(token: "a.b.c"),
      #"window.quillsNative && window.quillsNative.identify("a.b.c");"#)
  }

  func testDecodesTheBridgeMessages() {
    let unread = QuillsWidgetPage.Message(body: #"{"type":"unread","payload":{"count":3}}"#)
    XCTAssertEqual(unread?.type, "unread")
    XCTAssertEqual(unread?.unreadCount, 3)
    XCTAssertNil(QuillsWidgetPage.Message(body: #"{"type":"ready","payload":null}"#)?.payload)
    XCTAssertNil(QuillsWidgetPage.Message(body: 42))
    XCTAssertNil(QuillsWidgetPage.Message(body: "not json"))
  }
}

final class QuillsDestinationTests: XCTestCase {
  func testOpenOptionsMatchTheWebSDK() {
    XCTAssertEqual(QuillsDestination.post(id: "post_1").openOptions, ["postId": "post_1"])
    XCTAssertEqual(
      QuillsDestination.changelog(entryId: "changelog_1").openOptions,
      ["view": "changelog", "entryId": "changelog_1"])
    XCTAssertEqual(QuillsDestination.changelog().openOptions, ["view": "changelog"])
    XCTAssertEqual(
      QuillsDestination.newPost(title: "Export", body: nil, board: "ideas").openOptions,
      ["view": "new-post", "title": "Export", "board": "ideas"])
    XCTAssertEqual(QuillsDestination.help(query: "csv").openOptions, ["view": "help", "query": "csv"])
  }

  func testReadsDeepLinks() {
    func destination(_ link: String) -> QuillsDestination? {
      QuillsDestination(url: URL(string: link)!)
    }
    XCTAssertEqual(destination("myapp://feedback?quills_post=post_1"), .post(id: "post_1"))
    XCTAssertEqual(
      destination("https://app.example.test/open?quills_entry=changelog_9"),
      .changelog(entryId: "changelog_9"))
    XCTAssertEqual(
      destination("myapp://x?quills_view=new-post&quills_title=Dark%20mode"),
      .newPost(title: "Dark mode", body: nil, board: nil))
    XCTAssertEqual(destination("myapp://x?quills_view=notifications"), .notifications)
    XCTAssertNil(destination("myapp://x?quills_view=admin"))
    XCTAssertNil(destination("myapp://x"))
  }
}
