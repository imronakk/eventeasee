import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Music } from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

interface Artist {
  id: string;
  userName: string;
  description: string;
  experience: number;
  genres: string[];
  userAvatar: string;
}

const Artists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('artists')
      .select(`
        id,
        description,
        experience,
        genre,
        profiles!artists_id_fkey (
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching artists:', error);
      setArtists([]);
    } else if (data) {
      const formatted = data.map((item: any) => ({
        id: item.id,
        userName: item.profiles?.full_name || 'Unknown Artist',
        description: item.description,
        experience: item.experience,
        genres: item.genre || [],
        userAvatar: item.profiles?.avatar_url,
      }));
      setArtists(formatted);
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Featured Artists</h1>

        {loading ? (
          <div className="text-center text-gray-600">Loading artists...</div>
        ) : artists.length === 0 ? (
          <div className="text-center text-gray-600">No artists found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {artists.map((artist) => (
              <Card key={artist.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
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
                    <CardTitle>{artist.userName}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                    {artist.description || 'No description available.'}
                  </p>
                  
                  {artist.experience && (
                    <div className="flex items-center text-xs text-muted-foreground mb-3">
                      <Star className="h-3 w-3 mr-1" />
                      {artist.experience} years experience
                    </div>
                  )}
                  
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium mb-1">Genres:</p>
                      <div className="flex flex-wrap gap-1">
                        {artist.genres.slice(0, 3).map((genre, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                        {artist.genres.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{artist.genres.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Link to={`/artists/${artist.id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Artists;
