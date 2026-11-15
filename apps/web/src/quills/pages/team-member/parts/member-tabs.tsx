import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsPanel, TabsTab } from "../../../ui/upstream";
import { MemberComments } from "./member-comments";
import { MemberRequests } from "./member-requests";

export interface MemberTabsProps {
  workspaceId: string;
  principalId: string;
  postCount: number;
  commentCount: number;
}

/**
 * The Requests and Comments tabs of a member. The Activity tab waits for a route that lists
 * one person's activity (settings spec 5.3).
 */
export function MemberTabs({
  workspaceId,
  principalId,
  postCount,
  commentCount,
}: MemberTabsProps) {
  const { t } = useTranslation("quills");
  const tabs = [
    { value: "requests", label: t("team-members.requests"), count: postCount },
    {
      value: "comments",
      label: t("team-members.commentsTab"),
      count: commentCount,
    },
  ];
  const ids = { workspaceId, principalId };
  return (
    <Tabs defaultValue="requests" className="mt-8">
      <TabsList
        variant="underline"
        aria-label={t("team-members.tabs")}
        className="w-full justify-start gap-4 border-b border-border"
      >
        {tabs.map((tab) => (
          <TabsTab key={tab.value} value={tab.value} className="grow-0 px-0">
            {tab.label}{" "}
            <span className="tabular-nums text-muted-foreground">
              {tab.count}
            </span>
          </TabsTab>
        ))}
      </TabsList>
      <TabsPanel value="requests" className="pt-4">
        <MemberRequests {...ids} />
      </TabsPanel>
      <TabsPanel value="comments" className="pt-4">
        <MemberComments {...ids} />
      </TabsPanel>
    </Tabs>
  );
}
