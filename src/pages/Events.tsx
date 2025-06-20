import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPin, Users, Clock, Star, Music } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import BookTicketDialog from '@/components/BookTicketDialog';
import MainLayout from '@/layouts/MainLayout';

interface EventWithBookingInfo extends Event {
  venue: {
    name: string;
    capacity: number;
  };
  artist: {
    profile: {
      full_name: string;
    };
  } | null;
  price: number;
  ticket_sold: number;
}

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithBookingInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithBookingInfo | null>(null);
  const [bookTicketOpen, setBookTicketOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          venue_id,
          artist_id,
          name,
          description,
          event_date,
          duration,
          status,
          price,
          ticket_sold,
          venue:venues!events_venue_id_fkey (
            name,
            capacity
          ),
          artist:artists!events_artist_id_fkey (
            profile:profiles!artists_id_fkey (
              full_name
            )
          )
        `)
        .eq('status', 'scheduled')
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } else if (data) {
        // Map the database fields to our Event type with booking info
        const formattedEvents: EventWithBookingInfo[] = data.map((event: any) => ({
          id: event.id,
          venueId: event.venue_id,
          artistIds: event.artist_id ? [event.artist_id] : [],
          title: event.name || 'Untitled Event',
          description: event.description || '',
          date: new Date(event.event_date),
          startTime: '00:00',
          endTime: '23:59',
          ticketPrice: event.price || 0,
          ticketsAvailable: 0,
          ticketsSold: 0,
          image: undefined,
          status: event.status || 'draft',
          venue: event.venue || { name: 'Unknown Venue', capacity: 0 },
          artist: event.artist,
          price: event.price || 0,
          ticket_sold: event.ticket_sold || 0
        }));
        setEvents(formattedEvents);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const handleBookingSuccess = () => {
    // Refresh events to update ticket counts
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          venue_id,
          artist_id,
          name,
          description,
          event_date,
          duration,
          status,
          price,
          ticket_sold,
          venue:venues!events_venue_id_fkey (
            name,
            capacity
          ),
          artist:artists!events_artist_id_fkey (
            profile:profiles!artists_id_fkey (
              full_name
            )
          )
        `)
        .eq('status', 'scheduled')
        .order('event_date', { ascending: true });

      if (!error && data) {
        const formattedEvents: EventWithBookingInfo[] = data.map((event: any) => ({
          id: event.id,
          venueId: event.venue_id,
          artistIds: event.artist_id ? [event.artist_id] : [],
          title: event.name || 'Untitled Event',
          description: event.description || '',
          date: new Date(event.event_date),
          startTime: '00:00',
          endTime: '23:59',
          ticketPrice: event.price || 0,
          ticketsAvailable: 0,
          ticketsSold: 0,
          image: undefined,
          status: event.status || 'draft',
          venue: event.venue || { name: 'Unknown Venue', capacity: 0 },
          artist: event.artist,
          price: event.price || 0,
          ticket_sold: event.ticket_sold || 0
        }));
        setEvents(formattedEvents);
      }
    };
    fetchEvents();
  };

  const handleBookTicket = (event: EventWithBookingInfo) => {
    setSelectedEvent(event);
    setBookTicketOpen(true);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
          <p className="text-xl text-muted-foreground">Discover amazing live performances near you</p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <Music className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-medium">No upcoming events found</p>
            <p>Check back soon for new events!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-bold line-clamp-2">
                      {event.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      ₹{event.price}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(new Date(event.event_date), 'PPP')} at {format(new Date(event.event_date), 'p')}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.venue?.name || 'Venue TBA'}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    {event.ticket_sold || 0} / {event.venue?.capacity || 'Unlimited'} tickets sold
                  </div>

                  {event.artist?.profile?.full_name && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-4 w-4 mr-2" />
                      <span>Artist: {event.artist.profile.full_name}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Link to={`/events/${event.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    
                    {user && user.role === 'audience' && (
                      <Button 
                        onClick={() => handleBookTicket(event)}
                        className="flex-1"
                        disabled={event.ticket_sold >= (event.venue?.capacity || 0)}
                      >
                        {event.ticket_sold >= (event.venue?.capacity || 0) ? 'Sold Out' : 'Book Ticket'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedEvent && (
          <BookTicketDialog
            event={selectedEvent}
            open={bookTicketOpen}
            onOpenChange={setBookTicketOpen}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Events;
