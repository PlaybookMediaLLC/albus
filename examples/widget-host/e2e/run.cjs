// Widget E2E driver: drives the host app at 5290 and records evidence per feature.
// Usage: node e2e/run.cjs <group...>   Groups run in order and share one browser page.
// Full run: identity feedback changelog help conversations privacy negative extras sdk script unsigned teammate
const { chromium } = require("playwright");
const fs = require("fs");
const L = require("./lib.cjs");

const path = require("path");
const SHOTS = path.resolve(__dirname, "../../../docs/quills-port/widget-e2e");
const OUT = path.join(__dirname, "out");
fs.mkdirSync(OUT, { recursive: true });
const RESULTS = path.join(OUT, "results.json");
fs.mkdirSync(SHOTS, { recursive: true });
const results = fs.existsSync(RESULTS)
  ? JSON.parse(fs.readFileSync(RESULTS, "utf8"))
  : {};
const save = () => fs.writeFileSync(RESULTS, JSON.stringify(results, null, 2));
const STATE = path.join(OUT, "state.json");
const state = fs.existsSync(STATE)
  ? JSON.parse(fs.readFileSync(STATE, "utf8"))
  : {};
const saveState = () => fs.writeFileSync(STATE, JSON.stringify(state, null, 2));

let page, net, frame, browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => {
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
  return `widget-e2e/${name}.png`;
};
const log = () => page.locator("[data-testid=event-log]").innerText();
const hostButton = (name) => page.getByRole("button", { name, exact: true });
const navBar = () =>
  frame.getByRole("navigation", { name: "Widget navigation" });
/** Goes Back out of detail views until the bottom navigation shows, then opens the tab. */
const nav = (name) => ({
  async click() {
    for (
      let i = 0;
      i < 4 &&
      !(await navBar()
        .isVisible()
        .catch(() => false));
      i++
    ) {
      await frame
        .getByRole("button", { name: "Back", exact: true })
        .first()
        .click()
        .catch(() => {});
      await sleep(300);
    }
    await navBar().getByRole("button", { name, exact: true }).click();
    await sleep(500);
  },
});
const voteButton = (state) =>
  frame.getByRole("button", { name: new RegExp(`^${state}( · \\d+)?$`) });

async function openView(view, text = "", board = "") {
  await page.selectOption("[data-testid=open-view]", view);
  await page.fill("[data-testid=open-text]", text);
  await page.fill("[data-testid=open-board]", board);
  await hostButton("open").click();
  await sleep(1500);
}
async function signIn(user, variant = "valid") {
  const since = net.mark();
  await page.selectOption("[data-testid=variant]", variant);
  await page.selectOption("[data-testid=user]", user);
  if (user === "anonymous") return null;
  return net.wait("POST", /\/widget\/identify$/, 15000, since);
}
async function step(id, fn) {
  const started = new Date().toISOString();
  try {
    const out = await fn(started);
    results[id] = { ...out, at: started };
    console.log(
      `${out.result.toUpperCase().padEnd(5)} ${id}: ${out.actual ?? ""}`.slice(
        0,
        400,
      ),
    );
  } catch (error) {
    results[id] = {
      result: "fail",
      actual: `error: ${error.message.split("\n")[0]}`,
      at: started,
    };
    console.log(`FAIL  ${id}: ${error.message.split("\n")[0]}`);
    await page
      .screenshot({ path: path.join(OUT, `error-${id}.png`) })
      .catch(() => {});
  }
  save();
}
const owner = (principalUuid) => L.person(principalUuid);

const groups = {
  async identity() {
    await step("identity-anonymous", async (since) => {
      await page.goto(L.HOST + "/");
      await page.waitForSelector("[data-event=ready]");
      const mark = net.mark();
      await openView("home");
      const session = await net.wait(
        "POST",
        /\/widget\/anonymous-session$/,
        15000,
        mark,
      );
      const principal = L.toUuid(session.body.principalId);
      state.anonPrincipal = session.body.principalId;
      saveState();
      const who = owner(principal);
      const events = L.outbox([session.body.principalId], since);
      return {
        expected:
          "Opening the panel without identify starts an anonymous session: a new anonymous principal and customer, event user.created",
        actual: `POST /widget/anonymous-session ${session.status}; principal ${session.body.principalId} type=${who.type} anonymous=${who.anonymous}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ")}`,
        rows: { "quills.principal": principal },
        outbox: events.map((e) => e.id),
        shot: await shot("01-anonymous-home"),
        result:
          session.status === 200 &&
          who.type === "anonymous" &&
          events.some((e) => e.type === "user.created")
            ? "pass"
            : "fail",
      };
    });

    await step("identity-anonymous-vote", async (since) => {
      await nav("Feedback").click();
      await frame
        .getByRole("button", { name: /Portal demo feedback/ })
        .first()
        .click();
      const mark = net.mark();
      await voteButton("Vote").click();
      const vote = await net.wait(
        "PUT",
        /\/widget\/posts\/[^/]+\/vote$/,
        15000,
        mark,
      );
      const postId = vote.path.split("/")[3];
      state.demoPostId = postId;
      saveState();
      const rows = L.sql(
        `select id, principal_id from quills.post_votes where post_id = ${L.q(L.toUuid(postId))} and principal_id = ${L.q(L.toUuid(state.anonPrincipal))}`,
      );
      return {
        expected:
          "An anonymous visitor can vote (allowAnonymous is on); the vote row belongs to the anonymous principal",
        actual: `PUT vote ${vote.status} ${JSON.stringify(vote.body ?? vote.request)}; post_votes ${rows.map((r) => r[0]).join(",") || "none"} for anon principal`,
        rows: { "quills.post_votes": rows.map((r) => r[0]).join(",") },
        outbox: L.outbox([postId], since).map((e) => `${e.type}#${e.id}`),
        shot: await shot("02-anonymous-vote"),
        result: vote.status === 200 && rows.length === 1 ? "pass" : "fail",
      };
    });

    await step("identity-anonymous-conversation", async (since) => {
      await nav("Messages").click();
      await frame.getByRole("button", { name: "New conversation" }).click();
      await frame
        .getByRole("textbox", { name: "Your message" })
        .fill("Anonymous question from the widget host");
      const mark = net.mark();
      await frame.getByRole("button", { name: "Send", exact: true }).click();
      const sent = await net.wait(
        "POST",
        /\/widget\/conversations$/,
        15000,
        mark,
      );
      const conversationId = sent.body?.conversation?.id;
      state.anonConversationId = sent.body?.conversation?.id;
      saveState();
      const rows = L.sql(
        `select c.id, c.visitor_principal_id, m.id, m.principal_id from quills.conversations c join quills.conversation_messages m on m.conversation_id = c.id where c.visitor_principal_id = ${L.q(L.toUuid(state.anonPrincipal))}`,
      );
      return {
        expected:
          "An anonymous visitor can start a conversation; the conversation and message belong to the anonymous principal",
        actual: `POST /widget/conversations ${sent.status}; conversation ${rows[0]?.[0] ?? "none"} visitor=${rows[0]?.[1] === L.toUuid(state.anonPrincipal) ? "anon" : "other"}; message ${rows[0]?.[2] ?? "-"}`,
        rows: {
          "quills.conversations": rows[0]?.[0],
          "quills.conversation_messages": rows[0]?.[2],
        },
        outbox: state.anonConversationId
          ? L.outbox([state.anonConversationId], since).map(
              (e) => `${e.type}#${e.id}`,
            )
          : [],
        shot: await shot("03-anonymous-conversation"),
        result: sent.status === 200 && rows.length >= 1 ? "pass" : "fail",
        _conversationId: conversationId,
      };
    });

    await step("identity-identify-merge", async (since) => {
      await page.fill("[data-testid=meta-key]", "plan");
      await page.fill("[data-testid=meta-value]", "pro");
      await hostButton("metadata set").click();
      const identify = await signIn("ada");
      const body = identify.body;
      state.ada = { principalId: body.principalId, userId: body.user.id };
      state.adaToken = body.sessionToken;
      saveState();
      const adaUuid = L.toUuid(body.principalId);
      const customer = L.sql(
        `select id, external_id, email, metadata from quills.customer_identity where id = ${L.q(L.toUuid(body.user.id))}`,
      )[0];
      const segments = L.sql(
        `select s.slug, us.added_by from quills.user_segments us join quills.segments s on s.id = us.segment_id where us.principal_id = ${L.q(adaUuid)}`,
      );
      const movedVotes = L.sql(
        `select id from quills.post_votes where principal_id = ${L.q(adaUuid)} and post_id = ${L.q(L.toUuid(state.demoPostId))}`,
      );
      const movedConversation = L.sql(
        `select id from quills.conversations where visitor_principal_id = ${L.q(adaUuid)} and id = ${L.q(L.toUuid(state.anonConversationId))}`,
      );
      const anonLeft = L.sql(
        `select count(*) from quills.post_votes where principal_id = ${L.q(L.toUuid(state.anonPrincipal))}`,
      )[0][0];
      const events = L.outbox([body.principalId], since);
      const [company] = L.sql(
        `select c.external_id, c.name from quills.principal p join quills.companies c on c.id = p.company_id where p.id = ${L.q(adaUuid)}`,
      );
      await page.waitForFunction(() =>
        document
          .querySelector("[data-testid=event-log]")
          .innerText.includes("ada@widget-host.test"),
      );
      const ok =
        identify.status === 200 &&
        body.mergedPrincipalId === state.anonPrincipal &&
        customer[1] === "host-ada" &&
        segments.some((s) => s[0] === "beta-program" && s[1] === "widget") &&
        /"plan":"pro"/.test(customer[3]) &&
        movedVotes.length === 1 &&
        movedConversation.length === 1 &&
        anonLeft === "0" &&
        company?.[0] === "host-acme";
      return {
        expected:
          "identify with a signed token (sub host-ada) creates or updates the customer, applies segments and the plan attribute, and moves the anonymous votes and conversation to Ada (user.lead_merged)",
        actual: `identify ${identify.status}; mergedPrincipalId=${body.mergedPrincipalId === state.anonPrincipal ? "the anonymous principal" : body.mergedPrincipalId}; customer ${customer[0]} sub=${customer[1]} email=${customer[2]} metadata=${customer[3]}; segments ${segments.map((s) => s.join("/")).join(",")}; moved vote ${movedVotes[0]?.[0] ?? "none"}, conversation ${movedConversation[0]?.[0] ?? "none"}; anon votes left ${anonLeft}; company ${company?.join(" ") ?? "none"}; warnings ${JSON.stringify(body.warnings)}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ")}`,
        rows: {
          "quills.customer_identity": customer[0],
          "quills.principal": adaUuid,
          "quills.user_segments": `${adaUuid}/beta-program`,
        },
        outbox: events.map((e) => e.id),
        shot: await shot("04-identify-ada"),
        result: ok ? "pass" : "fail",
      };
    });
  },

  async feedback() {
    const adaUuid = L.toUuid(state.ada.principalId);
    await step("feedback-deeplink-prefill", async () => {
      await openView("new-post", "Bug: export fails", "bugs");
      const value = await frame
        .getByRole("textbox", { name: "Your feedback" })
        .inputValue();
      return {
        expected:
          "open({ view: 'new-post', title, body, board }) opens the composer pre-filled with the title and body, on the named board (README)",
        actual: `composer opened; textbox value=${JSON.stringify(value)}`,
        shot: await shot("05-new-post-deeplink"),
        result: value.includes("Bug: export fails") ? "pass" : "fail",
        defect: value.includes("Bug: export fails")
          ? undefined
          : "Deep-link title/body/board are dropped by navigationFor() in packages/widget/src/adapter/WidgetHost.tsx",
      };
    });

    await step("feedback-similar", async () => {
      const box = frame.getByRole("textbox", { name: "Your feedback" });
      const mark = net.mark();
      await box.fill("a more visible search shortcut please");
      const lookup = await net
        .wait("GET", /\/widget\/posts\/similar$/, 15000, mark)
        .catch(() => null);
      await sleep(500);
      const list = frame.getByRole("complementary", {
        name: "Similar requests",
      });
      const visible = await list.isVisible().catch(() => false);
      const items = visible
        ? await list
            .getByRole("button", { name: /^Vote(d)? for / })
            .evaluateAll((els) =>
              els.map((el) => el.getAttribute("aria-label")),
            )
        : [];
      const shotPath = await shot("06-similar-requests");
      // Vote from the suggestion, then take the vote back so later steps start clean.
      const voteMark = net.mark();
      const first = list
        .getByRole("button", { name: /^Vote(d)? for / })
        .first();
      const before = await first.getAttribute("aria-pressed");
      await first.click();
      const vote = await net
        .wait("PUT", /\/vote$/, 15000, voteMark)
        .catch(() => null);
      const undoMark = net.mark();
      await list
        .getByRole("button", { name: /^Vote(d)? for / })
        .first()
        .click();
      await net.wait("PUT", /\/vote$/, 15000, undoMark).catch(() => null);
      return {
        expected:
          "Typing a draft asks the API for similar requests on the whole board (GET /widget/posts/similar) and each suggestion takes a vote",
        actual: `similar lookup ${lookup?.status ?? "none"}; Similar requests visible=${visible}; ${items.join(" | ")}; vote from suggestion ${vote?.status ?? "none"} ${JSON.stringify(vote?.request)} (was pressed=${before}), then undone`,
        shot: shotPath,
        result:
          lookup?.status === 200 &&
          visible &&
          items.length > 0 &&
          vote?.status === 200
            ? "pass"
            : "fail",
      };
    });

    await step("feedback-create-with-screenshot", async (since) => {
      const box = frame.getByRole("textbox", { name: "Your feedback" });
      const title = `Widget host E2E: export boards as CSV ${Date.now()}`;
      await box.fill(`${title}\nSo we can share them with finance.`);
      await frame.getByRole("button", { name: "Capture screenshot" }).click();
      const dialog = frame.getByRole("dialog", { name: "Review image" });
      await dialog.waitFor({ timeout: 20000 });
      // The editor's pen, text and color (G-12); the page's email and phone fields are masked.
      await dialog.getByLabel("Color").fill("#1e88e5");
      await dialog.getByRole("button", { name: "Text", exact: true }).click();
      await dialog.getByRole("button", { name: "Add text" }).click();
      await dialog.getByLabel("Mark text").fill("Export fails here");
      await dialog.getByRole("button", { name: "Pen", exact: true }).click();
      await dialog.getByRole("button", { name: "Add pen" }).click();
      const editorTools = await dialog
        .getByRole("group", { name: "Tool" })
        .locator("[aria-pressed]")
        .allInnerTexts();
      state.editorTools = editorTools;
      await shot("07-screenshot-review");
      await dialog.getByRole("button", { name: "Use image" }).click();
      await sleep(800);
      const mark = net.mark();
      await frame.getByRole("button", { name: "Post", exact: true }).click();
      const created = await net.wait("POST", /\/widget\/posts$/, 30000, mark);
      const post = created.body;
      state.adaPostId = post?.id;
      saveState();
      const uploads = net.calls
        .slice(mark)
        .filter((c) => /\/widget\/(uploads|files)$/.test(c.path))
        .map((c) => `${c.method} ${c.path} ${c.status}`);
      const row = L.sql(
        `select id, principal_id, board_id, title, widget_metadata from quills.posts where id = ${L.q(L.toUuid(post.id))}`,
      )[0];
      const files = L.sql(
        `select id, uploaded_by_id, post_id, content_type, size from quills.files where post_id = ${L.q(L.toUuid(post.id))}`,
      );
      await page.waitForSelector('[data-event="post:created"]');
      const events = L.outbox([post.id], since);
      const meta = JSON.parse(row[4] || "{}");
      const ok =
        state.editorTools.includes("Pen") &&
        state.editorTools.includes("Text") &&
        created.status === 200 &&
        row[1] === adaUuid &&
        files.length === 1 &&
        files[0][1] === adaUuid &&
        meta.plan === "pro" &&
        meta.pageUrl === "http://127.0.0.1:5290/" &&
        /\w+ \d+ on \w+/.test(meta.browser ?? "") &&
        events.some((e) => e.type === "post.created");
      return {
        expected:
          "The screenshot editor offers pen, text and a color, and masks the page's email and phone fields; posting creates a post by Ada with the screenshot file attached, widget_metadata = host metadata + pageUrl + browser, and a post.created outbox event; host gets post:created",
        actual: `editor tools ${state.editorTools.join("/")} (text + pen added in blue, see shot 07); POST /widget/posts ${created.status} id=${post.id}; uploads ${uploads.join(", ")}; posts.principal=${row[1] === adaUuid ? "Ada" : row[1]} title=${JSON.stringify(row[3])}; widget_metadata=${row[4]}; files ${files.map((f) => `${f[0]} by ${f[1] === adaUuid ? "Ada" : f[1]} ${f[3]} ${f[4]}B`).join(",") || "none"}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ")}`,
        rows: {
          "quills.posts": row[0],
          "quills.files": files.map((f) => f[0]).join(","),
        },
        outbox: events.map((e) => e.id),
        shot: await shot("08-post-created"),
        result: ok ? "pass" : "fail",
      };
    });

    await step("feedback-vote-unvote", async (since) => {
      const [target] = L.sql(
        "select id from quills.posts where title = 'A more visible search shortcut' and deleted_at is null limit 1",
      );
      const postId = L.fromUuid("post", target[0]);
      state.votePostId = postId;
      saveState();
      await openView("postId", postId);
      let mark = net.mark();
      await voteButton("Vote").click();
      const on = await net.wait("PUT", /\/vote$/, 15000, mark);
      const voted = L.sql(
        `select id, principal_id from quills.post_votes where post_id = ${L.q(target[0])} and principal_id = ${L.q(adaUuid)}`,
      );
      await shot("09-voted");
      mark = net.mark();
      await voteButton("Voted").click();
      const off = await net.wait("PUT", /\/vote$/, 15000, mark);
      const after = L.sql(
        `select id from quills.post_votes where post_id = ${L.q(target[0])} and principal_id = ${L.q(adaUuid)}`,
      );
      const events = L.outbox([postId], since);
      const logText = await log();
      return {
        expected:
          "Vote adds one post_votes row for Ada; unvote removes it; host gets vote events; outbox records both",
        actual: `vote ${on.status} ${JSON.stringify(on.body ?? on.request)} → row ${voted[0]?.[0] ?? "none"} (principal ${voted[0]?.[1] === adaUuid ? "Ada" : "?"}); unvote ${off.status} → rows left ${after.length}; host vote events ${(logText.match(/vote \{/g) || []).length}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ") || "none"}`,
        rows: { "quills.post_votes": voted[0]?.[0] },
        outbox: events.map((e) => e.id),
        result:
          on.status === 200 &&
          voted.length === 1 &&
          off.status === 200 &&
          after.length === 0
            ? events.length
              ? "pass"
              : "fail"
            : "fail",
        defect: events.length
          ? undefined
          : "No outbox event for widget vote/unvote",
      };
    });

    await step("feedback-comment", async (since) => {
      const mark = net.mark();
      await frame
        .getByRole("textbox", { name: "Your comment" })
        .fill("Comment from the widget host E2E");
      await frame.getByRole("button", { name: "Post comment" }).click();
      const created = await net.wait("POST", /\/comments$/, 15000, mark);
      const commentId = created.body?.id;
      state.adaCommentId = commentId;
      saveState();
      const row = L.sql(
        `select id, principal_id, post_id from quills.post_comments where id = ${L.q(L.toUuid(commentId))}`,
      )[0];
      await page.waitForSelector('[data-event="comment:created"]');
      const events = L.outbox([commentId, state.votePostId], since);
      return {
        expected:
          "A comment by Ada on the post; host gets comment:created; outbox comment.created",
        actual: `POST comments ${created.status} id=${commentId}; post_comments.principal=${row?.[1] === adaUuid ? "Ada" : row?.[1]}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ")}`,
        rows: { "quills.post_comments": row?.[0] },
        outbox: events.map((e) => e.id),
        shot: await shot("10-comment"),
        result:
          created.status === 200 &&
          row?.[1] === adaUuid &&
          events.some((e) => /comment/.test(e.type))
            ? "pass"
            : "fail",
      };
    });

    await step("feedback-follow", async (since) => {
      const button = frame.getByRole("button", {
        name: /Follow request|Following/,
      });
      const before = await button.getAttribute("aria-pressed");
      const mark = net.mark();
      if (before === "true") {
        await button.click();
        await net.wait("PUT", /\/follow$/, 15000, mark);
      }
      const mark2 = net.mark();
      await frame.getByRole("button", { name: "Follow request" }).click();
      const res = await net.wait("PUT", /\/follow$/, 15000, mark2);
      const row = L.sql(
        `select id, principal_id, reason from quills.post_subscriptions where post_id = ${L.q(L.toUuid(state.votePostId))} and principal_id = ${L.q(adaUuid)}`,
      )[0];
      const events = L.outbox([state.votePostId], since).filter((e) =>
        /subscri|follow/.test(e.type),
      );
      return {
        expected:
          "Follow subscribes Ada to the post (post_subscriptions row). The route declares no outbox event by design (event.none: the caller's own subscription)",
        actual: `before aria-pressed=${before} (the comment auto-subscribed: ${before === "true"}); follow ${res.status}; post_subscriptions ${row?.[0] ?? "none"} reason=${row?.[2]}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ") || "none"}`,
        rows: { "quills.post_subscriptions": row?.[0] },
        outbox: events.map((e) => e.id),
        shot: await shot("11-follow"),
        result: res.status === 200 && row?.[1] === adaUuid ? "pass" : "fail",
      };
    });

    await step("feedback-search", async () => {
      await nav("Feedback").click();
      const rows = frame.locator(".qb-feedback-row");
      const total = await rows.count();
      await frame
        .getByRole("searchbox", { name: "Search feedback" })
        .fill("upload error");
      await sleep(500);
      const filtered = await rows.allInnerTexts();
      const shotPath = await shot("12-feedback-search");
      await frame.getByRole("searchbox", { name: "Search feedback" }).fill("");
      return {
        expected: "Search filters the feedback list",
        actual: `${total} rows before, ${filtered.length} after "upload error": ${filtered.map((t) => t.split("\n")[1]).join(" | ")}`,
        shot: shotPath,
        result:
          filtered.length > 0 && filtered.length < total ? "pass" : "fail",
        note: "Client-side search over the loaded posts (at most 50).",
      };
    });

    await step("api-search-typos", async () => {
      // Server search (portal, teammate list, API): typos, partial words and minus words.
      const ctx = await require("playwright").request.newContext();
      const search = async (text) => {
        const res = await ctx.get(
          `${L.API}/api/quills-public/${L.WS}/widget/posts?limit=50&search=${encodeURIComponent(text)}`,
          { headers: { authorization: `Bearer ${state.adaToken}` } },
        );
        return res.ok()
          ? (await res.json()).items.map((item) => item.title)
          : [`HTTP ${res.status()}`];
      };
      const typo = await search("uplaod eror");
      const partial = await search("uploa");
      const minus = await search("upload -error");
      await ctx.dispose();
      const target = "Improve the upload error message";
      return {
        expected:
          "GET /widget/posts?search= finds a request despite typos (uplaod eror) and a partial word (uploa), and a minus word (-error) leaves it out",
        actual: `typos → ${typo.slice(0, 3).join(" | ")}; partial → ${partial.slice(0, 3).join(" | ")}; minus → ${minus.includes(target) ? "still listed" : "left out"}`,
        result:
          typo.includes(target) &&
          partial.includes(target) &&
          !minus.includes(target)
            ? "pass"
            : "fail",
      };
    });

    await step("feedback-markdown-preview", async () => {
      const raw = await frame.locator(".qb-feedback-row").allInnerTexts();
      const leaks = raw.filter((t) =>
        /\*\*|^#{1,3} |\n#{1,3} /m.test(t),
      ).length;
      return {
        expected: "List previews show plain text, not Markdown syntax",
        actual: `${leaks} of ${raw.length} previews show raw Markdown (** or ###)`,
        result: leaks === 0 ? "pass" : "fail",
        defect: leaks
          ? "Feedback list previews render the raw Markdown source"
          : undefined,
      };
    });

    await step("roadmap-read", async () => {
      await frame
        .getByRole("combobox", { name: "Sort feedback" })
        .selectOption({ label: "Roadmap" });
      await sleep(500);
      const text = await frame.locator("body").innerText();
      const voteButton = frame
        .getByRole("button", { name: /^Vote(d)? for / })
        .first();
      const mark = net.mark();
      await voteButton.click();
      const listVote = await net
        .wait("PUT", /\/vote$/, 15000, mark)
        .catch(() => null);
      if (listVote?.request?.voted) {
        const undo = net.mark();
        await frame
          .getByRole("button", { name: /^Voted for / })
          .first()
          .click();
        await net.wait("PUT", /\/vote$/, 15000, undo).catch(() => null);
      }
      return {
        expected:
          "The Roadmap view groups requests by status and takes a vote from the list",
        actual: `list vote ${listVote?.status ?? "none"} ${JSON.stringify(listVote?.request)}; Roadmap view: ${text
          .split("\n")
          .filter((l) => /Planned|In progress|Shipped|Open/.test(l))
          .slice(0, 6)
          .join(" | ")}`,
        shot: await shot("13-roadmap"),
        result:
          /Planned|In progress|Shipped/.test(text) && listVote?.status === 200
            ? "pass"
            : "fail",
        note: "Each stage is read on its own (up to 20 by votes). The workspace's named roadmaps (quills.roadmaps) are a teammate view.",
      };
    });
  },

  async signin() {
    await page.goto(L.HOST + "/");
    await page.waitForSelector("[data-event=ready]");
    await page.fill("[data-testid=meta-key]", "plan");
    await page.fill("[data-testid=meta-value]", "pro");
    await hostButton("metadata set").click();
    const res = await signIn("ada");
    state.adaToken = res.body.sessionToken;
    state.ada = { principalId: res.body.principalId, userId: res.body.user.id };
    saveState();
    await openView("home");
  },

  async changelog() {
    const adaUuid = L.toUuid(state.ada.principalId);
    await step("changelog-read-react", async (since) => {
      await openView("changelog");
      const mark = net.mark();
      await frame
        .getByRole("button", { name: /Portal demo shipped/ })
        .first()
        .click();
      await sleep(1500);
      const reads = net.calls
        .slice(mark)
        .filter((c) => c.path.endsWith("changelog/read"))
        .map((c) => `${c.method} ${c.status}`);
      const react = frame.getByRole("button", { name: "React 🎉" }).first();
      const before = await react.getAttribute("aria-pressed");
      const mark2 = net.mark();
      await react.click();
      const res = await net.wait(
        "PUT",
        /\/changelog\/[^/]+\/reactions$/,
        15000,
        mark2,
      );
      const entryId = res.path.split("/")[3];
      const rows = L.sql(
        `select changelog_entry_id, principal_id, emoji from quills.changelog_reactions where changelog_entry_id = ${L.q(L.toUuid(entryId))} and principal_id = ${L.q(adaUuid)}`,
      );
      const readRows = L.sql(
        `select * from quills.changelog_reads where principal_id = ${L.q(adaUuid)}`,
      );
      const events = L.outbox([entryId], since);
      return {
        expected:
          "Opening an update marks updates read; a reaction adds a changelog_reactions row for Ada",
        actual: `read calls ${reads.join(",") || "none"}; changelog_reads rows for Ada ${readRows.length}; reaction ${res.status} (before pressed=${before}) ${JSON.stringify(res.request)}; changelog_reactions ${rows.map((r) => r[2]).join(",") || "none"}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ") || "none"}`,
        rows: {
          "quills.changelog_reactions": rows[0]
            ? `${rows[0][0]}/${rows[0][2]}`
            : null,
        },
        outbox: events.map((e) => e.id),
        shot: await shot("14-changelog-entry"),
        result:
          res.status === 200 &&
          (before === "true" ? rows.length === 0 : rows.length === 1)
            ? "pass"
            : "fail",
      };
    });

    await step("changelog-subscribe", async () => {
      const subscription = () =>
        L.sql(
          `select id, source, unsubscribed_at from quills.changelog_subscriptions where principal_id = ${L.q(adaUuid)}`,
        )[0];
      await openView("changelog");
      const toggle = frame.getByRole("button", {
        name: /^(Get updates by email|Subscribed to updates)$/,
      });
      await toggle.waitFor({ timeout: 15000 });
      // Ada starts subscribed (identify subscribes her): unsubscribe, then subscribe again.
      const before = await toggle.getAttribute("aria-pressed");
      let mark = net.mark();
      await toggle.click();
      const first = await net.wait(
        before === "true" ? "DELETE" : "PUT",
        /\/widget\/changelog\/subscription$/,
        15000,
        mark,
      );
      const middle = subscription();
      mark = net.mark();
      await toggle.click();
      const second = await net.wait(
        before === "true" ? "PUT" : "DELETE",
        /\/widget\/changelog\/subscription$/,
        15000,
        mark,
      );
      const after = subscription();
      const shotPath = await shot("33-updates-subscribe");
      return {
        expected:
          "An identified visitor subscribes to and unsubscribes from updates in the widget (PUT/DELETE /widget/changelog/subscription); the row changes",
        actual: `started pressed=${before}; ${first.method} ${first.status} → unsubscribed_at ${middle?.[2] ? "set" : "null"}; ${second.method} ${second.status} → unsubscribed_at ${after?.[2] ? "set" : "null"} (row ${after?.[0]})`,
        rows: { "quills.changelog_subscriptions": after?.[0] },
        shot: shotPath,
        result:
          first.status === 200 &&
          second.status === 200 &&
          !!middle?.[2] !== !!after?.[2]
            ? "pass"
            : "fail",
      };
    });
  },

  async help() {
    const adaUuid = L.toUuid(state.ada.principalId);
    await step("help-deeplink-query", async () => {
      await openView("help", "roadmap");
      const value = await frame
        .getByRole("searchbox", { name: "Search for help" })
        .inputValue()
        .catch(() => null);
      return {
        expected:
          "open({ view: 'help', query }) opens Help with the search pre-filled (README)",
        actual: `searchbox value=${JSON.stringify(value)}`,
        result: value === "roadmap" ? "pass" : "fail",
        defect:
          value === "roadmap"
            ? undefined
            : "Help deep-link query is dropped by navigationFor() in packages/widget/src/adapter/WidgetHost.tsx",
      };
    });

    await step("help-search-read-feedback", async (since) => {
      await frame
        .getByRole("searchbox", { name: "Search for help" })
        .fill("roadmap");
      await sleep(600);
      await shot("15-help-search");
      const hits = await frame
        .getByRole("button")
        .filter({ has: frame.locator("mark") })
        .count();
      await frame
        .getByRole("button")
        .filter({ has: frame.locator("mark") })
        .first()
        .click();
      await sleep(1500);
      const title = await frame
        .getByRole("heading", { level: 1 })
        .first()
        .innerText()
        .catch(() => "");
      const mark = net.mark();
      await frame
        .getByRole("region", { name: "Article feedback" })
        .getByRole("button", { name: "Yes" })
        .click();
      const res = await net.wait(
        "PUT",
        /\/help\/articles\/[^/]+\/feedback$/,
        15000,
        mark,
      );
      const articleId = res.path.split("/")[4];
      const row = L.sql(
        `select id, principal_id, helpful from quills.kb_article_feedback where article_id = ${L.q(L.toUuid(articleId))} and principal_id = ${L.q(adaUuid)}`,
      )[0];
      const events = L.outbox([articleId], since);
      return {
        expected:
          "Help search finds articles; an article opens; Yes records kb_article_feedback for Ada",
        actual: `${hits} hits for "roadmap"; opened "${title}"; feedback ${res.status}; kb_article_feedback ${row?.[0] ?? "none"} principal=${row?.[1] === adaUuid ? "Ada" : row?.[1]} helpful=${row?.[2]}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ") || "none"}`,
        rows: { "quills.kb_article_feedback": row?.[0] },
        outbox: events.map((e) => e.id),
        shot: await shot("16-help-article-feedback"),
        result:
          hits > 0 &&
          res.status === 200 &&
          row?.[1] === adaUuid &&
          row?.[2] === "t"
            ? "pass"
            : "fail",
        note: "Search runs client-side over the 100 loaded articles; the widget does not call POST /widget/kb-search.",
      };
    });
  },

  async conversations() {
    const adaUuid = L.toUuid(state.ada.principalId);
    await step("messenger-team-home", async () => {
      const tm = await L.teammate(require("playwright"));
      const set = (data) =>
        tm.put(`${L.API}/api/quills/${L.WS}/settings/widget`, { data });
      const saved = await set({ replyTime: "hours" });
      // A teammate with the inbox open counts as online for 90 seconds.
      const heartbeat = await tm.put(
        `${L.API}/api/quills/${L.WS}/support/presence`,
      );
      await page.reload();
      await page.waitForSelector("[data-event=ready]");
      await signIn("ada");
      await openView("home");
      // A survey on Home uses the same card style.
      const card = frame.locator(".qb-contact-card:not(.qb-survey)");
      await card.waitFor({ timeout: 15000 });
      await frame
        .getByText(/Usually replies in a few hours/)
        .waitFor({ timeout: 15000 });
      const text = await card.innerText();
      const avatars = await card.locator(".qb-team-avatars .qb-avatar").count();
      const dot = await card.locator(".qb-online-dot").count();
      const presence = (await log()).match(/presence \{[^\n]*/)?.[0] ?? "";
      const shotPath = await shot("34-messenger-team");
      await set({ replyTime: null });
      await tm.dispose();
      // The reload cleared the host metadata that the next steps check.
      await page.fill("[data-testid=meta-key]", "plan");
      await page.fill("[data-testid=meta-value]", "pro");
      await hostButton("metadata set").click();
      return {
        expected:
          "Home's message card shows the teammate avatars (up to four), the online state and the reply time a teammate set; the host gets a presence event",
        actual: `settings PUT ${saved.status()}; heartbeat ${heartbeat.status()}; online dot ${dot}; card "${text.replace(/\n+/g, " | ").slice(0, 160)}"; avatars ${avatars}; ${presence.slice(0, 120)}`,
        shot: shotPath,
        result:
          saved.ok() &&
          /We’re online now\. Usually replies in a few hours/.test(text) &&
          dot === 1 &&
          avatars >= 1 &&
          avatars <= 4 &&
          /presence/.test(presence)
            ? "pass"
            : "fail",
      };
    });

    await step("conversation-start-reply", async (since) => {
      await openView("messages");
      await frame.getByRole("button", { name: "New conversation" }).click();
      const opening = `Hello from Ada in the widget host ${Date.now()}`;
      await frame.getByRole("textbox", { name: "Your message" }).fill(opening);
      let mark = net.mark();
      await frame.getByRole("button", { name: "Send", exact: true }).click();
      const started = await net.wait(
        "POST",
        /\/widget\/conversations$/,
        15000,
        mark,
      );
      const conversationId = started.body.conversation.id;
      state.adaConversationId = conversationId;
      saveState();
      await sleep(800);
      // After sending, the widget returns to the list; open the thread to reply.
      await frame
        .getByRole("button", { name: new RegExp(opening) })
        .first()
        .click();
      await frame
        .getByRole("textbox", { name: /Your (reply|message)/ })
        .fill("A follow-up reply");
      mark = net.mark();
      await frame.getByRole("button", { name: /Send( reply)?$/ }).click();
      const reply = await net.wait(
        "POST",
        /\/widget\/conversations\/[^/]+\/messages$/,
        15000,
        mark,
      );
      const rows = L.sql(
        `select m.id, m.principal_id, m.sender_type, m.metadata from quills.conversation_messages m where m.conversation_id = ${L.q(L.toUuid(conversationId))} order by m.created_at`,
      );
      const conv = L.sql(
        `select id, visitor_principal_id from quills.conversations where id = ${L.q(L.toUuid(conversationId))}`,
      )[0];
      const events = L.outbox(
        [conversationId, reply.body?.message?.id].filter(Boolean),
        since,
      );
      const meta = JSON.parse(rows[0]?.[3] || "{}").widgetMetadata ?? {};
      const ok =
        started.status === 200 &&
        reply.status === 200 &&
        conv[1] === adaUuid &&
        rows.length === 2 &&
        rows.every((r) => r[1] === adaUuid) &&
        meta.pageUrl &&
        meta.browser &&
        meta.plan === "pro";
      return {
        expected:
          "Ada starts a conversation and replies; both messages and the conversation belong to Ada; messages carry pageUrl, browser and the host metadata; outbox records them",
        actual: `start ${started.status} ${conversationId}; reply ${reply.status}; conversations.visitor=${conv[1] === adaUuid ? "Ada" : conv[1]}; messages ${rows.map((r) => `${r[0]}(${r[1] === adaUuid ? "Ada" : r[1]},${r[2]})`).join(", ")}; metadata ${rows[0]?.[3]}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ")}`,
        rows: {
          "quills.conversations": conv[0],
          "quills.conversation_messages": rows.map((r) => r[0]).join(","),
        },
        outbox: events.map((e) => e.id),
        shot: await shot("17-conversation"),
        result:
          ok &&
          events.some((e) => e.type === "conversation.created") &&
          events.some((e) => e.type === "message.created")
            ? "pass"
            : "fail",
      };
    });

    await step("conversation-attach-file", async () => {
      // The conversation from the previous step is open, with its reply composer.
      const image = require("path").resolve(SHOTS, "01-anonymous-home.png");
      await frame.getByLabel("Choose images").setInputFiles(image);
      await frame
        .getByRole("button", { name: /^Edit / })
        .first()
        .waitFor({ timeout: 10000 });
      await frame
        .getByRole("textbox", { name: /Your (reply|message)/ })
        .fill("Here is a screenshot");
      const mark = net.mark();
      await frame.getByRole("button", { name: /Send( reply)?$/ }).click();
      const reply = await net.wait(
        "POST",
        /\/widget\/conversations\/[^/]+\/messages$/,
        20000,
        mark,
      );
      const messageId = reply.body?.message?.id;
      const files = messageId
        ? L.sql(
            `select id, uploaded_by_id, message_id from quills.files where message_id = ${L.q(L.toUuid(messageId))}`,
          )
        : [];
      const adaUuid = L.toUuid(state.ada.principalId);
      return {
        expected:
          "A visitor attaches an image to a conversation reply: the file belongs to Ada and to the message",
        actual: `reply ${reply.status} attachments ${JSON.stringify(reply.body?.message?.attachments?.map((a) => a.name))}; quills.files ${files.map((f) => `${f[0]} by ${f[1] === adaUuid ? "Ada" : f[1]}`).join(",") || "none"}`,
        rows: { "quills.files": files.map((f) => f[0]).join(",") },
        shot: await shot("31-conversation-attachment"),
        result:
          reply.status === 200 && files.length === 1 && files[0][1] === adaUuid
            ? "pass"
            : "fail",
      };
    });

    await step("conversation-away-reply", async () => {
      // The only teammate sets themselves away, then the away reply is on: a new message gets it.
      const tm = await L.teammate(require("playwright"));
      const message = `The team is away (E2E ${Date.now()}).`;
      await tm.put(`${L.API}/api/quills/${L.WS}/support/availability`, {
        data: { availability: "away" },
      });
      const saved = await tm.put(
        `${L.API}/api/quills/${L.WS}/support/away-reply`,
        {
          data: { enabled: true, message },
        },
      );
      await openView("messages");
      await frame.getByRole("button", { name: "New conversation" }).click();
      await frame
        .getByRole("textbox", { name: "Your message" })
        .fill(`Is anyone there? ${Date.now()}`);
      const mark = net.mark();
      await frame.getByRole("button", { name: "Send", exact: true }).click();
      const started = await net.wait(
        "POST",
        /\/widget\/conversations$/,
        20000,
        mark,
      );
      const conversationId = started.body?.conversation?.id;
      const shown = await frame
        .getByText(message)
        .first()
        .waitFor({ timeout: 20000 })
        .then(() => true)
        .catch(() => false);
      const [row] = conversationId
        ? L.sql(
            `select id, sender_type from quills.conversation_messages where conversation_id = ${L.q(L.toUuid(conversationId))} and content = ${L.q(message)}`,
          )
        : [];
      const shotPath = await shot("36-away-reply");
      await tm.put(`${L.API}/api/quills/${L.WS}/support/away-reply`, {
        data: { enabled: false, message },
      });
      await tm.put(`${L.API}/api/quills/${L.WS}/support/availability`, {
        data: { availability: "online" },
      });
      await tm.dispose();
      return {
        expected:
          "With the away reply on and no teammate online, a new widget conversation gets the away message as a system message, shown in the thread",
        actual: `settings PUT ${saved.status()}; start ${started.status}; conversation_messages ${row?.[0] ?? "none"} sender=${row?.[1]}; shown in the widget ${shown}`,
        rows: { "quills.conversation_messages": row?.[0] },
        shot: shotPath,
        result: saved.ok() && row?.[1] === "system" && shown ? "pass" : "fail",
      };
    });

    await step("conversation-contact-email", async () => {
      // An anonymous visitor with a conversation: the optional "Get replies by email" card.
      L.sql(
        "delete from quills.rate_bucket where key like 'createQuillsWidgetAnonymousSession:%' returning key",
      );
      await page.goto(L.HOST + "/");
      await page.waitForSelector("[data-event=ready]");
      await openView("messages");
      await frame.getByRole("button", { name: "New conversation" }).click();
      await frame
        .getByRole("textbox", { name: "Your message" })
        .fill("Anonymous asks a question");
      await frame.getByRole("button", { name: "Send", exact: true }).click();
      const field = frame.getByLabel(
        "Your email, so you see replies after you leave",
      );
      await field.waitFor({ timeout: 15000 });
      await field.fill("anon-e2e@widget-host.test");
      const mark = net.mark();
      await frame.getByRole("button", { name: "Send code" }).click();
      const requested = await net.wait(
        "POST",
        /\/widget\/contact-email$/,
        15000,
        mark,
      );
      const codeField = await frame
        .getByLabel(/Enter the code we sent to anon-e2e@widget-host\.test/)
        .isVisible();
      return {
        expected:
          "An anonymous visitor asks for replies by email: a code is requested for the address and the widget asks for it (confirming sets the address and fires email-submitted; covered by the adapter and API tests because mail is off in the demo)",
        actual: `POST /widget/contact-email ${requested.status} ${JSON.stringify(requested.body)}; code field shown ${codeField}`,
        shot: await shot("32-contact-email"),
        result:
          requested.status === 200 && requested.body?.ok && codeField
            ? "pass"
            : "fail",
      };
    });
    await step("conversation-ip-block", async () => {
      // The newest widget conversation remembered its sender's address hash; block it, then lift it.
      const [conv] = L.sql(
        "select id from quills.conversations where source = 'widget' order by created_at desc limit 1",
      );
      const conversationId = L.fromUuid("conversation", conv[0]);
      const tm = await L.teammate(require("playwright"));
      const url = `${L.API}/api/quills/${L.WS}/conversations/${conversationId}/ip-block`;
      const before = await (await tm.get(url)).json();
      // The widget session exists before the block: a blocked address cannot start one either.
      await openView("messages");
      await frame
        .getByRole("button", { name: "New conversation" })
        .waitFor({ timeout: 15000 });
      const blocked = await tm.put(url);
      const until = (await blocked.json()).blockedUntil;
      // The browser and the API share 127.0.0.1 here: the next widget write is refused.
      const mark = net.mark();
      await frame.getByRole("button", { name: "New conversation" }).click();
      await frame
        .getByRole("textbox", { name: "Your message" })
        .fill("Blocked?");
      await frame.getByRole("button", { name: "Send", exact: true }).click();
      const refused = await net
        .wait("POST", /\/widget\/conversations$/, 15000, mark)
        .catch(() => null);
      const shotPath = await shot("37-ip-block");
      const lifted = await tm.delete(url);
      await tm.dispose();
      const kv = L.sql(
        "select key from quills.kv_store where key like 'ip_block:%' or key like 'conversation_ip:%'",
      ).flat();
      return {
        expected:
          "A teammate blocks the address of a conversation's sender for 30 days: that address's next widget write answers 403; lifting the block restores it; only keyed hashes are stored",
        actual: `before ${JSON.stringify(before)}; block ${blocked.status()} until ${until}; widget start ${refused?.status ?? "none"}; lift ${lifted.status()}; kv keys ${kv.length} (no raw address: ${!kv.some((key) => key.includes("127.0.0.1"))})`,
        shot: shotPath,
        result:
          before.available === true &&
          blocked.ok() &&
          refused?.status === 403 &&
          lifted.ok() &&
          !kv.some((key) => key.includes("127.0.0.1"))
            ? "pass"
            : "fail",
      };
    });
  },

  async privacy() {
    await step("identity-switch-user", async () => {
      const res = await signIn("grace");
      state.graceToken = res.body.sessionToken;
      state.grace = { principalId: res.body.principalId };
      saveState();
      await page.waitForFunction(() =>
        document
          .querySelector("[data-testid=event-log]")
          .innerText.includes("grace@widget-host.test"),
      );
      await openView("messages");
      await sleep(1500);
      const listText = await frame.locator("body").innerText();
      const seesAda = listText.includes("Hello from Ada");
      const shotPath = await shot("18-switch-to-grace");
      const customer = L.sql(
        `select c.external_id from quills.principal p join quills.customer_identity c on c.id = p.user_id where p.id = ${L.q(L.toUuid(res.body.principalId))}`,
      )[0];
      return {
        expected:
          "Switching the host user identifies Grace; her widget shows none of Ada's conversations",
        actual: `identify ${res.status} principal ${res.body.principalId} sub=${customer[0]}; Messages shows Ada's conversation: ${seesAda}`,
        rows: { "quills.principal": L.toUuid(res.body.principalId) },
        shot: shotPath,
        result:
          res.status === 200 && customer[0] === "host-grace" && !seesAda
            ? "pass"
            : "fail",
      };
    });

    await step("privacy-cross-user", async () => {
      const get = (path, token) =>
        fetch(`${L.API}/api/quills-public/${L.WS}${path}`, {
          headers: { authorization: `Bearer ${token}` },
        }).then(async (r) => ({
          status: r.status,
          body: await r.json().catch(() => null),
        }));
      const conv = await get(
        `/widget/conversations/${state.adaConversationId}`,
        state.graceToken,
      );
      const msgs = await get(
        `/widget/conversations/${state.adaConversationId}/messages`,
        state.graceToken,
      );
      const list = await get(
        "/widget/conversations?limit=50",
        state.graceToken,
      );
      const leaked = JSON.stringify(list.body).includes(
        state.adaConversationId,
      );
      const voted = await get("/widget/voted-posts", state.graceToken);
      const adaVoted = await get("/widget/voted-posts", state.adaToken);
      return {
        expected:
          "Grace cannot read Ada's conversation or messages, and lists only her own",
        actual: `Grace GET Ada conversation ${conv.status}, messages ${msgs.status}; Grace's list contains it: ${leaked}; voted-posts Grace ${JSON.stringify(voted.body)} vs Ada ${adaVoted.body?.postIds?.length ?? adaVoted.status} ids`,
        result:
          [403, 404].includes(conv.status) &&
          [403, 404].includes(msgs.status) &&
          !leaked
            ? "pass"
            : "fail",
      };
    });

    await step("identity-logout", async () => {
      await hostButton("logout").click();
      await sleep(1000);
      await hostButton("getUser").click();
      await hostButton("isIdentified").click();
      const text = await log();
      return {
        expected:
          "logout() clears the identity, closes the panel; getUser() is null and isIdentified() false",
        actual: text.split("\n").slice(0, 4).join(" | "),
        shot: await shot("19-logout"),
        result:
          /call isIdentified false/.test(text) &&
          /call getUser "undefined"|call getUser null/.test(text)
            ? "pass"
            : "fail",
      };
    });
  },

  async negative() {
    // Test setup: every check starts an anonymous session, and the API allows 10 per hour per client IP.
    const resetAnonymousBucket = () =>
      L.sql(
        "delete from quills.rate_bucket where key like 'createQuillsWidgetAnonymousSession:%' returning key",
      );
    for (const variant of ["bad-signature", "expired", "no-sub", "no-email"]) {
      await step(`negative-token-${variant}`, async () => {
        resetAnonymousBucket();
        await page.goto(L.HOST + "/");
        await page.waitForSelector("[data-event=ready]");
        const res = await signIn("linus", variant);
        await page.waitForSelector("[data-event=identify]");
        await sleep(800);
        const mark = net.mark();
        await openView("home");
        const anon = await net
          .wait("POST", /\/widget\/anonymous-session$/, 15000, mark)
          .catch(() => null);
        const text = await log();
        return {
          expected: `A ${variant} token gets 403 and the widget continues anonymously`,
          actual: `identify ${res.status} ${JSON.stringify(res.body)}; then anonymous-session ${anon?.status ?? "none"}; host identify event: ${(text.match(/identify \{[^\n]*/g) || []).slice(0, 1).join("")}`,
          result: res.status === 403 && anon?.status === 200 ? "pass" : "fail",
        };
      });
    }

    await step("negative-anonymous-as-identified", async () => {
      resetAnonymousBucket();
      const anonToken = (
        await fetch(
          `${L.API}/api/quills-public/${L.WS}/widget/anonymous-session`,
          { method: "POST" },
        ).then((r) => r.json())
      ).sessionToken;
      const get = (path) =>
        fetch(`${L.API}/api/quills-public/${L.WS}${path}`, {
          headers: { authorization: `Bearer ${anonToken}` },
        }).then((r) => r.status);
      const conv = await get(
        `/widget/conversations/${state.adaConversationId}`,
      );
      const session = await fetch(
        `${L.API}/api/quills-public/${L.WS}/widget/session`,
        { headers: { authorization: `Bearer ${anonToken}` } },
      ).then((r) => r.json());
      // An identified session token cannot be passed off as an anonymous previousToken to take over Ada.
      const merge = await fetch(
        `${L.API}/api/quills-public/${L.WS}/widget/identify`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${state.adaToken}`,
          },
          body: JSON.stringify({
            ssoToken: "x.y.z",
            previousToken: state.adaToken,
          }),
        },
      ).then((r) => r.status);
      return {
        expected:
          "An anonymous session cannot read an identified user's data, and session user is null; a forged identify is refused",
        actual: `anon GET Ada conversation ${conv}; anon session user ${JSON.stringify(session.user)}; identify with a bad token and Ada's token as previousToken ${merge}`,
        result:
          [403, 404].includes(conv) && session.user === null && merge === 403
            ? "pass"
            : "fail",
      };
    });

    await step("negative-blocked", async () => {
      const tm = await L.teammate(require("playwright"));
      await signIn("linus");
      const linus = L.principalOfSub("host-linus");
      const linusTypeId = L.fromUuid("principal", linus);
      const block = await tm.put(
        `${L.API}/api/quills/${L.WS}/users/${linusTypeId}/block`,
        { data: {} },
      );
      await page.goto(L.HOST + "/");
      await page.waitForSelector("[data-event=ready]");
      const res = await signIn("linus");
      const unblock = await tm.delete(
        `${L.API}/api/quills/${L.WS}/users/${linusTypeId}/block`,
      );
      await tm.dispose();
      return {
        expected:
          "A blocked person cannot identify (403) and the widget stays anonymous",
        actual: `block ${block.status()}; identify ${res.status} ${JSON.stringify(res.body)}; unblock ${unblock.status()}`,
        rows: { "quills.principal": linus },
        result:
          block.ok() &&
          res.status === 403 &&
          /blocked/i.test(JSON.stringify(res.body))
            ? "pass"
            : "fail",
      };
    });
  },

  async sdk() {
    await page.goto(L.HOST + "/");
    await page.waitForSelector("[data-event=ready]");
    const launcher = () => page.locator(".quackback-launcher").first();

    await step("sdk-state-queries", async () => {
      await signIn("ada");
      await page.waitForFunction(() =>
        document
          .querySelector("[data-testid=event-log]")
          .innerText.includes("ada@widget-host.test"),
      );
      await openView("home");
      for (const q of ["isOpen", "getUser", "isIdentified"])
        await hostButton(q).click();
      await hostButton("close").click();
      await hostButton("isOpen").click();
      const lines = (await log())
        .split("\n")
        .filter((l) => /call (isOpen|getUser|isIdentified)/.test(l))
        .map((l) => l.replace(/^\S+ \S+ /, ""));
      return {
        expected:
          "isOpen() true while open and false after close(); getUser() is Ada; isIdentified() true",
        actual: lines.join(" | "),
        result:
          /call isOpen false/.test(lines[0]) &&
          lines.some((l) => /call isOpen true/.test(l)) &&
          lines.some((l) => /call getUser .*ada@widget-host.test/.test(l)) &&
          lines.some((l) => /call isIdentified true/.test(l))
            ? "pass"
            : "fail",
      };
    });

    await step("sdk-launcher-show-hide", async () => {
      const visible0 = await launcher().isVisible();
      await hostButton("hideLauncher").click();
      const hidden = await launcher().isVisible();
      await hostButton("showLauncher").click();
      const shown = await launcher().isVisible();
      return {
        expected:
          "hideLauncher() hides the launcher and showLauncher() shows it",
        actual: `visible ${visible0} → after hide ${hidden} → after show ${shown}`,
        result: visible0 && !hidden && shown ? "pass" : "fail",
      };
    });

    await step("sdk-placement-launcher-option", async () => {
      await page.selectOption("[data-testid=placement]", "left");
      await sleep(2500);
      const box = await launcher().boundingBox();
      const shotPath = await shot("20-placement-left");
      await page.uncheck("[data-testid=launcher]");
      await sleep(2000);
      const count = await page.locator(".quackback-launcher").count();
      await page.check("[data-testid=launcher]");
      await page.selectOption("[data-testid=placement]", "right");
      await sleep(2000);
      return {
        expected:
          "placement 'left' puts the launcher on the left; launcher: false shows no launcher",
        actual: `left launcher x=${box?.x}; launcher elements with launcher:false: ${count}`,
        shot: shotPath,
        result: box && box.x < 200 && count === 0 ? "pass" : "fail",
      };
    });

    await step("sdk-locale", async () => {
      await page.selectOption("[data-testid=locale]", "fr");
      await sleep(2500);
      await openView("home");
      const text = await frame.locator("body").innerText();
      const launcherLabel = await page
        .locator(".quackback-launcher")
        .first()
        .getAttribute("aria-label");
      const shotPath = await shot("21-locale-fr");
      await hostButton("close").click();
      await page.selectOption("[data-testid=locale]", "ar");
      await sleep(2500);
      await openView("home");
      const arabic = await frame
        .locator("section.qb-widget")
        .evaluate((el) => ({
          dir: el.getAttribute("dir"),
          lang: el.getAttribute("lang"),
          text: el.innerText,
        }));
      await shot("21-locale-ar");
      await hostButton("close").click();
      await page.selectOption("[data-testid=locale]", "");
      await sleep(2000);
      const french =
        /Envoyez-nous un message/.test(text) &&
        /Accueil/.test(text) &&
        !/Send us a message/.test(text);
      const rtl = arabic.dir === "rtl" && /أرسل لنا رسالة/.test(arabic.text);
      return {
        expected:
          "locale 'fr' shows the panel and the launcher's name in French; locale 'ar' shows Arabic right to left",
        actual: `fr panel: ${text.replace(/\s+/g, " ").slice(0, 120)}; launcher "${launcherLabel}"; ar dir=${arabic.dir} lang=${arabic.lang}: ${arabic.text.replace(/\s+/g, " ").slice(0, 80)}`,
        shot: shotPath,
        result: french && rtl ? "pass" : "fail",
      };
    });

    await step("sdk-deep-links", async () => {
      const out = [];
      const check = async (view, text, expectRe) => {
        await openView(view, text);
        await sleep(800);
        const body = await frame.locator("body").innerText();
        out.push(
          `${view}${text ? `(${text.slice(0, 20)})` : ""}=${expectRe.test(body) ? "ok" : "WRONG"}`,
        );
      };
      const [entry] = L.sql(
        "select id from quills.changelog_entries where title = 'Portal demo shipped' limit 1",
      );
      const [article] = L.sql(
        "select id, slug from quills.kb_articles where title = 'Build your first roadmap' limit 1",
      );
      await check("home", "", /How can we help/);
      await check("changelog", "", /Updates/);
      await check(
        "changelog",
        L.fromUuid("changelog", entry[0]),
        /Portal demo shipped/,
      );
      await check("help", "", /Help & Support/);
      await check(
        "help-category",
        "roadmaps",
        /All categories[\s\S]*Build your first roadmap/,
      );
      await check(
        "notifications",
        "",
        /Replies and progress on requests you follow/,
      );
      await check("messages", "", /Messages/);
      await openView("messages", "Deep-linked message");
      const prefilled = await frame
        .getByLabel("Your message")
        .inputValue()
        .catch(() => null);
      out.push(
        `messages(body)=${prefilled === "Deep-linked message" ? "ok" : "WRONG"}`,
      );
      await check("chat", "", /Messages/);
      await check("tickets", "", /Messages/);
      await check("postId", state.votePostId, /A more visible search shortcut/);
      await check("articleId", article[1], /Build your first roadmap/);
      await hostButton("close").click();
      return {
        expected:
          "Each deep link opens its view: home, changelog (and one entry), help, a help category by name, notifications (activity), messages and a pre-filled new message, chat and tickets (messages), a post, an article by slug",
        actual: out.join(", "),
        result: out.every((o) => o.endsWith("=ok")) ? "pass" : "fail",
      };
    });

    await step("sdk-on-off", async () => {
      await hostButton("off (all events)").click();
      await openView("home");
      await hostButton("close").click();
      const afterOff = (await log()).split("\n").slice(0, 5).join(" | ");
      await hostButton("on (all events)").click();
      await openView("home");
      await hostButton("close").click();
      const afterOn = (await log()).split("\n").slice(0, 5).join(" | ");
      return {
        expected:
          "off() removes the handlers: open/close are not logged; on() restores them",
        actual: `after off: ${afterOff} || after on: ${afterOn}`,
        result:
          !/ open \{/.test(afterOff.split("removed all handlers")[0]) &&
          / close \{\}/.test(afterOn)
            ? "pass"
            : "fail",
      };
    });

    await step("sdk-metadata", async () => {
      await page.fill("[data-testid=meta-key]", "plan");
      await hostButton("metadata remove").click();
      await page.fill("[data-testid=meta-key]", "team");
      await page.fill("[data-testid=meta-value]", "finance");
      await hostButton("metadata set").click();
      await openView("new-post");
      await frame
        .getByRole("textbox", { name: "Your feedback" })
        .fill(`Metadata check ${Date.now()}`);
      const mark = net.mark();
      await frame.getByRole("button", { name: "Post", exact: true }).click();
      const created = await net.wait("POST", /\/widget\/posts$/, 20000, mark);
      const [row] = L.sql(
        `select id, widget_metadata from quills.posts where id = ${L.q(L.toUuid(created.body.id))}`,
      );
      const meta = JSON.parse(row[1]);
      return {
        expected:
          "metadata({team}) is added, metadata({plan: null}) removes plan; the SDK adds pageUrl and the widget adds browser",
        actual: `request metadata ${JSON.stringify(created.request.metadata)}; posts.widget_metadata ${row[1]}`,
        rows: { "quills.posts": row[0] },
        result:
          meta.team === "finance" &&
          !("plan" in meta) &&
          meta.pageUrl &&
          meta.browser
            ? "pass"
            : "fail",
      };
    });

    await step("sdk-page-url", async () => {
      const postWith = async (share) => {
        await page.selectOption("[data-testid=page-url]", share);
        await page.waitForSelector("[data-event=ready]");
        await sleep(1500);
        await openView("new-post");
        await frame
          .getByRole("textbox", { name: "Your feedback" })
          .fill(`Page URL ${share} ${Date.now()}`);
        const mark = net.mark();
        await frame.getByRole("button", { name: "Post", exact: true }).click();
        const created = await net.wait("POST", /\/widget\/posts$/, 20000, mark);
        const [row] = L.sql(
          `select widget_metadata->>'pageUrl' from quills.posts where id = ${L.q(L.toUuid(created.body.id))}`,
        );
        return row?.[0] ?? "";
      };
      const origin = await postWith("origin");
      const none = await postWith("none");
      await page.selectOption("[data-testid=page-url]", "path");
      await sleep(1500);
      return {
        expected:
          "init({ pageUrl: 'origin' }) stores only the origin with a post; pageUrl: 'none' stores no page address",
        actual: `origin → ${JSON.stringify(origin)}; none → ${JSON.stringify(none)}`,
        result: origin === L.HOST && none === "" ? "pass" : "fail",
      };
    });

    await step("sdk-inline-embed", async () => {
      await page.check("[data-testid=inline]");
      await page.waitForSelector("#inline-widget iframe", { timeout: 20000 });
      const inline = page.frameLocator("#inline-widget iframe");
      await inline
        .getByRole("button", { name: "Feedback", exact: true })
        .first()
        .waitFor({ timeout: 20000 });
      const launchers = await page.locator(".quackback-launcher").count();
      const closeButtons =
        (await page.locator("#inline-widget .quackback-panel-close").count()) +
        (await inline.getByRole("button", { name: "Close widget" }).count());
      await hostButton("close").click();
      await sleep(500);
      const box = await page.locator("#inline-widget iframe").boundingBox();
      await hostButton("getState").click();
      const stateLine =
        (await log())
          .split("\n")
          .filter((line) => /call getState/.test(line))
          .at(0) ?? "";
      const state = { open: /"open":\s*true/.test(stateLine) };
      const shotPath = await shot("38-inline-embed");
      await page.uncheck("[data-testid=inline]");
      await page.waitForSelector("[data-event=ready]");
      await sleep(1500);
      const ok =
        launchers === 0 &&
        closeButtons === 0 &&
        (box?.height ?? 0) >= 480 &&
        state?.open === true;
      return {
        expected:
          "init({ container: '#inline-widget' }) renders the widget inside the host element, open, with no launcher and no close button; close() leaves it in place",
        actual: `launchers ${launchers}; close buttons ${closeButtons}; frame ${Math.round(box?.width ?? 0)}x${Math.round(box?.height ?? 0)}; getState().open after close() ${state?.open}`,
        shot: shotPath,
        result: ok ? "pass" : "fail",
      };
    });

    await step("sdk-tracking", async () => {
      const deviceKey = () =>
        page.evaluate(() =>
          Object.keys(localStorage)
            .filter((k) => /quackback|quills|device/i.test(k))
            .map((k) => `${k}=${(localStorage.getItem(k) || "").slice(0, 8)}…`),
        );
      const before = await deviceKey();
      const views0 = L.sql("select count(*) from quills.page_views")[0][0];
      await hostButton("tracking(false)").click();
      const off = await deviceKey();
      await hostButton("tracking(true)").click();
      await page.reload();
      await page.waitForSelector("[data-event=ready]");
      await sleep(2000);
      const on = await deviceKey();
      const views1 = L.sql("select count(*) from quills.page_views")[0][0];
      return {
        expected:
          "tracking(false) removes the stored device id; tracking(true) allows host-page analytics again",
        actual: `device keys before ${JSON.stringify(before)}, after tracking(false) ${JSON.stringify(off)}, after tracking(true)+reload ${JSON.stringify(on)}; page_views ${views0} → ${views1}`,
        result: off.length === 0 ? "pass" : "fail",
        note: "README: the SDK ignores visitorAnalytics from Kaneo, so no page views are sent either way.",
      };
    });

    await step("sdk-control-surface", async () => {
      const logLine = async (re) =>
        (await log()).split("\n").find((line) => re.test(line)) ?? "";
      await hostButton("toggle").click();
      await sleep(600);
      const openAfterToggle = await page
        .locator(".quackback-panel.quackback-open")
        .count();
      await hostButton("toggle").click();
      await hostButton("getState").click();
      const stateLine = await logLine(/call getState/);
      await hostButton("setTheme(dark)").click();
      await sleep(800);
      const theme = await frame
        .locator("section.qb-widget")
        .getAttribute("data-theme");
      await page.check("[data-testid=own-launcher]");
      await sleep(1500);
      await page.getByTestId("host-launcher").click();
      await sleep(800);
      const openFromHost = await page
        .locator(".quackback-panel.quackback-open")
        .count();
      await hostButton("close").click();
      await page.uncheck("[data-testid=own-launcher]");
      await page.check("[data-testid=offset]");
      await sleep(1500);
      const bottom = await page
        .locator(".quackback-launcher")
        .first()
        .evaluate((el) => el.style.bottom);
      await page.uncheck("[data-testid=offset]");
      await sleep(1000);
      const statechanges = ((await log()).match(/statechange \{/g) || [])
        .length;
      return {
        expected:
          "toggle() opens and closes; getState() returns the snapshot; setTheme() restyles the panel; launcher { selector } opens from the host's button; offset moves the launcher; statechange fires",
        actual: `toggle opened=${openAfterToggle > 0}; ${stateLine.replace(/^\S+ \S+ /, "").slice(0, 160)}; theme=${theme}; host button opened=${openFromHost > 0}; offset bottom=${bottom}; statechange events=${statechanges}`,
        result:
          openAfterToggle > 0 &&
          /"initialized":true/.test(stateLine) &&
          theme === "dark" &&
          openFromHost > 0 &&
          bottom === "84px" &&
          statechanges > 0
            ? "pass"
            : "fail",
      };
    });

    await step("sdk-destroy", async () => {
      await hostButton("destroy").click();
      await sleep(500);
      const iframes = await page.locator('iframe[src*="/widget"]').count();
      const launchers = await page.locator(".quackback-launcher").count();
      await hostButton("isOpen").click();
      const line = (await log()).split("\n")[0];
      return {
        expected:
          "destroy() removes the launcher and the iframe; isOpen() is false",
        actual: `iframes ${iframes}, launchers ${launchers}; ${line}`,
        result:
          iframes === 0 && launchers === 0 && /isOpen false/.test(line)
            ? "pass"
            : "fail",
      };
    });
  },

  async script() {
    await step("script-tag-embed", async () => {
      await page.goto(L.HOST + "/script");
      await page.waitForSelector("[data-event=ready]", { timeout: 20000 });
      const res = await signIn("grace");
      await page.waitForFunction(() =>
        document
          .querySelector("[data-testid=event-log]")
          .innerText.includes("grace@widget-host.test"),
      );
      await openView("changelog");
      const text = await frame.locator("body").innerText();
      const shotPath = await shot("22-script-tag");
      for (const q of ["isOpen", "getUser", "isIdentified"])
        await hostButton(q).click();
      const lines = (await log())
        .split("\n")
        .filter((l) => /call (isOpen|getUser|isIdentified)/.test(l))
        .map((l) => l.replace(/^\S+ \S+ /, ""));
      return {
        expected:
          "The script tag alone loads the SDK, identifies Grace with her signed token and opens views; state queries answer",
        actual: `identify ${res.status}; changelog view ${/Updates/.test(text)}; ${lines.join(" | ")}`,
        shot: shotPath,
        result:
          res.status === 200 &&
          /Updates/.test(text) &&
          !lines.some((l) => /"undefined"/.test(l))
            ? "pass"
            : "fail",
        defect: lines.some((l) => /"undefined"/.test(l))
          ? "Script-tag window.Quills cannot answer isOpen/getUser/isIdentified: the dispatcher has no such commands (packages/widget/src/browser-queue.ts, core/sdk.ts)"
          : undefined,
      };
    });
  },

  async teammate() {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const tp = await ctx.newPage();
    const res = await tp.request.post(`${L.API}/api/auth/sign-in/email`, {
      data: {
        email: "portal-demo@example.test",
        password: L.env.QUILLS_DEMO_PASSWORD,
      },
      headers: { Origin: L.WEB },
    });
    await step("teammate-post", async () => {
      await tp.goto(`${L.WEB}/feedback/${L.WS}/posts/${state.adaPostId}`);
      await tp.getByText("Page context").first().waitFor({ timeout: 30000 });
      const text = await tp.locator("body").innerText();
      await tp.screenshot({ path: `${SHOTS}/23-teammate-post.png` });
      return {
        expected:
          "The teammate app shows Ada's post with Ada as the author and the page and browser context",
        actual: `sign-in ${res.status()}; author Ada ${/Ada Host/.test(text)}; page URL ${/127\.0\.0\.1:5290/.test(text)}; browser ${/Chrome/.test(text)}; segment ${/Beta program/.test(text)}`,
        shot: "widget-e2e/23-teammate-post.png",
        result:
          /Ada Host/.test(text) &&
          /127\.0\.0\.1:5290/.test(text) &&
          /Chrome/.test(text)
            ? "pass"
            : "fail",
      };
    });
    await step("teammate-post-custom-metadata", async () => {
      const text = await tp.locator("body").innerText();
      const [row] = L.sql(
        `select widget_metadata from quills.posts where id = ${L.q(L.toUuid(state.adaPostId))}`,
      );
      return {
        expected:
          'Teammates read the host metadata keys (here plan=pro) on the post (README: "Teammates read it on the post")',
        actual: `posts.widget_metadata ${row[0]}; the post page shows only Page and Browser (apps/web/src/quills/pages/team-post/parts/post-page-context.tsx); "plan" visible: ${/\bplan\b/i.test(text.split("Page context")[1] ?? "")}`,
        result: /\bplan\b/i.test(text.split("Page context")[1] ?? "")
          ? "pass"
          : "fail",
        defect:
          "Custom metadata keys are stored on the post and message but the teammate app shows only pageUrl and browser",
      };
    });
    await step("teammate-post-attachment", async () => {
      const files = L.sql(
        `select id, name from quills.files where post_id = ${L.q(L.toUuid(state.adaPostId))}`,
      );
      const imgs = await tp.locator("main img, [role=main] img").count();
      const api = await tp.request.get(
        `${L.API}/api/quills/${L.WS}/posts/${state.adaPostId}`,
        { headers: { Origin: L.WEB } },
      );
      const body = await api.json();
      return {
        expected: "Teammates see the visitor's screenshot on the post",
        actual: `quills.files ${files.map((f) => `${f[0]} ${f[1]}`).join(",")} has post_id set; GET /api/quills/{ws}/posts/{id} keys: ${Object.keys(body).join(",")}; no attachments field; images on the page: ${imgs}`,
        rows: { "quills.files": files.map((f) => f[0]).join(",") },
        result: "attachments" in body ? "pass" : "fail",
        defect:
          "attachments" in body
            ? undefined
            : "A widget post attachment is stored but no teammate route or view shows it",
      };
    });
    await step("teammate-conversation", async () => {
      await tp.goto(
        `${L.WEB}/feedback/${L.WS}/conversations/${state.adaConversationId}`,
      );
      await tp
        .getByText("A follow-up reply")
        .first()
        .waitFor({ timeout: 30000 });
      const text = await tp.locator("body").innerText();
      await tp.screenshot({ path: `${SHOTS}/24-teammate-conversation.png` });
      return {
        expected:
          "The teammate inbox shows Ada's conversation with her messages and the page/browser metadata",
        actual: `author Ada ${/Ada Host/.test(text)}; follow-up ${/A follow-up reply/.test(text)}; page URL ${/127\.0\.0\.1:5290/.test(text)}; browser ${/Chrome/.test(text)}`,
        shot: "widget-e2e/24-teammate-conversation.png",
        result:
          /Ada Host/.test(text) &&
          /A follow-up reply/.test(text) &&
          /127\.0\.0\.1:5290|Chrome/.test(text)
            ? "pass"
            : "fail",
      };
    });
    await step("teammate-person", async () => {
      await tp.goto(
        `${L.WEB}/feedback/${L.WS}/members/${state.ada.principalId}`,
      );
      await tp
        .getByText("Identified by your app")
        .first()
        .waitFor({ timeout: 30000 });
      await tp
        .getByText(/Plan/)
        .first()
        .waitFor({ timeout: 15000 })
        .catch(() => {});
      await tp.waitForTimeout(1500);
      const text = await tp.locator("body").innerText();
      await tp.screenshot({ path: `${SHOTS}/25-teammate-person.png` });
      return {
        expected:
          "The person page shows Ada as identified by the host app, with the plan trait and her requests, comments and votes",
        actual: `name ${/Ada Host/.test(text)}; identified by your app ${/Identified by your app/.test(text)}; Plan: pro ${/Plan:?\s*pro/.test(text)}; activity ${
          text
            .match(/(\d+)\s*Requests\s*(\d+)\s*Comments\s*(\d+)\s*Votes/)
            ?.slice(1)
            .join("/") ?? "?"
        }; email shown ${/ada@widget-host\.test/.test(text)}; segment shown ${/Beta program/i.test(text)}`,
        shot: "widget-e2e/25-teammate-person.png",
        result:
          /Ada Host/.test(text) &&
          /Identified by your app/.test(text) &&
          /Plan:?\s*pro/.test(text)
            ? "pass"
            : "fail",
      };
    });
    await ctx.close();
  },

  async extras() {
    const adaUuid = L.toUuid(state.ada.principalId);
    await step("survey-response", async (since) => {
      // The negative checks leave a blocked visitor; surveys ask an identified person.
      if ((await page.inputValue("[data-testid=user]")) !== "ada")
        await signIn("ada");
      await openView("home");
      const survey = frame
        .getByRole("region", { name: /improve next|recommend/ })
        .first();
      const shown = await survey
        .waitFor({ timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      if (!shown) {
        // Every active survey was answered on an earlier run: a survey asks once.
        const [row] = L.sql(
          `select id, choice, score from quills.survey_responses where principal_id = ${L.q(adaUuid)} order by created_at desc limit 1`,
        );
        return {
          expected:
            "Answering the Home survey stores a survey_responses row for Ada",
          actual: `no survey shown (Ada answered every active survey before); latest survey_responses ${row?.[0] ?? "none"}`,
          rows: { "quills.survey_responses": row?.[0] },
          result: row ? "pass" : "fail",
        };
      }
      await survey.getByRole("button").first().click();
      const mark = net.mark();
      await survey.getByRole("button", { name: "Send answer" }).click();
      const res = await net.wait(
        "POST",
        /\/widget\/surveys\/[^/]+\/responses$/,
        15000,
        mark,
      );
      const surveyId = res.path.split("/")[3];
      const [row] = L.sql(
        `select id, principal_id, choice, score from quills.survey_responses where survey_id = ${L.q(L.toUuid(surveyId))} and principal_id = ${L.q(adaUuid)}`,
      );
      const events = L.outbox([surveyId], since);
      return {
        expected:
          "Answering the Home survey stores a survey_responses row for Ada",
        actual: `POST responses ${res.status} ${JSON.stringify(res.request)}; survey_responses ${row?.[0] ?? "none"} principal=${row?.[1] === adaUuid ? "Ada" : row?.[1]} choice=${row?.[2]} score=${row?.[3]}; outbox ${events.map((e) => `${e.type}#${e.id}`).join(", ") || "none"}`,
        rows: { "quills.survey_responses": row?.[0] },
        outbox: events.map((e) => e.id),
        shot: await shot("26-survey"),
        result: res.status === 200 && row?.[1] === adaUuid ? "pass" : "fail",
      };
    });

    await step("teammate-hide-request", async () => {
      // A teammate shows Ada's request to its author only; Grace no longer sees it, Ada does.
      const postId = state.adaPostId;
      const tm = await L.teammate(require("playwright"));
      const visibility = (json) =>
        tm.put(`${L.API}/api/quills/${L.WS}/posts/${postId}/visibility`, {
          data: json,
        });
      const hidden = await visibility({ visible: true, authorOnly: true });
      const read = async (user) => {
        await page.reload();
        await page.waitForSelector("[data-event=ready]");
        const res = await signIn(user);
        const ctx = await require("playwright").request.newContext();
        const got = await ctx.get(
          `${L.API}/api/quills-public/${L.WS}/widget/posts/${postId}`,
          { headers: { authorization: `Bearer ${res.body.sessionToken}` } },
        );
        await ctx.dispose();
        return got.status();
      };
      const grace = await read("grace");
      await openView("postId", postId);
      const graceShot = await shot("35-hidden-request-grace");
      const ada = await read("ada");
      const [row] = L.sql(
        `select is_hidden, moderation_state from quills.posts where id = ${L.q(L.toUuid(postId))}`,
      );
      const shown = await visibility({ visible: true });
      const graceAgain = await read("grace");
      await signIn("ada");
      await tm.dispose();
      return {
        expected:
          "A teammate shows a request to its author only: another visitor gets 404, the author still reads it; showing it again restores it",
        actual: `visibility PUT ${hidden.status()} → posts.is_hidden=${row?.[0]} state=${row?.[1]}; Grace GET ${grace}; Ada GET ${ada}; shown again ${shown.status()} → Grace GET ${graceAgain}`,
        rows: { "quills.posts": L.toUuid(postId) },
        shot: graceShot,
        result:
          hidden.ok() &&
          row?.[0] === "t" &&
          grace === 404 &&
          ada === 200 &&
          shown.ok() &&
          graceAgain === 200
            ? "pass"
            : "fail",
      };
    });

    await step("moderation-auto-hold", async () => {
      // The team holds likely spam and sensitive information; the widget's posts go to review.
      const tm = await L.teammate(require("playwright"));
      const set = (json) =>
        tm.put(`${L.API}/api/quills/${L.WS}/moderation/default`, {
          data: json,
        });
      const on = await set({
        requireApproval: "none",
        holdSpam: true,
        holdSensitive: true,
      });
      const post = async (text) => {
        await openView("new-post");
        await frame.getByRole("textbox", { name: "Your feedback" }).fill(text);
        const mark = net.mark();
        await frame.getByRole("button", { name: "Post", exact: true }).click();
        const created = await net.wait("POST", /\/widget\/posts$/, 20000, mark);
        const [row] = L.sql(
          `select moderation_state from quills.posts where id = ${L.q(L.toUuid(created.body.id))}`,
        );
        return row?.[0];
      };
      const stamp = Date.now();
      const spam = await post(
        `BUY NOW CASINO BONUS ${stamp} http://a.test http://b.test http://c.test`,
      );
      const card = await post(
        `My card 4242 4242 4242 4242 does not work ${stamp}`,
      );
      const plain = await post(`Group requests by customer ${stamp}`);
      await set({
        requireApproval: "none",
        holdSpam: false,
        holdSensitive: false,
      });
      await tm.dispose();
      return {
        expected:
          "With the spam and sensitive-information holds on, a spammy post and a post with a card number wait for review; a normal post publishes",
        actual: `settings PUT ${on.status()}; spam → ${spam}; card number → ${card}; normal → ${plain}`,
        result:
          on.ok() &&
          spam === "pending" &&
          card === "pending" &&
          plain === "published"
            ? "pass"
            : "fail",
      };
    });

    await step("changelog-announcement", async () => {
      const tm = await L.teammate(require("playwright"));
      const title = `E2E announcement ${Date.now()}`;
      const created = await tm.post(`${L.API}/api/quills/${L.WS}/changelog`, {
        data: {
          title,
          content: "Shipped for the widget host E2E.",
          publishState: { type: "published" },
        },
      });
      await tm.dispose();
      await page.reload();
      await page.waitForSelector("[data-event=ready]");
      await signIn("ada");
      const bubble = page.getByRole("button", { name: `New: ${title}` });
      await bubble.waitFor({ timeout: 20000 });
      const shotPath = await shot("29-update-announcement");
      await bubble.click();
      await frame
        .getByRole("heading", { name: title })
        .first()
        .waitFor({ timeout: 15000 });
      const announced = (await log()).match(/announcement \{[^\n]*/)?.[0] ?? "";
      return {
        expected:
          "A new update shows its title beside the launcher (whisper); a click opens the entry; the host gets an announcement event",
        actual: `teammate publish ${created.status()}; bubble "New: ${title}" shown; entry opened; ${announced.slice(0, 160)}`,
        shot: shotPath,
        result:
          created.ok() && /announcement/.test(announced) ? "pass" : "fail",
      };
    });

    await step("activity-feed", async () => {
      // Ada follows this post (feedback-follow). A teammate reply reaches her Activity page.
      const postId = state.votePostId;
      const adaUuid = L.toUuid(state.ada.principalId);
      const tm = await L.teammate(require("playwright"));
      const text = `Teammate update ${Date.now()}`;
      const reply = await tm.post(
        `${L.API}/api/quills/${L.WS}/posts/${postId}/comments`,
        { data: { content: text } },
      );
      await tm.dispose();
      let row;
      for (let i = 0; i < 40 && !row; i++) {
        [row] = L.sql(
          `select id, type, read_at from quills.in_app_notifications where principal_id = ${L.q(adaUuid)} and body like ${L.q(text.slice(0, 40) + "%")}`,
        );
        if (!row) await sleep(1000);
      }
      await page.reload();
      await page.waitForSelector("[data-event=ready]");
      await signIn("ada");
      await openView("home");
      await frame
        .getByRole("button", { name: /^Activity/ })
        .first()
        .click();
      await frame.getByText(text).first().waitFor({ timeout: 15000 });
      const shotPath = await shot("30-activity");
      const mark = net.mark();
      await frame
        .getByRole("button", { name: /Mark as read/ })
        .first()
        .click();
      const read = await net.wait(
        "PUT",
        /\/widget\/activity\/[^/]+\/read$/,
        15000,
        mark,
      );
      const [after] = L.sql(
        `select read_at from quills.in_app_notifications where id = ${L.q(row?.[0] ?? "00000000-0000-0000-0000-000000000000")}`,
      );
      return {
        expected:
          "A teammate reply on a post Ada follows becomes an in-app notification for her; the widget Activity page lists it; Mark as read sets read_at",
        actual: `teammate comment ${reply.status()}; in_app_notifications ${row?.[0] ?? "none"} type=${row?.[1]}; listed in Activity; read ${read.status} read_at=${after?.[0] ? "set" : "null"}`,
        rows: { "quills.in_app_notifications": row?.[0] },
        shot: shotPath,
        result:
          reply.ok() && row && read.status === 200 && after?.[0]
            ? "pass"
            : "fail",
      };
    });

    await step("conversation-team-reply-unread", async () => {
      await hostButton("close").click();
      const tm = await L.teammate(require("playwright"));
      const reply = await tm.post(
        `${L.API}/api/quills/${L.WS}/conversations/${state.adaConversationId}/reply`,
        { data: { content: "Thanks Ada, a teammate here." } },
      );
      await tm.dispose();
      // The log is newest first: wait for the latest unread event, not an older one.
      await page.waitForFunction(
        () =>
          Number(
            document
              .querySelector("[data-testid=event-log]")
              .innerText.match(/unread \{"count":(\d+)\}/)?.[1] ?? 0,
          ) >= 1,
        null,
        { timeout: 40000 },
      );
      const badge = await page
        .locator(".quackback-launcher")
        .first()
        .innerText()
        .catch(() => "");
      await shot("27-unread-badge");
      await openView("messages");
      await frame
        .getByRole("button", { name: /Thanks Ada, a teammate here/ })
        .first()
        .click();
      await frame
        .getByText("Thanks Ada, a teammate here.")
        .first()
        .waitFor({ timeout: 15000 });
      const shotPath = await shot("28-team-reply");
      const unread = (await log()).match(/unread \{"count":(\d+)\}/)?.[1];
      return {
        expected:
          "A teammate reply reaches the widget: the host gets unread {count:1} while the panel is closed, the launcher shows it, and the thread shows the reply",
        actual: `teammate reply ${reply.status()}; host unread event count ${unread}; launcher text ${JSON.stringify(badge)}; reply visible in the thread`,
        shot: shotPath,
        result: reply.ok() && Number(unread) >= 1 ? "pass" : "fail",
      };
    });
  },

  async unsigned() {
    await step("identity-unsigned-readme", async () => {
      L.sql(
        "delete from quills.rate_bucket where key like 'createQuillsWidgetAnonymousSession:%' returning key",
      );
      await page.goto(L.HOST + "/script");
      await page.waitForSelector("[data-event=ready]", { timeout: 20000 });
      const mark = net.mark();
      await page.evaluate(() =>
        window.Quills("identify", {
          id: "u_123",
          email: "ada@example.com",
          name: "Ada",
        }),
      );
      await sleep(1500);
      const identifyCalls = net.calls
        .slice(mark)
        .filter((c) => c.path.endsWith("/widget/identify"));
      const event = ((await log()).match(/identify \{[^\n]*/g) || [])[0];
      const customer = L.sql(
        "select count(*) from quills.customer_identity where external_id = 'u_123'",
      )[0][0];
      // B-04: the README documents signed tokens only; an unsigned identify must say why it fails.
      const refused =
        identifyCalls.length === 0 &&
        /signed ssoToken/.test(event ?? "") &&
        customer === "0";
      return {
        expected:
          "Unsigned Quills.identify({ id, email, name }) is refused with a clear error, as the README now documents (signed tokens only); no customer is created",
        actual: `identify requests sent: ${identifyCalls.length}; host identify event ${event}; customers with external id u_123: ${customer}`,
        result: refused ? "pass" : "fail",
      };
    });
  },

  // Gaps G-17 and G-24: portal sign-in from the host app's identity, always into a Kaneo account.
  async portal() {
    const tm = await L.teammate(require("playwright"));
    const policy = `${L.API}/api/quills/${L.WS}/settings/portal/sign-in`;
    const setPolicy = (data) => tm.put(policy, { data });
    const accountOf = (email) =>
      L.sql(
        `select u.id, a.account_id, (select count(*) from public.workspace_member m where m.user_id = u.id) from public."user" u left join public.account a on a.user_id = u.id and a.provider_id = 'quills-portal' where u.email = ${L.q(email)}`,
      )[0] ?? [];
    const pageShot = async (target, name) => {
      await target.screenshot({ path: `${SHOTS}/${name}.png` });
      return `widget-e2e/${name}.png`;
    };
    try {
      await step("portal-widget-sign-in", async () => {
        const saved = await setPolicy({
          mode: "account",
          widgetSignIn: true,
          ssoUrl: null,
        });
        await page.goto(L.HOST + "/");
        await page.waitForSelector("[data-event=ready]");
        await signIn("ada");
        await sleep(1500);
        await openView("home");
        const [portal] = await Promise.all([
          page.context().waitForEvent("page"),
          frame.getByRole("button", { name: "Open in portal" }).click(),
        ]);
        await portal.waitForURL(/\/portal\//, { timeout: 30000 });
        await portal.waitForLoadState("networkidle");
        const signInLinks = await portal
          .getByRole("link", { name: "Sign in" })
          .count();
        const [userId, accountId, memberships] = accountOf(
          "ada@widget-host.test",
        );
        const [linked] =
          L.sql(
            `select kaneo_user_id from quills.customer_identity where external_id = 'host-ada'`,
          )[0] ?? [];
        const shotPath = await pageShot(portal, "39-portal-widget-sign-in");
        await portal.close();
        return {
          expected:
            "Widget sign-in on: Home → Open in portal opens the portal signed in with a portal-only Kaneo account created for this workspace's customer (a quills-portal account row, no team membership), and the widget profile links to it",
          actual: `settings PUT ${saved.status()}; portal ${portal.url().replace(/\?.*$/, "")}; Sign in links ${signInLinks}; Kaneo user ${userId ?? "none"} quills-portal ${accountId ?? "none"} memberships ${memberships}; customer_identity.kaneo_user_id ${linked ?? "none"}`,
          rows: {
            "public.user": userId,
            "quills.customer_identity (host-ada)": linked,
          },
          shot: shotPath,
          result:
            saved.ok() &&
            signInLinks === 0 &&
            userId &&
            accountId &&
            memberships === "0" &&
            linked === userId
              ? "pass"
              : "fail",
        };
      });

      await step("portal-sso-sign-in", async () => {
        const saved = await setPolicy({
          mode: "sso",
          widgetSignIn: false,
          ssoUrl: `${L.HOST}/sso`,
        });
        const context = await browser.newContext({
          viewport: { width: 1360, height: 900 },
        });
        const portal = await context.newPage();
        await portal.goto(`${L.WEB}/portal/${L.WS}`);
        await portal.getByRole("link", { name: "Sign in" }).first().click();
        await portal.waitForURL(/\/sso\?return_to=/, { timeout: 20000 });
        const host = portal.url().split("?")[0];
        await portal.getByRole("button", { name: /Continue as Grace/ }).click();
        await portal.waitForURL(/\/portal\//, { timeout: 30000 });
        await portal.waitForLoadState("networkidle");
        const signInLinks = await portal
          .getByRole("link", { name: "Sign in" })
          .count();
        const [userId, accountId, memberships] = accountOf(
          "grace@widget-host.test",
        );
        const shotPath = await pageShot(portal, "40-portal-sso-sign-in");
        await context.close();
        return {
          expected:
            "SSO mode: the portal's Sign in goes to the host app's login page, which returns a widget-secret token; the portal is then signed in with a portal-only Kaneo account for that customer",
          actual: `settings PUT ${saved.status()}; login page ${host}; back on ${portal.url().replace(/\?.*$/, "")}; Sign in links ${signInLinks}; Kaneo user ${userId ?? "none"} quills-portal ${accountId ?? "none"} memberships ${memberships}`,
          rows: { "public.user": userId },
          shot: shotPath,
          result:
            saved.ok() &&
            host === `${L.HOST}/sso` &&
            signInLinks === 0 &&
            userId &&
            accountId &&
            memberships === "0"
              ? "pass"
              : "fail",
        };
      });
    } finally {
      await setPolicy({ mode: "account", widgetSignIn: false, ssoUrl: null });
      await tm.dispose();
    }
  },
};

// The demo seed leaves the widget's Help tab off and defines no user attributes; the checks need
// Help and the "plan" attribute.
async function prepare() {
  const tm = await L.teammate(require("playwright"));
  const base = `${L.API}/api/quills/${L.WS}`;
  const defined = await (await tm.get(`${base}/user-attributes`)).text();
  if (!defined.includes('"key":"plan"'))
    await tm.post(`${base}/user-attributes`, {
      data: { key: "plan", label: "Plan", type: "string" },
    });
  await tm.put(`${base}/settings/widget`, { data: { tabs: { help: true } } });
  await tm.dispose();
}

(async () => {
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  net = L.captureNetwork(page);
  frame = page.frameLocator('iframe[src*="/widget"]');
  page.on("pageerror", (e) =>
    console.log("pageerror:", e.message.slice(0, 200)),
  );
  await prepare();
  for (const name of process.argv.slice(2)) await groups[name]();
  await browser.close();
})();
