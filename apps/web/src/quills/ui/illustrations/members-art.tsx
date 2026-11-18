import { artSvg } from "./art-svg";

export type MembersArtProps = Record<string, never>;

/** The empty-state drawing of two people on a plate. Decorative: hidden from screen readers. */
export function MembersArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M80.6 46L56.4 60L56.4 62L80.6 48ZM56.4 60L21.8 40L21.8 42L56.4 62Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M46 26L80.6 46L56.4 60L21.8 40Z"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M29.3 31.9V40A6.3 3.6 0 0 0 41.9 40V31.9"
        />
        <ellipse
          className="fill-art-top"
          pathLength={1}
          cx="35.6"
          cy="31.9"
          rx="6.3"
          ry="3.6"
        />
        <circle
          className="fill-art-top"
          pathLength={1}
          cx="35.6"
          cy="25.2"
          r="4.1"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M51.1 36V45A7 4 0 0 0 65.1 45V36"
        />
        <ellipse
          className="fill-art-top"
          pathLength={1}
          cx="58.1"
          cy="36"
          rx="7"
          ry="4"
        />
        <circle
          className="fill-art-top"
          pathLength={1}
          cx="58.1"
          cy="28.4"
          r="4.6"
        />
        <ellipse
          className="fill-primary stroke-primary"
          cx="54.7"
          cy="55"
          rx="1.8"
          ry="1.1"
        />
      </g>
    </svg>
  );
}
