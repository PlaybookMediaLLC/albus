import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ResultCard } from "../../../ui/result-card";
import { StateView } from "../../../ui/state-view";
import {
  Alert,
  AlertDescription,
  Button,
  authClient,
} from "../../../ui/upstream";

export interface GoogleLinkProps {
  /** The desktop app's user: the browser must be signed in as the same person. */
  user: string;
  linked: boolean;
  failed: boolean;
}

type Session =
  | "loading"
  | "signed-out"
  | "error"
  | { id: string; email: string };

/** This page's address, with changes to its search. */
function here(changes: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(changes))
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  return url.toString();
}

/**
 * The browser half of a Google link from the desktop app. Google refuses embedded web views, so
 * the app opens this page in the system browser. The browser must be signed in as the app's user;
 * the link then runs here, and the app sees the linked account on the server.
 */
export function GoogleLink({ user, linked, failed }: GoogleLinkProps) {
  const { t } = useTranslation("quills");
  const [session, setSession] = useState<Session>("loading");

  useEffect(() => {
    let live = true;
    authClient
      .getSession()
      .then(({ data }) => {
        if (live)
          setSession(
            data?.user
              ? { id: data.user.id, email: data.user.email }
              : "signed-out",
          );
      })
      .catch(() => {
        if (live) setSession("error");
      });
    return () => {
      live = false;
    };
  }, []);

  if (linked) return <ResultCard titleKey="desktop.link.done" />;
  const back = new URL(here({ linked: null, failed: null }));
  const signIn = `/auth/sign-in?redirect=${encodeURIComponent(back.pathname + back.search)}`;
  return (
    <StateView
      loading={session === "loading"}
      problem={session === "error" ? { kind: "failed" } : null}
    >
      <section className="grid max-w-md gap-4">
        {failed ? (
          <Alert role="alert" variant="warning">
            <AlertDescription className="text-foreground">
              {t("desktop.link.failed")}
            </AlertDescription>
          </Alert>
        ) : null}
        {session === "signed-out" ? (
          <>
            <p>{t("desktop.link.signIn")}</p>
            <a className="text-sm underline underline-offset-4" href={signIn}>
              {t("desktop.link.signInButton")}
            </a>
          </>
        ) : typeof session === "object" && session.id !== user ? (
          <>
            <p>{t("desktop.link.wrongUser", { email: session.email })}</p>
            <Button
              variant="outline"
              onClick={() =>
                void authClient.signOut().then(() => setSession("signed-out"))
              }
            >
              {t("desktop.link.switch")}
            </Button>
          </>
        ) : typeof session === "object" ? (
          <>
            <p>{t("desktop.link.intro", { email: session.email })}</p>
            <Button
              onClick={() =>
                void authClient.linkSocial({
                  provider: "google",
                  callbackURL: here({ linked: "true", failed: null }),
                  errorCallbackURL: here({ failed: "true", linked: null }),
                })
              }
            >
              {t("desktop.link.button")}
            </Button>
          </>
        ) : null}
      </section>
    </StateView>
  );
}
