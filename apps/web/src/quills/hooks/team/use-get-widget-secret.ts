import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getWidgetSecretQuery,
  type GetWidgetSecretRequest,
} from "../../api/team/get-widget-secret";
export function useGetWidgetSecret(
  input: GetWidgetSecretRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getWidgetSecretQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
