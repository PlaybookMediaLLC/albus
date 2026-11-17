import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import { formatFieldValue } from "../../../core/custom-field-value";
import { useGetBoardSettings } from "../../../hooks/team/use-get-board-settings";
import { useTeamRuntime } from "../../../team/runtime";
import { PanelSection } from "../../../ui/inbox/panel-section";
import { PropertyRow } from "../../../ui/inbox/property-row";

export interface PostCustomFieldsProps {
  workspaceId: string;
  post: GetPostResponse;
}

/** The post's custom field values, internal fields marked. Nothing when the post has none. */
export function PostCustomFields({ workspaceId, post }: PostCustomFieldsProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const items = post.customFields;
  // The board's fields give each value its label; until they load, the key shows.
  const settings = useGetBoardSettings(
    {
      param: {
        workspaceId: items.length ? workspaceId : "",
        boardId: post.boardId,
      },
    },
    team.viewer,
  );
  if (!items.length) return null;
  const fields = settings.data?.customFields ?? [];
  const labels = { yes: t("board-fields.yes"), no: t("board-fields.no") };
  return (
    <PanelSection title={t("board-fields.title")}>
      {items.map((item) => {
        const field = fields.find((f) => f.key === item.key);
        const label = field?.label ?? item.key;
        return (
          <PropertyRow
            key={item.key}
            label={
              field?.internal
                ? `${label} (${t("board-fields.internal")})`
                : label
            }
          >
            <span dir="auto">
              {formatFieldValue(item, labels, i18n.language)}
            </span>
          </PropertyRow>
        );
      })}
    </PanelSection>
  );
}
