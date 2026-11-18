import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

// The live AI eval (README.md): the shipped AI paths against a real provider, on a disposable
// quills_ database. Run it with `pnpm --filter @kaneo/api eval:ai`; never in CI.
export default defineConfig({
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  test: {
    environment: "node",
    include: ["src/quills/ai-eval/**/*.eval.ts"],
    globalSetup: ["src/quills/test/global-setup.ts"],
    setupFiles: [
      "src/quills/test/worker-database.ts",
      "src/quills/ai-eval/setup.ts",
    ],
    // Few workers keep the provider's rate limit and the cost per minute low.
    maxWorkers: 3,
    testTimeout: 180_000,
    hookTimeout: 300_000,
  },
  oxc: {
    target: "node18",
  },
});
