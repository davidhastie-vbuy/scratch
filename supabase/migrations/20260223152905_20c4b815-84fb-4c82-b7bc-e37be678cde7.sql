-- Enforce that max price is greater than or equal to min price in quotes table
ALTER TABLE public.quotes
ADD CONSTRAINT quotes_price_range_check 
CHECK (price_max >= price_min);