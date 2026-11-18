import { ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../ui/upstream";

export interface RoadmapHiddenColumnsProps {
  /** The hidden columns: RoadmapColumn rows, which still take dropped cards. */
  children: ReactNode;
}

/** The panel at the end of the board that lists the hidden columns, open by default. */
export function RoadmapHiddenColumns({ children }: RoadmapHiddenColumnsProps) {
  const { t } = useTranslation("quills");
  const [open, setOpen] = useState(true);
  return (
    <div className="ms-auto w-80 shrink-0 ps-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-11 items-center gap-1.5 rounded-md px-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-3.5 transition-transform duration-150 motion-reduce:transition-none",
            !open && "-rotate-90",
          )}
        />
        {t("team-roadmap.hidden")}
      </button>
      {open ? <div className="grid gap-2">{children}</div> : null}
    </div>
  );
}
