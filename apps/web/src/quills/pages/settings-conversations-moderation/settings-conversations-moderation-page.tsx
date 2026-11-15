import { Link } from "@tanstack/react-router";
import { CheckCheck, Flag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { plainText } from "../../core/plain-text";
import { problemOf } from "../../core/problem-of";
import { shortDate } from "../../core/short-date";
import { useGetModerationStatus } from "../../hooks/team/use-get-moderation-status";
import { useGetSpamFilterConfig } from "../../hooks/team/use-get-spam-filter-config";
import { useListFlaggedMessages } from "../../hooks/team/use-list-flagged-messages";
import { useListPendingModeration } from "../../hooks/team/use-list-pending-moderation";
import { useUpdateSpamFilterConfig } from "../../hooks/team/use-update-spam-filter-config";
import { teamHref } from "../../team/team-href";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { PageFrame } from "../../ui/page-frame";
import { SettingSwitchRow } from "../../ui/setting-switch-row";
import {
  SettingsCard,
  SettingsEmpty,
  SettingsPage,
  SettingsRow,
  SettingsSection,
  StatusBadge,
} from "../../ui/upstream";
import { ReviewRow } from "./parts/review-row";
import { SpamFilterForm } from "./parts/spam-filter-form";

export interface SettingsConversationsModerationPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

/** Settings › Moderation (settings spec B12): the review queue, the spam filter and flags. */
export function SettingsConversationsModerationPage({
  workspaceId,
}: SettingsConversationsModerationPageProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  const status = useGetModerationStatus({ param }, team.viewer);
  // ponytail: the newest 50 items and 20 flags; page them when a queue grows past that.
  const pending = useListPendingModeration(
    { param, query: { limit: "50" } },
    team.viewer,
  );
  const manage = team.permissions.manageSettings;
  // Only managers may read the spam filter. An empty workspace ID keeps the read off.
  const spam = useGetSpamFilterConfig(
    { param: { workspaceId: manage ? workspaceId : "" } },
    team.viewer,
  );
  const flagged = useListFlaggedMessages(
    { param, query: { limit: "20" } },
    team.viewer,
  );
  const updateSpam = useUpdateSpamFilterConfig(team.viewer);
  type SpamPatch = Parameters<typeof updateSpam.mutateAsync>[0]["json"];
  const saveSpam = (json: SpamPatch) => updateSpam.mutateAsync({ param, json });
  const queries = [status, pending, flagged];
  const posts = pending.data?.posts ?? [];
  const comments = pending.data?.comments ?? [];
  const by = (board: string, author: string | null) =>
    [board, author ?? t("settings-conversations.moderation.guest")].join(" · ");
  return (
    <PageFrame
      titleKey="settings-conversations.moderation.title"
      variant="app"
      landmark={false}
    >
      <SettingsPage
        title={t("settings-conversations.moderation.title")}
        description={t("settings-conversations.moderation.description")}
      >
        <TeamStateView
          loading={queries.some((query) => query.isPending)}
          problem={queries.find((query) => query.error)?.error}
        >
          <SettingsSection
            title={t("settings-conversations.moderation.queue")}
            description={
              status.data?.enabled
                ? t("settings-conversations.moderation.waiting", {
                    count: status.data.pendingCount,
                  })
                : t("settings-conversations.moderation.off")
            }
          >
            <SettingsCard>
              {posts.map((post) => (
                <ReviewRow
                  key={post.id}
                  workspaceId={workspaceId}
                  kind="post"
                  id={post.id}
                  postId={post.id}
                  title={post.title}
                  content={post.content}
                  detail={by(post.boardName, post.authorName)}
                />
              ))}
              {comments.map((comment) => (
                <ReviewRow
                  key={comment.id}
                  workspaceId={workspaceId}
                  kind="comment"
                  id={comment.id}
                  postId={comment.postId}
                  title={comment.postTitle}
                  content={comment.content}
                  detail={by(comment.boardName, comment.authorName)}
                />
              ))}
              {posts.length || comments.length ? null : (
                <SettingsEmpty
                  icon={<CheckCheck />}
                  title={t("settings-conversations.moderation.clear")}
                  description={t("settings-conversations.moderation.clearText")}
                />
              )}
            </SettingsCard>
          </SettingsSection>
          {manage ? (
            <SettingsSection
              title={t("settings-conversations.moderation.spam")}
            >
              <TeamStateView loading={spam.isLoading} problem={spam.error}>
                <SettingsCard>
                  <SettingSwitchRow
                    title={t("settings-conversations.moderation.classifier")}
                    description={t(
                      "settings-conversations.moderation.classifierText",
                    )}
                    checked={spam.data?.aiClassifier ?? false}
                    onCheckedChange={async (aiClassifier) => {
                      await saveSpam({ aiClassifier });
                    }}
                  />
                  {spam.data ? (
                    <SpamFilterForm
                      // The API lowercases the senders and drops invalid ones: show what it stored.
                      key={spam.data.trustedSenders.join("\n")}
                      senders={spam.data.trustedSenders}
                      onSubmit={(trustedSenders) =>
                        problemOf(saveSpam({ trustedSenders }))
                      }
                    />
                  ) : null}
                </SettingsCard>
              </TeamStateView>
            </SettingsSection>
          ) : null}
          <SettingsSection
            title={t("settings-conversations.moderation.flagged")}
            description={t("settings-conversations.moderation.flaggedText")}
          >
            <SettingsCard>
              {flagged.data?.items.length ? (
                flagged.data.items.map((flag) => (
                  <SettingsRow
                    key={flag.messageId}
                    title={
                      <Link
                        to={teamHref(
                          workspaceId,
                          `/conversations/${flag.conversationId}`,
                        )}
                        className="font-normal hover:underline"
                      >
                        {plainText(flag.preview)}
                      </Link>
                    }
                    description={shortDate(flag.flaggedAt, i18n.language)}
                    badge={
                      flag.isInternal ? (
                        <StatusBadge tone="neutral">
                          {t("settings-conversations.moderation.internal")}
                        </StatusBadge>
                      ) : null
                    }
                  />
                ))
              ) : (
                <SettingsEmpty
                  icon={<Flag />}
                  title={t("settings-conversations.moderation.noFlags")}
                  description={t(
                    "settings-conversations.moderation.noFlagsText",
                  )}
                />
              )}
            </SettingsCard>
          </SettingsSection>
        </TeamStateView>
      </SettingsPage>
    </PageFrame>
  );
}
