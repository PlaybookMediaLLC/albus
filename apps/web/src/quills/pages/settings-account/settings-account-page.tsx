import { useTranslation } from "react-i18next";
import { PageFrame } from "../../ui/page-frame";
import {
  AutosaveNote,
  DeleteAccountSection,
  ProfileDetailsSection,
  SettingsPage,
  useAuth,
  useManagedProfileFields,
  useProfileNameAutosave,
} from "../../ui/upstream";
import { SignInSection } from "./parts/sign-in-section";
import { ThemeSection } from "./parts/theme-section";

export interface SettingsAccountPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/**
 * Settings › Account (settings spec B1). The profile and the danger zone are the parts of
 * Kaneo's own profile page. The theme is a preference of this browser.
 */
export function SettingsAccountPage(_props: SettingsAccountPageProps) {
  const { t } = useTranslation("quills");
  const { user, refetchUser } = useAuth();
  const form = useProfileNameAutosave({ name: user?.name, refetchUser });
  const managedFields = useManagedProfileFields();
  return (
    <PageFrame
      titleKey="settings-workspace.account.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-workspace.account.title")}
        actions={<AutosaveNote />}
      >
        <ProfileDetailsSection
          form={form}
          user={user ?? undefined}
          refetchUser={refetchUser}
          managedFields={managedFields}
        />
        <ThemeSection />
        <SignInSection />
        <DeleteAccountSection email={user?.email} />
      </SettingsPage>
    </PageFrame>
  );
}
