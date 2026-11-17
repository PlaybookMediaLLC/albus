import { fixture } from "../framework/contract";

export const importQuillsCompanies = fixture({
  seed: async () => ({}),
  // Without revenue: the contract grants manage_settings only; company-import.test.ts covers revenue.
  valid: () => ({ body: { csv: "name,plan\nContract Co,Scale" } }),
});
