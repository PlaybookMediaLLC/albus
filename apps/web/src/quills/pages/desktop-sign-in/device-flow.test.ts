import { describe, expect, it, vi } from "vite-plus/test";
import {
  runDeviceSignIn,
  type DeviceCode,
  type DeviceSignIn,
  type TokenReply,
} from "./device-flow";

const code: DeviceCode = {
  device_code: "device-1",
  user_code: "NGYHP25Q",
  verification_uri: "https://quills.test/device",
  verification_uri_complete: "https://quills.test/device?user_code=NGYHP25Q",
  expires_in: 60,
  interval: 5,
};

function flow(
  replies: (TokenReply | Error)[],
  overrides: Partial<DeviceSignIn> = {},
) {
  let clock = 0;
  const waits: number[] = [];
  const controller = new AbortController();
  const steps: DeviceSignIn = {
    requestCode: vi.fn(async () => code),
    requestToken: vi.fn(async () => {
      const reply = replies.shift() ?? { error: "authorization_pending" };
      if (reply instanceof Error) throw reply;
      return reply;
    }),
    createSession: vi.fn(async () => {}),
    onCode: vi.fn(),
    wait: async (ms) => {
      waits.push(ms);
      clock += ms;
    },
    now: () => clock,
    signal: controller.signal,
    ...overrides,
  };
  return { steps, waits, controller };
}

describe("runDeviceSignIn", () => {
  it("shows the code, waits for approval and creates the session", async () => {
    const { steps, waits } = flow([
      { error: "authorization_pending" },
      { token: "device-token" },
    ]);
    await expect(runDeviceSignIn(steps)).resolves.toBe("signed-in");
    expect(steps.onCode).toHaveBeenCalledWith(code);
    expect(steps.requestToken).toHaveBeenCalledWith("device-1");
    expect(steps.createSession).toHaveBeenCalledWith("device-token");
    expect(waits).toEqual([5000, 5000]);
  });

  it("slows down by five seconds when the server asks", async () => {
    const { steps, waits } = flow([{ error: "slow_down" }, { token: "t" }]);
    await runDeviceSignIn(steps);
    expect(waits).toEqual([5000, 10000]);
  });

  it("retries after a network error", async () => {
    const { steps } = flow([new Error("offline"), { token: "t" }]);
    await expect(runDeviceSignIn(steps)).resolves.toBe("signed-in");
  });

  it.each([
    ["access_denied", "denied"],
    ["expired_token", "expired"],
    ["invalid_grant", "failed"],
  ])("maps %s to %s", async (error, result) => {
    const { steps } = flow([{ error }]);
    await expect(runDeviceSignIn(steps)).resolves.toBe(result);
    expect(steps.createSession).not.toHaveBeenCalled();
  });

  it("expires when the code runs out", async () => {
    const { steps } = flow([], {
      requestCode: async () => ({ ...code, expires_in: 12 }),
    });
    await expect(runDeviceSignIn(steps)).resolves.toBe("expired");
  });

  it("fails when the code request or the session fails", async () => {
    const noCode = flow([], {
      requestCode: async () => Promise.reject(new Error("no")),
    });
    await expect(runDeviceSignIn(noCode.steps)).resolves.toBe("failed");
    expect(noCode.steps.onCode).not.toHaveBeenCalled();
    const noSession = flow([{ token: "t" }], {
      createSession: async () => Promise.reject(new Error("401")),
    });
    await expect(runDeviceSignIn(noSession.steps)).resolves.toBe("failed");
  });

  it("does not sign in when the cancel comes during the token request", async () => {
    const controller = new AbortController();
    const { steps } = flow([], {
      signal: controller.signal,
      requestToken: async () => {
        controller.abort();
        return { token: "late" };
      },
    });
    await expect(runDeviceSignIn(steps)).resolves.toBe("cancelled");
    expect(steps.createSession).not.toHaveBeenCalled();
  });

  it("stops when it is cancelled", async () => {
    const { steps, controller } = flow([]);
    steps.wait = async () => controller.abort();
    await expect(runDeviceSignIn(steps)).resolves.toBe("cancelled");
    expect(steps.requestToken).not.toHaveBeenCalled();
  });
});
