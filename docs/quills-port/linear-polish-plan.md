# Feedback app: quiet-chrome polish plan

Status: accepted, 2026-11-18.
Scope: the teammate app (`/feedback/{id}`) and, for empty states only, the customer portal.
Follows [the teammate polish plan](teammate-polish-plan.md) and [the CSS polish plan](css-polish-plan.md).

The benchmark is the Linear app: its measurements and principles, not its logo, drawings,
wording or brand colour. Every drawing in this pass is original SVG line art.

## 1. Decisions

| # | Question | Decision |
|---|---|---|
| D1 | Accent colour | Keep Kaneo's near-black `primary`. It is the one accent, used only on primary actions. |
| D2 | Left icon rail | Keep it. It takes the same flat active fill as the sidebar. |
| D3 | Portal | In scope for empty states and drawings. The drawings take the customer's theme. |
| D4 | Illustrations | Original SVG line art, inline, one component per file. |
| D5 | Scope rule | This pass may edit `apps/web/src/index.css`, but only under `html[data-quills-shell]` and with new tokens whose fallback leaves Kaneo and the portal unchanged. |

## 2. Principles

1. A two-tone frame: a soft grey frame holds an inset, almost white panel.
2. Few borders: rows have no dividers. Grouping comes from a hover fill, a selected fill and a
   light band behind group headers.
3. Three text tiers: near-black titles, mid-grey labels, light-grey meta (IDs, dates, counts).
4. Pill controls: the active tab is a filled pill and inactive tabs are outlined pills. Chips are
   outlined pills with a dot. Toolbar buttons are small bordered squares.
5. Quiet chrome: everything is greyscale except the primary action.
6. Keyboard hints: tooltips show the shortcut as keycaps.
7. Empty states that teach: a small drawing, a short title, a short body, a hint and actions,
   in a narrow left-aligned column.

## 3. Values

Sizes are CSS px at 100% zoom. The teammate app runs at a 95% root size, so rem classes come out
5% smaller; the values below are the targets.

### Surfaces and text (tokens under `html[data-quills-shell]`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--sidebar` | `#f4f4f5` | `#0f0f10` | The frame |
| `--background` | `#fcfcfc` | `#161617` | The panel |
| `--border` | black 7% | white 6% | Hairlines |
| `--accent`, `--sidebar-accent` | black 3.5% | white 3.5% | Hover fill |
| `bg-foreground/6` | — | — | Selected fill (no token) |
| `--foreground` | `#1c1c1e` | `#ededef` | Titles, 16.6:1 and 15.5:1 |
| `--muted-foreground`, `--sidebar-foreground` | `#5e5e66` | `#a0a0a8` | Labels, 6.3:1 and 7.0:1 |
| `--faint-foreground` | `#72727a` | `#808088` | Meta text, 4.7:1 and 4.6:1 |

Linear's lightest grey (about `#8e8e93`) is 3.2:1 on the panel, below WCAG AA for any text.
The meta tier is darkened until it passes 4.5:1 on the panel. Outside the team shell
`text-faint-foreground` falls back to the element's own `--muted-foreground`, so the portal theme
still applies.

### Components

| Component | Target |
|---|---|
| Sidebar and rail item | 28px tall, 6px radius. Active: `bg-foreground/6`, weight 500, no shadow or ring. |
| Tabs | 26px pills, 12px side padding. Active: filled; inactive: hairline outline, mid-grey text. |
| Toolbar icon button | 28px square, 8px radius, hairline border (the list header's filter button). |
| Tooltip | The label plus keycaps from `Kbd` when the control has a shortcut. |
| List row | No dividers. Hover `bg-accent`, selected `bg-foreground/6`. Meta in the faint tier. |
| Group header | A sticky band: `bg-foreground/3`, 6px radius, 12px weight-500 label and count. |
| Chip | 22px, fully rounded, hairline border, 12px mid-grey text, 6px dot. |
| Empty state | A 360px left-aligned column: 96×80 drawing, 15px weight-600 title, 14px muted body, an optional keycap hint and 32px buttons. |
| Motion | 120–240ms with `--ease-out`. Entrances fade and rise 6px. No bounce. |

## 4. Drawings

Style: 1.25px strokes in `currentColor` (the muted text tier), two flat plane tones mixed from
`currentColor` and the panel (`fill-art-top`, `fill-art-side`), a 30° isometric angle, a 96×80
frame, at most one `primary` detail and no text. Each drawing is under 2KB.

| Screen | Drawing | Component |
|---|---|---|
| Requests and their filters | Stacked speech-bubble cards | `RequestsArt` |
| No search results | A magnifier over a grid | `SearchArt` |
| Roadmap | Three lanes with one card | `RoadmapArt` |
| Changelog | A sheet with a spark | `ChangelogArt` |
| Conversations | Two overlapping bubbles | `ConversationsArt` |
| Tickets | A perforated ticket stub | `TicketsArt` |
| Duplicates | Two cards merging into one | `DuplicatesArt` |
| Autopilot | Orbit rings | `AutopilotArt` |
| Help center | An open book | `HelpArt` |
| Integrations | A plug and a socket | `IntegrationsArt` |
| Team home | A board outline with a seedling | `StartArt` |

The hero shape (`HeroOrbit`) is a faint orbit behind the team home "get started" area.

Motion (CSS only, the `art` utility in `index.css`):

- Enter: each layer fades and rises 6px over 320ms with a 50ms stagger; strokes draw in over 500ms.
- Hover on the empty state: the layers separate by 1–3px over 240ms.
- The hero orbit drifts over 12s. Browsers already pause CSS animations in hidden tabs, so no
  script is needed.
- Reduced motion: every layer shows its final frame with no animation.

## 5. Phases

| # | Phase | Files |
|---|---|---|
| 0 | This document | `docs/quills-port/linear-polish-plan.md` |
| 1 | Shell tokens and the `art` utilities | `apps/web/src/index.css` |
| 2 | Flat active item in the sidebar and the rail | `team/sidebar-item.tsx`, `team/team-rail.tsx` |
| 3 | Pill tabs, bordered toolbar button, keycap tooltips | `ui/inbox/status-tabs.tsx`, `ui/inbox/list-header.tsx`, `ui/inbox/icon-button.tsx` |
| 4 | Row fills, group bands, dot chips, faint meta | `ui/inbox/request-row.tsx`, `conversation-row.tsx`, `grouped-list.tsx` |
| 5 | `EmptyState`, the drawings, wired into the screens | `ui/empty-state.tsx`, `ui/illustrations/*`, pages |
| 6 | Team home "get started" cards | `pages/team-home` |
| 7 | Portal empty states with drawings | portal pages |
| 8 | QA | gallery, tests, screenshots |

## 6. Guardrails

- Our own artwork and accent only.
- Body text at 4.5:1 or better, meta text included.
- Drawings are `aria-hidden`; every animation respects `prefers-reduced-motion`.
- No animation library; inline SVG only.
- All new copy in `quills` i18n keys with `en-US` as the source.

## 7. What the build changed

| Area | Change |
|---|---|
| Tokens | `html[data-quills-shell]` and its dark twin in `index.css`; `faint-foreground`, `art-top` and `art-side` colours; the `art` and `art-drift` utilities. |
| Shell | The sidebar item (28px) and the rail item use `bg-foreground/6` with no shadow or ring. Sidebar counts use the faint tier. |
| Chrome | `StatusTabs` are pills. The list header's filter button is a bordered `IconButton`. `IconButton` shows `aria-keyshortcuts` as keycaps in its tooltip, so every button with a shortcut (F, J, K, Esc) teaches it. |
| Lists | Request, conversation, member and changelog rows hover with `bg-accent` and select with `bg-foreground/6`. `GroupedList` headers are opaque sticky bands. The board chip is a hairline pill with a dot. Row meta uses the faint tier. |
| Empty states | `EmptyState` (`ui/empty-state.tsx`) and the `emptyState` slot on `StateView` and `ListPane`. Wired: requests (and no matches, with F and Clear filters), conversations, tickets, duplicates, autopilot, roadmap, changelog and its engagement tab, integrations; on the portal: posts, roadmap, updates, help category, support, tickets and My feedback. Copy is in `i18n/en-US/empty.json`. |
| First run | `GetStarted` on the team home: three setup links over `HeroOrbit`, hidden per workspace on this browser. |
| Test kit | The page contract's empty check also accepts a status that starts with "No". |

Left out, with the reason:

- Feature-intro pages with a product preview and a feature grid: the empty states above carry the drawing, the explanation and the first action. Build them when a feature needs a separate setup flow.
- Collapsible sidebar section labels: the app sidebar shows one section and the settings lists are short.
- Tree lines: no teammate list nests rows yet.
- Header bar height and title size: the list and detail headers share 56px; changing one breaks their alignment.
- The composer-card restyle of New request.

## 8. Evidence

[`evidence/quiet-chrome/`](evidence/quiet-chrome/README.md) holds screenshots of the seeded demo
workspace at 1440 × 900: every teammate view in light, most in dark, eight settings pages, request,
conversation, ticket and changelog details, the keycap tooltip, and the empty and no-match states.
Phone and portal shots are still to take. Retake the set with `pnpm dev:demo`; the kit gallery
(`/quills/kit`) shows every drawing.
