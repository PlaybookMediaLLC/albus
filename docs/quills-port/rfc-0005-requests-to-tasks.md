# RFC 0005: requests become Kaneo tasks

Status: phases 1 and 2 built (2026-11-17); phases 3 and 4 not started. Decisions 1–5 made
(2026-11-15), delegated by the owner; scope rule added (2026-11-15, section 1.1). Owner: to be
decided.

## 1. Summary

When a team plans a feedback request, the work happens in Kaneo projects. Today a teammate must
create the Kaneo task by hand and has no screen to link it. This RFC connects the two products:

1. A teammate creates a Kaneo task from a request, or links a request to an existing task.
2. A board rule creates the task when a request moves to a chosen status, for example Planned.
3. Task progress in Kaneo moves the request status, so the public roadmap and the voters follow.
4. Each board says which Kaneo project receives its work.

Terms in this RFC:

- **Request**: a Quills post (`quills.posts`). Customers see it on the portal.
- **Board**: a Quills feedback board (`quills.boards`).
- **Project**, **column**, **task**: Kaneo records (`public.project`, `public.column`,
  `public.task`). A task has a key such as `APP-12`; Kaneo calls it the ticket ID.
- **Support ticket**: a Quills support ticket. This RFC does not change support tickets. The
  UI says "task", never "ticket", for Kaneo work, so the two do not mix.

### 1.1 Scope rule: Quills code only, Quills → Kaneo

The owner set this rule on 2026-11-15, so that upstream Kaneo merges stay free of conflicts.

1. **Change only Quills code:**
   - `apps/api/src/quills/**`;
   - `apps/api/src/database/quills/**`, with the separate `drizzle/quills` history;
   - `apps/web/src/quills/**`;
   - `docs/quills-port/**`.
2. **Do not edit any Kaneo file.** This includes Kaneo API modules, the `public` schema and its
   migrations, Kaneo web screens, the Kaneo event bus and Kaneo notifications.
3. **Write into Kaneo only through Kaneo's existing exported code:**
   - The calls include `createTask`, task updates, comments, labels, relations, custom field
     values, external links and assets.
   - One Quills module, `quills/framework/platform-writes.ts`, wraps every Kaneo function that
     Quills calls. Next to it, `platform-reads.ts` already wraps the reads.
   - A contract test pins the wrapped signatures, so an upstream change fails in a test and not
     in production.
   - If a Kaneo function cannot be called without a Kaneo change, the feature falls back to what
     the existing code can do (usually a task comment), or it waits.
4. **Listen to Kaneo only through the existing `subscribeToEvent` seam**, from Quills code, as the
   task-done sync does in `quills/jobs/worker.ts`.
5. **Build the Quills → Kaneo direction first.** Kaneo → Quills features (a Kaneo action that
   changes the feedback app) wait, even when they need only Quills code.
6. **Check permissions in Quills before every write into Kaneo:**
   - project access with `accessibleProjectIds`;
   - the Kaneo capability with the shared `@kaneo/permissions` package.

   Quills does not rely on Kaneo route middleware that it does not run through.

Every item below is marked **Now** (Quills → Kaneo, Quills code only), **Later** (Kaneo → Quills,
still Quills code only) or **Out** (needs a Kaneo code or UI change). Section 6.2 and the Kaneo
task panel in 7.3 are affected.

## 2. What exists today

| Piece | Where | What it does |
|---|---|---|
| Board ↔ project links | `quills.board_projects`, `linkQuillsBoardToProject` | Many to many. **Also a visibility rule**: a linked board is visible only to teammates who can open one of its projects (`feedback/visibility.ts`). |
| Request ↔ task links | `quills.post_tasks` (with `source`: `manual`, `rule` or `import`; migration `0034_post_task_source`), `linkQuillsPostToTask`, `unlinkQuillsPostFromTask`, `listQuillsLinks` | Many to many. The link cascades when the task is deleted. Existing rows read as `manual`. `created_by` was not added: the audit row of `post.task_linked` names the actor. |
| Create a task from a request | `createQuillsPostTask` (POST `/posts/{postId}/tasks`, `feedback/post-tasks.ts`) | Phase 1. Creates the task as the caller through Kaneo's `createTask` controller, then links it and writes a `task.created` request activity row and `post.task_linked`. Needs Quills `update`, Kaneo `task:create` and access to the project; an archived project or a missing column answers 409. If the link write fails, the new task is deleted (`revert`). |
| The task that a request becomes | `integrations/post-task.ts#taskDraft` | Title, a Markdown description (request text, a link to `/feedback/{ws}/posts/{id}`, votes, companies, the top 3 segments and the linked conversations; no customer names and no revenue, because every project member reads the task and revenue needs `quills:view_revenue`), `posts.eta` as the due date, the request owner as assignee when Kaneo allows it, and the board's delivery priority (default `medium`). Labels from tags are not set yet. |
| A request's tasks | `listQuillsPostTasks` (GET `/posts/{postId}/tasks`) | Phase 1. The key, title, column and assignee of each linked task in a project that the caller can open, and a `hidden` count of the others. It replaces the 100-link scan of the request page. |
| Kaneo writes | `quills/framework/platform-writes.ts` | The one module that calls Kaneo's `createTask`, `createComment` and `deleteTask` controllers (scope rule 3). `platform-reads.ts#taskTarget` checks the teammate's Kaneo `task:create`, project access, a live project, Kaneo's plan check and the column first. The typecheck pins the controller signatures. |
| Request page Tasks section | `pages/team-post/parts/post-links.tsx`, `linked-task.tsx`, `ui/post-tasks/*` | Each linked task with its key, title, column and assignee, "Unlink", "Create task" (project, column and title; the board's delivery project is the default) and "Link existing task" (Kaneo's own task search). Hidden tasks show as a count. |
| Roadmap card actions | `pages/team-roadmap/parts/roadmap-card-body.tsx` | Phase 1. "Create task" and "Link existing task" in the card menu open the same dialogs. The task chip (7.4) is phase 3. |
| Board delivery project and rule | `boards.settings.delivery`, `setQuillsBoardDelivery`, `clearQuillsBoardDelivery`, `getQuillsBoardSettings`, `pages/team-boards/parts/delivery-form.tsx` | Phase 2. The project, the column, the priority and the trigger status (off by default, decision 1). Saving needs `manage_settings` and Kaneo `task:create` in a live project. It never writes `board_projects`, so it never changes who sees the board (decision 4). |
| Creation rule | `integrations/task-rule-job.ts` (`taskRuleDue` in the fan-out, `runTaskRuleJob` on `quills.workflow`) | Phase 2. After a teammate's `post.status_changed` commits into the trigger status, one job creates the task as that teammate and links it with `source: rule`. A change without a teammate or from task sync (`payload.source`) does nothing. One task per request and project: the job skips a request that already links a task in the project, and a `task-rule:{post}:{project}` delivery ledger row stops retries and later moves. An attempt that stopped between Kaneo's commit and the link write leaves the row `processing`: the retry links the task whose description links the request (created in the last day), or creates it when Kaneo has none. A change made with a scoped API key records the task actions the key allows (`keyTasks`); the job creates or comments only within them. |
| Rule failure | `task.create_failed` request activity row, `post.task_create_failed` event, in-app notification `task_create_failed` | Phase 2. A missing permission, an archived project, a deleted column, the plan check or a Kaneo refusal is final at once; another error retries 3 times first. Only the teammate who moved the request is told. |
| Request moves back | `integrations/task-rule-job.ts` (rule `comment`) | Decision 3. A teammate's move to a closed status, from complete to active, or to an earlier active status comments once on each linked task that the teammate may update. The task stays. `setQuillsPostStatus` now records `previousStatusId` in its event for this. |
| Task done → request status | `integrations/task-sync.ts`, `task-sync-job.ts`, board setting `taskSync.statusOnTaskDone` | When a linked task enters a final column, a durable Quills job sets the request to the mapped status. The existing fanout then notifies voters. |
| Request target date | `posts.eta` | The roadmap shows it; a new task gets it as its due date. |
| Send an update (#92) | `previewQuillsPostUpdate`, `sendQuillsPostUpdate` (`feedback/post-updates.ts`, `integrations/post-update.ts`), `quills.post_updates` (migrations `0036_post_updates`, `0037_drop_update_recipients`), `team/post-update/*` (request menu → "Send update") | One message on every chosen channel: a public team comment on the request, mail to the followers (`PostUpdateEmail`), a reply in each linked conversation (it never reopens or claims it, and that customer gets no mail), and Slack connections that send the board's comments. Segment and language targets. The preview counts with the same steps as the send, and the send's mail goes out in pages of 500 followers with no cap (`jobs/handlers/update-mail.ts`); the mail worker checks each address and the request's visibility at send time. Up to 1,000 followers the preview checks each one, so its email count is exact; above that it counts the matching followers and says so (`emailEstimated`). Needs Quills `update` and `manage_settings` (no `quills:release` permission exists; adding one changes Kaneo-owned `packages/permissions`) and an explicit "this shipped" confirmation, because no verified release record exists yet (#11). A repeated idempotency key returns the first send. At most 100 linked conversations per send. |
| Kaneo task creation | `task/controllers/create-task.ts`, capability `createTasks: { task: ["create"] }` | Needs the project, the creator, the title and a column status; publishes `task.created`. Quills calls it only through `platform-writes.ts`. |

Not built yet: the "Create task?" suggestion for a change without a teammate (decision 2; no such
status change reaches the rule today except task sync, which already links its task), labels from
tags, moving links on a merge (4.3), the bulk action, the backfill and everything in phases 3 and 4.

## 3. Goals and non-goals

Goals:

1. A teammate makes a Kaneo task from a request in one action, with a useful description and a
   link back.
2. A board rule can do it automatically when a request enters a status.
3. Kaneo progress keeps the request status, the roadmap and the voters current.
4. Each request knows its tasks, and each task knows its requests.
5. Nothing leaks: customers never see task data, and a teammate never sees a project that they
   cannot open.

Non-goals (first version):

1. Two-way field sync of titles and descriptions. The task is a copy at creation time.
2. Tasks in external trackers (GitHub, Linear, Jira). Those integrations stay as they are.
3. Automatic tasks for support tickets.

## 4. How projects are apportioned

### 4.1 Options

| Option | How it works | Good for | Risk |
|---|---|---|---|
| A. Board delivery project | Each board names one **delivery project**. New tasks go there. | One board per product area (Mobile, Web, API). Simple to explain. | A shared board ("All feedback") still needs a choice per request. |
| B. Tag routing | Rules map a tag to a project ("Mobile" → Mobile app). Board default as fallback. | One big board with tags. | Two tags can point at two projects; needs an order. |
| C. Choice per request | The teammate picks the project when they create the task. | Rare or cross-team work. | Not possible in an automatic rule. |

### 4.2 Recommendation

- Use **A** first, with **C** as the manual override. Add **B** in a later phase if teams ask
  for it.
- Store the delivery project in the board settings (`delivery.projectId`), **not** as a new
  `board_projects` row.
- **Why:** `board_projects` hides a board from every teammate who cannot open the linked
  project. If the delivery choice wrote that link, a team that picks a private project would
  hide its feedback board from support staff by accident.
- The settings UI must say this when someone adds a visibility link.
- To save the delivery project, the person who saves needs two things:
  - the Quills settings permission;
  - Kaneo `task:create` in that project.
- The project must belong to the same workspace and must not be archived.

### 4.3 Many to many

- **One task for many requests:** "Link existing task" adds a `post_tasks` row. Use it for
  duplicates and for one feature that answers several requests. Merging requests moves the links
  to the kept request.
- **Many tasks for one request:** one request can need work in two projects (web and mobile).
  The request stays at its status until **every** linked task is done. See 6.2.

## 5. Creating a task

### 5.1 Manual: "Create task"

The action shows on the request page (Tasks section), in the roadmap card menu, and as a bulk
action on the Requests list. It needs:

1. Quills `update` on the request.
2. Kaneo `task:create` in the chosen project, checked by Kaneo for the acting teammate.

The dialog shows the project (default: the board's delivery project), the column (default: the
first non-final column by position), and the fields from 5.3, which the teammate can edit.

### 5.2 Automatic: board rule

A board rule adds three settings next to `taskSync`:

- the trigger status: "When a request moves to [Planned]";
- the project, which defaults to the delivery project;
- the column.

The flow:

1. Every way a status changes reaches the same route, `setQuillsPostStatus`:
   - a roadmap drag or menu,
   - the request page and bulk edit,
   - the API, MCP, and an Autopilot accept.

   The route already records `post.status_changed` in the transactional outbox.
2. A new fanout subscriber reads the board rule. If the new status is the trigger status, it
   enqueues one `quills.create_task` job. It does this after the commit, so a rollback creates
   nothing.
3. The job runs as **the teammate who changed the status**.
   - It calls the Kaneo `createTask` controller with that user. Kaneo then applies its own
     permission rules, task numbers, positions and events.
   - It writes the `post_tasks` link and a request activity line in one Quills transaction, with
     `recordQuillsChange`.
4. **Idempotency:** a ledger key per request and rule stops a retry or a second move into the
   trigger status from making a second task. A request that already links a task in that project
   gets no new task.
5. **Failure:** the job retries 3 times. After that, the request activity says "No task was
   created: <reason>", and the actor gets an in-app notification. Typical reasons:
   - The actor lacks `task:create` in the project.
   - The project was archived.
   - The column was deleted.

### 5.3 What the task contains

| Task field | Source | Note |
|---|---|---|
| Title | Request title | Plain text, at most the Kaneo limit. |
| Description | Template | Request text, a link to `/feedback/{ws}/posts/{id}`, votes, number of companies, top segments, and the number of linked conversations. No MRR: revenue needs `quills:view_revenue`, and every project member reads the task. **No customer names or emails** — Kaneo project members do not need personal data to do the work, and the link shows it to those who may see it. |
| Column / status | Rule or dialog | Default: the first non-final column of the project. |
| Assignee | Request owner | Only if the owner is a member who can open the project; else empty. |
| Due date | `posts.eta` | Empty when the request has no target date. |
| Priority | Board default | First version: a fixed default per board (Kaneo `low` … `urgent`). A later phase can map RICE or demand to priority. |
| Labels | Request tags | Only tags whose name matches an existing project label. No new labels. |

## 6. Keeping both sides in step

### 6.1 Request → task

- **Request moves back** (Planned → Open, or Closed): the task stays. The job adds a Kaneo task
  activity line ("Request moved to Closed by …"). Quills never deletes or archives Kaneo work.
- **Requests merge:** the links move to the kept request. If both requests had tasks, both
  links stay, and the request page shows both tasks so a teammate can close the duplicate.
- **Request deleted** (soft delete): the links stay, so a restore brings them back. The
  Kaneo-side "Feedback" panel (7.3) hides deleted requests.

### 6.2 Task → request (Later: Kaneo → Quills)

The board setting grows from one value (`statusOnTaskDone`) to a column map, **per project**,
because each project has its own columns:

| Kaneo column | Request status |
|---|---|
| In progress | In Progress |
| Done (final) | Complete |

Rules:

1. **Several tasks:** a done-column mapping applies only when **all** live linked tasks are in
   final columns. Other mappings use the least advanced task. One open task keeps the request
   open.
2. **No loops:** a status change that the sync makes never triggers task creation, because the
   request already links that task. The job also marks the change as `source: "task-sync"`, so
   the creation rule skips it.
3. **A task moves to another project:** the link stays, because the task ID does not change. The
   column map of the new project applies, or none if it has no map.
4. **A task is deleted:** the link cascades, as today. The request activity notes it, and the
   request status does not change.
5. **The known gap stays:** a process that stops between the Kaneo commit and the Quills enqueue
   loses one sync (RFC 0003, open item 3). A reconciling sweep over `post_tasks` fixes that later.

## 7. Screens

1. **Board settings → Delivery:**
   - the delivery project, with a note that this does not change who sees the board;
   - the creation rule (trigger status, project, column, priority);
   - the column-to-status map per project.
2. **Request page → Tasks section:**
   - each linked task with its key, title, column and assignee;
   - "Create task", "Link existing task" (search by key or title in projects the viewer can
     open) and "Unlink".
   - An unavailable task shows as "A task in a project you cannot open".
3. **Out (scope rule): Kaneo task page → Feedback panel.** It needs a Kaneo screen. The
   `listQuillsTaskPosts` route still ships for the API and MCP (B.49).
   - the linked requests with their status, votes and a link to the teammate app;
   - this is the one new Kaneo-side screen;
   - it reads through a Quills route that checks Quills `read`, so Kaneo never reads the Quills
     schema directly.
4. **Roadmap card:** a small chip with the task key and its column color.
5. **Bulk on the Requests list:** "Create tasks" for the selected requests, with one summary of
   created, skipped (already linked) and failed tasks.
6. **Backfill:** in board settings, "12 Planned requests have no task. Create them now?". It is
   never automatic, so turning a rule on does not flood a project.

## 8. API and data

New or changed operations, all through `defineQuillsRoute`, with bounded Zod schemas and tests on
a real database:

| Operation | Purpose |
|---|---|
| `createQuillsPostTask` (POST `/posts/{postId}/tasks`) | Create a Kaneo task as the caller and link it. Body: optional `projectId`, `columnId`, field overrides. |
| `listQuillsPostTasks` (GET `/posts/{postId}/tasks`) | The linked tasks with the key, the title, the column and the assignee, filtered to projects the caller can open. Replaces the 100-link scan in `post-links.tsx`. |
| `listQuillsTaskPosts` (GET `/tasks/{taskId}/posts`) | The requests linked to a task, for the API and MCP tools (B.49). It is a Quills route; no Kaneo screen calls it. |
| Board settings | Add `delivery` (project, rule, priority) and `taskSync.columns` (per project: column ID → status ID). Keep reading `statusOnTaskDone` for existing installs. |

Data:

1. No new table for routing; the settings JSON holds it, as `taskSync` does today.
2. Add `post_tasks.source` (`manual` | `rule` | `import`) and `created_by` for the audit trail.
   This needs a Quills migration (`db:generate:quills`). Existing rows get `manual` and a null
   creator.
3. Events: `post.task_linked` and `post.task_unlinked` through `recordQuillsChange`. Kaneo keeps
   its own `task.created` and `task.moved` through `publishEvent`.

## 9. Edge cases and rules

1. A request in a private Kaneo project's task: the portal shows only the request status, never
   the task. A teammate without access sees "unavailable".
2. Workspace boundary: the project, the column and the task must be in the request's workspace.
   Every route checks this, and RLS enforces it.
3. Archived project or deleted column in a rule: settings show a warning, and the rule pauses
   instead of failing on every move.
4. The trigger status is deleted: the rule turns off and shows why.
5. A request moved to Planned by a customer-facing action (none exist today): the rule still
   runs as a teammate action only. A system change without an actor does not create tasks.
6. Rate: a bulk move of 200 requests creates up to 200 jobs. The queue runs them in order. The
   bulk dialog warns above 50.
7. Self-hosting: everything uses the existing database-backed job queue. Redis stays optional.
8. MCP and the API: the same rule runs, because they use the same status route.

## 10. Phases

| Phase | Scope | Value |
|---|---|---|
| 1 | "Create task" and "Link existing task" on the request page and the roadmap card; `createQuillsPostTask`, `listQuillsPostTasks`; the task description template. | Teams can plan in Kaneo today, by hand. |
| 2 | Board delivery project and the creation rule; `post_tasks.source`; failure activity and notification. | Planned requests become tasks automatically. |
| 3 | Roadmap task chip and the Quills screens for linked tasks (Now). Later: the column-to-status map per project, with the all-tasks-done rule (Kaneo → Quills). Out: the Kaneo task Feedback panel (section 1.1). | Requests show their work; progress sync follows when the scope allows it. |
| 4 | Bulk create, backfill, tag routing (option B), priority from demand. | Scale and fine control. |

## 11. Decisions

The owner asked the lead to decide. These hold until the owner changes them.

1. **Trigger status.**
   - The rule is off when a board is created.
   - When a teammate turns it on, the trigger status starts on the first status that shows on the
     roadmap (Planned in the seed), and the teammate can change it.
   - Why: a silent default would flood a project the first time someone drags a card.
2. **Creator.**
   - The job creates the task as the teammate who changed the status, so Kaneo's permissions,
     task numbers and activity log stay true.
   - A change without a teammate (a system or customer action) creates no task. It adds a
     "Create task?" suggestion on the request instead.
   - There is no automation user.
3. **Request moves back.**
   - The task stays, and the job adds a comment on it.
   - Quills never deletes, archives or moves Kaneo work on its own. Only a teammate in Kaneo
     does that.
4. **Delivery project versus visibility links.**
   - They are separate settings. The delivery project never changes who sees a board.
   - The settings page explains both.
5. **Priority.**
   - Phase 2: a fixed priority per board (default `medium`).
   - Phase 4: an opt-in demand rule raises a linked task one step when its demand passes a
     threshold. It never lowers a priority, and never overrides a priority that a teammate set
     in Kaneo after creation.

## 12. How we will check it

1. API integration tests on a real database:
   - the rule creates exactly one task across retries and repeated moves;
   - an actor without `task:create` gets no task and a clear activity line;
   - RLS keeps another workspace's projects out;
   - the all-tasks-done rule;
   - the merge of linked requests.
2. Web tests for the Tasks section, the dialog, the settings and the roadmap chip.
3. A browser check on the demo:
   - a request dragged to Planned gets a task in the delivery project;
   - moving that task to Done moves the request to Complete on the public roadmap;
   - the voters get the existing notification.

## Appendix A: connection catalog

What happens in Kaneo when a teammate (or a customer) does something in the feedback app.

### A.1 Rules for every connection

1. **Safe by default:**
   - A connection that changes a Kaneo field is off until a teammate turns it on.
   - A connection that only adds a comment, an activity line or a link is on.
2. **No data loss:** Quills never deletes, archives or moves Kaneo work, except where a row says
   so and a teammate turned it on.
3. **No personal data:**
   - Kaneo gets company names, counts and MRR. It never gets customer emails, names or message
     bodies.
   - The link back shows the rest to people who may see it.
4. **Little noise:**
   - Counts update in batches, at most every 15 minutes.
   - Customer activity arrives as one daily digest comment.
   - Thresholds fire once each.
5. **One path:**
   - Every connection is a fanout subscriber on a Quills outbox event.
   - It runs as a durable job with a ledger key, after the commit, as the acting teammate.
   - Without a teammate, it only adds a suggestion.
6. **Both logs:** each Kaneo change has a Kaneo activity line, and the request activity shows it
   too.

Default: **On**, **Off** (opt-in), **Manual** (a button), or **Suggest** (a prompt, never
automatic). The phases follow section 10.

### A.2 Request lifecycle

| # | When (feedback app) | Then (Kaneo) | Default | Phase |
|---|---|---|---|---|
| 1 | A request enters the board's trigger status | Create a task in the delivery project's first open column | Off | 2 |
| 2 | A teammate presses "Create task" (request page, roadmap card, triage row) | Create a task from the template | Manual | 1 |
| 3 | A teammate presses "Link existing task" | Link them, and add a backlink comment on the task | Manual | 1 |
| 4 | A request moves to a status that the column map names | Move the task to that column, only if it is in an earlier column | Off | 3 |
| 5 | A request is marked Complete while its tasks are open | Task comment "Request marked Complete by …", and notify the assignee through Kaneo's existing notification code (else the comment only) | On | 3 |
| 6 | A request is closed as "won't do" | Task comment and label `wont-do`; the task stays | On | 3 |
| 7 | A closed request opens again | Task comment | On | 3 |
| 8 | The request target date (ETA) is set or changed | Set the task due date, if it is empty or came from the ETA last time | On | 2 |
| 9 | The request title changes | Task activity line with the new title; no rename | On | 3 |
| 10 | The request details change | Task comment with a link to the change | Off | 3 |
| 11 | A request gets an owner | Task assignee, if the task has none and the owner can open the project | On | 2 |
| 12 | The request owner changes | Reassign the task, only if its assignee was the previous owner | On | 3 |
| 13 | A request moves to a board with another delivery project | Task comment; the "Move to project …" action lives on the Quills request page | On | 3 |
| 14 | A request is deleted | Task comment "Linked request deleted"; the link stays for a restore | On | 3 |
| 15 | A deleted request is restored | Task comment | On | 3 |
| 16 | Requests merge | Links move to the kept request; the two tasks get a `related` relation and a comment | On | 3 |
| 17 | A merge is undone | Links go back; task comment | On | 3 |
| 18 | A request enters or leaves a status shown on the public roadmap | Add or remove the label `public-roadmap` | On | 3 |
| 19 | A customer submits on a board marked "Create a task on submit" (for example Bugs) | Create the task at once | Off | 2 |

### A.3 Demand

| # | When (feedback app) | Then (Kaneo) | Default | Phase |
|---|---|---|---|---|
| 20 | Votes pass 25, 50 or 100 | Task comment "Demand reached 50 votes" | On | 3 |
| 21 | Demand passes the board's threshold | Raise the task priority one step; never lower it | Off | 4 |
| 22 | A company above the MRR threshold votes | Task comment with the company name and its MRR | On | 3 |
| 23 | A vote has the importance "blocker" | Label `customer-blocker` | On | 3 |
| 24 | A vote comes from a named segment (for example Enterprise) | The label with the segment name, if the project has it | Off | 4 |
| 25 | Votes, companies or MRR change | Update the project custom fields "Votes", "Companies" and "MRR at stake", in batches | On | 3 |
| 26 | A RICE score is saved | Custom field "RICE" | On | 3 |
| 27 | A teammate adds a vote for a customer | Task activity line "Vote added for Acme by …" | On | 3 |
| 28 | A customer follows the request | Custom field "Followers" | Off | 4 |
| 29 | A customer is blocked or removed | Recount the demand fields | On | 3 |
| 30 | Stripe, HubSpot or Segment updates a company's MRR | Recount "MRR at stake" on the linked tasks | On | 4 |

### A.4 Comments and conversations

| # | When (feedback app) | Then (Kaneo) | Default | Phase |
|---|---|---|---|---|
| 31 | A teammate writes an internal note on a request | The same note as a task comment, with a link | Off | 3 |
| 32 | A teammate posts the official reply on a request | Task comment "Customers were told: …" (first 280 characters) | On | 3 |
| 33 | Customers comment on a request | One daily digest comment: "4 new customer comments" | On | 3 |
| 34 | A teammate types a task key (APP-12) in a request comment or note | Link the request and the task, and add a backlink comment | On | 2 |
| 35 | A teammate types a task key in a support conversation | Add the conversation as an external link on the task, and a comment | On | 3 |
| 36 | A support conversation is linked to a request | Custom field "Conversations", and external links to them | On | 3 |
| 37 | **Out (scope rule):** a Kaneo task comment is marked "Share with customers" | Post it as a team update on the linked requests. It needs a Kaneo UI flag. | Off | — |

### A.5 Support tickets and incidents

| # | When (feedback app) | Then (Kaneo) | Default | Phase |
|---|---|---|---|---|
| 38 | A support ticket is escalated to engineering (status or type rule) | A task in the "Escalations" project, with a link to the ticket | Off | 4 |
| 39 | An escalated ticket's priority changes | Task priority | On | 4 |
| 40 | An escalated ticket's SLA is due soon | Task due date set to the SLA time, and label `sla-risk` | On | 4 |
| 41 | An escalated ticket breaches its SLA | Task comment, and notify the assignee | On | 4 |
| 42 | An escalated ticket is resolved | Task comment, with a suggestion to close the task | On | 4 |
| 43 | A resolved ticket opens again | Task comment, and label `reopened` | On | 4 |
| 44 | The customer replies on an escalated ticket | Daily digest comment, with no personal data | On | 4 |
| 45 | A widget bug report has a screenshot or files | Copy them to the task as attachments | On | 2 |
| 46 | A ticket linked to a task gets a low CSAT score | Task comment | On | 4 |
| 47 | A status-page incident opens | A task in the "Incidents" project with priority `urgent`; updates become comments, and the resolution moves it to the final column | Off | 4 |

### A.6 Changelog and shipping

| # | When (feedback app) | Then (Kaneo) | Default | Phase |
|---|---|---|---|---|
| 48 | "Draft from shipped requests" makes a changelog draft | External link to the draft on each linked task | On | 3 |
| 49 | A changelog entry is scheduled | Task comment "Release note scheduled for …" | On | 3 |
| 50 | A changelog entry is published | Label `announced`, and a comment with the public link | On | 3 |
| 51 | A changelog entry is unpublished | Remove `announced`, and add a comment | On | 3 |

### A.7 Triage, duplicates, Autopilot and AI

| # | When (feedback app) | Then (Kaneo) | Default | Phase |
|---|---|---|---|---|
| 52 | A duplicate is accepted in the Duplicates queue | The same as a merge (16): a `related` relation between their tasks | On | 3 |
| 53 | Autopilot makes a request in a status with a rule | No task; a "Create task?" suggestion for the next teammate who opens it | Suggest | 2 |
| 54 | An AI summary is made for a request | Update one marked "Customer summary" block in the task description | Off | 4 |
| 55 | Comments on a planned request turn negative over a week | Label `at-risk`, and a comment | Off | 4 |

### A.8 Boards, tags and statuses

| # | When (feedback app) | Then (Kaneo) | Default | Phase |
|---|---|---|---|---|
| 56 | A new board is created | Offer to make a matching Kaneo project, or to pick a delivery project | Suggest | 2 |
| 57 | A board is archived or deleted | Its rules pause, and the settings say why; no Kaneo change | On | 2 |
| 58 | The delivery project of a board changes | New tasks go to the new project; open tasks stay; show a summary | On | 2 |
| 59 | A post status is created, renamed or deleted | The column map marks the statuses that it does not map | On | 3 |
| 60 | A tag is created | A "Create matching label" action for the delivery project | Manual | 3 |
| 61 | A tag is added to or removed from a request | Add or remove the label of the same name on the linked tasks | On | 3 |
| 62 | A tag that was created with a label is renamed | Rename that label | Off | 4 |

### A.9 Help center, surveys and integrations

| # | When (feedback app) | Then (Kaneo) | Default | Phase |
|---|---|---|---|---|
| 63 | A help article gets "not helpful" votes past a threshold, or is marked outdated | A task in the "Docs" project, with a link | Off | 4 |
| 64 | A request ships, and no help article links to it | A "Write docs" subtask under its task | Off | 4 |
| 65 | A survey closes | A research task "Review the results (N answers)", with a link | Off | 4 |
| 66 | A request already has a GitHub or Linear issue from a Quills integration | Link that issue on the Kaneo task, so there is one piece of work; Kaneo's GitHub workflow rules then move the task when the pull request merges | On | 3 |

## Appendix B: 50 features that connect Kaneo and Quills

Appendix A lists events from the feedback app into Kaneo. This appendix lists product features
that use those links in both directions. Each feature follows the rules in A.1: no personal data
in Kaneo, permission checks in both products, and no silent changes to Kaneo work.

Direction: **Q→K** (feedback app to Kaneo), **K→Q** (Kaneo to the feedback app), or **Both**.
Size: **S** (days), **M** (one to two weeks), **L** (more). The phase says when it can start
after section 10.

### B.1 Planning and roadmap

| # | Feature | What it does | Direction | Size | Phase |
|---|---|---|---|---|---|
| 1 | Feedback intake view in Kaneo | A Kaneo project view lists the most requested open requests of its boards that have no task, with a "Plan" button. | Q→K | M | 3 |
| 2 | Drag to plan | A teammate drags a request from the intake view into a Kaneo column. This creates the task and sets the request status. | Both | M | 3 |
| 3 | Roadmap by project | The teammate roadmap can group cards by Kaneo project instead of by status. | K→Q | M | 3 |
| 4 | Target date from tasks | An opt-in rule sets the request ETA to the latest due date of its open linked tasks, so the public roadmap shows a real month. | K→Q | S | 3 |
| 5 | Calendar feed with requests | The Kaneo project calendar feed adds the ETAs of linked requests as events. | Q→K | S | 4 |
| 6 | Subtask progress on requests | The request page shows "3 of 5 subtasks done" from the linked tasks. | K→Q | S | 3 |
| 7 | Public progress | On boards that turn it on, the portal shows a progress bar for In Progress requests. It shows only the share done, never task titles. | K→Q | M | 4 |
| 8 | Blocked requests | A `blocks` relation between linked tasks shows on the request as "Waiting on other work" (team only). | K→Q | S | 3 |
| 9 | Iteration buckets | Kaneo labels such as `sprint-12` map to the roadmap date buckets (This month, Next month). | K→Q | M | 4 |
| 10 | Load on the roadmap | Planned cards on the teammate roadmap show the delivery project's open task count and the assignee's load. | K→Q | M | 4 |

### B.2 Priority and insight

| # | Feature | What it does | Direction | Size | Phase |
|---|---|---|---|---|---|
| 11 | Revenue at stake per project | Insights and the Kaneo project overview show the MRR of customers who wait on open linked tasks. | Both | M | 3 |
| 12 | Asked but not planned | A report per project lists the requests on its boards with many votes and no task. | Q→K | S | 3 |
| 13 | Delivery funnel | A chart from request to task, to done, to changelog, with the count at each step. | Both | M | 4 |
| 14 | Lead time | The median time between "request created", "task created", "task done" and "announced", per project and per board. | Both | M | 4 |
| 15 | Shipped impact | When a task is done, a summary shows the voters notified, the companies and the MRR it served. | K→Q | S | 3 |
| 16 | Churn risk flag | A company whose MRR drops to zero while it waits on open tasks flags those tasks with a comment. | Q→K | S | 4 |
| 17 | Late with high demand | A task past its due date with demand above the board threshold alerts the request owner in Quills. | K→Q | S | 3 |

### B.3 Working together

| # | Feature | What it does | Direction | Size | Phase |
|---|---|---|---|---|---|
| 18 | Feedback panel actions | From the Kaneo task Feedback panel, a teammate can open, unlink or add requests without leaving Kaneo. | K→Q | S | 3 |
| 19 | One notification center | The Kaneo notification center shows feedback events for tasks that a teammate owns, with the same preferences. | Both | M | 4 |
| 20 | Mentions across apps | @mention a teammate in a Quills note, and they get a Kaneo notification with a deep link, and the reverse. | Both | M | 4 |
| 21 | Customer update from Kaneo | The Feedback panel has a composer. Its text goes to all linked requests as the official team update. | K→Q | M | 4 |
| 22 | Close-the-loop checklist | When a linked task is done, Kaneo shows a short checklist: notify voters, publish the changelog, update the help article. Each item links to its Quills screen. | Both | S | 3 |
| 23 | Ask the voters | From a task, a teammate asks the voters of the linked requests a question by email or portal. The answers come back as request comments. | K→Q | M | 4 |
| 24 | Beta group | From a task, invite the voters of linked requests to a beta. Quills keeps the group as a segment and tracks who joined. | K→Q | M | 4 |
| 25 | "Did this solve it?" | After the release, a one-question survey goes to the voters. The result shows on the task and the request. | Both | M | 4 |
| 26 | Chat routing | Kaneo chat integrations (Slack, Discord, Mattermost, Telegram) post feedback-linked task updates to the channel of the request's board. | Both | M | 4 |

### B.4 Search and navigation

| # | Feature | What it does | Direction | Size | Phase |
|---|---|---|---|---|---|
| 27 | One search | Cmd+K in Kaneo finds requests, and Cmd+K in the feedback app finds tasks. Both filter by permission. | Both | M | 3 |
| 28 | App switcher | The Kaneo sidebar shows Feedback with its counts, and the feedback rail shows Projects with the open task count. | Both | S | 3 |
| 29 | Hover cards | Hover a task key in Quills to see its column, assignee and due date. Hover a request link in Kaneo to see its votes and status. | Both | S | 3 |
| 30 | Back links | A task opened from a request has a "Back to request" chip, and the reverse. | Both | S | 2 |

### B.5 Customers and accounts

| # | Feature | What it does | Direction | Size | Phase |
|---|---|---|---|---|---|
| 31 | Who is waiting | The task Feedback panel lists the companies with their plan and MRR, for teammates who may read Quills. | Q→K | S | 3 |
| 32 | Customer commitments | Mark a request "committed to Acme by a date". Its task gets the label `commitment`, the due date and a "Commitment" field. | Q→K | S | 3 |
| 33 | Account work view | The company page in Quills lists the linked Kaneo tasks of its requests and their progress, for account managers. | K→Q | M | 3 |
| 34 | Segment portfolio | A report shows which projects serve the demand of each segment, such as Enterprise or Beta. | Both | M | 4 |
| 35 | Plan-based weight | Votes from paid plans can count more in the demand fields that Kaneo shows. A board setting turns this on. | Q→K | S | 4 |

### B.6 Support and incidents

| # | Feature | What it does | Direction | Size | Phase |
|---|---|---|---|---|---|
| 36 | Engineering triage column | Tasks from escalated tickets land in a "Triage" column with an SLA badge on the card. | Q→K | M | 4 |
| 37 | Known issues | A task with the label `known-issue` shows as a known issue on the portal status page and in the help center, with the number of linked tickets. | K→Q | M | 4 |
| 38 | Deflection | When a new conversation matches a known-issue task, the widget and the inbox suggest "A fix is in progress". | K→Q | L | 4 |
| 39 | Status in replies | A support macro inserts the customer-safe status of a linked task, for example "Our team is working on it". | K→Q | S | 3 |
| 40 | Postmortem task | When an incident is resolved, Kaneo gets a postmortem task with the timeline of the status-page updates. | Q→K | S | 4 |

### B.7 AI

| # | Feature | What it does | Direction | Size | Phase |
|---|---|---|---|---|---|
| 41 | Task spec from feedback | AI writes the task description from the request, its linked conversations and its top comments. It has a problem, user stories and acceptance criteria, and a teammate reviews it first. | Q→K | M | 3 |
| 42 | Duplicate across apps | A new request that matches an existing task gets a "Link to APP-12?" suggestion. | K→Q | M | 4 |
| 43 | Richer release notes | The changelog AI draft also reads the done tasks and their subtasks, not only the requests. | K→Q | S | 3 |
| 44 | Effort estimate | AI suggests the RICE effort from the time entries of similar past tasks. | K→Q | M | 4 |
| 45 | Weekly product digest | A weekly summary for product managers: what customers asked, what shipped, and what is blocked. It covers both apps. | Both | M | 4 |

### B.8 Admin, data and the API

| # | Feature | What it does | Direction | Size | Phase |
|---|---|---|---|---|---|
| 46 | Setup wizard | One guided screen maps boards to delivery projects and columns to statuses, and shows who will see each board. | Both | M | 2 |
| 47 | Task templates per board | Each board can have a Kaneo task template: description sections, labels, custom fields and a subtask checklist. | Q→K | M | 3 |
| 48 | Effort from time entries | Kaneo time entries on linked tasks add up into the request's "Cost to deliver" and, by choice, its RICE effort. | K→Q | S | 4 |
| 49 | API and MCP tools | Public API routes and MCP tools: `create_task_from_request`, `link_request_task`, `list_task_requests`, `list_request_tasks`. | Both | M | 3 |
| 50 | Planning export | A CSV that joins requests, tasks, statuses, demand and MRR for planning reviews. | Both | S | 3 |

### B.9 Scope of the 50 features (section 1.1)

- **Now** (Quills → Kaneo, Quills code only), 12 features:
  - 12 asked but not planned
  - 16 churn risk flag
  - 25 "Did this solve it?" (it starts on a Quills changelog publish)
  - 32 customer commitments
  - 35 plan-based weight
  - 36 engineering triage column
  - 40 postmortem task
  - 41 task spec from feedback
  - 46 setup wizard
  - 47 task templates per board
  - 49 API and MCP tools
  - 50 planning export
- **Later** (Kaneo → Quills, Quills code only), 25 features. Some are only the Quills half of a
  feature for both apps:
  - 3, 4, 6, 7, 8, 9, 10
  - 11 (only the Insights half)
  - 13, 14, 15, 17
  - 27 (only Cmd+K in Quills)
  - 28 (only the Projects link in the Quills rail)
  - 29 (only the hover cards in Quills)
  - 33, 34, 37, 38, 39, 42, 43, 44, 45, 48
- **Out** (needs a Kaneo code or UI change), 13 features:
  - 1, 2: intake view and drag to plan in Kaneo
  - 5: Kaneo calendar feed
  - 18: Feedback panel actions
  - 19: one notification center
  - 20: mentions across apps
  - 21: customer update from Kaneo
  - 22: close-the-loop checklist
  - 23, 24: actions on a Kaneo task
  - 26: Kaneo chat integrations
  - 30: back links on the Kaneo task
  - 31: who is waiting, in the Kaneo panel

Appendix A: all 66 connections are **Now**, except 37 (**Out**). Their only Kaneo effects are
writes through the wrapped Kaneo functions.
