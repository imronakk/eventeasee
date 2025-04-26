
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

interface UpdateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    name: string;
    description: string | null;
    event_date: string;
    duration: string;
    artist: {
      profile?: {
        full_name: string;
      };
    };
    venue?: {
      name: string;
    };
  };
  onUpdate: () => void;
}

const UpdateEventDialog = ({ open, onOpenChange, event, onUpdate }: UpdateEventDialogProps) => {
  const [date, setDate] = useState<Date>(new Date(event.event_date));
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description || '');
  const [duration, setDuration] = useState(event.duration.split(' ')[0].padStart(2, '0') + ':' + 
    (event.duration.split(' ')[2] || '00').padStart(2, '0')); // Convert "2 hours 30 minutes" to "02:30"
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
      const [hours, minutes] = duration.split(':').map(Number);
      const durationInterval = `${hours} hours ${minutes} minutes`;

      const { error } = await supabase
        .from('events')
        .update({
          event_date: date.toISOString(),
          duration: durationInterval,
          name,
          description,
        })
        .eq('id', event.id);

      if (error) throw error;

      toast({
        title: "Event updated",
        description: "The event has been successfully updated",
      });
      
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating event",
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
          <AlertDialogTitle>Update Event</AlertDialogTitle>
          <AlertDialogDescription>
            Update event with {event.artist?.profile?.full_name} at {event.venue?.name}
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
              onSelect={(newDate) => newDate && setDate(newDate)}
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
            {isSubmitting ? "Updating..." : "Update Event"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UpdateEventDialog;
