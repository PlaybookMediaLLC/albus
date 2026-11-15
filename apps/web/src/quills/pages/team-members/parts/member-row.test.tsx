import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { renderComponent } from "../../../test/render";
import { MemberRow } from "./member-row";

const member = {
  name: "Ada Lovelace",
  image: null,
  email: null,
  contactEmail: "ada@example.test",
  isLead: false,
  blockedAt: "2026-01-01T00:00:00.000Z",
};

describe("MemberRow", () => {
  it("shows the contact email, the Blocked badge and opens the member", () => {
    const onOpen = vi.fn();
    const view = renderComponent(
      <MemberRow member={member} href="/members/1" onOpen={onOpen} />,
    );
    const row = view.getByRole("link", { name: /Ada Lovelace/ });
    expect(row).toHaveTextContent("ada@example.test");
    expect(row).toHaveTextContent("Blocked");
    expect(row).not.toHaveTextContent("Lead");
    fireEvent.click(row);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("leaves the email line out when the person has none", () => {
    const view = renderComponent(
      <MemberRow
        member={{ ...member, contactEmail: null, blockedAt: null }}
        href="/members/1"
        onOpen={() => undefined}
      />,
    );
    expect(view.getByRole("link")).toHaveTextContent(/^\S*Ada Lovelace$/);
  });
});
