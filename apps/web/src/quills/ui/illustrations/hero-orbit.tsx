import { useId } from "react";

export type HeroOrbitProps = Record<string, never>;

/**
 * A faint orbit and sphere drawn behind a hero area, such as the team home's get-started cards.
 * The parent must be `relative`. Decorative: hidden from screen readers.
 */
export function HeroOrbit() {
  const id = `hero-orbit-${useId().replace(/\W/g, "")}`;
  return (
    <svg
      viewBox="0 0 480 240"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-auto w-full max-w-3xl text-foreground opacity-10 mask-b-from-20%"
    >
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="currentColor" stopOpacity={0.5} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx="240" cy="120" r="64" fill={`url(#${id})`} stroke="none" />
      <g className="art-drift">
        <ellipse cx="240" cy="120" rx="210" ry="58" />
        <ellipse
          cx="240"
          cy="120"
          rx="150"
          ry="42"
          transform="rotate(-9 240 120)"
        />
        <ellipse
          cx="240"
          cy="120"
          rx="98"
          ry="28"
          transform="rotate(7 240 120)"
        />
        <circle cx="62" cy="91" r="3.5" className="fill-current" />
        <circle cx="372" cy="117" r="2.5" className="fill-current" />
      </g>
    </svg>
  );
}
