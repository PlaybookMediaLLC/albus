// Injected by e2e/run.mjs into every page of the main window. Only e2e builds can inject it.
// It acts like a person in the app and reports what happened to the test runner.
(() => {
  const cfg = window.__E2E__;
  if (!cfg || window.top !== window || window.__e2eProbe) return;
  window.__e2eProbe = true;

  const report = (data) =>
    fetch(cfg.report, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      body: JSON.stringify({
        scenario: cfg.scenario,
        at: location.href,
        ...data,
      }),
    }).catch(() => {});
  const once = (key) => {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  };
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const click = (href, download) => {
    const link = document.createElement("a");
    link.href = href;
    if (download) link.download = download;
    document.body.append(link);
    link.click();
    link.remove();
  };
  const invoke = async (command, args) => {
    try {
      await window.__TAURI_INTERNALS__.invoke(command, args);
      return "allowed";
    } catch (error) {
      return `refused: ${String(error).slice(0, 160)}`;
    }
  };
  const me = async () => {
    try {
      const response = await fetch(`${cfg.api}/api/user/me`, {
        credentials: "include",
      });
      const body = response.ok ? await response.json() : null;
      return {
        status: response.status,
        email: body?.email ?? body?.user?.email ?? null,
      };
    } catch (error) {
      return { status: 0, email: null, error: String(error) };
    }
  };
  /** Loads a page of another host in an iframe, as a YouTube embed or a captcha does. */
  const iframeLoads = (src) =>
    new Promise((done) => {
      const frame = document.createElement("iframe");
      frame.src = src;
      frame.onload = () => done(true);
      setTimeout(() => done(false), 8000);
      document.body.append(frame);
    });

  /** A real YouTube embed that answers the IFrame API handshake, so the player runs. */
  const youtubeRuns = () =>
    new Promise((done) => {
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube.com/embed/aqz-KE-bpKQ?enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
      frame.width = "320";
      frame.height = "180";
      let timer;
      const finish = (result) => {
        clearInterval(timer);
        window.removeEventListener("message", onMessage);
        done(result);
      };
      const onMessage = (event) => {
        if (event.origin === "https://www.youtube.com") finish(true);
      };
      window.addEventListener("message", onMessage);
      frame.onload = () => {
        timer = setInterval(
          () =>
            frame.contentWindow?.postMessage(
              JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
              "https://www.youtube.com",
            ),
          500,
        );
      };
      setTimeout(() => finish(false), 25_000);
      document.body.append(frame);
    });
  /** A real Cloudflare Turnstile widget with Cloudflare's always-pass test key. */
  const turnstileToken = () =>
    new Promise((done) => {
      const box = document.createElement("div");
      document.body.append(box);
      window.__e2eTurnstile = () =>
        window.turnstile.render(box, {
          sitekey: "1x00000000000000000000AA",
          callback: (token) => done(token),
          "error-callback": () => done(null),
        });
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__e2eTurnstile&render=explicit";
      script.onerror = () => done(null);
      document.head.append(script);
      setTimeout(() => done(null), 30_000);
    });

  async function onPicker() {
    const status = () => document.getElementById("status")?.textContent ?? "";
    await wait(300);
    report({
      page: "picker",
      form: !document.getElementById("choose")?.hidden,
      status: status(),
    });
    if (cfg.scenario === "offline") {
      for (let i = 0; i < 60 && /^(|Connecting…)$/.test(status()); i++)
        await wait(250);
      report({
        page: "picker-result",
        status: status(),
        retry: !document.getElementById("saved")?.hidden,
      });
      return;
    }
    if (cfg.scenario !== "picker" || !once("e2e:picker")) return;
    document.getElementById("address").value = cfg.web;
    document.getElementById("form").requestSubmit();
  }

  async function onServerPage(path) {
    if (path.startsWith("/auth")) {
      report({ page: "sign-in" });
      if (cfg.scenario === "signin" && once("e2e:oauth")) {
        // What the Google button does: it sends the window to Google's sign-in page.
        const callback = encodeURIComponent(
          `${cfg.api}/api/auth/callback/google`,
        );
        location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=e2e&redirect_uri=${callback}`;
      }
      return;
    }
    if (path.startsWith("/quills/desktop") && cfg.scenario === "features") {
      // Signed in, so Google's page became the offer to link Google in the browser.
      await wait(800);
      const offer = [...document.querySelectorAll("button")].find((button) =>
        /link google in your browser/i.test(button.textContent ?? ""),
      );
      offer?.click();
      report({
        page: "google-link-offer",
        status: document.querySelector('[role="status"]')?.textContent ?? null,
        offered: Boolean(offer),
      });
      return;
    }
    if (path.startsWith("/quills/desktop")) {
      await wait(800);
      report({
        page: "desktop-sign-in",
        heading: document.querySelector("h1")?.textContent ?? null,
        code:
          document.querySelector('[aria-label="Sign-in code"]')?.textContent ??
          null,
      });
      return;
    }
    const user = await me();
    report({ page: "app", path, me: user.status, email: user.email });
    if (cfg.scenario !== "features" || !once("e2e:features")) return;

    window.open("https://example.com/e2e-popup", "_blank");
    click("https://example.com/e2e-link");
    click("mailto:team@example.com");
    click("file:///System/Applications/Calculator.app");
    click("ssh://e2e.example");
    click(
      URL.createObjectURL(new Blob(["quills e2e"], { type: "text/plain" })),
      "e2e-report.txt",
    );
    // Another host on the same stack: 127.0.0.1 pages, a localhost iframe.
    const frameSrc = `${new URL(cfg.web).protocol}//localhost:${new URL(cfg.web).port}/e2e-frame`;
    const [frame, youtube, turnstile] = await Promise.all([
      iframeLoads(frameSrc),
      youtubeRuns(),
      turnstileToken(),
    ]);
    await wait(1500);
    report({
      page: "features",
      stayed: location.pathname === path,
      frame,
      frameSrc,
      youtube,
      turnstile,
      notification: {
        polyfilled:
          typeof window.Notification === "function" &&
          !/\[native code\]/.test(String(window.Notification)),
        permission: window.Notification?.permission ?? null,
        acl: await invoke("plugin:notification|is_permission_granted", {}),
      },
      badge: await invoke("plugin:window|set_badge_count", {
        label: "main",
        value: 3,
      }),
      badgeClear: await invoke("plugin:window|set_badge_count", {
        label: "main",
        value: null,
      }),
      zoom: await invoke("plugin:webview|set_webview_zoom", {
        label: "main",
        value: 1,
      }),
      connect: await invoke("connect", { address: "https://attacker.example" }),
      opener: await invoke("plugin:opener|open_url", {
        url: "https://example.com/opener",
      }),
    });
    // What "Link Google" does in the account settings: it sends the window to Google.
    const callback = encodeURIComponent(`${cfg.api}/api/auth/callback/google`);
    location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=e2e&redirect_uri=${callback}`;
  }

  function start() {
    if (
      location.protocol === "tauri:" ||
      location.hostname === "tauri.localhost"
    ) {
      void onPicker();
      return;
    }
    if (location.origin !== new URL(cfg.web).origin) return;
    report({ page: "loaded", path: location.pathname + location.search });
    // The web app routes in the page, so act when the path has not changed for one second.
    let last = null;
    let since = 0;
    let handled = null;
    setInterval(() => {
      const path = location.pathname;
      if (path !== last) {
        last = path;
        since = Date.now();
      } else if (path !== handled && Date.now() - since >= 1000) {
        handled = path;
        void onServerPage(path);
      }
    }, 250);
  }

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();
