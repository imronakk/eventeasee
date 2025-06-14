
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Star, ArrowLeft } from 'lucide-react';

interface VenueDetailData {
  id: string;
  name: string;
  description: string;
  address: string;
  capacity: number;
  amenities: string[];
  images: string[];
  owner_id: string;
  created_at: string;
  updated_at: string;
}

const VenueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<VenueDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchVenueDetail = async () => {
      if (!id) return;

      setLoading(true);

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching venue details:', error);
        setVenue(null);
      } else if (data) {
        setVenue(data);
      }
      setLoading(false);
    };

    fetchVenueDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-gray-600">Loading venue details...</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Venue Not Found</h1>
          <p className="text-gray-600 mb-6">The venue you're looking for doesn't exist or has been removed.</p>
          <Link to="/venues">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Venues
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6">
        <Link to="/venues">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venues
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <CardTitle className="text-3xl font-bold">{venue.name}</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {venue.capacity} capacity
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Venue Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">About This Venue</h3>
              <p className="text-gray-700 leading-relaxed">
                {venue.description || 'No description available.'}
              </p>
            </div>

            {/* Venue Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Venue Information</h3>
                
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-gray-600">{venue.address}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-gray-600">{venue.capacity} people</p>
                  </div>
                </div>
              </div>

              {venue.amenities && venue.amenities.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Amenities</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {venue.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="w-fit">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Images Section */}
            {venue.images && venue.images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Gallery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {venue.images.map((imageUrl, index) => (
                    <div key={index} className="aspect-video rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={imageUrl}
                        alt={`${venue.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4">Interested in This Venue?</h3>
              <p className="text-gray-600 mb-4">
                Contact the venue owner to discuss booking opportunities and availability.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/venues">
                  <Button variant="outline">
                    Browse More Venues
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VenueDetail;
