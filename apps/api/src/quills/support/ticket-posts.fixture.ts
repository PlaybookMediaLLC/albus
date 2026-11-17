import { fixture } from "../framework/contract";
import { withBoard } from "./seed.fixture";

type Ids = Awaited<ReturnType<typeof withBoard>>;

export const createQuillsPostFromTicket = fixture({
  seed: withBoard,
  valid: ({ a }: Ids) => ({
    params: { ticketId: a.ticketId },
    body: { boardId: a.boardId, title: "Bulk export" },
  }),
  foreign: ({ b }: Ids) => ({ ticketId: b.ticketId, boardId: b.boardId }),
});
