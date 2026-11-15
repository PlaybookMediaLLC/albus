import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../core/types";
import { NameDialog } from "./name-dialog";
import {
  Button,
  ConfirmDialog,
  RowActionsMenu,
  SettingsCard,
  SettingsEmpty,
  SettingsRow,
  SettingsSection,
  toast,
  type RowAction,
} from "./upstream";

interface TagListItem {
  id: string;
  name: string;
  /** The color of the item, such as "#3b82f6". The tag icon takes it. */
  color: string;
  /** A muted text after the name, such as an open count. */
  detail?: string;
}

/** Translation keys. `actions`, `deleteTitle` and `deleted` get the item name as `name`. */
interface TagListCopy {
  title: string;
  create: string;
  createTitle: string;
  createText: string;
  rename: string;
  renameText: string;
  name: string;
  placeholder: string;
  taken: string;
  actions: string;
  delete: string;
  deleteTitle: string;
  deleteText: string;
  deleteFailed: string;
  emptyTitle: string;
  emptyText: string;
}

export interface TagListProps {
  items: readonly TagListItem[];
  copy: TagListCopy;
  maxLength: number;
  /** False hides the create button and the row menus. */
  canManage: boolean;
  onCreate: (name: string) => Promise<PortalProblem | void>;
  onRename: (id: string, name: string) => Promise<PortalProblem | void>;
  onDelete: (id: string) => Promise<void>;
  /** More menu actions of one item. They show before the delete action. */
  actions?: (item: TagListItem) => RowAction[];
}

/** A settings section that lists named, colored items with create, rename and delete. */
export function TagList(props: TagListProps) {
  const { t } = useTranslation("quills");
  const { copy } = props;
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<TagListItem | null>(null);
  const [deleting, setDeleting] = useState<TagListItem | null>(null);
  const [pending, setPending] = useState(false);
  const create = props.canManage ? (
    <Button
      variant="secondary"
      size="sm"
      className="rounded-full"
      onClick={() => setCreating(true)}
    >
      <Plus aria-hidden="true" />
      {t(copy.create)}
    </Button>
  ) : null;
  const remove = async (item: TagListItem) => {
    setPending(true);
    try {
      await props.onDelete(item.id);
      setDeleting(null);
    } catch {
      toast.error(t(copy.deleteFailed));
    } finally {
      setPending(false);
    }
  };
  return (
    <SettingsSection title={t(copy.title)} action={create}>
      <SettingsCard>
        {props.items.length ? null : (
          <SettingsEmpty
            icon={<Tag />}
            title={t(copy.emptyTitle)}
            description={t(copy.emptyText)}
          />
        )}
        {props.items.map((item) => (
          <SettingsRow
            key={item.id}
            title={
              <span className="flex min-w-0 items-center gap-3">
                <Tag
                  aria-hidden="true"
                  color={item.color}
                  className="size-4 shrink-0"
                />
                <span className="truncate font-normal">{item.name}</span>
                {item.detail ? (
                  <span className="font-normal text-muted-foreground text-xs">
                    {item.detail}
                  </span>
                ) : null}
              </span>
            }
          >
            {props.canManage ? (
              <RowActionsMenu
                label={t(copy.actions, { name: item.name })}
                actions={[
                  {
                    id: "rename",
                    label: t(copy.rename),
                    icon: Pencil,
                    onSelect: () => setRenaming(item),
                  },
                  ...(props.actions?.(item) ?? []),
                  {
                    id: "delete",
                    label: t(copy.delete),
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => setDeleting(item),
                  },
                ]}
              />
            ) : null}
          </SettingsRow>
        ))}
      </SettingsCard>
      <NameDialog
        open={creating}
        onOpenChange={setCreating}
        title={t(copy.createTitle)}
        description={t(copy.createText)}
        label={t(copy.name)}
        placeholder={t(copy.placeholder)}
        maxLength={props.maxLength}
        taken={t(copy.taken)}
        submitKey="settings-product.dialog.create"
        onSubmit={async (name) => {
          const problem = await props.onCreate(name);
          if (!problem) setCreating(false);
          return problem;
        }}
      />
      <NameDialog
        key={renaming?.id}
        open={renaming !== null}
        onOpenChange={(open) => !open && setRenaming(null)}
        title={t(copy.rename)}
        description={t(copy.renameText)}
        label={t(copy.name)}
        maxLength={props.maxLength}
        defaultValue={renaming?.name}
        taken={t(copy.taken)}
        submitKey="settings-product.dialog.save"
        onSubmit={async (name) => {
          const problem = renaming
            ? await props.onRename(renaming.id, name)
            : undefined;
          if (!problem) setRenaming(null);
          return problem;
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t(copy.deleteTitle, { name: deleting?.name })}
        description={t(copy.deleteText)}
        confirmLabel={t(copy.delete)}
        pending={pending}
        onConfirm={() => deleting && void remove(deleting)}
      />
    </SettingsSection>
  );
}
