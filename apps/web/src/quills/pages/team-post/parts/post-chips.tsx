import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import type { ListBoardsResponse } from "../../../api/team/list-boards";
import { useSetPostBoard } from "../../../hooks/team/use-set-post-board";
import { useTeamRuntime } from "../../../team/runtime";
import { BoardDot } from "../../../ui/inbox/board-dot";
import {
  Button,
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
  toast,
} from "../../../ui/upstream";
import { PostAi } from "./post-ai";
import { PostTags } from "./post-tags";
import { PostVisibility } from "./post-visibility";

export interface PostChipsProps {
  workspaceId: string;
  post: GetPostResponse;
  boards: ListBoardsResponse["items"];
}

const chip = "rounded-full before:rounded-full";

/** The chip row under a request: its board, its visibility on the board, its tags and the AI chip. */
export function PostChips({ workspaceId, post, boards }: PostChipsProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const board = useSetPostBoard(team.viewer);
  const param = { workspaceId, postId: post.id };
  // A pending change shows at once; the refreshed post confirms it.
  const boardId = board.isPending ? board.variables.json.boardId : post.boardId;
  const boardName = boards.find((item) => item.id === boardId)?.name ?? "";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Menu>
        <MenuTrigger
          render={
            <Button
              variant="secondary"
              size="sm"
              className={chip}
              disabled={!team.permissions.update || board.isPending}
              aria-label={t("team-post.boardIs", { board: boardName })}
            />
          }
        >
          <BoardDot boardId={boardId} />
          {boardName}
        </MenuTrigger>
        <MenuPopup align="start">
          <MenuRadioGroup
            value={boardId}
            onValueChange={(value) =>
              board.mutate(
                { param, json: { boardId: String(value) } },
                { onError: () => toast.error(t("core.problem.failed")) },
              )
            }
          >
            {boards.map((item) => (
              <MenuRadioItem key={item.id} value={item.id}>
                <span className="flex items-center gap-2">
                  <BoardDot boardId={item.id} />
                  {item.name}
                </span>
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuPopup>
      </Menu>
      <PostVisibility workspaceId={workspaceId} post={post} className={chip} />
      <PostTags workspaceId={workspaceId} post={post} />
      <PostAi
        key={post.id}
        workspaceId={workspaceId}
        postId={post.id}
        className={chip}
      />
    </div>
  );
}
