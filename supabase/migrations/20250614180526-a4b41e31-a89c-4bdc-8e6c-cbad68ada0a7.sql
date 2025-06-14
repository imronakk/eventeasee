
-- Create ticket_info table to store detailed booking information
CREATE TABLE public.ticket_info (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  quantity integer NOT NULL,
  total_amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.ticket_info ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own ticket info
CREATE POLICY "Users can view their own ticket info" 
  ON public.ticket_info 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own ticket info
CREATE POLICY "Users can create their own ticket info" 
  ON public.ticket_info 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own ticket info
CREATE POLICY "Users can update their own ticket info" 
  ON public.ticket_info 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_ticket_info_event_id ON public.ticket_info(event_id);
CREATE INDEX idx_ticket_info_user_id ON public.ticket_info(user_id);
