import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketIcon, Calendar, BarChart3Icon, Settings2Icon, StarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BookTicketDialog from '@/components/BookTicketDialog';

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
}

interface ScheduledEvent {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  price: number;
  ticket_sold: number;
  venue: {
    name: string;
    capacity: number;
  };
  artist: {
    profile: {
      full_name: string;
    };
  };
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
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [loadingScheduledEvents, setLoadingScheduledEvents] = useState(false);

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
    const fetchScheduledEvents = async () => {
      setLoadingScheduledEvents(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            name,
            description,
            event_date,
            price,
            ticket_sold,
            venue:venues!events_venue_id_fkey (
              name,
              capacity
            ),
            artist:artists!events_artist_id_fkey (
              profile:profiles!artists_id_fkey (
                full_name
              )
            )
          `)
          .eq('status', 'scheduled')
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true });

        if (error) throw error;

        setScheduledEvents(data || []);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error fetching scheduled events",
          description: error.message || "Could not load scheduled events",
        });
      } finally {
        setLoadingScheduledEvents(false);
      }
    };

    if (activeTab === 'events') {
      fetchScheduledEvents();
    }
  }, [activeTab, toast]);

  const handleBookingSuccess = () => {
    // Refresh the scheduled events to update ticket counts
    if (activeTab === 'events') {
      const fetchScheduledEvents = async () => {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            name,
            description,
            event_date,
            price,
            ticket_sold,
            venue:venues!events_venue_id_fkey (
              name,
              capacity
            ),
            artist:artists!events_artist_id_fkey (
              profile:profiles!artists_id_fkey (
                full_name
              )
            )
          `)
          .eq('status', 'scheduled')
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true });

        if (!error && data) {
          setScheduledEvents(data);
        }
      };
      fetchScheduledEvents();
    }
  };

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
          <TabsTrigger value="events" className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
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
                <CardTitle>Browse Events</CardTitle>
                <CardDescription>Discover amazing performances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
                <p className="text-sm text-muted-foreground">upcoming events available</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/events')}>
                  Browse Events
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Explore Artists</CardTitle>
                <CardDescription>Discover talented performers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{artists.length}</div>
                <p className="text-sm text-muted-foreground">registered artists</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleTabChange('artists')}>
                  View Artists
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Events</CardTitle>
                <CardDescription>Find upcoming shows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">🎫</div>
                <p className="text-sm text-muted-foreground">explore events now</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => navigate('/events')}>
                  Explore Now
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with exploring content</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" onClick={() => navigate('/events')} className="h-20 flex flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span>Browse All Events</span>
              </Button>
              <Button variant="outline" onClick={() => navigate('/artists')} className="h-20 flex flex-col gap-2">
                <StarIcon className="h-6 w-6" />
                <span>Explore Artists</span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Events</CardTitle>
              <CardDescription>Book tickets for upcoming events</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingScheduledEvents ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading scheduled events...
                </div>
              ) : scheduledEvents.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No scheduled events found.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {scheduledEvents.map(event => {
                    const availableTickets = event.venue.capacity - event.ticket_sold;
                    const isSoldOut = availableTickets <= 0;
                    
                    return (
                      <Card key={event.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          <CardDescription>
                            {event.artist?.profile?.full_name && `With ${event.artist.profile.full_name}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            📍 {event.venue.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            📅 {new Date(event.event_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            🎫 {availableTickets} / {event.venue.capacity} tickets available
                          </p>
                          <p className="text-lg font-semibold text-primary">
                            ₹{event.price}
                          </p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </CardContent>
                        <CardFooter>
                          {isSoldOut ? (
                            <Button disabled className="w-full" variant="outline">
                              Sold Out
                            </Button>
                          ) : (
                            <BookTicketDialog
                              event={{
                                id: event.id,
                                name: event.name,
                                price: event.price,
                                venue: {
                                  name: event.venue.name,
                                  capacity: event.venue.capacity
                                }
                              }}
                              availableTickets={availableTickets}
                              onBookingSuccess={handleBookingSuccess}
                            />
                          )}
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
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
