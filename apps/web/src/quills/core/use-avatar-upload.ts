import { useState } from "react";
import { useCreatePortalUpload } from "../hooks/files/use-create-portal-upload";
import { usePreparePortalUpload } from "../hooks/files/use-prepare-portal-upload";
import { useDeleteCustomerAvatar } from "../hooks/portal/use-delete-customer-avatar";
import { useSaveCustomerAvatar } from "../hooks/portal/use-save-customer-avatar";
import { prepareAvatarImage } from "../ui/upstream";
import { avatarFile } from "./avatar-file";
import type { Viewer } from "./types";
import { uploadObject } from "./upload-object";

/**
 * The portal customer's profile picture: crop and shrink the chosen image to a 256 px square in
 * the browser, upload it to the caller's own key, then save it. `failed` is set when any step fails.
 */
export function useAvatarUpload(workspaceId: string, viewer: Viewer) {
  const prepare = usePreparePortalUpload(viewer);
  const sign = useCreatePortalUpload(viewer);
  const save = useSaveCustomerAvatar(viewer);
  const remove = useDeleteCustomerAvatar(viewer);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const param = { workspace: workspaceId };
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setFailed(false);
    try {
      await work();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };
  return {
    busy,
    failed,
    upload: (chosen: File) =>
      run(async () => {
        const file = avatarFile(await prepareAvatarImage(chosen));
        await prepare.mutateAsync({ param });
        const upload = await sign.mutateAsync({
          param,
          json: {
            purpose: "customer_avatar",
            filename: file.name,
            contentType: file.type,
            size: file.size,
          },
        });
        await uploadObject(file, upload);
        await save.mutateAsync({
          param,
          json: { key: upload.key, contentType: file.type, size: file.size },
        });
      }),
    remove: () => run(() => remove.mutateAsync({ param })),
  };
}
