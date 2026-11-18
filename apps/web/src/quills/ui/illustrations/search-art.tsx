import { artSvg } from "./art-svg";

export type SearchArtProps = Record<string, never>;

/** The empty-state drawing of a magnifier over a grid. Decorative: hidden from screen readers. */
export function SearchArt() {
  return (
    <svg {...artSvg}>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M86.1 40.7L48 62.7L48 64.7L86.1 42.7ZM48 62.7L9.9 40.7L9.9 42.7L48 64.7Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M48 18.7L86.1 40.7L48 62.7L9.9 40.7Z"
        />
        <path
          pathLength={1}
          d="M56.7 24.7L20.3 45.7M39.3 24.7L75.7 45.7M66.2 30.2L29.8 51.2M29.8 30.2L66.2 51.2M75.7 35.7L39.3 56.7M20.3 35.7L56.7 56.7"
        />
      </g>
      <g>
        <path
          className="fill-art-side"
          pathLength={1}
          d="M55.6 43.1L50.7 43.1L50.7 45.6L55.6 45.6Z"
        />
        <path
          className="fill-art-top"
          pathLength={1}
          d="M50.7 33.9L55.6 33.9L55.6 43.1L50.7 43.1Z"
        />
        <path
          className="fill-art-side"
          pathLength={1}
          fillRule="evenodd"
          d="M38.5 25.7a14.7 8.5 0 1 0 29.4 0a14.7 8.5 0 1 0 -29.4 0ZM42.2 25.7a11 6.4 0 1 0 22 0a11 6.4 0 1 0 -22 0Z"
        />
      </g>
    </svg>
  );
}
