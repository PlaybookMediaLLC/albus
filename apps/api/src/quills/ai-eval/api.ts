import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { BaseVariables } from "../../openapi";
import router from "..";

const app = new Hono<{ Variables: BaseVariables & { workspaceId: string } }>();
app.use("*", async (c, next) => {
  c.set("userId", c.req.header("x-user")!);
  c.set("user", null);
  await next();
});
app.route("/quills", router);
app.onError((error, c) =>
  error instanceof HTTPException
    ? c.json({ message: error.message }, error.status)
    : c.json({ message: "Internal error" }, 500),
);

/** Calls a teammate route of the shipped router as `user`. */
export async function call(
  workspaceId: string,
  user: string,
  path: string,
  method = "GET",
  body?: unknown,
) {
  const res = await app.request(`/quills/${workspaceId}${path}`, {
    method,
    headers: {
      "x-user": user,
      ...(body !== undefined && { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: res.status,
    // oxlint-disable-next-line typescript/no-explicit-any -- route answers vary per case
    body: (await res.json().catch(() => null)) as any,
  };
}

/** A setup call that must work: it throws with the route's answer otherwise. */
export async function must(pending: ReturnType<typeof call>, what: string) {
  const res = await pending;
  if (res.status >= 300)
    throw new Error(`${what}: ${res.status} ${JSON.stringify(res.body)}`);
  return res;
}
