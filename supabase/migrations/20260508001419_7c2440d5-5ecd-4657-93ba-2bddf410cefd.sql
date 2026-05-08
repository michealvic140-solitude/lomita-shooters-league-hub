
-- Withdrawal requests
CREATE TYPE public.withdrawal_status AS ENUM ('pending','approved','declined');

CREATE TABLE public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ingame_name text NOT NULL,
  gang_name text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  ticket_ref text,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own withdrawals" ON public.withdrawal_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users view own withdrawals" ON public.withdrawal_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "admins update withdrawals" ON public.withdrawal_requests
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "admins delete withdrawals" ON public.withdrawal_requests
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

ALTER TABLE public.withdrawal_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;

-- Settings additions
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS min_stake bigint NOT NULL DEFAULT 2000000,
  ADD COLUMN IF NOT EXISTS popup_ad_size text NOT NULL DEFAULT 'large';

-- Manual leaderboard overrides
CREATE TABLE public.leaderboard_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('gang','shooter')),
  name text NOT NULL,
  top_player text,
  wins int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  draws int NOT NULL DEFAULT 0,
  played int NOT NULL DEFAULT 0,
  points int NOT NULL DEFAULT 0,
  manual_rank int,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leaderboard_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard public read" ON public.leaderboard_overrides FOR SELECT USING (true);
CREATE POLICY "leaderboard admin write" ON public.leaderboard_overrides FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Atomic withdrawal request creation (deducts balance + inserts row)
CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  _amount bigint, _ingame text, _gang text, _ticket text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  bal bigint;
  req_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT token_balance INTO bal FROM profiles WHERE id = uid FOR UPDATE;
  IF bal IS NULL OR bal < _amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE profiles SET token_balance = token_balance - _amount WHERE id = uid;
  INSERT INTO withdrawal_requests(user_id, ingame_name, gang_name, amount, ticket_ref)
    VALUES (uid, _ingame, _gang, _amount, _ticket) RETURNING id INTO req_id;
  INSERT INTO notifications(user_id, title, body)
    VALUES (uid, 'Withdrawal requested', 'Your request for '||_amount||' tokens has been submitted.');
  RETURN req_id;
END $$;

-- Admin decision (approve keeps deduction, decline refunds)
CREATE OR REPLACE FUNCTION public.review_withdrawal_request(
  _id uuid, _approve boolean, _note text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin only'; END IF;
  SELECT * INTO r FROM withdrawal_requests WHERE id = _id FOR UPDATE;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Already reviewed'; END IF;
  IF _approve THEN
    UPDATE withdrawal_requests SET status='approved', admin_note=_note, reviewed_by=auth.uid(), reviewed_at=now() WHERE id=_id;
    INSERT INTO notifications(user_id, title, body)
      VALUES (r.user_id, 'Withdrawal approved', COALESCE(_note,'Your withdrawal of '||r.amount||' tokens has been approved. You will receive payout instructions shortly.'));
  ELSE
    UPDATE profiles SET token_balance = token_balance + r.amount WHERE id = r.user_id;
    UPDATE withdrawal_requests SET status='declined', admin_note=_note, reviewed_by=auth.uid(), reviewed_at=now() WHERE id=_id;
    INSERT INTO notifications(user_id, title, body)
      VALUES (r.user_id, 'Withdrawal declined', COALESCE(_note,'Your withdrawal was declined. Tokens have been refunded.'));
  END IF;
END $$;
