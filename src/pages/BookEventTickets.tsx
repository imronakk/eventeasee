
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
import BookTicket from '@/components/BookTicket';
import ProtectedRoute from '@/components/ProtectedRoute';

const BookEventTickets = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            id,
            name,
            description,
            event_date,
            venue:venues!events_venue_id_fkey (
              id,
              name,
              address
            )
          `)
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;

        // Fetch available tickets
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('tickets')
          .select('*')
          .eq('event_id', eventId);

        if (ticketsError) throw ticketsError;

        setEvent(eventData);
        setTickets(ticketsData);
      } catch (error: any) {
        console.error('Error fetching event details:', error);
        toast({
          title: 'Error',
          description: 'Could not load event details',
          variant: 'destructive',
        });
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-pulse flex space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10 px-4">
        <Button 
          variant="outline" 
          asChild 
          className="mb-6"
        >
          <Link to="/events">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-muted-foreground mb-4">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{formatDate(event.event_date)}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{event.venue?.name || 'Venue to be announced'}</span>
            </div>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-10">
            <h2 className="text-xl font-medium mb-2">No tickets available</h2>
            <p className="text-muted-foreground mb-4">There are no tickets available for this event at the moment.</p>
          </div>
        ) : (
          <BookTicket 
            eventId={event.id} 
            eventName={event.name} 
            tickets={tickets} 
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default BookEventTickets;
