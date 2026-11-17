import type { PageMeta } from "../../core/types";
export const meta = {
  id: "desktop-sign-in",
  feature: "desktop",
  route: "/quills/desktop",
  audience: "public",
  mailLinked: false,
  token: "none",
  operations: [],
  states: ["loading", "failed", "ready"],
} satisfies PageMeta;
