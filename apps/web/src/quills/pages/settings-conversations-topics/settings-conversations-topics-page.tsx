import { Archive } from "lucide-react";
import { useTranslation } from "react-i18next";
import { problemOf } from "../../core/problem-of";
import type { PortalProblem } from "../../core/types";
import { useArchiveConversationTag } from "../../hooks/team/use-archive-conversation-tag";
import { useCreateConversationTag } from "../../hooks/team/use-create-conversation-tag";
import { useDeleteConversationTag } from "../../hooks/team/use-delete-conversation-tag";
import { useListConversationTagUsage } from "../../hooks/team/use-list-conversation-tag-usage";
import { useListConversationTags } from "../../hooks/team/use-list-conversation-tags";
import { useRestoreConversationTag } from "../../hooks/team/use-restore-conversation-tag";
import { useUpdateConversationTag } from "../../hooks/team/use-update-conversation-tag";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import { TagList } from "../../ui/tag-list";
import { SettingsPage, toast } from "../../ui/upstream";
import { ArchivedTopics } from "./parts/archived-topics";

export interface SettingsConversationsTopicsPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

const copy = {
  title: "settings-conversations.topics.list",
  create: "settings-conversations.topics.new",
  createTitle: "settings-conversations.topics.createTitle",
  createText: "settings-conversations.topics.createText",
  rename: "settings-conversations.topics.rename",
  renameText: "settings-conversations.topics.renameText",
  name: "settings-conversations.topics.name",
  placeholder: "settings-conversations.topics.placeholder",
  taken: "settings-conversations.topics.taken",
  actions: "settings-conversations.topics.actions",
  delete: "settings-conversations.topics.delete",
  deleteTitle: "settings-conversations.topics.deleteTitle",
  deleteText: "settings-conversations.topics.deleteText",
  deleteFailed: "settings-conversations.topics.deleteFailed",
  emptyTitle: "settings-conversations.topics.emptyTitle",
  emptyText: "settings-conversations.topics.emptyText",
};

/** Settings › Topics (settings spec B12): the conversation tags with their open counts. */
export function SettingsConversationsTopicsPage({
  workspaceId,
}: SettingsConversationsTopicsPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const tags = useListConversationTags(
    { param: { workspaceId }, query: { counts: "true" } },
    team.viewer,
  );
  const manage = team.permissions.manageSettings;
  // Only managers may read the archived topics. An empty workspace ID keeps the read off.
  const usage = useListConversationTagUsage(
    { param: { workspaceId: manage ? workspaceId : "" } },
    team.viewer,
  );
  const create = useCreateConversationTag(team.viewer);
  const rename = useUpdateConversationTag(team.viewer);
  const archive = useArchiveConversationTag(team.viewer);
  const restore = useRestoreConversationTag(team.viewer);
  const remove = useDeleteConversationTag(team.viewer);
  const at = (tagId: string) => ({ workspaceId, tagId });
  const undo = (tagId: string) =>
    restore
      .mutateAsync({ param: at(tagId) })
      .catch(() => toast.error(t("settings-conversations.topics.undoFailed")));
  const archiveTopic = async (tagId: string, name: string) => {
    try {
      await archive.mutateAsync({ param: at(tagId) });
      toast.success(t("settings-conversations.topics.archived", { name }), {
        action: {
          label: t("settings-conversations.topics.undo"),
          onClick: () => void undo(tagId),
        },
      });
    } catch {
      // The one expected refusal: a live workflow or macro uses the topic.
      toast.error(t("settings-conversations.topics.archiveFailed"));
    }
  };
  return (
    <PageFrame
      titleKey="settings-conversations.topics.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-conversations.topics.title")}
        description={t("settings-conversations.topics.description")}
      >
        <TeamStateView
          loading={tags.isPending || usage.isLoading}
          problem={tags.error ?? usage.error}
        >
          <TagList
            items={(tags.data?.items ?? []).map((tag) => ({
              ...tag,
              detail:
                tag.count === null
                  ? undefined
                  : t("settings-conversations.topics.open", {
                      count: tag.count,
                    }),
            }))}
            copy={copy}
            maxLength={50}
            canManage={manage}
            onCreate={async (name): Promise<PortalProblem | void> => {
              try {
                const result = await create.mutateAsync({
                  param: { workspaceId },
                  json: { name },
                });
                // A live topic with this name, in any case, comes back unchanged.
                if (!result.created) return { kind: "conflict" };
              } catch (problem) {
                return problem as PortalProblem;
              }
            }}
            onRename={(id, name) =>
              problemOf(rename.mutateAsync({ param: at(id), json: { name } }))
            }
            onDelete={async (id) => {
              // The API deletes only an archived topic.
              await archive.mutateAsync({ param: at(id) });
              await remove.mutateAsync({ param: at(id) });
            }}
            actions={(item) => [
              {
                id: "archive",
                label: t("settings-conversations.topics.archive"),
                icon: Archive,
                onSelect: () => void archiveTopic(item.id, item.name),
              },
            ]}
          />
          <ArchivedTopics
            items={(usage.data?.items ?? []).filter((tag) => tag.archived)}
            pending={restore.isPending}
            onRestore={(tagId) => void undo(tagId)}
          />
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
