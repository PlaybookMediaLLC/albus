import { artSvg } from "./art-svg";

export type TicketsArtProps = Record<string, never>;

/** The empty-state drawing of a perforated ticket stub. Decorative: hidden from screen readers. */
export function TicketsArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M79.6 39.5L58 52L58 54.5L79.6 42ZM52.8 52L32 40L32 42.5L52.8 54.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M53.6 24.5L79.6 39.5L58 52L58 52L57 51.6L55.9 51.4L54.8 51.4L53.7 51.6L52.8 52L32 40L32 40L32.7 39.5L33 38.8L33 38.2L32.7 37.5L32 37Z"
        />
        <path pathLength={1} d="M52.8 31L66.6 39M47.6 34L57.1 39.5" />
        <ellipse className="fill-art-top" cx="56.2" cy="45" rx="3.7" ry="2.1" />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M42.4 55L16.4 40L16.4 42.5L42.4 57.5ZM50.2 50.5L42.4 55L42.4 57.5L50.2 53Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M50.2 47.5L49.5 48L49.1 48.7L49.1 49.3L49.5 50L50.2 50.5L42.4 55L16.4 40L24.2 35.5L25.1 35.9L26.2 36.1L27.4 36.1L28.5 35.9L29.4 35.5Z"
        />
        <path strokeDasharray="2 2" d="M28.5 37L47.6 48" />
        <ellipse
          className="fill-primary stroke-primary"
          cx="33.3"
          cy="45.3"
          rx="1.8"
          ry="1.1"
        />
      </g>
    </svg>
  );
}
