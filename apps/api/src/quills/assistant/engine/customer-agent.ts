import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { withQuillsSystemWorkspace } from "../../../database/quills/client";
import {
  ASSISTANT_MODEL_HANDOFF_REASONS,
  assistantInvolvements,
} from "../../../database/quills/schema/assistant";
import { settings } from "../../../database/quills/schema/auth";
import {
  conversationMessages,
  conversations,
} from "../../../database/quills/schema/conversation";
import type { ConversationMessageCitation } from "../../../database/quills/types";
import { recordQuillsChange } from "../../events";
import { preview, systemNotice } from "../../support/conversation-model";
import { aiConfig, chatJson, untrusted } from "../provider";
import { logUsage } from "../runs";
import { readConfig } from "../settings";
import { formatSources, searchArticles, searchKnowledge } from "./retrieval";
import { nothing, type Work } from "./shared";

// The customer agent (gap G-31): while a teammate turns it on, it answers a widget or portal
// conversation from the help center and documents. It hands off to the team with a private note
// when it cannot help or the customer asks for a person, and it can propose one feedback request
// per conversation, which the customer confirms. A conversation that a teammate owns, or that the
// agent already handed off or resolved, is left to the team.

const answer = z.object({
  reply: z.string().max(3000),
  handoff: z.enum(ASSISTANT_MODEL_HANDOFF_REASONS).nullable(),
  feedback: z
    .object({
      title: z.string().trim().min(3).max(120),
      body: z.string().trim().max(2000),
    })
    .nullable(),
  sourceIds: z.array(z.string()).max(10),
});
const TRANSCRIPT = 12;

/** conversation.created and message.created: answers the customer's newest message. */
export const answerCustomer: Work = async (workspaceId, event) => {
  if (!aiConfig()) return nothing;
  const payload = event.payload as Record<string, string>;
  const messageId =
    event.type === "conversation.created" ? payload.messageId : event.entityId;
  const read = await withQuillsSystemWorkspace(workspaceId, async (db) => {
    const [row] = await db
      .select({ config: settings.assistantConfig })
      .from(settings)
      .limit(1);
    const config = readConfig(row!.config);
    if (!config.agent.enabled || !messageId) return null;
    const [message] = await db
      .select({
        conversationId: conversationMessages.conversationId,
        senderType: conversationMessages.senderType,
        content: conversationMessages.content,
      })
      .from(conversationMessages)
      .where(eq(conversationMessages.id, messageId as never));
    if (message?.senderType !== "visitor" || !message.conversationId)
      return null;
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, message.conversationId));
    if (
      !conversation ||
      conversation.channel !== "messenger" ||
      conversation.status !== "open" ||
      conversation.assignedAgentPrincipalId
    )
      return null;
    const [involvement] = await db
      .select({
        id: assistantInvolvements.id,
        status: assistantInvolvements.status,
      })
      .from(assistantInvolvements)
      .where(eq(assistantInvolvements.conversationId, conversation.id))
      .orderBy(desc(assistantInvolvements.createdAt))
      .limit(1);
    if (involvement && involvement.status !== "active") return null;
    const transcript = (
      await db
        .select({
          senderType: conversationMessages.senderType,
          content: conversationMessages.content,
          metadata: conversationMessages.metadata,
        })
        .from(conversationMessages)
        .where(
          and(
            eq(conversationMessages.conversationId, conversation.id),
            eq(conversationMessages.isInternal, false),
            isNull(conversationMessages.deletedAt),
          ),
        )
        .orderBy(desc(conversationMessages.createdAt))
        .limit(TRANSCRIPT)
    ).reverse();
    const sources = [
      ...(config.agent.knowledge.helpCenter
        ? await searchArticles(db, message.content, "public")
        : []),
      ...(await searchKnowledge(
        db,
        message.content,
        "public",
        config.agent.knowledge.documents,
      )),
    ];
    return {
      config,
      conversation,
      involvement,
      question: message.content,
      transcript,
      sources,
      // At most one proposed request per conversation.
      cardOffered: transcript.some((row) => row.metadata?.feedbackCard),
    };
  });
  if (!read) return nothing;
  const { config, conversation, involvement, question, transcript, sources } =
    read;
  const voice = config.agent.voice;
  const reply = await chatJson(answer, [
    {
      role: "system",
      content: [
        `You are ${config.identity.name}, the support assistant in a product's help widget. Tone: ${voice.tone}. Length: ${voice.responseLength}.`,
        config.agent.productDescription &&
          `The product: ${config.agent.productDescription}`,
        voice.additionalInstructions,
        "Answer only from the sources. When they do not answer the question, or the customer asks for a person, is frustrated, repeats themselves or asks for something you cannot do, set handoff to the reason and keep reply to one short sentence that a teammate will follow up.",
        read.cardOffered
          ? "Set feedback to null."
          : "When the customer asks for a new feature or reports a product problem, set feedback to a short request title and body in their words; otherwise null.",
        'Answer with one JSON object: {"reply": string, "handoff": reason or null, "feedback": {"title": string, "body": string} or null, "sourceIds": string[]}.',
      ]
        .filter(Boolean)
        .join("\n"),
    },
    { role: "system", content: untrusted("sources", formatSources(sources)) },
    {
      role: "user",
      content: untrusted(
        "conversation",
        transcript
          .map(
            (row) =>
              `${row.senderType === "visitor" ? "Customer" : "Team"}: ${row.content}`,
          )
          .join("\n"),
      ),
    },
  ]);
  const citations: ConversationMessageCitation[] = sources
    .filter((source) => reply.value.sourceIds.includes(source.id))
    .map((source) => ({
      type: source.type,
      id: source.id,
      title: source.title,
      url: "",
    }));
  const card =
    reply.value.feedback && !read.cardOffered
      ? { ...reply.value.feedback, status: "proposed" as const }
      : undefined;
  return async (db) => {
    await logUsage(db, [
      {
        step: "customer_agent",
        callType: "chat_completion",
        usage: reply.usage,
      },
    ]);
    // A teammate may have taken or closed the conversation while the model answered.
    const [current] = await db
      .select({
        status: conversations.status,
        assignee: conversations.assignedAgentPrincipalId,
      })
      .from(conversations)
      .where(eq(conversations.id, conversation.id))
      .for("update");
    const [latest] = await db
      .select({
        id: assistantInvolvements.id,
        status: assistantInvolvements.status,
      })
      .from(assistantInvolvements)
      .where(eq(assistantInvolvements.conversationId, conversation.id))
      .orderBy(desc(assistantInvolvements.createdAt))
      .limit(1);
    if (
      current?.status !== "open" ||
      current.assignee ||
      latest?.id !== involvement?.id ||
      (latest && latest.status !== "active")
    )
      return;
    const now = new Date();
    const involvementId =
      involvement?.id ??
      (
        await db
          .insert(assistantInvolvements)
          .values({
            conversationId: conversation.id,
            triggeredBy: "first_touch",
          })
          .returning({ id: assistantInvolvements.id })
      )[0]!.id;
    const text = reply.value.reply.trim();
    if (text) {
      const [message] = await db
        .insert(conversationMessages)
        .values({
          conversationId: conversation.id,
          principalId: null,
          senderType: "agent",
          content: text,
          citations: citations.length ? citations : null,
          metadata: {
            assistantReply: true,
            ...(card && { feedbackCard: card }),
          },
        })
        .returning({
          id: conversationMessages.id,
          createdAt: conversationMessages.createdAt,
        });
      await db
        .update(conversations)
        .set({
          lastMessageAt: message!.createdAt,
          lastMessagePreview: preview(text),
          updatedAt: message!.createdAt,
        })
        .where(eq(conversations.id, conversation.id));
      await recordQuillsChange(db, null, {
        type: "message.created",
        entityType: "conversation_message",
        entityId: message!.id,
        payload: { conversationId: conversation.id, source: "assistant" },
      });
    }
    await db
      .update(assistantInvolvements)
      .set({
        lastAssistantAnswerAt: now,
        sources: citations.map(({ type, id, title }) => ({
          type,
          id,
          title,
        })) as never,
        ...(reply.value.handoff && {
          status: "handed_off" as const,
          handoffReason: reply.value.handoff,
          endedAt: now,
        }),
      })
      .where(eq(assistantInvolvements.id, involvementId));
    if (reply.value.handoff) {
      // The private handoff note: why, and what the customer asked, for the teammate who takes over.
      await systemNotice(
        db,
        conversation.id,
        `${config.identity.name} handed this conversation to the team (${reply.value.handoff.replace(/_/g, " ")}). The customer asked: "${question.slice(0, 500)}"`,
        { internal: true, event: { kind: "assistant_handoff" } },
      );
      await systemNotice(db, conversation.id, "A teammate will reply here.", {
        event: { kind: "assistant_handoff" },
      });
      await db
        .update(conversations)
        .set({
          waitingSince: sql`coalesce(${conversations.waitingSince}, now())`,
        })
        .where(eq(conversations.id, conversation.id));
    }
  };
};
