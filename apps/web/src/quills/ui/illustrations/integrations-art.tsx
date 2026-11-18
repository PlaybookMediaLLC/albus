import { artSvg } from "./art-svg";

export type IntegrationsArtProps = Record<string, never>;

/** The empty-state drawing of a plug over a socket. Decorative: hidden from screen readers. */
export function IntegrationsArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M72.2 50L48 64L48 70L72.2 56ZM48 64L23.8 50L23.8 56L48 70Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M48 36L72.2 50L48 64L23.8 50Z"
        />
        <path
          className="fill-current"
          d="M46.3 46L48.4 47.3L43.2 50.3L41.1 49ZM52.8 49.8L54.9 51L49.7 54L47.6 52.8Z"
        />
        <ellipse
          className="fill-primary stroke-primary"
          cx="48"
          cy="59"
          rx="1.7"
          ry="1"
        />
      </g>
      <g>
        <path pathLength={1} d="M44.8 34.1L44.8 45.1M51.2 37.9L51.2 48.9" />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M61.9 27L48 35L48 44L61.9 36ZM48 35L34.1 27L34.1 36L48 44Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M48 19L61.9 27L48 35L34.1 27Z"
        />
        <path pathLength={1} d="M48 27C48 18 60 21 68 12" />
      </g>
    </svg>
  );
}
