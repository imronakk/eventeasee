
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const Venues = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
                    <Button size="sm" className="w-full">
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
    </div>
  );
};

export default Venues;
