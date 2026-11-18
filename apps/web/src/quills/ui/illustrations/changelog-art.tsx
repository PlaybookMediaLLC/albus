import { artSvg } from "./art-svg";

export type ChangelogArtProps = Record<string, never>;

/** The empty-state drawing of a sheet with a spark. Decorative: hidden from screen readers. */
export function ChangelogArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M78.4 42.3L38.6 65.3L38.6 67.3L78.4 44.3ZM38.6 65.3L7.4 47.3L7.4 49.3L38.6 67.3Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M47.2 24.3L78.4 42.3L38.6 65.3L7.4 47.3Z"
        />
        <path
          pathLength={1}
          d="M45.5 31.3L57.6 38.3M39.5 34.8L60.2 46.8M34.3 37.8L52.4 48.3M29.1 40.8L44.6 49.8M23.9 43.8L43.8 55.3"
        />
      </g>
      <g>
        <path
          className="fill-art-top"
          pathLength={1}
          d="M74.1 14.8L76.1 21.8L83.1 23.8L76.1 25.7L74.1 32.8L72.1 25.7L65.1 23.8L72.1 21.8Z"
        />
        <path
          className="fill-primary stroke-primary"
          d="M85.1 29.3L85.9 32L88.6 32.8L85.9 33.5L85.1 36.3L84.3 33.5L81.6 32.8L84.3 32Z"
        />
      </g>
    </svg>
  );
}
