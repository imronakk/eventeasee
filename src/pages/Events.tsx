
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BookTicketDialog } from '@/components/BookTicketDialog';

interface EventWithTickets extends Event {
  tickets?: {
    id: string;
    price: number;
    quantity_remaining: number;
    ticket_type: string;
  }[];
}

const Events = () => {
  const [events, setEvents] = useState<EventWithTickets[]>([]);
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
          tickets (
            id,
            price,
            quantity_remaining,
            ticket_type
          )
        `)
        .eq('status', 'scheduled')
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } else if (data) {
        // Map the database fields to our Event type
        const formattedEvents: EventWithTickets[] = data.map((event: any) => ({
          id: event.id,
          venueId: event.venue_id,
          artistIds: event.artist_id ? [event.artist_id] : [],
          title: event.name || 'Untitled Event',
          description: event.description || '',
          date: new Date(event.event_date),
          startTime: '00:00', // Default since we don't have separate start_time
          endTime: '23:59', // Default since we don't have separate end_time
          ticketPrice: event.tickets?.[0]?.price || 0,
          ticketsAvailable: event.tickets?.[0]?.quantity_remaining || 0,
          ticketsSold: 0, // Default since not in events table
          image: undefined,
          status: event.status || 'draft',
          tickets: event.tickets || []
        }));
        setEvents(formattedEvents);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Scheduled Events</h1>

      {loading ? (
        <div className="text-center text-gray-600">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-600">No scheduled events found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {events.map((event) => (
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

                {event.tickets && event.tickets.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">
                      Price: ${event.tickets[0].price}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Available: {event.tickets[0].quantity_remaining} tickets
                    </p>
                  </div>
                )}

                <div className="mt-4 flex gap-2 flex-wrap">
                  <Link to={`/events/${event.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  
                  {event.tickets && event.tickets.length > 0 && event.tickets[0].quantity_remaining > 0 ? (
                    <BookTicketDialog
                      eventId={event.id}
                      eventName={event.title}
                      ticketId={event.tickets[0].id}
                      ticketPrice={event.tickets[0].price}
                      maxQuantity={event.tickets[0].quantity_remaining}
                    />
                  ) : (
                    <Button size="sm" disabled>
                      Sold Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
