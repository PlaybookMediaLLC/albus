import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconButton } from "../../../ui/inbox/icon-button";
import {
  Button,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "../../../ui/upstream";
import { traitInput, type TraitType } from "../trait-value";

export interface TraitDialogProps {
  definitions: ReadonlyArray<{ key: string; label: string; type: TraitType }>;
  /** Rejects when the trait is not saved; the dialog then stays open. */
  onSave: (
    attributes: Record<string, string | number | boolean>,
  ) => Promise<unknown>;
}

const inputType = {
  number: "number",
  currency: "number",
  date: "date",
} as const;

/** Adds or changes one trait: a defined attribute and a value field of its type. */
export function TraitDialog({ definitions, onSave }: TraitDialogProps) {
  const { t } = useTranslation("quills");
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const definition = definitions.find((item) => item.key === key);
  const value = definition ? traitInput(text, definition.type) : undefined;
  const reset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setKey(null);
      setText("");
    }
  };
  const save = async () => {
    if (!definition || value === undefined) return;
    setSaving(true);
    try {
      await onSave({ [definition.key]: value });
      reset(false);
    } catch {
      // The caller shows the problem. The values stay for another try.
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger render={<IconButton label={t("team-members.addTrait")} />}>
        <Plus aria-hidden="true" />
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{t("team-members.addTrait")}</DialogTitle>
          <DialogDescription>
            {t("team-members.addTraitText")}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="grid gap-4">
          <Field>
            <FieldLabel>{t("team-members.attribute")}</FieldLabel>
            <Select
              items={definitions.map((item) => ({
                value: item.key,
                label: item.label,
              }))}
              value={key}
              onValueChange={(next) => {
                setKey(next);
                setText("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("team-members.chooseAttribute")} />
              </SelectTrigger>
              <SelectContent>
                {definitions.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {definition?.type === "boolean" ? (
            <Field className="flex-row items-center justify-between">
              <FieldLabel>{t("team-members.value")}</FieldLabel>
              <Switch
                checked={text === "true"}
                onCheckedChange={(next) => setText(String(next))}
              />
            </Field>
          ) : definition ? (
            <Field>
              <FieldLabel>{t("team-members.value")}</FieldLabel>
              <Input
                type={
                  inputType[definition.type as keyof typeof inputType] ?? "text"
                }
                maxLength={1000}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </Field>
          ) : null}
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {t("team-members.cancel")}
          </DialogClose>
          <Button
            disabled={value === undefined}
            loading={saving}
            onClick={() => void save()}
          >
            {t("team-members.save")}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
