import { describe, expect, it } from "vite-plus/test";
import { mockApi } from "../../test/mock-api";
import { connectors } from "./connectors";

const oauth: Record<string, string> = {
  asana: "startQuillsAsanaOAuthConnect",
  clickup: "startQuillsClickupOAuthConnect",
  discord: "startQuillsDiscordOAuthConnect",
  github: "startQuillsGithubOAuthConnect",
  gitlab: "startQuillsGitlabOAuthConnect",
  hubspot: "startQuillsHubspotOAuthConnect",
  intercom: "startQuillsIntercomOAuthConnect",
  jira: "startQuillsJiraOAuthConnect",
  linear: "startQuillsLinearOAuthConnect",
  monday: "startQuillsMondayOAuthConnect",
  notion: "startQuillsNotionOAuthConnect",
  salesforce: "startQuillsSalesforceOAuthConnect",
  slack: "startQuillsSlackOAuthConnect",
  teams: "startQuillsTeamsOAuthConnect",
  trello: "startQuillsTrelloOAuthConnect",
  zendesk: "startQuillsZendeskOAuthConnect",
};
const keys: Record<string, [string, Record<string, string>]> = {
  azure_devops: [
    "saveQuillsAzureDevopsKey",
    { organization: "acme", token: "token_value" },
  ],
  freshdesk: ["saveQuillsFreshdeskKey", { subdomain: "acme", apiKey: "key" }],
  make: ["saveQuillsMakeWebhook", { webhookUrl: "https://hook.make.test/1" }],
  n8n: ["saveQuillsN8nWebhook", { webhookUrl: "https://n8n.example.test/1" }],
  ntfy: ["saveQuillsNtfy", { url: "https://ntfy.example.test/topic" }],
  segment: ["saveQuillsSegmentConnection", { incomingSecret: "secret_value" }],
  shortcut: ["saveQuillsShortcutToken", { apiToken: "token_value" }],
  stripe: ["saveQuillsStripeKey", { apiKey: "rk_value" }],
  zapier: [
    "saveQuillsZapierWebhook",
    { webhookUrl: "https://hooks.zapier.test/1" },
  ],
};

describe("connectors", () => {
  it("has one connector for each provider with a connect operation", () => {
    expect(Object.keys(connectors).sort()).toEqual(
      [...Object.keys(oauth), ...Object.keys(keys)].sort(),
    );
  });

  it("returns the sign-in address of each OAuth provider from its own operation", async () => {
    const api = mockApi();
    for (const [id, operationId] of Object.entries(oauth)) {
      api.reply({ authorizeUrl: `https://${id}.example.test/authorize` });
      const values: Record<string, string> =
        id === "zendesk" ? { subdomain: "acme" } : {};
      await expect(
        connectors[id]!.connect("workspace_1", values),
      ).resolves.toBe(`https://${id}.example.test/authorize`);
      expect(api.calls(operationId)).toHaveLength(1);
    }
    const [zendesk] = api.calls("startQuillsZendeskOAuthConnect");
    expect(new URL(zendesk!.url).searchParams.get("subdomain")).toBe("acme");
  });

  it("saves each key or webhook with its own operation and drops empty optional values", async () => {
    const api = mockApi();
    for (const [id, [operationId, values]] of Object.entries(keys)) {
      api.reply({ integration: null });
      const sent = id === "ntfy" ? { ...values, token: "" } : values;
      await expect(connectors[id]!.connect("workspace_1", sent)).resolves.toBe(
        null,
      );
      const [request] = api.calls(operationId);
      expect(new URL(request!.url).pathname).toContain("/quills/workspace_1/");
      expect(await request!.json()).toEqual(values);
    }
  });
});
