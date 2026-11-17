// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import type { IdPrefix } from "@kaneo/ids";
import { HTTPException } from "hono/http-exception";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { z } from "../../openapi";

export const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex color such as #6b7280");

/** Offset paging for teammate lists. */
export const pageQuery = {
  offset: z.coerce.number().int().min(0).max(10000000).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
};

/** Trims a page read with one extra row. */
export const page = <T>(
  rows: T[],
  { offset, limit }: { offset: number; limit: number },
) => ({
  items: rows.slice(0, limit),
  nextOffset: rows.length > limit ? offset + limit : null,
});

/** Up to 50 distinct IDs of one entity. */
export const idList = <P extends IdPrefix>(prefix: P) =>
  z
    .array(flexibleToTypeIdSchema(prefix))
    .max(50)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Each ID can appear only once",
    );

/** An update body must change at least one field. */
export const someField = (fields: object) =>
  Object.values(fields).some((value) => value !== undefined);

/**
 * Where a teammate heard a customer's request or vote (#73). A teammate picks one of these; a route
 * that knows the origin records it instead: a conversation, a ticket or a sidebar app.
 */
export const behalfSources = [
  "call",
  "meeting",
  "email",
  "chat",
  "other",
] as const;
export type BehalfSource =
  | (typeof behalfSources)[number]
  | "conversation"
  | "ticket"
  | "app";
export const behalfSource = z.enum(behalfSources).default("other").openapi({
  description:
    "Where you heard it: call, meeting, email, chat or other. The post history and the audit log record it.",
});

/** quills:view_revenue (#79): customer revenue is shown to, sorted and filtered by, and set by its holders only. */
export const seesRevenue = (actions: ReadonlySet<string>) =>
  actions.has("view_revenue");
export const revenueDenied = () =>
  new HTTPException(403, {
    message: "Customer revenue needs the view_revenue permission",
  });
