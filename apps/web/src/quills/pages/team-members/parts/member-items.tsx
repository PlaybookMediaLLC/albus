import { useNavigate } from "@tanstack/react-router";
import { teamHref } from "../../../team/team-href";
import { MemberRow, type MemberRowProps } from "./member-row";

export interface MemberItemsProps {
  workspaceId: string;
  items: ReadonlyArray<MemberRowProps["member"] & { principalId: string }>;
}

/** The list items of one page of members. A click opens the member detail. */
export function MemberItems({ workspaceId, items }: MemberItemsProps) {
  const navigate = useNavigate();
  return items.map((member) => {
    const href = teamHref(workspaceId, `/members/${member.principalId}`);
    return (
      <li key={member.principalId}>
        <MemberRow
          member={member}
          href={href}
          onOpen={() => void navigate({ to: href })}
        />
      </li>
    );
  });
}
