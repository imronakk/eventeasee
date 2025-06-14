
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Ticket } from 'lucide-react';

interface BookTicketDialogProps {
  event: {
    id: string;
    name: string;
    price: number;
    venue: {
      name: string;
      capacity: number;
    };
  };
  availableTickets: number;
  onBookingSuccess: () => void;
}

const BookTicketDialog = ({ event, availableTickets, onBookingSuccess }: BookTicketDialogProps) => {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const totalPrice = quantity * event.price;

  const handleBooking = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to book tickets.",
      });
      return;
    }

    if (quantity > availableTickets) {
      toast({
        variant: "destructive",
        title: "Not enough tickets",
        description: `Only ${availableTickets} tickets available.`,
      });
      return;
    }

    setLoading(true);
    try {
      // Create booking record
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          ticket_id: event.id, // Using event id as ticket reference for simplicity
          quantity: quantity,
          total_amount: totalPrice,
          status: 'confirmed'
        });

      if (error) throw error;

      toast({
        title: "Booking confirmed!",
        description: `Successfully booked ${quantity} ticket(s) for ${event.name}.`,
      });

      setOpen(false);
      setQuantity(1);
      onBookingSuccess();
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message || "Failed to book tickets. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={availableTickets === 0}>
          <Ticket className="h-4 w-4 mr-2" />
          Book Tickets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Tickets for {event.name}</DialogTitle>
          <DialogDescription>
            Venue: {event.venue.name} • Available: {availableTickets} tickets
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
              min="1"
              max={availableTickets}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(availableTickets, parseInt(e.target.value) || 1)))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Price per ticket</Label>
            <div className="col-span-3">₹{event.price}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right font-semibold">Total</Label>
            <div className="col-span-3 font-semibold">₹{totalPrice}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleBooking} disabled={loading || availableTickets === 0}>
            {loading ? "Booking..." : "Confirm Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookTicketDialog;
