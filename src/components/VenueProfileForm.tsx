
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  amenities: z.string().optional(),
  images: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function VenueProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [venueProfile, setVenueProfile] = useState<any>(null);
  const [profileDetails, setProfileDetails] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      capacity: 0,
      amenities: '',
      images: '',
      gstin: '',
      pan: '',
    },
  });

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        // First load the user profile to get GSTIN and PAN
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('gstin, pan')
          .eq('id', user.id)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        setProfileDetails(profileData);
        
        // Then load the venue profile
        const { data: venueData, error: venueError } = await supabase
          .from('venues')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();
          
        if (venueError && venueError.code !== 'PGRST116') {
          throw venueError;
        }

        if (venueData) {
          setVenueProfile(venueData);
          form.reset({
            name: venueData.name || '',
            description: venueData.description || '',
            address: venueData.address || '',
            capacity: venueData.capacity || 0,
            amenities: venueData.amenities ? venueData.amenities.join(', ') : '',
            images: venueData.images ? venueData.images.join(', ') : '',
            gstin: profileData?.gstin || '',
            pan: profileData?.pan || '',
          });
        } else {
          // Just set GSTIN and PAN if venue profile doesn't exist yet
          form.setValue('gstin', profileData?.gstin || '');
          form.setValue('pan', profileData?.pan || '');
        }
      } catch (error: any) {
        console.error('Error loading venue profile:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load profile',
          description: error.message || 'Please try again later',
        });
      }
    }

    loadData();
  }, [user, form, toast]);

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not authenticated',
        description: 'You must be logged in to update your profile',
      });
      return;
    }
    
    setLoading(true);
    try {
      // First, update GSTIN and PAN in the profiles table
      if (values.gstin !== profileDetails?.gstin || values.pan !== profileDetails?.pan) {
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            gstin: values.gstin,
            pan: values.pan,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
          
        if (profileUpdateError) throw profileUpdateError;
      }
      
      // Process the amenities and images from comma-separated string to array
      const amenitiesArray = values.amenities 
        ? values.amenities.split(',').map(item => item.trim()).filter(Boolean)
        : [];
      
      const imagesArray = values.images
        ? values.images.split(',').map(item => item.trim()).filter(Boolean)
        : [];

      if (venueProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('venues')
          .update({
            name: values.name,
            description: values.description,
            address: values.address,
            capacity: values.capacity,
            amenities: amenitiesArray,
            images: imagesArray,
            updated_at: new Date().toISOString(),
          })
          .eq('id', venueProfile.id);

        if (error) throw error;

        toast({
          title: 'Profile updated',
          description: 'Your venue profile has been updated successfully',
        });
      } else {
        // Create new profile
        const { error } = await supabase
          .from('venues')
          .insert({
            owner_id: user.id,
            id: user.id,
            name: values.name,
            description: values.description,
            address: values.address,
            capacity: values.capacity,
            amenities: amenitiesArray,
            images: imagesArray,
          });

        if (error) throw error;

        toast({
          title: 'Profile created',
          description: 'Your venue profile has been created successfully',
        });
      }
    } catch (error: any) {
      console.error('Error saving venue profile:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to save profile',
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 border rounded shadow-sm">
        <p className="text-center text-muted-foreground">
          Please sign in to manage your venue profile
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Venue Profile</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium mb-4">Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gstin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GSTIN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter GSTIN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter PAN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter venue name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your venue (atmosphere, history, specialty, etc.)" 
                    className="resize-none h-32"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter venue address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter venue capacity" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amenities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amenities</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter amenities separated by comma (e.g. parking, sound system, lighting)" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Images</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter image URLs separated by comma" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
