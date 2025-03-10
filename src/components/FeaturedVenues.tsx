
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockVenues, mockUsers, getUserById } from '@/utils/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Calendar } from 'lucide-react';

const FeaturedVenues = () => {
  const venuesWithOwner = mockVenues.map(venue => {
    const owner = getUserById(venue.ownerId);
    return { ...venue, owner };
  });

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Exceptional Venues
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Discover unique spaces perfect for your next performance or event
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {venuesWithOwner.map((venue, index) => (
            <motion.div
              key={venue.id}
              className="bg-background border border-border/40 rounded-xl overflow-hidden transition-all hover:shadow-lg group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="flex flex-col md:flex-row">
                {/* Venue Image */}
                <div className="md:w-2/5 relative overflow-hidden">
                  <div className="h-full aspect-square md:aspect-auto">
                    <img
                      src={venue.images[0] || "https://images.unsplash.com/photo-1506744038136-46273834b3fb"}
                      alt={venue.name}
                      className="w-full h-full object-cover transition-transform duration-700 
                        group-hover:scale-105"
                    />
                  </div>
                </div>

                {/* Venue Info */}
                <div className="md:w-3/5 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {venue.name}
                    </h3>
                    
                    <div className="flex items-center text-muted-foreground mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{venue.city}, {venue.state}</span>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {venue.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {venue.amenities.slice(0, 3).map(amenity => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {venue.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{venue.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex space-x-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{venue.capacity} capacity</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Link to={`/venues/${venue.id}`}>
                      <Button>View Details</Button>
                    </Link>
                    
                    <Link to={`/venues/${venue.id}#contact`} className="text-primary hover:text-primary/80 text-sm font-medium">
                      Contact Venue
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
            <Link to="/venues">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                Explore All Venues
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedVenues;
