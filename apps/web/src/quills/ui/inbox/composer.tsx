import { ArrowUp, ChevronDown } from "lucide-react";
import type { ReactNode, Ref } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  cn,
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
  Textarea,
} from "../upstream";
import { IconButton } from "./icon-button";
import type { ComposerMode } from "./inbox-types";

export interface ComposerProps {
  /** The accessible name and the placeholder, such as "Reply to Ada…". */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Runs on Enter and on the send button when the text is not empty. */
  onSend: () => void;
  /** The choices of the mode dropdown, such as Reply and Note, or Public and Private. */
  modes?: readonly ComposerMode[];
  mode?: string;
  onModeChange?: (mode: string) => void;
  /** Buttons at the start of the toolbar, such as attach and emoji. */
  tools?: ReactNode;
  sending?: boolean;
  disabled?: boolean;
  /** The text box, so that R and N can focus it. */
  inputRef?: Ref<HTMLTextAreaElement>;
}

/** The rounded message box at the bottom of a thread. Enter sends; Shift+Enter adds a line. */
export function Composer(props: ComposerProps) {
  const { t } = useTranslation("quills");
  const current =
    props.modes?.find((mode) => mode.value === props.mode) ?? props.modes?.[0];
  const ready =
    Boolean(props.value.trim()) && !props.sending && !props.disabled;
  const send = () => {
    if (ready) props.onSend();
  };
  const Icon = current?.icon;
  return (
    <div
      className={cn(
        // A lifted card: a soft deep shadow, and a quiet border that darkens while typing.
        "rounded-xl border border-border bg-card p-2 shadow-[0_1px_2px_--theme(--color-black/4%),0_8px_24px_--theme(--color-black/4%)] transition-[border-color,box-shadow] duration-150 focus-within:border-foreground/20 focus-within:ring-2 focus-within:ring-ring/30 dark:shadow-[0_1px_2px_--theme(--color-black/40%),0_8px_24px_--theme(--color-black/30%)] motion-reduce:transition-none",
        current?.private && "border-warning/40 bg-warning/5",
      )}
    >
      <Textarea
        unstyled
        ref={props.inputRef}
        aria-label={props.label}
        placeholder={props.label}
        value={props.value}
        disabled={props.disabled}
        rows={2}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key !== "Enter" ||
            event.shiftKey ||
            event.nativeEvent.isComposing
          )
            return;
          event.preventDefault();
          send();
        }}
        className="block text-sm [&_textarea]:max-h-60 [&_textarea]:min-h-12 [&_textarea]:resize-none [&_textarea]:px-2 [&_textarea]:py-1.5 [&_textarea]:placeholder:text-muted-foreground"
      />
      <div className="flex items-center gap-1">
        {props.tools}
        {current && props.modes && props.modes.length > 1 ? (
          <Menu>
            <MenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={t("inbox.mode", { mode: current.label })}
                />
              }
            >
              {Icon ? <Icon aria-hidden="true" /> : null}
              {current.label}
              <ChevronDown aria-hidden="true" />
            </MenuTrigger>
            <MenuPopup align="start">
              <MenuRadioGroup
                value={current.value}
                onValueChange={(value) => props.onModeChange?.(String(value))}
              >
                {props.modes.map(({ value, label, icon: ModeIcon }) => (
                  <MenuRadioItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      {ModeIcon ? <ModeIcon aria-hidden="true" /> : null}
                      {label}
                    </span>
                  </MenuRadioItem>
                ))}
              </MenuRadioGroup>
            </MenuPopup>
          </Menu>
        ) : null}
        <IconButton
          variant="default"
          className="ms-auto rounded-full"
          label={t("inbox.send")}
          loading={props.sending}
          disabled={!ready}
          onClick={send}
        >
          <ArrowUp aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  );
}
