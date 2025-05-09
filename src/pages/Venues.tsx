import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';

const Venues = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('venues')
        .select('*');

      if (error) throw error;
      
      setVenues(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching venues",
        description: error.message || "Could not load venues."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToPerform = (venue: any) => {
    setSelectedVenue(venue);
    setIsRequestOpen(true);
  };

  // Function to ensure artist exists before submitting request
  const ensureArtistExists = async (userId: string) => {
    try {
      // Check if artist record exists
      const { data: existingArtist, error: checkError } = await supabase
        .from('artists')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      // If artist doesn't exist, create one
      if (!existingArtist) {
        const { error: insertError } = await supabase
          .from('artists')
          .insert({
            id: userId,
            description: '', // Default empty values
            experience: '',
            genre: []
          });
        
        if (insertError) throw insertError;
        
        console.log('Created artist record');
        return true;
      }
      
      return true;
    } catch (error: any) {
      console.error('Error ensuring artist exists:', error);
      return false;
    }
  };

  const handleRequestSubmit = async () => {
    if (!user || !selectedVenue || !requestDate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide all required information."
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First ensure artist record exists
      const artistExists = await ensureArtistExists(user.id);
      
      if (!artistExists) {
        throw new Error("Could not create artist profile. Please complete your artist profile first.");
      }
      
      // Format the request data
      const requestData = {
        artist_id: user.id,
        venue_id: selectedVenue.id,
        proposed_date: new Date(requestDate).toISOString(),
        message: requestMessage,
        initiator: 'artist' as const,
        status: 'pending'
      };
      
      // Submit the request to the database
      const { error } = await supabase
        .from('show_requests')
        .insert(requestData);
        
      if (error) throw error;
      
      // Success message
      toast({
        title: "Request sent",
        description: `Your performance request to ${selectedVenue.name} has been sent.`
      });
      
      // Close the dialog and reset form
      setIsRequestOpen(false);
      setRequestMessage('');
      setRequestDate('');
      setSelectedVenue(null);
      
    } catch (error: any) {
      console.error("Error sending performance request:", error);
      toast({
        variant: "destructive",
        title: "Error sending request",
        description: error.message || "Could not send your request. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVenues = venues.filter(venue => 
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Venues</h1>
          <p className="text-muted-foreground mt-2">Find the perfect venue for your next performance</p>
        </div>
        
        <div className="w-full md:w-auto">
          <Input
            placeholder="Search venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-pulse flex space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.length > 0 ? (
            filteredVenues.map((venue) => (
              <Card key={venue.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>{venue.name}</CardTitle>
                  <CardDescription>Capacity: {venue.capacity} people</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {venue.description || "No description available"}
                  </p>
                  <div>
                    <Label className="text-xs">Address</Label>
                    <p className="text-sm">{venue.address}</p>
                  </div>
                  {venue.amenities && venue.amenities.length > 0 && (
                    <div>
                      <Label className="text-xs">Amenities</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {venue.amenities.map((amenity: string, index: number) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {user?.role === 'artist' && (
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleRequestToPerform(venue)}
                    >
                      Request to Perform
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium">No venues found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}

      {/* Performance Request Dialog */}
      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request to Perform</DialogTitle>
            <DialogDescription>
              Send a request to perform at {selectedVenue?.name}. Please provide details about your performance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Proposed Date</Label>
              <Input
                id="date"
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message to Venue Owner</Label>
              <Textarea
                id="message"
                placeholder="Tell the venue about your performance, requirements, or any other details..."
                rows={4}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestSubmit} 
              disabled={isSubmitting || !requestDate}
            >
              {isSubmitting ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Venues;
