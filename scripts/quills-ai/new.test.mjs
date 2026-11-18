import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { scaffold, scaffoldApi } from "./new.mjs";

const repo = fileURLToPath(new URL("../..", import.meta.url));
/** A throwaway root with the package manifest, so the real repository is never touched. */
function root() {
  const dir = mkdtempSync(join(tmpdir(), "quills-ai-"));
  cpSync(
    join(repo, "packages/quills-ai/package.json"),
    join(dir, "packages/quills-ai/package.json"),
    { recursive: true },
  );
  return dir;
}

test("writes the definition, its test, the eval and the exports", () => {
  const dir = root();
  scaffold(dir, "reply-tone", { role: "deep" });
  const definition = readFileSync(
    join(dir, "packages/quills-ai/src/capabilities/reply-tone.ts"),
    "utf8",
  );
  assert.match(definition, /export const replyTone = defineCapability\(\{/);
  assert.match(definition, /role: "deep"/);
  assert.match(definition, /step: "reply_tone"/);
  assert.ok(
    existsSync(
      join(dir, "packages/quills-ai/src/capabilities/reply-tone.test.ts"),
    ),
  );
  assert.match(
    readFileSync(
      join(dir, "apps/api/src/quills/ai-eval/reply-tone.eval.ts"),
      "utf8",
    ),
    /capabilitySuite\(replyTone,/,
  );
  assert.equal(
    readFileSync(
      join(dir, "packages/quills-ai/src/capabilities/index.ts"),
      "utf8",
    ),
    'export { replyTone } from "./reply-tone.js";\n',
  );
  const manifest = JSON.parse(
    readFileSync(join(dir, "packages/quills-ai/package.json"), "utf8"),
  );
  assert.equal(
    manifest.exports["./capabilities"].default,
    "./dist/capabilities/index.js",
  );
});

test("never overwrites, and refuses bad names and roles", () => {
  const dir = root();
  scaffold(dir, "reply-tone");
  assert.throws(() => scaffold(dir, "reply-tone"), /exists/);
  assert.throws(() => scaffold(dir, "Reply Tone"), /kebab-case/);
  assert.throws(() => scaffold(dir, "other", { role: "huge" }), /--role/);
});

test("writes a read tool, a write tool and a job, and names the registration step", () => {
  const dir = root();
  const tool = scaffoldApi(dir, "tool", "find-customer");
  assert.match(
    readFileSync(
      join(dir, "apps/api/src/quills/assistant/tools/find-customer.ts"),
      "utf8",
    ),
    /name: "find_customer"/,
  );
  assert.match(tool.next, /TOOL_NAMES/);
  scaffoldApi(dir, "write-tool", "close-ticket");
  assert.match(
    readFileSync(
      join(dir, "apps/api/src/quills/assistant/tools/close-ticket.ts"),
      "utf8",
    ),
    /approval: "required"/,
  );
  const job = scaffoldApi(dir, "job", "summarize-call");
  assert.match(
    readFileSync(
      join(dir, "apps/api/src/quills/assistant/engine/summarize-call.ts"),
      "utf8",
    ),
    /defineAiJob\(\{/,
  );
  assert.match(job.next, /assistantWork/);
  assert.throws(() => scaffoldApi(dir, "agent", "x"), /Use capability/);
});

test("leaves no placeholder in any generated file", () => {
  const dir = root();
  const files = [
    ...scaffold(dir, "reply-tone", { role: "deep" }),
    ...scaffoldApi(dir, "tool", "find-customer").created,
    ...scaffoldApi(dir, "write-tool", "close-ticket").created,
    ...scaffoldApi(dir, "job", "summarize-call").created,
  ];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, /\{\{|undefined/, file);
  }
  assert.throws(
    () => scaffold(dir, "x", { step: "s".repeat(31) }),
    /30 characters/,
  );
});
