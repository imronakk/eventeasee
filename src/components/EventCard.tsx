
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: {
    id: string;
    name: string;
    description: string | null;
    event_date: string;
    duration: string;
    status: string;
    artist?: {
      profile?: {
        full_name: string;
      };
    };
    venue?: {
      name: string;
    };
  };
}

const EventCard = ({ event }: EventCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              {event.artist?.profile?.full_name && `With ${event.artist.profile.full_name}`}
              {event.venue?.name && ` at ${event.venue.name}`}
            </CardDescription>
          </div>
          <Badge variant={event.status === 'scheduled' ? 'default' : 'secondary'}>
            {event.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Date: {format(new Date(event.event_date), 'PPP')}
          </p>
          <p className="text-sm text-muted-foreground">
            Duration: {event.duration}
          </p>
          {event.description && (
            <p className="text-sm mt-2">{event.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
