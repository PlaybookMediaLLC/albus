# Live AI eval

The eval runs the shipped AI paths against a real provider: the same routes, jobs, prompts and
parsers that production uses, on a disposable `quills_` database. Each feature has cases with named
checks and a bar (the share of cases that must pass). A check named `safety: ...` must always hold.

It is for development only. It never runs in CI, it is not in the image, and it uses synthetic data
only. Never point it at production data or production keys.

## Set up

1. Create an OpenRouter key and give it a credit limit, for example $5. The limit is the cost cap.
2. Put these lines in the root `.env`. The eval reads only the `QUILLS_AI_*` lines from it:

   ```sh
   QUILLS_AI_BASE_URL=https://openrouter.ai/api/v1
   QUILLS_AI_API_KEY=...
   QUILLS_AI_MODEL=google/gemini-2.5-flash-lite
   QUILLS_AI_EMBEDDING_MODEL=openai/text-embedding-3-small
   ```

3. Start a local PostgreSQL with pgvector and create an empty database whose name starts with
   `quills_`. Build the AI package once: `pnpm --filter @quills/ai build`.

## Run

From `apps/api`:

```sh
# One model: the QUILLS_AI_MODEL from .env
QUILLS_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55433/quills_eval pnpm eval:ai

# One feature
QUILLS_TEST_DATABASE_URL=... pnpm eval:ai src/quills/ai-eval/customer-agent.eval.ts

# Find the cheapest model that passes: the 3 cheapest OpenRouter chat models with JSON mode and tools
QUILLS_TEST_DATABASE_URL=... pnpm eval:ai:compare
QUILLS_TEST_DATABASE_URL=... pnpm eval:ai:compare --top 5
QUILLS_TEST_DATABASE_URL=... pnpm eval:ai:compare --models google/gemini-2.5-flash-lite,openai/gpt-5-nano
```

Each feature writes `apps/api/.cache/ai-eval/<model>/<feature>.json` with every case, its checks,
what the model produced, and the tokens per model. `eval:ai:compare` writes
`apps/api/.cache/ai-eval/summary.md`. It prices the chat tokens with OpenRouter's public model list
and recommends the cheapest model that passes every bar with no safety failure. A full run is about
400 provider calls.

A failed AI job runs again up to twice, as its backoff does in production. A job that still fails
counts as a failed `job succeeded` check: that is a format or provider failure, not a wrong answer.

## What it covers

| Feature | File | Bar | What the cases check |
|---|---|---|---|
| Customer agent | `customer-agent.eval.ts` | 85 % | Grounded answers and citations, handoff (unknown question, a person asked for, frustration), feedback cards, paraphrases, other languages, follow-up questions. Safety: no team-only snippet, no internal note, no system prompt, no instruction from a source |
| Widget answers and search | `knowledge.eval.ts` | 80 % | Semantic search finds the article for a paraphrase; the widget's answer states the fact and cites it. Safety: no private-category article |
| Copilot | `copilot.eval.ts` | 80 % | Team and public knowledge, history, "I do not know", proposals only. Safety: a write tool never changes the conversation; the customer's text never drives a tool |
| Teach the AI | `teach.eval.ts` | 80 % | Durable facts found, small talk and one-off actions ignored, repeated topics attached by the real embeddings and judge, dismissed topics discarded, answers used in the draft. Safety: no personal data, no injected text |
| Duplicate check | `duplicates.eval.ts` | 80 % | 60 labelled pairs through the embedding gate and the verdict |
| Tag backfill | `tags.eval.ts` | 75 % | 40 posts after 20 hand-tagged examples: no wrong tag and at least one right tag |
| Feedback signals | `signals.eval.ts` | 80 % | Requests and bugs found, matched to a similar post, questions and thanks ignored. Safety: no injected title |
| Summaries | `summaries.eval.ts` | 85 % | Conversation, ticket and post summaries keep the facts. Safety: no instruction from the text |
| Text tools | `transform.eval.ts` | 85 % | Tone, length, grammar, rephrase and translation keep facts, links and placeholders |
| Translation | `translation.eval.ts` | 80 % | Message translation keeps facts; article translation keeps protected terms, links and Markdown |
| Drafts | `drafts.eval.ts` | 80 % | Changelog entry from posts; title and board for an untitled customer post |
| Attributes | `attributes.eval.ts` | 75 % | Description draft; detection picks the allowed value or none |
| Sentiment | `sentiment.eval.ts` | 85 % | Positive, neutral and negative posts |
| Teach judge (capability) | `teach-same.eval.ts` | 85 % | Same guidance in other words, and different plans, time frames, actions and topics. Safety: no instruction from the text |

Not covered yet: the portal and widget post-draft helper and portal translations (customer
sessions use a different test harness), the Slack answer, ticket field suggestions, workspace
search, app post suggestions, web source fetching and the image check.

## Two templates

- `evalSuite(feature, bar, body)` (`suite.ts`): the behavior through routes and jobs on the test
  database, for anything that depends on stored data.
- `capabilitySuite(capability, bar, cases)` (`capability.ts`): one capability on its own, run as
  the API runs it, with no database. Each case has an `input` and `checks(value)`.
  `teach-same.eval.ts` is the example, and the generator (`scripts/quills-ai/new.mjs capability`) writes one for each new
  capability (`src/quills/assistant/ai/README.md`).

Both write the same report, so `eval:ai:compare` counts every eval file.

## Change a bar or a case

A bar is a product decision: raise it when a cheaper model must not ship a worse answer. Keep each
case's data synthetic and its checks specific; a check that a correct answer can fail makes the eval
noisy. Add a `safety:` check only for something that must never happen.
