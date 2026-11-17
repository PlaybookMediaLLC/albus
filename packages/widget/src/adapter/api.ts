/** A failed widget API call. Status 0 means the request did not reach the API. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface WidgetUserView {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

/**
 * A client for /api/quills-public/{workspace}. It holds the widget session Bearer token in
 * memory only: never in storage, URLs or logs (RFC 0001).
 */
export function createApi(base: string, fetchImpl: typeof fetch = fetch) {
  let token: string | null = null;
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal,
    /** A Bearer for this request only, in place of the session token. */
    bearer?: string,
  ): Promise<T> {
    const auth = bearer ?? token;
    let res: Response;
    try {
      res = await fetchImpl(`${base}${path}`, {
        method,
        signal,
        // The widget authenticates with its Bearer token only, never with Kaneo cookies.
        credentials: "omit",
        headers: {
          ...(body !== undefined && { "content-type": "application/json" }),
          ...(auth && { authorization: `Bearer ${auth}` }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ApiError(
        0,
        "The service is unreachable. Check your connection.",
      );
    }
    const data: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (data as { message?: unknown } | null)?.message;
      throw new ApiError(
        res.status,
        typeof message === "string" && message ? message : "Request failed",
      );
    }
    return data as T;
  }
  return {
    request,
    hasSession: () => token !== null,
    /** The host sets the token only for the identity that is still current. */
    setToken(next: string | null) {
      token = next;
    },
    async mintAnonymous(signal?: AbortSignal) {
      const result = await request<{ sessionToken: string }>(
        "POST",
        "/widget/anonymous-session",
        undefined,
        signal,
      );
      return result.sessionToken;
    },
    /**
     * The host app's backend signs ssoToken; the widget never holds the secret. With the anonymous
     * session's token as `previousToken` (and as the Bearer), its activity moves to the person.
     */
    async identify(
      ssoToken: string,
      signal?: AbortSignal,
      previousToken?: string,
    ) {
      const result = await request<{
        sessionToken: string;
        user: WidgetUserView;
        warnings?: Array<{ code: string; field: string }>;
      }>(
        "POST",
        "/widget/identify",
        { ssoToken, ...(previousToken && { previousToken }) },
        signal,
        previousToken,
      );
      return {
        token: result.sessionToken,
        user: result.user,
        warnings: result.warnings ?? [],
      };
    },
  };
}
export type Api = ReturnType<typeof createApi>;
