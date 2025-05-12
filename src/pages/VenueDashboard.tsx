
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BarChart3Icon, CalendarIcon, Settings2Icon, TicketIcon, UsersIcon, HomeIcon, BuildingIcon, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import VenueBookings from '@/components/VenueBookings';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import ChatInterface from '@/components/ChatInterface';
import CreateEventDialog from '@/components/CreateEventDialog';

// Import NavigationMenu components
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

// Import Menubar components for mobile navigation
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

interface PerformanceRequest {
  id: string;
  artist_id: string;
  proposed_date: string;
  status: string;
  message: string;
  created_at: string;
  artist: {
    profiles: {
      full_name: string;
      email: string;
      avatar_url?: string;
    };
  };
}

const VenueDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [performanceRequests, setPerformanceRequests] = useState<PerformanceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PerformanceRequest | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);

  // Fetch performance requests when requests tab is selected
  useEffect(() => {
    const fetchRequests = async () => {
      if (activeTab !== "requests" || !user) return;
      
      try {
        setLoading(true);
        
        // First get venue ID for the logged in user
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('id, name')
          .eq('owner_id', user.id)
          .single();
            
        if (venueError) {
          console.error("Error fetching venue:", venueError);
          toast({
            variant: "destructive",
            title: "Error loading venue",
            description: "Could not find your venue details. Please check your account.",
          });
          return;
        }
        
        setVenueId(venueData.id);
        setVenueName(venueData.name);
        
        // Then get performance requests for this venue
        const { data: requests, error: requestsError } = await supabase
          .from('show_requests')
          .select(`
            id,
            artist_id,
            proposed_date,
            status,
            message,
            created_at,
            artist:artists (
              profiles:profiles (
                full_name,
                email,
                avatar_url
              )
            )
          `)
          .eq('venue_id', venueData.id)
          .order('created_at', { ascending: false });
          
        if (requestsError) {
          console.error("Error fetching requests:", requestsError);
          toast({
            variant: "destructive",
            title: "Error loading performance requests",
            description: requestsError.message || "Could not load performance requests",
          });
          return;
        }
        
        setPerformanceRequests(requests as PerformanceRequest[]);
      } catch (error: any) {
        console.error("Error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [activeTab, user, toast]);

  // Function to handle request approval
  const handleRequestAction = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('show_requests')
        .update({ status })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Update local state to reflect the change
      setPerformanceRequests(prev => 
        prev.map(request => 
          request.id === requestId ? { ...request, status } : request
        )
      );
      
      toast({
        title: `Request ${status}`,
        description: `The performance request has been ${status}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update the request status.",
      });
    }
  };

  // Handle chat button click
  const handleChatClick = (request: PerformanceRequest) => {
    setSelectedRequest(request);
    setChatOpen(true);
  };

  // Handle create event button click
  const handleCreateEventClick = (request: PerformanceRequest) => {
    setSelectedRequest(request);
    setCreateEventOpen(true);
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venue Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Button asChild>
          <Link to="/events/create">Create New Event</Link>
        </Button>
      </div>

      {/* Desktop Navigation Menu */}
      <div className="hidden md:block mb-8">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
              >
                <HomeIcon className="mr-2 h-4 w-4" />
                Overview
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                active={activeTab === "venues"}
                onClick={() => setActiveTab("venues")}
              >
                <BuildingIcon className="mr-2 h-4 w-4" />
                Venues
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                active={activeTab === "requests"}
                onClick={() => setActiveTab("requests")}
              >
                <UsersIcon className="mr-2 h-4 w-4" />
                Requests
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                active={activeTab === "bookings"}
                onClick={() => setActiveTab("bookings")}
              >
                <TicketIcon className="mr-2 h-4 w-4" />
                Bookings
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                active={activeTab === "events"}
                onClick={() => setActiveTab("events")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Events
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink 
                className={navigationMenuTriggerStyle()}
                active={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
              >
                <Settings2Icon className="mr-2 h-4 w-4" />
                Settings
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Mobile Navigation Menu */}
      <div className="md:hidden mb-8">
        <Menubar className="flex justify-between border-none p-0">
          <MenubarMenu>
            <MenubarTrigger className="font-medium">
              {activeTab === "overview" && <HomeIcon className="mr-2 h-4 w-4" />}
              {activeTab === "venues" && <BuildingIcon className="mr-2 h-4 w-4" />}
              {activeTab === "requests" && <UsersIcon className="mr-2 h-4 w-4" />}
              {activeTab === "bookings" && <TicketIcon className="mr-2 h-4 w-4" />}
              {activeTab === "events" && <CalendarIcon className="mr-2 h-4 w-4" />}
              {activeTab === "settings" && <Settings2Icon className="mr-2 h-4 w-4" />}
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => setActiveTab("overview")}>
                <HomeIcon className="mr-2 h-4 w-4" />
                Overview
              </MenubarItem>
              <MenubarItem onClick={() => setActiveTab("venues")}>
                <BuildingIcon className="mr-2 h-4 w-4" />
                Venues
              </MenubarItem>
              <MenubarItem onClick={() => setActiveTab("requests")}>
                <UsersIcon className="mr-2 h-4 w-4" />
                Requests
              </MenubarItem>
              <MenubarItem onClick={() => setActiveTab("bookings")}>
                <TicketIcon className="mr-2 h-4 w-4" />
                Bookings
              </MenubarItem>
              <MenubarItem onClick={() => setActiveTab("events")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Events
              </MenubarItem>
              <MenubarItem onClick={() => setActiveTab("settings")}>
                <Settings2Icon className="mr-2 h-4 w-4" />
                Settings
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Events</CardTitle>
                <CardDescription>Your venue events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("events")}>View All Events</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>Events scheduled in the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("events")}>Manage Events</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Attendees</CardTitle>
                <CardDescription>People attending your events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">256</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">View Details</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="venues">
          <Card>
            <CardHeader>
              <CardTitle>My Venues</CardTitle>
              <CardDescription>Manage your venues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                Venue management features coming soon...
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Add New Venue</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Performance Requests</CardTitle>
              <CardDescription>Manage artist performance requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : performanceRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artist</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Proposed Date</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.artist?.profiles?.full_name || "Unknown Artist"}</TableCell>
                        <TableCell>{request.artist?.profiles?.email || "No email provided"}</TableCell>
                        <TableCell>{format(new Date(request.proposed_date), 'PPP')}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{request.message || "No message"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleRequestAction(request.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleRequestAction(request.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          {request.status === 'approved' && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleChatClick(request)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Chat
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleCreateEventClick(request)}
                              >
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Create Event
                              </Button>
                            </div>
                          )}
                          {request.status === 'rejected' && (
                            <span className="text-muted-foreground">No actions available</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  No performance requests yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Bookings</CardTitle>
              <CardDescription>Manage and track all bookings across your venues</CardDescription>
            </CardHeader>
            <CardContent>
              <VenueBookings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>Manage all your venue events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">
                Event management features coming soon...
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/events/create">Create New Event</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your venue account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">Edit Venue Profile</Button>
              <Button variant="outline" className="w-full">Update Payment Details</Button>
              <Button variant="outline" className="w-full">Notification Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chat Dialog */}
      <AlertDialog open={chatOpen} onOpenChange={setChatOpen}>
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Chat with {selectedRequest?.artist?.profiles?.full_name}
            </AlertDialogTitle>
          </AlertDialogHeader>
          {selectedRequest && (
            <div className="h-[500px]">
              <ChatInterface 
                requestId={selectedRequest.id}
                otherUserId={selectedRequest.artist_id}
                otherUserName={selectedRequest.artist?.profiles?.full_name || "Artist"}
                otherUserAvatar={selectedRequest.artist?.profiles?.avatar_url}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Event Dialog */}
      {selectedRequest && venueId && venueName && (
        <CreateEventDialog
          open={createEventOpen}
          onOpenChange={setCreateEventOpen}
          artist={{
            id: selectedRequest.artist_id,
            profile: {
              full_name: selectedRequest.artist?.profiles?.full_name || "Artist"
            }
          }}
          venue={{
            id: venueId,
            name: venueName
          }}
        />
      )}
    </div>
  );
};

export default VenueDashboard;
