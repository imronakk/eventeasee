
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BarChart3Icon, CalendarIcon, Settings2Icon, TicketIcon, UsersIcon, HomeIcon, BuildingIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import VenueBookings from '@/components/VenueBookings';
import { Link } from 'react-router-dom';

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

const VenueDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venue Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Button as={Link} to="/events/create">Create New Event</Button>
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

          <Card className="p-6">
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest ticket bookings for your venues</CardDescription>
            </CardHeader>
            <CardContent>
              <VenueBookings />
            </CardContent>
          </Card>
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
              <div className="text-center py-10 text-muted-foreground">
                Request management features coming soon...
              </div>
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
              <Button as={Link} to="/events/create" className="w-full">Create New Event</Button>
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
    </div>
  );
};

export default VenueDashboard;
