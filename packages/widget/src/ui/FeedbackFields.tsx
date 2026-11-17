import { useId } from "react";
import type { RawFieldValue } from "./fields.js";
import type { FeedbackField } from "./types.js";

/** Inputs for a board's public custom fields, under the feedback text. */
export function FeedbackFields({
  fields,
  values,
  onChange,
  disabled,
}: {
  fields: readonly FeedbackField[];
  values: Readonly<Record<string, RawFieldValue>>;
  onChange: (key: string, value: RawFieldValue) => void;
  disabled?: boolean;
}) {
  const id = useId();
  if (!fields.length) return null;
  return (
    <div className="qb-fields">
      {fields.map((field) => {
        const name = `${id}-${field.key}`;
        const label = (
          <span dir="auto">
            {field.label}
            {field.required && (
              <span className="qb-field-required"> (required)</span>
            )}
          </span>
        );
        const value = values[field.key];
        if (field.type === "checkbox")
          return (
            <label key={field.key} className="qb-field qb-field-check">
              <input
                type="checkbox"
                checked={value === true}
                disabled={disabled}
                onChange={(event) => onChange(field.key, event.target.checked)}
              />
              {label}
            </label>
          );
        if (field.type === "multi_select") {
          const chosen = Array.isArray(value) ? value : [];
          return (
            <fieldset key={field.key} className="qb-field">
              <legend>{label}</legend>
              {field.options?.map((option) => (
                <label key={option} className="qb-field-check">
                  <input
                    type="checkbox"
                    checked={chosen.includes(option)}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(
                        field.key,
                        event.target.checked
                          ? [...chosen, option]
                          : chosen.filter((item) => item !== option),
                      )
                    }
                  />
                  <span dir="auto">{option}</span>
                </label>
              ))}
            </fieldset>
          );
        }
        return (
          <div key={field.key} className="qb-field">
            <label htmlFor={name}>{label}</label>
            {field.type === "select" ? (
              <select
                id={name}
                dir="auto"
                value={typeof value === "string" ? value : ""}
                disabled={disabled}
                onChange={(event) => onChange(field.key, event.target.value)}
              >
                <option value="">Choose an option</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={name}
                // Digits and dates follow the panel; only free text keeps its own direction.
                dir={field.type === "text" ? "auto" : undefined}
                type={
                  field.type === "number"
                    ? "number"
                    : field.type === "date"
                      ? "date"
                      : "text"
                }
                {...(field.type === "number" && { step: "any" })}
                value={typeof value === "string" ? value : ""}
                disabled={disabled}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
