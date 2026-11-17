import { spawnSync } from "node:child_process";

export const CONTAINER = "kaneo-demo-postgres";
export const VOLUME = "kaneo-demo-postgres-data";
export const MAIL_CONTAINER = "kaneo-demo-mailpit";
export const MAIL_IMAGE = "axllent/mailpit:v1.27.0";

const docker = (args, options = {}) =>
  spawnSync("docker", args, { encoding: "utf8", ...options });

function containerState(name) {
  const result = docker(["inspect", "-f", "{{.State.Status}}", name]);
  return result.status === 0 ? result.stdout.trim() : "missing";
}

export const volumeExists = () =>
  docker(["volume", "inspect", VOLUME]).status === 0;

/** Creates (with `runArgs`) or starts the named container. Returns true when this call started it. */
function ensureContainer(name, runArgs, options) {
  if (docker(["info"]).status !== 0)
    throw new Error("Docker does not answer. Start Docker and try again.");
  const state = containerState(name);
  if (state === "running") return false;
  const result =
    state === "missing"
      ? docker(["run", "--detach", "--name", name, ...runArgs], options)
      : docker(["start", name]);
  if (result.status !== 0)
    throw new Error(`Docker could not start ${name}: ${result.stderr.trim()}`);
  return true;
}

/** Creates or starts the demo database container only. Returns true when this call started it. */
export const startContainer = ({ image, port, password }) =>
  ensureContainer(
    CONTAINER,
    [
      "--publish",
      `127.0.0.1:${port}:5432`,
      "--volume",
      `${VOLUME}:/var/lib/postgresql/data`,
      "--env",
      "POSTGRES_USER=kaneo",
      "--env",
      "POSTGRES_DB=kaneo",
      // The value comes from this process, so it is not in the command line.
      "--env",
      "POSTGRES_PASSWORD",
      "--health-cmd",
      "pg_isready -U kaneo -d kaneo",
      "--health-interval",
      "2s",
      "--health-retries",
      "60",
      image,
    ],
    { env: { ...process.env, POSTGRES_PASSWORD: password } },
  );

/** Creates or starts the demo mail catcher (SMTP and inbox, loopback only). The image has its own health check. */
export const startMailContainer = ({ smtp, inbox }) =>
  ensureContainer(MAIL_CONTAINER, [
    "--publish",
    `127.0.0.1:${smtp}:1025`,
    "--publish",
    `127.0.0.1:${inbox}:8025`,
    MAIL_IMAGE,
  ]);

export async function waitHealthy(name = CONTAINER, seconds = 120) {
  for (let second = 0; second < seconds; second++) {
    const health = docker(["inspect", "-f", "{{.State.Health.Status}}", name]);
    if (health.stdout.trim() === "healthy") return;
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error(`${name} is not healthy after ${seconds} seconds`);
}

export const stopContainer = (name = CONTAINER) => docker(["stop", name]);
