import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  SettingsCard,
  SettingsNote,
  SettingsRow,
  SettingsSection,
} from "../../../ui/upstream";
import type { CustomDomain } from "../domain-status";
import { AddDomainDialog } from "./add-domain-dialog";
import { DomainRow } from "./domain-row";

export interface DomainSectionProps {
  title: string;
  note: string;
  /** The address that always serves, without a custom domain. */
  defaultAddress: string;
  domain: CustomDomain | null;
  entitled: boolean;
  manage: boolean;
  onSet: (domain: string) => Promise<unknown>;
  onVerify: () => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}

/**
 * One custom domain: the default address, the custom domain and its DNS record. A section
 * holds one domain, so "Add domain" shows only while none is set.
 */
export function DomainSection(props: DomainSectionProps) {
  const { t } = useTranslation("quills");
  return (
    <SettingsSection
      title={props.title}
      action={
        props.manage && !props.domain ? (
          <AddDomainDialog locked={!props.entitled} onSet={props.onSet} />
        ) : null
      }
    >
      <SettingsCard>
        <SettingsRow
          icon={<Globe />}
          title={
            <span className="font-mono font-normal">
              {props.defaultAddress}
            </span>
          }
          description={t("settings-workspace.domain.defaultAddress")}
        />
        {props.domain ? (
          <DomainRow
            domain={props.domain}
            entitled={props.entitled}
            manage={props.manage}
            onVerify={props.onVerify}
            onRemove={props.onRemove}
          />
        ) : null}
      </SettingsCard>
      <SettingsNote>{props.note}</SettingsNote>
    </SettingsSection>
  );
}
