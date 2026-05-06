
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  banner_url text,
  starts_at timestamptz,
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events readable" ON public.events;
CREATE POLICY "events readable" ON public.events FOR SELECT USING (true);
DROP POLICY IF EXISTS "events admin write" ON public.events;
CREATE POLICY "events admin write" ON public.events FOR ALL USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.ban_appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_response text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
ALTER TABLE public.ban_appeals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appeals own select" ON public.ban_appeals;
CREATE POLICY "appeals own select" ON public.ban_appeals FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "appeals own insert" ON public.ban_appeals;
CREATE POLICY "appeals own insert" ON public.ban_appeals FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "appeals admin update" ON public.ban_appeals;
CREATE POLICY "appeals admin update" ON public.ban_appeals FOR UPDATE USING (public.is_admin(auth.uid()));

ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS cashed_out_at timestamptz;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
