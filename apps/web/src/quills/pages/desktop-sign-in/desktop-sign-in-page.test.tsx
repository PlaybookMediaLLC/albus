import { waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { advanceClock, press } from "../../test/actions";
import { describePageContract } from "../../test/contracts";
import { renderPage } from "../../test/render";
import { DesktopSignInPage } from "./desktop-sign-in-page";
import { meta } from "./meta";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  device: { code: vi.fn(), token: vi.fn() },
}));
// authClient keeps the fetch of its creation, so mockApi cannot reach it.
vi.mock("@/lib/auth-client", () => ({ authClient: auth }));

const code = {
  device_code: "device-1",
  user_code: "NGYHP25Q",
  verification_uri: "https://quills.test/device",
  verification_uri_complete: "https://quills.test/device?user_code=NGYHP25Q",
  expires_in: 600,
  interval: 5,
};
const signedOut = () => auth.getSession.mockResolvedValue({ data: null });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("open", vi.fn());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("DesktopSignInPage", () => {
  describePageContract(meta, DesktopSignInPage, {
    loading: {
      prepare: () => {
        auth.getSession.mockReturnValue(new Promise(() => {}));
        return {};
      },
    },
    failed: {
      prepare: () => {
        signedOut();
        auth.device.code.mockResolvedValue({
          data: null,
          error: { status: 500 },
        });
        return { search: { start: true } };
      },
    },
    ready: {
      prepare: () => {
        signedOut();
        return {};
      },
    },
  });

  describe("behavior", () => {
    it("tells a signed-in person and goes back to the app", async () => {
      auth.getSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const view = renderPage(DesktopSignInPage, meta, {
        search: { start: true },
      });
      await waitFor(() =>
        expect(view.getByRole("status")).toHaveTextContent(
          /already signed in/i,
        ),
      );
      expect(auth.device.code).not.toHaveBeenCalled();
      expect(
        view.queryByRole("button", { name: /link google/i }),
      ).not.toBeInTheDocument();
      press(/back to quills/i);
      await waitFor(() =>
        expect(view.router.state.location.pathname).toBe("/dashboard"),
      );
    });

    it("sends a Google link from the app to the browser", async () => {
      auth.getSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const view = renderPage(DesktopSignInPage, meta, {
        search: { start: true, provider: "google" },
      });
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

    it("runs the browser half of a Google link", async () => {
      auth.getSession.mockResolvedValue({ data: null });
      const view = renderPage(DesktopSignInPage, meta, {
        search: { link: "google", user: "user-1" },
      });
      expect(await view.findByRole("heading", { level: 1 })).toHaveTextContent(
        /link a google account/i,
      );
      expect(
        await view.findByRole("link", { name: /sign in/i }),
      ).toBeInTheDocument();
      expect(auth.device.code).not.toHaveBeenCalled();
    });

    it("opens the approval page in the browser and shows the code", async () => {
      signedOut();
      auth.device.code.mockResolvedValue({ data: code, error: null });
      const view = renderPage(DesktopSignInPage, meta);
      await view.findByRole("button", { name: /continue in browser/i });
      press(/continue in browser/i);
      expect(await view.findByLabelText(/sign-in code/i)).toHaveTextContent(
        "NGYH-P25Q",
      );
      expect(window.open).toHaveBeenCalledWith(
        code.verification_uri_complete,
        "_blank",
        "noopener,noreferrer",
      );
      expect(auth.device.code).toHaveBeenCalledWith({ client_id: "kaneo-cli" });

      press(/open the browser again/i);
      expect(window.open).toHaveBeenCalledTimes(2);
      press(/cancel/i);
      expect(
        await view.findByRole("button", { name: /continue in browser/i }),
      ).toBeEnabled();
    });

    it("starts at once when the desktop app asks", async () => {
      signedOut();
      auth.device.code.mockResolvedValue({ data: code, error: null });
      renderPage(DesktopSignInPage, meta, { search: { start: true } });
      await waitFor(() => expect(window.open).toHaveBeenCalledOnce());
    });

    it("shows a denial from the browser", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      signedOut();
      auth.device.code.mockResolvedValue({ data: code, error: null });
      auth.device.token.mockResolvedValue({
        data: null,
        error: { error: "access_denied" },
      });
      const view = renderPage(DesktopSignInPage, meta, {
        search: { start: true },
      });
      await view.findByLabelText(/sign-in code/i);
      await advanceClock(5000);
      expect(await view.findByRole("alert")).toHaveTextContent(/denied/i);
    });

    it("keeps the email sign-in in the app", async () => {
      signedOut();
      const view = renderPage(DesktopSignInPage, meta);
      expect(
        await view.findByRole("link", { name: /email and password/i }),
      ).toHaveAttribute("href", "/auth/sign-in");
    });
  });
});
