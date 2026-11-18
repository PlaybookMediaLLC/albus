import { brandMarks } from "./brand-marks";

export interface BrandIconProps {
  /** A social network or integration provider ID. */
  id: string;
  className?: string;
}

/** The brand mark of a network or provider, or nothing when it has none. The row names it. */
export function BrandIcon({ id, className }: BrandIconProps) {
  const mark = brandMarks[id];
  if (!mark) return null;
  return (
    <svg
      viewBox={mark.viewBox ?? "0 0 24 24"}
      fill={mark.color ?? "currentColor"}
      aria-hidden="true"
      focusable="false"
      data-brand={id}
      className={className}
    >
      {mark.paths.map((path) =>
        typeof path === "string" ? (
          <path key={path} d={path} />
        ) : (
          <path key={path[1]} fill={path[0]} d={path[1]} />
        ),
      )}
    </svg>
  );
}
