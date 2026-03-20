
DO $$
DECLARE
  _func RECORD;
  _new_def TEXT;
BEGIN
  FOR _func IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosrc LIKE '%app.settings.service_role_key%'
  LOOP
    _new_def := _func.def;
    _new_def := REPLACE(_new_def,
      'current_setting(''app.settings.supabase_url'', true)',
      'public._supabase_url()');
    _new_def := REPLACE(_new_def,
      'current_setting(''app.settings.service_role_key'', true)',
      'public._supabase_anon_key()');
    EXECUTE _new_def;
    RAISE NOTICE 'Updated function: %', _func.proname;
  END LOOP;
END;
$$;
