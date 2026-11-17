import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
// This app is outside the pnpm workspace: it uses its own vite, not the repository's vite-plus.
// oxlint-disable-next-line vite-plus/prefer-vite-plus-imports
import { defineConfig, loadEnv, type UserConfig } from "vite";

export default defineConfig(({ mode }): UserConfig => {
  // Server-only: QUILLS_* values reach process.env for the server function, never the browser bundle.
  Object.assign(process.env, loadEnv(mode, process.cwd(), "QUILLS_"));
  return {
    server: { host: "127.0.0.1", port: 5290, strictPort: true },
    preview: { host: "127.0.0.1", port: 5290, strictPort: true },
    // @quills/widget is linked from packages/widget, which has its own React for its tests.
    resolve: { dedupe: ["react", "react-dom"] },
    plugins: [tanstackStart(), viteReact()],
  };
});
