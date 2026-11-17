import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { translatePortalContentFixture } from "../../../api/feedback/translate-portal-content.fixture";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { getPublicPortalConfigFixture } from "../../../api/portal/get-public-portal-config.fixture";
import {
  PortalRuntimeProvider,
  type PortalRuntimeValue,
} from "../../../portal/runtime";
import { TranslatedText } from "./translated-text";

const runtime: PortalRuntimeValue = {
  config: getPublicPortalConfigFixture.ok(),
  viewer: { kind: "anonymous" },
  access: null,
  accessLoading: false,
  accessProblem: null,
};

const browser = (language: string) =>
  vi.spyOn(navigator, "language", "get").mockReturnValue(language);

const post = (
  <TranslatedText
    workspaceId="workspace_test_1"
    viewer={{ kind: "anonymous" }}
    target={{ postId: "post_test_1" }}
    content="Please add dark mode."
  />
);

describe("TranslatedText", () => {
  afterEach(() => vi.restoreAllMocks());

  it("offers no translation to an English browser", () => {
    browser("en-GB");
    const api = mockApi();
    const view = renderComponent(post);
    expect(view.getByText("Please add dark mode.")).toBeInTheDocument();
    expect(view.queryByRole("button")).not.toBeInTheDocument();
    expect(api.calls()).toHaveLength(0);
  });

  it("offers no translation when the instance has no AI provider", () => {
    browser("de-DE");
    const api = mockApi();
    const view = renderComponent(
      <TranslatedText
        translatable={false}
        workspaceId="workspace_test_1"
        viewer={{ kind: "anonymous" }}
        target={{ postId: "post_test_1" }}
        content="Please add dark mode."
      />,
    );
    expect(view.queryByRole("button")).not.toBeInTheDocument();
    expect(api.calls()).toHaveLength(0);
  });

  it("translates on request and shows the original again", async () => {
    browser("de-DE");
    const api = mockApi();
    api.reply(
      translatePortalContentFixture.ok({
        title: "Dunkelmodus",
        content: "Bitte Dunkelmodus hinzufügen.",
      }),
    );
    const view = renderComponent(post);
    expect(api.calls()).toHaveLength(0);
    press("Translate");
    expect(
      await view.findByText("Bitte Dunkelmodus hinzufügen."),
    ).toBeInTheDocument();
    expect(view.getByText("Dunkelmodus")).toBeInTheDocument();
    // The translation is marked, and the source is one click away.
    expect(
      view.getByText(
        "Translated automatically. The original text is one click away.",
      ),
    ).toBeInTheDocument();
    const [request] = api.calls("translateQuillsPortalContent");
    expect(await request!.json()).toEqual({
      postId: "post_test_1",
      locale: "de-DE",
    });
    press("Show original");
    expect(view.getByText("Please add dark mode.")).toBeInTheDocument();
    expect(view.queryByText(/Translated automatically/)).toBeNull();
  });

  it("follows the customer's saved language over the browser's", async () => {
    browser("en-US");
    const api = mockApi();
    api.reply(
      translatePortalContentFixture.ok({ title: null, content: "مرحبا" }),
    );
    const view = renderComponent(
      <PortalRuntimeProvider value={{ ...runtime, savedLanguage: "ar" }}>
        {post}
      </PortalRuntimeProvider>,
    );
    press("Translate");
    expect(await view.findByText("مرحبا")).toBeInTheDocument();
    const [request] = api.calls("translateQuillsPortalContent");
    expect((await request!.json()).locale).toBe("ar");
  });

  it("shows the new original after an edit and translates the new text", async () => {
    browser("de");
    const api = mockApi();
    api.reply(translatePortalContentFixture.ok({ content: "Alter Text" }));
    api.reply(translatePortalContentFixture.ok({ content: "Neuer Text" }));
    const show = (content: string) => (
      <TranslatedText
        workspaceId="workspace_test_1"
        viewer={{ kind: "anonymous" }}
        target={{ postId: "post_test_1" }}
        content={content}
      />
    );
    const view = renderComponent(show("Old text"));
    press("Translate");
    await view.findByText("Alter Text");
    view.rerender(show("New text"));
    expect(view.getByText("New text")).toBeInTheDocument();
    press("Translate");
    expect(await view.findByText("Neuer Text")).toBeInTheDocument();
    expect(api.calls("translateQuillsPortalContent")).toHaveLength(2);
  });

  it("keeps the original text when the translation fails", async () => {
    browser("fr");
    const api = mockApi();
    api.reply(translatePortalContentFixture.problem(409).body, 409);
    const view = renderComponent(
      <TranslatedText
        workspaceId="workspace_test_1"
        viewer={{ kind: "anonymous" }}
        target={{ commentId: "post_comment_test_1" }}
        content="Same here."
      />,
    );
    press("Translate");
    expect(await view.findByRole("alert")).toHaveTextContent(
      "The translation is not available. Try again later.",
    );
    expect(view.getByText("Same here.")).toBeInTheDocument();
    const [request] = api.calls("translateQuillsPortalContent");
    expect(await request!.json()).toEqual({
      commentId: "post_comment_test_1",
      locale: "fr",
    });
  });
});
