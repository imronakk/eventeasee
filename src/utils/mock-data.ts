
import { Artist, Event, PerformanceRequest, User, UserRole, Venue } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'david@example.com',
    name: 'David Chen',
    role: 'artist' as UserRole,
    avatar: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b',
    createdAt: new Date('2023-01-15'),
  },
  {
    id: '2',
    email: 'sarah@example.com',
    name: 'Sarah Johnson',
    role: 'venue_owner' as UserRole,
    avatar: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
    createdAt: new Date('2023-01-10'),
  },
  {
    id: '3',
    email: 'mike@example.com',
    name: 'Mike Wilson',
    role: 'audience' as UserRole,
    avatar: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81',
    createdAt: new Date('2023-02-05'),
  },
  {
    id: '4',
    email: 'emma@example.com',
    name: 'Emma Davis',
    role: 'artist' as UserRole,
    avatar: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    createdAt: new Date('2023-01-20'),
  },
  {
    id: '5',
    email: 'john@example.com',
    name: 'John Smith',
    role: 'venue_owner' as UserRole,
    avatar: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c',
    createdAt: new Date('2023-01-05'),
  },
];

// Mock Artists
export const mockArtists: Artist[] = [
  {
    id: '1',
    userId: '1',
    description: 'Versatile musician with a focus on indie and alternative rock. Known for energetic performances and thoughtful lyrics.',
    experience: '10+ years performing in venues across the country',
    introductionVideo: 'https://example.com/video1.mp4',
    genres: ['Rock', 'Indie', 'Alternative'],
    socialLinks: {
      instagram: 'https://instagram.com/davidchen',
      twitter: 'https://twitter.com/davidchen',
      website: 'https://davidchen.com',
      youtube: 'https://youtube.com/davidchen',
    },
    performanceRequirements: 'Standard audio setup, 2 microphones, 1 guitar amp',
  },
  {
    id: '2',
    userId: '4',
    description: 'Classical trained pianist who combines classical elements with modern jazz improvisations.',
    experience: '15 years of classical training, 8 years performing live',
    introductionVideo: 'https://example.com/video2.mp4',
    genres: ['Classical', 'Jazz', 'Fusion'],
    socialLinks: {
      instagram: 'https://instagram.com/emmadavis',
      website: 'https://emmadavis.com',
      youtube: 'https://youtube.com/emmadavis',
    },
    performanceRequirements: 'Grand piano preferred, otherwise high-quality digital piano',
  },
];

// Mock Venues
export const mockVenues: Venue[] = [
  {
    id: '1',
    ownerId: '2',
    name: 'The Blue Note',
    description: 'Intimate jazz club with excellent acoustics and classic ambiance',
    address: '123 Music Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    capacity: 150,
    amenities: ['Professional sound system', 'Stage lighting', 'Bar service', 'Grand piano'],
    images: ['https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05'],
    available: true,
  },
  {
    id: '2',
    ownerId: '5',
    name: 'Soundwave Concert Hall',
    description: 'Modern concert venue with state-of-the-art equipment and ample seating',
    address: '456 Concert Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90001',
    capacity: 500,
    amenities: ['Professional sound system', 'Advanced lighting', 'Green room', 'Backstage area', 'Bar service'],
    images: ['https://images.unsplash.com/photo-1721322800607-8c38375eef04'],
    available: true,
  },
];

// Mock Events
export const mockEvents: Event[] = [
  {
    id: '1',
    venueId: '1',
    title: 'Jazz Night with Emma Davis',
    description: 'Experience an enchanting evening of classical jazz fusion with renowned pianist Emma Davis',
    date: new Date('2023-08-15'),
    startTime: '19:30',
    endTime: '22:00',
    artistIds: ['2'],
    ticketPrice: 45,
    ticketsAvailable: 150,
    ticketsSold: 87,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    status: 'published',
  },
  {
    id: '2',
    venueId: '2',
    title: 'Alternative Rock Showcase',
    description: 'An explosive night featuring David Chen and his band performing their latest tracks',
    date: new Date('2023-08-20'),
    startTime: '20:00',
    endTime: '23:00',
    artistIds: ['1'],
    ticketPrice: 35,
    ticketsAvailable: 500,
    ticketsSold: 215,
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
    status: 'published',
  },
];

// Mock Performance Requests
export const mockPerformanceRequests: PerformanceRequest[] = [
  {
    id: '1',
    artistId: '1',
    venueId: '1',
    requestType: 'artist_to_venue',
    message: 'I would love to perform at your venue. My band has a new album release and we are looking for intimate venues like yours.',
    status: 'pending',
    createdAt: new Date('2023-07-10'),
  },
  {
    id: '2',
    artistId: '2',
    venueId: '2',
    requestType: 'venue_to_artist',
    message: 'We would be honored to host you for a weekend performance at Soundwave. Our audience loves classical fusion.',
    status: 'accepted',
    createdAt: new Date('2023-07-05'),
    responseMessage: 'I would be delighted to perform at your venue.',
    proposedDate: new Date('2023-09-10'),
  },
];

export const getArtistByUserId = (userId: string): Artist | undefined => {
  return mockArtists.find(artist => artist.userId === userId);
};

export const getVenuesByOwnerId = (ownerId: string): Venue[] => {
  return mockVenues.filter(venue => venue.ownerId === ownerId);
};

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getEventsByVenueId = (venueId: string): Event[] => {
  return mockEvents.filter(event => event.venueId === venueId);
};

export const getEventsWithArtist = (artistId: string): Event[] => {
  return mockEvents.filter(event => event.artistIds.includes(artistId));
};
