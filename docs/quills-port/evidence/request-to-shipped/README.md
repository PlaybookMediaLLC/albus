# Request to shipped: screenshots

Taken in a real browser on the seeded `pnpm dev:demo` stack: one teammate and customers A (portal),
B (widget), C (blocked) and D (outside the segment that may see the board). Pull request:
PlaybookMediaLLC/kaneo#245.

## Requests become Kaneo tasks (RFC 0005)

"Create task" on the request page:

![Create task dialog](m1-create-task-dialog.png)

The new task in the request's Tasks section:

![Created task in the Tasks section](m2-created-task-in-tasks-section.png)

"Create task" and "Link existing task" on a roadmap card:

![Roadmap card task actions](m3-roadmap-card-task-actions.png)

The board's delivery project and trigger status:

![Board delivery project and rule](s2b-delivery-saved.png)

A teammate moved the request into the trigger status; the rule created the task as them:

![Request page shows the task the rule created](2b-request-page-shows-rule-task.png)
![Kaneo task created by the rule](3a-kaneo-task-from-rule.png)

The task was done in Kaneo; the request became complete:

![Request complete after the task is done](3c-request-complete-in-teammate-app.png)

## Status mail and move back

The status mail in the demo's Mailpit:

![Status mail in Mailpit](4a-mailpit-status-mail-customer-a.png)

The request moved back: the task stays, and Kaneo gets a comment:

![Request moved back; the task stays](7a-request-moved-back-task-stays.png)
![Kaneo task comment after the move back](7b-kaneo-task-comment-from-move-back.png)

## Widget roadmap mark (#109)

![Roadmap marks the customer's requests](p109a-customer-b-roadmap-for-you.png)
![Guest roadmap has no mark](p109b-guest-roadmap-no-mark.png)

## Launcher changelog (#108)

![Launcher announces a new entry](p108a-launcher-announces-new-entry.png)
![Badge cleared after opening](p108d-after-open-badge-cleared.png)
![Auto-open setting](p108e-teammate-turns-auto-open-on.png)
![Widget opens the newest entry once](p108f-widget-opens-newest-entry-once.png)

## Send update (#92)

The preview counted one email. Only customer A got it; the teammate, C (blocked), D (cannot see
the board) and B (no longer following) got none. Without the release confirmation nothing is sent.

![Send update dialog with counts](8a-send-update-dialog-with-counts.png)
![Send update needs the release confirmation](8b-send-update-needs-confirmation.png)
![The update as a team comment](8c-update-as-page-comment.png)
