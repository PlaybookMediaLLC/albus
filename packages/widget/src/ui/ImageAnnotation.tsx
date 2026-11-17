import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { validateImage } from "./media.js";
import { Icon } from "./Icon.js";
import { drawMarks, RED, type Mark, type Tool } from "./annotation-draw.js";
import type { MessageKey } from "./i18n/messages/en.js";
import { useT } from "./i18n/useT.js";

/** Each tool, its button and its Add button. */
const TOOLS: readonly [Tool, MessageKey, MessageKey][] = [
  ["box", "Box", "Add box"],
  ["arrow", "Arrow", "Add arrow"],
  ["pen", "Pen", "Add pen"],
  ["text", "Text", "Add text"],
  ["blur", "Blur", "Add blur"],
  ["redact", "Redact", "Add redact"],
];
/** Each position field and its accessible name. */
const POINTS = [
  ["x", "From x", "Mark from x"],
  ["y", "From y", "Mark from y"],
  ["x2", "To x", "Mark to x"],
  ["y2", "To y", "Mark to y"],
] as const satisfies readonly (readonly [string, MessageKey, MessageKey])[];

/** A new mark at a point; the tools that paint take the chosen color. */
function newMark(
  tool: Tool,
  x: number,
  y: number,
  color: string,
  text: string,
): Mark {
  return {
    tool,
    x,
    y,
    x2: x,
    y2: y,
    ...(tool !== "blur" && tool !== "redact" && { color }),
    ...(tool === "pen" && { points: [[x, y] as const] }),
    ...(tool === "text" && { text }),
  };
}

export function ImageAnnotation({
  file,
  onSave,
  onCancel,
}: {
  file: File;
  onSave: (file: File) => void | Promise<void>;
  onCancel: () => void;
}) {
  const t = useT();
  const titleId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const source = useRef<HTMLImageElement | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [tool, setTool] = useState<Tool>("box");
  const [color, setColor] = useState(RED);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    const previous = document.activeElement;
    const modal = dialog.current;
    modal?.showModal();
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (!active.current || !canvas.current) return;
      const scale = Math.min(
        1,
        2048 / Math.max(image.naturalWidth, image.naturalHeight),
      );
      canvas.current.width = Math.max(
        1,
        Math.round(image.naturalWidth * scale),
      );
      canvas.current.height = Math.max(
        1,
        Math.round(image.naturalHeight * scale),
      );
      source.current = image;
      setReady(true);
    };
    image.onerror = () => {
      if (active.current)
        setError(t("This image could not be opened. Choose another image."));
    };
    image.src = url;
    return () => {
      active.current = false;
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(url);
      modal?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, [file, t]);
  useEffect(() => {
    const image = source.current;
    const context = canvas.current?.getContext("2d");
    if (!image || !context || !ready) return;
    drawMarks(context, image, marks);
  }, [marks, ready]);
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
      ),
      y: Math.max(
        0,
        Math.min(100, ((event.clientY - rect.top) / rect.height) * 100),
      ),
    };
  };
  async function save() {
    if (!canvas.current || saving) return;
    setSaving(true);
    setError("");
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.current!.toBlob(resolve, "image/png"),
      );
      if (!active.current) return;
      if (!blob) throw new Error("Could not save the image. Please try again.");
      const output = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, "") + ".png",
        { type: "image/png" },
      );
      await validateImage(output);
      if (active.current) await onSave(output);
    } catch (error) {
      if (active.current)
        setError(
          error instanceof Error
            ? t.text(error.message)
            : t("Could not save the image. Please try again."),
        );
    } finally {
      if (active.current) setSaving(false);
    }
  }
  const selected = marks[marks.length - 1];
  return (
    <dialog
      className="qb-annotation"
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") event.stopPropagation();
      }}
    >
      <header>
        <h2 id={titleId}>{t("Review image")}</h2>
        <button
          type="button"
          className="qb-icon-button"
          aria-label={t("Cancel image editing")}
          onClick={onCancel}
        >
          <Icon name="close" />
        </button>
      </header>
      <p>
        {t(
          "Draw a box, an arrow, a line or text, and blur or redact private information before attaching. Check the whole image: anything you do not cover stays visible.",
        )}
      </p>
      <div className="qb-annotation-tools" role="group" aria-label={t("Tool")}>
        {TOOLS.map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={tool === value}
            onClick={() => setTool(value)}
          >
            {t(label)}
          </button>
        ))}
        <label className="qb-annotation-color">
          {t("Color")}
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={!ready || saving}
          onClick={() =>
            setMarks([
              ...marks,
              {
                ...newMark(tool, 20, 20, color, t("Text")),
                x2: 50,
                y2: 40,
                ...(tool === "pen" && {
                  points: [
                    [20, 20],
                    [35, 30],
                    [50, 40],
                  ] as const,
                }),
              },
            ])
          }
        >
          {t(TOOLS.find(([value]) => value === tool)![2])}
        </button>
        <button
          type="button"
          disabled={!marks.length || saving}
          onClick={() => setMarks(marks.slice(0, -1))}
        >
          <Icon name="undo" />
          {t("Undo")}
        </button>
      </div>
      <canvas
        ref={canvas}
        aria-label={t(
          "Image preview. Draw with a pointer, or use the Add button and the position fields.",
        )}
        onPointerDown={(event) => {
          if (!ready || saving) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          start.current = point(event);
          setMarks([
            ...marks,
            newMark(tool, start.current.x, start.current.y, color, t("Text")),
          ]);
        }}
        onPointerMove={(event) => {
          if (!start.current) return;
          const p = point(event);
          setMarks((current) => {
            const last = current[current.length - 1]!;
            // Text stays where it was placed; a pen line grows by each point.
            if (last.tool === "text") return current;
            return [
              ...current.slice(0, -1),
              {
                ...last,
                x2: p.x,
                y2: p.y,
                ...(last.points && {
                  points: [...last.points, [p.x, p.y] as const],
                }),
              },
            ];
          });
        }}
        onPointerUp={() => {
          start.current = null;
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
      />
      {selected && selected.tool !== "pen" && (
        <fieldset disabled={saving}>
          <legend>{t("Last mark position (%)")}</legend>
          {selected.tool === "text" && (
            <label>
              {t("Text")}
              <input
                aria-label={t("Mark text")}
                maxLength={80}
                value={selected.text ?? ""}
                onChange={(event) => {
                  const text = event.target.value;
                  setMarks((current) =>
                    current.map((mark, i) =>
                      i === current.length - 1 ? { ...mark, text } : mark,
                    ),
                  );
                }}
              />
            </label>
          )}
          {POINTS.filter(
            ([key]) => selected.tool !== "text" || key === "x" || key === "y",
          ).map(([key, label, name]) => (
            <label key={key}>
              {t(label)}
              <input
                aria-label={t(name)}
                type="number"
                min="0"
                max="100"
                value={Math.round(selected[key])}
                onChange={(event) => {
                  const value = event.target.valueAsNumber;
                  if (Number.isFinite(value))
                    setMarks((current) =>
                      current.map((mark, i) =>
                        i === current.length - 1
                          ? {
                              ...mark,
                              [key]: Math.min(100, Math.max(0, value)),
                            }
                          : mark,
                      ),
                    );
                }}
              />
            </label>
          ))}
        </fieldset>
      )}
      {error && <p role="alert">{error}</p>}
      <footer>
        <button type="button" onClick={onCancel}>
          {t("Cancel")}
        </button>
        <button
          type="button"
          className="qb-primary"
          disabled={!ready || saving}
          onClick={() => void save()}
        >
          {saving ? t("Saving…") : t("Use image")}
        </button>
      </footer>
    </dialog>
  );
}
