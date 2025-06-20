
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Artist } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ArtistWithUser {
  id: string;
  description?: string | null;
  experience?: string | null;
  introductionVideo?: string | null;
  genres: string[];
  userName: string;
  userAvatar?: string | null;
}

const Artists = () => {
  const [artists, setArtists] = useState<ArtistWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchArtists = async () => {
      setLoading(true);
      // Fetch artists along with user profile (name and avatar) from profiles table

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
        console.error('Error fetching artists:', error);
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
      setLoading(false);
    };

    fetchArtists();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Registered Artists</h1>

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
                <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                  {artist.description || 'No description available.'}
                </p>
                {artist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {artist.genres.map((genre) => (
                      <span
                        key={genre}
                        className="text-xs font-medium bg-primary/20 text-primary rounded-full px-2 py-1"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4">
                  <Link to={`/artists/${artist.id}`}>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Artists;

