
export type UserRole = 'artist' | 'venue_owner' | 'audience';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Artist {
  id: string;
  userId: string;
  description: string;
  experience: string;
  introductionVideo?: string;
  genres: string[];
  socialLinks: {
    instagram?: string;
    twitter?: string;
    website?: string;
    youtube?: string;
  };
  performanceRequirements?: string;
}

export interface Venue {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: number;
  amenities: string[];
  images: string[];
  available: boolean;
}

export interface Event {
  id: string;
  venueId: string;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  artistIds: string[];
  ticketPrice: number;
  ticketsAvailable: number;
  ticketsSold: number;
  image?: string;
  status: 'draft' | 'published' | 'canceled' | 'completed';
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  purchaseDate: Date;
  quantity: number;
  totalPrice: number;
  status: 'purchased' | 'canceled' | 'used';
}

export interface PerformanceRequest {
  id: string;
  artistId: string;
  venueId?: string;
  venueOwnerId?: string;
  requestType: 'artist_to_venue' | 'venue_to_artist';
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  responseMessage?: string;
  proposedDate?: Date;
}

export interface ArtistFilters {
  genres?: string[];
  experience?: string;
  searchTerm?: string;
}

export interface VenueFilters {
  city?: string;
  capacity?: {min?: number; max?: number};
  amenities?: string[];
  searchTerm?: string;
}

export interface EventFilters {
  dateRange?: {start?: Date; end?: Date};
  priceRange?: {min?: number; max?: number};
  artists?: string[];
  venues?: string[];
  searchTerm?: string;
}
