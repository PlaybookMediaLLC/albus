import { and, eq } from "drizzle-orm";
import { beforeAll } from "vite-plus/test";
import { conversationMessages } from "../../database/quills/schema/conversation";
import { helpCenterArticleTranslations } from "../../database/quills/schema/kb";
import { finishedRun } from "./runs";
import { has, lacks } from "./score";
import { evalSuite } from "./suite";
import { thread } from "./thread";

// Translation: a teammate translates a customer message (run), and the help center translates an
// article with protected terms. A protected term is a placeholder for the model; a translation
// that loses or repeats one is not used (assistant/protected-terms.ts), so a dropped placeholder
// shows here as a missing translation.

const MESSAGES = [
  {
    id: "Spanish message to English",
    text: "Hola, el pago de 49 € de la factura INV-2041 aparece dos veces en mi tarjeta.",
    language: "English",
    keeps: ["49", "INV-2041"],
    anyOf: ["twice", "two times", "charged"],
    drops: ["factura", "tarjeta"],
  },
  {
    id: "German message to English",
    text: "Der Export nach CSV bricht nach 1.000 Zeilen ab.",
    language: "English",
    keeps: ["CSV", "1"],
    anyOf: ["rows", "lines", "stops"],
    drops: ["bricht", "Zeilen"],
  },
  {
    id: "English message to French",
    text: "Please reset my password, the link https://app.example.com/reset expired.",
    language: "French",
    keeps: ["https://app.example.com/reset"],
    anyOf: ["mot de passe", "lien"],
    drops: ["Please", "expired"],
  },
];

const ARTICLE = {
  title: "Connect Acme Sync to Quills",
  content:
    "## Connect Acme Sync\n\nOpen **Settings > Integrations** in Quills and choose Acme Sync. Paste the token from https://acme.example.com/tokens and press Save. Quills then imports new tickets every 5 minutes.",
};

evalSuite("translation", 0.8, (kit) => {
  let articleId = "";
  beforeAll(async () => {
    await kit.ok(kit.h.owner, "/help-center/settings/locales", "PUT", {
      locale: "fr",
      chrome: {
        homepageTitle: "Centre d'aide",
        homepageDescription: "Trouvez des réponses",
        searchPlaceholder: "Rechercher",
      },
    });
    await kit.ok(kit.h.owner, "/help-center/settings", "PATCH", {
      autoTranslate: { protectedTerms: ["Quills", "Acme Sync"] },
    });
    const category = await kit.ok(
      kit.h.owner,
      "/help-center/categories",
      "POST",
      { name: "Guides", isPublic: true },
    );
    const created = await kit.ok(kit.h.owner, "/help-center/articles", "POST", {
      categoryId: category.body.id,
      ...ARTICLE,
    });
    articleId = created.body.id;
  });

  for (const item of MESSAGES)
    kit.case(item.id, async () => {
      const { conversationId } = await thread(kit.h, [
        { from: "customer", text: item.text },
      ]);
      const [message] = await kit.h.system(kit.h.a, (db) =>
        db
          .select({ id: conversationMessages.id })
          .from(conversationMessages)
          .where(
            eq(conversationMessages.conversationId, conversationId as never),
          ),
      );
      const created = await kit.ok(
        kit.h.owner,
        `/conversations/${conversationId}/messages/${message!.id}/translate`,
        "POST",
        { language: item.language },
      );
      const { failed, run } = await finishedRun(kit, created.body.id);
      const text = run.output?.text ?? "";
      return {
        checks: {
          "run succeeded": failed === 0 && run.status === "succeeded",
          "keeps the facts": item.keeps.every((fact) => text.includes(fact)),
          translates: item.anyOf.some((word) => has(text, word)),
          "changes the text": lacks(text, ...item.drops),
        },
        detail: text,
      };
    });

  kit.case("article to French with protected terms", async () => {
    await kit.ok(
      kit.h.owner,
      `/help-center/articles/${articleId}/auto-translate`,
      "POST",
      { locale: "fr" },
    );
    const failed = await kit.settle();
    const [translation] = await kit.h.system(kit.h.a, (db) =>
      db
        .select({
          title: helpCenterArticleTranslations.title,
          content: helpCenterArticleTranslations.content,
        })
        .from(helpCenterArticleTranslations)
        .where(
          and(
            eq(helpCenterArticleTranslations.articleId, articleId as never),
            eq(helpCenterArticleTranslations.locale, "fr"),
          ),
        ),
    );
    const text = `${translation?.title ?? ""}\n${translation?.content ?? ""}`;
    return {
      checks: {
        "job succeeded": failed === 0,
        "keeps every placeholder (translation stored)": Boolean(
          translation?.content,
        ),
        "keeps the protected terms":
          has(text, "Quills") && has(text, "Acme Sync"),
        "keeps the link and Markdown":
          text.includes("https://acme.example.com/tokens") &&
          text.includes("##"),
        translates:
          has(text, "jeton") || has(text, "paramètres") || has(text, "Ouvrez"),
        "changes the text": lacks(text, "Paste the token", "press Save"),
      },
      detail: text,
    };
  });
});
