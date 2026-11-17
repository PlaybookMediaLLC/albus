import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FocusEvent,
  type ReactNode,
} from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  rememberDraft,
  saveDraft,
  startingDraft,
} from "../../core/composer-draft";
import { ArrowUpIcon } from "../arrow-up-icon";
import { PortalForm } from "../portal-form";
import { cn } from "../upstream";
import { BoardSelect } from "./board-select";
import { ComposerDetails } from "./composer-details";
import { ComposerFields } from "./composer-fields";
import { shouldCollapse } from "./composer-collapse";
import { composerSchema } from "./composer-schema";
import type { PublicField } from "../../core/composer-fields";
import type { PortalProblem } from "../../core/types";
import type { PostComposerValues } from "./post-composer.type";
import { ComposerSignIn } from "./composer-sign-in";
import { ComposerTitle } from "./composer-title";

export interface PostComposerProps {
  workspaceName: string;
  /** `fields`: the board's public custom fields, which the composer asks for. */
  boards: Array<{ id: string; name: string; fields?: PublicField[] }>;
  defaultBoardId?: string;
  /** Set for a visitor who must sign in first; the composer then only searches. */
  signInHref?: string;
  autoFocus?: boolean;
  /** Saves an unsent title and details on this device under this key. */
  draftKey?: string;
  /** A title to start from, such as a search that found nothing. */
  initialTitle?: string;
  /** A file control in the footer; it gets whether the form is sending. */
  attachments?: (submitting: boolean) => ReactNode;
  /** A helper under the details: it reads the draft and can replace it. */
  assist?: (
    draft: () => PostComposerValues,
    apply: (values: PostComposerValues) => void,
  ) => ReactNode;
  onTitleChange: (title: string) => void;
  onSubmit: (values: PostComposerValues) => Promise<PortalProblem | void>;
}

type TitleProps = Partial<ComponentProps<typeof ComposerTitle>>;
const card =
  "rounded-2xl border border-border bg-card px-4 py-3 shadow-xs transition-shadow focus-within:shadow-sm";

export function PostComposer(props: PostComposerProps) {
  const { t } = useTranslation("quills");
  const [draft] = useState(() =>
    startingDraft(props.draftKey, props.initialTitle),
  );
  const [expanded, setExpanded] = useState(
    Boolean(props.autoFocus || draft.title || draft.content),
  );
  const [title, setTitle] = useState(draft.title);
  const [round, setRound] = useState(0);
  const schema = composerSchema({
    titleRequired: t("feedback.titleRequired"),
    boards: props.boards,
    fieldRequired: (label) => t("feedback.fieldRequired", { label }),
  });
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  // A restored or given title shows its similar posts at once.
  const { onTitleChange } = props;
  useEffect(() => {
    if (draft.title.trim()) onTitleChange(draft.title);
  }, [draft.title, onTitleChange]);
  // Similar-post search is rate limited, so it waits until typing pauses.
  const changeTitle = (value: string) => {
    setTitle(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => props.onTitleChange(value), 300);
  };
  const collapse = (event: FocusEvent<HTMLDivElement>) => {
    if (shouldCollapse(event.currentTarget, event.relatedTarget, title))
      setExpanded(false);
  };
  const titleInput = (field?: TitleProps) => (
    <ComposerTitle
      {...{ workspaceName: props.workspaceName, autoFocus: props.autoFocus }}
      onFocus={() => setExpanded(true)}
      {...field}
    />
  );

  if (props.signInHref)
    return (
      <div className={card} onBlur={collapse}>
        {titleInput({
          defaultValue: draft.title,
          onChange: (event: { target: { value: string } }) =>
            changeTitle(event.target.value),
        })}
        {expanded ? <ComposerSignIn href={props.signInHref} /> : null}
      </div>
    );

  return (
    <div onBlur={collapse}>
      <PortalForm
        key={round}
        schema={schema}
        defaultValues={{
          boardId: props.defaultBoardId ?? props.boards[0]?.id,
          title: round ? "" : draft.title,
          content: round ? "" : draft.content,
          customFields: {},
        }}
        submitKey="feedback.submit"
        submitIcon={<ArrowUpIcon />}
        // The send button stays quiet until there is a title to send.
        submitVariant={title.trim() ? "default" : "secondary"}
        className={cn(
          card,
          "max-w-none gap-1 py-2",
          !expanded && "[&>div:last-child]:hidden",
        )}
        onSubmit={async (values) => {
          const problem = await props.onSubmit(values);
          if (!problem) {
            saveDraft(props.draftKey, { title: "", content: "" });
            changeTitle("");
            setExpanded(false);
            setRound(round + 1);
          }
          return problem;
        }}
        footer={(form) => (
          <>
            {props.attachments?.(form.formState.isSubmitting)}
            <Controller
              control={form.control}
              name="boardId"
              render={({ field }) => (
                <BoardSelect
                  name={field.name}
                  boards={props.boards}
                  value={field.value}
                  triggerRef={field.ref}
                  onChange={field.onChange}
                />
              )}
            />
          </>
        )}
      >
        {(form) => (
          <>
            {titleInput(
              form.register("title", {
                onChange: (event) => {
                  changeTitle(event.target.value);
                  rememberDraft(props.draftKey, form.getValues());
                },
              }),
            )}
            {form.formState.errors.title?.message ? (
              <p role="alert" className="text-xs text-destructive-foreground">
                {String(form.formState.errors.title.message)}
              </p>
            ) : null}
            {expanded ? (
              <>
                <ComposerDetails
                  {...form.register("content", {
                    onChange: () =>
                      rememberDraft(props.draftKey, form.getValues()),
                  })}
                />
                <ComposerFields boards={props.boards} form={form} />
              </>
            ) : null}
            {expanded &&
              props.assist?.(form.getValues, (values) => {
                form.reset(values, { keepDefaultValues: true });
                changeTitle(values.title);
                rememberDraft(props.draftKey, values);
              })}
          </>
        )}
      </PortalForm>
      {round ? (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {t("feedback.submitted")}
        </p>
      ) : null}
    </div>
  );
}
