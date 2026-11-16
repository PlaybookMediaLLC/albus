/**
 * Opens a new tab while the click still counts (a popup opened after an await can be blocked),
 * then points it at the short-lived URL that `load` returns. The new tab gets no access to this
 * page, and this page never navigates away, so an unsent draft stays. Throws when the browser
 * blocks the tab or `load` fails; the empty tab then closes.
 */
export async function openDownload(load: () => Promise<string>) {
  const tab = window.open("", "_blank");
  if (!tab) throw new Error("The browser blocked the new tab");
  tab.opener = null;
  try {
    tab.location.href = await load();
  } catch (error) {
    tab.close();
    throw error;
  }
}
