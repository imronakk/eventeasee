
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, TicketIcon } from 'lucide-react';

interface BookTicketProps {
  eventId: string;
  eventName: string;
  tickets: {
    id: string;
    ticket_type: string;
    price: number;
    quantity_remaining: number;
  }[];
}

const BookTicket = ({ eventId, eventName, tickets }: BookTicketProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const selectedTicketInfo = tickets.find(ticket => ticket.id === selectedTicket);

  const handleBooking = async () => {
    if (!user || !selectedTicket) {
      toast({
        title: "Error",
        description: "You must be logged in and select a ticket type",
        variant: "destructive",
      });
      return;
    }

    if (quantity < 1 || !selectedTicketInfo || quantity > selectedTicketInfo.quantity_remaining) {
      toast({
        title: "Invalid quantity",
        description: "Please select a valid ticket quantity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const totalPrice = selectedTicketInfo.price * quantity;
      
      // 1. Create booking record
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          ticket_id: selectedTicket,
          event_id: eventId,
          quantity,
          total_price: totalPrice,
        })
        .select();

      if (bookingError) throw bookingError;

      // 2. Update ticket quantity remaining
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          quantity_remaining: selectedTicketInfo.quantity_remaining - quantity 
        })
        .eq('id', selectedTicket);

      if (updateError) throw updateError;

      toast({
        title: "Booking Successful!",
        description: `You have booked ${quantity} tickets for ${eventName}`,
      });
      
      // Redirect to tickets page
      navigate('/tickets');
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: error.message || "An error occurred while booking your tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketIcon className="h-5 w-5" />
          Book Tickets for {eventName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ticket-type">Select Ticket Type</Label>
          <div className="grid grid-cols-1 gap-2">
            {tickets.map((ticket) => (
              <Button
                key={ticket.id}
                type="button"
                variant={selectedTicket === ticket.id ? "default" : "outline"}
                className="justify-between"
                onClick={() => setSelectedTicket(ticket.id)}
                disabled={ticket.quantity_remaining === 0}
              >
                <span>{ticket.ticket_type}</span>
                <span className="flex items-center gap-2">
                  ${ticket.price.toFixed(2)}
                  {ticket.quantity_remaining === 0 && (
                    <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                      Sold Out
                    </span>
                  )}
                  {ticket.quantity_remaining > 0 && ticket.quantity_remaining < 10 && (
                    <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                      Only {ticket.quantity_remaining} left
                    </span>
                  )}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {selectedTicket && selectedTicketInfo && selectedTicketInfo.quantity_remaining > 0 && (
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedTicketInfo.quantity_remaining}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 text-center"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setQuantity(prev => Math.min(selectedTicketInfo.quantity_remaining, prev + 1))}
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground ml-2">
                Max: {selectedTicketInfo.quantity_remaining}
              </span>
            </div>
          </div>
        )}

        {selectedTicket && selectedTicketInfo && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between mb-2">
              <span>Price per ticket:</span>
              <span>${selectedTicketInfo.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${(selectedTicketInfo.price * quantity).toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleBooking} 
          disabled={!selectedTicket || loading || !selectedTicketInfo || selectedTicketInfo.quantity_remaining < 1}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Complete Booking'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookTicket;
