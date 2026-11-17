import { fixture } from "../framework/contract";

export const updateQuillsPortalAccess = fixture({
  seed: async () => ({}),
  valid: () => ({
    body: { visibility: "private", allowedDomains: ["@Example.COM", "bad"] },
  }),
});

export const updateQuillsPortalSignIn = fixture({
  seed: async () => ({}),
  valid: () => ({
    body: {
      mode: "sso",
      widgetSignIn: true,
      ssoUrl: "https://app.example.test/login",
    },
  }),
});
