// Prints the report table from out/results.json.
const r = require("./out/results.json");
const F = {
  "identity-anonymous": [
    "Identity: anonymous session",
    "Open the panel with no user signed in",
  ],
  "identity-anonymous-vote": [
    "Identity: anonymous vote",
    'Anonymous: Feedback → "Portal demo feedback" → Vote',
  ],
  "identity-anonymous-conversation": [
    "Identity: anonymous conversation",
    "Anonymous: Messages → New conversation → Send",
  ],
  "identity-identify-merge": [
    "Identity: identify, segments, attributes, anonymous-to-identified merge",
    'metadata({plan:"pro"}); sign in as Ada (token with plan and segments ["beta-program"])',
  ],
  "identity-switch-user": [
    "Identity: switch user",
    "Sign in as Grace; open Messages",
  ],
  "identity-logout": [
    "Identity: logout",
    "logout(); getUser(); isIdentified()",
  ],
  "identity-unsigned-readme": [
    "Identity: unsigned identify is refused",
    'Script tag: Quills("identify", {id, email, name})',
  ],
  "feedback-deeplink-prefill": [
    "Feedback: new-post deep link",
    'open({view:"new-post", title:"Bug: export fails", board:"bugs"})',
  ],
  "feedback-similar": [
    "Feedback: find similar posts",
    'Type "a more visible search shortcut please" in the composer',
  ],
  "feedback-create-with-screenshot": [
    "Feedback: create a post with a screenshot",
    "Type the post; Capture screenshot → Use image → Post",
  ],
  "feedback-vote-unvote": [
    "Feedback: vote and unvote",
    "open({postId}) → Vote → Voted (unvote)",
  ],
  "feedback-comment": [
    "Feedback: comment",
    'Post detail → "Your comment" → Post comment',
  ],
  "feedback-follow": [
    "Feedback: subscribe (follow)",
    "Post detail → Follow request",
  ],
  "feedback-search": [
    "Feedback: search",
    'Feedback → Search feedback "upload error"',
  ],
  "feedback-markdown-preview": [
    "Feedback: list previews",
    "Read the Feedback list",
  ],
  "roadmap-read": ["Roadmap: read", "Feedback → Sort feedback → Roadmap"],
  "changelog-read-react": [
    "Changelog: read and react",
    'open({view:"changelog"}) → entry → React 🎉',
  ],
  "changelog-subscribe": [
    "Changelog: subscribe to updates",
    "Look for a subscribe control in Updates",
  ],
  "help-deeplink-query": [
    "Help: search deep link",
    'open({view:"help", query:"roadmap"})',
  ],
  "help-search-read-feedback": [
    "Help: search, read, article feedback",
    'Search "roadmap" → open the first hit → Yes',
  ],
  "conversation-start-reply": [
    "Conversations: start and reply",
    "Messages → New conversation → Send → open thread → reply",
  ],
  "conversation-team-reply-unread": [
    "Conversations: team reply and unread badge",
    "Teammate replies through the API while the panel is closed; open the thread",
  ],
  "conversation-attach-file": [
    "Conversations: attach a file",
    "Look for an attachment control in the conversation composer",
  ],
  "conversation-contact-email": [
    "Conversations: set the contact email",
    "Look for an email field in the widget",
  ],
  "survey-response": [
    "Home: survey answer",
    "Home → survey → answer → Send answer",
  ],
  "privacy-cross-user": [
    "Negative: user A vs user B",
    "Grace's session token reads Ada's conversation, messages and list (API)",
  ],
  "negative-token-bad-signature": [
    "Negative: bad signature",
    'Token select "bad-signature", sign in as Linus, open the panel',
  ],
  "negative-token-expired": [
    "Negative: expired token",
    'Token select "expired", sign in as Linus, open the panel',
  ],
  "negative-token-no-sub": [
    "Negative: token without sub",
    'Token select "no-sub", sign in as Linus, open the panel',
  ],
  "negative-token-no-email": [
    "Negative: token without email",
    'Token select "no-email", sign in as Linus, open the panel',
  ],
  "negative-anonymous-as-identified": [
    "Negative: anonymous acting as identified",
    "Anonymous token reads Ada's conversation; identify with Ada's token as previousToken",
  ],
  "negative-blocked": [
    "Negative: blocked person",
    "Teammate blocks Linus (PUT /users/{id}/block); sign in as Linus",
  ],
  "sdk-state-queries": [
    "SDK: isOpen, getUser, isIdentified (React)",
    "open → isOpen/getUser/isIdentified → close → isOpen",
  ],
  "sdk-launcher-show-hide": [
    "SDK: showLauncher, hideLauncher",
    "hideLauncher → showLauncher",
  ],
  "sdk-placement-launcher-option": [
    "SDK: placement and launcher option",
    'init placement "left"; init launcher false',
  ],
  "sdk-locale": ["SDK: locale", 'init locale "fr"; open'],
  "sdk-deep-links": [
    "SDK: deep links",
    "open each view, an entry, a post and an article slug",
  ],
  "sdk-on-off": [
    "SDK: on and off",
    "off(all) → open/close → on(all) → open/close",
  ],
  "sdk-metadata": [
    "SDK: metadata",
    'metadata({plan:null}), metadata({team:"finance"}) → new post',
  ],
  "sdk-tracking": [
    "SDK: tracking on and off",
    "tracking(false) → tracking(true) → reload",
  ],
  "sdk-destroy": ["SDK: destroy", "destroy → isOpen"],
  "script-tag-embed": [
    "Script tag embed",
    "/script: sign in as Grace, open changelog, state queries",
  ],
  "teammate-post": [
    "Teammate app: post",
    "Teammate opens /feedback/{ws}/posts/{postId}",
  ],
  "teammate-post-custom-metadata": [
    "Teammate app: host metadata on the post",
    "Read the Page context of the post",
  ],
  "teammate-post-attachment": [
    "Teammate app: post screenshot",
    "Read the post and GET /api/quills/{ws}/posts/{id}",
  ],
  "teammate-conversation": [
    "Teammate app: conversation",
    "Teammate opens /feedback/{ws}/conversations/{id}",
  ],
  "teammate-person": [
    "Teammate app: person",
    "Teammate opens /feedback/{ws}/members/{principalId}",
  ],
  "sdk-control-surface": [
    "SDK: control surface",
    "toggle(); getState(); setTheme(dark); launcher { selector }; offset",
  ],
  "sdk-page-url": [
    "SDK: page URL privacy",
    "init({ pageUrl: 'origin' }) and 'none'; post feedback each time",
  ],
  "sdk-inline-embed": [
    "SDK: inline embed",
    "Check inline: init({ container: '#inline-widget' }); close(); getState()",
  ],
  "changelog-announcement": [
    "Changelog: launcher announcement",
    "Publish an update; reload the host page",
  ],
  "activity-feed": [
    "Activity: notifications page",
    "A teammate replies on Ada's request; open({ view: 'notifications' })",
  ],
  "messenger-team-home": [
    "Messenger: team presence, avatars and reply time",
    "A teammate is online; open Home",
  ],
  "conversation-away-reply": [
    "Conversation: away reply",
    "Turn on the away reply; no teammate online; send a message",
  ],
  "conversation-ip-block": [
    "Conversation: block the sender's address",
    "Teammate: conversation menu → Block IP; the visitor sends again; Unblock IP",
  ],
  "teammate-hide-request": [
    "Teammate: hide one request",
    "Teammate: visibility → Shown to its author only; check the widget as another person",
  ],
  "moderation-auto-hold": [
    "Moderation: spam and sensitive holds",
    "Turn on the checks; post spam, a card number and a normal request",
  ],
  "api-search-typos": [
    "Search: typos, partial words and minus words",
    "GET /widget/posts?search= with a typo, a prefix and a minus word",
  ],
};
const esc = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
const order = Object.keys(F);
const lines = [
  "| # | Feature | Steps | Expected records | Actual rows and outbox | Result |",
  "|---|---|---|---|---|---|",
];
let n = 0;
for (const id of order) {
  const v = r[id];
  if (!v) {
    console.error("missing", id);
    continue;
  }
  const rows = Object.entries(v.rows || {})
    .filter(([, x]) => x)
    .map(([t, x]) => `\`${t}\` ${x}`)
    .join("<br>");
  const outbox = (v.outbox || []).length
    ? `<br>outbox \`quills.events\` ${v.outbox.map((o) => (String(o).includes("#") ? o : `#${o}`)).join(", ")}`
    : "";
  const shot = v.shot ? ` [screenshot](${v.shot})` : "";
  const note = v.note ? ` _${esc(v.note)}_` : "";
  lines.push(
    `| ${++n} | ${F[id][0]} | ${esc(F[id][1])} | ${esc(v.expected)} | ${esc(v.actual)}${rows ? `<br>${rows}` : ""}${outbox}${shot}${note} | ${v.result === "pass" ? "Pass" : "**Fail**"}${v.defect ? `: ${esc(v.defect)}` : ""} |`,
  );
}
console.log(lines.join("\n"));
