import { and, eq, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db, { schema } from "../database";
import { workspaceArchivedError } from "../workspace/archive/workspace-archived-error";
import { hasInstanceAdminRole } from "./instance-admin-role";

type ValidateWorkspaceAccessOptions = {
  notFoundMessage?: string;
  // The caller's instance role when already known; skips reading the user.
  userRole?: string | null;
};

export async function validateWorkspaceAccess(
  userId: string,
  workspaceId: string,
  apiKeyId?: string,
  options: ValidateWorkspaceAccessOptions = {},
): Promise<{ memberRole?: string | null }> {
  if (apiKeyId) {
    const apiKey = await db
      .select()
      .from(schema.apikeyTable)
      .where(
        and(
          eq(schema.apikeyTable.id, apiKeyId),
          or(
            eq(schema.apikeyTable.referenceId, userId),
            eq(schema.apikeyTable.userId, userId),
          ),
          eq(schema.apikeyTable.enabled, true),
        ),
      )
      .limit(1);

    if (apiKey.length === 0) {
      throw new HTTPException(403, {
        message: "Invalid API key for this workspace",
      });
    }
  }

  const notFound = () =>
    new HTTPException(404, {
      message: options.notFoundMessage ?? "Workspace not found",
    });

  const userRole =
    options.userRole !== undefined
      ? options.userRole
      : (
          await db
            .select({ role: schema.userTable.role })
            .from(schema.userTable)
            .where(eq(schema.userTable.id, userId))
            .limit(1)
        )[0]?.role;

  const [workspace]: { archivedAt: Date | null; memberRole?: string | null }[] =
    hasInstanceAdminRole(userRole)
      ? await db
          .select({ archivedAt: schema.workspaceTable.archivedAt })
          .from(schema.workspaceTable)
          .where(eq(schema.workspaceTable.id, workspaceId))
          .limit(1)
      : await db
          .select({
            archivedAt: schema.workspaceTable.archivedAt,
            memberRole: schema.workspaceUserTable.role,
          })
          .from(schema.workspaceUserTable)
          .innerJoin(
            schema.workspaceTable,
            eq(schema.workspaceTable.id, schema.workspaceUserTable.workspaceId),
          )
          .where(
            and(
              eq(schema.workspaceUserTable.userId, userId),
              eq(schema.workspaceUserTable.workspaceId, workspaceId),
            ),
          )
          .limit(1);

  if (!workspace) {
    throw notFound();
  }
  // Checked after membership so outsiders cannot learn a workspace is archived.
  // Instance administrators manage archived workspaces from the admin panel.
  if (workspace.archivedAt) {
    throw workspaceArchivedError();
  }
  return { memberRole: workspace.memberRole };
}
