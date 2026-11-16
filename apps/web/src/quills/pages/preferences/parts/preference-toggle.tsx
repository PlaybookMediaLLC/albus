import { ConfirmAction } from "../../../ui/confirm-action";
import { Card } from "../../../ui/upstream";

export interface PreferenceToggleProps {
  labelKey: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => Promise<void>;
}

export function PreferenceToggle(props: PreferenceToggleProps) {
  return (
    <Card className="p-4">
      <ConfirmAction
        labelKey={props.labelKey}
        role="switch"
        aria-checked={props.checked}
        disabled={props.disabled}
        onConfirm={() => props.onChange(!props.checked)}
      />
    </Card>
  );
}
