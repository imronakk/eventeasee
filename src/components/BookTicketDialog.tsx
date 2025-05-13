
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/utils/formatters';

interface BookTicketDialogProps {
  eventId: string;
  eventName: string;
  ticketId: string;
  ticketPrice: number;
  maxQuantity: number;
}

export function BookTicketDialog({ eventId, eventName, ticketId, ticketPrice, maxQuantity }: BookTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > maxQuantity) {
      setQuantity(maxQuantity);
    } else {
      setQuantity(value);
    }
  };

  const handleBookTickets = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to book tickets."
      });
      navigate('/auth');
      return;
    }

    try {
      setIsSubmitting(true);

      // First check if tickets are still available
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('quantity_remaining')
        .eq('id', ticketId)
        .single();

      if (ticketError) throw ticketError;

      if (ticketData.quantity_remaining < quantity) {
        throw new Error(`Sorry, only ${ticketData.quantity_remaining} tickets remaining.`);
      }

      // Create booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          quantity: quantity,
          total_amount: ticketPrice * quantity,
          status: 'confirmed'
        });

      if (bookingError) throw bookingError;

      // Update ticket quantity remaining
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ quantity_remaining: ticketData.quantity_remaining - quantity })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      toast({
        title: "Tickets booked!",
        description: `You have successfully booked ${quantity} ticket(s) for ${eventName}.`
      });

      setOpen(false);
      // Redirect to audience dashboard tickets tab
      navigate('/audience-dashboard?tab=tickets');
    } catch (error: any) {
      console.error("Error booking tickets:", error);
      toast({
        variant: "destructive",
        title: "Failed to book tickets",
        description: error.message || "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Book Tickets</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Tickets</DialogTitle>
          <DialogDescription>
            Book tickets for {eventName}. Price per ticket: {formatCurrency(ticketPrice)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={maxQuantity}
              className="col-span-3"
              value={quantity}
              onChange={handleQuantityChange}
            />
          </div>
          <div className="col-span-3">
            <p className="text-sm text-muted-foreground">
              Maximum available tickets: {maxQuantity}
            </p>
            <p className="font-semibold mt-4">
              Total: {formatCurrency(ticketPrice * quantity)}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleBookTickets} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
