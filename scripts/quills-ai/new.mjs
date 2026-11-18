#!/usr/bin/env node
// Scaffolds Quills AI building blocks (apps/api/src/quills/assistant/ai/README.md):
//   node scripts/quills-ai/new.mjs capability <kebab-name> [--role fast|deep] [--step <usage_step>]
//   node scripts/quills-ai/new.mjs tool <kebab-name>         a read tool
//   node scripts/quills-ai/new.mjs write-tool <kebab-name>   a write tool with an approval policy
//   node scripts/quills-ai/new.mjs job <kebab-name>          an AI job (read, model, write)
// It never overwrites a file, and it prints the registration step for a tool or a job.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const here = dirname(fileURLToPath(import.meta.url));

const checkName = (name) => {
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name))
    throw new Error(
      `Use a kebab-case name, for example reply-tone (got "${name}")`,
    );
};
const camelOf = (name) =>
  name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const writeAll = (files, values) => {
  for (const [path] of files)
    if (existsSync(path)) throw new Error(`${path} exists; pick another name`);
  for (const [path, template] of files) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(
      path,
      readFileSync(join(here, "templates", template), "utf8").replace(
        /\{\{(\w+)\}\}/g,
        (_, key) => values[key],
      ),
    );
  }
};

/** A tool or a job in the API. Returns the files and the registration step to print. */
export function scaffoldApi(root, kind, name) {
  checkName(name);
  const values = {
    name,
    camel: camelOf(name),
    snake: name.replaceAll("-", "_"),
  };
  const assistant = join(root, "apps/api/src/quills/assistant");
  if (kind === "job") {
    const files = [[join(assistant, `engine/${name}.ts`), "job.ts.tpl"]];
    writeAll(files, values);
    return {
      created: files.map(([path]) => path),
      next: `add "<event type>": ${values.camel} to assistantWork in engine/index.ts, list the event in events.ts, and cover the job in a database test`,
    };
  }
  if (kind !== "tool" && kind !== "write-tool")
    throw new Error("Use capability, tool, write-tool or job");
  const files = [
    [
      join(assistant, `tools/${name}.ts`),
      kind === "tool" ? "tool.ts.tpl" : "write-tool.ts.tpl",
    ],
    [join(assistant, `tools/${name}.test.ts`), "tool.test.ts.tpl"],
  ];
  writeAll(files, values);
  return {
    created: files.map(([path]) => path),
    next: `add "${values.snake}" to TOOL_NAMES and ${values.camel} to ${kind === "tool" ? "readTools" : "writeTools"} in tools/index.ts, then add an eval case that expects the call (ai-eval/copilot.eval.ts)`,
  };
}

export function scaffold(root, name, { role = "fast", step } = {}) {
  checkName(name);
  if (role !== "fast" && role !== "deep")
    throw new Error("Use --role fast or --role deep");
  const usageStep = step ?? name.replaceAll("-", "_");
  if (usageStep.length > 30)
    throw new Error("The usage step has at most 30 characters");
  const camel = camelOf(name);
  const values = { name, camel, role, step: usageStep };
  const pkg = join(root, "packages/quills-ai");
  const files = [
    [join(pkg, `src/capabilities/${name}.ts`), "capability.ts.tpl"],
    [join(pkg, `src/capabilities/${name}.test.ts`), "capability.test.ts.tpl"],
    [join(root, `apps/api/src/quills/ai-eval/${name}.eval.ts`), "eval.ts.tpl"],
  ];
  writeAll(files, values);

  const index = join(pkg, "src/capabilities/index.ts");
  const line = `export { ${camel} } from "./${name}.js";\n`;
  writeFileSync(
    index,
    (existsSync(index) ? readFileSync(index, "utf8") : "") + line,
  );

  const manifestPath = join(pkg, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest.exports["./capabilities"]) {
    manifest.exports["./capabilities"] = {
      types: "./dist/capabilities/index.d.ts",
      default: "./dist/capabilities/index.js",
    };
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  return [...files.map(([path]) => path), index];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: { role: { type: "string" }, step: { type: "string" } },
  });
  const [kind, name] = positionals;
  if (positionals.length !== 2) {
    console.error(
      "Usage: node scripts/quills-ai/new.mjs capability|tool|write-tool|job <kebab-name> [--role fast|deep] [--step <usage_step>]",
    );
    process.exit(2);
  }
  try {
    const root = join(here, "../..");
    if (kind === "capability") {
      for (const path of scaffold(root, name, values))
        console.log(`WROTE ${path}`);
      console.log(
        "NEXT replace every TODO(quills-ai) marker, call runCapability(capability, input) or ai.capability in a job and write its entry with logUsage, then run: pnpm --filter @quills/ai test",
      );
    } else {
      const { created, next } = scaffoldApi(root, kind, name);
      for (const path of created) console.log(`WROTE ${path}`);
      console.log(`NEXT replace every TODO(quills-ai) marker, ${next}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
