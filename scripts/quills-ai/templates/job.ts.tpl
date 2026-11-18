import { defineAiJob } from "../ai/job";

// TODO(quills-ai): what this AI job does, on which event, and what it stores.

export const {{camel}} = defineAiJob({
  // A short system-scoped read of what the model needs. Null: nothing to do.
  read: async (_db, event) => {
    // TODO(quills-ai): read the rows for event.entityId.
    return { id: event.entityId };
  },
  // The model calls, with no transaction open. ai.capability logs each call's usage.
  run: async (_context, _ai) => {
    // TODO(quills-ai): return await ai.capability(someCapability, input);
    return null;
  },
  // Stores the result, its events (recordQuillsChange) and nothing else, in the job's transaction.
  write: async (_db, _context, _result) => {
    // TODO(quills-ai): write the result.
  },
});
