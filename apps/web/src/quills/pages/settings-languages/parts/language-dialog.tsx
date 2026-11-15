import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import { useEnableHelpCenterLocale } from "../../../hooks/team/use-enable-help-center-locale";
import { useTeamRuntime } from "../../../team/runtime";
import {
  Dialog,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  toast,
} from "../../../ui/upstream";
import { languageName, type HelpCenterLocale } from "../locales";
import { LanguageForm } from "./language-form";

export interface LanguageDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The language whose text to edit. Null adds a language. */
  locale: HelpCenterLocale | null;
  /** The stored homepage text of `locale`. */
  chrome?: {
    homepageTitle: string;
    homepageDescription: string;
    searchPlaceholder: string;
  };
  /** The languages that are not enabled yet. */
  available: readonly HelpCenterLocale[];
}

/**
 * Adds a help-center language, or edits the homepage text of one. The API replaces the
 * text of a language that is already enabled.
 */
export function LanguageDialog(props: LanguageDialogProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const enable = useEnableHelpCenterLocale(team.viewer);
  const locale = props.locale ?? props.available[0];
  const name = (code: string) => languageName(code, i18n.language);
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="gap-4 p-6">
        <DialogTitle>
          {props.locale
            ? t("settings-workspace.languages.editTitle", {
                language: name(props.locale),
              })
            : t("settings-workspace.languages.add")}
        </DialogTitle>
        <DialogDescription>
          {t("settings-workspace.languages.dialogText")}
        </DialogDescription>
        {locale ? (
          <LanguageForm
            key={props.locale ?? "new"}
            defaultValues={{
              locale,
              homepageTitle: props.chrome?.homepageTitle ?? "",
              homepageDescription: props.chrome?.homepageDescription ?? "",
              searchPlaceholder: props.chrome?.searchPlaceholder ?? "",
            }}
            options={
              props.locale
                ? undefined
                : props.available.map((value) => ({
                    value,
                    label: name(value),
                  }))
            }
            onSubmit={async ({ locale: value, ...chrome }) => {
              try {
                await enable.mutateAsync({
                  param: { workspaceId: props.workspaceId },
                  json: { locale: value, chrome },
                });
                props.onOpenChange(false);
                toast.success(t("settings-workspace.languages.saved"));
              } catch (error) {
                return error as PortalProblem;
              }
            }}
          />
        ) : null}
      </DialogPopup>
    </Dialog>
  );
}
