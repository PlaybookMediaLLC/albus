import { Building2 } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useImportCompanies } from "../../../hooks/team/use-import-companies";
import { useTeamRuntime } from "../../../team/runtime";
import { PortalForm } from "../../../ui/portal-form";
import {
  Field,
  FieldLabel,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetPanel,
  SheetTitle,
  SheetTrigger,
  toast,
} from "../../../ui/upstream";
import { NavRow } from "./nav-row";

// importQuillsCompanies reads at most 100,000 characters of CSV text.
const MAX_BYTES = 100_000;

export interface CompanyImportSheetProps {
  workspaceId: string;
}

/** "Import companies": a CSV file of companies and their monthly revenue (#79). All rows or none. */
export function CompanyImportSheet({ workspaceId }: CompanyImportSheetProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const id = useId();
  const [open, setOpen] = useState(false);
  const run = useImportCompanies(team.viewer);
  const schema = z.object({
    file: z.custom<File>(
      (value) => value instanceof File && value.size <= MAX_BYTES,
      t("settings-connections.data.companyFileRequired"),
    ),
  });
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <NavRow
            icon={Building2}
            title={t("settings-connections.data.importCompanies")}
            text={t("settings-connections.data.importCompaniesText")}
          />
        }
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {t("settings-connections.data.importCompaniesTitle")}
          </SheetTitle>
        </SheetHeader>
        <SheetPanel>
          <PortalForm
            schema={schema}
            defaultValues={{}}
            submitKey="settings-connections.data.importCompaniesStart"
            // PortalForm shows the API's row problems above the form.
            onSubmit={async ({ file }) => {
              const result = await run.mutateAsync({
                param: { workspaceId },
                json: { csv: await file.text() },
              });
              setOpen(false);
              toast.success(
                t("settings-connections.data.companiesImported", result),
              );
            }}
          >
            {(form) => (
              <>
                <Field invalid={Boolean(form.formState.errors.file)}>
                  <FieldLabel htmlFor={id}>
                    {t("settings-connections.data.file")}
                  </FieldLabel>
                  <Input
                    id={id}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) =>
                      form.setValue("file", event.target.files?.[0] as File, {
                        shouldValidate: true,
                      })
                    }
                  />
                  {form.formState.errors.file?.message ? (
                    <p role="alert" className="text-sm text-destructive">
                      {String(form.formState.errors.file.message)}
                    </p>
                  ) : null}
                </Field>
                <div className="grid gap-1 text-xs text-muted-foreground">
                  <p>{t("settings-connections.data.companyColumns")}</p>
                  <p>{t("settings-connections.data.companyMatch")}</p>
                  <p>{t("settings-connections.data.checkFirst")}</p>
                </div>
              </>
            )}
          </PortalForm>
        </SheetPanel>
      </SheetContent>
    </Sheet>
  );
}
