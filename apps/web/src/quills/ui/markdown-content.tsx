import { useMemo } from "react";
import { Markdown, cn } from "./upstream";

export interface MarkdownContentProps {
  content: string;
  /** Overrides, such as a smaller size for comments. */
  className?: string;
  /** Text that a customer wrote. It shows no images, so no remote image can track readers. */
  customer?: boolean;
}

export function MarkdownContent({
  content,
  className,
  customer,
}: MarkdownContentProps) {
  // Long threads re-render often. The same element lets React skip parsing unchanged text.
  const markdown = useMemo(
    () => (
      <Markdown
        skipHtml
        components={{ h1: "h2" }}
        disallowedElements={customer ? ["img"] : undefined}
      >
        {content}
      </Markdown>
    ),
    [content, customer],
  );
  return (
    <div
      // A customer's text keeps its own direction, so Arabic reads right to left in any layout.
      dir={customer ? "auto" : undefined}
      className={cn(
        // kaneo-comment-editor-prose is Kaneo's rendered-comment typography: lists, markers, inline
        // code, pre and tables. The classes after it set the Quills sizes and spacing.
        "kaneo-comment-editor-prose",
        "portal-prose break-words text-base leading-relaxed [&>*+*]:mt-4 [&_a]:text-primary [&_a]:underline [&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:bg-muted [&_pre]:p-4 [&_blockquote]:border-s-2 [&_blockquote]:border-border [&_blockquote]:ps-5 [&_blockquote]:text-muted-foreground [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_hr]:my-6 [&_hr]:border-border [&_img]:max-w-full [&_img]:rounded-lg",
        className,
      )}
    >
      {markdown}
    </div>
  );
}
