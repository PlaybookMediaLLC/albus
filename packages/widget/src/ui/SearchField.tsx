import type { RefObject } from "react";
import { Icon } from "./Icon.js";
import { useT } from "./i18n/useT.js";

export function SearchField({
  label,
  value,
  onChange,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const t = useT();
  return (
    <div className="qb-search">
      <Icon name="search" />
      <input
        ref={inputRef}
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className="qb-search-clear"
          aria-label={t("Clear search")}
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
        >
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}
