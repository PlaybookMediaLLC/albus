// Route-module helper: framework/boundaries.test.ts checks its imports like a module that uses ../framework/define-route.
import { z } from "../../../openapi";
import { defineReadTool } from "../ai/tool";
import { formatSources, searchArticles } from "../engine/retrieval";

export const searchHelpCenter = defineReadTool({
  name: "search_help_center",
  description:
    "Search the published help-center articles. Returns titles and short excerpts.",
  args: z.object({ query: z.string().trim().min(1).max(200) }),
  action: "read",
  available: (context) => context.knowledge.helpCenter,
  run: async (db, _context, args) => {
    const sources = await searchArticles(db, args.query, "team");
    return {
      content: formatSources(sources),
      summary: `${sources.length} results`,
      sources,
    };
  },
});
