import { waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { SignInFlow } from "./sign-in-flow";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  device: { code: vi.fn(), token: vi.fn() },
}));
// authClient keeps the fetch of its creation, so mockApi cannot reach it.
vi.mock("@/lib/auth-client", () => ({ authClient: auth }));

function render(props: { start: boolean; provider?: string }) {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ["/quills/desktop"] }),
  });
  return renderComponent(
    <RouterContextProvider router={router}>
      <SignInFlow {...props} />
    </RouterContextProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("open", vi.fn());
});
afterEach(() => vi.unstubAllGlobals());

describe("SignInFlow", () => {
  it("offers the browser sign-in to a signed-out person", async () => {
    auth.getSession.mockResolvedValue({ data: null });
    const view = render({ start: false });
    expect(
      await view.findByRole("button", { name: /continue in browser/i }),
    ).toBeEnabled();
    expect(auth.device.code).not.toHaveBeenCalled();
  });

  it("offers a Google link in the browser to a signed-in person", async () => {
    auth.getSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const view = render({ start: true, provider: "google" });
    await waitFor(() =>
      expect(view.getByRole("status")).toHaveTextContent(
        /google does not allow/i,
      ),
    );
    press(/link google in your browser/i);
    expect(window.open).toHaveBeenCalledWith(
      `${location.origin}/quills/desktop?link=google&user=user-1`,
      "_blank",
      "noopener,noreferrer",
    );
  });
});
