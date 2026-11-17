import { EyeOff, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import { useApprovePost } from "../../../hooks/team/use-approve-post";
import { useSetPostVisibility } from "../../../hooks/team/use-set-post-visibility";
import { useTeamRuntime } from "../../../team/runtime";
import {
  Button,
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
  toast,
} from "../../../ui/upstream";

export interface PostVisibilityProps {
  workspaceId: string;
  post: GetPostResponse;
  /** The chip classes of the chip row. */
  className: string;
}

/**
 * The visibility chip of a request: shown on its board (published) or hidden (archived).
 * A request that waits for review is shown by approving it. Other states are read-only.
 */
export function PostVisibility({
  workspaceId,
  post,
  className,
}: PostVisibilityProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const set = useSetPostVisibility(team.viewer);
  const approve = useApprovePost(team.viewer);
  const param = { workspaceId, postId: post.id };
  const failed = { onError: () => toast.error(t("core.problem.failed")) };
  const state = set.isPending
    ? set.variables.json.visible
      ? "published"
      : "archived"
    : approve.isPending
      ? "published"
      : post.moderationState;
  const shown = state === "published";
  const editable = ["published", "archived", "pending"].includes(state);
  const Icon = shown ? Globe : EyeOff;
  const choose = (value: string) => {
    if (value === "shown" && state === "pending")
      approve.mutate({ param }, failed);
    else set.mutate({ param, json: { visible: value === "shown" } }, failed);
  };
  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="secondary"
            size="sm"
            className={className}
            disabled={
              !team.permissions.update ||
              !editable ||
              set.isPending ||
              approve.isPending
            }
            aria-label={t("team-post.visibilityIs", {
              state: shown ? t("team-post.onBoard") : t("team-post.notOnBoard"),
            })}
          />
        }
      >
        <Icon aria-hidden="true" />
        {shown ? t("team-post.onBoard") : t("team-post.notOnBoard")}
      </MenuTrigger>
      <MenuPopup align="start">
        <MenuRadioGroup
          value={shown ? "shown" : state === "archived" ? "hidden" : ""}
          onValueChange={(value) => choose(String(value))}
        >
          <MenuRadioItem value="shown">
            <span className="flex items-center gap-2">
              <Globe aria-hidden="true" className="size-4" />
              {t("team-post.shownOnBoard")}
            </span>
          </MenuRadioItem>
          <MenuRadioItem value="hidden" disabled={state === "pending"}>
            <span className="flex items-center gap-2">
              <EyeOff aria-hidden="true" className="size-4" />
              {t("team-post.hiddenFromBoard")}
            </span>
          </MenuRadioItem>
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}
