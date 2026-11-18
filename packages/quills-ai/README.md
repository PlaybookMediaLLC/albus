# @quills/ai

AI building blocks for Quills that do no IO. The API passes data in and gets data and prompt
messages back. The first module, `learning`, turns earlier teammate decisions into examples for a
prompt. The design record is issue #275.

## Rules

1. **No IO.** No database, no `process.env`, no `fetch`, no Hono, no logger, no `node:` modules.
   `src/purity.test.ts` checks the imports.
2. **Zod 4 only,** the same major version as `apps/api`. No other runtime dependency.
3. **The API owns the domain.** The package does not know workspaces, permissions, boards or tables.
   It receives a scope and a visibility value, and requires the store to honour them.
4. **One responsibility per file,** with tests next to the code.

## Exports

Import from `@quills/ai/learning` (or the root, which re-exports it).

| Name | Purpose |
|---|---|
| `TASK_KINDS`, `TaskKind` | `"duplicate"`, `"tags"` |
| `ExampleSchema`, `Example` | One decision as text: `key`, `task`, `input`, `output`, `similarity`, `decidedAt` |
| `ExampleQuerySchema`, `ExampleQuery` | What a caller asks a store for |
| `VisibilitySchema`, `Visibility` | `boardIds` and `includeUnlinkedBoards` |
| `SelectOptionsSchema`, `SelectOptions` | `k`, `minSimilarity`, `maxSameAnswer`, `maxCharsPerExample`, `maxCharsTotal`, `freshnessWeight`, `freshnessHalfLifeDays`, `now` |
| `ExampleStore` | The port: `dimensions` and `findExamples(query)` |
| `findExamples(store, query)` | Validates the query, checks the vector length, calls the store, validates each row |
| `selectExamples(candidates, options)` | Threshold on similarity, de-duplication, ranking (80 % similarity, 20 % freshness with a 90-day half-life by default), answer balance, cuts and caps |
| `renderExamples(task, examples, wrap)` | The examples block for the start of the final user message, or `null` when there is no example |
| `EXAMPLES_GUIDANCE` | One sentence per task for the end of the system prompt |
| `TASKS`, `PAIR_SIDE_CHARS` | Per-task options and the pair side length |
| `LEARNING_ERROR_KINDS`, `LearningError` | `invalid_query`, `dimension_mismatch`, `invalid_example`, `scope_mismatch` |
| `InMemoryExampleStore` | The reference store, for tests |

### Teach

Import from `@quills/ai/teach`. These helpers turn a closed conversation into a knowledge
suggestion; the API's `engine/teach.ts` does the IO.

| Name | Purpose |
|---|---|
| `TranscriptMessage`, `sourceTranscript(messages)` | Keeps customer and teammate replies (no notes, no assistant replies), redacts them, and cuts them to 1,000 characters each and 8,000 in total |
| `redact(text)` | Replaces emails, links, phone numbers and runs of 6 or more digits |
| `topicFingerprint(topic)` | 16 hex characters from the sorted, unique words of a topic without stopwords |
| `routeCandidate(match)` | `discard` for an approved or dismissed match, `attach` for an open one, otherwise `create` |
| `statusAfterPlanning(count)`, `afterTurn(state)` | The next status after the questions are planned, and after each answer or skip |
| `SUGGESTION_STATUSES`, `OPEN_STATUSES`, `MAX_QUESTIONS` | The statuses, the open ones, and the limit of 3 questions |
| `CandidateAnswerSchema`, `QuestionsAnswerSchema`, `DraftAnswerSchema`, `SameAnswerSchema` | The provider answers that the API validates |
| `extractPrompt`, `questionsPrompt`, `draftPrompt`, `samePrompt`, `embeddingText` | The requests for each step |

### Capabilities

Import `defineCapability` and the types from `@quills/ai/capability`. A capability is one model
request as data: `id`, `role` (`fast` or `deep`), `step` (the usage row's pipeline step), `schema`,
an optional `maxOutputTokens`, and `prompt(input, wrap)`, which returns one system and one user
message. It does no IO; the API runs it with `runCapability` (`apps/api/src/quills/assistant/ai/`).

| Capability | Export | Role |
|---|---|---|
| Find a durable fact in a closed conversation | `extractKnowledge` (`./teach`) | fast |
| Find up to 3 FAQ items a knowledge document answers | `extractDocumentFaqs` (`./teach`) | fast |
| Ask the teammate up to 3 questions | `askKnowledgeQuestions` (`./teach`) | fast |
| Judge whether two facts give the same guidance | `judgeSameKnowledge` (`./teach`) | fast |
| Write the final snippet | `draftKnowledge` (`./teach`) | deep |
| Judge whether two posts are duplicates | `judgeDuplicate` (`./learning`) | fast |
| Choose tags for a batch of posts | `chooseTags` (`./learning`) | fast |

`node scripts/quills-ai/new.mjs capability <name>` scaffolds a new one in `src/capabilities/` with
its test, its eval and the `./capabilities` export.

## The port contract

Every `ExampleStore` must:

1. Filter every query on `scopeId`. A row of another scope must never come back.
2. Return only rows whose vector came from `embeddingModel`.
3. Return only rows on visible boards. For a pair, both posts must be on visible boards.
4. Use a subject's stored vector when its `embedding` is `null`. Skip a subject without one, and
   return `[]` when no subject has a vector.
5. Rank a row by its similarity to the closest subject (`1 - cosine distance`). Return at most
   `limit` rows, nearest first.
6. Never return a key in `excludeKeys`, and never return a subject.
7. Return `[]` when nothing matches. Never throw for "no data".
8. Throw for a real failure. Do not hide it.

`src/learning/providers/in-memory.test.ts` checks the contract against `InMemoryExampleStore`. The
API's store (`apps/api/src/quills/assistant/engine/learning-store.ts`) is checked by
`apps/api/src/quills/assistant/learning.test.ts` on PostgreSQL.

## Example

```ts
import {
  EXAMPLES_GUIDANCE,
  TASKS,
  findExamples,
  renderExamples,
  selectExamples,
} from "@quills/ai/learning";

const rows = await findExamples(store, {
  task: "duplicate",
  scopeId: workspaceId,
  subjects: [{ key: post.id, embedding: freshVector ?? null }],
  embeddingModel,
  visibility: { boardIds: [post.boardId], includeUnlinkedBoards: true },
  excludeKeys: candidateIds,
});
const block = renderExamples(
  "duplicate",
  selectExamples(rows, TASKS.duplicate),
  untrusted, // the caller's untrusted-text wrapper
);
// With a block: add EXAMPLES_GUIDANCE.duplicate to the system prompt and put the block at the
// start of the final user message (one user turn: some local chat templates reject two in a row).
// Without one: send the prompt unchanged.
```

## Build

The API bundles with `esbuild --packages=external`, so Node loads this package from `dist` at
runtime. `pnpm --filter @kaneo/api typecheck`, `test` and `build` build it first. Run
`pnpm --filter @quills/ai build` yourself before `pnpm --filter @kaneo/api test:quills` or the API
dev server. Both Dockerfiles that build the API (`apps/api/Dockerfile`, `Dockerfile.kaneo`) build it
and copy its `dist`.

```sh
pnpm --filter @quills/ai typecheck
pnpm --filter @quills/ai test
pnpm --filter @quills/ai build
```
