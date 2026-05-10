-- Void a single bet selection on a booked ticket (e.g. match cancelled/voided).
-- Sets selection.result='void', locks its odds to 1.0, then recomputes the parent
-- bet's total_odds and potential_payout from the remaining live legs.
CREATE OR REPLACE FUNCTION public.admin_void_bet_selection(_selection_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s record;
  b record;
  new_odds numeric;
  new_payout bigint;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RAISE EXCEPTION 'Admin only'; END IF;

  SELECT * INTO s FROM public.bet_selections WHERE id = _selection_id FOR UPDATE;
  IF s IS NULL THEN RAISE EXCEPTION 'Selection not found'; END IF;
  IF s.result = 'void' THEN RAISE EXCEPTION 'Selection already void'; END IF;

  SELECT * INTO b FROM public.bets WHERE id = s.bet_id FOR UPDATE;
  IF b IS NULL THEN RAISE EXCEPTION 'Bet not found'; END IF;
  IF b.status::text IN ('won','lost','cashed_out','refunded') THEN
    RAISE EXCEPTION 'Cannot void a selection on a settled ticket';
  END IF;

  UPDATE public.bet_selections
     SET result = 'void', locked_odds = 1.0
   WHERE id = _selection_id;

  SELECT COALESCE(EXP(SUM(LN(GREATEST(locked_odds, 0.0001)))), 1.0)
    INTO new_odds
    FROM public.bet_selections
   WHERE bet_id = b.id;
  new_payout := FLOOR(b.stake * new_odds)::bigint;

  UPDATE public.bets
     SET total_odds = new_odds,
         potential_payout = new_payout
   WHERE id = b.id;

  INSERT INTO public.notifications(user_id, title, body, link)
  VALUES (
    b.user_id,
    'Match voided on your ticket',
    COALESCE(_reason, 'A match on your ticket was voided. Odds and payout were recalculated.'),
    '/ticket/' || b.id
  );

  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, metadata)
  VALUES (
    auth.uid(),
    'void_bet_selection',
    'bet_selection',
    _selection_id::text,
    jsonb_build_object('bet_id', b.id, 'reason', _reason, 'new_total_odds', new_odds, 'new_payout', new_payout)
  );
END $$;