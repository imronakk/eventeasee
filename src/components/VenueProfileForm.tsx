
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import ProfileForm from './ProfileForm';

const VenueProfileForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [venueProfile, setVenueProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    capacity: 0,
    amenities: [] as string,
    images: [] as string,
  });

  useEffect(() => {
    if (user) {
      fetchVenueProfile();
    }
  }, [user]);

  const fetchVenueProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setVenueProfile(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          address: data.address || '',
          capacity: data.capacity || 0,
          amenities: data.amenities || [],
          images: data.images || [],
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching venue profile",
        description: error.message
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amenities = e.target.value.split(',').map(a => a.trim());
    setFormData({
      ...formData,
      amenities,
    });
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const images = e.target.value.split(',').map(i => i.trim());
    setFormData({
      ...formData,
      images,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      if (venueProfile) {
        // Update existing venue
        const { error } = await supabase
          .from('venues')
          .update({
            name: formData.name,
            description: formData.description,
            address: formData.address,
            capacity: formData.capacity,
            amenities: formData.amenities,
            images: formData.images,
          })
          .eq('id', venueProfile.id);

        if (error) throw error;
      } else {
        // Create new venue
        const { error } = await supabase
          .from('venues')
          .insert({
            id: crypto.randomUUID(),
            owner_id: user.id,
            name: formData.name,
            description: formData.description,
            address: formData.address,
            capacity: formData.capacity,
            amenities: formData.amenities,
            images: formData.images,
          });

        if (error) throw error;
      }

      toast({
        title: "Venue profile updated",
        description: "Your venue profile has been successfully updated."
      });
      
      fetchVenueProfile(); // Refresh the data
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating venue profile",
        description: error.message || "Something went wrong. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProfileForm />
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Venue Information</CardTitle>
            <CardDescription>
              Provide details about your venue to attract artists
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Venue Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. The Blue Note"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Venue Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your venue's atmosphere, history, and what makes it special..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St, City, State, Zip"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Maximum number of people"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities</Label>
              <Input
                id="amenities"
                name="amenities"
                value={formData.amenities.join(', ')}
                onChange={handleAmenitiesChange}
                placeholder="e.g. Stage, Sound System, Lighting (comma separated)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">Image URLs</Label>
              <Input
                id="images"
                name="images"
                value={formData.images.join(', ')}
                onChange={handleImagesChange}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
              <p className="text-sm text-muted-foreground">Add comma-separated image URLs</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Venue Profile"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default VenueProfileForm;
