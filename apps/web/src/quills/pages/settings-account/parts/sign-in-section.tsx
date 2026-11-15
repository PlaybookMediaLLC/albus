import { useTranslation } from "react-i18next";
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
  Spinner,
  useGetConfig,
  useListAccounts,
} from "../../../ui/upstream";
import { signInMethods } from "../sign-in-methods";

/** The section takes no props: it reads the signed-in person's own accounts. */
export type SignInSectionProps = Record<string, never>;

/** The sign-in methods that are linked to the signed-in person, as text. */
export function SignInSection() {
  const { t, i18n } = useTranslation("quills");
  const accounts = useListAccounts();
  const config = useGetConfig();
  const methods = accounts.data
    ? new Intl.ListFormat(i18n.language, { type: "conjunction" }).format(
        signInMethods(
          accounts.data.map((account) => account.providerId),
          t,
          config.data?.customOAuthName,
        ),
      )
    : null;
  return (
    <SettingsSection title={t("settings-workspace.account.signIn")}>
      <SettingsCard>
        <SettingsRow
          title={t("settings-workspace.account.signInMethods")}
          description={
            accounts.isError ? (
              <span className="text-destructive-foreground">
                {t("core.problem.failed")}
              </span>
            ) : (
              t("settings-workspace.account.signInText")
            )
          }
        >
          {accounts.isPending ? (
            <Spinner />
          ) : methods ? (
            <span className="max-w-64 text-end text-sm text-muted-foreground">
              {methods}
            </span>
          ) : null}
        </SettingsRow>
      </SettingsCard>
    </SettingsSection>
  );
}
