import { fireEvent, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../test/render";
import { TagList, type TagListProps } from "./tag-list";
import { toast } from "./upstream";

const copy = {
  title: "settings-product.tags.title",
  create: "settings-product.tags.new",
  createTitle: "settings-product.tags.createTitle",
  createText: "settings-product.tags.createText",
  rename: "settings-product.tags.rename",
  renameText: "settings-product.tags.renameText",
  name: "settings-product.tags.name",
  placeholder: "settings-product.tags.placeholder",
  taken: "settings-product.tags.taken",
  actions: "settings-product.tags.actions",
  delete: "settings-product.tags.delete",
  deleteTitle: "settings-product.tags.deleteTitle",
  deleteText: "settings-product.tags.deleteText",
  deleteFailed: "settings-product.tags.deleteFailed",
  emptyTitle: "settings-product.tags.emptyTitle",
  emptyText: "settings-product.tags.emptyText",
};

const render = (props: Partial<TagListProps> = {}) => {
  const handlers = {
    onCreate: vi.fn(async (_name: string) => undefined),
    onRename: vi.fn(async (_id: string, _name: string) => undefined),
    onDelete: vi.fn(async (_id: string) => undefined),
  };
  const view = renderComponent(
    <TagList
      items={[{ id: "tag_1", name: "security", color: "#ef4444" }]}
      copy={copy}
      maxLength={50}
      canManage
      {...handlers}
      {...props}
    />,
  );
  return { view, ...handlers };
};

const openAction = async (
  view: ReturnType<typeof renderComponent>,
  action: string,
) => {
  fireEvent.click(view.getByRole("button", { name: "Actions for security" }));
  fireEvent.click(await view.findByRole("menuitem", { name: action }));
};

describe("TagList", () => {
  it("creates an item with the name from the dialog", async () => {
    const { view, onCreate } = render();
    fireEvent.click(view.getByRole("button", { name: "New tag" }));
    const dialog = await view.findByRole("dialog", { name: "New tag" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "billing" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("billing"));
  });

  it("renames an item from its menu", async () => {
    const { view, onRename } = render();
    await openAction(view, "Rename tag");
    const dialog = await view.findByRole("dialog", { name: "Rename tag" });
    expect(within(dialog).getByLabelText("Name")).toHaveValue("security");
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "privacy" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(onRename).toHaveBeenCalledWith("tag_1", "privacy"),
    );
  });

  it("deletes an item after a confirmation and says when that fails", async () => {
    const error = vi.spyOn(toast, "error");
    const onDelete = vi.fn(() => Promise.reject(new Error("failed")));
    const { view } = render({ onDelete });
    await openAction(view, "Delete tag");
    const dialog = await view.findByRole("alertdialog", {
      name: "Delete security?",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete tag" }));
    await waitFor(() =>
      expect(error).toHaveBeenCalledWith("The tag could not be deleted."),
    );
    expect(onDelete).toHaveBeenCalledWith("tag_1");
    expect(dialog).toBeVisible();
  });

  it("shows the empty state, and no actions to a teammate who cannot manage settings", () => {
    const { view } = render({ items: [], canManage: false });
    expect(view.getByText("No tags yet")).toBeVisible();
    expect(view.queryByRole("button")).toBeNull();
  });
});
