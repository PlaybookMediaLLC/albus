import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getPortalWidgetLinkQuery,
  type GetPortalWidgetLinkRequest,
} from "../../api/portal/get-portal-widget-link";
export function useGetPortalWidgetLink(
  input: GetPortalWidgetLinkRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getPortalWidgetLinkQuery(input, viewer),
    enabled: Boolean(input.param.workspace),
  });
}
