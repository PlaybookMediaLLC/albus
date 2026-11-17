#!/usr/bin/env node
// The desktop app's end-to-end test (macOS). It builds the app with the e2e hooks, runs it
// hidden against the local demo stack and checks each flow. Start the stack first: pnpm dev:demo.
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { createServer } from "node:http";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readEnv, secretsFile } from "../../../scripts/dev-demo/secrets.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const desktop = resolve(here, "..");
const id = "io.playbookmedia.quills.desktop.e2e";
const web = process.env.E2E_WEB_URL ?? "http://127.0.0.1:5190";
const api = process.env.E2E_API_URL ?? "http://127.0.0.1:1390";
const email = "portal-demo@example.test";
const binary = join(
  desktop,
  "src-tauri/target/debug/bundle/macos/Quills E2E.app/Contents/MacOS/quills-desktop",
);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const results = [];

function fail(message) {
  console.error(`[e2e] ${message}`);
  process.exit(1);
}

function check(name, passed, detail = "") {
  results.push({ name, passed: Boolean(passed), detail });
  console.log(
    `[e2e] ${passed ? "PASS" : "FAIL"} ${name}${detail && !passed ? ` (${detail})` : ""}`,
  );
}

// Everything the e2e app identifier keeps on disk: cookies, caches, settings and window state.
function wipe() {
  const library = join(homedir(), "Library");
  for (const path of [
    join(library, "WebKit", id),
    join(library, "Caches", id),
    join(library, "HTTPStorages", id),
    join(library, "HTTPStorages", `${id}.binarycookies`),
    join(library, "Application Support", id),
    join(library, "Saved Application State", `${id}.savedState`),
  ])
    rmSync(path, { recursive: true, force: true });
}

async function answers(url) {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
}

async function until(read, ms, what) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const value = read();
    if (value) return value;
    await sleep(250);
  }
  throw new Error(`timed out waiting for ${what}`);
}

/** Approves a device code the way a signed-in person does on the /device page. */
async function approve(userCode, password) {
  const headers = { origin: web, "content-type": "application/json" };
  const signIn = await fetch(`${api}/api/auth/sign-in/email`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });
  const cookie = signIn.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  const claim = await fetch(
    `${api}/api/auth/device?user_code=${encodeURIComponent(userCode)}`,
    {
      headers: { origin: web, cookie },
    },
  );
  const approval = await fetch(`${api}/api/auth/device/approve`, {
    method: "POST",
    headers: { ...headers, cookie },
    body: JSON.stringify({ userCode }),
  });
  return [signIn.status, claim.status, approval.status];
}

async function main() {
  if (process.platform !== "darwin")
    fail("The desktop e2e test runs on macOS only.");
  if (!(await answers(`${api}/api/health`)) || !(await answers(`${web}/`)))
    fail(
      `The demo stack does not answer at ${web}. Start it first: pnpm dev:demo`,
    );
  const password = readEnv(secretsFile).QUILLS_DEMO_PASSWORD;
  if (!password)
    fail(`No QUILLS_DEMO_PASSWORD in ${secretsFile}. Run pnpm dev:demo once.`);

  console.log("[e2e] Building the app with the e2e hooks");
  const build = spawnSync(
    "pnpm",
    [
      "exec",
      "tauri",
      "build",
      "--debug",
      "--bundles",
      "app",
      "--features",
      "e2e",
      "--config",
      JSON.stringify({ identifier: id, productName: "Quills E2E" }),
    ],
    { cwd: desktop, stdio: "inherit" },
  );
  if (build.status !== 0 || !existsSync(binary)) fail("The e2e build failed.");

  const work = mkdtempSync(join(tmpdir(), "quills-desktop-e2e-"));
  const logFile = join(work, "opened.log");
  const downloads = join(work, "downloads");
  mkdirSync(downloads);
  const reports = [];
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      if (request.url === "/report")
        try {
          reports.push(JSON.parse(body));
        } catch {}
      response.end();
    });
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const report = `http://127.0.0.1:${server.address().port}/report`;
  const opened = () =>
    existsSync(logFile)
      ? readFileSync(logFile, "utf8").split("\n").filter(Boolean)
      : [];
  const seen = (scenario, page, test = () => true) =>
    reports.find(
      (entry) =>
        entry.scenario === scenario && entry.page === page && test(entry),
    );
  const apps = [];

  function launch(scenario, extra = {}) {
    const env = {
      ...process.env,
      QUILLS_DESKTOP_E2E_HIDDEN: "1",
      QUILLS_DESKTOP_E2E_PROBE: join(here, "probe.js"),
      QUILLS_DESKTOP_E2E_CONFIG: JSON.stringify({ scenario, report, web, api }),
      QUILLS_DESKTOP_E2E_LOG: logFile,
      QUILLS_DESKTOP_E2E_DOWNLOADS: downloads,
    };
    delete env.QUILLS_DESKTOP_SERVER_URL;
    Object.assign(env, extra);
    const app = spawn(binary, [], { env, stdio: ["ignore", "pipe", "pipe"] });
    app.output = "";
    app.stdout.on("data", (chunk) => (app.output += chunk));
    app.stderr.on("data", (chunk) => (app.output += chunk));
    app.exited = new Promise((done) => app.once("exit", done));
    apps.push(app);
    return app;
  }

  async function quit(app) {
    if (app.exitCode !== null || app.signalCode !== null) return;
    app.kill("SIGTERM");
    await Promise.race([app.exited, sleep(5000)]);
    if (app.exitCode === null && app.signalCode === null) app.kill("SIGKILL");
  }

  async function scenario(name, body) {
    try {
      await body();
    } catch (error) {
      check(`${name}: completes`, false, error.message);
    }
  }

  wipe();
  try {
    await scenario("offline", async () => {
      const app = launch("offline", {
        QUILLS_DESKTOP_SERVER_URL: "http://127.0.0.1:9",
      });
      const result = await until(
        () => seen("offline", "picker-result"),
        30_000,
        "the connection error",
      );
      // The text is in the system language; the host and the retry button are not.
      check(
        "explains when the server does not answer",
        result.status.includes("127.0.0.1:9") && result.retry,
        JSON.stringify(result),
      );
      await quit(app);
    });

    await scenario("picker", async () => {
      const app = launch("picker");
      check(
        "shows the server picker on the first run",
        await until(() => seen("picker", "picker"), 30_000, "the picker"),
      );
      const signIn = await until(
        () => seen("picker", "sign-in"),
        30_000,
        "the server's sign-in page",
      );
      check("connects to the typed server", signIn.at.startsWith(web));
      await quit(app);
      const saved = readFileSync(
        join(homedir(), "Library/Application Support", id, "server"),
        "utf8",
      );
      check("remembers the server", saved === `${web}/`, saved);
    });

    await scenario("signin", async () => {
      const app = launch("signin");
      check(
        "opens the saved server",
        await until(
          () => seen("signin", "sign-in"),
          30_000,
          "the sign-in page",
        ),
      );
      const page = await until(
        () => seen("signin", "desktop-sign-in"),
        30_000,
        "the desktop sign-in page",
      );
      check(
        "sends a social sign-in to the browser sign-in page",
        page.heading === "Sign in to the desktop app",
        page.heading,
      );
      const approval = await until(
        () => opened().find((line) => line.includes("/device?user_code=")),
        30_000,
        "the approval page",
      );
      check(
        "opens the approval page in the system browser",
        approval.startsWith(`${web}/device?user_code=`),
        approval,
      );
      const statuses = await approve(
        new URL(approval).searchParams.get("user_code"),
        password,
      );
      check(
        "approves the code in the browser",
        statuses.every((status) => status === 200),
        statuses.join(","),
      );
      const signedIn = await until(
        () => seen("signin", "app", (entry) => entry.me === 200),
        45_000,
        "the signed-in app",
      );
      check(
        "signs in to the app after the approval",
        signedIn.email === email,
        signedIn.email,
      );
      await quit(app);
    });

    await scenario("features", async () => {
      const app = launch("features");
      const first = await until(
        () =>
          reports.find(
            (entry) =>
              entry.scenario === "features" &&
              ["app", "sign-in"].includes(entry.page),
          ),
        30_000,
        "the first page",
      );
      check(
        "keeps the session after a restart",
        first.page === "app" && first.me === 200,
        JSON.stringify(first),
      );
      const features = await until(
        () => seen("features", "features"),
        45_000,
        "the feature checks",
      );
      const lines = opened();
      check(
        "opens new windows in the system browser",
        lines.includes("https://example.com/e2e-popup"),
      );
      check(
        "opens outside links in the system browser",
        lines.includes("https://example.com/e2e-link"),
      );
      check("keeps the app page after an outside link", features.stayed);
      check(
        "opens mail links in the mail app",
        lines.includes("mailto:team@example.com"),
      );
      // WebKit refuses file: from a web page before the app sees it; ssh: reaches the app.
      check(
        "blocks file and other app links",
        lines.includes("blocked:ssh://e2e.example") &&
          !lines.some((line) => /^(file|ssh):/.test(line)),
        lines.join(" "),
      );
      check(
        "loads iframes of other hosts in the page",
        features.frame && !lines.some((line) => line.includes("/e2e-frame")),
        `${features.frameSrc} loaded: ${features.frame}`,
      );
      check("allows zoom", features.zoom === "allowed", features.zoom);
      // Real embeds need the internet: YouTube's player and Cloudflare's Turnstile captcha.
      check(
        "runs a real YouTube embed in the page",
        features.youtube && !lines.some((line) => line.includes("youtube.com")),
        String(features.youtube),
      );
      check(
        "runs a real Turnstile captcha in the page",
        typeof features.turnstile === "string" &&
          features.turnstile.length > 0 &&
          !lines.some((line) => line.includes("cloudflare.com")),
        String(features.turnstile),
      );
      const saved = join(downloads, "e2e-report.txt");
      check(
        "saves downloads",
        existsSync(saved) && readFileSync(saved, "utf8") === "quills e2e",
        readdirSync(downloads).join(", ") || "no files",
      );
      check(
        "uses native notifications",
        features.notification.polyfilled &&
          features.notification.acl === "allowed",
        JSON.stringify(features.notification),
      );
      check(
        "sets the Dock badge",
        features.badge === "allowed" && features.badgeClear === "allowed",
        `${features.badge} / ${features.badgeClear}`,
      );
      check(
        "refuses the server picker to server pages",
        features.connect.startsWith("refused"),
        features.connect,
      );
      check(
        "refuses other app features to server pages",
        features.opener.startsWith("refused"),
        features.opener,
      );

      const offer = await until(
        () => seen("features", "google-link-offer"),
        30_000,
        "the Google link offer",
      );
      const linkPage = await until(
        () =>
          opened().find((line) =>
            line.includes("/quills/desktop?link=google&user="),
          ),
        15_000,
        "the Google link page in the browser",
      );
      check(
        "sends a Google link from the app to the browser",
        offer.offered &&
          linkPage.startsWith(`${web}/quills/desktop?link=google&user=`),
        JSON.stringify({ offer, linkPage }),
      );

      const second = launch("single");
      const code = await Promise.race([
        second.exited,
        sleep(15_000).then(() => "running"),
      ]);
      check(
        "lets only one copy run",
        code !== "running" && app.exitCode === null,
        `second copy: ${code}`,
      );
      check("focuses the running copy", opened().includes("event:focus"));
      await quit(second);
      await quit(app);
    });
  } finally {
    if (results.some((result) => !result.passed))
      console.log(`[e2e] opened:\n${opened().join("\n")}`);
    for (const app of apps) await quit(app);
    server.close();
    wipe();
    rmSync(work, { recursive: true, force: true });
  }

  const failed = results.filter((result) => !result.passed);
  console.log(
    `[e2e] ${results.length - failed.length} passed, ${failed.length} failed`,
  );
  if (failed.length) {
    console.log(
      `[e2e] reports:\n${reports
        .map((entry) => JSON.stringify(entry))
        .join("\n")
        .slice(-6000)}`,
    );
    console.log(`[e2e] opened:\n${opened().join("\n")}`);
    for (const app of apps)
      if (app.output.trim())
        console.log(`[e2e] app output:\n${app.output.slice(-3000)}`);
    process.exit(1);
  }
}

main().catch((error) => fail(error.stack ?? String(error)));
