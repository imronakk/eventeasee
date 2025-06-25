
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Star } from 'lucide-react';
import VenueRequestButton from '@/components/VenueRequestButton';
import { useAuth } from '@/hooks/useAuth';

interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  capacity: number;
  amenities: string[];
  images: string[];
  owner_id: string;
}

const Venues = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [existingRequests, setExistingRequests] = useState<string[]>([]);

  useEffect(() => {
    fetchVenues();
    if (user) {
      fetchExistingRequests();
    }
  }, [user]);

  const fetchVenues = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching venues:', error);
      setVenues([]);
    } else if (data) {
      setVenues(data);
    }
    setLoading(false);
  };

  const fetchExistingRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('show_requests')
      .select('venue_id')
      .eq('artist_id', user.id);

    if (error) {
      console.error('Error fetching existing requests:', error);
    } else if (data) {
      setExistingRequests(data.map(request => request.venue_id));
    }
  };

  const handleRequestSent = () => {
    // Refresh existing requests after a new request is sent
    fetchExistingRequests();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Find Venues</h1>

      {loading ? (
        <div className="text-center text-gray-600">Loading venues...</div>
      ) : venues.length === 0 ? (
        <div className="text-center text-gray-600">No venues found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {venues.map((venue) => {
            const hasAlreadyRequested = existingRequests.includes(venue.id);

            return (
              <Card key={venue.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{venue.name}</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {venue.capacity}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {venue.description || 'No description available.'}
                  </p>

                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3 mr-1" />
                    {venue.address}
                  </div>

                  {venue.amenities && venue.amenities.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium mb-1">Amenities:</p>
                      <div className="flex flex-wrap gap-1">
                        {venue.amenities.slice(0, 3).map((amenity, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {venue.amenities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{venue.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {user && user.role === 'artist' && (
                    <VenueRequestButton
                      venueId={venue.id}
                      venueName={venue.name}
                      hasAlreadyRequested={hasAlreadyRequested}
                      onRequestSent={handleRequestSent}
                    />
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <a href={`/venues/${venue.id}`}>
                      <button className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition">
                        View Details
                      </button>
                    </a>

                    
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

export default Venues;
