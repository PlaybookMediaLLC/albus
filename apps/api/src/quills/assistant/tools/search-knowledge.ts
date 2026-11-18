// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { z } from "../../../openapi";
import { formatSources, searchKnowledge as search } from "../engine/retrieval";
import { defineReadTool } from "../ai/tool";

export const searchKnowledge = defineReadTool({
  name: "search_knowledge",
  description:
    "Search the team's answer snippets, knowledge documents and web pages.",
  args: z.object({ query: z.string().trim().min(1).max(200) }),
  action: "read",
  run: async (db, context, args) => {
    const sources = await search(
      db,
      args.query,
      "team",
      context.knowledge.documents,
    );
    return {
      content: formatSources(sources),
      summary: `${sources.length} results`,
      sources,
    };
  },
});
