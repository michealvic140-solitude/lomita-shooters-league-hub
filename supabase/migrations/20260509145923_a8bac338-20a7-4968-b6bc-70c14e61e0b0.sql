DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='sponsor' AND enumtypid='public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'sponsor';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='suspended' AND enumtypid='public.bet_status'::regtype) THEN
    ALTER TYPE public.bet_status ADD VALUE 'suspended';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='refunded' AND enumtypid='public.bet_status'::regtype) THEN
    ALTER TYPE public.bet_status ADD VALUE 'refunded';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='ticket_status' AND e.enumlabel='in_progress') THEN
    ALTER TYPE public.ticket_status ADD VALUE 'in_progress' AFTER 'open';
  END IF;
END $$;