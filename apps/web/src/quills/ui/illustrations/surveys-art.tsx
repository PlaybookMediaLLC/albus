import { artSvg } from "./art-svg";

export type SurveysArtProps = Record<string, never>;

/** The empty-state drawing of a survey card with one option picked. Decorative: hidden from screen readers. */
export function SurveysArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M89 46L59.6 63L59.6 65L89 48ZM59.6 63L18 39L18 41L59.6 65Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M47.5 22L89 46L59.6 63L18 39Z"
        />
      </g>
      <g>
        <path
          pathLength={1}
          d="M54.4 34L71.7 44M46.6 38.5L58.7 45.5M38.8 43L56.1 53"
        />
        <ellipse
          className="fill-primary stroke-primary"
          cx="49.2"
          cy="31"
          rx="2.6"
          ry="1.5"
        />
        <ellipse
          className="fill-art-top"
          cx="41.4"
          cy="35.5"
          rx="2.6"
          ry="1.5"
        />
        <ellipse className="fill-art-top" cx="33.6" cy="40" rx="2.6" ry="1.5" />
      </g>
    </svg>
  );
}
