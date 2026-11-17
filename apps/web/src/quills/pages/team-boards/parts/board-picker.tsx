import { useTranslation } from "react-i18next";
import { PortalSelectContent } from "../../../ui/portal-select-content";
import {
  Field,
  FieldLabel,
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/upstream";

export interface BoardPickerProps {
  boards: { id: string; name: string }[];
  value: string;
  onChange: (boardId: string) => void;
}

/** The board whose settings the page shows. */
export function BoardPicker({ boards, value, onChange }: BoardPickerProps) {
  const { t } = useTranslation("quills");
  return (
    <Field className="flex-row items-center">
      <FieldLabel className="font-normal text-muted-foreground">
        {t("team-triage.board")}
      </FieldLabel>
      <Select
        items={boards.map((board) => ({ value: board.id, label: board.name }))}
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        <SelectTrigger size="sm" className="w-auto min-w-28 max-w-56">
          <SelectValue />
        </SelectTrigger>
        <PortalSelectContent>
          <SelectGroup>
            {boards.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </PortalSelectContent>
      </Select>
    </Field>
  );
}
