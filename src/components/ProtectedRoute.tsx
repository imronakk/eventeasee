
import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  // Check venue owner verification status
  useEffect(() => {
    const checkVenueOwnerVerification = async () => {
      if (!user || user.role !== 'venue_owner') {
        setIsCheckingVerification(false);
        return;
      }

      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setVerificationStatus(profileData.verification_status);
      } catch (error: any) {
        console.error('Error checking verification status:', error);
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkVenueOwnerVerification();
  }, [user]);

  // Show loading indicator while checking auth state or verification
  if (isLoading || isCheckingVerification) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If venue owner with pending verification, redirect to auth
  if (user.role === 'venue_owner' && verificationStatus === 'pending') {
    return <Navigate to="/auth" replace />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
