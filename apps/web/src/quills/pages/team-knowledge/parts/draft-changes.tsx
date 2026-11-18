import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { KnowledgeDraftValues } from "./knowledge-draft";

export interface DraftChangesProps {
  form: UseFormReturn<KnowledgeDraftValues>;
  onChange: (values: KnowledgeDraftValues) => void;
}

/** Reports each edit of the draft form, so approve sends the text the teammate sees. */
export function DraftChanges({ form, onChange }: DraftChangesProps) {
  useEffect(() => {
    const subscription = form.watch((values) =>
      onChange({ title: values.title ?? "", content: values.content ?? "" }),
    );
    return () => subscription.unsubscribe();
  }, [form, onChange]);
  return null;
}
