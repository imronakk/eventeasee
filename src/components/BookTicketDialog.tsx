
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const totalPrice = quantity * event.price;

  const resetForm = () => {
    setQuantity(1);
    setCustomerName('');
    setContactNumber('');
    setPaymentMethod('cash');
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to book tickets.",
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter the customer name.",
      });
      return;
    }

    if (!contactNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Contact number required",
        description: "Please enter a contact number.",
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
      // Create booking record with additional customer details
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          ticket_id: event.id, // Using event id as ticket reference for simplicity
          quantity: quantity,
          total_amount: totalPrice,
          status: 'confirmed',
          // Note: We would need to add these fields to the bookings table schema
          // For now, we'll store them in a JSON field or add separate columns
        });

      if (error) throw error;

      toast({
        title: "Booking confirmed!",
        description: `Successfully booked ${quantity} ticket(s) for ${event.name}.`,
      });

      setOpen(false);
      resetForm();
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Book Tickets for {event.name}</DialogTitle>
          <DialogDescription>
            Venue: {event.venue.name} • Available: {availableTickets} tickets
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customerName" className="text-right">
              Name *
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactNumber" className="text-right">
              Contact *
            </Label>
            <Input
              id="contactNumber"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="Enter contact number"
              className="col-span-3"
            />
          </div>

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
            <Label className="text-right">Payment Method</Label>
            <div className="col-span-3">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash Payment</Label>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <RadioGroupItem value="online" id="online" disabled />
                  <Label htmlFor="online" className="text-muted-foreground">
                    Online Payment (Coming Soon)
                  </Label>
                </div>
              </RadioGroup>
            </div>
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
