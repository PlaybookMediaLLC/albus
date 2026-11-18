import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  assertStorageConfigured,
  isQuillsObjectKey,
  isQuillsStorageDedicated,
  quillsStorageConfig,
} from "./s3";

const kaneo = {
  S3_ENDPOINT: "https://files.example.test",
  S3_BUCKET: "kaneo",
  S3_ACCESS_KEY_ID: "kaneo-key",
  S3_SECRET_ACCESS_KEY: "kaneo-secret",
};
const r2 = {
  QUILLS_STORAGE_ENDPOINT: "https://account.r2.cloudflarestorage.com",
  QUILLS_STORAGE_BUCKET: "quills-media",
  QUILLS_STORAGE_ACCESS_KEY_ID: "r2-key",
  QUILLS_STORAGE_SECRET_ACCESS_KEY: "r2-secret",
};

const stub = (values: Record<string, string>) => {
  for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value);
};

describe("feedback app storage", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses Kaneo's bucket when no dedicated bucket is set", () => {
    stub(kaneo);
    vi.stubEnv("QUILLS_STORAGE_BUCKET", "");
    expect(isQuillsStorageDedicated()).toBe(false);
    expect(quillsStorageConfig()).toMatchObject({ bucket: "kaneo" });
  });

  it("uses the dedicated R2 bucket with its own credentials and an auto region", () => {
    stub({ ...kaneo, ...r2 });
    expect(isQuillsStorageDedicated()).toBe(true);
    expect(quillsStorageConfig()).toMatchObject({
      endpoint: r2.QUILLS_STORAGE_ENDPOINT,
      bucket: "quills-media",
      accessKeyId: "r2-key",
      region: "auto",
      forcePathStyle: true,
    });
    // Kaneo's own uploads keep their bucket.
    expect(assertStorageConfigured()).toMatchObject({ bucket: "kaneo" });
  });

  it("reads the public URL and key prefix of the dedicated bucket", () => {
    stub({
      ...r2,
      QUILLS_STORAGE_PUBLIC_BASE_URL: "https://media.example.test",
      QUILLS_STORAGE_KEY_PREFIX: "prod",
    });
    expect(quillsStorageConfig()).toMatchObject({
      publicBaseUrl: "https://media.example.test",
      keyPrefix: "prod",
    });
  });

  it("names the missing dedicated settings", () => {
    stub({ QUILLS_STORAGE_BUCKET: "quills-media" });
    vi.stubEnv("QUILLS_STORAGE_ENDPOINT", "");
    expect(() => quillsStorageConfig()).toThrow(/QUILLS_STORAGE_ENDPOINT/);
  });

  it("recognizes the keys that the feedback app wrote", () => {
    expect(
      isQuillsObjectKey("workspace/ws_1/quills/customer_avatar/c_1/a.png"),
    ).toBe(true);
    expect(isQuillsObjectKey("prod/workspace/ws_1/quills/logo/a.png")).toBe(
      true,
    );
    expect(isQuillsObjectKey("workspace/ws_1/project/p_1/task/a.png")).toBe(
      false,
    );
  });
});
