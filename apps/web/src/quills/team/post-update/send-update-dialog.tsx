import { useId, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../core/types";
import { useListSegments } from "../../hooks/team/use-list-segments";
import { useSendPostUpdate } from "../../hooks/team/use-send-post-update";
import { useTeamRuntime } from "../runtime";
import { PortalForm } from "../../ui/portal-form";
import {
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Label,
  Textarea,
  toast,
} from "../../ui/upstream";
import { UpdateAudience } from "./update-audience";
import { UpdateChannelsField, type UpdateChannels } from "./update-channels";
import { useUpdatePreview } from "./use-update-preview";

const LANGUAGE = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/;
/** The typed tags, or null when one of them is not a language tag. */
const parseLanguages = (text: string) => {
  const tags = text
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  return tags.length <= 10 && tags.every((tag) => LANGUAGE.test(tag))
    ? tags
    : null;
};

export interface SendUpdateDialogProps {
  workspaceId: string;
  post: { id: string; title: string };
  onClose: () => void;
}

/**
 * "Send update" (#92): one message to the request's followers on every chosen channel. The counts
 * come from the API's preview, which runs the same steps as the send. The API checks the permissions.
 */
export function SendUpdateDialog(props: SendUpdateDialogProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const bodyId = useId();
  const param = { workspaceId: props.workspaceId, postId: props.post.id };
  const [channels, setChannels] = useState<UpdateChannels>({
    page: true,
    email: true,
    conversations: true,
    slack: false,
  });
  const [segmentIds, setSegmentIds] = useState<string[]>([]);
  const [languagesText, setLanguagesText] = useState("");
  // One key per dialog: a retried or double-clicked send delivers once.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const languages = parseLanguages(languagesText);
  const segments = useListSegments(
    { param: { workspaceId: props.workspaceId } },
    team.viewer,
  );
  const preview = useUpdatePreview(props.workspaceId, props.post.id, {
    channels,
    segmentIds,
    languages,
  });
  const send = useSendPostUpdate(team.viewer);
  const schema = z.object({
    body: z.string().trim().min(1).max(5000),
    confirmRelease: z.literal(true, {
      error: t("team-post.updateConfirmRequired"),
    }),
  });
  type Values = z.infer<typeof schema>;
  const submit = async (values: Values): Promise<PortalProblem | void> => {
    if (!languages)
      return {
        kind: "invalid",
        issues: [
          { path: "languages", message: t("team-post.updateLanguagesInvalid") },
        ],
      };
    try {
      const result = await send.mutateAsync({
        param,
        json: { ...values, channels, segmentIds, languages, idempotencyKey },
      });
      toast.success(t("team-post.updateSent", { count: result.counts.email }));
      props.onClose();
    } catch (error) {
      return error as PortalProblem;
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value) props.onClose();
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{t("team-post.updateTitle")}</DialogTitle>
          <DialogDescription>
            {t("team-post.updateText", { title: props.post.title })}
          </DialogDescription>
        </DialogHeader>
        <PortalForm<Values>
          schema={schema}
          defaultValues={{ body: "", confirmRelease: false as true }}
          submitKey="team-post.updateSubmit"
          className="max-w-none gap-4 py-0 *:not-last:px-6 *:last:justify-end *:last:rounded-b-2xl *:last:border-t *:last:bg-muted/72 *:last:px-6 *:last:py-4"
          footer={() => (
            <DialogClose render={<Button type="button" variant="ghost" />}>
              {t("team-post.cancel")}
            </DialogClose>
          )}
          onSubmit={submit}
        >
          {(form) => (
            <>
              <Field invalid={Boolean(form.formState.errors.body)}>
                <FieldLabel htmlFor={bodyId}>
                  {t("team-post.updateBody")}
                </FieldLabel>
                <Textarea id={bodyId} rows={5} {...form.register("body")} />
              </Field>
              <UpdateChannelsField
                value={channels}
                onChange={setChannels}
                counts={preview.counts ?? null}
                slackConnected={Boolean(preview.slackConnected)}
              />
              {preview.failed ? (
                <p role="alert" className="text-sm text-destructive-foreground">
                  {t("team-post.updatePreviewFailed")}
                </p>
              ) : null}
              <UpdateAudience
                segments={segments.data?.segments ?? []}
                segmentIds={segmentIds}
                onSegmentsChange={setSegmentIds}
                languages={languagesText}
                onLanguagesChange={setLanguagesText}
              />
              <Controller
                control={form.control}
                name="confirmRelease"
                render={({ field, fieldState }) => (
                  <Field invalid={Boolean(fieldState.error)}>
                    <Label>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                      {t("team-post.updateConfirm")}
                    </Label>
                    {fieldState.error ? (
                      <FieldError match role="alert">
                        {fieldState.error.message}
                      </FieldError>
                    ) : null}
                  </Field>
                )}
              />
            </>
          )}
        </PortalForm>
      </DialogPopup>
    </Dialog>
  );
}
