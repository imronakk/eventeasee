import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, MusicIcon, BarChart3Icon, Settings2Icon, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import ChatInterface from '@/components/ChatInterface';
import EventCard from '@/components/EventCard';

const ArtistDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [requestDetailsOpen, setRequestDetailsOpen] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const upcomingEvents = [
    { id: '1', name: 'Jazz Night', venue: 'Blue Note Club', date: '2023-11-15', time: '8:00 PM' },
    { id: '2', name: 'Summer Festival', venue: 'Central Park', date: '2023-12-05', time: '4:00 PM' },
  ];

  useEffect(() => {
    if (user) {
      fetchPerformanceRequests();
      fetchEvents();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('schema-db-changes-artist')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'show_requests',
          filter: `artist_id=eq.${user.id}`,
        },
        () => {
          console.log('Show request updated, refreshing data...');
          fetchPerformanceRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'show_requests',
          filter: `artist_id=eq.${user.id}`,
        },
        () => {
          console.log('New show request received, refreshing data...');
          fetchPerformanceRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'show_requests',
          filter: `artist_id=eq.${user.id}`,
        },
        () => {
          console.log('Show request deleted, refreshing data...');
          fetchPerformanceRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPerformanceRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      console.log('Fetching performance requests for artist ID:', user.id);
      
      const { data: requests, error } = await supabase
        .from('show_requests')
        .select(`
          id,
          proposed_date,
          message,
          status,
          venues (
            id,
            name,
            owner_id
          )
        `)
        .eq('artist_id', user.id);
        
      if (error) throw error;
      
      console.log('Raw requests data:', requests);
      
      const venueOwnerIds = requests?.map(req => req.venues?.owner_id).filter(Boolean) || [];
      
      const { data: ownerProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', venueOwnerIds);
        
      if (profilesError) throw profilesError;
      
      console.log('Owner profiles data:', ownerProfiles);
      
      const processedRequests = requests?.map(request => {
        const venueOwner = ownerProfiles?.find(profile => profile.id === request.venues?.owner_id);
        const statusNormalized = request.status ? request.status.toLowerCase().trim() : 'pending';
        return {
          id: request.id,
          venueName: request.venues?.name || 'Unknown Venue',
          venueId: request.venues?.id,
          venueOwnerId: request.venues?.owner_id,
          venueOwnerName: venueOwner?.full_name || 'Venue Owner',
          venueOwnerAvatar: venueOwner?.avatar_url,
          date: request.proposed_date,
          status: statusNormalized,
          message: request.message
        };
      }) || [];
      
      console.log('Processed requests:', processedRequests);
      console.log('Statuses:', processedRequests.map(r => r.status));
      
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

  const fetchEvents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          venue:venues (
            name
          )
        `)
        .eq('artist_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);

      const channel = supabase
        .channel('artist-events')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'events',
            filter: `artist_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('New event created:', payload);
            toast({
              title: "New Event Created",
              description: `A new event "${payload.new.name}" has been created with you!`,
            });
            fetchEvents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching events",
        description: error.message,
      });
    }
  };

  const handleCreateProfile = () => {
    navigate('/profile');
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setRequestDetailsOpen(true);
  };

  const handleOpenChat = (request: any) => {
    setSelectedRequest(request);
    setChatDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'default';
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
                <CardTitle>Accepted Requests</CardTitle>
                <CardDescription>You have {pendingRequests.filter(r => r.status === 'accepted').length} accepted performance requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingRequests.filter(r => r.status === 'accepted').length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("requests")}>
                  View all requests
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>Events you're scheduled to perform at</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="grid gap-4">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No events scheduled yet</p>
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
                  {pendingRequests.map((request) => {
                    const statusLower = request.status.toLowerCase();
                    return (
                      <div key={request.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{request.venueName}</h3>
                            <Badge 
                              variant={getStatusBadgeVariant(request.status)}
                              className="capitalize"
                            >
                              {statusLower}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Proposed date: {format(new Date(request.date), 'PPP')}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewRequest(request)}
                          >
                            View Details
                          </Button>
                          
                          {statusLower === 'accepted' && (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleOpenChat(request)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" /> Chat with Venue
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

      <AlertDialog open={requestDetailsOpen} onOpenChange={setRequestDetailsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Performance Request Details</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRequest && (
                <div className="space-y-4 py-2">
                  <div>
                    <h4 className="font-medium">Venue</h4>
                    <p>{selectedRequest.venueName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Status</h4>
                    <Badge variant={getStatusBadgeVariant(selectedRequest.status)} className="capitalize mt-1">
                      {selectedRequest.status.toLowerCase()}
                    </Badge>
                    {selectedRequest.status.toLowerCase() === 'accepted' && (
                      <p className="mt-2 text-sm text-green-600">
                        Congratulations! Your request has been accepted. You can now chat with the venue owner to discuss details.
                      </p>
                    )}
                    {selectedRequest.status.toLowerCase() === 'rejected' && (
                      <p className="mt-2 text-sm text-red-600">
                        Your request has been declined by the venue.
                      </p>
                    )}
                    {selectedRequest.status.toLowerCase() === 'pending' && (
                      <p className="mt-2 text-sm text-yellow-600">
                        Your request is still pending a response from the venue.
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">Proposed Date</h4>
                    <p>{selectedRequest && format(new Date(selectedRequest.date), 'PPP')}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Your Message</h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.message || "No message provided"}</p>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {selectedRequest && selectedRequest.status.toLowerCase() === 'accepted' && (
              <Button onClick={() => {
                setChatDialogOpen(true);
                setRequestDetailsOpen(false);
              }}>
                <MessageSquare className="h-4 w-4 mr-2" /> Chat with Venue
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Chat with {selectedRequest?.venueOwnerName}
            </AlertDialogTitle>
          </AlertDialogHeader>
          {selectedRequest && (
            <div className="h-[500px]">
              <ChatInterface 
                requestId={selectedRequest.id}
                otherUserId={selectedRequest.venueOwnerId}
                otherUserName={selectedRequest.venueOwnerName}
                otherUserAvatar={selectedRequest.venueOwnerAvatar}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ArtistDashboard;
