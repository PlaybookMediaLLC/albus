import { ImageUp } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { uploadObject } from "../../../core/upload-object";
import { useCreateSettingsUpload } from "../../../hooks/team/use-create-settings-upload";
import { useDeleteWidgetHeroImage } from "../../../hooks/team/use-delete-widget-hero-image";
import { useSaveWidgetHeroImageKey } from "../../../hooks/team/use-save-widget-hero-image-key";
import { useTeamRuntime } from "../../../team/runtime";
import { Button, SettingsRow, toast } from "../../../ui/upstream";

export interface HeroImageRowProps {
  workspaceId: string;
}

/**
 * The image of the Home header. No route reads the current image, so the row offers upload and
 * remove, and a toast confirms each one.
 */
export function HeroImageRow({ workspaceId }: HeroImageRowProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const input = useRef<HTMLInputElement>(null);
  const create = useCreateSettingsUpload();
  const save = useSaveWidgetHeroImageKey(team.viewer);
  const remove = useDeleteWidgetHeroImage(team.viewer);
  const [pending, setPending] = useState(false);
  const param = { workspaceId };
  const run = async (work: () => Promise<unknown>, done: string) => {
    setPending(true);
    try {
      await work();
      toast.success(t(done));
    } catch {
      toast.error(t("settings-conversations.widget.imageFailed"));
    } finally {
      setPending(false);
    }
  };
  const upload = (file: File) =>
    run(async () => {
      const target = await create.mutateAsync({
        param,
        json: {
          purpose: "widget_hero",
          filename: file.name,
          contentType: file.type,
          size: file.size,
        },
      });
      await uploadObject(file, target);
      await save.mutateAsync({
        param,
        json: { key: target.key, contentType: file.type, size: file.size },
      });
    }, "settings-conversations.widget.imageSaved");
  return (
    <SettingsRow
      title={t("settings-conversations.widget.image")}
      description={t("settings-conversations.widget.imageText")}
    >
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        aria-label={t("settings-conversations.widget.image")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void upload(file);
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          void run(
            () => remove.mutateAsync({ param }),
            "settings-conversations.widget.imageRemoved",
          )
        }
      >
        {t("settings-conversations.widget.removeImage")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        loading={pending}
        onClick={() => input.current?.click()}
      >
        <ImageUp aria-hidden="true" />
        {t("settings-conversations.widget.upload")}
      </Button>
    </SettingsRow>
  );
}
