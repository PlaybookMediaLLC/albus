import { createElement, type ComponentProps } from "react";
import { PostUpdateEmail } from "../../src/quills/templates/post-update";

export default function Preview(props: ComponentProps<typeof PostUpdateEmail>) {
  return createElement(PostUpdateEmail, props);
}

Preview.PreviewProps = {
  organizationName: "Acme",
  unsubscribeUrl: "https://app.quills.io/settings/notifications/unsubscribe",
  postTitle: "Export the monthly report to CSV",
  postUrl: "https://app.quills.io/posts/export-to-csv",
  body: "CSV export is live for every plan.\n\nOpen any report and choose Export.",
} satisfies ComponentProps<typeof PostUpdateEmail>;
