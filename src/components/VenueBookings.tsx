
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2Icon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Event {
  id: string;
  name: string;
  event_date: string;
  venue: {
    name: string;
  };
}

interface VenueEvent extends Event {
  total_capacity: number;
  booked: number;
  revenue: number;
}

interface BookingUser {
  full_name: string;
  email: string;
}

interface Booking {
  id: string;
  quantity: number;
  total_amount: number; // Changed from total_price to total_amount
  ticket_id: string;
  user: BookingUser;
}

interface Ticket {
  id: string;
  ticket_type: string;
  price: number;
  quantity_total: number;
  quantity_remaining: number;
}

interface BookingStats {
  tickets: {
    id: string;
    ticket_type: string;
    price: number;
    quantityTotal: number;
    quantityBooked: number;
    revenue: number;
  }[];
  totalCapacity: number;
  totalBooked: number;
  totalRevenue: number;
  recentBookings: Booking[];
}

const VenueBookings = ({ venueId }: { venueId?: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [venueEvents, setVenueEvents] = useState<VenueEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchVenueEvents = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // First get venue ID if not provided
        let venue_id = venueId;
        
        if (!venue_id) {
          const { data: venueData, error: venueError } = await supabase
            .from('venues')
            .select('id')
            .eq('owner_id', user.id)
            .single();
            
          if (venueError) {
            console.error("Error fetching venue:", venueError);
            toast({
              variant: "destructive",
              title: "Error loading venue",
              description: "Could not find your venue details. Please check your account.",
            });
            setLoading(false);
            return;
          }
          
          venue_id = venueData.id;
        }
        
        // Then get events for this venue
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            event_date,
            venue:venues!events_venue_id_fkey (
              name
            )
          `)
          .eq('venue_id', venue_id)
          .order('event_date', { ascending: false });
          
        if (eventsError) {
          console.error("Error fetching events:", eventsError);
          toast({
            variant: "destructive",
            title: "Error loading events",
            description: eventsError.message || "Could not load your events",
          });
          setLoading(false);
          return;
        }
        
        // Set events and select the first one by default
        setVenueEvents(events || []);
        if (events && events.length > 0) {
          setSelectedEvent(events[0].id);
        }
      } catch (error: any) {
        console.error("Error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVenueEvents();
  }, [user, toast, venueId, selectedEvent]);

  // Component to show booking stats for a specific event
  const EventBookingStats = ({ eventId }: { eventId: string }) => {
    useEffect(() => {
      const fetchBookingStats = async () => {
        try {
          setLoadingStats(true);
          
          // Get all tickets for this event
          const { data: tickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('*')
            .eq('event_id', eventId);
            
          if (ticketsError) throw ticketsError;

          // Get bookings for this event with corrected field names
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              id,
              quantity,
              total_amount, 
              ticket_id,
              user:profiles!bookings_user_id_fkey (
                full_name,
                email
              )
            `)
            .in('ticket_id', tickets.map((t: any) => t.id));

          if (bookingsError) throw bookingsError;

          // Calculate stats for each ticket type
          const ticketStats = tickets.map((ticket: any) => {
            const ticketBookings = bookings.filter((b: any) => b.ticket_id === ticket.id);
            const quantityBooked = ticketBookings.reduce((sum: number, b: any) => sum + b.quantity, 0);
            const revenue = ticketBookings.reduce((sum: number, b: any) => sum + parseFloat(b.total_amount), 0);
            
            return {
              id: ticket.id,
              ticket_type: ticket.ticket_type,
              price: parseFloat(ticket.price),
              quantityTotal: ticket.quantity_total,
              quantityBooked,
              revenue
            };
          });
          
          // Overall stats
          const totalCapacity = tickets.reduce((sum: number, t: any) => sum + t.quantity_total, 0);
          const totalBooked = bookings.reduce((sum: number, b: any) => sum + b.quantity, 0);
          const totalRevenue = bookings.reduce((sum: number, b: any) => sum + parseFloat(b.total_amount), 0);

          setBookingStats({
            tickets: ticketStats,
            totalCapacity,
            totalBooked,
            totalRevenue,
            recentBookings: bookings.slice(0, 5)
          });
          
        } catch (error: any) {
          console.error("Error fetching booking stats:", error);
          toast({
            variant: "destructive",
            title: "Error loading booking data",
            description: error.message || "Failed to load booking statistics",
          });
        } finally {
          setLoadingStats(false);
        }
      };
      
      if (eventId) {
        fetchBookingStats();
      }
    }, [eventId]);
    
    if (loadingStats) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!bookingStats) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No booking data available for this event.
        </div>
      );
    }
    
    const occupancyPercentage = bookingStats.totalCapacity > 0 
      ? Math.round((bookingStats.totalBooked / bookingStats.totalCapacity) * 100) 
      : 0;
      
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{bookingStats.totalBooked}</CardTitle>
              <CardDescription>Tickets Booked</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {occupancyPercentage}% occupancy ({bookingStats.totalBooked} of {bookingStats.totalCapacity})
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">${bookingStats.totalRevenue.toFixed(2)}</CardTitle>
              <CardDescription>Total Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                From {bookingStats.recentBookings.length} bookings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">{bookingStats.tickets.length}</CardTitle>
              <CardDescription>Ticket Types</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {bookingStats.totalCapacity - bookingStats.totalBooked} tickets remaining
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Ticket Type Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Sales by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bookingStats.tickets.map(ticket => (
                <div key={ticket.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{ticket.ticket_type}</p>
                    <p className="text-sm text-muted-foreground">${ticket.price.toFixed(2)} per ticket</p>
                  </div>
                  <div className="text-right">
                    <p>{ticket.quantityBooked} of {ticket.quantityTotal} sold</p>
                    <p className="text-sm text-muted-foreground">${ticket.revenue.toFixed(2)} revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookingStats.recentBookings.length > 0 ? (
                bookingStats.recentBookings.map((booking: Booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{booking.user?.full_name || 'Anonymous'}</p>
                      <p className="text-sm text-muted-foreground">{booking.user?.email || 'No email'}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{booking.quantity} tickets</div>
                      <div className="text-sm text-muted-foreground">${parseFloat(booking.total_amount.toString()).toFixed(2)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No bookings yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (venueEvents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No events found for your venue.</p>
        <Button className="mt-4">Create an Event</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Select
          value={selectedEvent || ""}
          onValueChange={(value) => setSelectedEvent(value)}
        >
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Select event" />
          </SelectTrigger>
          <SelectContent>
            {venueEvents.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name} - {format(new Date(event.event_date), 'PPP')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline">Export Data</Button>
      </div>
      
      {selectedEvent && <EventBookingStats eventId={selectedEvent} />}
    </div>
  );
};

export default VenueBookings;
