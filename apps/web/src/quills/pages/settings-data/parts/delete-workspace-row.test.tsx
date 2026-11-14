import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { toast } from "../../../ui/upstream";
import { DeleteWorkspaceRow } from "./delete-workspace-row";

// better-auth keeps its own fetch, so the test replaces the one call it needs.
const auth = vi.hoisted(() => ({
  setActive: vi.fn<() => Promise<{ error: unknown }>>(),
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: { organization: { setActive: auth.setActive } },
}));

const render = () => {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({
      initialEntries: ["/feedback/workspace_1/settings/data"],
    }),
  });
  renderComponent(
    <RouterContextProvider router={router}>
      <DeleteWorkspaceRow workspaceId="workspace_1" />
    </RouterContextProvider>,
  );
  return router;
};

describe("DeleteWorkspaceRow", () => {
  it("makes this workspace active before it opens the workspace settings", async () => {
    auth.setActive.mockResolvedValue({ error: null });
    const router = render();
    press("Open workspace settings");
    await waitFor(() =>
      expect(router.history.location.pathname).toBe(
        "/dashboard/settings/workspace/general",
      ),
    );
    expect(auth.setActive).toHaveBeenCalledWith({
      organizationId: "workspace_1",
    });
  });

  it("stays on the page when the workspace cannot become active", async () => {
    const error = vi.spyOn(toast, "error");
    auth.setActive.mockResolvedValue({ error: { status: 403 } });
    const router = render();
    press("Open workspace settings");
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        "The workspace settings could not be opened.",
      ),
    );
    expect(router.history.location.pathname).toBe(
      "/feedback/workspace_1/settings/data",
    );
  });
});
