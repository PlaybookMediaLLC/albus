import { HTTPException } from "hono/http-exception";
import { auth } from "../auth";
import { apiRouter, createRoute, errorResponse } from "../openapi";
import { inheritSsoSessionId } from "./sso-session";

// The desktop app signs in through the system browser with the device flow, which returns a
// bearer token. Its web view needs the session cookie instead, so this route sets the cookie
// for that session. Only the Authorization header counts: a cookie session never mints a cookie.
const createDesktopSessionRoute = createRoute({
  method: "post",
  operationId: "createDesktopSession",
  path: "/session",
  tags: ["Desktop"],
  summary: "Create the desktop session cookie",
  description:
    "Send the device-flow access token as `Authorization: Bearer <token>`. The response sets the session cookie for that session, so the desktop app's web view is signed in. Cookies and API keys on the request are ignored.",
  security: [],
  responses: {
    204: { description: "The session cookie is set" },
    401: errorResponse("The bearer token is missing or not valid"),
  },
});

const desktop = apiRouter().openapi(createDesktopSessionRoute, async (c) => {
  const authorization = c.req.header("authorization");
  if (!authorization || !/^bearer\s+\S+$/i.test(authorization))
    throw new HTTPException(401, { message: "A bearer token is required" });
  const headers = new Headers({ authorization });
  const session = await auth.api.getSession({ headers });
  if (!session)
    throw new HTTPException(401, { message: "The bearer token is not valid" });
  await inheritSsoSessionId(session.session.id, session.user.id);
  const { token } = await auth.api.generateOneTimeToken({ headers });
  const { headers: result } = await auth.api.verifyOneTimeToken({
    body: { token },
    returnHeaders: true,
  });
  for (const cookie of result.getSetCookie())
    c.header("Set-Cookie", cookie, { append: true });
  return c.body(null, 204);
});

export default desktop;
