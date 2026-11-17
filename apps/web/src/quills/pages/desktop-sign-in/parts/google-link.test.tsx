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
import { GoogleLink } from "./google-link";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  linkSocial: vi.fn(),
}));
// authClient keeps the fetch of its creation, so mockApi cannot reach it.
vi.mock("@/lib/auth-client", () => ({ authClient: auth }));

const signedIn = (id: string) =>
  auth.getSession.mockResolvedValue({
    data: { user: { id, email: `${id}@example.test` } },
  });

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(
    null,
    "",
    "/quills/desktop?link=google&user=user-1",
  );
});
afterEach(() => window.history.replaceState(null, "", "/"));

describe("GoogleLink", () => {
  it("links Google for the same user and comes back to this page", async () => {
    signedIn("user-1");
    const view = renderComponent(
      <GoogleLink user="user-1" linked={false} failed={false} />,
    );
    expect(await view.findByText(/user-1@example.test/)).toBeInTheDocument();
    press(/link google/i);
    const { callbackURL, errorCallbackURL, provider } =
      auth.linkSocial.mock.calls[0][0];
    expect(provider).toBe("google");
    expect(new URL(callbackURL).searchParams.get("linked")).toBe("true");
    expect(new URL(callbackURL).searchParams.get("user")).toBe("user-1");
    expect(new URL(errorCallbackURL).searchParams.get("failed")).toBe("true");
    expect(new URL(callbackURL).origin).toBe(window.location.origin);
  });

  it("refuses to link for another user and offers to switch", async () => {
    signedIn("user-2");
    auth.signOut.mockResolvedValue({ data: { success: true } });
    const view = renderComponent(
      <GoogleLink user="user-1" linked={false} failed={false} />,
    );
    expect(await view.findByText(/user-2@example.test/)).toBeInTheDocument();
    expect(
      view.queryByRole("button", { name: /link google/i }),
    ).not.toBeInTheDocument();
    press(/use another account/i);
    const signIn = await view.findByRole("link", { name: /sign in/i });
    expect(
      new URL(
        signIn.getAttribute("href") ?? "",
        window.location.origin,
      ).searchParams.get("redirect"),
    ).toBe("/quills/desktop?link=google&user=user-1");
    expect(auth.linkSocial).not.toHaveBeenCalled();
  });

  it("asks a signed-out browser to sign in first", async () => {
    auth.getSession.mockResolvedValue({ data: null });
    const view = renderComponent(
      <GoogleLink user="user-1" linked={false} failed={false} />,
    );
    expect(
      await view.findByRole("link", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("shows the result of the link", async () => {
    signedIn("user-1");
    const done = renderComponent(
      <GoogleLink user="user-1" linked failed={false} />,
    );
    expect(done.getByRole("status")).toHaveTextContent(/google is linked/i);
    done.unmount();
    const failed = renderComponent(
      <GoogleLink user="user-1" linked={false} failed />,
    );
    expect(await failed.findByRole("alert")).toHaveTextContent(/not linked/i);
  });
});
