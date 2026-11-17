import { ChevronLeft } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetChangelogEntryResponse } from "../../../api/team/get-changelog-entry";
import { useCreateChangelogEntry } from "../../../hooks/team/use-create-changelog-entry";
import { useUpdateChangelogEntry } from "../../../hooks/team/use-update-changelog-entry";
import { useTeamRuntime } from "../../../team/runtime";
import { IconButton } from "../../../ui/inbox/icon-button";
import { Textarea, toast } from "../../../ui/upstream";
import { missingField, saveBody, TITLE_MAX } from "../save-body";
import { saveProblem } from "../save-problem";
import { useAutosave } from "../use-autosave";
import { AiMenu, type RewriteTarget } from "./ai-menu";
import { BodyEditor } from "./body-editor";
import { EntryLanguages } from "./entry-languages";
import { PublishPopover } from "./publish-popover";
import { SaveIndicator } from "./save-indicator";

export interface EntryEditorProps {
  workspaceId: string;
  /** The stored entry. Null on a new entry until its first save. */
  entry: GetChangelogEntryResponse | null;
  aiOn: boolean;
  onCreated: (entry: GetChangelogEntryResponse) => void;
  onBack: () => void;
}

/**
 * The full-page editor of one changelog entry. The text lives here and saves itself 1 s
 * after the last change; the first save of a new entry creates it as a draft.
 */
export function EntryEditor({
  workspaceId,
  entry,
  aiOn,
  onCreated,
  onBack,
}: EntryEditorProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const create = useCreateChangelogEntry(team.viewer);
  const update = useUpdateChangelogEntry(team.viewer);
  const [text, setText] = useState({
    title: entry?.title ?? "",
    content: entry?.content ?? "",
  });
  const body = useRef<HTMLTextAreaElement>(null);
  // Set before the parent re-renders, so a save right after the create updates the entry.
  const created = useRef<string | null>(null);
  // The API is the authority. Without the permission, the text is read-only.
  const canEdit =
    team.permissions.update && (entry !== null || team.permissions.create);
  const autosave = useAutosave(text, async ({ title, content }) => {
    const id = entry?.id ?? created.current;
    const json = saveBody(title, content, !id);
    if (!json) return false;
    try {
      if (id) {
        await update.mutateAsync({ param: { workspaceId, entryId: id }, json });
        return true;
      }
      const made = await create.mutateAsync({
        param: { workspaceId },
        json: {
          ...json,
          content: json.content ?? "",
          publishState: { type: "draft" },
        },
      });
      created.current = made.id;
      onCreated(made);
      return true;
    } catch (error) {
      const problem = saveProblem(error);
      toast.error(t(problem.key), { description: problem.description });
      throw error;
    }
  });
  const missing = missingField(text.title, text.content, !entry);
  const target = (): RewriteTarget => {
    const field = body.current;
    const start = field?.selectionStart ?? 0;
    const end = field?.selectionEnd ?? 0;
    return start < end
      ? { text: text.content.slice(start, end), start, end }
      : { text: text.content, start: 0, end: text.content.length };
  };
  const apply = (next: string, at: RewriteTarget) => {
    // The user can type during the rewrite. Then the old offsets point to other text.
    if (text.content.slice(at.start, at.end) !== at.text) {
      toast.error(t("team-changelog.ai.changed"));
      return;
    }
    setText({
      ...text,
      content:
        text.content.slice(0, at.start) + next + text.content.slice(at.end),
    });
  };
  return (
    <>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <IconButton label={t("team-changelog.editor.back")} onClick={onBack}>
          <ChevronLeft aria-hidden="true" />
        </IconButton>
        <div className="flex items-center gap-1">
          <PublishPopover
            workspaceId={workspaceId}
            entry={entry}
            flush={autosave.flush}
            onDeleted={onBack}
          />
          {aiOn && canEdit ? (
            <AiMenu workspaceId={workspaceId} target={target} onApply={apply} />
          ) : null}
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-180 gap-6 px-6 pb-32 pt-10 md:pt-24">
        <Textarea
          unstyled
          aria-label={t("team-changelog.editor.title")}
          placeholder={t("team-changelog.untitled")}
          maxLength={TITLE_MAX}
          rows={1}
          readOnly={!canEdit}
          value={text.title}
          onChange={(event) => setText({ ...text, title: event.target.value })}
          className="w-full text-3xl font-bold leading-tight tracking-tight md:text-4xl [&_textarea]:min-h-0 [&_textarea]:resize-none [&_textarea]:px-0"
        />
        <BodyEditor
          value={text.content}
          onChange={(content) => setText({ ...text, content })}
          textareaRef={body}
          readOnly={!canEdit}
        />
        {entry ? (
          <EntryLanguages
            workspaceId={workspaceId}
            entryId={entry.id}
            canEdit={canEdit}
          />
        ) : null}
      </div>
      <SaveIndicator
        state={missing ? "unsaved" : autosave.state}
        missing={missing}
        onRetry={() => void autosave.retry()}
      />
    </>
  );
}
