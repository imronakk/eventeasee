
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users } from 'lucide-react';

interface RegisteredVenue {
  id: string;
  name: string;
  description: string;
  address: string;
  capacity: number;
  amenities: string[];
  images: string[];
  owner_id: string;
}

const FeaturedVenues = () => {
  const [venues, setVenues] = useState<RegisteredVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedVenues = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .limit(4) // Show only 4 featured venues
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching venues:', error);
        setVenues([]);
      } else if (data) {
        setVenues(data);
      }
      setLoading(false);
    };

    fetchFeaturedVenues();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse flex space-x-2 justify-center">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

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

        {venues.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>No venues registered yet. Be the first to add your venue!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {venues.map((venue, index) => (
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
                        src={venue.images && venue.images.length > 0 ? venue.images[0] : "https://images.unsplash.com/photo-1506744038136-46273834b3fb"}
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
                        <span className="text-sm">{venue.address}</span>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {venue.description || 'A wonderful venue for events and performances'}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {venue.amenities && venue.amenities.slice(0, 3).map(amenity => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {venue.amenities && venue.amenities.length > 3 && (
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
        )}

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
