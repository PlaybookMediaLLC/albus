import React from "react";
void React;
import { describe, expect, it } from "vite-plus/test";
import { render } from "@react-email/components";
import {
  StatusChangeEmail,
  statusChangeHeadline,
} from "../templates/status-change";

const mail = {
  postTitle: "Dark mode for exports",
  postUrl: "https://acme.example.com/posts/1",
  previousStatus: "",
  newStatus: "planned",
  organizationName: "Acme",
  unsubscribeUrl: "https://acme.example.com/unsubscribe?token=t",
};

describe("StatusChangeEmail", () => {
  it("says 'your feedback' only to the person who wrote it", async () => {
    const author = await render(<StatusChangeEmail {...mail} yours />);
    expect(author).toContain("Your feedback is now Planned!");
    const follower = await render(<StatusChangeEmail {...mail} />);
    expect(follower).toContain("Feedback you follow is now Planned");
    expect(follower).not.toContain("Your feedback");
    expect(follower).not.toContain("your feedback");
  });

  it("gives the subject the same headline", () => {
    expect(statusChangeHeadline("planned", true)).toBe(
      "Your feedback is now planned!",
    );
    expect(statusChangeHeadline("planned", false)).toBe(
      "Feedback you follow is now planned",
    );
  });
});
