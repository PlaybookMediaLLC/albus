import { act, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { advanceClock } from "../../test/actions";
import { mockApi } from "../../test/mock-api";
import { renderQuillsHook } from "../../test/render";
import { useDeviceSignIn } from "./use-device-sign-in";

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
  expires_in: 60,
  interval: 5,
};

function render() {
  const onSignedIn = vi.fn();
  const view = renderQuillsHook(
    (props: { onSignedIn: () => void }) =>
      useDeviceSignIn(false, props.onSignedIn),
    { initialProps: { onSignedIn } },
  );
  return Object.assign(view, { onSignedIn });
}

/** Starts the flow and waits until the code shows. */
async function startFlow(view: ReturnType<typeof render>) {
  await waitFor(() => expect(view.result.current.state.step).toBe("idle"));
  act(() => view.result.current.start());
  await waitFor(() => expect(view.result.current.state.step).toBe("waiting"));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.stubGlobal("open", vi.fn());
  auth.getSession.mockResolvedValue({ data: null });
  auth.device.code.mockResolvedValue({ data: code, error: null });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useDeviceSignIn", () => {
  it("reports a session that exists before the page opens", async () => {
    auth.getSession.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const view = render();
    await waitFor(() =>
      expect(view.result.current.state).toEqual({
        step: "already",
        userId: "user-1",
      }),
    );
    expect(view.onSignedIn).not.toHaveBeenCalled();
    expect(auth.device.code).not.toHaveBeenCalled();
  });

  it("turns the approved token into the session cookie", async () => {
    auth.device.token
      .mockResolvedValueOnce({
        data: null,
        error: { error: "authorization_pending" },
      })
      .mockResolvedValueOnce({
        data: { access_token: "device-token" },
        error: null,
      });
    const api = mockApi();
    api.reply({});
    const view = render();
    await startFlow(view);
    expect(window.open).toHaveBeenCalledWith(
      code.verification_uri,
      "_blank",
      "noopener,noreferrer",
    );

    await advanceClock(5000);
    await advanceClock(5000);
    await waitFor(() => expect(view.onSignedIn).toHaveBeenCalledOnce());
    expect(auth.device.token).toHaveBeenCalledWith({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: "device-1",
      client_id: "kaneo-cli",
    });
    const [session] = api.calls();
    expect(session.method).toBe("POST");
    expect(new URL(session.url).pathname).toBe("/api/desktop/session");
    expect(session.headers.get("authorization")).toBe("Bearer device-token");
    expect(session.credentials).toBe("include");
  });

  it("asks again after an HTTP error without an OAuth code", async () => {
    auth.device.token
      .mockResolvedValueOnce({ data: null, error: { status: 502 } })
      .mockResolvedValueOnce({
        data: { access_token: "device-token" },
        error: null,
      });
    mockApi().reply({});
    const view = render();
    await startFlow(view);
    await advanceClock(5000);
    await advanceClock(5000);
    await waitFor(() => expect(view.onSignedIn).toHaveBeenCalledOnce());
    expect(auth.device.token).toHaveBeenCalledTimes(2);
  });

  it("fails when the API refuses the session", async () => {
    auth.device.token.mockResolvedValue({
      data: { access_token: "t" },
      error: null,
    });
    mockApi().reply({ message: "Unauthorized" }, 401);
    const view = render();
    await startFlow(view);
    await advanceClock(5000);
    await waitFor(() =>
      expect(view.result.current.state).toEqual({
        step: "failed",
        reason: "failed",
      }),
    );
    expect(view.onSignedIn).not.toHaveBeenCalled();
  });

  it("stops polling after a cancel", async () => {
    const view = render();
    await startFlow(view);
    act(() => view.result.current.cancel());
    await advanceClock(15_000);
    expect(view.result.current.state).toEqual({ step: "idle" });
    expect(auth.device.token).not.toHaveBeenCalled();
  });
});
