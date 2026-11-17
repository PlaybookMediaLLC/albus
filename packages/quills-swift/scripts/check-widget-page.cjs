// Drives the widget sheet's page (QuillsWidgetPage.html) in Chromium as the iOS sheet does:
// loaded at the instance's origin, with window.webkit.messageHandlers.quills standing in for the
// app. Usage: node check-widget-page.cjs <page.html> <instance URL> <identity token>
const fs = require("node:fs");
const { chromium } = require("playwright");

const [pageFile, instance, token] = process.argv.slice(2);
if (!pageFile || !instance || !token) {
  console.error(
    "Usage: node check-widget-page.cjs <page.html> <instance URL> <identity token>",
  );
  process.exit(2);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    window.__messages = [];
    window.webkit = {
      messageHandlers: {
        quills: {
          postMessage: (text) => window.__messages.push(JSON.parse(text)),
        },
      },
    };
  });
  // As loadHTMLString(_:baseURL:) with the instance URL: the page has the instance's origin.
  const sheet = `${instance}/native-sheet`;
  await page.route(sheet, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: fs.readFileSync(pageFile, "utf8"),
    }),
  );
  await page.goto(sheet);
  const messages = () => page.evaluate(() => window.__messages);
  // Inline mode opens and starts an anonymous session on its own: look only after each call.
  const until = async (from, test, what) => {
    for (let i = 0; i < 150; i += 1) {
      const found = (await messages()).slice(from).find(test);
      if (found) return found;
      await page.waitForTimeout(200);
    }
    throw new Error(`no ${what} message`);
  };
  await until(0, (m) => m.type === "ready", "ready");
  let from = (await messages()).length;
  await page.evaluate((t) => window.quillsNative.identify(t), token);
  const identify = await until(
    from,
    (m) => m.type === "identify" && m.payload?.user,
    "identify",
  );
  from = (await messages()).length;
  await page.evaluate(() => window.quillsNative.open({ view: "changelog" }));
  const opened = await until(from, (m) => m.type === "open", "open");
  const frame = page.frameLocator("#quills iframe");
  await frame.getByRole("heading").first().waitFor({ timeout: 15000 });
  await page.screenshot({ path: process.env.SHOT || "native-sheet.png" });
  const result = {
    ready: true,
    identify: identify.payload,
    open: opened.payload,
    types: [...new Set((await messages()).map((m) => m.type))],
    launchers: await page.locator(".quackback-launcher").count(),
  };
  console.log(JSON.stringify(result));
  await browser.close();
  process.exit(
    identify.payload?.success && opened.payload?.view === "changelog" ? 0 : 1,
  );
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
