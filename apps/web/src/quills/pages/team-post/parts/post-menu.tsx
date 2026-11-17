import {
  Ellipsis,
  ExternalLink,
  Link2,
  Megaphone,
  Share2,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { portalHref } from "../../../core/portal-href";
import { SendUpdateDialog } from "../../../team/post-update/send-update-dialog";
import { useTeamRuntime } from "../../../team/runtime";
import { IconButton } from "../../../ui/inbox/icon-button";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
  toast,
} from "../../../ui/upstream";
import { DeletePostDialog } from "./delete-post-dialog";

export interface PostMenuProps {
  workspaceId: string;
  postId: string;
  title: string;
  onDeleted: () => void;
}

/** The kebab menu of a request: visit, share or copy its portal page, send an update, and delete it. */
export function PostMenu(props: PostMenuProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const [confirm, setConfirm] = useState(false);
  const [update, setUpdate] = useState(false);
  const page = () =>
    new URL(
      portalHref(
        props.workspaceId,
        `posts/${encodeURIComponent(props.postId)}`,
      ),
      window.location.origin,
    ).href;
  const copy = () =>
    void (
      navigator.clipboard
        ? navigator.clipboard.writeText(page())
        : Promise.reject(new Error("No clipboard"))
    ).then(
      () => toast.success(t("team-post.linkCopied")),
      () => toast.error(t("core.problem.failed")),
    );
  return (
    <>
      <Menu>
        <MenuTrigger render={<IconButton label={t("team-post.more")} />}>
          <Ellipsis aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup align="end">
          <MenuItem onClick={() => window.open(page(), "_blank", "noopener")}>
            <ExternalLink aria-hidden="true" />
            {t("team-post.visit")}
          </MenuItem>
          {"share" in navigator ? (
            <MenuItem
              onClick={() =>
                void navigator
                  .share({ title: props.title, url: page() })
                  .catch(() => undefined)
              }
            >
              <Share2 aria-hidden="true" />
              {t("team-post.share")}
            </MenuItem>
          ) : null}
          <MenuItem onClick={copy}>
            <Link2 aria-hidden="true" />
            {t("team-post.copyLink")}
          </MenuItem>
          {team.permissions.update && team.permissions.manageSettings ? (
            <MenuItem onClick={() => setUpdate(true)}>
              <Megaphone aria-hidden="true" />
              {t("team-post.sendUpdate")}
            </MenuItem>
          ) : null}
          {team.permissions.delete ? (
            <>
              <MenuSeparator />
              <MenuItem variant="destructive" onClick={() => setConfirm(true)}>
                <Trash2 aria-hidden="true" />
                {t("team-post.delete")}
              </MenuItem>
            </>
          ) : null}
        </MenuPopup>
      </Menu>
      {update ? (
        <SendUpdateDialog
          workspaceId={props.workspaceId}
          post={{ id: props.postId, title: props.title }}
          onClose={() => setUpdate(false)}
        />
      ) : null}
      {confirm ? (
        <DeletePostDialog
          workspaceId={props.workspaceId}
          postId={props.postId}
          onClose={() => setConfirm(false)}
          onDeleted={props.onDeleted}
        />
      ) : null}
    </>
  );
}
