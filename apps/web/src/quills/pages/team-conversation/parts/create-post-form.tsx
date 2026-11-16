import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { PortalProblem } from "../../../core/types";
import { PortalForm } from "../../../ui/portal-form";
import {
  Button,
  Field,
  FieldLabel,
  Input,
  Textarea,
} from "../../../ui/upstream";
import { PropertySelect } from "./property-select";

// The bounds of createQuillsPostFromConversation. The component gives the translated board message.
const postSchema = (board: string) =>
  z.object({
    boardId: z.string().min(1, board),
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().max(10000),
  });
export type CreatePostValues = z.infer<ReturnType<typeof postSchema>>;

export interface CreatePostFormProps {
  boards: readonly { id: string; name: string }[];
  /** The first title, such as the conversation subject. */
  defaultTitle?: string;
  onSubmit: (values: CreatePostValues) => Promise<PortalProblem | void>;
  onCancel: () => void;
}

/** Tracks the conversation as a feedback post by its customer on a board. */
export function CreatePostForm({
  boards,
  defaultTitle = "",
  onSubmit,
  onCancel,
}: CreatePostFormProps) {
  const { t } = useTranslation("quills");
  const error = (message: unknown) =>
    message ? (
      <p role="alert" className="text-sm text-destructive-foreground">
        {String(message)}
      </p>
    ) : null;
  return (
    <PortalForm
      schema={postSchema(t("team-conversations.links.noBoards"))}
      defaultValues={{
        boardId: boards[0]?.id ?? "",
        title: defaultTitle.slice(0, 200),
        content: "",
      }}
      submitKey="team-conversations.links.create"
      onSubmit={onSubmit}
      className="max-w-none gap-3"
      footer={() => (
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("team-conversations.cancel")}
        </Button>
      )}
    >
      {(form) => (
        <>
          <PropertySelect
            label={t("team-conversations.links.board")}
            value={form.watch("boardId")}
            options={boards.map((board) => ({
              value: board.id,
              label: board.name,
            }))}
            onChange={(value) => form.setValue("boardId", value)}
          />
          {error(form.formState.errors.boardId?.message)}
          <Field invalid={Boolean(form.formState.errors.title)}>
            <FieldLabel htmlFor="conversation-post-title">
              {t("team-conversations.links.postTitle")}
            </FieldLabel>
            <Input
              id="conversation-post-title"
              maxLength={200}
              aria-invalid={Boolean(form.formState.errors.title)}
              {...form.register("title")}
            />
            {error(form.formState.errors.title?.message)}
          </Field>
          <Field invalid={Boolean(form.formState.errors.content)}>
            <FieldLabel htmlFor="conversation-post-content">
              {t("team-conversations.links.postContent")}
            </FieldLabel>
            <Textarea
              id="conversation-post-content"
              rows={3}
              maxLength={10000}
              aria-invalid={Boolean(form.formState.errors.content)}
              {...form.register("content")}
            />
            {/* maxLength stops the text at the limit, for example a long paste, so the limit shows there. */}
            {error(
              (form.formState.errors.content ||
                form.watch("content").length >= 10000) &&
                t("team-conversations.links.detailsLimit"),
            )}
          </Field>
        </>
      )}
    </PortalForm>
  );
}
