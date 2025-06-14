
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate, formatTime } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      console.log('Fetching upcoming events...');
      
      // Get current date in ISO format for comparison
      const now = new Date().toISOString();
      console.log('Current date for comparison:', now);

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
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(4);

      console.log('Events query result:', { eventsData, error });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      if (!eventsData || eventsData.length === 0) {
        console.log('No events found');
        setEvents([]);
        setLoading(false);
        return;
      }

      console.log('Events data:', eventsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load upcoming events"
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
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
            Discover amazing performances happening soon
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
            <p>No upcoming events found. Check back soon for new events!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event, index) => (
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
                      <span>{event.duration || 'Duration TBA'}</span>
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
                    <div></div>
                    
                    <div className="flex space-x-3">
                      <Link to={`/events/${event.id}`}>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
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
