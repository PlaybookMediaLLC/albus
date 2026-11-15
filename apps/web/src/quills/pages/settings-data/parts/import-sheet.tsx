import { FileUp } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { uploadObject } from "../../../core/upload-object";
import { useCreateImport } from "../../../hooks/team/use-create-import";
import { useCreateUpload } from "../../../hooks/team/use-create-upload";
import { useListBoards } from "../../../hooks/team/use-list-boards";
import { useTeamRuntime } from "../../../team/runtime";
import { FormSelect } from "../../../ui/form-select";
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

export interface ImportSheetProps {
  workspaceId: string;
}

// The API reads at most 10 MB and accepts this content type for a CSV file.
const MAX_BYTES = 10 * 1024 * 1024;
const contentType = "text/csv";

/** "Import from CSV": a board, a file, then upload, register and start the run. */
export function ImportSheet({ workspaceId }: ImportSheetProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const id = useId();
  const [open, setOpen] = useState(false);
  const param = { workspaceId };
  // ponytail: the first 100 boards (the API maximum), as on the board settings page.
  const boards = useListBoards(
    {
      param: { workspaceId: open ? workspaceId : "" },
      query: { counts: "false", offset: "0", limit: "100" },
    },
    team.viewer,
  );
  const upload = useCreateUpload();
  const start = useCreateImport(team.viewer);
  const schema = z.object({
    boardId: z.string().min(1, t("settings-connections.data.boardRequired")),
    file: z.custom<File>(
      (value) => value instanceof File && value.size <= MAX_BYTES,
      t("settings-connections.data.fileRequired"),
    ),
  });
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <NavRow
            icon={FileUp}
            title={t("settings-connections.data.importCsv")}
            text={t("settings-connections.data.importCsvText")}
          />
        }
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("settings-connections.data.importTitle")}</SheetTitle>
        </SheetHeader>
        <SheetPanel>
          <PortalForm
            schema={schema}
            defaultValues={{ boardId: "" }}
            submitKey="settings-connections.data.start"
            // PortalForm shows a thrown problem, such as a refused upload.
            onSubmit={async ({ boardId, file }) => {
              const target = await upload.mutateAsync({
                param,
                json: {
                  purpose: "file",
                  filename: file.name,
                  contentType,
                  size: file.size,
                },
              });
              await uploadObject(file, target);
              await start.mutateAsync({
                param,
                json: {
                  key: target.key,
                  contentType,
                  size: file.size,
                  name: file.name,
                  boardId,
                },
              });
              setOpen(false);
              toast.success(t("settings-connections.data.started"));
            }}
          >
            {(form) => (
              <>
                <FormSelect
                  control={form.control}
                  name="boardId"
                  label={t("settings-connections.data.board")}
                  options={
                    boards.data?.items.map((board) => ({
                      value: board.id,
                      label: board.name,
                    })) ?? []
                  }
                />
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
                  <p>{t("settings-connections.data.columnsRequired")}</p>
                  <p>{t("settings-connections.data.columnsOptional")}</p>
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
