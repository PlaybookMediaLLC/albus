import { EmailIntro } from "../../components/email-intro";
import { Frame } from "../../components/frame";
import { Spacer } from "../../components/spacer";
import { EmailButton } from "../../components/email-button";
import React from "react";
void React;
import { Column, Row, Section, Text } from "@react-email/components";
import { EmailLayout, NotificationFooter } from "./email-layout";
import { typography, colors } from "./shared-styles";

interface PostUpdateEmailProps {
  postTitle: string;
  postUrl: string;
  /** The update text, as plain text. */
  body: string;
  organizationName: string;
  unsubscribeUrl: string;
  preferencesUrl?: string;
  logoUrl?: string;
}

/** A team's update about a request that the customer follows (#92). */
export function PostUpdateEmail({
  postTitle,
  postUrl,
  body,
  organizationName,
  unsubscribeUrl,
  preferencesUrl,
  logoUrl,
}: PostUpdateEmailProps) {
  return (
    <EmailLayout
      footer={
        <NotificationFooter
          reason="You received this email because you follow this feedback."
          unsubscribeUrl={unsubscribeUrl}
          preferencesUrl={preferencesUrl}
        />
      }
      preview={`Update on "${postTitle}"`}
      logoUrl={logoUrl}
      logoAlt={organizationName}
    >
      {/* Content */}
      <EmailIntro title="An update on your feedback" />
      <Text className="k-text-85" style={typography.text}>
        The {organizationName} team has an update on feedback that you follow.
      </Text>

      {/* Post Title */}
      <>
        <Frame title="Feedback">
          <Text
            className="k-text-85"
            style={{
              ...typography.textSmall,
              marginTop: "0",
              marginBottom: "4px",
              color: colors.textMuted,
            }}
          >
            Feedback
          </Text>
          <Text
            className="k-text-85"
            style={{
              ...typography.text,
              marginTop: "0",
              marginBottom: "0",
              fontWeight: "600",
            }}
          >
            {postTitle}
          </Text>
        </Frame>
        <Spacer size={20} />
      </>

      {/* The update - Row/Column instead of border-left for Outlook compatibility */}
      <Row style={{ marginBottom: "24px" }}>
        <Column
          style={{
            width: "3px",
            backgroundColor: colors.primary,
            borderRadius: "2px",
          }}
        />
        <Column style={{ paddingLeft: "16px" }}>
          <Text
            className="k-text-85"
            style={{
              ...typography.text,
              marginTop: "0",
              marginBottom: "0",
              whiteSpace: "pre-wrap",
            }}
          >
            {body}
          </Text>
        </Column>
      </Row>

      {/* CTA Button */}
      <Section
        style={{ textAlign: "start", marginTop: "32px", marginBottom: "32px" }}
      >
        <EmailButton href={postUrl}>View Feedback</EmailButton>
      </Section>

      {/* Footer */}
    </EmailLayout>
  );
}
