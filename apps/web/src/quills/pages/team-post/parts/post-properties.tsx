import type { GetPostResponse } from "../../../api/team/get-post";
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

/** The right panel of a request: demand, RICE score, links, merges and the page it came from. Each section loads its own data. */
export function PostProperties(props: PostPropertiesProps) {
  const { workspaceId, post } = props;
  return (
    <div className="grid divide-y divide-border">
      <PostDemand workspaceId={workspaceId} postId={post.id} />
      <PostScore
        workspaceId={workspaceId}
        post={post}
        onSaved={props.onScoreSaved}
      />
      <PostLinks workspaceId={workspaceId} postId={post.id} />
      <PostMerge workspaceId={workspaceId} post={post} />
      <PostPageContext post={post} />
    </div>
  );
}
