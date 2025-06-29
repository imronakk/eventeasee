
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowRight, FileText, Building, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/layouts/MainLayout';
import OTPVerification from '@/components/OTPVerification';
import { UserRole } from '@/types';

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const roleFromUrl = queryParams.get('role') as UserRole | null;
  const tabFromUrl = queryParams.get('tab');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(roleFromUrl || 'audience');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingVenueOwnerData, setPendingVenueOwnerData] = useState<{
    name: string;
    gstin: string;
    pan: string;
  } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const userRole = data.session.user.user_metadata.user_type as UserRole;
          
          // Check verification status for venue owners
          if (userRole === 'venue_owner') {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('verification_status')
              .eq('id', data.session.user.id)
              .single();
              
            if (profileData?.verification_status === 'pending') {
              // Don't sign out here, just show the pending verification page
              setPendingVerification(true);
              return;
            }
            
            // If approved or any other status, proceed to dashboard
            if (profileData?.verification_status === 'approved') {
              redirectToDashboard(userRole);
              return;
            }
          }
          
          redirectToDashboard(userRole);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkSession();
  }, [navigate]);

  const redirectToDashboard = (role: UserRole) => {
    switch (role) {
      case 'artist':
        navigate('/artist-dashboard');
        break;
      case 'venue_owner':
        navigate('/venue-dashboard');
        break;
      case 'audience':
        navigate('/audience-dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();

  if (selectedRole === 'venue_owner' && (!gstin.trim() || !pan.trim())) {
    toast({
      variant: 'destructive',
      title: 'Missing required fields',
      description: 'Please provide both GSTIN and PAN for venue owner registration.',
    });
    return;
  }

  setIsLoading(true);

  try {
    const userData = {
      full_name: name,
      user_type: selectedRole,
      ...(selectedRole === 'venue_owner' && {
        gstin,
        pan,
      }),
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/callback`, // Optional
      },
    });

    if (error) throw error;

    toast({
      title: 'Verify your email',
      description: 'A confirmation link has been sent. Please verify your email before signing in.',
    });

    // Clear form
    setEmail('');
    setPassword('');
    setName('');
    setGstin('');
    setPan('');

  } catch (error: any) {
    console.error('Signup error:', error);
    toast({
      variant: 'destructive',
      title: 'Signup failed',
      description: error.message || 'Something went wrong. Please try again.',
    });
  } finally {
    setIsLoading(false);
  }
};


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userRole = data.user?.user_metadata?.user_type as UserRole;
      
      // For venue owners, check verification status
      if (userRole === 'venue_owner') {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('verification_status')
            .eq('id', data.user.id)
            .maybeSingle();
            
          if (profileError) {
            console.error("Error checking verification status:", profileError);
            // If we can't check status, allow login but log error
          }
          
          // Handle different verification statuses
          if (profileData?.verification_status === 'pending') {
            toast({
              title: 'Account pending verification',
              description: 'Your account is still pending approval. You will be notified via email once approved.',
            });
            
            // Don't sign out, just show pending verification page
            setIsLoading(false);
            setPendingVerification(true);
            return;
          } else if (profileData?.verification_status === 'approved') {
            // Venue owner is approved, proceed to dashboard
            toast({
              title: 'Welcome back!',
              description: 'You have successfully signed in.',
            });
            redirectToDashboard(userRole);
            return;
          }
          // If verification_status is null or any other value, allow login
        } catch (profileError: any) {
          console.error("Error checking verification status:", profileError);
          // If we can't check verification status, allow login
        }
      }
      
      // For non-venue owners or if verification check fails, proceed normally
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
      redirectToDashboard(userRole);
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerificationSuccess = () => {
    setShowOTPVerification(false);
    
    // If it's a venue owner, show the pending verification page
    if (selectedRole === 'venue_owner') {
      setPendingVerification(true);
      toast({
        title: 'Email verified successfully!',
        description: 'Your account is now pending verification. You will be notified via email once approved.',
      });
    } else {
      toast({
        title: 'Email verified successfully!',
        description: 'Your account has been activated. You can now sign in.',
      });
    }
    
    // Reset form
    setEmail('');
    setPassword('');
    setName('');
    setGstin('');
    setPan('');
    setPendingEmail('');
    setPendingVenueOwnerData(null);
  };

  const handleBackToSignUp = () => {
    setShowOTPVerification(false);
    setPendingEmail('');
    setPendingVenueOwnerData(null);
  };

  const handleBackFromPending = async () => {
    // Sign out the venue owner when they click back
    await supabase.auth.signOut();
    setPendingVerification(false);
    setEmail('');
    setPassword('');
    setName('');
    setGstin('');
    setPan('');
    setSelectedRole('audience');
    setPendingVenueOwnerData(null);
  };

  if (showOTPVerification) {
    return (
      <MainLayout>
        <div className="min-h-screen py-20 flex items-center justify-center">
          <OTPVerification
            email={pendingEmail}
            onBack={handleBackToSignUp}
            onSuccess={handleOTPVerificationSuccess}
          />
        </div>
      </MainLayout>
    );
  }

  if (pendingVerification) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md p-8 bg-background border rounded-xl shadow-lg text-center"
          >
            <FileText className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold mb-4">Registration Pending Verification</h2>
            <p className="text-muted-foreground mb-6">
              Your venue owner account is pending verification. Your details will be reviewed soon, and you will be contacted through your email.
            </p>
            <Button 
              onClick={handleBackFromPending}
              className="w-full"
            >
              Back to Sign Up
            </Button>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen py-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md mx-auto p-6 bg-background border rounded-xl shadow-lg"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Welcome to EventEase</h1>
            <p className="text-muted-foreground mt-2">
              Connect with artists and venues to create unforgettable experiences
            </p>
          </div>

          <Tabs defaultValue={tabFromUrl === 'signup' ? 'signup' : 'login'}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {selectedRole === 'venue_owner' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="gstin">GSTIN</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="gstin"
                          type="text"
                          placeholder="GSTIN Number"
                          className="pl-10"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pan">PAN</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pan"
                          type="text"
                          placeholder="PAN Number"
                          className="pl-10"
                          value={pan}
                          onChange={(e) => setPan(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={selectedRole === 'artist' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setSelectedRole('artist')}
                    >
                      Artist
                    </Button>
                    <Button
                      type="button"
                      variant={selectedRole === 'venue_owner' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setSelectedRole('venue_owner')}
                    >
                      Venue Owner
                    </Button>
                    <Button
                      type="button"
                      variant={selectedRole === 'audience' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setSelectedRole('audience')}
                    >
                      Audience
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Auth;
