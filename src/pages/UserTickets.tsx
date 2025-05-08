
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, TicketIcon } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const UserTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            quantity,
            total_price,
            booking_date,
            status,
            ticket:tickets (
              id,
              ticket_type,
              price
            ),
            event:events (
              id,
              name,
              event_date,
              venue:venues (
                id,
                name
              )
            )
          `)
          .eq('user_id', user.id)
          .order('booking_date', { ascending: false });

        if (error) throw error;
        
        setBookings(data || []);
      } catch (error: any) {
        console.error('Error fetching bookings:', error);
        toast({
          title: 'Error',
          description: 'Could not load your bookings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserBookings();
  }, [user, toast]);

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
            <p className="text-muted-foreground">Manage your event tickets</p>
          </div>
          <Button asChild className="mt-4 md:mt-0">
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Tickets Found</CardTitle>
              <CardDescription>You haven't purchased any tickets yet.</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <Link to="/events">Browse Events</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{booking.event.name}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{formatDate(booking.event.event_date)}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{booking.event.venue?.name || 'Venue TBA'}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center bg-primary/10 rounded-full px-3 py-1">
                      <TicketIcon className="h-4 w-4 mr-1 text-primary" />
                      <span className="text-sm font-medium text-primary">{booking.quantity}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ticket type:</span>
                      <span>{booking.ticket.ticket_type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price per ticket:</span>
                      <span>${booking.ticket.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span>{booking.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium pt-2 border-t">
                      <span>Total:</span>
                      <span>${booking.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Booking ID: {booking.id.substring(0, 8)}...
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/events/${booking.event.id}`}>
                      Event Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default UserTickets;
