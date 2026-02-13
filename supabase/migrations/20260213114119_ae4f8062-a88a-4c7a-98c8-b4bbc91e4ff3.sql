
CREATE OR REPLACE FUNCTION public.handle_new_provider()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (NEW.raw_user_meta_data->>'role') = 'provider' THEN
    INSERT INTO public.provider_profiles (
      user_id, business_name, contact_first_name, contact_last_name,
      phone, business_address, postcode, trade_category, business_description,
      years_experience, qualifications_certifications, about_work,
      accreditations, operating_areas, status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'business_address', ''),
      COALESCE(NEW.raw_user_meta_data->>'postcode', ''),
      COALESCE(NEW.raw_user_meta_data->>'trade_category', 'other'),
      COALESCE(NEW.raw_user_meta_data->>'business_description', ''),
      COALESCE(NEW.raw_user_meta_data->>'years_experience', NULL),
      COALESCE(NEW.raw_user_meta_data->>'qualifications_certifications', NULL),
      COALESCE(NEW.raw_user_meta_data->>'about_work', NULL),
      CASE 
        WHEN NEW.raw_user_meta_data->'accreditations' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'accreditations'))
        ELSE '{}'::text[]
      END,
      CASE 
        WHEN NEW.raw_user_meta_data->'operating_areas' IS NOT NULL 
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'operating_areas'))
        ELSE '{}'::text[]
      END,
      'pending_review'
    );
  END IF;
  RETURN NEW;
END;
$function$;
