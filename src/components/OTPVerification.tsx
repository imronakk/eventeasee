import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';

interface OTPVerificationProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

const OTPVerification = ({ email, onBack, onSuccess }: OTPVerificationProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

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

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit verification code.',
      });
      return;
    }

    setIsVerifying(true);

    try {
      console.log('Verifying OTP for email:', email);
      
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      console.log('OTP verification response:', { data, error });

      if (error) throw error;

      // Get user role from the verified user data
      const userRole = data.user?.user_metadata?.user_type as UserRole;
      
      // For venue owners, call onSuccess to show pending verification page
      if (userRole === 'venue_owner') {
        toast({
          title: 'Email verified successfully!',
          description: 'Your account details are now being reviewed.',
        });
        onSuccess();
      } else {
        // For artists and audience, redirect to dashboard
        toast({
          title: 'Email verified successfully!',
          description: 'Redirecting to your dashboard...',
        });
        
        if (userRole) {
          redirectToDashboard(userRole);
        } else {
          // Fallback: call onSuccess if no role found
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: error.message || 'Invalid verification code. Please try again.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);

    try {
      console.log('Resending OTP to:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false
        }
      });

      console.log('Resend OTP response:', { error });

      if (error) throw error;

      toast({
        title: 'Verification code resent',
        description: 'Please check your email for the new verification code.',
      });
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to resend code',
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto p-6 bg-background border rounded-xl shadow-lg"
    >
      <div className="text-center mb-6">
        <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold">Verify Your Email</h1>
        <p className="text-muted-foreground mt-2">
          We've sent a 6-digit verification code to
        </p>
        <p className="font-medium text-primary">{email}</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Enter verification code</label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <Button 
          onClick={handleVerifyOTP} 
          className="w-full" 
          disabled={isVerifying || otp.length !== 6}
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
        </Button>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?
          </p>
          <Button
            variant="ghost"
            onClick={handleResendOTP}
            disabled={isResending}
            className="text-primary hover:text-primary/80"
          >
            {isResending ? 'Resending...' : 'Resend verification code'}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign Up
        </Button>
      </div>
    </motion.div>
  );
};

export default OTPVerification;
