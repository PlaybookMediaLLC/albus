/**
 * Opens a short-lived download URL in a new tab, or in this tab when the browser blocks the new
 * one (a popup opened after an await can be blocked). The new tab gets no access to this page.
 */
export function openDownload(url: string) {
  const opened = window.open(url, "_blank");
  if (opened) opened.opener = null;
  else window.location.assign(url);
}
