
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface EventDetailData {
  id: string;
  name: string;
  description: string;
  event_date: string;
  duration: string;
  status: string;
  venue: {
    id: string;
    name: string;
    address: string;
    capacity: number;
  } | null;
  artist: {
    id: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEventDetail = async () => {
      if (!id) return;

      setLoading(true);

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          description,
          event_date,
          duration,
          status,
          venue:venues(
            id,
            name,
            address,
            capacity
          ),
          artist:artists(
            id,
            profiles:profiles!artists_id_fkey(
              full_name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching event details:', error);
        setEvent(null);
      } else if (data) {
        setEvent(data);
      }
      setLoading(false);
    };

    fetchEventDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-gray-600">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Link to="/events">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6">
        <Link to="/events">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <CardTitle className="text-3xl font-bold">{event.name}</CardTitle>
              <Badge variant={event.status === 'scheduled' ? 'default' : 'secondary'}>
                {event.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">About This Event</h3>
              <p className="text-gray-700 leading-relaxed">
                {event.description || 'No description available.'}
              </p>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Details</h3>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-gray-600">
                      {format(new Date(event.event_date), 'PPPP')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-gray-600">{event.duration}</p>
                  </div>
                </div>

                {event.artist?.profiles && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Artist</p>
                      <p className="text-gray-600">{event.artist.profiles.full_name}</p>
                    </div>
                  </div>
                )}
              </div>

              {event.venue && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Venue Information</h3>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <p className="font-medium">{event.venue.name}</p>
                      <p className="text-gray-600">{event.venue.address}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Capacity: {event.venue.capacity} people
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t">
              <div className="flex flex-wrap gap-4">
                {event.venue && (
                  <Link to={`/venues/${event.venue.id}`}>
                    <Button variant="outline">
                      View Venue Details
                    </Button>
                  </Link>
                )}
                {event.artist && (
                  <Link to={`/artists/${event.artist.id}`}>
                    <Button variant="outline">
                      View Artist Profile
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventDetail;
