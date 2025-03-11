
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
import { Link } from 'react-router-dom';

const ArtistProfileForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    description: '',
    experience: '',
    introduction_video_url: '',
    genre: [] as string[],
  });
  const [showVenuesLink, setShowVenuesLink] = useState(false);

  useEffect(() => {
    if (user) {
      fetchArtistProfile();
    }
  }, [user]);

  const fetchArtistProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setArtistProfile(data);
        setFormData({
          description: data.description || '',
          experience: data.experience || '',
          introduction_video_url: data.introduction_video_url || '',
          genre: data.genre || [],
        });
        setShowVenuesLink(true);
      }
    } catch (error: any) {
      console.error("Error fetching artist profile:", error);
      toast({
        variant: "destructive",
        title: "Error fetching profile",
        description: error.message
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const genres = e.target.value.split(',').map(g => g.trim());
    setFormData({
      ...formData,
      genre: genres,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // First, check if the profile exists in the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profileData) {
        // If profile doesn't exist, create one
        const { error: insertProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.name || '',
            user_type: 'artist'
          });

        if (insertProfileError) throw insertProfileError;
      }

      if (artistProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('artists')
          .update({
            description: formData.description,
            experience: formData.experience,
            introduction_video_url: formData.introduction_video_url,
            genre: formData.genre,
          })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('artists')
          .insert({
            id: user.id,
            description: formData.description,
            experience: formData.experience,
            introduction_video_url: formData.introduction_video_url,
            genre: formData.genre,
          });

        if (error) throw error;
        setShowVenuesLink(true);
      }

      toast({
        title: "Artist profile updated",
        description: "Your artist profile has been successfully updated."
      });
      
      fetchArtistProfile(); // Refresh the data
    } catch (error: any) {
      console.error("Error updating artist profile:", error);
      toast({
        variant: "destructive",
        title: "Error updating artist profile",
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
            <CardTitle>Artist Information</CardTitle>
            <CardDescription>
              Tell venues and fans about your music and experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Artist Bio</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Share your story as an artist..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <Textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="Describe your musical journey and experience..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Music Genres</Label>
              <Input
                id="genre"
                name="genre"
                value={formData.genre.join(', ')}
                onChange={handleGenreChange}
                placeholder="e.g. Rock, Jazz, Hip-hop (comma separated)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="introduction_video_url">Introduction Video URL</Label>
              <Input
                id="introduction_video_url"
                name="introduction_video_url"
                value={formData.introduction_video_url}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Artist Profile"}
            </Button>
            
            {showVenuesLink && (
              <Button variant="outline" asChild>
                <Link to="/venues">Browse All Venues</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default ArtistProfileForm;
