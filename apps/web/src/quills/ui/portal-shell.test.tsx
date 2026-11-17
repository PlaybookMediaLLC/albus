import { act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { PortalShell } from "./portal-shell";
import { renderComponent } from "../test/render";
import { useUserPreferencesStore } from "./upstream";

const branding = {
  logoUrl: null,
  theme: { themeMode: "light" as const, light: {}, dark: {} },
  headerDisplayMode: "logo_and_name" as const,
  headerDisplayName: null,
};

describe("PortalShell", () => {
  afterEach(() => useUserPreferencesStore.setState({ theme: "dark" }));

  it("shows the workspace name", () => {
    const view = renderComponent(
      <PortalShell workspaceName="Workspace" branding={branding}>
        {null}
      </PortalShell>,
    );
    expect(view.getByText("Workspace")).toBeInTheDocument();
    expect(view.getByRole("banner").parentElement).toHaveClass(
      "h-full",
      "min-h-0",
      "overflow-y-auto",
    );
  });

  it("shows a custom logo and accessible display name", () => {
    const view = renderComponent(
      <PortalShell
        workspaceName="Workspace"
        branding={{
          ...branding,
          logoUrl: "https://example.test/logo.png",
          headerDisplayMode: "logo_only",
          headerDisplayName: "Customer portal",
        }}
      >
        {null}
      </PortalShell>,
    );
    expect(
      view.getByRole("img", { name: "Customer portal" }),
    ).toBeInTheDocument();
    expect(view.queryByText("Customer portal")).not.toBeInTheDocument();
  });

  it("keeps workspace theme variables on the portal container", () => {
    const view = renderComponent(
      <PortalShell
        workspaceName="Workspace"
        branding={{
          ...branding,
          theme: {
            ...branding.theme,
            light: { primaryForeground: "oklch(1 0 0)" },
          },
        }}
      >
        {null}
      </PortalShell>,
    );
    const container = view.getByRole("banner").parentElement;
    expect(container).toHaveStyle("--primary-foreground: oklch(1 0 0)");
    expect(document.documentElement).not.toHaveStyle(
      "--primary-foreground: oklch(1 0 0)",
    );
  });

  it("follows a change of the viewer's theme for the user theme mode", () => {
    useUserPreferencesStore.setState({ theme: "light" });
    const view = renderComponent(
      <PortalShell
        workspaceName="Workspace"
        branding={{
          ...branding,
          theme: {
            themeMode: "user",
            light: { primary: "oklch(0.4 0 0)" },
            dark: { primary: "oklch(0.9 0 0)" },
          },
        }}
      >
        {null}
      </PortalShell>,
    );
    const container = view.getByRole("banner").parentElement;
    expect(container).toHaveStyle("--primary: oklch(0.4 0 0)");
    act(() => useUserPreferencesStore.setState({ theme: "dark" }));
    expect(container).toHaveStyle("--primary: oklch(0.9 0 0)");
  });
});
