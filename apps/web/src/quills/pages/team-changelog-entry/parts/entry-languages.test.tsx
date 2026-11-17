import { fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { deleteChangelogTranslationFixture } from "../../../api/team/delete-changelog-translation.fixture";
import { listChangelogTranslationsFixture } from "../../../api/team/list-changelog-translations.fixture";
import { saveChangelogTranslationFixture } from "../../../api/team/save-changelog-translation.fixture";
import { TeamRuntimeProvider } from "../../../team/runtime";
import { press } from "../../../test/actions";
import { mockApi } from "../../../test/mock-api";
import { renderComponent } from "../../../test/render";
import { postTeam } from "../../team-post/post.fixture";
import { EntryLanguages } from "./entry-languages";

const german = {
  locale: "de",
  title: "Ausgeliefert",
  content: "Jetzt verfügbar",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const render = (canEdit = true) => {
  const view = renderComponent(
    <TeamRuntimeProvider value={postTeam}>
      <EntryLanguages
        workspaceId="workspace_test_1"
        entryId="changelog_test_1"
        canEdit={canEdit}
      />
    </TeamRuntimeProvider>,
  );
  press("Other languages");
  return view;
};

describe("EntryLanguages", () => {
  it("reads nothing until it is opened", () => {
    const api = mockApi();
    const view = renderComponent(
      <TeamRuntimeProvider value={postTeam}>
        <EntryLanguages
          workspaceId="workspace_test_1"
          entryId="changelog_test_1"
          canEdit
        />
      </TeamRuntimeProvider>,
    );
    expect(
      view.getByRole("button", { name: "Other languages" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(api.calls()).toHaveLength(0);
  });

  it("lists the versions, saves a new one and deletes one", async () => {
    const api = mockApi();
    api.reply(listChangelogTranslationsFixture.ok({ items: [german] }));
    api.reply(saveChangelogTranslationFixture.ok({ locale: "ar" }));
    api.reply(listChangelogTranslationsFixture.ok({ items: [german] }));
    const view = render();
    expect(await view.findByText("Ausgeliefert")).toBeInTheDocument();
    fireEvent.change(view.getByLabelText("Language"), {
      target: { value: "ar" },
    });
    fireEvent.change(view.getByLabelText("Title in this language"), {
      target: { value: "تم الإطلاق" },
    });
    fireEvent.change(view.getByLabelText("Text in this language"), {
      target: { value: "متاح الآن" },
    });
    press("Save version");
    await waitFor(() =>
      expect(api.calls("saveQuillsChangelogTranslation")).toHaveLength(1),
    );
    const [saved] = api.calls("saveQuillsChangelogTranslation");
    expect(new URL(saved!.url).pathname).toMatch(
      /\/changelog\/changelog_test_1\/translations$/,
    );
    expect(await saved!.json()).toEqual({
      locale: "ar",
      title: "تم الإطلاق",
      content: "متاح الآن",
    });
    api.reply(deleteChangelogTranslationFixture.ok());
    api.reply(listChangelogTranslationsFixture.ok({ items: [] }));
    press("Delete de");
    await waitFor(() =>
      expect(api.calls("deleteQuillsChangelogTranslation")).toHaveLength(1),
    );
  });

  it("refuses a value that is not a language tag", async () => {
    const api = mockApi();
    api.reply(listChangelogTranslationsFixture.ok());
    const view = render();
    await view.findByText("No other languages yet.");
    fireEvent.change(view.getByLabelText("Language"), {
      target: { value: "German" },
    });
    fireEvent.change(view.getByLabelText("Title in this language"), {
      target: { value: "x" },
    });
    fireEvent.change(view.getByLabelText("Text in this language"), {
      target: { value: "y" },
    });
    press("Save version");
    expect(
      await view.findByText("Use a language tag, such as de or pt-BR."),
    ).toBeInTheDocument();
    expect(api.calls("saveQuillsChangelogTranslation")).toHaveLength(0);
  });

  it("shows the versions read-only without edit rights", async () => {
    mockApi().reply(listChangelogTranslationsFixture.ok({ items: [german] }));
    const view = render(false);
    expect(await view.findByText("Ausgeliefert")).toBeInTheDocument();
    expect(view.queryByLabelText("Language")).not.toBeInTheDocument();
    expect(view.queryByRole("button", { name: "Delete de" })).toBeNull();
  });
});
