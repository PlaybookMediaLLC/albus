import type { UpdateAssistantSettingsResponse } from "./update-assistant-settings";
export const updateAssistantSettingsFixture = {
  ok: (overrides: Partial<UpdateAssistantSettingsResponse> = {}) =>
    ({
      ...{
        revision: 0,
        aiConfigured: false,
        embeddingsConfigured: false,
        identity: { name: "value" },
        agent: {
          enabled: false,
          productDescription: "value",
          voice: {
            tone: "friendly",
            responseLength: "concise",
            additionalInstructions: "value",
          },
          knowledge: {
            helpCenter: false,
            posts: false,
            changelog: false,
            documents: false,
            status: false,
          },
          toolRules: [],
        },
        copilot: {
          qa: false,
          knowledge: {
            helpCenter: false,
            posts: false,
            changelog: false,
            documents: false,
            status: false,
            pastConversations: false,
            internalNotes: false,
            tickets: false,
          },
          toolRules: [],
        },
      },
      ...overrides,
    }) satisfies UpdateAssistantSettingsResponse,
  problem: (status: 401 | 403 | 409 | 429) => ({
    status,
    body: { message: "Request could not be completed" },
  }),
};
