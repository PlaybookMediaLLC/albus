export const INSTANCE_URL =
  import.meta.env.VITE_QUILLS_INSTANCE_URL ?? "http://127.0.0.1:1390";
export const WORKSPACE =
  import.meta.env.VITE_QUILLS_WORKSPACE ?? "quills_portal_demo";
export const SDK_URL = `${INSTANCE_URL}/api/quills-public/${WORKSPACE}/widget/sdk.js`;
