import { saveAzureDevopsKey } from "../../api/team/save-azure-devops-key";
import { saveFreshdeskKey } from "../../api/team/save-freshdesk-key";
import { saveMakeWebhook } from "../../api/team/save-make-webhook";
import { saveN8nWebhook } from "../../api/team/save-n8n-webhook";
import { saveNtfy } from "../../api/team/save-ntfy";
import { saveSegmentConnection } from "../../api/team/save-segment-connection";
import { saveShortcutToken } from "../../api/team/save-shortcut-token";
import { saveStripeKey } from "../../api/team/save-stripe-key";
import { saveZapierWebhook } from "../../api/team/save-zapier-webhook";
import { startAsanaOAuthConnect } from "../../api/team/start-asana-oauth-connect";
import { startClickupOAuthConnect } from "../../api/team/start-clickup-oauth-connect";
import { startDiscordOAuthConnect } from "../../api/team/start-discord-oauth-connect";
import { startGithubOAuthConnect } from "../../api/team/start-github-oauth-connect";
import { startGitlabOAuthConnect } from "../../api/team/start-gitlab-oauth-connect";
import { startHubspotOAuthConnect } from "../../api/team/start-hubspot-oauth-connect";
import { startIntercomOAuthConnect } from "../../api/team/start-intercom-oauth-connect";
import { startJiraOAuthConnect } from "../../api/team/start-jira-oauth-connect";
import { startLinearOAuthConnect } from "../../api/team/start-linear-oauth-connect";
import { startMondayOAuthConnect } from "../../api/team/start-monday-oauth-connect";
import { startNotionOAuthConnect } from "../../api/team/start-notion-oauth-connect";
import { startSalesforceOAuthConnect } from "../../api/team/start-salesforce-oauth-connect";
import { startSlackOAuthConnect } from "../../api/team/start-slack-oauth-connect";
import { startTeamsOAuthConnect } from "../../api/team/start-teams-oauth-connect";
import { startTrelloOAuthConnect } from "../../api/team/start-trello-oauth-connect";
import { startZendeskOAuthConnect } from "../../api/team/start-zendesk-oauth-connect";

export interface ConnectField {
  /** The body or query field of the connect operation. */
  name: string;
  labelKey: string;
  secret?: boolean;
  optional?: boolean;
}

export interface Connector {
  /** Empty for an OAuth provider: Connect then opens the provider at once. */
  fields: readonly ConnectField[];
  /** Saves the connection, or returns the provider's sign-in address for OAuth. */
  connect: (
    workspaceId: string,
    values: Record<string, string>,
  ) => Promise<string | null>;
}

type Param = { param: { workspaceId: string } };

const oauth = (
  start: (input: Param) => Promise<{ authorizeUrl: string }>,
): Connector => ({
  fields: [],
  connect: async (workspaceId) =>
    (await start({ param: { workspaceId } })).authorizeUrl,
});

// The form checks the required fields. The API checks the patterns and the key itself.
const key = <J>(
  fields: readonly ConnectField[],
  save: (input: Param & { json: J }) => Promise<unknown>,
): Connector => ({
  fields,
  connect: async (workspaceId, values) => {
    const json = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value),
    ) as J;
    await save({ param: { workspaceId }, json });
    return null;
  },
});

const webhook = [
  {
    name: "webhookUrl",
    labelKey: "settings-connections.integrations.fields.webhookUrl",
  },
];

/** How to connect each provider of the integration catalog (settings spec B9), by ID. */
export const connectors: Readonly<Record<string, Connector>> = {
  asana: oauth(startAsanaOAuthConnect),
  clickup: oauth(startClickupOAuthConnect),
  discord: oauth(startDiscordOAuthConnect),
  github: oauth(startGithubOAuthConnect),
  gitlab: oauth(startGitlabOAuthConnect),
  hubspot: oauth(startHubspotOAuthConnect),
  intercom: oauth(startIntercomOAuthConnect),
  jira: oauth(startJiraOAuthConnect),
  linear: oauth(startLinearOAuthConnect),
  monday: oauth(startMondayOAuthConnect),
  notion: oauth(startNotionOAuthConnect),
  salesforce: oauth(startSalesforceOAuthConnect),
  slack: oauth(startSlackOAuthConnect),
  teams: oauth(startTeamsOAuthConnect),
  trello: oauth(startTrelloOAuthConnect),
  zendesk: {
    fields: [
      {
        name: "subdomain",
        labelKey: "settings-connections.integrations.fields.subdomain",
      },
    ],
    connect: async (workspaceId, { subdomain = "" }) => {
      // The typed client leaves out the connect field, but it sends the query.
      const input = { param: { workspaceId }, query: { subdomain } };
      return (await startZendeskOAuthConnect(input)).authorizeUrl;
    },
  },
  azure_devops: key(
    [
      {
        name: "organization",
        labelKey: "settings-connections.integrations.fields.organization",
      },
      {
        name: "token",
        labelKey: "settings-connections.integrations.fields.token",
        secret: true,
      },
    ],
    saveAzureDevopsKey,
  ),
  freshdesk: key(
    [
      {
        name: "subdomain",
        labelKey: "settings-connections.integrations.fields.subdomain",
      },
      {
        name: "apiKey",
        labelKey: "settings-connections.integrations.fields.apiKey",
        secret: true,
      },
    ],
    saveFreshdeskKey,
  ),
  make: key(webhook, saveMakeWebhook),
  n8n: key(webhook, saveN8nWebhook),
  ntfy: key(
    [
      { name: "url", labelKey: "settings-connections.integrations.fields.url" },
      {
        name: "token",
        labelKey: "settings-connections.integrations.fields.token",
        secret: true,
        optional: true,
      },
    ],
    saveNtfy,
  ),
  segment: key(
    [
      {
        name: "incomingSecret",
        labelKey: "settings-connections.integrations.fields.incomingSecret",
        secret: true,
      },
    ],
    saveSegmentConnection,
  ),
  shortcut: key(
    [
      {
        name: "apiToken",
        labelKey: "settings-connections.integrations.fields.apiToken",
        secret: true,
      },
    ],
    saveShortcutToken,
  ),
  stripe: key(
    [
      {
        name: "apiKey",
        labelKey: "settings-connections.integrations.fields.apiKey",
        secret: true,
      },
    ],
    saveStripeKey,
  ),
  zapier: key(webhook, saveZapierWebhook),
};
