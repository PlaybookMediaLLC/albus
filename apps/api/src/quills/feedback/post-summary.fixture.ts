import {
  chatReply,
  fallback,
  provider,
} from "../assistant/provider-edge.fixture";
import { fixture } from "../framework/contract";
import { seed, softDeletePost, type Ids } from "./seed.fixture";

export const summarizeQuillsPost = fixture({
  seed: async (env) => {
    // A summary prompt gets a summary; every other call gets the default answer.
    provider.reply((request) =>
      JSON.stringify(request.body?.messages).includes("feedback request")
        ? chatReply({ text: "Contract summary" })
        : fallback(request),
    );
    return seed(env);
  },
  valid: (ids: Ids) => ({ params: { postId: ids.a.postId } }),
  foreign: (ids: Ids) => ({ postId: ids.b.postId }),
  softDelete: softDeletePost,
});
