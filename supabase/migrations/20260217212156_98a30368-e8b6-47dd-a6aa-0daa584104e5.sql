
-- Add email notification preference to provider_profiles
ALTER TABLE public.provider_profiles 
ADD COLUMN email_notifications_enabled boolean NOT NULL DEFAULT true;

-- Create a function to notify provider via edge function when a customer sends a message
CREATE OR REPLACE FUNCTION public.notify_provider_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _conv RECORD;
  _provider_profile RECORD;
  _provider_email TEXT;
  _job_title TEXT;
BEGIN
  -- Get conversation details
  SELECT * INTO _conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  
  -- Only notify if the sender is the customer (i.e., message is TO the provider)
  IF NEW.sender_user_id = _conv.provider_user_id THEN RETURN NEW; END IF;
  
  -- Get job title
  SELECT title INTO _job_title FROM public.jobs WHERE id = _conv.job_id;
  
  -- Create an in-app notification for the provider
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _conv.provider_user_id,
    'new_message',
    'New message received',
    'You have a new message regarding "' || COALESCE(_job_title, 'a job') || '"',
    '/provider/messages'
  );
  
  -- Check if provider has email notifications enabled
  SELECT * INTO _provider_profile 
  FROM public.provider_profiles 
  WHERE user_id = _conv.provider_user_id;
  
  IF _provider_profile.email_notifications_enabled THEN
    -- Get provider email from profiles table
    SELECT email INTO _provider_email FROM public.profiles WHERE id = _conv.provider_user_id;
    
    IF _provider_email IS NOT NULL AND _provider_email != '' THEN
      -- Call edge function to send email via pg_net
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-provider-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'to', _provider_email,
          'subject', 'New message on TradeTrust',
          'html', '<h2>You have a new message</h2><p>A customer has sent you a message regarding "<strong>' || COALESCE(_job_title, 'a job') || '</strong>".</p><p>Log in to your TradeTrust dashboard to view and reply.</p>'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on messages table
CREATE TRIGGER on_new_message_notify_provider
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_provider_new_message();
