import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { EntryLanguageList } from "./entry-language-list";

const versions = [{ locale: "de", title: "Ausgeliefert", content: "Neu" }];

describe("EntryLanguageList", () => {
  it("edits and deletes a version when allowed", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const view = renderComponent(
      <EntryLanguageList
        versions={versions}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    expect(view.getByText("Ausgeliefert")).toBeInTheDocument();
    press("Edit de");
    expect(onEdit).toHaveBeenCalledWith(versions[0]);
    press("Delete de");
    expect(onDelete).toHaveBeenCalledWith("de");
  });

  it("is read-only without the handlers and says when there is none", () => {
    const view = renderComponent(<EntryLanguageList versions={versions} />);
    expect(view.queryByRole("button")).toBeNull();
    const none = renderComponent(<EntryLanguageList versions={[]} />);
    expect(none.getByText("No other languages yet.")).toBeInTheDocument();
  });
});
