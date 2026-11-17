import { spawnSync } from "node:child_process";

export const CONTAINER = "kaneo-demo-postgres";
export const VOLUME = "kaneo-demo-postgres-data";
export const MAILPIT = "kaneo-demo-mailpit";

const docker = (args, options = {}) =>
  spawnSync("docker", args, { encoding: "utf8", ...options });

function containerState(name) {
  const result = docker(["inspect", "-f", "{{.State.Status}}", name]);
  return result.status === 0 ? result.stdout.trim() : "missing";
}

/** Creates or starts a container. Returns true when this call started it. */
function ensure(name, runArgs, env) {
  const state = containerState(name);
  if (state === "running") return false;
  const result =
    state === "missing"
      ? docker(["run", "--detach", "--name", name, ...runArgs], { env })
      : docker(["start", name]);
  if (result.status !== 0)
    throw new Error(`Docker could not start ${name}: ${result.stderr.trim()}`);
  return true;
}

export const volumeExists = () =>
  docker(["volume", "inspect", VOLUME]).status === 0;

/** Creates or starts the demo container only. Returns true when this call started it. */
export function startContainer({ image, port, password }) {
  if (docker(["info"]).status !== 0)
    throw new Error("Docker does not answer. Start Docker and try again.");
  return ensure(
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
    { ...process.env, POSTGRES_PASSWORD: password },
  );
}

/**
 * The demo's mail catcher: Kaneo's mail goes to its SMTP port and shows in its web inbox. It keeps
 * mail in memory, so a restart empties the inbox. Returns true when this call started it.
 */
export const startMailpit = ({ image, smtp, inbox }) =>
  ensure(MAILPIT, [
    "--publish",
    `127.0.0.1:${smtp}:1025`,
    "--publish",
    `127.0.0.1:${inbox}:8025`,
    image,
  ]);

export async function waitHealthy(seconds = 120) {
  for (let second = 0; second < seconds; second++) {
    const health = docker([
      "inspect",
      "-f",
      "{{.State.Health.Status}}",
      CONTAINER,
    ]);
    if (health.stdout.trim() === "healthy") return;
    await new Promise((done) => setTimeout(done, 1000));
  }
  throw new Error(`${CONTAINER} is not healthy after ${seconds} seconds`);
}

export const stopContainer = () => docker(["stop", CONTAINER]);
export const stopMailpit = () => docker(["stop", MAILPIT]);
