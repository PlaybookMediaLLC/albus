import { feedbackStages } from "../../../core/feedback-stages";
import type { Viewer } from "../../../core/types";
import { useFindPortalSimilarPosts } from "../../../hooks/feedback/use-find-portal-similar-posts";
import { useListPortalStatuses } from "../../../hooks/feedback/use-list-portal-statuses";
import { SimilarPosts } from "../../../ui/post/similar-posts";

export interface RelatedRequestsProps {
  workspaceId: string;
  viewer: Viewer;
  postId: string;
  title: string;
}

/** Requests like this one, so that voters gather on one post instead of on duplicates. */
export function RelatedRequests(props: RelatedRequestsProps) {
  const title = props.title.trim();
  const related = useFindPortalSimilarPosts(
    {
      param: { workspace: title.length >= 3 ? props.workspaceId : "" },
      query: { title, limit: "5" },
    },
    props.viewer,
  );
  const statuses = useListPortalStatuses(
    {
      param: { workspace: related.data?.items.length ? props.workspaceId : "" },
    },
    props.viewer,
  );
  return (
    <SimilarPosts
      workspaceId={props.workspaceId}
      titleKey="post.related"
      stages={feedbackStages(statuses.data?.items ?? [])}
      posts={
        related.data?.items
          .filter((item) => item.id !== props.postId)
          .slice(0, 3) ?? []
      }
    />
  );
}
