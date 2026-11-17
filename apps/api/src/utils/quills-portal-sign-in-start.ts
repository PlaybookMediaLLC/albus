import { createHash } from "node:crypto";
import { createAuthEndpoint } from "better-auth/api";
import { z } from "zod";
import { safePortalPath } from "../quills/framework/portal-sign-in";
import { portalPaths } from "../quills/portal/paths";
import {
  PORTAL_BROWSER_MAX_AGE,
  newPortalBrowser,
  portalBrowserCookie,
} from "./quills-portal-browser";

// The first step of a Quills portal token sign-in, in the browser that will be signed in
// (quills-portal-browser.ts). It sets the browser cookie and serves a small page:
// - widget: the widget frame that opened this tab, on this origin, asks the API for the one-time
//   link with this browser's state and hands it back; any other opener gets nothing.
// - sso: the page reads the workspace's login page from the public portal access route and goes
//   there, with a return address that carries the state.

export const QUILLS_PORTAL_SIGN_IN_PATH = "/quills/portal-sign-in";

// A static script, allowed by its hash: the page's values come from its meta tags.
const SCRIPT = `(function () {
  function meta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? el.getAttribute("content") || "" : "";
  }
  var state = meta("quills-state");
  var workspace = meta("quills-workspace");
  var next = meta("quills-next");
  var done = false;
  function fail() {
    if (done) return;
    done = true;
    document.getElementById("waiting").hidden = true;
    document.getElementById("failed").hidden = false;
  }
  function go(url) {
    if (done) return;
    done = true;
    location.replace(url);
  }
  setTimeout(fail, 30000);
  var api = location.pathname.slice(0, location.pathname.indexOf("/auth/quills/"));
  if (meta("quills-via") === "sso") {
    fetch(api + "/quills-public/" + encodeURIComponent(workspace) + "/portal/access", {
      credentials: "omit",
    })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (access) {
        var signIn = access && access.signIn;
        if (!signIn || signIn.mode !== "sso" || !signIn.ssoUrl) return fail();
        var back = new URLSearchParams({ workspace: workspace, state: state });
        if (next) back.set("next", next);
        var login = new URL(signIn.ssoUrl);
        login.searchParams.set(
          "return_to",
          location.origin + api + "/quills-public/signed/portal-sign-in?" + back.toString()
        );
        go(login.href);
      }, fail);
    return;
  }
  var opener = window.opener;
  if (!opener) return fail();
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (event.source !== opener || event.origin !== location.origin) return;
    if (!data || data.type !== "quills:portal-sign-in-url" || typeof data.url !== "string") return;
    var url = new URL(data.url, location.href);
    if (url.origin !== location.origin) return fail();
    window.opener = null;
    go(url.href);
  });
  opener.postMessage({ type: "quills:portal-sign-in", state: state }, location.origin);
})();`;

const HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "content-security-policy": [
    "default-src 'none'",
    `script-src 'sha256-${createHash("sha256").update(SCRIPT).digest("base64")}'`,
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ].join("; "),
  "cache-control": "no-store",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

/** The start page; the values are attribute-escaped and the script is fixed. */
export function startPage(values: {
  state: string;
  workspace: string;
  via: "widget" | "sso";
  next: string;
}) {
  const metas = (["state", "workspace", "via", "next"] as const)
    .map(
      (name) =>
        `<meta name="quills-${name}" content="${escape(values[name])}">`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Signing in</title>${metas}</head><body><p id="waiting" role="status">Signing you in…</p><p id="failed" hidden>This sign-in could not finish here. <a href="${escape(portalPaths.home(values.workspace))}">Back to the portal</a></p><script>${SCRIPT}</script></body></html>`;
}

export const quillsPortalSignInStart = createAuthEndpoint(
  QUILLS_PORTAL_SIGN_IN_PATH,
  {
    method: "GET",
    query: z.object({
      workspace: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
      via: z.enum(["widget", "sso"]),
      next: z.string().max(300).optional(),
    }),
    metadata: { isAction: false },
  },
  async (ctx) => {
    const secure = ctx.context.baseURL.startsWith("https:");
    const { browser, state } = newPortalBrowser(ctx.query.workspace);
    ctx.setCookie(portalBrowserCookie(secure), browser, {
      path: "/",
      maxAge: PORTAL_BROWSER_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure,
    });
    return new Response(
      startPage({
        state,
        workspace: ctx.query.workspace,
        via: ctx.query.via,
        next: safePortalPath(ctx.query.next),
      }),
      { headers: HEADERS },
    );
  },
);
