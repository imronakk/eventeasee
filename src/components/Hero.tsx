
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Music, MapPin, Users } from 'lucide-react';

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const backgrounds = [
    'bg-[url("https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05")]',
    'bg-[url("https://images.unsplash.com/photo-1506744038136-46273834b3fb")]',
    'bg-[url("https://images.unsplash.com/photo-1519389950473-47ba0277781c")]',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Images */}
      {backgrounds.map((bg, index) => (
        <motion.div
          key={bg}
          className={`absolute inset-0 ${bg} bg-cover bg-center`}
          initial={false}
          animate={{ opacity: index === currentIndex ? 1 : 0 }}
          transition={{ duration: 1 }}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-center text-center text-white z-10">
        <motion.div
          className="max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeVariants}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="flex justify-center mb-4">
            <span className="bg-primary/20 backdrop-blur-sm border border-primary/30 text-primary-foreground px-4 py-1 rounded-full text-xs font-medium">
              Connecting creativity with opportunity
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6">
            Where <span className="text-primary">Artists</span> and <span className="text-primary">Venues</span> Create Magic Together
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            EventEase brings together talented artists, premium venues, and passionate audiences to create unforgettable live experiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?role=artist&tab=signup">
              <Button size="lg" className="rounded-full font-medium px-8 group">
                Join as Artist
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/auth?role=venue_owner&tab=signup">
              <Button size="lg" variant="outline" className="rounded-full font-medium px-8 text-black border-white hover:bg-white hover:text-black">
                List Your Venue
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature cards */}
        {/* <motion.div
          className="absolute bottom-8 left-0 right-0 grid grid-cols-1 md:grid-cols-3 gap-4 container mx-auto px-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="backdrop-blur-md bg-black/30 p-6 rounded-xl border border-white/10">
            <div className="rounded-full bg-primary/20 w-12 h-12 flex items-center justify-center mb-4">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">For Artists</h3>
            <p className="text-white/70 text-sm">
              Showcase your talent and connect with venues that match your style and ambitions.
            </p>
          </div>
          
          <div className="backdrop-blur-md bg-black/30 p-6 rounded-xl border border-white/10">
            <div className="rounded-full bg-primary/20 w-12 h-12 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">For Venues</h3>
            <p className="text-white/70 text-sm">
              Find the perfect artists for your space and create memorable events for your audience.
            </p>
          </div>
          
          <div className="backdrop-blur-md bg-black/30 p-6 rounded-xl border border-white/10">
            <div className="rounded-full bg-primary/20 w-12 h-12 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">For Audiences</h3>
            <p className="text-white/70 text-sm">
              Discover and book tickets to amazing performances by talented artists at exceptional venues.
            </p>
          </div>
        </motion.div> */}
      </div>
    </div>
  );
};

export default Hero;
