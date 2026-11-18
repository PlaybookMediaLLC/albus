import { useTranslation } from "react-i18next";
import { useTeamRuntime } from "../../../team/runtime";
import { EmptyState } from "../../../ui/empty-state";
import { RequestsArt } from "../../../ui/illustrations/requests-art";
import { SearchArt } from "../../../ui/illustrations/search-art";
import { Button } from "../../../ui/upstream";
import { isFiltered, noFilters, type PostSearch } from "../post-search";

export interface RequestsEmptyProps {
  search: PostSearch;
  onSearch: (patch: Partial<PostSearch>) => void;
}

/** The empty request list: the first-run state, or no matches with a way to clear the filters. */
export function RequestsEmpty({ search, onSearch }: RequestsEmptyProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  if (isFiltered(search))
    return (
      <EmptyState
        art={<SearchArt />}
        title={t("empty.filtered.title")}
        description={t("empty.filtered.body")}
        hint={{ keys: ["F"], label: t("empty.filtered.hint") }}
        actions={
          <Button variant="outline" onClick={() => onSearch(noFilters)}>
            {t("empty.filtered.clear")}
          </Button>
        }
      />
    );
  return (
    <EmptyState
      art={<RequestsArt />}
      title={t("empty.requests.title")}
      description={t("empty.requests.body")}
      actions={
        team.permissions.create ? (
          <Button onClick={() => onSearch({ new: true })}>
            {t("team-posts.newRequest")}
          </Button>
        ) : null
      }
    />
  );
}
