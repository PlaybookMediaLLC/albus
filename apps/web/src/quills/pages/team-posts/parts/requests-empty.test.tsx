import { describe, expect, it, vi } from "vite-plus/test";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import type { PostSearch } from "../post-search";
import { RequestsEmpty } from "./requests-empty";

const show = (search: PostSearch, create = true) => {
  const onSearch = vi.fn();
  const view = renderComponent(
    <TeamRuntimeProvider
      value={{
        workspaceId: "workspace_1",
        viewer: { kind: "user", id: "user_1" },
        permissions: {
          read: true,
          create,
          update: true,
          delete: true,
          manageSettings: true,
        },
      }}
    >
      <RequestsEmpty search={search} onSearch={onSearch} />
    </TeamRuntimeProvider>,
  );
  return { view, onSearch };
};

describe("RequestsEmpty", () => {
  it("offers New request on an empty workspace", () => {
    const { view, onSearch } = show({});
    expect(view.getByRole("status")).toHaveTextContent("No requests yet");
    press("New request");
    expect(onSearch).toHaveBeenCalledWith({ new: true });
  });

  it("leaves out New request without the create permission", () => {
    const { view } = show({}, false);
    expect(view.queryByRole("button")).toBeNull();
  });

  it("offers to clear the filters when nothing matches", () => {
    const { view, onSearch } = show({ q: "dark mode", board: "board_1" });
    expect(view.getByRole("status")).toHaveTextContent("No matches");
    expect(view.getByRole("status")).toHaveTextContent("Change the filters");
    press("Clear filters");
    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ q: undefined, board: undefined }),
    );
  });
});
