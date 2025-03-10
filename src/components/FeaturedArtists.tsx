
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockArtists, mockUsers, getUserById } from '@/utils/mock-data';
import { Artist } from '@/types';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const FeaturedArtists = () => {
  const [hoveredArtist, setHoveredArtist] = useState<string | null>(null);

  const getArtistWithUser = (artist: Artist) => {
    const user = getUserById(artist.userId);
    return { ...artist, user };
  };

  const artistsWithUsers = mockArtists.map(getArtistWithUser);

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Featured Artists
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Discover talented performers ready to create unforgettable experiences
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artistsWithUsers.map((artist, index) => (
            <motion.div
              key={artist.id}
              className="relative overflow-hidden rounded-xl group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              onMouseEnter={() => setHoveredArtist(artist.id)}
              onMouseLeave={() => setHoveredArtist(null)}
            >
              {/* Artist Image */}
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={artist.user?.avatar || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b'}
                  alt={artist.user?.name}
                  className="object-cover w-full h-full transition-all duration-500 
                    group-hover:scale-105"
                />
              </div>

              {/* Overlay with info */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex flex-col justify-end">
                <div className="transform transition-transform duration-300">
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {artist.user?.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {artist.genres.slice(0, 3).map((genre) => (
                      <span 
                        key={genre} 
                        className="text-xs py-1 px-2 bg-primary/20 text-white rounded-full backdrop-blur-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-white/80 line-clamp-2 mb-4">
                    {artist.description}
                  </p>
                  <div className="transform transition-all duration-300 translate-y-0 group-hover:translate-y-0 opacity-100">
                    <Link to={`/artists/${artist.id}`}>
                      <Button 
                        variant="outline" 
                        className="text-white border-white hover:bg-white hover:text-black"
                      >
                        View Profile
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/artists">
              <Button size="lg" variant="outline" className="rounded-full px-8">
                Explore All Artists
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedArtists;
