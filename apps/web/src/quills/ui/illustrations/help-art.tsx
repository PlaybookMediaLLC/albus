import { artSvg } from "./art-svg";

export type HelpArtProps = Record<string, never>;

/** The empty-state drawing of an open book. Decorative: hidden from screen readers. */
export function HelpArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M53.2 59.5L15.1 37.5L15.1 39.5L53.2 61.5ZM80.9 43.5L53.2 59.5L53.2 61.5L80.9 45.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M42.8 21.5L80.9 43.5L53.2 59.5L15.1 37.5Z"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M18.6 34.5L35 47L18.6 37.5ZM36.7 48L53.2 54.5L53.2 57.5ZM77.4 40.5L53.2 54.5L53.2 57.5L77.4 43.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M42.8 20.5L59.3 33L35 47L18.6 34.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M61 34L77.4 40.5L53.2 54.5L36.7 48Z"
        />
        <path
          pathLength={1}
          d="M40.2 25.5L51.5 34M35.9 28L47.1 36.5M31.5 30.5L42.8 39M27.2 33L38.5 41.5M58.4 38L69.7 42.5M54.1 40.5L65.3 45M49.7 43L61 47.5M45.4 45.5L56.7 50"
        />
      </g>
    </svg>
  );
}
