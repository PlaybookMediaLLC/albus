import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { press } from "../../../test/actions";
import { renderComponent } from "../../../test/render";
import { ProfilePicture, type ProfilePictureProps } from "./profile-picture";

const render = (props: Partial<ProfilePictureProps> = {}) =>
  renderComponent(
    <ProfilePicture
      name="Grace Hopper"
      avatarUrl={null}
      busy={false}
      failed={false}
      onUpload={vi.fn()}
      onRemove={vi.fn()}
      {...props}
    />,
  );

describe("ProfilePicture", () => {
  it("uploads a chosen image and offers no removal without a picture", () => {
    const onUpload = vi.fn();
    const view = render({ onUpload });
    expect(view.queryByRole("button", { name: "Remove" })).toBeNull();
    expect(view.getByRole("button", { name: "Upload picture" })).toBeVisible();
    const file = new File(["x"], "me.png", { type: "image/png" });
    fireEvent.change(view.container.querySelector("input[type=file]")!, {
      target: { files: [file] },
    });
    expect(onUpload).toHaveBeenCalledWith(file);
  });

  it("replaces or removes a picture and says when saving failed", () => {
    const onRemove = vi.fn();
    const view = render({
      avatarUrl: "/api/quills-public/ws/avatars/principal_1?v=1",
      failed: true,
      onRemove,
    });
    expect(view.getByRole("button", { name: "Replace picture" })).toBeVisible();
    press("Remove");
    expect(onRemove).toHaveBeenCalledOnce();
    expect(view.getByRole("alert")).toHaveTextContent(
      "The picture could not be saved",
    );
  });
});
