
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import ArtistProfileForm from '@/components/ArtistProfileForm';
import VenueProfileForm from '@/components/VenueProfileForm';
import AudienceProfileForm from '@/components/AudienceProfileForm';

const Profile = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Complete Your Profile</h1>
      
      {user?.role === 'artist' && <ArtistProfileForm />}
      {user?.role === 'venue_owner' && <VenueProfileForm />}
      {user?.role === 'audience' && <AudienceProfileForm />}
    </div>
  );
};

export default Profile;
