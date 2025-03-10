
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockEvents, mockVenues, getArtistByUserId, getUserById } from '@/utils/mock-data';
import { formatDate, formatTime, formatCurrency } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, TicketIcon } from 'lucide-react';

const UpcomingEvents = () => {
  // Get upcoming events (future dates)
  const upcomingEvents = mockEvents
    .filter(event => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  // Enrich events with venue and artist data
  const enrichedEvents = upcomingEvents.map(event => {
    const venue = mockVenues.find(v => v.id === event.venueId);
    const artistIds = event.artistIds || [];
    const artists = artistIds.map(id => {
      const artist = getArtistByUserId(id);
      return artist ? { ...artist, user: getUserById(artist.userId) } : null;
    }).filter(Boolean);

    return {
      ...event,
      venue,
      artists,
    };
  });

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {enrichedEvents.map((event, index) => (
            <motion.div
              key={event.id}
              className="bg-background border border-border/40 rounded-xl overflow-hidden group hover:shadow-lg transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="relative">
                {/* Event Image */}
                <div className="h-48 overflow-hidden">
                  <img
                    src={event.image || "https://images.unsplash.com/photo-1506744038136-46273834b3fb"}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                
                {/* Date Badge */}
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                  <div className="text-center">
                    <div className="text-primary font-semibold text-sm">
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-xl font-bold">
                      {new Date(event.date).getDate()}
                    </div>
                  </div>
                </div>
                
                {/* Ticket Price */}
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-medium">
                  {formatCurrency(event.ticketPrice)}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                
                <div className="flex flex-col space-y-2 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{event.venue?.name || 'Venue to be announced'}</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>
                
                <div className="flex items-center justify-between mt-6">
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {event.ticketsAvailable - event.ticketsSold} tickets left
                    </Badge>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Link to={`/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
                    <Link to={`/events/${event.id}/book`}>
                      <Button size="sm">
                        <TicketIcon className="h-4 w-4 mr-2" />
                        Book Tickets
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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
