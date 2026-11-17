import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../test/render";
import { UpdateChannelsField } from "./update-channels";

const value = { page: true, email: true, conversations: false, slack: true };
const counts = {
  page: 1,
  email: 4,
  emailEstimated: false,
  conversations: 0,
  slack: 2,
};

describe("UpdateChannelsField", () => {
  it("shows each channel's count and reports a change", () => {
    const onChange = vi.fn();
    const view = renderComponent(
      <UpdateChannelsField
        value={value}
        onChange={onChange}
        counts={counts}
        slackConnected
      />,
    );
    expect(view.getByText("4 people")).toBeVisible();
    expect(view.getByText("2 channels")).toBeVisible();
    fireEvent.click(view.getByRole("checkbox", { name: "Email followers" }));
    expect(onChange).toHaveBeenCalledWith({ ...value, email: false });
  });

  it("marks the email count as an upper bound above 1,000 followers", () => {
    const view = renderComponent(
      <UpdateChannelsField
        value={value}
        onChange={vi.fn()}
        counts={{ ...counts, email: 1500, emailEstimated: true }}
        slackConnected
      />,
    );
    expect(view.getByText("Up to 1500 people")).toBeVisible();
  });

  it("turns Slack off without the page channel, and shows no counts while they load", () => {
    const view = renderComponent(
      <UpdateChannelsField
        value={{ ...value, page: false }}
        onChange={vi.fn()}
        counts={null}
        slackConnected
      />,
    );
    const slack = view.getByRole("checkbox", { name: "Post to Slack" });
    expect(slack).toHaveAttribute("aria-disabled", "true");
    expect(slack).not.toBeChecked();
    expect(view.queryByText(/people/)).toBeNull();
  });
});
