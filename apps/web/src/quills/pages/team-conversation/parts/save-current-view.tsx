import { useNavigate } from "@tanstack/react-router";
import { useCreateConversationView } from "../../../hooks/team/use-create-conversation-view";
import { useTeamRuntime } from "../../../team/runtime";
import {
  conversationHref,
  type ListContext,
} from "../../team-conversations/conversation-list";
import { SaveViewDialog } from "../../team-conversations/save-view-dialog";

export interface SaveCurrentViewProps {
  workspaceId: string;
  conversationId: string;
  /** The list beside the conversation. */
  context: ListContext;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** "Save as view…" beside an open conversation: the saved view becomes the list beside it. */
export function SaveCurrentView(props: SaveCurrentViewProps) {
  const team = useTeamRuntime();
  const navigate = useNavigate();
  const create = useCreateConversationView(team.viewer);
  return (
    <SaveViewDialog
      workspaceId={props.workspaceId}
      context={props.context}
      open={props.open}
      onOpenChange={props.onOpenChange}
      create={create}
      onSaved={(id) => {
        props.onOpenChange(false);
        void navigate({
          href: conversationHref(props.workspaceId, props.conversationId, {
            ...props.context,
            savedView: id,
          }),
        });
      }}
    />
  );
}
