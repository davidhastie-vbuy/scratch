-- Migration: Update all email trigger functions from bookatrade.lovable.app to bookatrade.io
-- This runs as a new migration against the live database

-- 1. notify_provider_new_message
DO $$
DECLARE
  _src TEXT;
BEGIN
  SELECT prosrc INTO _src FROM pg_proc WHERE proname = 'notify_provider_new_message' AND pronamespace = 'public'::regnamespace;
  IF _src LIKE '%bookatrade.lovable.app%' THEN
    _src := replace(_src, 'https://bookatrade.lovable.app', 'https://bookatrade.io');
    EXECUTE format('CREATE OR REPLACE FUNCTION public.notify_provider_new_message() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''public'' AS $fn$ %s $fn$', _src);
    RAISE NOTICE 'Updated: notify_provider_new_message';
  END IF;
END $$;

-- Generic updater for all functions with the old URL
DO $$
DECLARE
  _rec RECORD;
  _new_src TEXT;
  _func_def TEXT;
BEGIN
  FOR _rec IN
    SELECT p.proname, pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.prosrc LIKE '%bookatrade.lovable.app%'
  LOOP
    _func_def := replace(_rec.def, 'https://bookatrade.lovable.app', 'https://bookatrade.io');
    EXECUTE _func_def;
    RAISE NOTICE 'Updated function: %', _rec.proname;
  END LOOP;
END $$;
