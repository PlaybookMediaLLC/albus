import { artSvg } from "./art-svg";

export type RequestsArtProps = Record<string, never>;

/** The empty-state drawing of stacked speech-bubble cards. Decorative: hidden from screen readers. */
export function RequestsArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M48.9 64.3L14.2 44.3L14.2 46.8L48.9 66.8ZM71.4 51.3L48.9 64.3L48.9 66.8L71.4 53.8Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M36.7 31.3L71.4 51.3L48.9 64.3L14.2 44.3Z"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M54.1 56.3L19.4 36.3L19.4 38.8L54.1 58.8ZM76.6 43.3L54.1 56.3L54.1 58.8L76.6 45.8Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M41.9 23.3L76.6 43.3L54.1 56.3L19.4 36.3Z"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M32.4 32.8L24.6 28.3L24.6 30.8L32.4 35.3ZM37.6 35.8L24.6 35.3L24.6 37.8L37.6 38.3ZM81.8 35.3L59.3 48.3L59.3 50.8L81.8 37.8ZM59.3 48.3L37.6 35.8L37.6 38.3L59.3 50.8Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M47.1 15.3L81.8 35.3L59.3 48.3L37.6 35.8L24.6 35.3L32.4 32.8L24.6 28.3Z"
        />
        <path
          pathLength={1}
          d="M46.3 21.8L65.3 32.8M41.1 24.8L54.9 32.8M35.9 27.8L52.3 37.3"
        />
        <ellipse
          className="fill-primary stroke-primary"
          cx="70.5"
          cy="35.8"
          rx="2.4"
          ry="1.4"
        />
      </g>
    </svg>
  );
}
