import { describe, expect, it } from "vite-plus/test";
import { getPublicPortalConfigFixture } from "../api/portal/get-public-portal-config.fixture";
import { renderComponent } from "../test/render";
import { PortalRuntimeProvider } from "./runtime";
import { usePortalSignInHref } from "./use-portal-sign-in-href";

function Link() {
  const href = usePortalSignInHref("acme")("boards/b1");
  return href ? <a href={href}>Sign in</a> : null;
}
const render = (mode: "kaneo" | "disabled") =>
  renderComponent(
    <PortalRuntimeProvider
      value={{
        config: getPublicPortalConfigFixture.ok(),
        viewer: { kind: "anonymous" },
        access: {
          granted: true,
          reason: "public",
          signIn: { mode, ssoUrl: null },
        },
        accessLoading: false,
        accessProblem: null,
      }}
    >
      <Link />
    </PortalRuntimeProvider>,
  );

describe("usePortalSignInHref", () => {
  it("links back to the portal page, and offers nothing when sign-in is off", () => {
    const on = render("kaneo");
    expect(on.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/auth/sign-in?redirect=%2Fportal%2Facme%2Fboards%2Fb1",
    );
    on.unmount();
    expect(render("disabled").queryByRole("link")).toBeNull();
  });
});
