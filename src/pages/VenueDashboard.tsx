
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, BuildingIcon, BarChart3Icon, Settings2Icon, CheckIcon, XIcon, MessageSquare, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ChatInterface from '@/components/ChatInterface';
import CreateEventDialog from '@/components/CreateEventDialog';
import EventCard from '@/components/EventCard';
import UpdateEventDialog from '@/components/UpdateEventDialog';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [artists, setArtists] = useState<any[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [artistToRequest, setArtistToRequest] = useState<any>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [updateEventDialogOpen, setUpdateEventDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('VenueDashboard mounted, fetching data for user:', user.id);
      fetchVenues();
      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'artists') {
      fetchArtists();
    }
  }, [activeTab]);

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
          if (payload.eventType === 'UPDATE') {
            const updatedRequest = payload.new;
            setVenueRequests(prevRequests => 
              prevRequests.map(req => 
                req.id === updatedRequest.id ? { ...req, status: updatedRequest.status } : req
              )
            );
          } else {
            fetchRequests();
          }
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
      setVenues(data || []);
    } catch (error: any) {
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
      
      const { data: venuesList, error: venuesError } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_id', user.id);

      if (venuesError) throw venuesError;

      if (!venuesList || venuesList.length === 0) {
        setVenueRequests([]);
        setLoading(false);
        return;
      }

      const venueIds = venuesList.map(venue => venue.id);

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

      setVenueRequests(requests || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching requests",
        description: error.message || "Could not fetch venue requests."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    setArtistsLoading(true);
    try {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          id,
          description,
          experience,
          introduction_video_url,
          genre,
          profiles!artists_id_fkey (
            full_name,
            avatar_url
          )
        `);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching artists",
          description: error.message || "Could not fetch artists."
        });
        setArtists([]);
      } else if (data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          description: item.description,
          experience: item.experience,
          introductionVideo: item.introduction_video_url,
          genres: item.genre || [],
          userName: item.profiles?.full_name || 'Unknown Artist',
          userAvatar: item.profiles?.avatar_url,
        }));
        setArtists(formatted);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching artists",
        description: error.message || "Could not fetch artists."
      });
      setArtists([]);
    } finally {
      setArtistsLoading(false);
    }
  };

  const openRequestDialog = (artist: any) => {
    setArtistToRequest(artist);
    setRequestMessage('');
    setRequestDialogOpen(true);
  };

  const submitPerformanceRequest = async () => {
    if (!artistToRequest || !venues.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Artist or venues not selected properly."
      });
      return;
    }

    const venueId = venues[0].id;
    const proposedDate = new Date();
    proposedDate.setDate(proposedDate.getDate() + 7);

    try {
      setProcessing(true);
      const { error } = await supabase
        .from('show_requests')
        .insert([{
          artist_id: artistToRequest.id,
          venue_id: venueId,
          proposed_date: proposedDate.toISOString(),
          initiator: 'venue_owner',
          status: 'pending',
          message: requestMessage || null
        }]);

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: `Performance request sent to ${artistToRequest.userName}.`
      });

      setRequestDialogOpen(false);
      setArtistToRequest(null);
      fetchRequests();
      setActiveTab('requests');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send request",
        description: error.message || "Please try again."
      });
    } finally {
      setProcessing(false);
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

    setProcessing(true);
    try {
      console.log(`Attempting to ${actionType} request with ID:`, selectedRequest.id);
      const newStatus = actionType === 'accept' ? 'accepted' : 'rejected';
      
      // Update the request status in the database with improved logging
      console.log(`Updating request ${selectedRequest.id} to status: ${newStatus}`);
      const { data, error } = await supabase
        .from('show_requests')
        .update({ status: newStatus })
        .eq('id', selectedRequest.id)
        .select();

      if (error) {
        console.error('Error updating request status:', error);
        throw error;
      }

      console.log('Update successful, response data:', data);
      
      // Update local state to reflect the change
      setVenueRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === selectedRequest.id ? { ...req, status: newStatus } : req
        )
      );

      toast({
        title: `Request ${actionType === 'accept' ? 'accepted' : 'declined'}`,
        description: `The performance request has been ${actionType === 'accept' ? 'accepted' : 'declined'}.`,
      });

      // Refresh the requests data to ensure UI is in sync with database
      await fetchRequests();
    } catch (error: any) {
      console.error('Action failed:', error);
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.message || "Failed to update the request status.",
      });
    } finally {
      setProcessing(false);
      setConfirmDialogOpen(false);
      setSelectedRequest(null);
      setActionType(null);
    }
  };

  const handleCreateEvent = (request: any) => {
    setSelectedArtist(request.artists);
    setCreateEventDialogOpen(true);
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          artist:artists (
            profile:profiles (
              full_name
            )
          ),
          venue:venues (
            name
          )
        `)
        .in('venue_id', venues.map(venue => venue.id));

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching events",
        description: error.message,
      });
    }
  };

  useEffect(() => {
    if (venues.length > 0) {
      fetchEvents();
    }
  }, [venues]);

  const handleUpdateEvent = (event: any) => {
    setSelectedEvent(event);
    setUpdateEventDialogOpen(true);
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'venues', 'requests', 'settings', 'artists'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url);
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-6 md:w-[750px] mb-8">
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
          <TabsTrigger value="artists" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Artists</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
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
                <Button variant="outline" className="w-full" onClick={() => handleTabChange('requests')}>
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
                <Button variant="outline" className="w-full" onClick={() => handleTabChange('requests')}>
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
                  {venueRequests.map((request) => {
                    const status = request.status?.toLowerCase() || 'pending';
                    const hasEvent = events.some(event => 
                      event.artist_id === request.artist_id && 
                      event.venue_id === request.venue_id
                    );

                    return (
                      <div key={request.id} className="p-4 border rounded-lg">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{request.artists?.profile?.full_name || 'Unknown Artist'}</h3>
                              <Badge 
                                variant={status === 'accepted' ? 'default' : status === 'rejected' ? 'destructive' : 'outline'}
                                className="capitalize"
                              >
                                {status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Venue: {request.venues?.name} | Date: {format(new Date(request.proposed_date), 'PPP')}
                            </p>
                          </div>
                          
                          <div className="flex gap-2 mt-2 md:mt-0">
                            {status === 'pending' ? (
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
                            ) : status === 'accepted' ? (
                              <div className="flex gap-2">
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleCreateEvent(request)}
                                  disabled={hasEvent}
                                  className="flex items-center gap-1"
                                >
                                  {hasEvent ? 'Event Created' : 'Create Event'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenChat(request)}
                                  className="flex items-center gap-1"
                                >
                                  <MessageSquare className="h-4 w-4" /> Chat with Artist
                                </Button>
                              </div>
                            ) : (
                              <Badge variant="outline">No actions available</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No performance requests yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Artists</CardTitle>
              <CardDescription>Browse artists and send performance requests</CardDescription>
            </CardHeader>
            <CardContent>
              {artistsLoading ? (
                <div className="text-center text-gray-600 py-8">Loading artists...</div>
              ) : artists.length === 0 ? (
                <div className="text-center text-gray-600 py-8">No artists found.</div>
              ) : (
                <div className="space-y-4">
                  {artists.map((artist) => (
                    <div key={artist.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          {artist.userAvatar ? (
                            <img
                              src={artist.userAvatar}
                              alt={artist.userName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                              {artist.userName.charAt(0)}
                            </div>
                          )}
                          <h3 className="font-medium">{artist.userName}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                          {artist.description || 'No description available.'}
                        </p>
                        {artist.genres && artist.genres.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {artist.genres.map((genre: string) => (
                              <span
                                key={genre}
                                className="text-xs font-medium bg-primary/20 text-primary rounded-full px-2 py-1"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 md:mt-0">
                        <Button variant="default" size="sm" onClick={() => openRequestDialog(artist)}>
                          Request Performance
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>Events scheduled at your venues</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="grid gap-4">
                  {events.map((event) => (
                    <div key={event.id} className="relative">
                      <EventCard event={event} />
                      <Button 
                        className="absolute top-4 right-4" 
                        variant="outline"
                        onClick={() => handleUpdateEvent(event)}
                      >
                        Update Event
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No events scheduled yet</p>
                  <Button className="mt-4" onClick={() => setActiveTab("requests")}>
                    View Requests to Create Event
                  </Button>
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

      <AlertDialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Performance Request</AlertDialogTitle>
            <AlertDialogDescription>
              Send a performance request to {artistToRequest?.userName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 py-2">
            <label htmlFor="requestMessage" className="block font-medium mb-1">Message (optional)</label>
            <textarea
              id="requestMessage"
              className="w-full border border-gray-300 rounded-md p-2 resize-none"
              rows={4}
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Enter your message or details about the request"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitPerformanceRequest} disabled={processing}>
              {processing ? 'Sending...' : 'Send Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedArtist && venues.length > 0 && (
        <CreateEventDialog
          open={createEventDialogOpen}
          onOpenChange={setCreateEventDialogOpen}
          artist={selectedArtist}
          venue={venues[0]}
        />
      )}

      {selectedEvent && (
        <UpdateEventDialog
          open={updateEventDialogOpen}
          onOpenChange={setUpdateEventDialogOpen}
          event={selectedEvent}
          onUpdate={fetchEvents}
        />
      )}
    </div>
  );
};

export default VenueDashboard;
