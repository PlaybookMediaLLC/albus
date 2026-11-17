# Quills desktop app

The desktop app is a [Tauri 2](https://tauri.app) shell for the Quills web app. It loads the live
web app of one server, as [Midday](https://github.com/midday-ai/midday) does. It adds what a
browser tab cannot do: a Dock badge, native notifications, a browser sign-in for Google, and links
that open outside the app.

## Run it on your computer

You need Rust (from https://rustup.rs) and, on macOS, the Xcode command line tools.

```sh
pnpm dev:desktop          # the demo stack (pnpm dev:demo), then the app on it
pnpm dev:desktop --reset  # the same, with fresh demo data
```

The command uses a demo stack that already runs. If no stack runs, it starts one and stops it
when you close the app. The first build of the Rust code takes a few minutes. Sign in as
`portal-demo@example.test`. The password is in `~/.config/kaneo/dev-demo.env`.

The development app has its own name and identifier ("Quills Dev",
`io.playbookmedia.quills.desktop.dev`). Thus it never shares cookies or settings with an installed
app.

## Test it

```sh
pnpm --filter @quills/desktop desktop:test  # the Rust unit tests
pnpm dev:demo                               # in a second terminal, if the stack does not run
pnpm --filter @quills/desktop desktop:e2e   # the end-to-end test (macOS)
```

The **Desktop app** workflow (`.github/workflows/desktop-test.yml`) runs the Rust format, lint and
unit tests in CI when `apps/desktop` changes. The **Desktop release** workflow also builds the
macOS and Windows installers for such a pull request and keeps them as workflow artifacts. The API integration test
`tests/api-integration/desktop-session.test.ts` checks the sign-in route against real Better Auth.

The end-to-end test builds the app with the `e2e` Cargo feature and runs it in a hidden window
against the demo stack. A probe script acts in the app, and the runner checks the result:

1. When the saved server does not answer, the app says so and offers **Try again**.
2. The first start shows the server picker, connects to the typed server and saves it.
3. Google's sign-in page goes to the browser sign-in instead. The approval page opens in the system
   browser. The runner approves the code as a signed-in person, and the app signs in.
4. The session stays after a restart.
5. New windows, link clicks to other sites and mail links open outside the app. `file:`, `ssh:`
   and other schemes do nothing. An iframe of another host loads in the page, and so do a real
   YouTube embed (its player answers the IFrame API) and a real Cloudflare Turnstile captcha (it
   returns a token with Cloudflare's test key). These two checks need the internet.
6. Downloads go to the Downloads folder.
7. Native notifications, the Dock badge and zoom work. Server pages cannot use the server picker
   or the other app features.
8. Signed in, Google's sign-in page becomes the offer to link Google in the browser, and its
   button opens the link page in the system browser.
9. A second start of the app focuses the first one and exits.

The `e2e` feature is for tests only. Release builds never include it.

## How it works

| Part | File |
|---|---|
| The server picker: first screen, saved server, **Account > Change Server…** | `src/`, `src-tauri/src/server.rs` |
| Where a navigation goes | `src-tauri/src/links.rs` |
| The main window and new windows | `src-tauri/src/window.rs` |
| The menu bar | `src-tauri/src/menu.rs` |
| Updates (on only when a release build sets them) | `src-tauri/src/updates.rs` |

### The server

The app opens on a bundled page. With a saved server, the page checks that the server answers,
then loads it. If the server does not answer, the page shows the error with **Try again** and
**Change server**. When a page load shows that the server moved from `http://` to `https://` on
the same host, or to or from `www.`, the app saves the new address and moves the capability to
it. Only main-frame page loads count, so an iframe never moves the server.

### Links

- Web pages and iframes load in the window. On macOS, iframe loads go through the same navigation
  check as pages, so the app cannot block web URLs without breaking embeds and captchas.
- A click on a link to another site opens the default browser. New windows (`target="_blank"`,
  `window.open`) open the default browser too.
- Mail and phone links open the default app. Other schemes do nothing.

### Sign-in

- Email and password, email codes, GitHub, Discord and single sign-on work in the app.
- Google refuses embedded web views. When the window goes to Google's sign-in page, the app opens
  `/quills/desktop?start=true` on the server instead. That page runs the OAuth device flow:
  1. It shows a code and opens `/device` in the system browser.
  2. The person signs in there with any method and approves the code.
  3. The page gets a bearer token and sends it to `POST /api/desktop/session`.
  4. The API sets the normal session cookie in the app, and the app loads again.
- **Account > Sign In with Browser…** opens the same page.
- A person who is already signed in and goes to Google's sign-in page wants to link Google. The page
  offers **Link Google in your browser**, which opens the same page in the system browser with the
  app's user. There the browser must be signed in as that user (the page offers to switch
  accounts), and the Google link runs in the browser. The account is linked on the server, so the
  app sees it.
- The desktop session takes the identity provider's session id of the person's newest single
  sign-on session. A back-channel logout from the provider then ends the desktop session too.

`POST /api/desktop/session` reads only the `Authorization` header, so cookies and API keys cannot
mint a cookie. HTTP calls cannot ask for a one-time token: the route makes and uses it in the same
request.

### The badge and the languages

- On macOS, the Dock badge shows the unread Kaneo inbox plus the unread Quills activity of the
  active workspace. The Kaneo sidebar and the teammate app shell show it. In a browser, the badge
  makes no request.
- The menu, the update dialogs and the server picker use the system language. The app has the
  web app's 21 languages (`src-tauri/locales/`) and uses English for any other language.

### What server pages may do

Server pages are remote content. They get one capability at run time, for their own origin only:
the Dock badge, native notifications and zoom. They cannot use the file system, the opener, the
server picker or other commands. Pages of other sites get no capability. The bundled picker page
can use only its three commands and zoom.

## Release

The **Desktop release** workflow (`.github/workflows/desktop.yml`) builds a universal macOS app and
a Windows installer, and adds them to a draft GitHub release. Start it by hand. It works without
secrets, but the result is not signed. Add these to sign it and turn on updates:

| Name | Kind | Use |
|---|---|---|
| `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY` | secret | Sign the macOS app with a Developer ID certificate. |
| `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` | secret | Notarize the macOS app. `APPLE_PASSWORD` is an app-specific password. |
| `APPLE_API_KEY`, `APPLE_API_ISSUER`, `APPLE_API_PRIVATE_KEY` | secret | Notarize without a password: the key ID, the issuer ID and the `.p8` file of an App Store Connect API key with Developer access. Tauri uses `APPLE_PASSWORD` first when both are set. |
| `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | secret | Sign the update files. Make the key pair with `pnpm --filter @quills/desktop tauri signer generate`. |
| `QUILLS_DESKTOP_UPDATER_PUBKEY` | variable | The public key of that pair. |
| `QUILLS_DESKTOP_UPDATER_ENDPOINT` | variable | The URL of `latest.json`. The app must reach it without sign-in. A release of a private repository is not reachable. |

Change `version` in `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml` before each release.

## Limits

- The app needs a server that has the desktop sign-in (this fork). With an older server, Google
  sign-in does not work in the app.
- Windows has no badge: Tauri supports the badge on macOS only. Kaneo's settings pages do not show
  the badge, so it is clear while they are open.
- The app does not accept an IPv6 address as the server (Tauri's permission patterns cannot hold
  one). Use a host name.
- A move to a host other than `www.` (for example a new domain) is not followed: enter the new
  address in **Change Server…**.
- The app picks the language of the system, not the language of the Quills account.
- Windows code signing and a Linux build are not set up. The end-to-end test runs on macOS only.
