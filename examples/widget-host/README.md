# Quills widget host

A small TanStack Start app that embeds the Quills widget the way a customer app does. Use it to test the widget against a local Kaneo and Quills stack.

It is not part of the pnpm workspace or CI. It has its own `package.json` and lockfile and links `@quills/widget` from `packages/widget`.

## What it does

- `/` embeds the widget with `useQuillsInit` from `@quills/widget/react`.
- `/script` embeds it with the script tag only: `{instanceUrl}/api/quills-public/{workspace}/widget/sdk.js`.
- A select signs you in as one of three fake users, or leaves you anonymous. There is no real authentication.
- A TanStack Start server function signs the identify token (an HS256 JWT) with the workspace widget secret. The secret stays in the server's environment. The browser gets only the signed token.
- The token select also makes bad tokens (bad signature, expired, no `sub`, no `email`), to check that Kaneo refuses them.
- One control for each public SDK method, and a live log of the widget events.

## Start it

1. Start the local stack from the repository root, and build the widget files that the API serves:

   ```bash
   pnpm dev:demo
   ```

   ```bash
   pnpm --dir packages/widget build
   ```

2. Get the widget secret as a teammate with `quills:manage_settings`. Sign in to the web app at `http://127.0.0.1:5190`, then call `GET http://127.0.0.1:1390/api/quills/quills_portal_demo/settings/widget/secret`. If it returns `null`, `POST` the same path to create one. The demo logins are in `~/.config/kaneo/dev-demo.env`.

3. Put the secret in this folder's `.env`. Git ignores the file:

   ```bash
   cp .env.example .env
   ```

   Then set `QUILLS_WIDGET_SECRET` in `.env`.

4. Install and start the host app:

   ```bash
   npm install
   ```

   ```bash
   npm run dev
   ```

5. Open `http://127.0.0.1:5290`. The port is strict: the app does not start if the port is in use.

The fake users need these workspace records for their optional claims to apply. Without them, Kaneo drops the claims and identify still works:

- A user attribute definition with the key `plan` (type string).
- A manual segment with the slug `beta-program` (the demo seed has it).

## Checks

```bash
npm test
```

```bash
npm run typecheck
```
