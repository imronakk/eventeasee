
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, HomeIcon, BarChart3Icon, Settings2Icon, UsersIcon, CheckIcon, XIcon, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import ChatInterface from '@/components/ChatInterface';

const VenueDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [artistRequests, setArtistRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);

  // Fetch artist requests from the database
  useEffect(() => {
    if (user) {
      fetchArtistRequests();
    }
  }, [user]);

  // Subscribe to changes in show_requests
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'show_requests'
        },
        () => {
          // Refresh the requests when there's an update
          fetchArtistRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchArtistRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First get all venue IDs owned by this user
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_id', user.id);
        
      if (venuesError) throw venuesError;
      
      if (!venues || venues.length === 0) {
        setLoading(false);
        return;
      }
      
      // Get all venue IDs
      const venueIds = venues.map(venue => venue.id);
      
      // Fetch all show requests for these venues
      const { data: requests, error: requestsError } = await supabase
        .from('show_requests')
        .select(`
          id,
          proposed_date,
          message,
          status,
          artists (
            id,
            description
          ),
          venues (
            id,
            name
          )
        `)
        .in('venue_id', venueIds);
        
      if (requestsError) throw requestsError;
      
      // Also get artist profile information
      const artistIds = requests?.map(req => req.artists?.id) || [];
      
      const { data: artistProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', artistIds);
        
      if (profilesError) throw profilesError;
      
      // Combine data
      const enrichedRequests = requests?.map(request => {
        const artistProfile = artistProfiles?.find(profile => profile.id === request.artists?.id);
        return {
          ...request,
          artistName: artistProfile?.full_name || 'Unknown Artist',
          artistId: request.artists?.id,
          artistAvatar: artistProfile?.avatar_url
        };
      }) || [];
      
      setArtistRequests(enrichedRequests);
    } catch (error: any) {
      console.error("Error fetching artist requests:", error);
      toast({
        variant: "destructive",
        title: "Error fetching requests",
        description: error.message || "Could not load artist requests."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    navigate('/profile');
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setActionDialogOpen(true);
  };

  const handleAcceptRequest = (request: any) => {
    setSelectedRequest(request);
    setActionType('accept');
    setActionDialogOpen(true);
  };

  const handleDeclineRequest = (request: any) => {
    setSelectedRequest(request);
    setActionType('decline');
    setActionDialogOpen(true);
  };

  const handleOpenChat = (request: any) => {
    setSelectedRequest(request);
    setChatDialogOpen(true);
  };

  const confirmRequestAction = async () => {
    if (!selectedRequest || !actionType) return;
    
    try {
      const { error } = await supabase
        .from('show_requests')
        .update({ status: actionType === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', selectedRequest.id);
        
      if (error) throw error;
      
      toast({
        title: actionType === 'accept' ? "Request accepted" : "Request declined",
        description: actionType === 'accept' 
          ? `You've accepted the performance request from ${selectedRequest.artistName}` 
          : `You've declined the performance request from ${selectedRequest.artistName}`
      });
      
      // Refresh the requests
      fetchArtistRequests();
      
    } catch (error: any) {
      console.error("Error updating request:", error);
      toast({
        variant: "destructive",
        title: "Error updating request",
        description: error.message || "Could not update the request status."
      });
    } finally {
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  // Mock data for venue dashboard
  const upcomingEvents = [
    { id: '1', name: 'Jazz Night', artist: 'John Coltrane', date: '2023-11-15', time: '8:00 PM' },
    { id: '2', name: 'Rock Concert', artist: 'The Rockers', date: '2023-12-05', time: '9:00 PM' },
  ];

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venue Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Button onClick={handleCreateProfile} className="whitespace-nowrap">
          Complete Venue Profile
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
          <TabsTrigger value="artists" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Artists</span>
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
                <CardTitle>Artist Requests</CardTitle>
                <CardDescription>You have {artistRequests.filter(req => req.status === 'pending').length} pending artist requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{artistRequests.filter(req => req.status === 'pending').length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("artists")}>
                  View all requests
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Profile Completion</CardTitle>
                <CardDescription>Complete your venue profile to attract more artists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">60%</div>
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[60%]"></div>
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
              <CardTitle>Your Venue's Events</CardTitle>
              <CardDescription>Events scheduled at your venue</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.artist} • {event.date} • {event.time}
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
                  <Button className="mt-4" onClick={() => navigate('/artists')}>
                    Find Artists
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => toast({ title: "Coming soon", description: "Create event feature is coming soon!" })}>
                Create New Event
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="artists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Artist Requests</CardTitle>
              <CardDescription>Performance requests from artists</CardDescription>
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
              ) : artistRequests.length > 0 ? (
                <div className="space-y-4">
                  {artistRequests.map((request) => (
                    <div key={request.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{request.artistName}</h3>
                        <p className="text-sm text-muted-foreground">
                          Proposed date: {format(new Date(request.proposed_date), 'PPP')}
                        </p>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            request.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status === 'accepted' ? 'Accepted' : 
                             request.status === 'rejected' ? 'Declined' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/artists/${request.artistId}`)}
                        >
                          View Artist
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          View Details
                        </Button>
                        
                        {request.status === 'accepted' ? (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleOpenChat(request)}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" /> Chat
                          </Button>
                        ) : request.status === 'pending' ? (
                          <>
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAcceptRequest(request)}
                            >
                              <CheckIcon className="h-4 w-4 mr-1" /> Accept
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeclineRequest(request)}
                            >
                              <XIcon className="h-4 w-4 mr-1" /> Decline
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No requests</p>
                  <Button className="mt-4" onClick={() => navigate('/artists')}>
                    Find Artists
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/artists')}>
                Browse Artists
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Venue Settings</CardTitle>
              <CardDescription>Manage your venue details and account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                  Edit Venue Profile
                </Button>
                <Button variant="outline" className="w-full" onClick={() => toast({ title: "Coming soon", description: "This feature is coming soon!" })}>
                  Availability Calendar
                </Button>
                <Button variant="outline" className="w-full" onClick={() => toast({ title: "Coming soon", description: "This feature is coming soon!" })}>
                  Booking Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Action Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'accept' 
                ? "Accept Performance Request" 
                : actionType === 'decline' 
                  ? "Decline Performance Request" 
                  : "Performance Request Details"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRequest && (
                <div className="space-y-4 py-2">
                  <div>
                    <h4 className="font-medium">Artist</h4>
                    <p>{selectedRequest.artistName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Proposed Date</h4>
                    <p>{selectedRequest && format(new Date(selectedRequest.proposed_date), 'PPP')}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Message</h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.message || "No message provided"}</p>
                  </div>
                  {actionType === 'accept' && (
                    <p>Are you sure you want to accept this performance request?</p>
                  )}
                  {actionType === 'decline' && (
                    <p>Are you sure you want to decline this performance request?</p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {actionType && (
              <AlertDialogAction onClick={confirmRequestAction}>
                {actionType === 'accept' ? "Accept" : "Decline"}
              </AlertDialogAction>
            )}
            {!actionType && (
              <div className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setActionType('decline');
                  }}
                >
                  Decline
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700" 
                  onClick={() => {
                    setActionType('accept');
                  }}
                >
                  Accept
                </Button>
              </div>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Dialog */}
      <AlertDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Chat with {selectedRequest?.artistName}
            </AlertDialogTitle>
          </AlertDialogHeader>
          {selectedRequest && (
            <div className="h-[500px]">
              <ChatInterface 
                requestId={selectedRequest.id}
                otherUserId={selectedRequest.artistId}
                otherUserName={selectedRequest.artistName}
                otherUserAvatar={selectedRequest.artistAvatar}
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

export default VenueDashboard;
