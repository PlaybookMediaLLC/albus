import { artSvg } from "./art-svg";

export type AutopilotArtProps = Record<string, never>;

/** The empty-state drawing of orbit rings around a core. Decorative: hidden from screen readers. */
export function AutopilotArt() {
  return (
    <svg {...artSvg}>
      <g>
        <ellipse pathLength={1} cx="48" cy="43.1" rx="33.1" ry="19.1" />
        <ellipse
          className="fill-primary stroke-primary"
          cx="48"
          cy="62.1"
          rx="3.1"
          ry="1.8"
        />
      </g>
      <g>
        <ellipse pathLength={1} cx="48" cy="35.1" rx="20.8" ry="12" />
        <ellipse
          className="fill-art-top"
          cx="27.2"
          cy="35.1"
          rx="2.7"
          ry="1.6"
        />
      </g>
      <g>
        <circle
          className="fill-art-side"
          pathLength={1}
          cx="48"
          cy="27.1"
          r="9"
        />
        <path pathLength={1} d="M42 25.1L44 21.6L48 20.1" />
      </g>
    </svg>
  );
}
