import { useQuery } from "@tanstack/react-query";
import type { Viewer } from "../../core/types";
import {
  getOfficeHoursQuery,
  type GetOfficeHoursRequest,
} from "../../api/team/get-office-hours";
export function useGetOfficeHours(
  input: GetOfficeHoursRequest,
  viewer: Viewer,
) {
  return useQuery({
    ...getOfficeHoursQuery(input, viewer),
    enabled: Boolean(input.param.workspaceId),
  });
}
