import { vi } from "vite-plus/test";
import { fixture } from "../framework/contract";
import { enablePortal } from "../portal/customer-seed.fixture";
import { anonymousVisitor } from "./contact-email.fixture";

// Kaneo mails a sign-in link only with mail delivery on. Port 9 refuses, so no mail leaves the test.
if (!process.env.SMTP_HOST) {
  vi.stubEnv("SMTP_HOST", "127.0.0.1");
  vi.stubEnv("SMTP_PORT", "9");
  vi.stubEnv("SMTP_FROM", "contract@example.test");
}

export const sendQuillsWidgetPortalLink = fixture({
  seed: async (env) => {
    await enablePortal(env, env.a);
    const visitor = await env.widgetVisitor(env.a);
    const anonymous = await anonymousVisitor(env, env.a);
    return { ...visitor, anonymous: anonymous.token };
  },
  valid: (ids) => ({ bearer: ids.token }),
  // An anonymous visitor has no address that the host app vouched for.
  forged: (ids) => [{ bearer: ids.anonymous }],
  hidden: (ids) => [ids.token, ids.anonymous],
});
