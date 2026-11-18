import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { flexibleToTypeIdSchema } from "@kaneo/ids/zod";
import { apiRouter, createRoute, errorResponse, z } from "../../openapi";
import {
  QuillsWorkspaceUnavailable,
  withQuillsAudience,
} from "../../database/quills/client";
import { principal } from "../../database/quills/schema/auth";
import { quillsStorageConfig } from "../../storage/s3";
import { imageUrl } from "../framework/files";

const route = createRoute({
  method: "get",
  operationId: "getQuillsAvatarImage",
  path: "/{workspace}/avatars/{principalId}",
  tags: ["Quills portal"],
  summary: "Open a person's uploaded avatar",
  description:
    "Public, like Kaneo's user avatars: the principal ID is unguessable and the URL carries a version that changes with the picture. Redirects to a short-lived signed URL of the feedback app's bucket; the redirect is cached until shortly before it expires.",
  security: [],
  request: {
    params: z.object({
      workspace: z.string().min(1).max(200),
      principalId: flexibleToTypeIdSchema("principal"),
    }),
    query: z.object({ v: z.string().max(64).optional() }),
  },
  responses: {
    302: { description: "Redirect to the avatar image" },
    404: errorResponse("No uploaded avatar"),
  },
});

export default apiRouter().openapi(route, async (c) => {
  const { workspace, principalId } = c.req.valid("param");
  const notFound = () =>
    new HTTPException(404, { message: "No uploaded avatar" });
  let key: string | null | undefined;
  try {
    key = await withQuillsAudience({ workspace }, async (db) => {
      const [row] = await db
        .select({ key: principal.avatarKey })
        .from(principal)
        .where(
          eq(principal.id, principalId as typeof principal.$inferSelect.id),
        )
        .limit(1);
      return row?.key;
    });
  } catch (error) {
    if (error instanceof QuillsWorkspaceUnavailable) throw notFound();
    throw error;
  }
  if (!key) throw notFound();
  // Signing may resolve provider credentials, so it runs after the transaction.
  const location = await imageUrl(key);
  if (!location) throw notFound();
  const ttl = quillsStorageConfig().presignTtlSeconds;
  return c.body(null, 302, {
    Location: location,
    "Cache-Control": `private, max-age=${Math.max(0, ttl - 60)}`,
  });
});
