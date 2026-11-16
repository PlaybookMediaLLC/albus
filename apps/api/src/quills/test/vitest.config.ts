import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

// Quills database tests. Each worker gets its own database (worker-database.ts), so files run in
// parallel. Files run in random order to find state that leaks between them; to repeat a failure,
// pass the printed seed with --sequence.seed. Run it from apps/api with QUILLS_TEST_DATABASE_URL
// set to a disposable quills_ database.
export default defineConfig({
  root: fileURLToPath(new URL("../../..", import.meta.url)),
  test: {
    environment: "node",
    include: ["src/database/quills/**/*.test.ts", "src/quills/**/*.test.ts"],
    globalSetup: ["src/quills/test/global-setup.ts"],
    setupFiles: ["src/quills/test/worker-database.ts"],
    sequence: { shuffle: { files: true, tests: false } },
  },
  oxc: {
    target: "node18",
  },
});
