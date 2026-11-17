import { fixture, type ContractEnv } from "../framework/contract";
import { seed as feedbackSeed } from "./seed.fixture";
import { softDeletes } from "./seeds.fixture";

const seed = async (env: ContractEnv) => ({
  ...(await feedbackSeed(env)),
  key: env.id("update-key"),
});
type Ids = Awaited<ReturnType<typeof seed>>;

const channels = { page: true, email: true, conversations: true, slack: false };
const softDelete = softDeletes("posts", ({ a }: Ids) => a.postId);

export const previewQuillsPostUpdate = fixture({
  seed,
  valid: ({ a }: Ids) => ({
    params: { postId: a.postId },
    body: { channels, segmentIds: [], languages: ["en"] },
  }),
  foreign: ({ b }: Ids) => ({ postId: b.postId }),
  softDelete,
});

export const sendQuillsPostUpdate = fixture({
  seed,
  valid: ({ a, key }: Ids) => ({
    params: { postId: a.postId },
    body: {
      channels,
      segmentIds: [],
      languages: [],
      body: "Roadmap export to CSV is live.",
      confirmRelease: true,
      idempotencyKey: key,
    },
  }),
  foreign: ({ b }: Ids) => ({ postId: b.postId }),
  softDelete,
});
