import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const api = vi.hoisted(() => ({
  getSession: vi.fn(),
  generateOneTimeToken: vi.fn(),
  verifyOneTimeToken: vi.fn(),
}));
vi.mock("../auth", () => ({ auth: { api } }));
const inheritSsoSessionId = vi.hoisted(() => vi.fn());
vi.mock("./sso-session", () => ({ inheritSsoSessionId }));

const { default: desktop } = await import("./index");

const post = (headers: Record<string, string>) =>
  desktop.request("/session", { method: "POST", headers });

describe("POST /desktop/session", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a request without a bearer token", async () => {
    const response = await post({});
    expect(response.status).toBe(401);
    expect(api.getSession).not.toHaveBeenCalled();
  });

  it("ignores a cookie session", async () => {
    const response = await post({ cookie: "better-auth.session_token=abc" });
    expect(response.status).toBe(401);
    expect(api.getSession).not.toHaveBeenCalled();
  });

  it("refuses a token that has no session", async () => {
    api.getSession.mockResolvedValue(null);
    const response = await post({ authorization: "Bearer stale" });
    expect(response.status).toBe(401);
    expect(api.generateOneTimeToken).not.toHaveBeenCalled();
  });

  it("sets the session cookie for a valid bearer token", async () => {
    api.getSession.mockResolvedValue({
      session: { id: "s1" },
      user: { id: "u1" },
    });
    api.generateOneTimeToken.mockResolvedValue({ token: "one-time" });
    const result = new Headers();
    result.append(
      "set-cookie",
      "better-auth.session_token=signed; Path=/; HttpOnly",
    );
    result.append(
      "set-cookie",
      "better-auth.session_data=cache; Path=/; HttpOnly",
    );
    api.verifyOneTimeToken.mockResolvedValue({ headers: result, response: {} });

    const response = await post({
      authorization: "Bearer device-token",
      cookie: "other=1",
    });

    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()).toEqual([
      "better-auth.session_token=signed; Path=/; HttpOnly",
      "better-auth.session_data=cache; Path=/; HttpOnly",
    ]);
    // Only the bearer token reaches Better Auth: the request's cookies are dropped.
    const sent = api.getSession.mock.calls[0]?.[0].headers as Headers;
    expect([...sent.keys()]).toEqual(["authorization"]);
    expect(inheritSsoSessionId).toHaveBeenCalledWith("s1", "u1");
    expect(api.verifyOneTimeToken).toHaveBeenCalledWith({
      body: { token: "one-time" },
      returnHeaders: true,
    });
  });
});
