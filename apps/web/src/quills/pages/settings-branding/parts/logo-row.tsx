import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { uploadObject } from "../../../core/upload-object";
import { useCreateSettingsUpload } from "../../../hooks/team/use-create-settings-upload";
import { useDeleteLogo } from "../../../hooks/team/use-delete-logo";
import { useSaveLogoKey } from "../../../hooks/team/use-save-logo-key";
import { RowActionsMenu, Spinner, toast } from "../../../ui/upstream";

export interface LogoRowProps {
  workspaceId: string;
  logoUrl: string | null;
  disabled?: boolean;
  /** Reloads the logo URL after an upload or a removal. */
  onChanged: () => Promise<unknown>;
  /** The name field beside the logo. */
  children: ReactNode;
}

const types = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * The logo and the brand name. A click on the logo uploads a new one in three steps: get
 * an upload URL, put the file, then register the key. The menu removes the logo.
 */
export function LogoRow(props: LogoRowProps) {
  const { t } = useTranslation("quills");
  const param = { workspaceId: props.workspaceId };
  const createUpload = useCreateSettingsUpload();
  const saveKey = useSaveLogoKey();
  const remove = useDeleteLogo();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await work();
      await props.onChanged();
      toast.success(t(done));
    } catch {
      toast.error(t("settings-workspace.branding.logoFailed"));
    } finally {
      setBusy(false);
    }
  };
  const upload = (file: File) =>
    run(async () => {
      const json = { contentType: file.type, size: file.size };
      const target = await createUpload.mutateAsync({
        param,
        json: { purpose: "logo", filename: file.name, ...json },
      });
      await uploadObject(file, target);
      await saveKey.mutateAsync({ param, json: { key: target.key, ...json } });
    }, "settings-workspace.branding.logoSaved");
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <button
        type="button"
        aria-label={t("settings-workspace.branding.uploadLogo")}
        disabled={props.disabled || busy}
        onClick={() => input.current?.click()}
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-64"
      >
        {busy ? (
          <Spinner />
        ) : props.logoUrl ? (
          <img
            src={props.logoUrl}
            alt={t("settings-workspace.branding.logo")}
            className="size-full object-contain"
          />
        ) : (
          <ImagePlus aria-hidden="true" className="size-5" />
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept={types.join(",")}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file && types.includes(file.type)) void upload(file);
          else if (file) toast.error(t("settings-workspace.branding.logoType"));
        }}
      />
      <div className="min-w-0 flex-1">{props.children}</div>
      {props.logoUrl && !props.disabled ? (
        <RowActionsMenu
          label={t("settings-workspace.branding.logoActions")}
          actions={[
            {
              id: "remove",
              label: t("settings-workspace.branding.removeLogo"),
              icon: Trash2,
              destructive: true,
              disabled: busy,
              onSelect: () =>
                void run(
                  () => remove.mutateAsync({ param }),
                  "settings-workspace.branding.logoRemoved",
                ),
            },
          ]}
        />
      ) : null}
    </div>
  );
}
