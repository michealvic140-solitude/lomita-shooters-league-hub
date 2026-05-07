
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS hero_tagline TEXT DEFAULT 'Season 4 · Live',
  ADD COLUMN IF NOT EXISTS popup_ad_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popup_ad_image TEXT,
  ADD COLUMN IF NOT EXISTS popup_ad_text TEXT,
  ADD COLUMN IF NOT EXISTS popup_ad_link TEXT;

INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Realtime: REPLICA IDENTITY FULL + add to publication
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'matches','odds','markets','chat_messages','ticket_messages','notifications',
    'support_tickets','bets','bet_selections','profiles','advertisements','highlights',
    'announcements','events','token_requests','ban_appeals'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- Allow mods/admins to delete support tickets and ticket messages
DROP POLICY IF EXISTS "mods delete tickets" ON public.support_tickets;
CREATE POLICY "mods delete tickets" ON public.support_tickets
  FOR DELETE TO authenticated
  USING (public.is_mod_or_admin(auth.uid()));

DROP POLICY IF EXISTS "mods delete ticket messages" ON public.ticket_messages;
CREATE POLICY "mods delete ticket messages" ON public.ticket_messages
  FOR DELETE TO authenticated
  USING (public.is_mod_or_admin(auth.uid()));
