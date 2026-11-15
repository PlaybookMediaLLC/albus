import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import { Input, SettingsCard } from "../../../ui/upstream";
import { LogoRow } from "./logo-row";

const schema = z.object({ headerDisplayName: z.string().trim().max(100) });
export type BrandValues = z.infer<typeof schema>;

export interface BrandFormProps {
  workspaceId: string;
  /** The workspace name. The name field shows it when no brand name is set. */
  name: string;
  headerDisplayName: string | null;
  logoUrl: string | null;
  disabled?: boolean;
  onLogoChanged: () => Promise<unknown>;
  onSubmit: (values: BrandValues) => Promise<PortalProblem | void>;
  /** More rows of the card, such as the header select. */
  children?: ReactNode;
}

/** The logo and the brand name of the portal header, with the Save button under the card. */
export function BrandForm(props: BrandFormProps) {
  const { t } = useTranslation("quills");
  return (
    <PortalForm
      schema={schema}
      defaultValues={{ headerDisplayName: props.headerDisplayName ?? "" }}
      submitKey="settings-workspace.branding.save"
      className="max-w-none items-end gap-3 py-0"
      onSubmit={props.onSubmit}
    >
      {(form) => {
        const error = form.formState.errors.headerDisplayName?.message;
        return (
          <SettingsCard>
            <LogoRow
              workspaceId={props.workspaceId}
              logoUrl={props.logoUrl}
              disabled={props.disabled}
              onChanged={props.onLogoChanged}
            >
              <Input
                aria-label={t("settings-workspace.branding.brandName")}
                placeholder={props.name}
                maxLength={100}
                autoComplete="off"
                disabled={props.disabled}
                aria-invalid={Boolean(error)}
                {...form.register("headerDisplayName")}
              />
              {error ? (
                <p role="alert" className="mt-1 text-sm text-destructive">
                  {String(error)}
                </p>
              ) : null}
            </LogoRow>
            {props.children}
          </SettingsCard>
        );
      }}
    </PortalForm>
  );
}
