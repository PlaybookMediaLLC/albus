import { Icon } from "./Icon.js";
import { safeMediaUrl } from "./media.js";
import type { WidgetPerson } from "./types.js";
import { useT } from "./i18n/useT.js";

export function Avatar({ name, avatarUrl, verified }: WidgetPerson) {
  const t = useT();
  const url = safeMediaUrl(avatarUrl);
  return (
    <span className="qb-avatar" title={name}>
      {url ? (
        <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span aria-hidden="true">{name.slice(0, 1)}</span>
      )}
      {verified && (
        <span className="qb-verified" aria-label={t("Team member")}>
          <Icon name="check" />
        </span>
      )}
    </span>
  );
}
