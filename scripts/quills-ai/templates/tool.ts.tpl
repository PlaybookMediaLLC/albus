// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { z } from "../../../openapi";
import { defineReadTool } from "../ai/tool";

/** TODO(quills-ai): what the tool finds, in one sentence the model reads. */
export const {{camel}} = defineReadTool({
  name: "{{snake}}",
  description: "TODO(quills-ai): what the tool returns, for the model.",
  args: z.object({ query: z.string().trim().min(1).max(200) }),
  // The model sees the tool only while the asking teammate holds this action.
  action: "read",
  // Runs in a system-scoped read of the workspace: return only what the teammate may read.
  run: async (_db, _context, args) => {
    // TODO(quills-ai): read through db, never another workspace's data.
    return { content: `No results for ${args.query}.`, summary: "0 results" };
  },
});
