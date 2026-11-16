import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import { getFileQuery, type GetFileRequest } from "../../api/team/get-file";
export function useGetFile(input: GetFileRequest, viewer: Viewer) {
  return useQuery({
    ...getFileQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId && input.param.fileId),
  });
}
