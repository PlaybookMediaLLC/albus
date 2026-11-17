-- quills:view_revenue (#79): customer revenue is its own permission. A stored default role whose
-- Quills actions are still exactly the previous default keeps seeing revenue, as before this
-- migration: member and admin gain view_revenue. Viewers, customized defaults and custom roles stay
-- unchanged; an owner grants the permission in the Roles screen. Owner is a static role.
DO $$ DECLARE r record; value jsonb; actions text[]; BEGIN
FOR r IN SELECT id,role,permission FROM public.workspace_role WHERE role IN ('member','admin') LOOP
BEGIN value := r.permission::jsonb; EXCEPTION WHEN invalid_text_representation THEN CONTINUE; END;
IF jsonb_typeof(value->'quills') IS DISTINCT FROM 'array' THEN CONTINUE; END IF;
SELECT array_agg(a ORDER BY a) INTO actions FROM jsonb_array_elements_text(value->'quills') a;
IF (r.role='member' AND actions=ARRAY['create','read','update'])
OR (r.role='admin' AND actions=ARRAY['create','delete','manage_settings','read','update']) THEN
UPDATE public.workspace_role SET permission=jsonb_set(value,'{quills}',(value->'quills') || '["view_revenue"]'::jsonb)::text,updated_at=now() WHERE id=r.id;
END IF;
END LOOP; END $$;
--> statement-breakpoint
SELECT quills_migrations.capture_schema_manifest();
