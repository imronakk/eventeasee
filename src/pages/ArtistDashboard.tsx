
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, MusicIcon, BarChart3Icon, Settings2Icon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const ArtistDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for artist dashboard
  const upcomingEvents = [
    { id: '1', name: 'Jazz Night', venue: 'Blue Note Club', date: '2023-11-15', time: '8:00 PM' },
    { id: '2', name: 'Summer Festival', venue: 'Central Park', date: '2023-12-05', time: '4:00 PM' },
  ];

  useEffect(() => {
    if (user) {
      fetchPerformanceRequests();
    }
  }, [user]);

  const fetchPerformanceRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: requests, error } = await supabase
        .from('show_requests')
        .select(`
          id,
          proposed_date,
          message,
          status,
          venues (
            id,
            name
          )
        `)
        .eq('artist_id', user.id);
        
      if (error) throw error;
      
      // Process the data
      const processedRequests = requests?.map(request => ({
        id: request.id,
        venueName: request.venues?.name || 'Unknown Venue',
        date: request.proposed_date,
        status: request.status,
        message: request.message
      })) || [];
      
      setPendingRequests(processedRequests);
      
    } catch (error: any) {
      console.error("Error fetching performance requests:", error);
      toast({
        variant: "destructive",
        title: "Error fetching requests",
        description: error.message || "Could not load your performance requests."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    navigate('/profile');
  };

  const handleViewRequest = (requestId: string) => {
    toast({
      title: "View request details",
      description: `Viewing details for request ${requestId}. Full feature coming soon!`,
    });
  };

  // Helper function to get badge color based on status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'pending':
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artist Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={handleCreateProfile} className="whitespace-nowrap">
          Complete Artist Profile
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:w-[600px] mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <MusicIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Requests</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2Icon className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>You have {upcomingEvents.length} events scheduled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("events")}>
                  View all events
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>You have {pendingRequests.filter(r => r.status === 'pending').length} pending venue requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRequests.filter(r => r.status === 'pending').length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("requests")}>
                  View all requests
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Profile Completion</CardTitle>
                <CardDescription>Complete your profile to get more bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">70%</div>
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[70%]"></div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={handleCreateProfile}>
                  Complete profile
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Upcoming Events</CardTitle>
              <CardDescription>Events you're scheduled to perform at</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.venue} • {event.date} • {event.time}
                        </p>
                      </div>
                      <Button variant="outline" className="mt-2 md:mt-0" onClick={() => navigate(`/events/${event.id}`)}>
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No upcoming events scheduled</p>
                  <Button className="mt-4" onClick={() => navigate('/venues')}>
                    Find Venues
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Requests</CardTitle>
              <CardDescription>Requests you've sent to venues</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse flex space-x-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  </div>
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{request.venueName}</h3>
                          <Badge 
                            variant={
                              request.status === 'accepted' ? 'default' : 
                              request.status === 'rejected' ? 'destructive' : 
                              'outline'
                            }
                            className="capitalize"
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Proposed date: {format(new Date(request.date), 'PPP')}
                        </p>
                      </div>
                      <Button variant="outline" className="mt-2 md:mt-0" onClick={() => handleViewRequest(request.id)}>
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending requests</p>
                  <Button className="mt-4" onClick={() => navigate('/venues')}>
                    Find Venues
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/venues')}>
                Find Venues to Request
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your artist profile and account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                  Edit Profile
                </Button>
                <Button variant="outline" className="w-full" onClick={() => toast({ title: "Coming soon", description: "This feature is coming soon!" })}>
                  Notification Settings
                </Button>
                <Button variant="outline" className="w-full" onClick={() => toast({ title: "Coming soon", description: "This feature is coming soon!" })}>
                  Performance Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArtistDashboard;
