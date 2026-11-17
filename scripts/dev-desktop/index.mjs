#!/usr/bin/env node
// pnpm dev:desktop [--reset]: the seeded demo stack (pnpm dev:demo) and the desktop app on it.
// A demo stack that already runs is used as it is; a stack that this script starts stops with it.
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { PORTS } from "../dev-demo/lib.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const web = `http://127.0.0.1:${PORTS.web}`;
const api = `http://127.0.0.1:${PORTS.api}`;
const children = [];
let stopping = false;

const log = (line) => console.log(`[desktop] ${line}`);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function answers(url) {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(3000) })).ok;
  } catch {
    return false;
  }
}

const stackUp = async () =>
  (await answers(`${api}/api/health`)) && (await answers(`${web}/`));

/** Starts a command in its own process group, so a stop also reaches what it starts. */
function run(name, command, args, env = process.env) {
  const child = spawn(command, args, {
    cwd: root,
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [child.stdout, child.stderr])
    createInterface({ input: stream }).on("line", (line) =>
      console.log(line.startsWith("[") ? line : `[${name}] ${line}`),
    );
  child.exited = new Promise((done) => child.once("exit", done));
  children.push(child);
  return child;
}

function signal(child, name) {
  try {
    process.kill(-child.pid, name);
    return true;
  } catch {
    return false;
  }
}

async function stop(code) {
  if (stopping) return;
  stopping = true;
  log("Stopping");
  // The newest first: the desktop app, then the demo stack, which cleans up after itself.
  for (const child of [...children].reverse()) {
    signal(child, "SIGTERM");
    for (let wait = 0; wait < 40 && signal(child, 0); wait++) await sleep(500);
    signal(child, "SIGKILL");
  }
  process.exit(code);
}

async function main() {
  const reset = process.argv.includes("--reset");
  if (spawnSync("cargo", ["--version"], { stdio: "ignore" }).status !== 0)
    throw new Error(
      "The desktop app needs Rust. Install it from https://rustup.rs and try again.",
    );

  if (await stackUp()) {
    if (reset)
      log(
        "The demo stack already runs, so --reset does nothing. Stop it to reseed.",
      );
    log(`Using the demo stack that already runs at ${web}`);
  } else {
    log("Starting the demo stack (pnpm dev:demo)");
    const demo = run("demo", process.execPath, [
      "scripts/dev-demo/index.mjs",
      ...(reset ? ["--reset"] : []),
    ]);
    // The demo seeds the workspace after the API answers, then prints "[demo] Ready".
    const ready = new Promise((done) => {
      for (const stream of [demo.stdout, demo.stderr])
        createInterface({ input: stream }).on(
          "line",
          (line) => line.includes("[demo] Ready") && done(),
        );
    });
    // dev:demo has its own start timeouts, and it stops when one runs out.
    await Promise.race([ready, demo.exited]);
    if (demo.exitCode !== null)
      throw new Error("The demo stack stopped. Read its output above.");
  }

  log(
    `Opening the desktop app on ${web}. The first build of the Rust code takes a few minutes.`,
  );
  log(
    "Sign in as portal-demo@example.test. The password is in ~/.config/kaneo/dev-demo.env.",
  );
  const desktop = run(
    "desktop",
    "pnpm",
    ["--filter", "@quills/desktop", "desktop:dev"],
    {
      ...process.env,
      QUILLS_DESKTOP_SERVER_URL: web,
    },
  );
  const code = await desktop.exited;
  if (!stopping) {
    log(`The desktop app closed (exit code ${code})`);
    void stop(code ?? 0);
  }
}

process.on("SIGINT", () => void stop(0));
process.on("SIGTERM", () => void stop(0));
process.on("SIGHUP", () => void stop(0));
main().catch((error) => {
  console.error(`[desktop] ${error.message}`);
  void stop(1);
});
