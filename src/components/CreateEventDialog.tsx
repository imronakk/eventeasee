import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artist: {
    id: string;
    profile: {
      full_name: string;
    };
  };
  venue: {
    id: string;
    name: string;
  };
}

const CreateEventDialog = ({ open, onOpenChange, artist, venue }: CreateEventDialogProps) => {
  const [date, setDate] = useState<Date>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('02:00'); // Default 2 hours
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date || !name || !duration) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert duration string to interval
      const [hours, minutes] = duration.split(':').map(Number);
      const durationInterval = `${hours} hours ${minutes} minutes`;

      const { error } = await supabase
        .from('events')
        .insert({
          venue_id: venue.id,
          artist_id: artist.id,
          event_date: date.toISOString(),
          duration: durationInterval,
          name,
          description,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Event created",
        description: "The event has been successfully created",
      });
      
      onOpenChange(false);
      // Reset form
      setDate(undefined);
      setName('');
      setDescription('');
      setDuration('02:00');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating event",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Event</AlertDialogTitle>
          <AlertDialogDescription>
            Create an event with {artist.profile.full_name} at {venue.name}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter event name"
            />
          </div>

          <div className="grid gap-2">
            <Label>Event Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="border rounded-md"
              initialFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duration (HH:MM)</Label>
            <Input
              id="duration"
              type="time"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              step="900" // 15 minutes steps
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter event description"
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Event"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CreateEventDialog;
