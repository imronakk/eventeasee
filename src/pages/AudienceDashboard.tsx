
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, TicketIcon, BarChart3Icon, Settings2Icon, StarIcon, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const AudienceDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for audience dashboard
  const upcomingTickets = [
    { id: '1', eventName: 'Jazz Night', venue: 'Blue Note Club', date: '2023-11-15', time: '8:00 PM', quantity: 2 },
    { id: '2', eventName: 'Rock Concert', venue: 'Stadium Arena', date: '2023-12-05', time: '9:00 PM', quantity: 1 },
  ];

  const favoriteArtists = [
    { id: '1', name: 'Jazz Quartet', genre: 'Jazz' },
    { id: '2', name: 'Rock Band', genre: 'Rock' },
  ];

  const upcomingEvents = [
    { id: '1', title: 'Jazz Night', venue: 'Blue Note Club', date: '2023-11-15', time: '8:00 PM', ticketPrice: 45 },
    { id: '2', title: 'Rock Concert', venue: 'Stadium Arena', date: '2023-12-05', time: '9:00 PM', ticketPrice: 60 },
    { id: '3', title: 'Classical Evening', venue: 'Grand Hall', date: '2023-12-20', time: '7:30 PM', ticketPrice: 50 },
  ];

  const handleUpdatePreferences = () => {
    toast({
      title: "Update preferences",
      description: "Feature coming soon! This will allow you to set your preferred genres and artists.",
    });
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

      <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:w-[600px] mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4" />
            <span className="hidden sm:inline">My Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <StarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Favorites</span>
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
                <CardDescription>You have tickets to {upcomingTickets.length} upcoming events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingTickets.length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("tickets")}>
                  View my tickets
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Favorite Artists</CardTitle>
                <CardDescription>You're following {favoriteArtists.length} artists</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{favoriteArtists.length}</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("favorites")}>
                  View favorites
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recommended Events</CardTitle>
                <CardDescription>Based on your preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/events')}>
                  Browse events
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* New Upcoming Events List with Book Tickets */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Book Tickets for Upcoming Events</h2>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>{event.venue}</CardDescription>
                    <CardDescription>{event.date} at {event.time}</CardDescription>
                    <CardDescription>Price: ${event.ticketPrice}</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      onClick={() => navigate(`/events/${event.id}/book`)}
                      variant="default"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Book Tickets
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Tickets</CardTitle>
              <CardDescription>Events you're attending</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingTickets.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTickets.map((ticket) => (
                    <div key={ticket.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{ticket.eventName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {ticket.venue} • {ticket.date} • {ticket.time}
                        </p>
                        <p className="text-sm">Tickets: {ticket.quantity}</p>
                      </div>
                      <Button variant="outline" className="mt-2 md:mt-0" onClick={() => navigate(`/events/${ticket.id}`)}>
                        View Event
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven't purchased any tickets yet</p>
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

        <TabsContent value="favorites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Artists</CardTitle>
              <CardDescription>Artists you're following</CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteArtists.length > 0 ? (
                <div className="space-y-4">
                  {favoriteArtists.map((artist) => (
                    <div key={artist.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{artist.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {artist.genre}
                        </p>
                      </div>
                      <Button variant="outline" className="mt-2 md:mt-0" onClick={() => navigate(`/artists/${artist.id}`)}>
                        View Artist
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">You haven't added any favorites yet</p>
                  <Button className="mt-4" onClick={() => navigate('/artists')}>
                    Browse Artists
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate('/artists')}>
                Discover Artists
              </Button>
            </CardFooter>
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


