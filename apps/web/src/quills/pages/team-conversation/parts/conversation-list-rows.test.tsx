import { describe, expect, it, vi } from "vite-plus/test";
import { getConversationFixture } from "../../../api/team/get-conversation.fixture";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import {
  ConversationListRows,
  type ConversationListRowsProps,
} from "./conversation-list-rows";

const row = { ...getConversationFixture.ok(), id: "conversation_test_2" };
const list = (values: Record<string, unknown>) =>
  ({
    data: undefined,
    error: null,
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: vi.fn(),
    fetchNextPage: vi.fn(),
    ...values,
  }) as unknown as ConversationListRowsProps["list"];
const props = {
  workspaceId: "workspace_test_1",
  context: { view: "all", status: "any" } as const,
  loading: false,
  people: [],
  activeId: "conversation_test_1",
  onOpen: () => undefined,
};

describe("ConversationListRows", () => {
  it("lists the rows and loads more", () => {
    const more = list({
      data: { pages: [{ items: [row] }] },
      hasNextPage: true,
    });
    const view = renderComponent(
      <ConversationListRows {...props} list={more} quiet={false} />,
    );
    expect(view.getAllByRole("link")).toHaveLength(1);
    press("Load more conversations");
    expect(more.fetchNextPage).toHaveBeenCalledOnce();
  });

  it("keeps its failure quiet while the main pane shows one", () => {
    const failed = list({ error: { kind: "failed" } });
    const view = renderComponent(
      <ConversationListRows {...props} list={failed} quiet />,
    );
    expect(view.queryByRole("button", { name: "Try again" })).toBeNull();
    view.rerender(
      <ConversationListRows {...props} list={failed} quiet={false} />,
    );
    press("Try again");
    expect(failed.refetch).toHaveBeenCalledOnce();
  });
});
