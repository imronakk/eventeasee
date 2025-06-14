
-- First, let's drop any existing triggers to start fresh
DROP TRIGGER IF EXISTS trigger_update_event_ticket_sold ON ticket_info;
DROP TRIGGER IF EXISTS trigger_update_event_ticket_sold ON bookings;

-- Recreate the function with better error handling and logging
CREATE OR REPLACE FUNCTION update_event_ticket_sold()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger operation for debugging
  RAISE NOTICE 'Trigger fired: %, Table: %, Event ID: %', TG_OP, TG_TABLE_NAME, 
    CASE WHEN TG_OP = 'DELETE' THEN OLD.event_id ELSE NEW.event_id END;
  
  IF TG_OP = 'INSERT' THEN
    -- Increase ticket_sold when a new booking is confirmed
    IF NEW.status = 'confirmed' THEN
      UPDATE events 
      SET ticket_sold = ticket_sold + NEW.quantity 
      WHERE id = NEW.event_id;
      
      RAISE NOTICE 'Increased ticket_sold by % for event %', NEW.quantity, NEW.event_id;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      -- Booking confirmed, increase ticket_sold
      UPDATE events 
      SET ticket_sold = ticket_sold + NEW.quantity 
      WHERE id = NEW.event_id;
      
      RAISE NOTICE 'Booking confirmed: increased ticket_sold by % for event %', NEW.quantity, NEW.event_id;
      
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      -- Booking cancelled/changed, decrease ticket_sold
      UPDATE events 
      SET ticket_sold = ticket_sold - OLD.quantity 
      WHERE id = OLD.event_id;
      
      RAISE NOTICE 'Booking cancelled: decreased ticket_sold by % for event %', OLD.quantity, OLD.event_id;
      
    ELSIF OLD.status = 'confirmed' AND NEW.status = 'confirmed' AND OLD.quantity != NEW.quantity THEN
      -- Quantity changed for confirmed booking
      UPDATE events 
      SET ticket_sold = ticket_sold + (NEW.quantity - OLD.quantity) 
      WHERE id = NEW.event_id;
      
      RAISE NOTICE 'Quantity changed: adjusted ticket_sold by % for event %', (NEW.quantity - OLD.quantity), NEW.event_id;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease ticket_sold when a confirmed booking is deleted
    IF OLD.status = 'confirmed' THEN
      UPDATE events 
      SET ticket_sold = ticket_sold - OLD.quantity 
      WHERE id = OLD.event_id;
      
      RAISE NOTICE 'Booking deleted: decreased ticket_sold by % for event %', OLD.quantity, OLD.event_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on ticket_info table
CREATE TRIGGER trigger_update_event_ticket_sold
  AFTER INSERT OR UPDATE OR DELETE ON ticket_info
  FOR EACH ROW
  EXECUTE FUNCTION update_event_ticket_sold();

-- Let's also add Row Level Security policies for ticket_info if they don't exist
DO $$
BEGIN
  -- Check if RLS is enabled, if not enable it
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'ticket_info' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.ticket_info ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for ticket_info if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ticket_info' 
    AND policyname = 'Users can view their own ticket info'
  ) THEN
    CREATE POLICY "Users can view their own ticket info" 
      ON public.ticket_info 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ticket_info' 
    AND policyname = 'Users can create their own ticket info'
  ) THEN
    CREATE POLICY "Users can create their own ticket info" 
      ON public.ticket_info 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ticket_info' 
    AND policyname = 'Users can update their own ticket info'
  ) THEN
    CREATE POLICY "Users can update their own ticket info" 
      ON public.ticket_info 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;
