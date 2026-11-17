import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageFrame } from "../../../ui/page-frame";
import { StateView } from "../../../ui/state-view";
import {
  Alert,
  AlertDescription,
  Button,
  formatDeviceCode,
} from "../../../ui/upstream";
import { openApproval, useDeviceSignIn } from "../use-device-sign-in";

const failedKeys = {
  denied: "desktop.failed.denied",
  expired: "desktop.failed.expired",
} as const;

export interface SignInFlowProps {
  /** Opens the browser at once. */
  start: boolean;
  /** The sign-in page that the app replaced, for example Google's. */
  provider?: string;
}

/** The browser sign-in of the desktop app: the device flow, or a note for a signed-in person. */
export function SignInFlow({ start: startAtOnce, provider }: SignInFlowProps) {
  const { t } = useTranslation("quills");
  const google = provider === "google";
  const navigate = useNavigate();
  // A full load, so the app starts with the new session everywhere (the auth provider too).
  const { state, start, cancel } = useDeviceSignIn(startAtOnce, () =>
    window.location.replace("/dashboard"),
  );

  return (
    <PageFrame titleKey="desktop.title" description={t("desktop.description")}>
      <StateView
        loading={state.step === "checking" || state.step === "signed-in"}
        problem={
          state.step === "failed" && state.reason === "failed"
            ? { kind: "failed" }
            : null
        }
        onRetry={start}
      >
        {state.step === "already" ? (
          <section className="grid max-w-md gap-4">
            <p role="status">
              {t(google ? "desktop.googleInApp" : "desktop.already")}
            </p>
            <div className="flex flex-wrap gap-2">
              {google ? (
                <Button
                  onClick={() =>
                    window.open(
                      `${location.origin}/quills/desktop?link=google&user=${encodeURIComponent(state.userId)}`,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                >
                  {t("desktop.linkInBrowser")}
                </Button>
              ) : null}
              <Button
                variant={google ? "outline" : "default"}
                onClick={() =>
                  void navigate({ to: "/dashboard", replace: true })
                }
              >
                {t("desktop.back")}
              </Button>
            </div>
          </section>
        ) : state.step === "waiting" ? (
          <section
            className="grid max-w-md gap-4"
            aria-labelledby="desktop-code-label"
          >
            <p id="desktop-code-label">{t("desktop.waiting")}</p>
            <p
              className="font-mono text-3xl font-semibold tracking-widest"
              aria-label={t("desktop.codeLabel")}
            >
              {formatDeviceCode(state.code.user_code)}
            </p>
            <p role="status" className="text-sm text-muted-foreground">
              {t("desktop.waitingStatus")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => openApproval(state.code)}>
                {t("desktop.openAgain")}
              </Button>
              <Button variant="outline" onClick={cancel}>
                {t("desktop.cancel")}
              </Button>
            </div>
          </section>
        ) : (
          <div className="grid max-w-md gap-4">
            {state.step === "failed" && state.reason !== "failed" ? (
              <Alert role="alert" variant="warning">
                <AlertDescription className="text-foreground">
                  {t(failedKeys[state.reason])}
                </AlertDescription>
              </Alert>
            ) : null}
            <Button onClick={start} disabled={state.step === "starting"}>
              {state.step === "starting"
                ? t("desktop.starting")
                : t("desktop.continue")}
            </Button>
            <a
              className="text-sm underline underline-offset-4"
              href="/auth/sign-in"
            >
              {t("desktop.email")}
            </a>
          </div>
        )}
      </StateView>
    </PageFrame>
  );
}
