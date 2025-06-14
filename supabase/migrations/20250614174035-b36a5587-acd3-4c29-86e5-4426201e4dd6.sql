
-- Add price column to the events table
ALTER TABLE public.events 
ADD COLUMN price numeric DEFAULT 0;

-- Add a comment to document the price column
COMMENT ON COLUMN public.events.price IS 'Ticket price for the event';
