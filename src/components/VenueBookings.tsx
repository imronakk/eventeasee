import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/utils/formatters';

interface VenueBookingsProps {
  venueId?: string; // Optional: Can show bookings for a specific venue
}

// Define types to avoid the excessive type instantiation error
interface Venue {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
  venue_id: string;
  venue?: {
    name: string;
  };
}

interface Booking {
  id: string;
  quantity: number;
  total_price: number;
  ticket_id: string;
  user: {
    full_name: string;
    email: string;
  };
}

interface Ticket {
  id: string;
  ticket_type: string;
  price: number;
  quantity_total: number;
  quantity_remaining: number;
  bookings?: Booking[];
  totalBooked?: number;
  percentageBooked?: number;
}

interface BookingStats {
  tickets: Ticket[];
  bookings: Booking[];
  totalCapacity: number;
  totalBooked: number;
  percentageBooked: number;
  totalRevenue: number;
}

const VenueBookings = ({ venueId }: VenueBookingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [venueEvents, setVenueEvents] = useState<Record<string, Event[]>>({});

  // Fetch venue owner's events
  useEffect(() => {
    const fetchVenueEvents = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // First get all venues owned by current user
        const { data: venues, error: venuesError } = await supabase
          .from('venues')
          .select('id, name')
          .eq('owner_id', user.id);

        if (venuesError) throw venuesError;

        if (!venues || venues.length === 0) {
          setLoading(false);
          return;
        }

        // If specific venue ID provided, filter to just that venue
        const venueIds = venueId 
          ? [venueId] 
          : venues.map((venue: any) => venue.id);

        // Get events for all venues
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            event_date,
            venue_id,
            venue:venues!events_venue_id_fkey (
              name
            )
          `)
          .in('venue_id', venueIds)
          .order('event_date', { ascending: false });

        if (eventsError) throw eventsError;

        // Group events by venue
        const eventsByVenue: Record<string, Event[]> = {};
        eventsData.forEach((event: any) => {
          const vId = event.venue_id;
          if (!eventsByVenue[vId]) {
            eventsByVenue[vId] = [];
          }
          eventsByVenue[vId].push(event);
        });

        setVenueEvents(eventsByVenue);
        setEvents(eventsData);
        
        // Select first event by default
        if (eventsData.length > 0 && !selectedEvent) {
          setSelectedEvent(eventsData[0].id);
        }
      } catch (error: any) {
        console.error('Error fetching venue events:', error);
        toast({
          title: 'Error',
          description: 'Could not load venue events',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVenueEvents();
  }, [user, toast, venueId]);

  // Component to show booking stats for a specific event
  const EventBookingStats = ({ eventId }: { eventId: string }) => {
    const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
      const fetchBookingStats = async () => {
        setLoadingStats(true);
        try {
          // Get tickets for this event
          const { data: tickets, error: ticketsError } = await supabase
            .from('tickets')
            .select('*')
            .eq('event_id', eventId);

          if (ticketsError) throw ticketsError;

          // Get bookings for this event
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              id,
              quantity,
              total_price,
              ticket_id,
              user:profiles!bookings_user_id_fkey (
                full_name,
                email
              )
            `)
            .eq('event_id', eventId);

          if (bookingsError) throw bookingsError;

          // Calculate stats for each ticket type
          const ticketStats = tickets.map((ticket: any) => {
            const ticketBookings = bookings.filter((b: any) => b.ticket_id === ticket.id);
            const totalBooked = ticketBookings.reduce((sum: number, b: any) => sum + b.quantity, 0);
            
            return {
              ...ticket,
              bookings: ticketBookings,
              totalBooked,
              percentageBooked: Math.round((totalBooked / ticket.quantity_total) * 100),
            };
          });

          // Overall stats
          const totalCapacity = tickets.reduce((sum: number, t: any) => sum + t.quantity_total, 0);
          const totalBooked = bookings.reduce((sum: number, b: any) => sum + b.quantity, 0);
          const totalRevenue = bookings.reduce((sum: number, b: any) => sum + parseFloat(b.total_price), 0);

          setBookingStats({
            tickets: ticketStats,
            bookings,
            totalCapacity,
            totalBooked,
            percentageBooked: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
            totalRevenue,
          });
        } catch (error: any) {
          console.error('Error fetching booking stats:', error);
          toast({
            title: 'Error',
            description: 'Could not load booking statistics',
            variant: 'destructive',
          });
        } finally {
          setLoadingStats(false);
        }
      };

      fetchBookingStats();
    }, [eventId]);

    if (loadingStats) {
      return (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-pulse flex space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </div>
        </div>
      );
    }

    if (!bookingStats) return null;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Overall Booking Statistics</CardTitle>
            <CardDescription>
              {bookingStats.totalBooked} of {bookingStats.totalCapacity} seats booked ({bookingStats.percentageBooked}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={bookingStats.percentageBooked} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Revenue</CardDescription>
                  <CardTitle className="text-2xl">${bookingStats.totalRevenue.toFixed(2)}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Seats Booked</CardDescription>
                  <CardTitle className="text-2xl">{bookingStats.totalBooked}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Bookings</CardDescription>
                  <CardTitle className="text-2xl">{bookingStats.bookings.length}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Ticket type breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Types</CardTitle>
            <CardDescription>Breakdown by ticket type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookingStats.tickets.map((ticket: any) => (
                <div key={ticket.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{ticket.ticket_type}</div>
                      <div className="text-sm text-muted-foreground">
                        ${ticket.price} • {ticket.totalBooked} of {ticket.quantity_total} booked
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{ticket.percentageBooked}%</div>
                      <div className="text-sm text-muted-foreground">
                        {ticket.quantity_remaining} remaining
                      </div>
                    </div>
                  </div>
                  <Progress value={ticket.percentageBooked} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>List of attendees</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingStats.bookings.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No bookings yet for this event.
              </div>
            ) : (
              <div className="space-y-4">
                {bookingStats.bookings.map((booking: any) => (
                  <div 
                    key={booking.id} 
                    className="flex justify-between items-center p-3 rounded-lg border"
                  >
                    <div>
                      <div className="font-medium">{booking.user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{booking.user.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{booking.quantity} tickets</div>
                      <div className="text-sm text-muted-foreground">${parseFloat(booking.total_price).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse flex space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardHeader>
          <CardTitle>No Events Found</CardTitle>
          <CardDescription>
            {venueId 
              ? "This venue doesn't have any events yet." 
              : "You don't have any venues or events created yet."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={selectedEvent || ""} onValueChange={setSelectedEvent} className="w-full">
        <TabsList className="w-full h-auto flex-wrap">
          {events.map((event) => (
            <TabsTrigger key={event.id} value={event.id} className="flex-grow py-2">
              <div className="text-left">
                <div className="font-medium truncate">{event.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(event.event_date)} • {event.venue?.name}
                </div>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {events.map((event) => (
          <TabsContent key={event.id} value={event.id} className="pt-4">
            <EventBookingStats eventId={event.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default VenueBookings;
