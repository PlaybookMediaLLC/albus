# Quills AI layer

Every Quills AI call goes through the AI SDK (`ai` and `@ai-sdk/openai-compatible`), and only this
folder imports it (`framework/boundaries.test.ts` checks that). Other code calls `provider.ts`
(`chat`, `chatJson`, `embed`) or runs a capability with `runCapability`. The shape follows the
oppulence-canvas AI package: model roles, one registry, middleware, typed capabilities and evals.

## How a call flows

1. **Configuration** (`config.ts`): the `QUILLS_AI_*` variables, read on each call. Any
   OpenAI-compatible server works: OpenRouter (the documented default), OpenAI or a local model.
2. **Model roles** (`config.ts`, `@quills/ai/capability`): `fast` classifies, extracts and judges;
   `deep` answers and writes. `QUILLS_AI_MODEL` serves both; `QUILLS_AI_MODEL_FAST` and
   `QUILLS_AI_MODEL_DEEP` override one role.
3. **Registry** (`registry.ts`): the only place that builds a model. It wraps every chat model with
   the middleware, refuses redirects, and passes image links to the provider without downloading
   them.
4. **Middleware** (`middleware.ts`): the output-token backstop, a default of 1,024 tokens and a
   ceiling of 8,192 (just above the long translations) that no call can pass.
5. **Calls** (`calls.ts`): `generateText` in JSON mode and `embedMany`, with no retries inside a
   call (the job retries) and a 60-second timeout. Messages keep the OpenAI shape that Quills code
   writes (`messages.ts` converts them), so the request on the wire does not change. `compat.ts`
   evens out compatible servers: it fills a missing `finish_reason` and puts embeddings in `index`
   order.
6. **Output repair** (`repair.ts`): an answer that does not parse gets one repair (a Markdown fence,
   text around the object, trailing commas) before it counts as a bad response.
7. **Errors** (`errors.ts`): an AI SDK or network failure becomes an `AiError` with a fixed
   message. Provider text and the key never reach a response, a log or a run. Our own bugs are
   thrown as they are.
8. **Cost** (`pricing.ts`): `logUsage` writes `cost_usd` on each usage row from `QUILLS_AI_PRICES`.
   A model without a price, such as a local one, gets no cost. The monthly limit still counts
   tokens.

## Add a capability

A capability is one model request as data: its prompt, model role, answer schema and usage step. It
lives in `@quills/ai` (no IO) and runs here.

1. Scaffold it:

   ```sh
   node scripts/quills-ai/new.mjs capability reply-tone --role deep
   ```

   This writes `packages/quills-ai/src/capabilities/reply-tone.ts` with its test, the eval
   `apps/api/src/quills/ai-eval/reply-tone.eval.ts`, and the `@quills/ai/capabilities` export.
2. Replace every `TODO(quills-ai)` marker: the task, the answer schema (cut long text with a
   transform instead of rejecting it) and synthetic eval cases. Put customer and teammate text
   through `wrap`, so the model reads it as data.
3. Call it from the job or the route, outside any transaction, and write the usage row in the
   job's own transaction:

   ```ts
   const answer = await runCapability(replyTone, { text });
   // ...later, in the Write:
   await logUsage(db, [answer.entry]);
   ```

4. Check it: `pnpm --filter @quills/ai build && pnpm --filter @quills/ai test`, the API tests that
   cover the job, and the live eval (`src/quills/ai-eval/README.md`).

The worked examples are Teach the AI (`@quills/ai/teach`: `extractKnowledge`,
`askKnowledgeQuestions`, `judgeSameKnowledge`, `draftKnowledge`) and the duplicate check and tag
backfill (`@quills/ai/learning`: `judgeDuplicate`, `chooseTags`). Other features still call
`chatJson` with their prompts inline; move one to a capability when you change it.

## Store: an AI job

An AI job on the `quills.ai` queue uses `defineAiJob` (`job.ts`), which keeps the database rules in
one place:

1. `read(db, event)`: a short system-scoped read of what the model needs, or null.
2. `run(context, ai)`: the model calls, with no transaction open. `ai.capability` and `ai.embed`
   log each call and stop at the time budget; `ai.read` does a short read between calls.
3. `write(db, context, result)`: the result, its events (`recordQuillsChange`) and its usage rows,
   in the job's own transaction, which commits with the job.
4. `fallback(db, context)`, optional: what to store without a provider or when a call fails, for
   example the AI's first text. Without it, a provider failure fails the job, which retries; the
   usage of the calls that succeeded is logged first, so the monthly limit counts them.

Register it in `engine/index.ts` (`assistantWork`) under its event, and list the event in
`events.ts`. `draftKnowledgeSuggestion` (`engine/teach.ts`) is the worked example. Scaffold one with
`node scripts/quills-ai/new.mjs job <name>`.

## Tools

A tool (`tool.ts`) is tied to four things:

- **The workspace.** A read tool runs in a system-scoped read of the workspace and returns only
  what the asking teammate may read. A write tool changes data only through the domain function
  that the teammate's own route calls.
- **The teammate's permissions.** The model sees a tool only while the asking teammate holds its
  `action` now; a call to a tool it was not offered never runs and is recorded as denied.
- **The agent.** The registry (`tools/index.ts`) offers the tools that fit the turn and that an
  admin did not turn off; `runToolLoop` (`agent.ts`) runs the AI SDK tool loop: at most 4 steps,
  the last without tools, at most 5 calls in a step, one at a time, with a timeout for each step
  and for the turn. A handler's own error (a bug, such as a failed query) stops the loop before
  the next model call, so its text never reaches the provider, and the turn fails.
- **The audit and the eval.** Every call that runs or is denied writes an `assistant_tool_calls`
  row (a call over the step limit is skipped and has none), which the copilot eval reads to check
  that the model called the right tool and never a forbidden one.

A write tool declares its approval policy: `required` makes a pending action that a teammate
approves (`pending-actions.ts`); `auto` runs as the asking teammate in the job's transaction when
the answer is stored, after a fresh permission check (`engine/tool-writes.ts`). Each `auto` write
runs in a savepoint: a domain refusal, such as a tag that does not exist, marks that write failed
and keeps the answer. Use `auto` only for a change that is internal to the team and easy to undo.
Every tool today is `required`.

Scaffold one with `node scripts/quills-ai/new.mjs tool <name>` or `write-tool <name>`, list it in
`tools/index.ts`, and add an eval case. The copilot (`engine/copilot.ts`) is the worked example;
connector (MCP) tools join the same loop with their own policies.

## Rules

- Never import `ai` or `@ai-sdk/*` outside this folder.
- Never call a model inside a database transaction. Read, call the model, then write.
- Log usage with `logUsage` in the job's transaction, including the calls that succeeded before a
  failure.
- Keep eval data synthetic. Never send production data or production keys to an eval.
