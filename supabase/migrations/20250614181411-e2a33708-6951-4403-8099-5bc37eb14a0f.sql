
-- Drop the existing trigger since it references the wrong table
DROP TRIGGER IF EXISTS trigger_update_event_ticket_sold ON bookings;

-- Update the function to work with ticket_info table
CREATE OR REPLACE FUNCTION update_event_ticket_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increase ticket_sold when a new booking is confirmed
    IF NEW.status = 'confirmed' THEN
      UPDATE events 
      SET ticket_sold = ticket_sold + NEW.quantity 
      WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      -- Booking confirmed, increase ticket_sold
      UPDATE events 
      SET ticket_sold = ticket_sold + NEW.quantity 
      WHERE id = NEW.event_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      -- Booking cancelled/changed, decrease ticket_sold
      UPDATE events 
      SET ticket_sold = ticket_sold - OLD.quantity 
      WHERE id = OLD.event_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status = 'confirmed' AND OLD.quantity != NEW.quantity THEN
      -- Quantity changed for confirmed booking
      UPDATE events 
      SET ticket_sold = ticket_sold + (NEW.quantity - OLD.quantity) 
      WHERE id = NEW.event_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease ticket_sold when a confirmed booking is deleted
    IF OLD.status = 'confirmed' THEN
      UPDATE events 
      SET ticket_sold = ticket_sold - OLD.quantity 
      WHERE id = OLD.event_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on ticket_info table to automatically update ticket_sold
CREATE TRIGGER trigger_update_event_ticket_sold
  AFTER INSERT OR UPDATE OR DELETE ON ticket_info
  FOR EACH ROW
  EXECUTE FUNCTION update_event_ticket_sold();
