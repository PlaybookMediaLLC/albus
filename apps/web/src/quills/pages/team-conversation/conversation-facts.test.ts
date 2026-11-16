import { describe, expect, it } from "vite-plus/test";
import { getConversationFixture } from "../../api/team/get-conversation.fixture";
import { conversationFacts } from "./conversation-facts";

const t = (key: string, options?: Record<string, unknown>) =>
  options ? `${key} ${JSON.stringify(options)}` : key;
const now = Date.parse("2026-11-16T12:00:00.000Z");
const base = getConversationFixture.ok({
  channel: "email",
  status: "open",
  createdAt: "2026-11-13T09:30:00.000Z",
  waitingSince: "2026-11-16T11:20:00.000Z",
});

describe("conversationFacts", () => {
  it("lists the channel, the start and the wait of an open conversation", () => {
    expect(
      conversationFacts(base, t, "en-US", now).map((fact) => [
        fact.key,
        fact.value,
      ]),
    ).toEqual([
      ["channel", "team-conversations.facts.email"],
      ["started", expect.stringContaining("Nov 13")],
      ["waitingSince", "40m ago"],
    ]);
  });

  it("shows the snooze end instead of the wait, and the language and rating when known", () => {
    const facts = conversationFacts(
      {
        ...base,
        status: "snoozed",
        snoozedUntil: "2026-11-20T09:00:00.000Z",
        translation: {
          enabled: false,
          detectedLanguage: "de",
          dismissedAt: null,
        },
        csatRating: 4,
        csatComment: "Quick answer",
      },
      t,
      "en-US",
      now,
    );
    expect(facts.map((fact) => fact.key)).toEqual([
      "channel",
      "started",
      "snoozedUntil",
      "language",
      "rating",
    ]);
    expect(facts[3]!.value).toBe("German");
    expect(facts[4]!.value).toBe(
      'team-conversations.facts.ratingValue {"rating":4} · “Quick answer”',
    );
  });

  it("keeps an unknown channel and language code as they are", () => {
    const facts = conversationFacts(
      {
        ...base,
        channel: "fax" as never,
        waitingSince: null,
        translation: {
          enabled: false,
          detectedLanguage: "??",
          dismissedAt: null,
        },
      },
      t,
      "en-US",
      now,
    );
    expect(facts.map((fact) => fact.value)).toEqual([
      "fax",
      expect.any(String),
      "??",
    ]);
  });
});
