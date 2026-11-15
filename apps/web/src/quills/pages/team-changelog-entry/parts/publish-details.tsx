import { ChevronDown, Link2, Tag, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GetChangelogEntryResponse } from "../../../api/team/get-changelog-entry";
import { useListChangelogCategories } from "../../../hooks/team/use-list-changelog-categories";
import { useSearchShippedPosts } from "../../../hooks/team/use-search-shipped-posts";
import { useUpdateChangelogEntry } from "../../../hooks/team/use-update-changelog-entry";
import { useTeamRuntime } from "../../../team/runtime";
import {
  Button,
  Menu,
  MenuCheckboxItem,
  MenuPopup,
  MenuTrigger,
  Switch,
  toast,
} from "../../../ui/upstream";
import { DetailRow as Row } from "./detail-row";

export interface PublishDetailsProps {
  workspaceId: string;
  entry: GetChangelogEntryResponse;
  notify: boolean;
  onNotifyChange: (next: boolean) => void;
}

/** The Details card of the publish popover: author, tags, linked requests and notify. */
export function PublishDetails({
  workspaceId,
  entry,
  notify,
  onNotifyChange,
}: PublishDetailsProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId };
  const categories = useListChangelogCategories(
    { param, query: { offset: "0", limit: "100" } },
    team.viewer,
  );
  // ponytail: the 20 shipped posts with the most votes, no search field; add one when teams need older posts.
  const shipped = useSearchShippedPosts({ param, query: {} }, team.viewer);
  const update = useUpdateChangelogEntry(team.viewer);
  const save = (json: { categoryIds?: string[]; linkedPostIds?: string[] }) =>
    update
      .mutateAsync({ param: { workspaceId, entryId: entry.id }, json })
      .catch(() => toast.error(t("team-changelog.editor.failed")));
  const toggle = (ids: string[], id: string, on: boolean) =>
    on ? [...ids, id] : ids.filter((value) => value !== id);
  const tagIds = entry.categories.map((item) => item.id);
  const linkedIds = entry.linkedPosts.map((item) => item.id);
  const posts = [
    ...entry.linkedPosts,
    ...(shipped.data?.posts ?? []).filter(
      (post) => !linkedIds.includes(post.id),
    ),
  ];
  const disabled = !team.permissions.update || update.isPending;
  const picker = (label: string, chosen: string[], names: string[]) => (
    <MenuTrigger
      disabled={disabled}
      render={
        <Button
          variant="ghost"
          size="sm"
          className="max-w-48 text-muted-foreground"
        />
      }
    >
      <span className="truncate">
        {chosen.length ? names.join(", ") : label}
      </span>
      <ChevronDown aria-hidden="true" />
    </MenuTrigger>
  );
  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      <Row
        icon={<User aria-hidden="true" className="size-4" />}
        label={t("team-changelog.editor.author")}
      >
        <span className="truncate">
          {entry.author?.name ?? t("team-changelog.editor.noAuthor")}
        </span>
      </Row>
      <Row
        icon={<Tag aria-hidden="true" className="size-4" />}
        label={t("team-changelog.editor.tags")}
      >
        <Menu>
          {picker(
            t("team-changelog.editor.addTags"),
            tagIds,
            entry.categories.map((item) => item.name),
          )}
          <MenuPopup align="end">
            {(categories.data?.categories ?? []).map((item) => (
              <MenuCheckboxItem
                key={item.id}
                checked={tagIds.includes(item.id)}
                onCheckedChange={(on) =>
                  void save({ categoryIds: toggle(tagIds, item.id, on) })
                }
              >
                {item.name}
              </MenuCheckboxItem>
            ))}
          </MenuPopup>
        </Menu>
      </Row>
      <Row
        icon={<Link2 aria-hidden="true" className="size-4" />}
        label={t("team-changelog.editor.linked")}
      >
        <Menu>
          {picker(
            t("team-changelog.editor.addLinked"),
            linkedIds,
            entry.linkedPosts.map((item) => item.title),
          )}
          <MenuPopup align="end" className="max-w-80">
            {posts.map((post) => (
              <MenuCheckboxItem
                key={post.id}
                checked={linkedIds.includes(post.id)}
                onCheckedChange={(on) =>
                  void save({ linkedPostIds: toggle(linkedIds, post.id, on) })
                }
              >
                <span className="truncate">{post.title}</span>
              </MenuCheckboxItem>
            ))}
          </MenuPopup>
        </Menu>
      </Row>
      <Row icon={null} label={t("team-changelog.editor.notify")}>
        <Switch
          aria-label={t("team-changelog.editor.notify")}
          checked={notify}
          onCheckedChange={onNotifyChange}
          disabled={!team.permissions.update}
        />
      </Row>
    </div>
  );
}
