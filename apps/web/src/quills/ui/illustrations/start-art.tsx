import { artSvg } from "./art-svg";

export type StartArtProps = Record<string, never>;

/** The empty-state drawing of a board outline with a seedling. Decorative: hidden from screen readers. */
export function StartArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M53.2 63L13.4 40L13.4 42L53.2 65ZM82.6 46L53.2 63L53.2 65L82.6 48Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M42.8 23L82.6 46L53.2 63L13.4 40Z"
        />
        <path pathLength={1} d="M53.5 32.2L29.2 46.2M66.8 39.9L42.5 53.9" />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M28.5 42.3L20.3 37.5L20.3 39L28.5 43.8ZM33.7 39.3L28.5 42.3L28.5 43.8L33.7 40.8Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M25.5 34.5L33.7 39.3L28.5 42.3L20.3 37.5Z"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M71.4 48L63.2 43.3L63.2 44.8L71.4 49.5ZM76.6 45L71.4 48L71.4 49.5L76.6 46.5Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M68.4 40.3L76.6 45L71.4 48L63.2 43.3Z"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          d="M63.6 52.5L55.4 47.8L55.4 49.3L63.6 54ZM68.8 49.5L63.6 52.5L63.6 54L68.8 51Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M60.6 44.8L68.8 49.5L63.6 52.5L55.4 47.8Z"
        />
      </g>
      <g>
        <ellipse className="fill-art-side" cx="48" cy="43" rx="4.9" ry="2.8" />
        <path pathLength={1} d="M48 43L48 26" />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M48 30Q42 29 38 23Q45 23 48 30Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M48 26Q55 25 60 17Q51 17 48 26Z"
        />
      </g>
    </svg>
  );
}
