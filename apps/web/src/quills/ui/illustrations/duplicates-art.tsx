import { artSvg } from "./art-svg";

export type DuplicatesArtProps = Record<string, never>;

/** The empty-state drawing of two cards merging into one. Decorative: hidden from screen readers. */
export function DuplicatesArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          strokeDasharray="2 2"
          d="M30.7 57.5L9.9 45.5L9.9 47.5L30.7 59.5ZM44.5 49.5L30.7 57.5L30.7 59.5L44.5 51.5Z"
        />
        <path
          className="fill-art-top"
          strokeDasharray="2 2"
          d="M23.8 37.5L44.5 49.5L30.7 57.5L9.9 45.5Z"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          strokeDasharray="2 2"
          d="M72.2 57.5L51.5 45.5L51.5 47.5L72.2 59.5ZM86.1 49.5L72.2 57.5L72.2 59.5L86.1 51.5Z"
        />
        <path
          className="fill-art-top"
          strokeDasharray="2 2"
          d="M65.3 37.5L86.1 49.5L72.2 57.5L51.5 45.5Z"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M51.5 46.5L27.2 32.5L27.2 35.5L51.5 49.5ZM68.8 36.5L51.5 46.5L51.5 49.5L68.8 39.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M44.5 22.5L68.8 36.5L51.5 46.5L27.2 32.5Z"
        />
        <path pathLength={1} d="M43.7 28L56.7 35.5M38.5 31L47.1 36" />
        <ellipse
          className="fill-primary stroke-primary"
          cx="51.9"
          cy="41.3"
          rx="1.8"
          ry="1.1"
        />
      </g>
    </svg>
  );
}
