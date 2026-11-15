import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  listUserAttributesQuery,
  type ListUserAttributesRequest,
} from "../../api/team/list-user-attributes";
export function useListUserAttributes(
  input: ListUserAttributesRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...listUserAttributesQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
