import {
  ChevronDown,
  ChevronsUp,
  CircleAlert,
  CircleDashed,
  Equal,
} from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { GetConversationResponse } from "../../../api/team/get-conversation";
import { useAssignConversationTeam } from "../../../hooks/team/use-assign-conversation-team";
import { useListConversationAttributes } from "../../../hooks/team/use-list-conversation-attributes";
import { useListTeams } from "../../../hooks/team/use-list-teams";
import { useSetConversationPriority } from "../../../hooks/team/use-set-conversation-priority";
import { useTeamRuntime } from "../../../team/runtime";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { PropertyRow } from "../../../ui/inbox/property-row";
import {
  priorities,
  priorityKeys,
  type Priority,
} from "../../team-conversations/conversation-list";
import { ActionProblem } from "./action-problem";
import { conversationFacts } from "../conversation-facts";
import { PropertySelect } from "../../../ui/inbox/property-select";
import { TagEditor } from "./tag-editor";

export interface ConversationSectionProps {
  workspaceId: string;
  conversation: GetConversationResponse;
}

const NONE = "none";
const icon = "size-4";
// The label next to the icon names the priority.
const priorityIcons: Record<Priority, ReactNode> = {
  urgent: (
    <CircleAlert
      aria-hidden="true"
      className={`${icon} text-destructive-foreground`}
    />
  ),
  high: <ChevronsUp aria-hidden="true" className={icon} />,
  medium: <Equal aria-hidden="true" className={icon} />,
  low: <ChevronDown aria-hidden="true" className={icon} />,
  none: (
    <CircleDashed
      aria-hidden="true"
      className={`${icon} text-muted-foreground`}
    />
  ),
};
type Value = GetConversationResponse["attributes"][number]["value"];

/** The team, the priority and the tags of a conversation, then its facts and attributes. */
export function ConversationSection({
  workspaceId,
  conversation,
}: ConversationSectionProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId, conversationId: conversation.id };
  const teams = useListTeams({ param: { workspaceId } }, team.viewer);
  const definitions = useListConversationAttributes(
    { param: { workspaceId }, query: {} },
    team.viewer,
  );
  const assignTeam = useAssignConversationTeam(team.viewer);
  const priority = useSetConversationPriority(team.viewer);
  const locked = !team.permissions.update;
  const show = (value: Value) =>
    Array.isArray(value)
      ? value.join(", ")
      : typeof value === "boolean"
        ? t(value ? "team-conversations.yes" : "team-conversations.no")
        : String(value);
  return (
    <PanelSection title={t("team-conversations.properties.title")}>
      <PropertyRow label={t("team-conversations.properties.team")}>
        <PropertySelect
          ghost
          label={t("team-conversations.properties.team")}
          value={conversation.assignedTeamId ?? NONE}
          disabled={locked || assignTeam.isPending}
          options={[
            { value: NONE, label: t("team-conversations.noTeam") },
            ...(teams.data?.teams ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            })),
          ]}
          onChange={(value) =>
            assignTeam.mutate({
              param,
              json: { teamId: value === NONE ? null : value },
            })
          }
        />
      </PropertyRow>
      <PropertyRow label={t("team-conversations.properties.priority")}>
        <PropertySelect
          ghost
          label={t("team-conversations.properties.priority")}
          value={conversation.priority}
          disabled={locked || priority.isPending}
          options={priorities.map((value) => ({
            value,
            label: t(priorityKeys[value]),
            icon: priorityIcons[value],
          }))}
          onChange={(value) =>
            priority.mutate({ param, json: { priority: value as Priority } })
          }
        />
      </PropertyRow>
      <PropertyRow label={t("team-conversations.properties.tags")}>
        <TagEditor
          workspaceId={workspaceId}
          conversationId={conversation.id}
          tags={conversation.tags}
        />
      </PropertyRow>
      {conversationFacts(conversation, t, i18n.language).map((fact) => (
        <PropertyRow key={fact.key} label={fact.label}>
          <span className="break-words">{fact.value}</span>
        </PropertyRow>
      ))}
      {conversation.attributes
        .filter((attribute) => attribute.value !== null)
        .map((attribute) => (
          <PropertyRow
            key={attribute.key}
            label={
              definitions.data?.items.find((item) => item.key === attribute.key)
                ?.label ?? attribute.key
            }
          >
            {show(attribute.value)}
          </PropertyRow>
        ))}
      <ActionProblem problem={assignTeam.error ?? priority.error ?? null} />
    </PanelSection>
  );
}
