-- Function to extract a UK postcode outward district from any input.
-- e.g. "CW2 6RW" -> "CW2", "cw26rw" -> "CW2", "SW1A 1AA" -> "SW1A", "CW2" -> "CW2"
CREATE OR REPLACE FUNCTION public.extract_postcode_district(_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  stripped text;
  outward text;
  match_result text;
BEGIN
  IF _raw IS NULL THEN
    RETURN NULL;
  END IF;
  stripped := upper(regexp_replace(_raw, '\s+', '', 'g'));
  IF stripped = '' THEN
    RETURN '';
  END IF;
  -- If full postcode (>= 5 chars), strip the last 3 (inward code)
  IF length(stripped) >= 5 THEN
    outward := left(stripped, length(stripped) - 3);
  ELSE
    outward := stripped;
  END IF;
  -- Match standard UK outward pattern: 1–2 letters, 1 digit, optional digit/letter
  match_result := substring(outward FROM '^[A-Z]{1,2}[0-9][A-Z0-9]?');
  RETURN COALESCE(match_result, outward);
END;
$$;

-- Trigger: normalise jobs.postcode_district on insert/update so matching always works
CREATE OR REPLACE FUNCTION public.normalise_job_postcode_district()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.postcode_district := public.extract_postcode_district(NEW.postcode_district);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_normalise_postcode_district ON public.jobs;
CREATE TRIGGER jobs_normalise_postcode_district
  BEFORE INSERT OR UPDATE OF postcode_district ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.normalise_job_postcode_district();

-- Backfill: fix existing job rows where a full postcode was stored
UPDATE public.jobs
SET postcode_district = public.extract_postcode_district(postcode_district)
WHERE postcode_district IS DISTINCT FROM public.extract_postcode_district(postcode_district);

-- Also normalise provider operating_areas (in case any contain spaces or full postcodes)
UPDATE public.provider_profiles
SET operating_areas = ARRAY(
  SELECT DISTINCT public.extract_postcode_district(a)
  FROM unnest(operating_areas) AS a
  WHERE public.extract_postcode_district(a) <> ''
)
WHERE operating_areas IS NOT NULL
  AND operating_areas <> ARRAY(
    SELECT DISTINCT public.extract_postcode_district(a)
    FROM unnest(operating_areas) AS a
    WHERE public.extract_postcode_district(a) <> ''
  );