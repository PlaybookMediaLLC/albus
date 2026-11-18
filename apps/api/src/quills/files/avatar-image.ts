import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z } from "../../openapi";
import { principal } from "../../database/quills/schema/auth";
import { defineQuillsRoute } from "../framework/define-route";
import { imageRedirect } from "../framework/files";

const notFound = () =>
  new HTTPException(404, { message: "No uploaded avatar" });

const avatarImage = defineQuillsRoute({
  audience: "public",
  method: "get",
  path: "/avatars/{principalId}",
  operationId: "getQuillsAvatarImage",
  summary: "Open a person's uploaded avatar",
  description:
    "Public: the principal ID is unguessable and the URL carries a version that changes with the picture. Redirects to a short-lived signed URL of the feedback app's bucket; the redirect is cached until shortly before it expires.",
  action: "read",
  params: z.object({ principalId: flexibleToTypeIdSchema("principal") }),
  query: z.object({ v: z.string().max(64).optional() }),
  response: z.object({ key: z.string() }),
  responseDescription: "Redirect to the avatar image",
  errors: { 404: "No uploaded avatar" },
  handler: async ({ db, params }) => {
    const [row] = await db
      .select({ key: principal.avatarKey })
      .from(principal)
      .where(
        eq(
          principal.id,
          params.principalId as typeof principal.$inferSelect.id,
        ),
      )
      .limit(1);
    if (!row?.key) throw notFound();
    return { key: row.key };
  },
  location: async ({ key }) => {
    const target = await imageRedirect(key);
    if (!target) throw notFound();
    return target;
  },
});

export default apiRouter().openapi(...avatarImage);
