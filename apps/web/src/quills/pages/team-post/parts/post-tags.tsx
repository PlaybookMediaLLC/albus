import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import type { PortalProblem } from "../../../core/types";
import { useCreateTag } from "../../../hooks/team/use-create-tag";
import { useListTags } from "../../../hooks/team/use-list-tags";
import { useSetPostTags } from "../../../hooks/team/use-set-post-tags";
import { useTeamRuntime } from "../../../team/runtime";
import { IconButton } from "../../../ui/inbox/icon-button";
import { NameDialog } from "../../../ui/name-dialog";
import {
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
  toast,
} from "../../../ui/upstream";

export interface PostTagsProps {
  workspaceId: string;
  post: GetPostResponse;
}

/**
 * The tag chips of a request, each with a remove button, and the "+" menu that adds a tag or
 * creates one. Creating a tag needs the settings permission.
 */
export function PostTags({ workspaceId, post }: PostTagsProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  // ponytail: the first 100 tags (the API maximum), loaded when the tag menu opens.
  const tags = useListTags(
    {
      param: { workspaceId: open ? workspaceId : "" },
      query: { limit: "100" },
    },
    team.viewer,
  );
  const setTags = useSetPostTags(team.viewer);
  const createTag = useCreateTag(team.viewer);
  const locked = !team.permissions.update;
  // A pending change shows at once; the refreshed post confirms it.
  const tagIds = setTags.isPending
    ? setTags.variables.json.tagIds
    : post.tags.map((tag) => tag.id);
  const save = (next: string[]) =>
    setTags.mutate(
      { param: { workspaceId, postId: post.id }, json: { tagIds: next } },
      { onError: () => toast.error(t("core.problem.failed")) },
    );
  const toggle = (id: string) =>
    save(
      tagIds.includes(id)
        ? tagIds.filter((tag) => tag !== id)
        : [...tagIds, id],
    );
  return (
    <>
      {post.tags
        .filter((tag) => tagIds.includes(tag.id))
        .map((tag) => (
          <span
            key={tag.id}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary px-2.5 text-base font-medium text-secondary-foreground has-[button]:pe-1 sm:h-7 sm:text-sm"
          >
            {tag.name}
            {locked ? null : (
              <button
                type="button"
                className="relative touch-hitbox rounded-full p-0.5 text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-64"
                aria-label={t("team-post.removeTag", { tag: tag.name })}
                disabled={setTags.isPending}
                onClick={() => toggle(tag.id)}
              >
                <X aria-hidden="true" className="size-3" />
              </button>
            )}
          </span>
        ))}
      {locked ? null : (
        <Menu open={open} onOpenChange={setOpen}>
          <MenuTrigger
            render={
              <IconButton
                variant="secondary"
                className="rounded-full"
                label={t("team-post.editTags")}
                disabled={setTags.isPending}
              />
            }
          >
            <Plus aria-hidden="true" />
          </MenuTrigger>
          <MenuPopup align="start">
            {tags.data && !tags.data.tags.length ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                {t("team-post.noTags")}
              </p>
            ) : null}
            {tags.data?.tags.map((tag) => (
              <MenuCheckboxItem
                key={tag.id}
                checked={tagIds.includes(tag.id)}
                onCheckedChange={() => toggle(tag.id)}
              >
                {tag.name}
              </MenuCheckboxItem>
            ))}
            {team.permissions.manageSettings ? (
              <>
                <MenuSeparator />
                <MenuItem onClick={() => setCreating(true)}>
                  <Plus aria-hidden="true" />
                  {t("team-post.createTag")}
                </MenuItem>
              </>
            ) : null}
          </MenuPopup>
        </Menu>
      )}
      <NameDialog
        open={creating}
        onOpenChange={setCreating}
        title={t("team-post.createTagTitle")}
        description={t("team-post.createTagText")}
        label={t("team-post.tagName")}
        maxLength={50}
        submitKey="team-post.createTagSubmit"
        taken={t("team-post.tagTaken")}
        onSubmit={async (name): Promise<PortalProblem | void> => {
          try {
            const tag = await createTag.mutateAsync({
              param: { workspaceId },
              json: { name },
            });
            setCreating(false);
            save([...tagIds, tag.id]);
          } catch (error) {
            return error as PortalProblem;
          }
        }}
      />
    </>
  );
}
