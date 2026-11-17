// The locales the SDK README lists; the SDK does not export its list.
const WIDGET_LOCALES = [
  "en",
  "fr",
  "de",
  "es",
  "ar",
  "ru",
  "pt-BR",
  "zh-CN",
  "zh-TW",
  "nl",
  "pl",
  "th",
  "uk",
];

export type HostInit = {
  placement: "left" | "right";
  locale: string;
  launcher: boolean;
  tracking: boolean;
  defaultBoard: string;
  theme: "" | "auto" | "light" | "dark";
  announcements: "whisper" | "full" | "none";
  pageUrl: "path" | "origin" | "none";
  /** Open from the page's own "Help (host launcher)" button. */
  ownLauncher: boolean;
  /** Move the default launcher up 84px and in 32px. */
  offset: boolean;
  /** Render inside the page's #inline-widget element instead of floating. */
  inline: boolean;
};

export const DEFAULT_INIT: HostInit = {
  placement: "right",
  locale: "",
  launcher: true,
  tracking: true,
  defaultBoard: "",
  theme: "",
  announcements: "whisper",
  pageUrl: "path",
  ownLauncher: false,
  offset: false,
  inline: false,
};

/** The init options. A change re-initializes the widget. */
export function InitOptions({
  value,
  onChange,
}: {
  value: HostInit;
  onChange: (next: HostInit) => void;
}) {
  const set = (patch: Partial<HostInit>) => onChange({ ...value, ...patch });
  return (
    <fieldset>
      <legend>init options</legend>
      <label>
        placement{" "}
        <select
          data-testid="placement"
          value={value.placement}
          onChange={(event) =>
            set({ placement: event.target.value as HostInit["placement"] })
          }
        >
          <option value="right">right</option>
          <option value="left">left</option>
        </select>
      </label>{" "}
      <label>
        locale{" "}
        <select
          data-testid="locale"
          value={value.locale}
          onChange={(event) => set({ locale: event.target.value })}
        >
          <option value="">auto</option>
          {WIDGET_LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {locale}
            </option>
          ))}
        </select>
      </label>{" "}
      <label>
        defaultBoard{" "}
        <input
          data-testid="default-board"
          value={value.defaultBoard}
          onChange={(event) => set({ defaultBoard: event.target.value })}
          placeholder="board slug"
        />
      </label>{" "}
      <label>
        <input
          type="checkbox"
          data-testid="inline"
          checked={value.inline}
          onChange={(event) => set({ inline: event.target.checked })}
        />{" "}
        inline (container)
      </label>{" "}
      <label>
        <input
          type="checkbox"
          data-testid="launcher"
          checked={value.launcher}
          onChange={(event) => set({ launcher: event.target.checked })}
        />{" "}
        launcher
      </label>{" "}
      <label>
        theme{" "}
        <select
          data-testid="theme"
          value={value.theme}
          onChange={(event) =>
            set({ theme: event.target.value as HostInit["theme"] })
          }
        >
          <option value="">workspace</option>
          <option value="auto">auto</option>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>
      </label>{" "}
      <label>
        announcements{" "}
        <select
          data-testid="announcements"
          value={value.announcements}
          onChange={(event) =>
            set({
              announcements: event.target.value as HostInit["announcements"],
            })
          }
        >
          <option value="whisper">whisper</option>
          <option value="full">full</option>
          <option value="none">none</option>
        </select>
      </label>{" "}
      <label>
        pageUrl{" "}
        <select
          data-testid="page-url"
          value={value.pageUrl}
          onChange={(event) =>
            set({ pageUrl: event.target.value as HostInit["pageUrl"] })
          }
        >
          <option value="path">path</option>
          <option value="origin">origin</option>
          <option value="none">none</option>
        </select>
      </label>{" "}
      <label>
        <input
          type="checkbox"
          data-testid="own-launcher"
          checked={value.ownLauncher}
          onChange={(event) => set({ ownLauncher: event.target.checked })}
        />{" "}
        own launcher
      </label>{" "}
      <label>
        <input
          type="checkbox"
          data-testid="offset"
          checked={value.offset}
          onChange={(event) => set({ offset: event.target.checked })}
        />{" "}
        offset
      </label>{" "}
      <label>
        <input
          type="checkbox"
          data-testid="tracking-init"
          checked={value.tracking}
          onChange={(event) => set({ tracking: event.target.checked })}
        />{" "}
        tracking
      </label>
    </fieldset>
  );
}

/** The InitOptions fields the SDK takes, without empty strings. */
export const initFields = (value: HostInit) => ({
  placement: value.placement,
  launcher: value.ownLauncher ? { selector: "#host-launcher" } : value.launcher,
  tracking: value.tracking,
  announcements: value.announcements,
  pageUrl: value.pageUrl,
  ...(value.theme && { theme: value.theme }),
  ...(value.offset && { offset: { bottom: 84, side: 32 } }),
  ...(value.locale && { locale: value.locale }),
  ...(value.defaultBoard && { defaultBoard: value.defaultBoard }),
  ...(value.inline && { container: "#inline-widget" }),
});
