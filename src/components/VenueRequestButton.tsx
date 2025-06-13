
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VenueRequestButtonProps {
  venueId: string;
  venueName: string;
  hasAlreadyRequested: boolean;
  onRequestSent?: () => void;
}

const VenueRequestButton: React.FC<VenueRequestButtonProps> = ({
  venueId,
  venueName,
  hasAlreadyRequested,
  onRequestSent
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleRequest = async () => {
    if (hasAlreadyRequested) {
      toast({
        title: "Request Already Sent",
        description: `You have already sent a performance request to ${venueName}. Please wait for their response.`,
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send a performance request.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Insert the request into the show_requests table
      const { error } = await supabase
        .from('show_requests')
        .insert({
          artist_id: user.id,
          venue_id: venueId,
          proposed_date: new Date().toISOString(), // Default to current date, can be made configurable
          initiator: 'artist',
          message: `Hello! I'm interested in performing at ${venueName}. Please let me know if you have any available dates.`,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Request Sent",
        description: `Your performance request has been sent to ${venueName}.`,
      });
      
      onRequestSent?.();
    } catch (error: any) {
      console.error('Error sending request:', error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={handleRequest}
      disabled={hasAlreadyRequested}
      variant={hasAlreadyRequested ? "outline" : "default"}
    >
      {hasAlreadyRequested ? "Request Sent" : "Send Request"}
    </Button>
  );
};

export default VenueRequestButton;
