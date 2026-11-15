import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListUsers } from "../../../hooks/team/use-list-users";
import { useTeamRuntime } from "../../../team/runtime";
import { TeamStateView } from "../../../team/team-state-view";
import { Button } from "../../../ui/upstream";
import { membersInput } from "../members-input";
import { MemberItems } from "./member-items";

export interface MoreMembersProps {
  workspaceId: string;
  search: string;
  offset: number;
}

/**
 * "Load more" at the end of the Members list. A click loads the page at `offset` in place
 * of the button; that page ends with its own "Load more" when more members exist.
 */
export function MoreMembers({ workspaceId, search, offset }: MoreMembersProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [open, setOpen] = useState(false);
  // An empty workspace ID keeps the request off until the click.
  const page = useListUsers(
    membersInput(open ? workspaceId : "", search, offset),
    team.viewer,
  );
  if (!open)
    return (
      <li className="p-2">
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          {t("team-members.loadMore")}
        </Button>
      </li>
    );
  if (!page.data)
    return (
      <li className="px-4">
        <TeamStateView
          loading={page.isLoading}
          problem={page.error}
          onRetry={() => void page.refetch()}
        >
          {null}
        </TeamStateView>
      </li>
    );
  const next = page.data.nextOffset;
  return (
    <>
      <MemberItems workspaceId={workspaceId} items={page.data.items} />
      {next === null ? null : (
        <MoreMembers workspaceId={workspaceId} search={search} offset={next} />
      )}
    </>
  );
}
