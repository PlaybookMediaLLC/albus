import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, z } from "../../openapi";
import { principal } from "../../database/quills/schema/auth";
import { defineQuillsRoute } from "../framework/define-route";
import { signedImage } from "../framework/files";

const avatarImage = defineQuillsRoute({
  audience: "public",
  method: "get",
  path: "/avatars/{principalId}",
  operationId: "getQuillsAvatarImage",
  summary: "Open a person's uploaded avatar",
  description:
    "Public: the principal ID is unguessable and the URL carries a version that changes with the picture. An image request (an <img>) gets a 302 to a short-lived signed URL of the feedback app's bucket, cached until shortly before it expires; other clients get the URL as JSON.",
  action: "read",
  imageRedirect: true,
  params: z.object({ principalId: flexibleToTypeIdSchema("principal") }),
  query: z.object({ v: z.string().max(64).optional() }),
  response: z.object({
    url: z.string().url().max(4096),
    maxAgeSeconds: z.number().int().min(0),
  }),
  responseDescription: "A short-lived URL of the avatar",
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
    // Presigning is local with configured keys, so it holds the transaction only briefly.
    const image = row?.key ? await signedImage(row.key) : null;
    if (!image) throw new HTTPException(404, { message: "No uploaded avatar" });
    return image;
  },
});

export default apiRouter().openapi(...avatarImage);
