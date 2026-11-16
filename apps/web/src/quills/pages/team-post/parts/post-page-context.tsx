import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { GetPostResponse } from "../../../api/team/get-post";
import { PageContext } from "../../../ui/page-context";

export interface PostPageContextProps {
  post: GetPostResponse;
}

/** The page and the browser that a widget post came from. Nothing for other posts. */
export function PostPageContext({ post }: PostPageContextProps) {
  const { t } = useTranslation("quills");
  const heading = useId();
  const context = post.widgetMetadata;
  if (!context?.pageUrl && !context?.browser) return null;
  return (
    <section aria-labelledby={heading} className="grid gap-2 py-3 text-sm">
      <h3 id={heading} className="text-xs font-medium text-muted-foreground">
        {t("core.pageContext.title")}
      </h3>
      <PageContext context={context} />
    </section>
  );
}
