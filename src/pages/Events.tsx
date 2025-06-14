
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import BookTicketDialog from '@/components/BookTicketDialog';
import { useAuth } from '@/hooks/useAuth';

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

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Scheduled Events</h1>

      {loading ? (
        <div className="text-center text-gray-600">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-600">No scheduled events found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {events.map((event) => {
            const availableTickets = event.venue.capacity - event.ticket_sold;
            const isSoldOut = availableTickets <= 0;

            return (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                    {event.description || 'No description available.'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Date: {event.date.toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Status: {event.status}</p>
                  <p className="text-xs text-muted-foreground">
                    Venue: {event.venue.name}
                  </p>
                  {event.artist?.profile && (
                    <p className="text-xs text-muted-foreground">
                      Artist: {event.artist.profile.full_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    🎫 {availableTickets} / {event.venue.capacity} tickets available
                  </p>
                  <p className="text-sm font-semibold text-primary mt-2">
                    Price: ₹{event.ticketPrice}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Link to={`/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    
                    {user && user.role === 'audience' && (
                      isSoldOut ? (
                        <Button disabled size="sm" variant="outline">
                          Sold Out
                        </Button>
                      ) : (
                        <BookTicketDialog
                          event={{
                            id: event.id,
                            name: event.title,
                            price: event.price,
                            venue: {
                              name: event.venue.name,
                              capacity: event.venue.capacity
                            }
                          }}
                          availableTickets={availableTickets}
                          onBookingSuccess={handleBookingSuccess}
                        />
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;
