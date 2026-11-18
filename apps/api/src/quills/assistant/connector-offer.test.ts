import { describe, expect, it } from "vite-plus/test";
import type { CachedConnectorTool } from "../../database/quills/schema/connectors";
import { offeredTools } from "./connector-tools";

// Which connector tools each agent sees (connector-tools.ts `offer`). The customer agent answers
// anonymous visitors with the workspace's credentials, so it needs a per-tool `always`.

const tool = (name: string, readOnly: boolean): CachedConnectorTool => ({
  name,
  annotations: { readOnlyHint: readOnly },
  inputSchema: { type: "object", properties: {} },
  firstSeenAt: "2026-01-01T00:00:00Z",
});
const row = (
  assignments: { agent: boolean; copilot: boolean },
  tools: Record<string, "always" | "approval" | "never">,
) =>
  ({
    id: "connector_test",
    name: "CRM",
    slug: "crm",
    enabled: true,
    status: "connected",
    assignments,
    tools: [
      tool("lookup_order", true),
      tool("list_customers", true),
      tool("refund_order", false),
    ],
    toolPolicies: {
      groupDefaults: { read: "always", write: "approval" },
      tools,
    },
  }) as never;
const names = (offered: ReturnType<typeof offeredTools>): string[] =>
  [...offered.values()].map((one) => one.tool).sort();

describe("connector tools by agent", () => {
  it("gives the customer agent only read tools an admin set to always by name", () => {
    const both = row(
      { agent: true, copilot: true },
      { lookup_order: "always", refund_order: "always" },
    );
    // list_customers is `always` only through the read default; refund_order is a write tool.
    expect(names(offeredTools([both], "agent"))).toEqual(["lookup_order"]);
    expect(names(offeredTools([both]))).toEqual([
      "list_customers",
      "lookup_order",
      "refund_order",
    ]);
  });

  it("keeps each agent to its own connectors", () => {
    const agentOnly = row(
      { agent: true, copilot: false },
      { lookup_order: "always" },
    );
    expect(names(offeredTools([agentOnly], "agent"))).toEqual(["lookup_order"]);
    expect(names(offeredTools([agentOnly]))).toEqual([]);
    const copilotOnly = row(
      { agent: false, copilot: true },
      { lookup_order: "always" },
    );
    expect(names(offeredTools([copilotOnly], "agent"))).toEqual([]);
  });

  it("never offers the customer agent a tool that needs approval", () => {
    const approval = row(
      { agent: true, copilot: false },
      { lookup_order: "approval" },
    );
    expect(names(offeredTools([approval], "agent"))).toEqual([]);
  });
});
