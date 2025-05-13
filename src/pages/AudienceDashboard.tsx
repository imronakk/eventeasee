
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketIcon, Calendar, BarChart3Icon, Settings2Icon, StarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import UpcomingEvents from '@/components/UpcomingEvents';
import { formatDate, formatCurrency } from '@/utils/formatters';

interface Artist {
  id: string;
  name: string;
  genre: string;
}

interface Event {
  id: string;
  title: string;
  venue: string;
  date: string;
  time: string;
  ticketPrice: number;
}

interface Ticket {
  id: string;
  eventName: string;
  venue: string;
  date: string;
  time: string;
  quantity: number;
  totalAmount: number;
}

const AudienceDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromParams = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromParams || "overview");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const handleUpdatePreferences = () => {
    toast({
      title: "Update preferences",
      description: "Feature coming soon! This will allow you to set your preferred genres and artists.",
    });
  };

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    // If tab is in URL params, update active tab
    if (tabFromParams) {
      setActiveTab(tabFromParams);
    }
  }, [tabFromParams]);

  useEffect(() => {
    const fetchArtists = async () => {
      setLoadingArtists(true);
      try {
        const { data, error } = await supabase
          .from('artists')
          .select(`
            id,
            genre,
            profiles!artists_id_fkey (
              full_name
            )
          `);

        if (error) {
          throw error;
        }

        const fetchedArtists: Artist[] = data?.map((item: any) => ({
          id: item.id,
          name: item.profiles?.full_name || 'Unknown Artist',
          genre: item.genre && Array.isArray(item.genre) ? item.genre.join(', ') : '',
        })) || [];
        setArtists(fetchedArtists);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching artists",
          description: error.message || "Unable to load artists.",
        });
      } finally {
        setLoadingArtists(false);
      }
    };

    if (activeTab === 'artists') {
      fetchArtists();
    }
  }, [activeTab, toast]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            name,
            venue_id,
            event_date,
            status,
            venue:venues!events_venue_id_fkey (
              name
            )
          `)
          .eq('status', 'published')
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true });

        if (error) throw error;

        const formattedEvents: Event[] = (data || []).map((ev: any) => ({
          id: ev.id,
          title: ev.name,
          venue: ev.venue?.name || 'Venue to be announced',
          date: new Date(ev.event_date).toLocaleDateString(),
          time: '',
          ticketPrice: 0,
        }));
        setEvents(formattedEvents);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching events",
          description: error.message || "Could not load events",
        });
      } finally {
        setLoadingEvents(false);
      }
    };

    if (activeTab === 'overview') {
      fetchEvents();
    }
  }, [activeTab, toast]);

  useEffect(() => {
    const fetchUserTickets = async () => {
      if (!user) return;
      
      setLoadingTickets(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            quantity,
            total_amount,
            created_at,
            tickets:tickets!inner(
              id,
              price,
              ticket_type,
              events:events!inner(
                id,
                name,
                event_date,
                venue:venues(
                  name
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Format tickets for display
        const formattedTickets = data.map((booking: any) => ({
          id: booking.id,
          eventName: booking.tickets.events.name,
          venue: booking.tickets.events.venue?.name || 'TBA',
          date: formatDate(booking.tickets.events.event_date),
          time: new Date(booking.tickets.events.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quantity: booking.quantity,
          totalAmount: booking.total_amount,
          eventId: booking.tickets.events.id
        }));
        
        setTickets(formattedTickets);
      } catch (error: any) {
        console.error('Error fetching tickets:', error);
        toast({
          variant: "destructive",
          title: "Error fetching tickets",
          description: error.message || "Could not load your tickets"
        });
      } finally {
        setLoadingTickets(false);
      }
    };

    if (activeTab === 'tickets') {
      fetchUserTickets();
    }
  }, [activeTab, user, toast]);

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fan Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={handleUpdatePreferences} className="whitespace-nowrap">
          Update Preferences
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-4 md:w-[600px] mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4" />
            <span className="hidden sm:inline">My Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="artists" className="flex items-center gap-2">
            <StarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Artists</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2Icon className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Discover amazing performances near you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/events')}>
                  Browse Events
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>My Tickets</CardTitle>
                <CardDescription>Events you're attending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleTabChange('tickets')}>
                  View Tickets
                </Button>
              </CardFooter>
            </Card>
          </div>

          <UpcomingEvents />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Tickets</CardTitle>
              <CardDescription>Events you're attending</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-pulse flex space-x-2 justify-center">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  </div>
                  <p className="mt-2">Loading your tickets...</p>
                </div>
              ) : tickets.length > 0 ? (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{ticket.eventName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ticket.venue} • {ticket.date} • {ticket.time}
                        </p>
                        <div className="flex gap-4 mt-1">
                          <p className="text-sm">Tickets: {ticket.quantity}</p>
                          <p className="text-sm font-semibold">Total: {formatCurrency(ticket.totalAmount)}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="mt-2 md:mt-0" onClick={() => navigate(`/events/${ticket.eventId}`)}>
                        View Event
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>You haven't purchased any tickets yet</p>
                  <Button className="mt-4" onClick={() => navigate('/events')}>
                    Browse Events
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/events')}>
                Find More Events
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="artists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Registered Artists</CardTitle>
              <CardDescription>Artists registered on our website</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingArtists ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading artists...
                </div>
              ) : artists.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No artists found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {artists.map(artist => (
                    <Card key={artist.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle>{artist.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{artist.genre}</p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/artists/${artist.id}`)}>
                          View Profile
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full" onClick={() => toast({ title: "Coming soon", description: "This feature is coming soon!" })}>
                  Notification Preferences
                </Button>
                <Button variant="outline" className="w-full" onClick={() => toast({ title: "Coming soon", description: "This feature is coming soon!" })}>
                  Payment Methods
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AudienceDashboard;
