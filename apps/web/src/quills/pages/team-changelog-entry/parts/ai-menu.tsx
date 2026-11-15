import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCreateAdminAssistantTransform } from "../../../hooks/team/use-create-admin-assistant-transform";
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
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
  toast,
} from "../../../ui/upstream";

/** The API rewrites at most this many characters at once. */
export const TRANSFORM_MAX = 8000;

/** The text to rewrite and where it is in the body. */
export interface RewriteTarget {
  text: string;
  start: number;
  end: number;
}

export interface AiMenuProps {
  workspaceId: string;
  /** The selected text of the body, else the whole body. */
  target: () => RewriteTarget;
  onApply: (text: string, target: RewriteTarget) => void;
}

type Kind =
  | "fix_grammar"
  | "rephrase"
  | "more_concise"
  | "expand"
  | "more_friendly"
  | "more_formal";

/** Rewrites the selected text or the body with AI. The user accepts the result first. */
export function AiMenu({ workspaceId, target, onApply }: AiMenuProps) {
  const { t } = useTranslation("quills");
  const transform = useCreateAdminAssistantTransform();
  const [result, setResult] = useState<{
    text: string;
    target: RewriteTarget;
  } | null>(null);
  const kinds: Array<[Kind, string]> = [
    ["fix_grammar", t("team-changelog.ai.fix_grammar")],
    ["rephrase", t("team-changelog.ai.rephrase")],
    ["more_concise", t("team-changelog.ai.more_concise")],
    ["expand", t("team-changelog.ai.expand")],
    ["more_friendly", t("team-changelog.ai.more_friendly")],
    ["more_formal", t("team-changelog.ai.more_formal")],
  ];
  const run = async (kind: Kind) => {
    const chosen = target();
    if (!chosen.text.trim() || chosen.text.length > TRANSFORM_MAX) {
      toast.error(t("team-changelog.ai.tooLong", { count: TRANSFORM_MAX }));
      return;
    }
    try {
      const rewrite = await transform.mutateAsync({
        param: { workspaceId },
        json: { kind, text: chosen.text },
      });
      setResult({ text: rewrite.text, target: chosen });
    } catch {
      toast.error(t("team-changelog.ai.failed"));
    }
  };
  return (
    <>
      <Menu>
        <MenuTrigger
          disabled={transform.isPending}
          render={<IconButton label={t("team-changelog.ai.open")} />}
        >
          <Sparkles aria-hidden="true" />
        </MenuTrigger>
        <MenuPopup align="end">
          {kinds.map(([kind, label]) => (
            <MenuItem key={kind} onClick={() => void run(kind)}>
              {label}
            </MenuItem>
          ))}
        </MenuPopup>
      </Menu>
      <Dialog
        open={Boolean(result)}
        onOpenChange={(open) => !open && setResult(null)}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>{t("team-changelog.ai.review")}</DialogTitle>
            <DialogDescription>
              {t("team-changelog.ai.reviewText")}
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <p className="whitespace-pre-wrap text-sm">{result?.text}</p>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("team-changelog.ai.cancel")}
            </DialogClose>
            <Button
              onClick={() => {
                if (result) onApply(result.text, result.target);
                setResult(null);
              }}
            >
              {t("team-changelog.ai.apply")}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
