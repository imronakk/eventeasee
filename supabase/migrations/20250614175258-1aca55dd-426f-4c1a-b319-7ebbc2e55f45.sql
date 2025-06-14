
-- Add ticket_sold field to events table
ALTER TABLE public.events 
ADD COLUMN ticket_sold integer NOT NULL DEFAULT 0;

-- Add a check constraint to ensure ticket_sold is not negative
ALTER TABLE public.events 
ADD CONSTRAINT check_ticket_sold_non_negative 
CHECK (ticket_sold >= 0);

-- Create a function to update ticket_sold when bookings are made
CREATE OR REPLACE FUNCTION update_event_ticket_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase ticket_sold when a new booking is confirmed
    IF NEW.status = 'confirmed' THEN
      UPDATE events 
      SET ticket_sold = ticket_sold + NEW.quantity 
      WHERE id = NEW.ticket_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      -- Booking confirmed, increase ticket_sold
      UPDATE events 
      SET ticket_sold = ticket_sold + NEW.quantity 
      WHERE id = NEW.ticket_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      -- Booking cancelled/changed, decrease ticket_sold
      UPDATE events 
      SET ticket_sold = ticket_sold - OLD.quantity 
      WHERE id = OLD.ticket_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status = 'confirmed' AND OLD.quantity != NEW.quantity THEN
      -- Quantity changed for confirmed booking
      UPDATE events 
      SET ticket_sold = ticket_sold + (NEW.quantity - OLD.quantity) 
      WHERE id = NEW.ticket_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease ticket_sold when a confirmed booking is deleted
    IF OLD.status = 'confirmed' THEN
      UPDATE events 
      SET ticket_sold = ticket_sold - OLD.quantity 
      WHERE id = OLD.ticket_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update ticket_sold
CREATE TRIGGER trigger_update_event_ticket_sold
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_event_ticket_sold();

-- Update existing events with current ticket_sold counts
UPDATE events 
SET ticket_sold = COALESCE((
  SELECT SUM(quantity) 
  FROM bookings 
  WHERE ticket_id = events.id 
  AND status = 'confirmed'
), 0);
