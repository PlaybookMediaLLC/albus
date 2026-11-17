import { CreateTaskDialog } from "../../../team/post-tasks/create-task-dialog";
import { LinkTaskDialog } from "../../../team/post-tasks/link-task-dialog";
import type { RoadmapPost } from "../roadmap-moves";

export interface RoadmapTaskDialogProps {
  workspaceId: string;
  /** The card and the action that its menu chose; null shows nothing. */
  target: { post: RoadmapPost; kind: "create" | "link" } | null;
  onClose: () => void;
}

/** The Create task or Link existing task dialog of a roadmap card (RFC 0005, phase 1). */
export function RoadmapTaskDialog({
  workspaceId,
  target,
  onClose,
}: RoadmapTaskDialogProps) {
  if (!target) return null;
  return target.kind === "create" ? (
    <CreateTaskDialog
      workspaceId={workspaceId}
      post={target.post}
      onClose={onClose}
    />
  ) : (
    <LinkTaskDialog
      workspaceId={workspaceId}
      postId={target.post.id}
      onClose={onClose}
    />
  );
}
