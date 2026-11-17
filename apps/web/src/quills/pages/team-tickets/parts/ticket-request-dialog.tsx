import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useCreatePostFromTicket } from "../../../hooks/team/use-create-post-from-ticket";
import { useListBoards } from "../../../hooks/team/use-list-boards";
import { useTeamRuntime } from "../../../team/runtime";
import { TeamStateView } from "../../../team/team-state-view";
import { FormSelect } from "../../../ui/form-select";
import { IconButton } from "../../../ui/inbox/icon-button";
import { PortalForm } from "../../../ui/portal-form";
import {
  Dialog,
  DialogClose,
  DialogPopup,
  DialogTitle,
  Field,
  FieldLabel,
  Input,
  toast,
} from "../../../ui/upstream";

// The bounds of createQuillsPostFromTicket for a new post.
const schema = z.object({
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
});
type Values = z.infer<typeof schema>;

export interface TicketRequestDialogProps {
  ticketId: string;
  onClose: () => void;
}

/**
 * Records the ticket requester's request as a post on a board (#73). The API takes the customer
 * from the ticket and records the teammate and the source `ticket` in the post history.
 */
export function TicketRequestDialog({
  ticketId,
  onClose,
}: TicketRequestDialogProps) {
  const { t } = useTranslation("quills");
  const team = useTeamRuntime();
  const param = { workspaceId: team.workspaceId };
  // ponytail: the first 100 boards (the API maximum); page them when a workspace has more.
  const boards = useListBoards(
    { param, query: { counts: "false", offset: "0", limit: "100" } },
    team.viewer,
  );
  const create = useCreatePostFromTicket(team.viewer);
  const items = boards.data?.items ?? [];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPopup showCloseButton={false} className="sm:max-w-lg">
        <DialogTitle className="px-4 pt-4">
          {t("team-tickets.recordRequest")}
        </DialogTitle>
        <div className="p-4">
          <TeamStateView loading={boards.isPending} problem={boards.error}>
            <PortalForm<Values>
              schema={schema}
              defaultValues={{ boardId: items[0]?.id ?? "", title: "" }}
              submitKey="team-tickets.recordRequestSubmit"
              onSubmit={async (json) => {
                try {
                  await create.mutateAsync({
                    param: { ...param, ticketId },
                    json,
                  });
                } catch (problem) {
                  // 409: the requester is a teammate, a service or a test customer.
                  if ((problem as { kind?: string }).kind !== "conflict")
                    throw problem;
                  return {
                    kind: "invalid",
                    issues: [
                      { path: "", message: t("team-tickets.notCustomer") },
                    ],
                  };
                }
                toast.success(t("team-tickets.requestRecorded"));
                onClose();
              }}
            >
              {(form) => (
                <div className="grid gap-3">
                  <FormSelect
                    control={form.control}
                    name="boardId"
                    label={t("team-posts.board")}
                    options={items.map((board) => ({
                      value: board.id,
                      label: board.name,
                    }))}
                  />
                  <Field invalid={Boolean(form.formState.errors.title)}>
                    <FieldLabel htmlFor="ticket-request-title">
                      {t("team-tickets.requestTitle")}
                    </FieldLabel>
                    <Input
                      id="ticket-request-title"
                      {...form.register("title")}
                      aria-invalid={Boolean(form.formState.errors.title)}
                    />
                    {form.formState.errors.title?.message ? (
                      <p role="alert">{form.formState.errors.title.message}</p>
                    ) : null}
                  </Field>
                </div>
              )}
            </PortalForm>
          </TeamStateView>
        </div>
        <DialogClose
          render={
            <IconButton
              label={t("team-posts.close")}
              className="absolute end-3 top-3 rounded-full before:rounded-full"
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
      </DialogPopup>
    </Dialog>
  );
}
