import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { identityToken } from "./token.ts";
import { USERS } from "./users.ts";

const secret = "wgt_test";
const decode = (token: string) =>
  JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString());
const verifies = (token: string) => {
  const [head, body, sig] = token.split(".");
  return (
    createHmac("sha256", secret)
      .update(`${head}.${body}`)
      .digest("base64url") === sig
  );
};

test("a valid token carries the identity claims and verifies", () => {
  const token = identityToken(USERS[0]!, "valid", secret, 1000);
  assert.ok(verifies(token));
  assert.deepEqual(decode(token), {
    sub: "host-ada",
    email: "ada@widget-host.test",
    name: "Ada Host",
    traits: { plan: "pro" },
    segments: ["beta-program"],
    companies: [
      {
        id: "host-acme",
        name: "Acme Host Inc",
        domain: "acme.widget-host.test",
      },
    ],
    iat: 1000,
    exp: 1600,
  });
});

test("bad variants break exactly one property", () => {
  assert.equal(
    verifies(identityToken(USERS[1]!, "bad-signature", secret)),
    false,
  );
  assert.ok(
    decode(identityToken(USERS[1]!, "expired", secret, 1000)).exp < 1000,
  );
  assert.equal(
    decode(identityToken(USERS[1]!, "no-sub", secret)).sub,
    undefined,
  );
  assert.equal(
    decode(identityToken(USERS[1]!, "no-email", secret)).email,
    undefined,
  );
});
