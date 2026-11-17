// Fake sign-in: the host app's own users. `plan` matches a user attribute definition and
// `segments` names manual segments, when the workspace has them; other claims are dropped.
export type HostUser = {
  key: string;
  sub: string;
  email: string;
  name: string;
  plan?: string;
  segments?: string[];
  company?: { id: string; name: string; domain: string };
};

export const USERS: HostUser[] = [
  {
    key: "ada",
    sub: "host-ada",
    email: "ada@widget-host.test",
    name: "Ada Host",
    plan: "pro",
    segments: ["beta-program"],
    company: {
      id: "host-acme",
      name: "Acme Host Inc",
      domain: "acme.widget-host.test",
    },
  },
  {
    key: "grace",
    sub: "host-grace",
    email: "grace@widget-host.test",
    name: "Grace Host",
    plan: "free",
  },
  {
    key: "linus",
    sub: "host-linus",
    email: "linus@widget-host.test",
    name: "Linus Host",
  },
];

export const ANONYMOUS = "anonymous";
