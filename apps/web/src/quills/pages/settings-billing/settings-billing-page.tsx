import { useSearchPatch } from "../../core/use-search-patch";
import { PageFrame } from "../../ui/page-frame";
import { BillingSettingsPage } from "../../ui/upstream";

export interface SettingsBillingPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/**
 * Settings › Billing (settings spec B12): Kaneo's own billing page. The sidebar shows it
 * only when the instance has billing; the page itself also says when billing is off.
 */
export function SettingsBillingPage({ search }: SettingsBillingPageProps) {
  const patch = useSearchPatch();
  return (
    <PageFrame
      titleKey="settings-workspace.billing.title"
      variant="app"
      landmark={false}
    >
      <BillingSettingsPage
        checkout={
          typeof search.checkout === "string" ? search.checkout : undefined
        }
        onDismissCheckout={() => patch({ checkout: undefined })}
      />
    </PageFrame>
  );
}
