
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate, formatTime, formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, TicketIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BookTicketDialog } from '@/components/BookTicketDialog';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues(
            name,
            capacity
          ),
          artist:artists(
            id,
            profiles:profiles!artists_id_fkey(full_name)
          )
        `)
        .gte('event_date', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('event_date', { ascending: true })
        .limit(4);

      if (error) throw error;

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .in('event_id', eventsData.map(event => event.id));

      if (ticketsError) throw ticketsError;

      // Combine events with their ticket information
      const enrichedEvents = eventsData.map(event => ({
        ...event,
        tickets: ticketsData.filter(ticket => ticket.event_id === event.id)
      }));

      setEvents(enrichedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load upcoming events"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if tickets exist and are available
  const checkTicketAvailability = (event) => {
    if (!event.tickets || event.tickets.length === 0) {
      return { hasTickets: false, isSoldOut: false };
    }
    
    const hasAvailableTickets = event.tickets.some(ticket => ticket.quantity_remaining > 0);
    return { 
      hasTickets: true, 
      isSoldOut: !hasAvailableTickets 
    };
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Upcoming Events
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Book your tickets for these captivating performances
          </motion.p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No upcoming events found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event, index) => {
              const { hasTickets, isSoldOut } = checkTicketAvailability(event);
              
              return (
                <motion.div
                  key={event.id}
                  className="bg-background border border-border/40 rounded-xl overflow-hidden group hover:shadow-lg transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <div className="relative">
                    <div className="h-48 overflow-hidden">
                      <img
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
                        alt={event.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    
                    <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                      <div className="text-center">
                        <div className="text-primary font-semibold text-sm">
                          {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-xl font-bold">
                          {new Date(event.event_date).getDate()}
                        </div>
                      </div>
                    </div>

                    {hasTickets && (
                      <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-medium">
                        {formatCurrency(event.tickets[0].price)}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {event.name}
                    </h3>
                    
                    <div className="flex flex-col space-y-2 mb-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{formatDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{event.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.venue?.name || 'Venue to be announced'}</span>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {event.description || 'No description available.'}
                    </p>
                    
                    <div className="flex items-center justify-between mt-6">
                      <div>
                        {hasTickets && !isSoldOut && (
                          <Badge variant="outline" className="text-xs">
                            {event.tickets[0].quantity_remaining} tickets left
                          </Badge>
                        )}
                        {hasTickets && isSoldOut && (
                          <Badge variant="outline" className="text-xs text-destructive">
                            Sold Out
                          </Badge>
                        )}
                        {!hasTickets && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            No tickets available
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex space-x-3">
                        <Link to={`/events/${event.id}`}>
                          <Button variant="outline" size="sm">
                            Details
                          </Button>
                        </Link>
                        
                        {hasTickets && !isSoldOut ? (
                          <BookTicketDialog 
                            eventId={event.id}
                            eventName={event.name}
                            ticketId={event.tickets[0].id}
                            ticketPrice={event.tickets[0].price}
                            maxQuantity={event.tickets[0].quantity_remaining}
                          />
                        ) : hasTickets && isSoldOut ? (
                          <Button disabled>Sold Out</Button>
                        ) : (
                          <Button disabled>No tickets available</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/events">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                View All Events
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
