
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
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
          title,
          description,
          date,
          start_time,
          end_time,
          artist_ids,
          ticket_price,
          tickets_available,
          tickets_sold,
          image,
          status
        `)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } else if (data) {
        // The data is of partial structure, ensure proper types and defaults
        const formattedEvents: Event[] = data.map((event: any) => ({
          id: event.id,
          venueId: event.venue_id,
          // artistIds can be null or undefined — default to empty array if so
          artistIds: event.artist_ids || [],
          title: event.title,
          description: event.description || '',
          date: new Date(event.date),
          startTime: event.start_time,
          endTime: event.end_time,
          ticketPrice: Number(event.ticket_price) || 0,
          ticketsAvailable: event.tickets_available || 0,
          ticketsSold: event.tickets_sold || 0,
          image: event.image || undefined,
          status: event.status || 'draft',
        }));
        setEvents(formattedEvents);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">All Events</h1>

      {loading ? (
        <div className="text-center text-gray-600">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center text-gray-600">No events found.</div>
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

                <div className="mt-4">
                  <Link to={`/events/${event.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
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

