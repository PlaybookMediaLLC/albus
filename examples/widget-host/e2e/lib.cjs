// Shared helpers for the widget E2E driver: SQL evidence, TypeID→UUID, network capture.
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");

const env = Object.fromEntries(
  fs
    .readFileSync(os.homedir() + "/.config/kaneo/dev-demo.env", "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const WS = "quills_portal_demo";
const API = "http://127.0.0.1:1390";
const WEB = "http://127.0.0.1:5190";
const HOST = "http://127.0.0.1:5290";

// Local psql against the demo port, or psql inside the demo container when there is no local client.
function sql(query) {
  const args = ["-U", "kaneo", "-d", "kaneo", "-At", "-F", "\t", "-c", query];
  const options = {
    env: { ...process.env, PGPASSWORD: env.POSTGRES_PASSWORD },
    encoding: "utf8",
  };
  let out;
  try {
    out = execFileSync(
      "psql",
      ["-h", "127.0.0.1", "-p", "54480", ...args],
      options,
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    out = execFileSync(
      "docker",
      ["exec", "kaneo-demo-postgres", "psql", ...args],
      options,
    );
  }
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("\t"));
}
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
function toUuid(typeId) {
  const suffix = typeId.slice(typeId.lastIndexOf("_") + 1);
  let n = 0n;
  for (const c of suffix) n = n * 32n + BigInt(ALPHABET.indexOf(c));
  const h = n.toString(16).padStart(32, "0");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
function fromUuid(prefix, uuid) {
  let n = BigInt("0x" + uuid.replace(/-/g, ""));
  let out = "";
  for (let i = 0; i < 26; i++) {
    out = ALPHABET[Number(n % 32n)] + out;
    n /= 32n;
  }
  return `${prefix}_${out}`;
}
if (
  fromUuid("post", "01890a5d-ac96-774b-bcce-b302099a8057") !==
  "post_01h455vb4pex5vsknk084sn02q"
)
  throw new Error("fromUuid");
if (
  toUuid("post_01h455vb4pex5vsknk084sn02q") !==
  "01890a5d-ac96-774b-bcce-b302099a8057"
)
  throw new Error("toUuid");

/** Records every Quills API response the page or its iframe receives. */
function captureNetwork(page) {
  const calls = [];
  page.on("response", async (res) => {
    const url = res.url();
    if (!url.includes("/api/quills-public/")) return;
    const req = res.request();
    const entry = {
      method: req.method(),
      path: new URL(url).pathname.replace(`/api/quills-public/${WS}`, ""),
      status: res.status(),
      body: null,
      request: null,
    };
    try {
      entry.request = req.postDataJSON();
    } catch {}
    if (req.method() !== "GET" || /identify|session/.test(url))
      entry.body = await res.json().catch(() => null);
    calls.push(entry);
  });
  return {
    calls,
    find: (method, re) =>
      calls.filter((c) => c.method === method && re.test(c.path)),
    async wait(method, re, timeout = 15000, since = 0) {
      const end = Date.now() + timeout;
      while (Date.now() < end) {
        const hit = calls
          .slice(since)
          .find((c) => c.method === method && re.test(c.path));
        if (hit) return hit;
        await new Promise((r) => setTimeout(r, 100));
      }
      throw new Error(`no ${method} ${re} response`);
    },
    mark: () => calls.length,
  };
}

/** The principal and customer of a principal UUID. */
function person(principalUuid) {
  const [row] = sql(
    `select p.id, p.type, c.external_id, c.email, c.is_anonymous from quills.principal p join quills.customer_identity c on c.id = p.user_id where p.id = ${q(principalUuid)}`,
  );
  return (
    row && {
      principal: row[0],
      type: row[1],
      sub: row[2] || null,
      email: row[3] || null,
      anonymous: row[4] === "t",
    }
  );
}
function principalOfSub(sub) {
  const [row] = sql(
    `select p.id from quills.principal p join quills.customer_identity c on c.id = p.user_id where c.external_id = ${q(sub)}`,
  );
  return row?.[0];
}
/** Outbox events for an entity UUID or TypeID. */
function outbox(entityIds, since) {
  const ids = entityIds.map(q).join(",");
  return sql(
    `select id, event_id, type, entity_type, entity_id, actor_type, actor_id from quills.events where entity_id in (${ids}) ${since ? `and occurred_at >= ${q(since)}` : ""} order by id`,
  ).map((r) => ({
    id: r[0],
    eventId: r[1],
    type: r[2],
    entityType: r[3],
    entityId: r[4],
    actorType: r[5],
    actorId: r[6],
  }));
}

module.exports = {
  sql,
  q,
  toUuid,
  fromUuid,
  captureNetwork,
  person,
  principalOfSub,
  outbox,
  env,
  WS,
  API,
  WEB,
  HOST,
};

/** A Playwright request context signed in as the demo teammate. */
async function teammate(playwright) {
  const ctx = await playwright.request.newContext({
    extraHTTPHeaders: { Origin: WEB },
  });
  const res = await ctx.post(`${API}/api/auth/sign-in/email`, {
    data: {
      email: "portal-demo@example.test",
      password: env.QUILLS_DEMO_PASSWORD,
    },
  });
  if (!res.ok()) throw new Error(`teammate sign-in ${res.status()}`);
  return ctx;
}
module.exports.teammate = teammate;
