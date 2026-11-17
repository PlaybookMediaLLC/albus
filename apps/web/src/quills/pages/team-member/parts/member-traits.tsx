import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useListUserAttributes } from "../../../hooks/team/use-list-user-attributes";
import { useUpdateUser } from "../../../hooks/team/use-update-user";
import { useTeamRuntime } from "../../../team/runtime";
import { RowActionsMenu, toast } from "../../../ui/upstream";
import { traitText } from "../trait-value";
import { TraitDialog } from "./trait-dialog";

export interface MemberTraitsProps {
  workspaceId: string;
  member: {
    principalId: string;
    attributes: ReadonlyArray<{
      key: string;
      value: string | number | boolean;
    }>;
  };
}

/** The traits of a member: one "label: value" row for each attribute, with add and remove. */
export function MemberTraits({ workspaceId, member }: MemberTraitsProps) {
  const { t, i18n } = useTranslation("quills");
  const team = useTeamRuntime();
  const definitions = useListUserAttributes(
    { param: { workspaceId } },
    team.viewer,
  );
  const update = useUpdateUser(team.viewer);
  const defined = definitions.data?.attributes ?? [];
  const save = (attributes: Record<string, string | number | boolean | null>) =>
    update
      .mutateAsync({
        param: { workspaceId, principalId: member.principalId },
        json: { attributes },
      })
      .then(() => toast.success(t("team-members.traitSaved")))
      .catch(() => {
        toast.error(t("team-members.failed"));
        throw new Error("not saved");
      });
  const text = (key: string, value: string | number | boolean) => {
    if (typeof value === "boolean")
      return t(value ? "team-members.yes" : "team-members.no");
    const definition = defined.find((item) => item.key === key);
    return traitText(
      value,
      definition?.type,
      i18n.language,
      definition?.currencyCode,
    );
  };
  return (
    <section aria-labelledby="member-traits" className="grid gap-2">
      <div className="flex min-h-8 items-center justify-between">
        <h2 id="member-traits" className="text-sm font-medium">
          {t("team-members.traits")}
        </h2>
        {defined.length > 0 && team.permissions.update ? (
          <TraitDialog definitions={defined} onSave={save} />
        ) : null}
      </div>
      {member.attributes.length ? (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card text-sm">
          {member.attributes.map(({ key, value }) => (
            <li key={key} className="flex items-center gap-2 py-1 ps-3 pe-1">
              <span className="min-w-0 flex-1 truncate">
                <span className="text-muted-foreground">
                  {t("team-members.traitLabel", {
                    label:
                      defined.find((item) => item.key === key)?.label ?? key,
                  })}
                </span>{" "}
                {text(key, value)}
              </span>
              {team.permissions.update ? (
                <RowActionsMenu
                  label={t("team-members.traitActions", { key })}
                  actions={[
                    {
                      id: "remove",
                      label: t("team-members.traitRemove"),
                      icon: Trash2,
                      destructive: true,
                      onSelect: () =>
                        void save({ [key]: null }).catch(() => undefined),
                    },
                  ]}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("team-members.noTraits")}
        </p>
      )}
    </section>
  );
}
