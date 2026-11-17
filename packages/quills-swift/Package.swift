// swift-tools-version:5.9
import PackageDescription

// QuillsKit is plain Foundation (iOS, macOS and Linux): the widget REST client, identity and
// deep links. QuillsWidget adds the widget sheet for iOS (UIKit and WebKit).
let package = Package(
  name: "Quills",
  platforms: [.iOS(.v15), .macOS(.v12)],
  products: [
    .library(name: "QuillsKit", targets: ["QuillsKit"]),
    .library(name: "QuillsWidget", targets: ["QuillsWidget"]),
  ],
  targets: [
    .target(name: "QuillsKit"),
    .target(name: "QuillsWidget", dependencies: ["QuillsKit"]),
    .testTarget(name: "QuillsKitTests", dependencies: ["QuillsKit"]),
  ]
)
