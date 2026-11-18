import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { answerKnowledgeSuggestionFixture } from "../../api/team/answer-knowledge-suggestion.fixture";
import { approveKnowledgeSuggestionFixture } from "../../api/team/approve-knowledge-suggestion.fixture";
import { dismissKnowledgeSuggestionFixture } from "../../api/team/dismiss-knowledge-suggestion.fixture";
import { listKnowledgeSuggestionsFixture } from "../../api/team/list-knowledge-suggestions.fixture";
import { updateKnowledgeSuggestionFixture } from "../../api/team/update-knowledge-suggestion.fixture";
import { fill, press } from "../../test/actions";
import { describePageContract } from "../../test/contracts";
import { mockApi } from "../../test/mock-api";
import { renderPage } from "../../test/render";
import { knowledgeFixture } from "./knowledge.fixture";
import { meta } from "./meta";
import { TeamKnowledgePage } from "./team-knowledge-page";

const gap = knowledgeFixture.suggestion();
const other = knowledgeFixture.suggestion({
  id: "knowledge_test_2",
  gap: false,
  candidateTitle: "Shipping times",
});
const detail = knowledgeFixture.detail();
const [first, second] = detail.questions;
const ready = knowledgeFixture.detail({
  status: "draft_ready",
  stepIndex: 2,
  title: "Refund policy",
  content: "Refunds take five days.",
  questions: [
    { ...first!, answer: "Yes" },
    { ...second!, skipped: true },
  ],
});

describe("TeamKnowledgePage", () => {
  describePageContract(meta, TeamKnowledgePage, {
    loading: {
      prepare: () => {
        const api = mockApi();
        api.defer(() => undefined);
      },
    },
    failed: {
      prepare: () => {
        const api = mockApi();
        api.fail();
      },
    },
    ready: {
      prepare: () => {
        const api = mockApi();
        api.reply(listKnowledgeSuggestionsFixture.ok());
      },
    },
    done: {
      prepare: () => {
        const api = mockApi();
        api.reply(listKnowledgeSuggestionsFixture.ok());
      },
    },
  });

  describe("behavior", () => {
    it("puts the gaps first, answers a question and skips the next one", async () => {
      const api = mockApi();
      api.reply(knowledgeFixture.list([gap, other]));
      api.reply(detail);
      api.reply(answerKnowledgeSuggestionFixture.ok());
      api.reply(knowledgeFixture.list([gap, other]));
      api.reply(
        knowledgeFixture.detail({
          stepIndex: 1,
          questions: [{ ...first!, answer: "Yes" }, second!],
        }),
      );
      api.reply(answerKnowledgeSuggestionFixture.ok());
      api.reply(knowledgeFixture.list([gap, other]));
      api.reply(
        knowledgeFixture.detail({
          status: "drafting",
          stepIndex: 2,
          questions: [
            { ...first!, answer: "Yes" },
            { ...second!, skipped: true },
          ],
        }),
      );
      const view = renderPage(TeamKnowledgePage, meta);
      const gaps = await view.findByRole("group", {
        name: "The AI could not answer 1",
      });
      const others = view.getByRole("group", {
        name: "From teammate answers 1",
      });
      expect(gaps).toHaveTextContent("Refunds");
      expect(others).toHaveTextContent("Shipping times");
      expect(
        gaps.compareDocumentPosition(others) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      fireEvent.click(view.getByRole("link", { name: /Refunds/ }));
      expect(
        await view.findByRole("region", { name: "Question 1 of 2" }),
      ).toBeInTheDocument();
      fireEvent.click(view.getByRole("button", { name: "Yes" }));
      press("Send answer");
      expect(
        await view.findByRole("region", { name: "Question 2 of 2" }),
      ).toBeInTheDocument();
      const answer = api.calls("answerQuillsKnowledgeSuggestion")[0]!;
      expect(new URL(answer.url).pathname).toContain(
        "/assistant/knowledge-suggestions/knowledge_test_1/answer",
      );
      expect(await answer.clone().json()).toEqual({
        stepIndex: 0,
        answer: "Yes",
      });
      press("Skip question");
      expect(
        await view.findByText("The AI is writing the draft from your answers."),
      ).toBeInTheDocument();
      expect(
        await api.calls("answerQuillsKnowledgeSuggestion")[1]!.clone().json(),
      ).toEqual({ stepIndex: 1, skip: true });
    });

    it("approves the edited draft for the customer agent without a save first", async () => {
      const api = mockApi();
      api.reply(knowledgeFixture.list([gap]));
      api.reply(ready);
      api.reply(approveKnowledgeSuggestionFixture.ok());
      api.reply(listKnowledgeSuggestionsFixture.ok());
      const view = renderPage(TeamKnowledgePage, meta);
      fireEvent.click(await view.findByRole("link", { name: /Refunds/ }));
      expect(await view.findByLabelText("Title")).toHaveValue("Refund policy");
      fireEvent.click(
        view.getByRole("radio", { name: "Also the customer agent" }),
      );
      fill("Content", "Refunds take five days and include shipping.");
      press("Approve");
      expect(
        await view.findByText("“Refund policy” is now a snippet."),
      ).toHaveAttribute("role", "status");
      expect(
        await api.calls("approveQuillsKnowledgeSuggestion")[0]!.clone().json(),
      ).toEqual({
        audience: "public",
        title: "Refund policy",
        content: "Refunds take five days and include shipping.",
      });
      expect(view.getByText("Nothing is here yet.")).toBeInTheDocument();
    });

    it("saves an edited draft", async () => {
      const api = mockApi();
      api.reply(knowledgeFixture.list([gap]));
      api.reply(ready);
      api.reply(updateKnowledgeSuggestionFixture.ok(ready));
      api.reply(knowledgeFixture.list([gap]));
      api.reply(ready);
      const view = renderPage(TeamKnowledgePage, meta);
      fireEvent.click(await view.findByRole("link", { name: /Refunds/ }));
      await view.findByLabelText("Title");
      fill("Content", "Refunds take five days and include shipping.");
      press("Save draft");
      expect(await view.findByText("The draft is saved.")).toBeInTheDocument();
      expect(
        await api.calls("updateQuillsKnowledgeSuggestion")[0]!.clone().json(),
      ).toEqual({
        title: "Refund policy",
        content: "Refunds take five days and include shipping.",
      });
    });

    it("opens the next suggestion with the team audience", async () => {
      const api = mockApi();
      const second = knowledgeFixture.suggestion({
        id: "knowledge_test_2",
        status: "draft_ready",
        candidateTitle: "Shipping times",
      });
      api.reply(knowledgeFixture.list([gap, second]));
      api.reply(ready);
      api.reply(
        knowledgeFixture.detail({
          ...ready,
          id: second.id,
          candidateTitle: "Shipping times",
          title: "Shipping times",
        }),
      );
      const view = renderPage(TeamKnowledgePage, meta);
      fireEvent.click(await view.findByRole("link", { name: /Refunds/ }));
      await view.findByLabelText("Title");
      fireEvent.click(
        view.getByRole("radio", { name: "Also the customer agent" }),
      );
      press("Next");
      await view.findByRole("heading", { level: 1, name: "Shipping times" });
      expect(
        await view.findByRole("radio", { name: "Teammates and the copilot" }),
      ).toBeChecked();
    });

    it("dismisses a suggestion and opens the next one", async () => {
      const api = mockApi();
      api.reply(knowledgeFixture.list([gap, other]));
      api.reply(detail);
      api.reply(dismissKnowledgeSuggestionFixture.ok());
      api.reply(knowledgeFixture.list([other]));
      api.reply(knowledgeFixture.detail({ ...other, questions: [] }));
      const view = renderPage(TeamKnowledgePage, meta);
      fireEvent.click(await view.findByRole("link", { name: /Refunds/ }));
      await view.findByRole("region", { name: "Question 1 of 2" });
      press("Dismiss");
      expect(
        await view.findByRole("heading", { level: 1, name: "Shipping times" }),
      ).toBeInTheDocument();
      expect(api.calls("dismissQuillsKnowledgeSuggestion")).toHaveLength(1);
    });
  });
});
