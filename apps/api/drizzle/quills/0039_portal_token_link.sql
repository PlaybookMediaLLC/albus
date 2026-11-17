-- Gaps G-17 and G-24: a portal token sign-in creates a portal-only Kaneo account for one widget
-- customer. On that account's first portal request, withQuillsAudience vouches for it
-- (quills.customer_user_id, from the session), and the existing widget profile links to it, so the
-- person's votes and conversations carry over. An UPDATE may now set a link, but only from no link
-- to the vouched account. Moving a link between accounts, or to an account the session does not
-- vouch for, is still refused unless the account is a workspace member (the 0001 rule).
CREATE OR REPLACE FUNCTION quills.check_customer_membership() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
BEGIN
  -- Null-safe on purpose: without a vouched account the setting is empty, and that must refuse.
  IF NEW.kaneo_user_id IS NOT NULL
    AND (
      NEW.kaneo_user_id IS DISTINCT FROM nullif(current_setting('quills.customer_user_id', true), '')
      OR (TG_OP = 'UPDATE' AND OLD.kaneo_user_id IS NOT NULL AND OLD.kaneo_user_id IS DISTINCT FROM NEW.kaneo_user_id)
    )
    AND NOT EXISTS (SELECT 1 FROM public.workspace_member WHERE workspace_id=NEW.workspace_id AND user_id=NEW.kaneo_user_id) THEN
    RAISE EXCEPTION 'Kaneo user is not a member of this workspace' USING ERRCODE='23503';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION quills.check_customer_membership() FROM PUBLIC;
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
