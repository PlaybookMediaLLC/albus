import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox, Label } from "../../ui/upstream";

export type UpdateChannel = "page" | "email" | "conversations" | "slack";
export type UpdateChannels = Record<UpdateChannel, boolean>;
export type UpdateCounts = Record<UpdateChannel, number>;

const CHANNELS = ["page", "email", "conversations", "slack"] as const;
const LABELS = {
  page: "team-post.updatePage",
  email: "team-post.updateEmail",
  conversations: "team-post.updateConversations",
  slack: "team-post.updateSlack",
} as const;
const COUNTS = {
  page: "team-post.updatePageCount",
  email: "team-post.updateEmailCount",
  conversations: "team-post.updateConversationsCount",
  slack: "team-post.updateSlackCount",
} as const;

export interface UpdateChannelsFieldProps {
  value: UpdateChannels;
  onChange: (value: UpdateChannels) => void;
  /** The preview's counts for the current choice; null while it loads or fails. */
  counts: UpdateCounts | null;
  slackConnected: boolean;
}

/** One checkbox per channel, each with the number of people or places the send reaches there. */
export function UpdateChannelsField(props: UpdateChannelsFieldProps) {
  const { t } = useTranslation("quills");
  const legend = useId();
  return (
    <div role="group" aria-labelledby={legend} className="grid gap-2">
      <p id={legend} className="text-sm font-medium">
        {t("team-post.updateChannels")}
      </p>
      {CHANNELS.map((channel) => {
        // Slack posts the page comment, so it needs the page channel and a connection.
        const disabled =
          channel === "slack" && (!props.value.page || !props.slackConnected);
        return (
          <div key={channel} className="flex items-center justify-between">
            <Label>
              <Checkbox
                checked={props.value[channel] && !disabled}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  props.onChange({ ...props.value, [channel]: checked })
                }
              />
              {t(LABELS[channel])}
            </Label>
            <span className="text-sm text-muted-foreground tabular-nums">
              {props.counts
                ? t(COUNTS[channel], { count: props.counts[channel] })
                : null}
            </span>
          </div>
        );
      })}
      {props.slackConnected ? null : (
        <p className="text-sm text-muted-foreground">
          {t("team-post.updateNoSlack")}
        </p>
      )}
    </div>
  );
}
