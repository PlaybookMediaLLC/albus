//! Where a navigation goes. Web pages and iframes load in the window. Google's sign-in pages
//! go to the browser sign-in, because Google refuses embedded web views. Mail links open the mail
//! app, and other schemes (for example `file:`) do nothing.

use tauri::Url;

#[derive(Debug, PartialEq)]
pub enum Route {
    /// Load it in the window.
    App,
    /// Start the browser sign-in on the server instead.
    BrowserSignIn,
    /// Open it in the default app.
    Outside,
    /// Ignore it.
    Block,
}

pub fn route(target: &Url, server: Option<&Url>) -> Route {
    match target.scheme() {
        "tauri" | "about" | "data" | "blob" => Route::App,
        "http" | "https" if server.is_some() && is_google_sign_in(target) => Route::BrowserSignIn,
        // macOS also sends iframe loads here (YouTube embeds, the Turnstile captcha), and the URL
        // cannot tell them from a page. So web URLs load; LINK_SCRIPT sends link clicks to the
        // browser. Pages of other sites get no IPC: the capability matches the server only.
        "http" | "https" => Route::App,
        "mailto" | "tel" => Route::Outside,
        _ => Route::Block,
    }
}

/// Google's OAuth and SAML pages, directly or after a single sign-on provider.
fn is_google_sign_in(url: &Url) -> bool {
    url.host_str() == Some("accounts.google.com")
        && ["/o/oauth2/", "/o/saml2/", "/signin/oauth"]
            .iter()
            .any(|path| url.path().starts_with(path))
}

/// The schemes that the default browser or mail app may open.
pub fn opens_outside(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https" | "mailto" | "tel")
}

/// The page that starts the browser sign-in. `provider` names the sign-in page that the app replaced,
/// so a signed-in person gets the link in the browser instead.
pub fn sign_in_page(server: &Url, provider: Option<&str>) -> Url {
    let mut page = server
        .join("/quills/desktop?start=true")
        .expect("a fixed path joins any origin");
    if let Some(provider) = provider {
        page.query_pairs_mut().append_pair("provider", provider);
    }
    page
}

/// Runs in the main frame of every page: a click on a link to another site opens the default
/// browser (through `on_new_window`) instead of leaving the app.
pub const LINK_SCRIPT: &str = r#"
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0) return;
  const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
  if (!link || link.hasAttribute("download")) return;
  const url = new URL(link.href, location.href);
  if (!/^https?:$/.test(url.protocol) || url.host === location.host) return;
  event.preventDefault();
  window.open(url.href, "_blank");
});
"#;

#[cfg(test)]
mod tests {
    use super::*;

    fn url(text: &str) -> Url {
        Url::parse(text).unwrap()
    }

    #[test]
    fn loads_web_pages_iframes_and_app_pages_in_the_window() {
        let server = url("https://quills.example.com/");
        for target in [
            "https://quills.example.com/dashboard",
            "https://www.youtube.com/embed/abc",
            "https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/b/turnstile",
            "https://github.com/login/oauth/authorize?redirect_uri=https%3A%2F%2Fapi.example.com%2Fapi%2Fauth%2Fcallback%2Fgithub",
            "https://accounts.google.com/ListAccounts",
            "tauri://localhost/index.html",
            "about:blank",
            "blob:https://quills.example.com/1",
        ] {
            assert_eq!(route(&url(target), Some(&server)), Route::App, "{target}");
        }
    }

    #[test]
    fn sends_google_sign_in_to_the_browser_sign_in() {
        let server = url("https://quills.example.com/");
        for target in [
            "https://accounts.google.com/o/oauth2/v2/auth?client_id=x",
            "https://accounts.google.com/o/saml2/idp?idpid=x",
            "https://accounts.google.com/signin/oauth/consent",
        ] {
            assert_eq!(
                route(&url(target), Some(&server)),
                Route::BrowserSignIn,
                "{target}"
            );
        }
        // The picker has no server yet, so there is no sign-in page to open.
        assert_eq!(
            route(&url("https://accounts.google.com/o/oauth2/v2/auth"), None),
            Route::App
        );
    }

    #[test]
    fn opens_mail_links_outside_and_blocks_other_schemes() {
        let server = url("https://quills.example.com/");
        assert_eq!(
            route(&url("mailto:team@example.com"), Some(&server)),
            Route::Outside
        );
        assert_eq!(route(&url("tel:+15550100"), Some(&server)), Route::Outside);
        assert_eq!(
            route(&url("file:///Applications/Calculator.app"), Some(&server)),
            Route::Block
        );
        assert_eq!(
            route(&url("javascript:alert(1)"), Some(&server)),
            Route::Block
        );
        assert!(opens_outside(&url("https://example.com/")));
        assert!(!opens_outside(&url("file:///etc/passwd")));
        assert!(!opens_outside(&url("about:blank")));
    }

    #[test]
    fn builds_the_sign_in_page() {
        let server = url("https://quills.example.com/");
        assert_eq!(
            sign_in_page(&server, None).as_str(),
            "https://quills.example.com/quills/desktop?start=true"
        );
        assert_eq!(
            sign_in_page(&server, Some("google")).as_str(),
            "https://quills.example.com/quills/desktop?start=true&provider=google"
        );
    }
}
