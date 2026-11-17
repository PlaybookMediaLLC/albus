import { PageFrame } from "../../ui/page-frame";
import { GoogleLink } from "./parts/google-link";
import { SignInFlow } from "./parts/sign-in-flow";

export interface DesktopSignInPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/**
 * The desktop app's browser sign-in. The app opens it from the menu, and in place of Google's
 * sign-in page, which Google refuses to show in an embedded web view. With `link`, it is the
 * browser half of a Google link.
 */
export function DesktopSignInPage({ search }: DesktopSignInPageProps) {
  if (search.link === "google" && typeof search.user === "string")
    return (
      <PageFrame titleKey="desktop.link.title">
        <GoogleLink
          user={search.user}
          linked={search.linked === true}
          failed={search.failed === true}
        />
      </PageFrame>
    );
  return (
    <SignInFlow
      start={search.start === true}
      provider={
        typeof search.provider === "string" ? search.provider : undefined
      }
    />
  );
}
