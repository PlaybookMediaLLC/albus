import { artSvg } from "./art-svg";

export type InsightsArtProps = Record<string, never>;

/** The empty-state drawing of three rising bars on a plate. Decorative: hidden from screen readers. */
export function InsightsArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M77.8 51L55.3 64L55.3 66L77.8 53ZM55.3 64L15.5 41L15.5 43L55.3 66Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M38 28L77.8 51L55.3 64L15.5 41Z"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M42.3 29.5L35.4 33.5L35.4 43.5L42.3 39.5ZM35.4 33.5L28.5 29.5L28.5 39.5L35.4 43.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M35.4 25.5L42.3 29.5L35.4 33.5L28.5 29.5Z"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M53.6 28L46.7 32L46.7 50L53.6 46ZM46.7 32L39.7 28L39.7 46L46.7 50Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M46.7 24L53.6 28L46.7 32L39.7 28Z"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M64.8 24.5L57.9 28.5L57.9 56.5L64.8 52.5ZM57.9 28.5L51 24.5L51 52.5L57.9 56.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M57.9 20.5L64.8 24.5L57.9 28.5L51 24.5Z"
        />
      </g>
      <g>
        <ellipse
          className="fill-primary stroke-primary"
          cx="57.9"
          cy="24.5"
          rx="1.8"
          ry="1.1"
        />
      </g>
    </svg>
  );
}
