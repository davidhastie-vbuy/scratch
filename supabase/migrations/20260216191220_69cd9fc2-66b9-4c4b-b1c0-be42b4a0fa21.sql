
-- Enable pg_cron and pg_net extensions for scheduled function calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the edge function to run every 5 minutes
SELECT cron.schedule(
  'update-job-statuses-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gkiohsumxlzqfnnjflgb.supabase.co/functions/v1/update-job-statuses',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdraW9oc3VteGx6cWZubmpmbGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTQ2OTUsImV4cCI6MjA4NjIzMDY5NX0.kT4NNDjDkb99ytLZVnfxsHYjx3_BZHwnjOx81kZQyNE"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
