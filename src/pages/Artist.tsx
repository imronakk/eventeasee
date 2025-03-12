
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Calendar, MapPin, Star, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import ChatInterface from '@/components/ChatInterface';

interface ArtistProfile {
  id: string;
  description: string;
  experience: string;
  genre: string[];
  introduction_video_url?: string;
  rating?: number;
  profile: {
    full_name: string;
    avatar_url?: string;
    email: string;
  };
}

interface ShowRequest {
  id: string;
  status: string;
  proposed_date: string;
  venue_id: string;
  venue: {
    name: string;
  };
}

const Artist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [showRequests, setShowRequests] = useState<ShowRequest[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArtistProfile(id);
      fetchShowRequests(id);
      if (user) {
        fetchUserRequests(id);
      }
    }
  }, [id, user]);

  const fetchArtistProfile = async (artistId: string) => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          *,
          profile:profiles(
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('id', artistId)
        .single();

      if (error) throw error;
      setArtist(data);
    } catch (error: any) {
      console.error('Error fetching artist profile:', error);
      toast({
        variant: "destructive",
        title: "Error fetching artist profile",
        description: error.message || "Could not load artist profile information."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchShowRequests = async (artistId: string) => {
    try {
      const { data, error } = await supabase
        .from('show_requests')
        .select(`
          id,
          status,
          proposed_date,
          venue_id,
          venue:venues(
            name
          )
        `)
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShowRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching show requests:', error);
    }
  };

  const fetchUserRequests = async (artistId: string) => {
    if (!user) return;

    try {
      // First, get venue IDs owned by the current user
      const { data: venues, error: venuesError } = await supabase
        .from('venues')
        .select('id')
        .eq('owner_id', user.id);

      if (venuesError) throw venuesError;

      if (!venues || venues.length === 0) {
        return;
      }

      const venueIds = venues.map(venue => venue.id);

      // Then get requests for these venues with this artist
      const { data: requests, error: requestsError } = await supabase
        .from('show_requests')
        .select('*')
        .eq('artist_id', artistId)
        .in('venue_id', venueIds);

      if (requestsError) throw requestsError;

      setUserRequests(requests || []);
    } catch (error: any) {
      console.error('Error fetching user requests:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleOpenChat = (request: any) => {
    setSelectedRequest(request);
    setChatDialogOpen(true);
  };

  // Find accepted requests that the venue owner can chat with
  const acceptedRequests = userRequests.filter(req => req.status === 'accepted');

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-center my-12">
          <div className="animate-pulse flex space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <div className="w-3 h-3 bg-primary rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Artist Not Found</h2>
          <p className="text-muted-foreground mt-2">The artist you're looking for could not be found.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <Button 
        variant="outline" 
        onClick={() => navigate(-1)} 
        className="mb-6"
      >
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Artist Profile Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={artist.profile?.avatar_url} />
                  <AvatarFallback>{getInitials(artist.profile?.full_name || 'Unknown Artist')}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl">{artist.profile?.full_name}</CardTitle>
                  {artist.rating && (
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>{artist.rating}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chat button for venue owners with accepted requests */}
              {user?.role === 'venue_owner' && acceptedRequests.length > 0 && (
                <div className="mt-4">
                  <Button 
                    variant="default"
                    onClick={() => handleOpenChat(acceptedRequests[0])}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" /> Chat with Artist
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">
                  {artist.description || "No description provided."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Experience</h3>
                <p className="text-muted-foreground">
                  {artist.experience || "No experience information provided."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Genres</h3>
                {artist.genre && artist.genre.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {artist.genre.map((genre, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                      >
                        <Music className="inline-block h-3 w-3 mr-1" />
                        {genre}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No genres specified.</p>
                )}
              </div>

              {artist.introduction_video_url && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Introduction Video</h3>
                  <div className="aspect-video rounded-md overflow-hidden bg-muted">
                    <iframe 
                      src={artist.introduction_video_url} 
                      className="w-full h-full" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
                <p className="text-muted-foreground">
                  Email: {artist.profile?.email || "No email provided."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Show Requests Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>
                Previous and upcoming shows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showRequests.length > 0 ? (
                <div className="space-y-4">
                  {showRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="p-3 border rounded-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{request.venue?.name}</p>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(request.proposed_date), 'PPP')}
                          </div>
                        </div>
                        <div>
                          {request.status === 'pending' && (
                            <div className="flex items-center text-yellow-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Pending</span>
                            </div>
                          )}
                          {request.status === 'accepted' && (
                            <div className="flex items-center text-green-500">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              <span>Accepted</span>
                            </div>
                          )}
                          {request.status === 'rejected' && (
                            <div className="flex items-center text-red-500">
                              <span>Declined</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No performance history yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Dialog */}
      <AlertDialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Chat with {artist.profile?.full_name}
            </AlertDialogTitle>
          </AlertDialogHeader>
          {selectedRequest && (
            <div className="h-[500px]">
              <ChatInterface 
                requestId={selectedRequest.id}
                otherUserId={artist.id}
                otherUserName={artist.profile?.full_name}
                otherUserAvatar={artist.profile?.avatar_url}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Artist;
