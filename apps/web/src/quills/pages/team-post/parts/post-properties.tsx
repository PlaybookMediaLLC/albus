import type { GetPostResponse } from "../../../api/team/get-post";
import { PostCustomFields } from "./post-custom-fields";
import { PostDemand } from "./post-demand";
import { PostLinks } from "./post-links";
import { PostMerge } from "./post-merge";
import { PostPageContext } from "./post-page-context";
import { PostScore } from "./post-score";

export interface PostPropertiesProps {
  workspaceId: string;
  post: GetPostResponse;
  onScoreSaved: () => void;
}

/** The right panel of a request: custom fields, demand, RICE score, links, merges and the page it came from. Each section loads its own data. */
export function PostProperties(props: PostPropertiesProps) {
  const { workspaceId, post } = props;
  return (
    <div className="grid gap-3 *:first:border-t-0">
      <PostCustomFields workspaceId={workspaceId} post={post} />
      <PostDemand workspaceId={workspaceId} postId={post.id} />
      <PostScore
        workspaceId={workspaceId}
        post={post}
        onSaved={props.onScoreSaved}
      />
      <PostLinks workspaceId={workspaceId} post={post} />
      <PostMerge workspaceId={workspaceId} post={post} />
      <PostPageContext post={post} />
    </div>
  );
}
