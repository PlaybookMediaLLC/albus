import React from "react";
void React;
import { describe, expect, it } from "vite-plus/test";
import { render } from "@react-email/components";
import { directionOf } from "../direction";
import { NewCommentEmail } from "../templates/new-comment";
import { ShippedEmail } from "../templates/shipped";
import { StatusChangeEmail } from "../templates/status-change";
import { WeeklyDigestEmail } from "../templates/weekly-digest";

// Issue #117: the customer feedback emails follow the recipient's text direction.

const common = {
  organizationName: "Acme",
  unsubscribeUrl: "https://acme.example.com/unsubscribe",
};
const templates = {
  status: (dir?: "ltr" | "rtl") => (
    <StatusChangeEmail
      {...common}
      dir={dir}
      postTitle="تصدير CSV"
      postUrl="https://acme.example.com/p/1"
      previousStatus=""
      newStatus="planned"
    />
  ),
  shipped: (dir?: "ltr" | "rtl") => (
    <ShippedEmail
      {...common}
      dir={dir}
      entryTitle="تم الإطلاق"
      entryUrl="https://acme.example.com/c/1"
      requestTitle="تصدير CSV"
    />
  ),
  digest: (dir?: "ltr" | "rtl") => (
    <WeeklyDigestEmail
      {...common}
      dir={dir}
      items={[
        {
          title: "تصدير CSV",
          status: "Planned",
          url: "https://acme.example.com/p/1",
        },
      ]}
      myFeedbackUrl="https://acme.example.com/me"
    />
  ),
  comment: (dir?: "ltr" | "rtl") => (
    <NewCommentEmail
      {...common}
      dir={dir}
      postTitle="تصدير CSV"
      postUrl="https://acme.example.com/p/1"
      commenterName="Ada"
      commentPreview="شكرا"
      isTeamMember={false}
    />
  ),
};

describe("customer email direction", () => {
  it.each(Object.entries(templates))(
    "lays %s out right to left for an Arabic reader",
    async (_name, email) => {
      const html = await render(email("rtl"));
      expect(html).toMatch(/<html[^>]*dir="rtl"/);
    },
  );

  it.each(Object.entries(templates))(
    "keeps %s left to right by default",
    async (_name, email) => {
      expect(await render(email())).toMatch(/<html[^>]*dir="ltr"/);
      expect(await render(email())).toBe(await render(email("ltr")));
    },
  );

  it("knows the direction of a language", () => {
    expect(directionOf("ar-EG")).toBe("rtl");
    expect(directionOf("fa")).toBe("rtl");
    expect(directionOf("en")).toBe("ltr");
    expect(directionOf("de-AT")).toBe("ltr");
  });
});
