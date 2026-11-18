import { useNavigate } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateChangelogEntry } from "../../hooks/team/use-create-changelog-entry";
import { useDraftChangelogFromPosts } from "../../hooks/team/use-draft-changelog-from-posts";
import { useListChangelog } from "../../hooks/team/use-list-changelog";
import { useSearchShippedPosts } from "../../hooks/team/use-search-shipped-posts";
import { teamHref } from "../../team/team-href";
import { useTeamRuntime } from "../../team/runtime";
import { TeamStateView } from "../../team/team-state-view";
import { ListHeader } from "../../ui/inbox/list-header";
import { StatusTabs } from "../../ui/inbox/status-tabs";
import { PageFrame } from "../../ui/page-frame";
import {
  Button,
  MenuRadioGroup,
  MenuRadioItem,
  toast,
} from "../../ui/upstream";
import { DraftSheet } from "./parts/draft-sheet";
import { EngagementList } from "./parts/engagement-list";
import { EntryRow } from "./parts/entry-row";
import { EmptyState } from "../../ui/empty-state";
import { ChangelogArt } from "../../ui/illustrations/changelog-art";

export interface TeamChangelogPageProps {
  workspaceId: string;
  params: Record<string, string>;
  search: Record<string, unknown>;
}

const statuses = ["all", "draft", "scheduled", "published"] as const;
type Status = (typeof statuses)[number];

/**
 * The changelog entries with drafts (settings spec A3), the engagement of published updates,
 * and AI drafts from shipped requests (RFC 0003, features 14 and 15).
 */
export function TeamChangelogPage({ workspaceId }: TeamChangelogPageProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const navigate = useNavigate();
  const [tab, setTab] = useState("entries");
  const [status, setStatus] = useState<Status>("all");
  const param = { workspaceId };
  const entries = useListChangelog(
    { param, query: { status, limit: "50" } },
    team.viewer,
  );
  // ponytail: the 20 shipped posts with the most votes; add a search field when teams need older ones.
  const shipped = useSearchShippedPosts({ param, query: {} }, team.viewer);
  const draft = useDraftChangelogFromPosts(team.viewer);
  const create = useCreateChangelogEntry(team.viewer);
  const items = entries.data?.pages.flatMap((page) => page.entries) ?? [];
  const href = (id: string) => teamHref(workspaceId, `/changelog/${id}`);
  const open = (id: string) => void navigate({ to: href(id) });
  const newEntry = (
    <Button
      size="sm"
      onClick={() => open("new")}
      disabled={!team.permissions.create}
    >
      <PenLine aria-hidden="true" />
      {t("team-changelog.newEntry")}
    </Button>
  );
  const label = {
    all: t("team-changelog.status.all"),
    draft: t("team-changelog.status.draft"),
    scheduled: t("team-changelog.status.scheduled"),
    published: t("team-changelog.status.published"),
  };

  return (
    <PageFrame titleKey="team-changelog.title" variant="app" landmark={false}>
      <ListHeader
        title={t("team-changelog.title")}
        filters={
          tab === "entries" ? (
            <MenuRadioGroup
              value={status}
              onValueChange={(value) => setStatus(value as Status)}
            >
              {statuses.map((value) => (
                <MenuRadioItem key={value} value={value}>
                  {label[value]}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          ) : undefined
        }
        actions={
          <>
            {shipped.data ? (
              <DraftSheet
                posts={shipped.data.posts}
                draft={draft.data ?? null}
                problem={draft.error ?? null}
                onDraft={async (postIds) => {
                  await draft.mutateAsync({ param, json: { postIds } });
                }}
                onCreate={async (postIds) => {
                  if (!draft.data) return;
                  const entry = await create
                    .mutateAsync({
                      param,
                      json: {
                        title: draft.data.title,
                        content: draft.data.body,
                        linkedPostIds: postIds,
                        publishState: { type: "draft" },
                      },
                    })
                    .catch(() => {
                      toast.error(t("team-changelog.createFailed"));
                    });
                  if (entry) open(entry.id);
                }}
              />
            ) : null}
            {newEntry}
          </>
        }
      />
      <StatusTabs
        label={t("team-changelog.tabs.label")}
        tabs={[
          { value: "entries", label: t("team-changelog.tabs.entries") },
          { value: "engagement", label: t("team-changelog.tabs.engagement") },
        ]}
        value={tab}
        onChange={setTab}
      />
      {/* The loading, empty and error states get a margin. */}
      <div className="min-h-0 flex-1 overflow-y-auto [&>[role=alert]]:m-4 [&>[role=status]]:px-4">
        {tab === "engagement" ? (
          <EngagementList workspaceId={workspaceId} />
        ) : (
          <TeamStateView
            loading={entries.isLoading}
            problem={entries.error}
            onRetry={() => void entries.refetch()}
          >
            {items.length ? (
              <ul
                aria-label={t("team-changelog.tabs.entries")}
                className="grid grid-cols-1 gap-0.5 p-2"
              >
                {items.map((entry) => (
                  <li key={entry.id}>
                    <EntryRow
                      entry={entry}
                      href={href(entry.id)}
                      onOpen={() => open(entry.id)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                art={<ChangelogArt />}
                title={t("empty.changelog.title")}
                description={t("empty.changelog.body")}
                actions={newEntry}
              />
            )}
            {entries.hasNextPage ? (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => void entries.fetchNextPage()}
                loading={entries.isFetchingNextPage}
              >
                {t("team-changelog.loadMoreEntries")}
              </Button>
            ) : null}
          </TeamStateView>
        )}
      </div>
    </PageFrame>
  );
}
