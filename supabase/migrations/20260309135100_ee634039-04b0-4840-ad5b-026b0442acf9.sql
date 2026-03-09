
-- Function to count active providers in a given postcode district for a given category
-- (counts providers whose primary OR additional categories include the category AND whose operating_areas include the postcode)
CREATE OR REPLACE FUNCTION public.count_providers_in_slot(_postcode text, _category text)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.provider_profiles
  WHERE status = 'active'
    AND _postcode = ANY(operating_areas)
    AND (trade_category = _category OR _category = ANY(additional_categories))
$$;

-- Validation trigger: enforce max 3 providers per postcode per category
-- Fires when a provider is activated or when an active provider's areas/categories change
CREATE OR REPLACE FUNCTION public.enforce_provider_slot_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _area text;
  _cat text;
  _all_cats text[];
  _count integer;
BEGIN
  -- Only check when provider is active (either just activated or already active and changing areas/categories)
  IF NEW.status != 'active' THEN
    RETURN NEW;
  END IF;

  -- Skip check if nothing relevant changed on an already-active provider
  IF TG_OP = 'UPDATE' AND OLD.status = 'active'
    AND OLD.operating_areas IS NOT DISTINCT FROM NEW.operating_areas
    AND OLD.trade_category IS NOT DISTINCT FROM NEW.trade_category
    AND OLD.additional_categories IS NOT DISTINCT FROM NEW.additional_categories THEN
    RETURN NEW;
  END IF;

  -- Build array of all categories for this provider
  _all_cats := ARRAY[NEW.trade_category] || COALESCE(NEW.additional_categories, '{}'::text[]);

  -- Check each combination
  FOREACH _area IN ARRAY COALESCE(NEW.operating_areas, '{}'::text[])
  LOOP
    FOREACH _cat IN ARRAY _all_cats
    LOOP
      SELECT COUNT(*)::integer INTO _count
      FROM public.provider_profiles
      WHERE status = 'active'
        AND id != NEW.id
        AND _area = ANY(operating_areas)
        AND (trade_category = _cat OR _cat = ANY(additional_categories));

      IF _count >= 3 THEN
        RAISE EXCEPTION 'Maximum of 3 providers reached for category "%" in postcode "%". Cannot activate or update this provider.', _cat, _area;
      END IF;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_provider_slot_limit_trigger
  BEFORE INSERT OR UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_provider_slot_limit();
