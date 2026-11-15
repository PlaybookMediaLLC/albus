import type { ListTagsResponse } from "../../../api/team/list-tags";
import { problemOf } from "../../../core/problem-of";
import { useCreateTag } from "../../../hooks/team/use-create-tag";
import { useDeleteTag } from "../../../hooks/team/use-delete-tag";
import { useUpdateTag } from "../../../hooks/team/use-update-tag";
import { useTeamRuntime } from "../../../team/runtime";
import { TagList } from "../../../ui/tag-list";

export interface TagsSectionProps {
  workspaceId: string;
  tags: ListTagsResponse["tags"];
}

const copy = {
  title: "settings-product.tags.title",
  create: "settings-product.tags.new",
  createTitle: "settings-product.tags.createTitle",
  createText: "settings-product.tags.createText",
  rename: "settings-product.tags.rename",
  renameText: "settings-product.tags.renameText",
  name: "settings-product.tags.name",
  placeholder: "settings-product.tags.placeholder",
  taken: "settings-product.tags.taken",
  actions: "settings-product.tags.actions",
  delete: "settings-product.tags.delete",
  deleteTitle: "settings-product.tags.deleteTitle",
  deleteText: "settings-product.tags.deleteText",
  deleteFailed: "settings-product.tags.deleteFailed",
  emptyTitle: "settings-product.tags.emptyTitle",
  emptyText: "settings-product.tags.emptyText",
};

/** The post tags of the workspace with create, rename and delete. */
export function TagsSection({ workspaceId, tags }: TagsSectionProps) {
  const team = useTeamRuntime();
  const create = useCreateTag(team.viewer);
  const update = useUpdateTag(team.viewer);
  const remove = useDeleteTag(team.viewer);
  const param = (tagId: string) => ({ workspaceId, tagId });
  return (
    <TagList
      items={tags}
      copy={copy}
      maxLength={50}
      canManage={team.permissions.manageSettings}
      onCreate={(name) =>
        problemOf(
          create.mutateAsync({ param: { workspaceId }, json: { name } }),
        )
      }
      onRename={(id, name) =>
        problemOf(update.mutateAsync({ param: param(id), json: { name } }))
      }
      onDelete={async (id) => {
        await remove.mutateAsync({ param: param(id) });
      }}
    />
  );
}
