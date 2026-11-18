import { artSvg } from "./art-svg";

export type ConversationsArtProps = Record<string, never>;

/** The empty-state drawing of two overlapping speech bubbles. Decorative: hidden from screen readers. */
export function ConversationsArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M31.2 50.1L18.9 54.1L18.9 57.1L31.2 53.1Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M25 47.6L31.2 50.1L18.9 54.1Z"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M17.9 42.1V45.1A18.4 10.6 0 0 0 54.6 45.1V42.1"
        />
        <ellipse
          className="fill-art-top"
          pathLength={1}
          cx="36.2"
          cy="42.1"
          rx="18.4"
          ry="10.6"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M69.9 40.4L75.2 44.6L75.2 47.6L69.9 43.4Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M74.4 37.3L69.9 40.4L75.2 44.6Z"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M46.3 34.1V37.1A15.9 9.2 0 0 0 78.1 37.1V34.1"
        />
        <ellipse
          className="fill-art-top"
          pathLength={1}
          cx="62.2"
          cy="34.1"
          rx="15.9"
          ry="9.2"
        />
        <ellipse
          className="fill-current"
          cx="55.3"
          cy="34.1"
          rx="1.8"
          ry="1.1"
        />
        <ellipse
          className="fill-current"
          cx="62.2"
          cy="34.1"
          rx="1.8"
          ry="1.1"
        />
        <ellipse
          className="fill-current"
          cx="69.1"
          cy="34.1"
          rx="1.8"
          ry="1.1"
        />
      </g>
    </svg>
  );
}
