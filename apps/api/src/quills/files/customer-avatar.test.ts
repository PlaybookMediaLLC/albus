import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { customerAvatarUrl } from "./customer-avatar";

const key = "workspace/ws_1/quills/customer_avatar/c_1/a.webp";
const r2 = {
  QUILLS_STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
  QUILLS_STORAGE_BUCKET: "quills-media",
  QUILLS_STORAGE_ACCESS_KEY_ID: "r2-key",
  QUILLS_STORAGE_SECRET_ACCESS_KEY: "r2-secret",
};

describe("customerAvatarUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("points at the object on the bucket's public domain", () => {
    for (const [name, value] of Object.entries(r2)) vi.stubEnv(name, value);
    vi.stubEnv("QUILLS_STORAGE_PUBLIC_BASE_URL", "https://media.example.test/");
    expect(customerAvatarUrl("ws_1", "principal_1", key)).toBe(
      `https://media.example.test/${key}`,
    );
  });

  it("points at the API's redirect route, versioned by the key", () => {
    for (const [name, value] of Object.entries(r2)) vi.stubEnv(name, value);
    vi.stubEnv("QUILLS_STORAGE_PUBLIC_BASE_URL", "");
    vi.stubEnv("KANEO_API_URL", "https://api.example.test/");
    const url = customerAvatarUrl("ws_1", "principal_1", key);
    expect(url).toMatch(
      /^https:\/\/api\.example\.test\/api\/quills-public\/ws_1\/avatars\/principal_1\?v=[0-9a-f]{12}$/,
    );
    expect(customerAvatarUrl("ws_1", "principal_1", `${key}2`)).not.toBe(url);
  });
});
