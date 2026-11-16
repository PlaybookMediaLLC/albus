import { Lock, MessageSquareReply } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PortalProblem } from "../../../core/types";
import { uploadObject } from "../../../core/upload-object";
import { useAddConversationNote } from "../../../hooks/team/use-add-conversation-note";
import { useCreateFiles } from "../../../hooks/team/use-create-files";
import { useCreateUpload } from "../../../hooks/team/use-create-upload";
import { useReplyConversation } from "../../../hooks/team/use-reply-conversation";
import { useSendConversationTyping } from "../../../hooks/team/use-send-conversation-typing";
import { useTeamRuntime } from "../../../team/runtime";
import { AttachmentPicker } from "../../../ui/attachment-picker";
import { Composer } from "../../../ui/inbox/composer";
import { EmojiMenu } from "../../../ui/inbox/emoji-menu";
import type { ComposerMode } from "../../../ui/inbox/inbox-types";
import { useKeyShortcuts } from "../../../ui/inbox/use-key-shortcuts";
import { ActionProblem } from "./action-problem";

export interface ConversationComposerProps {
  workspaceId: string;
  conversationId: string;
  customerName: string;
}

type Mode = "reply" | "note";

// The customer sees "typing" for a few seconds after each marker, so one marker
// every few seconds keeps it on without a request per key.
const TYPING_INTERVAL = 4000;

/**
 * The composer at the bottom of the thread: a reply to the customer or an internal note, with
 * files. R and N choose the mode and focus the box. A reply tells the customer that it is being
 * typed. Files upload when the message is sent; a file keeps its upload if the send fails.
 */
export function ConversationComposer(props: ConversationComposerProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const reply = useReplyConversation(team.viewer);
  const note = useAddConversationNote(team.viewer);
  const typing = useSendConversationTyping(team.viewer);
  const lastTyping = useRef(0);
  const input = useRef<HTMLTextAreaElement>(null);
  const can = { reply: team.permissions.update, note: team.permissions.create };
  const [mode, setMode] = useState<Mode>(can.reply ? "reply" : "note");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProblem, setUploadProblem] = useState<PortalProblem | null>(
    null,
  );
  // A retry after a failed send reuses the files that already uploaded.
  const uploaded = useRef(new Map<File, string>());
  const sign = useCreateUpload();
  const register = useCreateFiles();
  const param = {
    workspaceId: props.workspaceId,
    conversationId: props.conversationId,
  };
  const focus = (next: Mode) =>
    can[next]
      ? () => {
          setMode(next);
          input.current?.focus();
        }
      : undefined;
  useKeyShortcuts({ r: focus("reply"), n: focus("note") });
  const modes: ComposerMode[] = [
    ...(can.reply
      ? [
          {
            value: "reply",
            label: t("team-conversations.reply"),
            icon: MessageSquareReply,
          },
        ]
      : []),
    ...(can.note
      ? [
          {
            value: "note",
            label: t("team-conversations.note"),
            icon: Lock,
            private: true,
          },
        ]
      : []),
  ];
  const sending = mode === "reply" ? reply : note;
  // Puts an emoji at the caret (or over the selection) and keeps the caret after it.
  const insert = (emoji: string) => {
    const box = input.current;
    const start = box?.selectionStart ?? text.length;
    const end = box?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      box?.focus();
      box?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };
  const upload = async (file: File) => {
    const saved = uploaded.current.get(file);
    if (saved) return saved;
    const target = { param: { workspaceId: props.workspaceId } };
    const contentType = file.type || "application/octet-stream";
    const signed = await sign.mutateAsync({
      ...target,
      json: {
        purpose: "file",
        filename: file.name,
        contentType,
        size: file.size,
      },
    });
    await uploadObject(file, signed);
    const { id } = await register.mutateAsync({
      ...target,
      json: { key: signed.key, name: file.name, contentType, size: file.size },
    });
    uploaded.current.set(file, id);
    return id;
  };
  const send = async () => {
    setUploadProblem(null);
    let attachmentIds: string[];
    setUploading(true);
    try {
      attachmentIds = await Promise.all(files.map(upload));
    } catch (problem) {
      setUploadProblem(problem as PortalProblem);
      return;
    } finally {
      setUploading(false);
    }
    const json = {
      content: text.trim(),
      ...(attachmentIds.length ? { attachmentIds } : {}),
    };
    const request = { param, json };
    const sent = text;
    const options = {
      // A file that retention removed (a retry a day later) is 404: upload again next time.
      onError: (problem: PortalProblem) => {
        if (problem.kind === "notFound") uploaded.current.clear();
      },
      onSuccess: () => {
        // Text typed while the files uploaded stays in the box.
        setText((current) => (current === sent ? "" : current));
        setFiles([]);
        uploaded.current.clear();
      },
    };
    if (mode === "reply") reply.mutate(request, options);
    else note.mutate(request, options);
  };
  return (
    <div className="mx-auto w-full max-w-200 px-4 pb-4">
      <Composer
        label={
          mode === "reply"
            ? t("team-conversations.replyTo", { name: props.customerName })
            : t("team-conversations.noteLabel")
        }
        value={text}
        onChange={(value) => {
          setText(value);
          if (mode !== "reply") return;
          if (Date.now() - lastTyping.current < TYPING_INTERVAL) return;
          lastTyping.current = Date.now();
          typing.mutate({ param });
        }}
        onSend={() => void send()}
        modes={modes}
        mode={mode}
        onModeChange={(value) => setMode(value as Mode)}
        sending={uploading || sending.isPending}
        disabled={!modes.length}
        inputRef={input}
        tools={
          <>
            <AttachmentPicker
              attachments={[]}
              files={files}
              disabled={uploading || sending.isPending || !modes.length}
              onFilesChange={setFiles}
              onRemove={() => undefined}
              onRemoveFile={(file) => {
                uploaded.current.delete(file);
                setFiles((list) => list.filter((item) => item !== file));
              }}
            />
            <EmojiMenu disabled={!modes.length} onPick={insert} />
          </>
        }
      />
      <ActionProblem problem={uploadProblem ?? sending.error} />
    </div>
  );
}
