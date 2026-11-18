import { artSvg } from "./art-svg";

export type RoadmapArtProps = Record<string, never>;

/** The empty-state drawing of three lanes with one card. Decorative: hidden from screen readers. */
export function RoadmapArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M60.1 24L20.3 47L20.3 49L60.1 26ZM20.3 47L9.9 41L9.9 43L20.3 49Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M49.7 18L60.1 24L20.3 47L9.9 41Z"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M73.1 31.5L33.3 54.5L33.3 56.5L73.1 33.5ZM33.3 54.5L22.9 48.5L22.9 50.5L33.3 56.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M62.7 25.5L73.1 31.5L33.3 54.5L22.9 48.5Z"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M86.1 39L46.3 62L46.3 64L86.1 41ZM46.3 62L35.9 56L35.9 58L46.3 64Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M75.7 33L86.1 39L46.3 62L35.9 56Z"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M61.9 34L50.6 40.5L50.6 43.5L61.9 37ZM50.6 40.5L41.9 35.5L41.9 38.5L50.6 43.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M53.2 29L61.9 34L50.6 40.5L41.9 35.5Z"
        />
        <path pathLength={1} d="M51.5 32L56.7 35M48 34L51.5 36" />
        <ellipse
          className="fill-primary stroke-primary"
          cx="50.6"
          cy="38"
          rx="1.5"
          ry=".8"
        />
      </g>
    </svg>
  );
}
