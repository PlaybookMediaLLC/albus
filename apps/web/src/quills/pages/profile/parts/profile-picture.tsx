import { ImageUp } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { PersonAvatar } from "../../../ui/person-avatar";
import { Button, Card, CardContent } from "../../../ui/upstream";

export interface ProfilePictureProps {
  name: string;
  avatarUrl: string | null;
  busy: boolean;
  failed: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

/** The customer's profile picture with Upload or Replace, and Remove when one is set. */
export function ProfilePicture(props: ProfilePictureProps) {
  const { t } = useTranslation("quills");
  const input = useRef<HTMLInputElement>(null);
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <PersonAvatar
          colored
          name={props.name}
          avatarUrl={props.avatarUrl}
          className="size-14 text-base"
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">
            {t("profile.picture.title")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("profile.picture.text")}
          </p>
          {props.failed ? (
            <p
              role="alert"
              className="mt-1 text-sm text-destructive-foreground"
            >
              {t("profile.picture.failed")}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {props.avatarUrl ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={props.busy}
              onClick={props.onRemove}
            >
              {t("profile.picture.remove")}
            </Button>
          ) : null}
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) props.onUpload(file);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            loading={props.busy}
            onClick={() => input.current?.click()}
          >
            <ImageUp aria-hidden="true" />
            {t(
              props.avatarUrl
                ? "profile.picture.replace"
                : "profile.picture.upload",
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
