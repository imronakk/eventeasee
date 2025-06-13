
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

  const handleRequest = () => {
    if (hasAlreadyRequested) {
      toast({
        title: "Request Already Sent",
        description: `You have already sent a performance request to ${venueName}. Please wait for their response.`,
        variant: "destructive"
      });
      return;
    }

    // Here you would implement the actual request sending logic
    // For now, just show a success message
    toast({
      title: "Request Sent",
      description: `Your performance request has been sent to ${venueName}.`,
    });
    
    onRequestSent?.();
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
