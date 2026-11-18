import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../core/types";
import { useAnswerKnowledgeSuggestion } from "../../hooks/team/use-answer-knowledge-suggestion";
import { useApproveKnowledgeSuggestion } from "../../hooks/team/use-approve-knowledge-suggestion";
import { useDismissKnowledgeSuggestion } from "../../hooks/team/use-dismiss-knowledge-suggestion";
import { useGetKnowledgeSuggestion } from "../../hooks/team/use-get-knowledge-suggestion";
import { useListKnowledgeSuggestions } from "../../hooks/team/use-list-knowledge-suggestions";
import { useUpdateKnowledgeSuggestion } from "../../hooks/team/use-update-knowledge-suggestion";
import { useTeamRuntime } from "../../team/runtime";
import { teamHref } from "../../team/team-href";
import { TeamStateView } from "../../team/team-state-view";
import { GroupedList } from "../../ui/inbox/grouped-list";
import { useListNavigation } from "../../ui/inbox/use-list-navigation";
import { PageFrame } from "../../ui/page-frame";
import { knowledgeGroups } from "./knowledge-groups";
import type {
  KnowledgeAudience,
  KnowledgeDraftValues,
} from "./parts/knowledge-draft";
import { KnowledgeList, type KnowledgeFilter } from "./parts/knowledge-list";
import { KnowledgeRow } from "./parts/knowledge-row";
import { KnowledgeView } from "./parts/knowledge-view";

export interface TeamKnowledgePageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/** "Teach the AI" (issue #275): answer, edit and approve or dismiss what the AI learned. */
export function TeamKnowledgePage({ workspaceId }: TeamKnowledgePageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [status, setStatus] = useState<KnowledgeFilter>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState<PortalProblem | null>(null);
  const [audience, setAudience] = useState<KnowledgeAudience>("team");
  const [edits, setEdits] = useState<KnowledgeDraftValues | null>(null);
  const list = useListKnowledgeSuggestions(
    { param: { workspaceId }, query: { status } },
    team.viewer,
  );
  const detail = useGetKnowledgeSuggestion(
    { param: { workspaceId, suggestionId: openId ?? "" } },
    team.viewer,
  );
  const answer = useAnswerKnowledgeSuggestion(team.viewer);
  const update = useUpdateKnowledgeSuggestion(team.viewer);
  const approve = useApproveKnowledgeSuggestion(team.viewer);
  const dismiss = useDismissKnowledgeSuggestion(team.viewer);
  const items = list.data?.items ?? [];
  const groups = knowledgeGroups(items, {
    gaps: t("knowledge.gaps"),
    others: t("knowledge.others"),
  });
  const ordered = groups.flatMap((group) => group.items);
  const ids = ordered.map((item) => item.id);
  const open = items.find((item) => item.id === openId);
  /** Opens a suggestion with a clean slate: the team audience, no old problem and no edits. */
  const select = (id: string | null, done = "") => {
    setOpenId(id);
    setMessage(done);
    setProblem(null);
    setAudience("team");
    setEdits(null);
  };
  useListNavigation({
    ids,
    activeId: cursor,
    onMove: setCursor,
    onOpen: (id) => select(id),
    enabled: !open,
  });
  const busy =
    answer.isPending ||
    update.isPending ||
    approve.isPending ||
    dismiss.isPending;
  const param = { workspaceId, suggestionId: openId ?? "" };
  /** Runs a change; `leave` opens the next suggestion because the decided one leaves this list. */
  const run = (work: () => Promise<unknown>, done: string, leave: boolean) => {
    const index = openId ? ids.indexOf(openId) : -1;
    setProblem(null);
    work().then(
      () =>
        leave
          ? select(ids[index + 1] ?? ids[index - 1] ?? null, done)
          : setMessage(done),
      (error: PortalProblem) => setProblem(error),
    );
  };
  const title = detail.data?.title ?? open?.title ?? open?.candidateTitle ?? "";
  const stepIndex = detail.data?.stepIndex ?? 0;

  return (
    <PageFrame
      titleKey={open ? "knowledge.detail" : "knowledge.title"}
      displayTitle={open ? title : undefined}
      variant="app"
      landmark={false}
    >
      {open ? (
        <KnowledgeView
          workspaceId={workspaceId}
          suggestion={open}
          detail={detail.data}
          suggestions={ordered}
          message={message}
          problem={problem ?? detail.error ?? null}
          onMove={(id) => select(id)}
          onBack={() => {
            setCursor(open.id);
            select(null);
          }}
          steps={{
            audience,
            busy,
            onAudienceChange: setAudience,
            onDraftChange: setEdits,
            // The form shows its own problem.
            onAnswer: (text) =>
              answer
                .mutateAsync({ param, json: { stepIndex, answer: text } })
                .then(() => undefined),
            onSkip: () =>
              run(
                () =>
                  answer.mutateAsync({
                    param,
                    json: { stepIndex, skip: true },
                  }),
                "",
                false,
              ),
            onSave: (draft) =>
              update
                .mutateAsync({ param, json: draft })
                .then(() => setMessage(t("knowledge.savedMessage"))),
          }}
          actions={{
            busy,
            onApprove: () =>
              run(
                // The text on screen, saved or not.
                () =>
                  approve.mutateAsync({
                    param,
                    json: { audience, ...edits },
                  }),
                t("knowledge.approvedMessage", {
                  title: edits?.title || title,
                }),
                true,
              ),
            onDismiss: () =>
              run(
                () => dismiss.mutateAsync({ param }),
                t("knowledge.dismissedMessage", { title }),
                true,
              ),
          }}
        />
      ) : (
        <KnowledgeList
          status={status}
          onStatusChange={(value) => {
            setStatus(value);
            setCursor(null);
          }}
          message={message}
        >
          <TeamStateView
            loading={list.isLoading}
            problem={list.error ?? null}
            empty={!items.length}
            onRetry={() => void list.refetch()}
          >
            <GroupedList
              label={t("knowledge.title")}
              groups={groups}
              getKey={(item) => item.id}
              renderItem={(item) => (
                <KnowledgeRow
                  suggestion={item}
                  href={teamHref(workspaceId, "/knowledge")}
                  selected={item.id === cursor}
                  onOpen={() => select(item.id)}
                />
              )}
            />
          </TeamStateView>
        </KnowledgeList>
      )}
    </PageFrame>
  );
}
