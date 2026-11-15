import { Search } from "lucide-react";
import { type KeyboardEvent, useRef } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, Kbd } from "../upstream";
import { useKeyShortcuts } from "./use-key-shortcuts";

export interface SearchFieldProps {
  /** The accessible name and the placeholder, such as "Search conversations…". */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** "/" focuses the field. Set false for a second field on the same page. */
  shortcut?: boolean;
  /** Runs before Escape leaves the field, for example to clear it or open a match. */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

const KEY = "/";

/** The search field of a list, with the "/" key hint. */
export function SearchField({
  label,
  value,
  onChange,
  shortcut = true,
  onKeyDown,
  className,
}: SearchFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  useKeyShortcuts({ [KEY]: () => input.current?.focus() }, shortcut);
  return (
    <InputGroup className={className}>
      <InputGroupInput
        ref={input}
        type="search"
        aria-label={label}
        aria-keyshortcuts={shortcut ? KEY : undefined}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.key === "Escape") event.currentTarget.blur();
        }}
      />
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      {shortcut ? (
        <InputGroupAddon align="inline-end">
          <Kbd aria-hidden="true" tone="muted">
            {KEY}
          </Kbd>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
