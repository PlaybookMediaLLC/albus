import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  launchBrowser,
  click,
  fill,
  visible,
  hidden,
  value,
  urlMatches,
  jsonRequest,
  until,
  selector,
  saveFailure,
} from "@kaneo/browser-test";
import { origin, tls, runBrowser } from "./browser.mjs";

async function post(page, path, body) {
  return jsonRequest(page, `/api/${path}`, "POST", body);
}
async function signUp(page) {
  await page.goto(`${origin}/auth/sign-up`);
  const suffix = randomUUID();
  const email = `task-${suffix}@example.com`;
  await post(page, "auth/sign-up/email", {
    name: "Task Tester",
    email,
    password: `Browser-test-${suffix}`,
  });
  return email;
}
async function createWorkspace(page) {
  await signUp(page);
  const workspace = await post(page, "auth/organization/create", {
    name: "Task test workspace",
    slug: `browser-${randomUUID()}`,
  });
  await post(page, "auth/organization/set-active", {
    organizationId: workspace.id,
  });
  await page.goto(`${origin}/dashboard/workspace/${workspace.id}`);
  return workspace.id;
}
async function createProject(page) {
  await click(page, { by: "role", role: "link", name: "All projects" });
  await urlMatches(page, /\/projects$/);
  await click(
    page,
    { by: "role", role: "button", name: "Create project" },
    { first: true },
  );
  await fill(
    page,
    { by: "placeholder", name: "Project name" },
    "Browser project",
  );
  await click(page, { by: "role", role: "button", name: "Create Project" });
  await urlMatches(page, /\/project\/[^/]+\/board$/);
  await visible(page, { by: "title", name: "Add task" }, { first: true });
  return page.url();
}
async function createTask(page, title) {
  await click(page, { by: "title", name: "Add task" }, { first: true });
  await fill(page, { by: "placeholder", name: "Task title" }, title);
  await click(page, { by: "role", role: "button", name: "Create Task" });
  await hidden(page, { by: "placeholder", name: "Task title" });
  await visible(page, { by: "text", name: title });
}
async function enabled(page, target) {
  await until(async () => {
    const css = await selector(page, target);
    return (
      css && page.evaluate((css) => !document.querySelector(css).disabled, css)
    );
  }, `Enable ${target.name}`);
}
// The panel a disclosure button opens, as a CSS selector for `within`.
async function controlled(page, trigger) {
  return until(async () => {
    const css = await selector(page, trigger);
    return (
      css &&
      page.evaluate((css) => {
        const id = document.querySelector(css).getAttribute("aria-controls");
        return id && `#${CSS.escape(id)}`;
      }, css)
    );
  }, `Panel for ${trigger.name}`);
}
async function editTask(browser, page, title, updated) {
  await click(page, { by: "text", name: title });
  const input = { by: "placeholder", name: "Click to add a title" };
  await value(page, input, title);
  await page.waitForFunction(() => {
    const node = document.querySelector('[placeholder="Click to add a title"]');
    return node && !node.disabled && !node.readOnly;
  });
  await browser
    .monitor(page)
    .response(/^\/api\/task\/title\//, "PUT", () => fill(page, input, updated));
}

test(
  "create a project and task, then persist a task edit",
  { timeout: 90_000 },
  () =>
    runBrowser("task-persistence", async ({ browser, page }) => {
      await createWorkspace(page);
      const boardUrl = await createProject(page);
      await createTask(page, "Plan the release");
      await editTask(
        browser,
        page,
        "Plan the release",
        "Release plan approved",
      );
      await page.reload();
      await value(
        page,
        { by: "placeholder", name: "Click to add a title" },
        "Release plan approved",
      );
      await page.goto(boardUrl);
      await visible(page, { by: "text", name: "Release plan approved" });
      await hidden(page, { by: "text", name: "Plan the release" });
    }),
);

test(
  "another workspace member receives task edits in realtime",
  { timeout: 120_000 },
  () =>
    runBrowser("realtime", async ({ browser, page }) => {
      const workspaceId = await createWorkspace(page);
      const boardUrl = await createProject(page);
      await createTask(page, "Collaborative task");
      const colleague = await launchBrowser({ ignoreHTTPSErrors: tls });
      let observer;
      try {
        observer = await colleague.newPage();
        const email = await signUp(observer);
        const invitation = await post(page, "auth/organization/invite-member", {
          organizationId: workspaceId,
          email,
          role: "member",
        });
        await post(observer, "auth/organization/accept-invitation", {
          invitationId: invitation.id,
        });
        await post(observer, "auth/organization/set-active", {
          organizationId: workspaceId,
        });
        assert.notDeepEqual(
          await colleague.context.cookies(origin),
          await browser.context.cookies(origin),
          "Members must have isolated sessions",
        );
        const projectId = new URL(boardUrl).pathname
          .split("/project/")[1]
          .split("/")[0];
        const monitor = colleague.monitor(observer);
        await observer.goto(boardUrl);
        await visible(observer, { by: "text", name: "Collaborative task" });
        await until(
          () =>
            [...monitor.sockets.values()].some(
              (socket) =>
                new URL(socket.url).pathname === `/api/ws/${projectId}` &&
                socket.open &&
                socket.ping,
            ),
          "Project websocket keepalive",
          45_000,
        );
        const start = monitor.frames.length;
        await editTask(
          browser,
          page,
          "Collaborative task",
          "Updated by my teammate",
        );
        await until(
          () =>
            monitor.frames.slice(start).some((frame) => {
              if (new URL(frame.url).pathname !== `/api/ws/${projectId}`)
                return false;
              try {
                const event = JSON.parse(frame.payload);
                return (
                  event.type === "TASK_UPDATED" && event.projectId === projectId
                );
              } catch {
                return false;
              }
            }),
          "Real TASK_UPDATED websocket event",
        );
        // No navigation, reload, or focus change: the other member receives the update live.
        await visible(observer, { by: "text", name: "Updated by my teammate" });
        await hidden(observer, { by: "text", name: "Collaborative task" });
      } catch (error) {
        if (observer)
          await saveFailure(
            colleague,
            observer,
            new URL("../../.cache/e2e/realtime-observer/", import.meta.url)
              .pathname,
          );
        throw error;
      } finally {
        await colleague.close();
      }
    }),
);

test(
  "task timer persists across reloads and stops from task details",
  { timeout: 90_000 },
  () =>
    runBrowser("task-timer", async ({ browser, page }) => {
      await createWorkspace(page);
      await createProject(page);
      await createTask(page, "Track release work");
      await click(page, { by: "text", name: "Track release work" });
      const start = { by: "role", role: "button", name: "Start timer" };
      const stop = { by: "role", role: "button", name: "Stop timer" };
      const history = { by: "role", role: "button", name: "Time tracking" };
      const running = { by: "text", name: /^Running \d+s$/ };
      const monitor = browser.monitor(page);
      await enabled(page, start);
      await click(page, history);
      await visible(page, { by: "text", name: "No time logged yet." });

      const entry = await monitor.response(
        /^\/api\/time-entry\/?$/,
        "POST",
        () => click(page, start),
      );
      assert.equal(entry.endTime, null);
      await enabled(page, stop);
      await visible(page, running);

      await page.reload();
      await enabled(page, stop);
      await click(page, history);
      await visible(page, running);
      const stopped = await monitor.response(
        `/api/time-entry/${entry.id}`,
        "PUT",
        () => click(page, stop),
      );
      assert.notEqual(stopped.endTime, null);
      assert.ok(stopped.duration >= 0);
      await enabled(page, start);
      await hidden(page, stop);

      await page.reload();
      await enabled(page, start);
      await click(page, history);
      // The user's name is also in the sidebar; the single entry row is in this panel.
      const log = await controlled(page, history);
      await visible(page, { by: "text", name: "Task Tester", within: log });
      await hidden(page, { by: "text", name: /^Running /, within: log });
      const entries = await jsonRequest(
        page,
        `/api/time-entry/task/${entry.taskId}`,
      );
      assert.equal(entries.length, 1);
      assert.equal(entries[0].id, entry.id);
      assert.equal(entries[0].endTime, stopped.endTime);
      assert.equal(entries[0].duration, stopped.duration);
    }),
);
