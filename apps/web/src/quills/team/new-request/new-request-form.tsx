import { ChevronRight } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { ListBoardsResponse } from "../../api/team/list-boards";
import type { ListStatusesResponse } from "../../api/team/list-statuses";
import type { ListTagsResponse } from "../../api/team/list-tags";
import { statusProgress } from "../../core/status-progress";
import type { PortalProblem } from "../../core/types";
import { PostStatusIcon } from "../../ui/inbox/post-status-icon";
import { PortalForm } from "../../ui/portal-form";
import { Input, Textarea } from "../../ui/upstream";
import { PillSelect } from "./pill-select";
import { TagsPill } from "./tags-pill";

// The bounds of createQuillsPost. The component gives the translated board message.
const requestSchema = (board: string) =>
  z.object({
    boardId: z.string().min(1, board),
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().max(10000),
    statusId: z.string(),
    tagIds: z.array(z.string()).max(50),
  });
export type NewRequestValues = z.infer<ReturnType<typeof requestSchema>>;

// PortalForm puts its footer row (the controls and Create) last: this makes it the muted footer band.
const footerBand =
  "[&>:last-child]:-mx-4 [&>:last-child]:border-t [&>:last-child]:bg-muted/72 [&>:last-child]:px-4 [&>:last-child]:py-3";

/** Cmd+Enter or Ctrl+Enter in a text field sends the form. */
const submitOnShortcut = (
  event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) => {
  if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
  event.preventDefault();
  event.currentTarget.form?.requestSubmit();
};

export interface NewRequestFormProps {
  boards: ListBoardsResponse["items"];
  statuses: ListStatusesResponse["statuses"];
  tags: ListTagsResponse["tags"];
  /** The board of the list filter. Without it, the first board. */
  boardId?: string;
  /** The first status. Without it, or when it does not exist, the default status. */
  defaultStatusId?: string;
  /** The author control at the start of the header row. */
  author: ReactNode;
  onSubmit: (values: NewRequestValues) => Promise<PortalProblem | void>;
}

/** The New request card: author and board, the title and details, then status, tags and Create. */
export function NewRequestForm(props: NewRequestFormProps) {
  const { t } = useTranslation("quills");
  // A filter board that no longer exists leaves the board empty: the teammate chooses one.
  const boardId = props.boardId ?? props.boards[0]?.id;
  // The API order: by category, then position.
  const statuses = props.statuses;
  return (
    <PortalForm<NewRequestValues>
      schema={requestSchema(
        t(
          props.boards.length
            ? "team-posts.chooseBoard"
            : "team-posts.noBoards",
        ),
      )}
      defaultValues={{
        boardId: props.boards.some((board) => board.id === boardId)
          ? boardId
          : "",
        title: "",
        content: "",
        statusId:
          (
            statuses.find((status) => status.id === props.defaultStatusId) ??
            statuses.find((status) => status.isDefault)
          )?.id ?? "",
        tagIds: [],
      }}
      submitKey="team-posts.create"
      className={`max-w-none gap-3 px-4 pt-3 pb-0 ${footerBand}`}
      onSubmit={props.onSubmit}
      footer={(form) => (
        <div className="me-auto flex flex-wrap items-center gap-2">
          <PillSelect
            control={form.control}
            name="statusId"
            label={t("team-posts.status")}
            options={statuses.map((status) => ({
              value: status.id,
              label: status.name,
              icon: (
                <PostStatusIcon
                  color={status.color}
                  progress={statusProgress(statuses, status.id)}
                />
              ),
            }))}
          />
          <TagsPill
            tags={props.tags}
            value={form.watch("tagIds")}
            onChange={(tagIds) => form.setValue("tagIds", tagIds)}
          />
        </div>
      )}
    >
      {(form) => (
        <>
          <div className="flex flex-wrap items-center gap-1.5 pe-9 text-sm">
            {props.author}
            <ChevronRight
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <PillSelect
              control={form.control}
              name="boardId"
              label={t("team-posts.board")}
              options={props.boards.map((board) => ({
                value: board.id,
                label: board.name,
              }))}
            />
          </div>
          <Input
            unstyled
            autoFocus
            aria-label={t("team-posts.titleLabel")}
            placeholder={t("team-posts.titleLabel")}
            aria-invalid={Boolean(form.formState.errors.title)}
            className="flex w-full text-xl font-semibold"
            onKeyDown={submitOnShortcut}
            {...form.register("title")}
          />
          {form.formState.errors.title?.message ? (
            <p role="alert" className="text-xs text-destructive-foreground">
              {form.formState.errors.title.message}
            </p>
          ) : null}
          <Textarea
            unstyled
            maxLength={10000}
            aria-label={t("team-posts.details")}
            placeholder={t("team-posts.details")}
            aria-invalid={Boolean(form.formState.errors.content)}
            className="flex w-full text-sm [&_textarea]:max-h-[40dvh] [&_textarea]:min-h-28"
            onKeyDown={submitOnShortcut}
            {...form.register("content")}
          />
          {/* maxLength stops the text at the limit, for example a long paste, so the limit shows there. */}
          {form.formState.errors.content ||
          form.watch("content").length >= 10000 ? (
            <p role="alert" className="text-xs text-destructive-foreground">
              {t("team-posts.detailsLimit")}
            </p>
          ) : null}
        </>
      )}
    </PortalForm>
  );
}
