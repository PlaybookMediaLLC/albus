import { useEffect, useRef } from "react";
import type { Path, UseFormReturn } from "react-hook-form";
import { FormSelect } from "../../ui/form-select";
import { useGetColumns } from "../../ui/upstream";

type Target = { projectId: string; columnId: string | null };

export interface ColumnFieldProps<T extends Target> {
  form: UseFormReturn<T>;
  label: string;
  /** The empty choice: the project's first column that is not final. */
  firstLabel: string;
}

/**
 * The column of the form's chosen Kaneo project, from Kaneo's own column list. A change of project goes
 * back to the first open column (null).
 */
export function ColumnField<T extends Target>({
  form,
  label,
  firstLabel,
}: ColumnFieldProps<T>) {
  const projectId = form.watch("projectId" as Path<T>) as string;
  const columns = useGetColumns(projectId);
  const first = useRef(projectId);
  useEffect(() => {
    if (first.current === projectId) return;
    first.current = projectId;
    form.setValue("columnId" as Path<T>, null as never);
  }, [form, projectId]);
  return (
    <FormSelect
      control={form.control}
      name={"columnId" as Path<T>}
      label={label}
      options={[
        { value: null as never, label: firstLabel },
        ...(columns.data ?? []).map((column) => ({
          value: column.id as never,
          label: column.name,
        })),
      ]}
    />
  );
}
