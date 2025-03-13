
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, BuildingIcon, BarChart3Icon, Settings2Icon, CheckIcon, XIcon, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ChatInterface from '@/components/ChatInterface';

const VenueDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [venueRequests, setVenueRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);

  // Ensure we have the latest data on component mount and when user changes
  useEffect(() => {
    if (user) {
      console.log('VenueDashboard mounted, fetching data for user:', user.id);
      fetchVenues();
      fetchRequests();
    }
  }, [user]);

  // Set up real-time subscription for show_requests table
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up real-time subscription for venue owner:', user.id);
    
    const channel = supabase
      .channel('venue-owner-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'show_requests'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Refresh the requests when there's an update
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchVenues = async () => {
    if (!user) return;

    try {
      console.log('Fetching venues for owner ID:', user.id);
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;
      console.log('Fetched venues:', data);
      setVenues(data || []);
    } catch (error: any) {
      console.error('Error fetching venues:', error);
      toast({
        variant: "destructive",
        title: "Error fetching venues",
        description: error.message || "Could not fetch your venues."
      });
    }
  };

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching requests for venue owner:', user.id);
      
      // First, get venue IDs owned by the current user
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_id', user.id);

      if (venuesError) throw venuesError;

      if (!venues || venues.length === 0) {
        console.log('No venues found for this owner');
        setVenueRequests([]);
        setLoading(false);
        return;
      }

      const venueIds = venues.map(venue => venue.id);
      console.log('Found venue IDs:', venueIds);

      // Then, get all requests for these venues
      const { data: requests, error: requestsError } = await supabase
        .from('show_requests')
        .select(`
          *,
          artists (
            id,
            profile:profiles (
              full_name,
              avatar_url
            )
          ),
          venues (
            name
          )
        `)
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      console.log('Fetched requests:', requests);

      setVenueRequests(requests || []);
    } catch (error: any) {
      console.error('Error fetching venue requests:', error);
      toast({
        variant: "destructive",
        title: "Error fetching requests",
        description: error.message || "Could not fetch venue requests."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: any, action: 'accept' | 'decline') => {
    setSelectedRequest(request);
    setActionType(action);
    setConfirmDialogOpen(true);
  };

  const handleOpenChat = (request: any) => {
    setSelectedRequest(request);
    setChatDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      setProcessing(true);
      const status = actionType === 'accept' ? 'accepted' : 'rejected';
      console.log(`Updating request ${selectedRequest.id} status to ${status}`);

      const { error } = await supabase
        .from('show_requests')
        .update({ status })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      console.log('Request status updated successfully');
      
      // Fetch the updated requests to ensure UI is in sync with database
      await fetchRequests();

      toast({
        title: `Request ${status}`,
        description: `You have ${status} the performance request from ${selectedRequest.artists.profile.full_name}.`
      });

      // Open chat dialog if accepted
      if (actionType === 'accept') {
        setChatDialogOpen(true);
      }
    } catch (error: any) {
      console.error(`Error ${actionType}ing request:`, error);
      toast({
        variant: "destructive",
        title: `Error ${actionType}ing request`,
        description: error.message || `Could not ${actionType} the request.`
      });
    } finally {
      setProcessing(false);
      setConfirmDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venue Dashboard</h1>
          <p className="text-muted-foreground">Manage your venues and booking requests</p>
        </div>
        <Button onClick={() => navigate('/profile')} className="whitespace-nowrap">
          Manage Venues
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 md:w-[600px] mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="venues" className="flex items-center gap-2">
            <BuildingIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Venues</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
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
                <CardTitle>Your Venues</CardTitle>
                <CardDescription>You have {venues.length} venues registered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{venues.length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                  Manage Venues
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>You have {venueRequests.filter(r => r.status === 'pending').length} pending requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{venueRequests.filter(r => r.status === 'pending').length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/venue-dashboard?tab=requests')}>
                  View Requests
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Accepted Bookings</CardTitle>
                <CardDescription>You have {venueRequests.filter(r => r.status === 'accepted').length} accepted bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{venueRequests.filter(r => r.status === 'accepted').length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/venue-dashboard?tab=requests')}>
                  View Bookings
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="venues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Venues</CardTitle>
              <CardDescription>Manage the venues you own</CardDescription>
            </CardHeader>
            <CardContent>
              {venues.length > 0 ? (
                <div className="space-y-4">
                  {venues.map((venue) => (
                    <div key={venue.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{venue.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Capacity: {venue.capacity} | {venue.address}
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => navigate(`/venues/${venue.id}`)}>
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven't added any venues yet</p>
                  <Button className="mt-4" onClick={() => navigate('/profile')}>
                    Add a Venue
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/profile')}>
                Add New Venue
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Requests</CardTitle>
              <CardDescription>Manage artist requests for your venues</CardDescription>
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
              ) : venueRequests.length > 0 ? (
                <div className="space-y-4">
                  {venueRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{request.artists?.profile?.full_name || 'Unknown Artist'}</h3>
                            <Badge 
                              variant={request.status === 'accepted' ? 'default' : request.status === 'rejected' ? 'destructive' : 'outline'}
                              className="capitalize"
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Venue: {request.venues?.name} | Date: {format(new Date(request.proposed_date), 'PPP')}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 mt-2 md:mt-0">
                          {request.status === 'pending' ? (
                            <>
                              <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => handleAction(request, 'accept')}
                                className="flex items-center gap-1"
                              >
                                <CheckIcon className="h-4 w-4" /> Accept
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleAction(request, 'decline')}
                                className="flex items-center gap-1"
                              >
                                <XIcon className="h-4 w-4" /> Decline
                              </Button>
                            </>
                          ) : request.status === 'accepted' ? (
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleOpenChat(request)}
                              className="flex items-center gap-1"
                            >
                              <MessageSquare className="h-4 w-4" /> Chat with Artist
                            </Button>
                          ) : (
                            <Badge variant="outline">No actions available</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No performance requests yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your preferences and notification settings</CardDescription>
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
                  Booking Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'accept' ? 'Accept Request' : 'Decline Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'accept'
                ? `Are you sure you want to accept the performance request from ${selectedRequest?.artists?.profile?.full_name}?`
                : `Are you sure you want to decline the performance request from ${selectedRequest?.artists?.profile?.full_name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              disabled={processing}
              className={actionType === 'decline' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {processing ? 'Processing...' : actionType === 'accept' ? 'Accept' : 'Decline'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Dialog */}
      <AlertDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Chat with {selectedRequest?.artists?.profile?.full_name}
            </AlertDialogTitle>
          </AlertDialogHeader>
          {selectedRequest && (
            <div className="h-[500px]">
              <ChatInterface 
                requestId={selectedRequest.id}
                otherUserId={selectedRequest.artist_id}
                otherUserName={selectedRequest.artists?.profile?.full_name}
                otherUserAvatar={selectedRequest.artists?.profile?.avatar_url}
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
