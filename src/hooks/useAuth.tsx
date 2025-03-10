
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  profile: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
  } | null;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    profile: null,
  });

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          handleUserChange(data.session.user);
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Session check error:", error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        handleUserChange(session.user);
      } else {
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleUserChange = async (user: any) => {
    try {
      // Get user profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setAuthState({
        user: {
          id: user.id,
          email: user.email || '',
          name: profile.full_name || '',
          role: profile.user_type,
          avatar: profile.avatar_url,
          createdAt: new Date(user.created_at),
        },
        profile: {
          id: profile.id,
          email: user.email || '',
          name: profile.full_name,
          role: profile.user_type,
          avatar: profile.avatar_url,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Still set the user from auth, but without profile data
      setAuthState({
        user: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || '',
          role: (user.user_metadata?.user_type as UserRole) || 'audience',
          createdAt: new Date(user.created_at),
        },
        profile: null,
        isLoading: false,
      });
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message || "Please try again later.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...authState, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
